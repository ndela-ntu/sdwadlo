"use server";

import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import IProductVariant from "@/models/product-variant";
import ISize from "@/models/size";
import ITag from "@/models/tag";
import { createClient } from "@/utils/supabase/server";
import { size } from "lodash";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const ProductSchema = z.object({
  brand: z.string().min(1, { message: "Brand is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  subcategory: z.string().min(1, { message: "Subcategory is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  price: z
    .number()
    .gt(0, { message: "Price is required and must be greater than 0" }),
  material: z.string().min(1, { message: "Material is required" }),
  tags: z
    .array(z.number())
    .nonempty({ message: "At least one tag is required" }),
});

const VariantSchema = z.object({
  colors: z.array(z.number()).nonempty("At least one color is required"),
  sizeType: z.string().min(1, { message: "Size type is required" }),
});

const AccessorySchema = z.object({
  quantity: z.number().min(0, { message: "Quantity must be >= 0" }),
});

export interface ProductState {
  errors?: {
    type?: string[];
    brand?: string[];
    category?: string[];
    subcategory?: string[];
    name?: string[];
    description?: string[];
    price?: string[];
    material?: string[];
    tags?: string[];
  };
  variantErrors?: {
    type?: string[];
    colors?: string[];
    sizeType?: string[];
    image?: Record<string, string[]> | string[];
    quantity?: Record<string, string[]> | string[];
  };
  message?: string | null;
}

export async function createProduct(
  prevState: ProductState,
  formData: FormData
) {
  const productValidation = ProductSchema.safeParse({
    brand: formData.get("brand")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    subcategory: formData.get("subcategory")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    price: parseFloat(formData.get("price")?.toString() || "0"),
    material: formData.get("material")?.toString() ?? "",
    tags: JSON.parse(formData.get("tags") as string) as number[],
  });

  const type = formData.get("type") as "Clothing" | "Accessory";

  if (type === "Clothing") {
    // 2. Validate Variant Basic Fields (colors & size type)
    const selectedColorIds = JSON.parse(
      (formData.get("selectedColorIds") as string) || "[]"
    ) as number[];
    const sizeType = (formData.get("sizeType") as string) || "";
    const sizes = JSON.parse(formData.get("sizes") as string) as ISize[];

    const variantValidation = VariantSchema.safeParse({
      colors: selectedColorIds,
      sizeType: sizeType,
    });

    // 3. Early Validation for Images and Quantities
    const variantErrors: ProductState["variantErrors"] = {
      image: {},
      quantity: {},
    };

    // Validate at least one image per color
    selectedColorIds.forEach((colorId) => {
      const hasImages = Array.from(formData.keys()).some((key) =>
        key.startsWith(`image_${colorId}_`)
      );
      if (!hasImages) {
        (variantErrors.image! as Record<string, string[]>)[colorId] = [
          "At least one image is required",
        ];
      }
    });

    // Validate quantities based on size type
    if (sizeType === "none") {
      selectedColorIds.forEach((colorId) => {
        const quantity = formData.get(`quantity_${colorId}`) as string;
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
          (variantErrors.quantity! as Record<string, string[]>)[`${colorId}`] =
            ["Quantity must be >= 0"];
        }
      });
    } else {
      selectedColorIds.forEach((colorId) => {
        const sizeKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith(`quantity_${colorId}_`)
        );

        if (sizeKeys.length === 0) {
          (variantErrors.quantity! as Record<string, string[]>)[`${colorId}`] =
            ["Select at least one size"];
        } else {
          sizeKeys.forEach((key) => {
            const quantity = formData.get(key) as string;
            if (
              !quantity ||
              isNaN(parseInt(quantity)) ||
              parseInt(quantity) < 0
            ) {
              (variantErrors.quantity! as Record<string, string[]>)[
                key.replace(`quantity_`, "")
              ] = ["Quantity must be >= 0"];
            }
          });
        }
      });
    }

    const hasImageErrors = variantErrors.image
      ? Object.keys(variantErrors.image).length > 0
      : false;

    const hasQuantityErrors = variantErrors.quantity
      ? Object.keys(variantErrors.quantity).length > 0
      : false;

    // 4. Check ALL validations before proceeding
    const hasVariantErrors =
      !variantValidation.success || hasImageErrors || hasQuantityErrors;

    if (!productValidation.success || hasVariantErrors) {
      return {
        errors: productValidation.success
          ? {}
          : productValidation.error.flatten().fieldErrors,
        variantErrors: {
          ...(!variantValidation.success
            ? variantValidation.error.flatten().fieldErrors
            : {}),
          ...variantErrors,
        },
        message: "Please fix all errors before submitting",
      };
    }

    try {
      const {
        name,
        description,
        brand,
        category,
        price,
        subcategory,
        material,
        tags,
      } = productValidation.data;
      const { colors, sizeType } = variantValidation.data;

      const supabase = await createClient();

      const { data: product, error: productError } = await supabase
        .from("product")
        .insert({
          name,
          description,
          brand_id: parseInt(brand),
          category_id: parseInt(category),
          price,
          subcategory_id: parseInt(subcategory),
          material_id: parseInt(material),
          type,
        })
        .select("id")
        .single();

      if (productError) {
        return <ProductState>{
          errors: {},
          variantErrors: {},
          message: productError.message,
        };
      }

      if (tags.length > 0) {
        const productTags = tags.map((tag) => ({
          product_id: parseInt(product.id),
          tag_id: tag,
        }));

        const { error: tagsError } = await supabase
          .from("product_tag")
          .insert(productTags);

        if (tagsError) {
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: tagsError.message,
          };
        }
      }

      //Saving variant data goes here...
      for (const colorId of colors) {
        const imageKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith(`image_${colorId}`)
        );

        const imageUrls: string[] = [];
        for (const key of imageKeys) {
          const imageFile = formData.get(key) as File;
          try {
            const url = await uploadFileToS3({
              file: imageFile,
              folder: "product_images",
            });
            imageUrls.push(url);
          } catch (error) {
            console.error("Failed to upload image:", error);
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: "Failed to upload product images",
            };
          }
        }

        if (sizeType === "none") {
          const quantityKey = `quantity_${colorId}`;
          const quantity = parseInt(formData.get(quantityKey) as string);

          const { error: variantError } = await supabase
            .from("product_variant")
            .insert({
              product_id: product.id,
              color_id: colorId,
              size_id: null,
              quantity,
              image_urls: imageUrls,
            });

          if (variantError) {
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: variantError.message,
            };
          }
        } else {
          const sizesForType = sizes.filter((size) => size.type === sizeType);

          for (const size of sizesForType) {
            const quantityKey = `quantity_${colorId}_${size.id}`;
            const quantity = parseInt(formData.get(quantityKey) as string);

            const { error: variantError } = await supabase
              .from("product_variant")
              .insert({
                product_id: product.id,
                color_id: colorId,
                size_id: size.id,
                quantity,
                image_urls: imageUrls,
              });

            if (variantError) {
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: variantError.message,
              };
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      return <ProductState>{
        message: "Error in database. Failed to create product.",
        errors: {},
        variantErrors: {},
      };
    }
  } else if (type === "Accessory") {
    // Handle Accessory type
    const quantity = parseInt(formData.get("quantity")?.toString() || "0");

    const accessoryValidation = AccessorySchema.safeParse({
      quantity,
    });

    // Check for image presence
    const imageKeys = Array.from(formData.keys()).filter((key) =>
      key.startsWith("image_")
    );

    const hasImages = imageKeys.length > 0;

    const variantErrors: ProductState["variantErrors"] = {};

    if (!hasImages) {
      variantErrors.image = ["At least one image is required"];
    }

    if (
      !accessoryValidation.success ||
      !productValidation.success ||
      !hasImages
    ) {
      return {
        errors: productValidation.success
          ? {}
          : productValidation.error.flatten().fieldErrors,
        variantErrors: {
          ...(!accessoryValidation.success
            ? {
                quantity:
                  accessoryValidation.error.flatten().fieldErrors.quantity,
              }
            : {}),
          ...variantErrors,
        },
        message: "Please fix all errors before submitting",
      };
    }

    try {
      const {
        name,
        description,
        brand,
        category,
        price,
        subcategory,
        material,
        tags,
      } = productValidation.data;

      const supabase = await createClient();

      const { data: product, error: productError } = await supabase
        .from("product")
        .insert({
          name,
          description,
          brand_id: parseInt(brand),
          category_id: parseInt(category),
          price,
          subcategory_id: parseInt(subcategory),
          material_id: parseInt(material),
          type,
          status: "Listed",
        })
        .select("id")
        .single();

      if (productError) {
        return <ProductState>{
          errors: {},
          variantErrors: {},
          message: productError.message,
        };
      }

      if (tags.length > 0) {
        const productTags = tags.map((tag) => ({
          product_id: parseInt(product.id),
          tag_id: tag,
        }));

        const { error: tagsError } = await supabase
          .from("product_tag")
          .insert(productTags);

        if (tagsError) {
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: tagsError.message,
          };
        }
      }

      // Upload accessory images
      const imageUrls: string[] = [];
      for (const key of imageKeys) {
        const imageFile = formData.get(key) as File;
        try {
          const url = await uploadFileToS3({
            file: imageFile,
            folder: "product_images",
          });
          imageUrls.push(url);
        } catch (error) {
          console.error("Failed to upload image:", error);
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: "Failed to upload product images",
          };
        }
      }

      // Create accessory product variant (no color/size)
      const { error: variantError } = await supabase
        .from("product_variant")
        .insert({
          product_id: product.id,
          color_id: null,
          size_id: null,
          quantity,
          image_urls: imageUrls,
        });

      if (variantError) {
        return <ProductState>{
          errors: {},
          variantErrors: {},
          message: variantError.message,
        };
      }
    } catch (error) {
      console.error(error);
      return <ProductState>{
        message: "Error in database. Failed to create accessory product.",
        errors: {},
        variantErrors: {},
      };
    }
  } else {
    return <ProductState>{
      variantErrors: {
        type: ["No product type specified"],
      },
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function editProduct(prevState: ProductState, formData: FormData) {
  try {
    // 1. Parse and validate product data
    const productData = {
      brand: formData.get("brand")?.toString() ?? "",
      category: formData.get("category")?.toString() ?? "",
      subcategory: formData.get("subcategory")?.toString() ?? "",
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      price: parseFloat(formData.get("price")?.toString() || "0"),
      material: formData.get("material")?.toString() ?? "",
      tags: JSON.parse(formData.get("tags") as string) as number[],
    };

    const productValidation = ProductSchema.safeParse(productData);

    const type = formData.get("type") as "Clothing" | "Accessory";
    const typeChanged = formData.get("typeChanged") === "true";
    const productId = formData.get("productId") as string;
    const removedImageUrls = JSON.parse(
      formData.get("removedImageUrls") as string
    ) as string[];
    const unselectedColorIds = JSON.parse(
      formData.get("unselectedColorIds") as string
    ) as number[];
    const newlySelectedColors = JSON.parse(
      formData.get("newlySelectedColors") as string
    ) as number[];
    const sizeTypeChanged = formData.get("sizeTypeChanged") === "true";

    if (type === "Clothing") {
      // 2. Validate Variant Basic Fields (colors & size type)
      const selectedColorIds = JSON.parse(
        (formData.get("selectedColorIds") as string) || "[]"
      ) as number[];
      const sizeType = (formData.get("sizeType") as string) || "";
      const sizes = JSON.parse(formData.get("sizes") as string) as ISize[];

      const variantValidation = VariantSchema.safeParse({
        colors: selectedColorIds,
        sizeType: sizeType,
      });

      // 3. Early Validation for Images and Quantities
      const variantErrors: ProductState["variantErrors"] = {
        image: {},
        quantity: {},
      };

      // Validate at least one image per color
      selectedColorIds.forEach((colorId) => {
        const hasImages = Array.from(formData.keys()).some((key) =>
          key.startsWith(`image_${colorId}_`)
        );
        if (!hasImages) {
          (variantErrors.image! as Record<string, string[]>)[colorId] = [
            "At least one image is required",
          ];
        }
      });

      // Validate quantities based on size type
      if (sizeType === "none") {
        selectedColorIds.forEach((colorId) => {
          const quantity = formData.get(`quantity_${colorId}`) as string;
          if (
            !quantity ||
            isNaN(parseInt(quantity)) ||
            parseInt(quantity) < 0
          ) {
            (variantErrors.quantity! as Record<string, string[]>)[
              `${colorId}`
            ] = ["Quantity must be >= 0"];
          }
        });
      } else {
        selectedColorIds.forEach((colorId) => {
          const sizeKeys = Array.from(formData.keys()).filter((key) =>
            key.startsWith(`quantity_${colorId}_`)
          );

          if (sizeKeys.length === 0) {
            (variantErrors.quantity! as Record<string, string[]>)[
              `${colorId}`
            ] = ["Select at least one size"];
          } else {
            sizeKeys.forEach((key) => {
              const quantity = formData.get(key) as string;
              if (
                !quantity ||
                isNaN(parseInt(quantity)) ||
                parseInt(quantity) < 0
              ) {
                (variantErrors.quantity! as Record<string, string[]>)[
                  key.replace(`quantity_`, "")
                ] = ["Quantity must be >= 0"];
              }
            });
          }
        });
      }

      const hasImageErrors = variantErrors.image
        ? Object.keys(variantErrors.image).length > 0
        : false;

      const hasQuantityErrors = variantErrors.quantity
        ? Object.keys(variantErrors.quantity).length > 0
        : false;

      // 4. Check ALL validations before proceeding
      const hasVariantErrors =
        !variantValidation.success || hasImageErrors || hasQuantityErrors;

      if (!productValidation.success || hasVariantErrors) {
        return {
          errors: productValidation.success
            ? {}
            : productValidation.error.flatten().fieldErrors,
          variantErrors: {
            ...(!variantValidation.success
              ? variantValidation.error.flatten().fieldErrors
              : {}),
            ...variantErrors,
          },
          message: "Please fix all errors before submitting",
        };
      }

      const {
        name,
        description,
        brand,
        category,
        price,
        subcategory,
        material,
        tags,
      } = productValidation.data;
      const { colors, sizeType: validatedSizeType } = variantValidation.data;

      const supabase = await createClient();

      // Update product basic info
      const { error: productError } = await supabase
        .from("product")
        .update({
          name,
          description,
          brand_id: parseInt(brand),
          category_id: parseInt(category),
          price,
          subcategory_id: parseInt(subcategory),
          material_id: parseInt(material),
          type,
        })
        .eq("id", productId);

      if (productError) {
        console.error("Product update error:", productError);
        return <ProductState>{
          errors: {},
          variantErrors: {},
          message: `Product error: ${productError.message}`,
        };
      }

      // Update product tags
      if (tags.length > 0) {
        const productTags = tags.map((tag) => ({
          product_id: parseInt(productId),
          tag_id: tag,
        }));

        // First delete existing tags
        const { error: deleteTagsError } = await supabase
          .from("product_tag")
          .delete()
          .eq("product_id", productId);

        if (deleteTagsError) {
          console.error("Error deleting old tags:", deleteTagsError);
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `Tags delete error: ${deleteTagsError.message}`,
          };
        }

        // Then insert new ones
        const { error: tagsError } = await supabase
          .from("product_tag")
          .insert(productTags);

        if (tagsError) {
          console.error("Error inserting new tags:", tagsError);
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `Tags insert error: ${tagsError.message}`,
          };
        }
      }

      // Handle size type change
      if (sizeTypeChanged) {
        const { data: variants, error: variantsError } = await supabase
          .from("product_variant")
          .select("*")
          .eq("product_id", productId);

        if (variantsError) {
          console.error(
            "Error fetching variants for size type change:",
            variantsError
          );
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `variants fetch: ${variantsError.message}`,
          };
        }

        const productVariants = variants as IProductVariant[];

        if (productVariants.length > 0) {
          const { error: deleteError } = await supabase
            .from("product_variant")
            .delete()
            .in(
              "id",
              productVariants.map((variant) => variant.id)
            );

          if (deleteError) {
            console.error(
              "Error deleting variants for size type change:",
              deleteError
            );
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `delete variant: ${deleteError.message}`,
            };
          }
        }
      }

      // Handle removed images
      if (removedImageUrls.length > 0) {
        try {
          await Promise.all(
            removedImageUrls.map(async (imageUrl) => {
              await deleteFileFromS3(imageUrl);
            })
          );
        } catch (s3Error) {
          console.error("Error deleting images from S3:", s3Error);
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `Failed to delete some images from S3`,
          };
        }
      }

      // Handle unselected colors
      if (unselectedColorIds.length > 0) {
        const { data: variants, error: variantsError } = await supabase
          .from("product_variant")
          .select("*")
          .eq("product_id", productId)
          .in("color_id", unselectedColorIds);

        if (variantsError) {
          console.error(
            "Error fetching variants for unselected colors:",
            variantsError
          );
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `fetch error1: ${variantsError.message}`,
          };
        }

        const productVariants = variants as IProductVariant[];
        const imageUrls = Array.from(
          new Set(productVariants.flatMap((variant) => variant.image_urls))
        );
        try {
          await Promise.all(
            imageUrls.map(async (url) => await deleteFileFromS3(url))
          );
        } catch (s3Error) {
          console.error(
            "Error deleting images for unselected colors:",
            s3Error
          );
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `Failed to delete images for unselected colors`,
          };
        }

        const { error: deleteError } = await supabase
          .from("product_variant")
          .delete()
          .in(
            "id",
            productVariants.map((variant) => variant.id)
          );

        if (deleteError) {
          console.error(
            "Error deleting variants for unselected colors:",
            deleteError
          );
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `delete error: ${deleteError.message}`,
          };
        }
      }

      // Handle type change
      if (typeChanged) {
        const { data: variants, error: variantsError } = await supabase
          .from("product_variant")
          .select("*")
          .eq("product_id", productId);

        if (variantsError) {
          console.error(
            "Error fetching variants for type change:",
            variantsError
          );
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: `Variants error: ${variantsError.message}`,
          };
        }

        const productVariants = variants as IProductVariant[];

        if (productVariants.length > 0) {
          const imageUrls = Array.from(
            new Set(productVariants.flatMap((variant) => variant.image_urls))
          );

          try {
            await Promise.all(
              imageUrls.map(async (imageUrl) => {
                await deleteFileFromS3(imageUrl);
              })
            );
          } catch (s3Error) {
            console.error("Error deleting images for type change:", s3Error);
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Failed to delete images for type change`,
            };
          }

          const variantIds = productVariants.map((variant) => variant.id);
          const { error: deleteError } = await supabase
            .from("product_variant")
            .delete()
            .in("id", variantIds);

          if (deleteError) {
            console.error(
              "Error deleting variants for type change:",
              deleteError
            );
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Delete error: ${deleteError.message}`,
            };
          }
        }
      }

      // Process each color variant
      for (const colorId of colors) {
        // Get all image keys for this color, excluding removed images
        const imageKeys = Array.from(formData.keys())
          .filter((key) => key.startsWith(`image_${colorId}`))
          .filter((key) => {
            const value = formData.get(key);
            if (typeof value === "string") {
              return !removedImageUrls.includes(value);
            }
            return true; // keep Files
          });

        const imageUrls: string[] = [];
        for (const key of imageKeys) {
          const value = formData.get(key);

          if (typeof value === "string") {
            imageUrls.push(value);
          } else {
            const imageFile = value;
            try {
              if (imageFile) {
                const url = await uploadFileToS3({
                  file: imageFile,
                  folder: "product_images",
                });
                imageUrls.push(url);
              }
            } catch (error) {
              console.error("Failed to upload image:", error);
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: "Failed to upload product images",
              };
            }
          }
        }

        if (validatedSizeType === "none") {
          const quantityKey = `quantity_${colorId}`;
          const quantity = parseInt(formData.get(quantityKey) as string);

          if (newlySelectedColors.includes(colorId) || sizeTypeChanged) {
            const { error: variantError } = await supabase
              .from("product_variant")
              .insert({
                product_id: productId,
                color_id: colorId,
                size_id: null,
                quantity,
                image_urls: imageUrls,
              });

            if (variantError) {
              console.error("Error inserting new variant:", variantError);
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `variant error: ${variantError.message}`,
              };
            }
          } else {
            const { data: variant, error: fetchVariantError } = await supabase
              .from("product_variant")
              .select("id")
              .eq("product_id", productId)
              .eq("color_id", colorId)
              .single();

            if (fetchVariantError) {
              console.error(
                "Error fetching variant for update:",
                fetchVariantError
              );
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `fetch error3: ${fetchVariantError.message}`,
              };
            }

            if (!variant) {
              console.error("Variant not found for update");
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `Variant not found for color ${colorId}`,
              };
            }

            const { error: variantError } = await supabase
              .from("product_variant")
              .update({
                product_id: productId,
                color_id: colorId,
                size_id: null,
                quantity,
                image_urls: imageUrls,
              })
              .eq("id", variant.id);

            if (variantError) {
              console.error("Error updating variant:", variantError);
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `Variant error: ${variantError.message}`,
              };
            }
          }
        } else {
          const sizesForType = sizes.filter(
            (size) => size.type === validatedSizeType
          );

          for (const size of sizesForType) {
            const quantityKey = `quantity_${colorId}_${size.id}`;
            const quantity = parseInt(formData.get(quantityKey) as string);

            if (newlySelectedColors.includes(colorId) || sizeTypeChanged) {
              const { error: variantError } = await supabase
                .from("product_variant")
                .insert({
                  product_id: productId,
                  color_id: colorId,
                  size_id: size.id,
                  quantity,
                  image_urls: imageUrls,
                });

              if (variantError) {
                console.error(
                  "Error inserting new sized variant:",
                  variantError
                );
                return <ProductState>{
                  errors: {},
                  variantErrors: {},
                  message: `variant error: ${variantError.message}`,
                };
              }
            } else {
              const { data: variant, error: fetchVariantError } = await supabase
                .from("product_variant")
                .select("id")
                .eq("product_id", productId)
                .eq("size_id", size.id)
                .eq("color_id", colorId)
                .single();

              if (fetchVariantError) {
                console.error(
                  "Error fetching sized variant:",
                  fetchVariantError
                );
                return <ProductState>{
                  errors: {},
                  variantErrors: {},
                  message: `fetch error1: ${fetchVariantError.message}`,
                };
              }

              if (!variant) {
                console.error("Sized variant not found for update");
                return <ProductState>{
                  errors: {},
                  variantErrors: {},
                  message: `Variant not found for color ${colorId} and size ${size.id}`,
                };
              }

              const { error: variantError } = await supabase
                .from("product_variant")
                .update({
                  product_id: productId,
                  color_id: colorId,
                  size_id: size.id,
                  quantity,
                  image_urls: imageUrls,
                })
                .eq("id", variant.id);

              if (variantError) {
                console.error("Error updating sized variant:", variantError);
                return <ProductState>{
                  errors: {},
                  variantErrors: {},
                  message: `Variant error: ${variantError.message}`,
                };
              }
            }
          }
        }
      }
    } else if (type === "Accessory") {
      // Handle Accessory type
      const quantity = parseInt(formData.get("quantity")?.toString() || "0");

      const accessoryValidation = AccessorySchema.safeParse({
        quantity,
      });

      // Check for image presence
      const imageKeys = Array.from(formData.keys()).filter((key) =>
        key.startsWith("image_")
      );

      const hasImages = imageKeys.length > 0;

      const variantErrors: ProductState["variantErrors"] = {};

      if (!hasImages) {
        variantErrors.image = ["At least one image is required"];
      }

      if (
        !accessoryValidation.success ||
        !productValidation.success ||
        !hasImages
      ) {
        return {
          errors: productValidation.success
            ? {}
            : productValidation.error.flatten().fieldErrors,
          variantErrors: {
            ...(!accessoryValidation.success
              ? {
                  quantity:
                    accessoryValidation.error.flatten().fieldErrors.quantity,
                }
              : {}),
            ...variantErrors,
          },
          message: "Please fix all errors before submitting",
        };
      }

      try {
        const {
          name,
          description,
          brand,
          category,
          price,
          subcategory,
          material,
          tags,
        } = productValidation.data;

        const supabase = await createClient();

        const { error: productError } = await supabase
          .from("product")
          .update({
            name,
            description,
            brand_id: parseInt(brand),
            category_id: parseInt(category),
            price,
            subcategory_id: parseInt(subcategory),
            material_id: parseInt(material),
            type,
          })
          .eq("id", productId);

        if (productError) {
          return <ProductState>{
            errors: {},
            variantErrors: {},
            message: productError.message,
          };
        }

        if (tags.length > 0) {
          const productTags = tags.map((tag) => ({
            product_id: parseInt(productId),
            tag_id: tag,
          }));

          // First delete existing tags
          const { error: deleteTagsError } = await supabase
            .from("product_tag")
            .delete()
            .eq("product_id", productId);

          if (deleteTagsError) {
            console.error("Error deleting old tags:", deleteTagsError);
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Tags delete error: ${deleteTagsError.message}`,
            };
          }

          // Then insert new ones
          const { error: tagsError } = await supabase
            .from("product_tag")
            .insert(productTags);

          if (tagsError) {
            console.error("Error inserting new tags:", tagsError);
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Tags insert error: ${tagsError.message}`,
            };
          }
        }

        // Handle removed images
        if (removedImageUrls.length > 0) {
          try {
            await Promise.all(
              removedImageUrls.map(async (imageUrl) => {
                await deleteFileFromS3(imageUrl);
              })
            );
          } catch (s3Error) {
            console.error("Error deleting images from S3:", s3Error);
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Failed to delete some images from S3`,
            };
          }
        }

        if (typeChanged) {
          const { data: variants, error: variantsError } = await supabase
            .from("product_variant")
            .select("*")
            .eq("product_id", productId);

          if (variantsError) {
            console.error(
              "Error fetching variants for type change:",
              variantsError
            );
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: `Variants error: ${variantsError.message}`,
            };
          }

          const productVariants = variants as IProductVariant[];

          if (productVariants.length > 0) {
            const imageUrls = Array.from(
              new Set(productVariants.flatMap((variant) => variant.image_urls))
            );

            try {
              await Promise.all(
                imageUrls.map(async (imageUrl) => {
                  await deleteFileFromS3(imageUrl);
                })
              );
            } catch (s3Error) {
              console.error("Error deleting images for type change:", s3Error);
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `Failed to delete images for type change`,
              };
            }

            const variantIds = productVariants.map((variant) => variant.id);
            const { error: deleteError } = await supabase
              .from("product_variant")
              .delete()
              .in("id", variantIds);

            if (deleteError) {
              console.error(
                "Error deleting variants for type change:",
                deleteError
              );
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: `Delete error: ${deleteError.message}`,
              };
            }
          }
        }

        const newImageKeys = Array.from(formData.keys())
          .filter((key) => key.startsWith(`image_`))
          .filter((key) => {
            const value = formData.get(key);
            if (typeof value === "string") {
              return !removedImageUrls.includes(value);
            }
            return true;
          });
        // Upload accessory images
        const imageUrls: string[] = [];
        for (const key of newImageKeys) {
          const value = formData.get(key);
          if (typeof value === "string") {
            imageUrls.push(value);
          } else {
            const imageFile = value;
            try {
              if (imageFile) {
                const url = await uploadFileToS3({
                  file: imageFile,
                  folder: "product_images",
                });
                imageUrls.push(url);
              }
            } catch (error) {
              console.error("Failed to upload image:", error);
              return <ProductState>{
                errors: {},
                variantErrors: {},
                message: "Failed to upload product images",
              };
            }
          }
        }

        if (typeChanged) {
          // Create accessory product variant (no color/size)
          const { error: variantError } = await supabase
            .from("product_variant")
            .insert({
              product_id: productId,
              color_id: null,
              size_id: null,
              quantity,
              image_urls: imageUrls,
            });

          if (variantError) {
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: variantError.message,
            };
          }
        } else {
          const { data: variant, error: fetchVariantError } = await supabase
            .from("product_variant")
            .select("id")
            .eq("product_id", productId)
            .single();

          if (fetchVariantError) {
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: fetchVariantError.message,
            };
          }

          const { error: variantError } = await supabase
            .from("product_variant")
            .update({
              product_id: productId,
              color_id: null,
              size_id: null,
              quantity,
              image_urls: imageUrls,
            })
            .eq("id", variant.id);

          if (variantError) {
            return <ProductState>{
              errors: {},
              variantErrors: {},
              message: variantError.message,
            };
          }
        }
      } catch (error) {
        console.error(error);
        return <ProductState>{
          message: "Error in database. Failed to create accessory product.",
          errors: {},
          variantErrors: {},
        };
      }
    } else {
      console.error("Invalid product type:", type);
      return <ProductState>{
        variantErrors: {
          type: ["No product type specified"],
        },
      };
    }
  } catch (error) {
    console.error("Unexpected error in editProduct:", error);
    return <ProductState>{
      message: "An unexpected error occurred. Failed to edit product.",
      errors: {},
      variantErrors: {},
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProduct(id: number) {
  try {
    const supabase = await createClient();

    const { data: variantsData, error: variantsError } = await supabase
      .from("product_variant")
      .select("*")
      .eq("product_id", id);

    if (variantsError) {
      throw new Error(`Failed to fetch variants: ${variantsError.message}`);
    }

    const productVariants = variantsData as IProductVariant[];
    const imageUrls = Array.from(
      new Set(productVariants.flatMap((variant) => variant.image_urls))
    );
    await Promise.all(
      imageUrls.map(async (url) => await deleteFileFromS3(url))
    );

    const { error: deleteVariantError } = await supabase
      .from("product_variant")
      .delete()
      .in(
        "id",
        productVariants.map((variant) => variant.id)
      );

    if (deleteVariantError) {
      throw new Error(
        `Failed to delete variants: ${deleteVariantError.message}`
      );
    }

    const { data: tagsData, error: fetchTagsError } = await supabase
      .from("product_tag")
      .select("*")
      .eq("product_id", id);

    if (fetchTagsError) {
      throw new Error(`Failed to fetch tags: ${fetchTagsError.message}`);
    }

    const tags = tagsData as ITag[];

    const { error: deleteTagsError } = await supabase
      .from("product_tag")
      .delete()
      .in(
        "id",
        tags.map((tag) => tag.id)
      );

    if (deleteTagsError) {
      throw new Error(`Failed to delete tags: ${deleteTagsError.message}`);
    }

    const { error: deleteProductError } = await supabase
      .from("product")
      .delete()
      .eq("id", id);

    if (deleteProductError) {
      throw new Error(
        `Failed to delete product: $${deleteProductError.message}`
      );
    }
  } catch (error) {
    console.error("Error in deleteProduct:", error);
  }

  revalidatePath("/dashboard/brands");
}

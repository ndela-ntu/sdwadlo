"use server";

import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import IProductVariant from "@/models/product-variant";
import ISize from "@/models/size";
import { createClient } from "@/utils/supabase/server";
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

export type ProductState = {
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
    colors?: string[];
    sizeType?: string[];
    image?: Record<string, string[]> | string[];
    quantity?: Record<string, string[]> | string[];
  };
  message?: string | null;
};

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
        return {
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
          return {
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
            return {
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
            return {
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
              return {
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
      return {
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
    console.log(Array.from(formData.keys()));
    const imageKeys = Array.from(formData.keys()).filter((key) =>
      key.startsWith("image_")
    );
    console.log(imageKeys);

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
      console.log(
        accessoryValidation.success,
        productValidation.success,
        hasImages
      );
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
        })
        .select("id")
        .single();

      if (productError) {
        return {
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
          return {
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
          return {
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
        return {
          errors: {},
          variantErrors: {},
          message: variantError.message,
        };
      }
    } catch (error) {
      console.error(error);
      return {
        message: "Error in database. Failed to create accessory product.",
        errors: {},
        variantErrors: {},
      };
    }
  } else {
    return <ProductState>{
      errors: {
        type: ["No product type specified"],
      },
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function editProduct(prevState: ProductState, formData: FormData) {
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
  const typeChanged = formData.get("typeChanged") === "true";
  const productId = formData.get("productId") as string;

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
        return {
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

        const { error: tagsError } = await supabase
          .from("product_tag")
          .update(productTags)
          .eq("product_id", productId);

        if (tagsError) {
          return {
            errors: {},
            variantErrors: {},
            message: tagsError.message,
          };
        }
      }

      //Delete images and variants
      if (typeChanged) {
        const { data: variants, error: variantsError } = await supabase
          .from("product_variant")
          .select("*")
          .eq("product_id", productId);
      
        if (variantsError) {
          return <ProductState>{
            message: variantsError.message,
          };
        }
      
        const productVariants = variants as IProductVariant[];
      
        if (productVariants.length > 0) {
          const imageUrls: string[] = productVariants.flatMap((variant) => variant.image_urls || []);
      
          // Delete images from S3
          await Promise.all(
            imageUrls.map(async (imageUrl) => {
              await deleteFileFromS3(imageUrl);
            })
          );
      
          // Delete product variants from Supabase
          const variantIds = productVariants.map((variant) => variant.id);
          const { error: deleteError } = await supabase
            .from("product_variant")
            .delete()
            .in("id", variantIds);
      
          if (deleteError) {
            return <ProductState>{
              message: deleteError.message,
            };
          }
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
            return {
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
            .update({
              product_id: productId,
              color_id: colorId,
              size_id: null,
              quantity,
              image_urls: imageUrls,
            });

          if (variantError) {
            return {
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
                product_id: productId,
                color_id: colorId,
                size_id: size.id,
                quantity,
                image_urls: imageUrls,
              });

            if (variantError) {
              return {
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
      return {
        message: "Error in database. Failed to create product.",
        errors: {},
        variantErrors: {},
      };
    }
  } else if (type === "Accessory") {
  } else {
    return <ProductState>{
      errors: {
        type: ["No product type specified"],
      },
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

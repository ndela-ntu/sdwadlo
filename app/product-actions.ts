"use server";

import { uploadFileToS3 } from "@/lib/s3-manager";
import ISize from "@/models/size";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { string, z } from "zod";

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

export type ProductState = {
  errors?: {
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
    image?: Record<string, string[]>;
    quantity?: Record<string, string[]>;
  };
  message?: string | null;
};

export async function createProduct(
  prevState: ProductState,
  formData: FormData
) {
  console.log(formData.get("tags"));
  // 1. Validate Product Fields
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
      variantErrors.image![colorId] = ["At least one image is required"];
    }
  });

  // Validate quantities based on size type
  if (sizeType === "none") {
    selectedColorIds.forEach((colorId) => {
      const quantity = formData.get(`quantity_${colorId}`) as string;
      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
        variantErrors.quantity![`${colorId}`] = ["Quantity must be >= 0"];
      }
    });
  } else {
    selectedColorIds.forEach((colorId) => {
      const sizeKeys = Array.from(formData.keys()).filter((key) =>
        key.startsWith(`quantity_${colorId}_`)
      );

      if (sizeKeys.length === 0) {
        variantErrors.quantity![`${colorId}`] = ["Select at least one size"];
      } else {
        sizeKeys.forEach((key) => {
          const quantity = formData.get(key) as string;
          if (
            !quantity ||
            isNaN(parseInt(quantity)) ||
            parseInt(quantity) < 0
          ) {
            variantErrors.quantity![key.replace(`quantity_`, "")] = [
              "Quantity must be >= 0",
            ];
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

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

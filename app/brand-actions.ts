"use server";

import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import { createClient } from "@/utils/supabase/server";
import { TrendingUpDownIcon } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { number, z } from "zod";

const BrandSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: "Brand name must be at least 2 characters" }),
  logo: z
    .instanceof(File)
    .refine((file: File) => file.size !== 0, "Image is required")
    .refine((file: File) => {
      return !file || file.size <= 1024 * 1024 * 5;
    }, "File must be less than 5MB"),
});

export type BrandState = {
  errors?: {
    name?: string[];
    logo?: string[];
  };
  message?: string | null;
  success?: boolean;
  id?: number | null;
};

const CreateBrandSchema = BrandSchema.omit({ id: true });
export async function createBrand(prevState: BrandState, formData: FormData): Promise<BrandState> { 
  const validatedFields = CreateBrandSchema.safeParse({
    name: formData.get("name"),
    logo: formData.get("logo"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create brand.",
      success: false
    };
  }

  const { name, logo } = validatedFields.data;

  try {
    const supabase = await createClient();

    const logo_url = await uploadFileToS3({
      file: logo,
      folder: "brand_logos",
    });

    const { data, error } = await supabase
      .from("brand")
      .insert({ name, logo_url, status: 'Active' })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/brands");
    return { 
      success: true,
      id: data.id,
    };
    
  } catch (error) {
    console.error("Error in createBrand:", error);
    return { 
      message: "Database error. Failed to create brand.",
      success: false 
    };
  }
}

const EditBrandSchema = BrandSchema.omit({ logo: true });
export async function editBrand(prevState: BrandState, formData: FormData) {
  const validatedFields = EditBrandSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });

  const logoFile = formData.get("logo") as File | null;

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create brand.",
    };
  }

  try {
    const supabase = await createClient();

    const { id, name } = validatedFields.data;
    let logoUrl = formData.get("currentLogoUrl") as string;

    if (logoFile && logoFile.size > 0) {
      if (logoUrl) {
        deleteFileFromS3(logoUrl);
      }
      logoUrl = await uploadFileToS3({ file: logoFile, folder: "brand_logos" });
    }

    const { error } = await supabase
      .from("brand")
      .update({
        name,
        logo_url: logoUrl,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update brand: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in editBrand:", error);
    return { errors: {}, message: "Database error. Failed to edit brand." };
  }

  revalidatePath("/dashboard/brands");
  redirect("/dashboard/brands");
}

export async function deleteBrand(id: number) {
  const supabase = await createClient();

  try {
    // 1. First get all products using this brand
    const { data: products, error: productsError } = await supabase
      .from("product")
      .select("id")
      .eq("brand_id", id);

    if (productsError) throw productsError;

    const productIds = products?.map(p => p.id) || [];

    // 2. Delete all variants for these products first
    if (productIds.length > 0) {
      // Delete product variants
      const { error: variantsError } = await supabase
        .from("product_variant")
        .delete()
        .in("product_id", productIds);

      if (variantsError) throw variantsError;

      // Delete product tags
      const { error: tagsError } = await supabase
        .from("product_tag")
        .delete()
        .in("product_id", productIds);

      if (tagsError) throw tagsError;

      // Delete the products themselves
      const { error: productsError } = await supabase
        .from("product")
        .delete()
        .in("id", productIds);

      if (productsError) throw productsError;
    }

    // 3. Get brand to delete its logo
    const { data: brand, error: fetchError } = await supabase
      .from("brand")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // 4. Delete brand logo from storage
    if (brand.logo_url) {
      await deleteFileFromS3(brand.logo_url);
    }

    // 5. Finally delete the brand itself
    const { error: deleteError } = await supabase
      .from("brand")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

  } catch (error) {
    console.error("Error in deleteBrand:", error);
    throw error;
  }

  revalidatePath("/dashboard/brands");
}
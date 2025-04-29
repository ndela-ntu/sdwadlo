// app/actions/s3-actions.ts
"use server";

import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadMedia(file: File, folder = "media") {
  return await uploadFileToS3({ file, folder });
}

export async function deleteMedia(fileUrl: string) {
  return await deleteFileFromS3(fileUrl);
}

export async function updateEntityMedia(
  entityType: "tag" | "brand" | "category",
  id: number,
  currentMediaUrl: string | null,
  newFile: File
) {
  try {
    const supabase = await createClient();
    // Upload new file
    const uploadUrl = await uploadMedia(newFile);

    if (!uploadUrl) {
      throw new Error("Failed to upload file to S3");
    }
    console.log(entityType, uploadUrl, id);
    // Update Supabase
    const { error } = await supabase
      .from(entityType)
      .update({ media_url: uploadUrl })
      .eq("id", id);

    if (error) throw error;

    // Delete old file if exists
    if (currentMediaUrl) {
      await deleteMedia(currentMediaUrl).catch(console.error);
    }
  } catch (error) {
    console.error(`Error updating ${entityType} media:`, error);
    throw error;
  }

  revalidatePath("/dashboard/media");
}

// Add this new function to s3-actions.ts
export async function removeEntityMedia(
  entityType: "tag" | "brand" | "category",
  id: number,
  currentMediaUrl: string
) {
  try {
    const supabase = await createClient();

    // Delete from S3
    await deleteMedia(currentMediaUrl);

    // Update Supabase to remove media_url
    const { error } = await supabase
      .from(entityType)
      .update({ media_url: null })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/media");
    return { success: true };
  } catch (error) {
    console.error(`Error removing ${entityType} media:`, error);
    throw error;
  }
}

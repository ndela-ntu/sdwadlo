"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { removeEntityMedia, updateEntityMedia } from "@/app/media-actions";
import { useMissingMedia } from "@/context/missing-media-context";

interface MediaEntity {
  id: number;
  name: string;
  media_url: string | null;
}

export default function MediaManager({
  tags,
  brands,
  categories,
}: {
  tags: MediaEntity[];
  brands: MediaEntity[];
  categories: MediaEntity[];
}) {
  const { toast } = useToast();
  const { missingMedia, addMissingMedia, removeMissingMedia } =
    useMissingMedia();
  // State for media uploads
  const [mediaStates, setMediaStates] = useState<{
    tags: Record<
      number,
      {
        file: File | null;
        preview: string | null;
        type: "image" | "video" | null;
      }
    >;
    brands: Record<
      number,
      {
        file: File | null;
        preview: string | null;
        type: "image" | "video" | null;
      }
    >;
    categories: Record<
      number,
      {
        file: File | null;
        preview: string | null;
        type: "image" | "video" | null;
      }
    >;
  }>({
    tags: {},
    brands: {},
    categories: {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<{
    tags: Record<number, HTMLInputElement | null>;
    brands: Record<number, HTMLInputElement | null>;
    categories: Record<number, HTMLInputElement | null>;
  }>({ tags: {}, brands: {}, categories: {} });

  const isMissingMedia = (id: number, type: "tag" | "brand" | "category") => {
    return missingMedia.some(
      (item) => item.mediaId === id && item.type === type
    );
  };

  const getMediaType = (url: string | null): "image" | "video" | null => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return "image";
    if (["mp4", "webm", "ogg"].includes(extension || "")) return "video";
    return null;
  };

  const handleMediaChange = (
    e: ChangeEvent<HTMLInputElement>,
    id: number,
    entityType: "tags" | "brands" | "categories"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.includes("video");
    const isImage = file.type.includes("image");

    if (!isVideo && !isImage) {
      alert("Please upload only images or videos");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaStates((prev) => ({
        ...prev,
        [entityType]: {
          ...prev[entityType],
          [id]: {
            file,
            preview: reader.result as string,
            type: isVideo ? "video" : "image",
          },
        },
      }));
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      setMediaStates((prev) => ({
        ...prev,
        [entityType]: {
          ...prev[entityType],
          [id]: {
            file,
            preview: URL.createObjectURL(file),
            type: "video",
          },
        },
      }));
    }
  };

  const removeMedia = (
    id: number,
    entityType: "tags" | "brands" | "categories"
  ) => {
    setMediaStates((prev) => {
      const newState = { ...prev };
      delete newState[entityType][id];
      return newState;
    });
    if (inputRefs.current[entityType][id]) {
      inputRefs.current[entityType][id]!.value = "";
    }
  };

  const handleDeleteMedia = async (
    entityId: number,
    entityType: "tags" | "brands" | "categories",
    currentMediaUrl: string
  ) => {
    try {
      const typeMap = {
        tags: "tag" as const,
        brands: "brand" as const,
        categories: "category" as const,
      };
      const singularType = typeMap[entityType];

      await removeEntityMedia(singularType, entityId, currentMediaUrl);

      // Add to missing media list
      addMissingMedia({
        type: singularType,
        mediaId: entityId,
      });

      toast({
        title: "Success!",
        description: "Media deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error occurred",
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Process tags
      for (const [id, media] of Object.entries(mediaStates.tags)) {
        const tag = tags.find((t) => t.id === Number(id));
        if (tag && media.file) {
          await updateEntityMedia("tag", tag.id, tag.media_url, media.file);
          // Remove from missing media if it was there
          if (isMissingMedia(tag.id, "tag")) {
            removeMissingMedia(tag.id, "tag");
          }
        }
      }

      // Process brands
      for (const [id, media] of Object.entries(mediaStates.brands)) {
        const brand = brands.find((b) => b.id === Number(id));
        if (brand && media.file) {
          await updateEntityMedia(
            "brand",
            brand.id,
            brand.media_url,
            media.file
          );
          // Remove from missing media if it was there
          if (isMissingMedia(brand.id, "brand")) {
            removeMissingMedia(brand.id, "brand");
          }
        }
      }

      // Process categories
      for (const [id, media] of Object.entries(mediaStates.categories)) {
        const category = categories.find((c) => c.id === Number(id));
        if (category && media.file) {
          console.log(category);
          await updateEntityMedia(
            "category",
            category.id,
            category.media_url,
            media.file
          );
          // Remove from missing media if it was there
          if (isMissingMedia(category.id, "category")) {
            removeMissingMedia(category.id, "category");
          }
        }
      }

      toast({
        title: "Success!",
        description: "Media updated successfully!",
      });
      setMediaStates({ tags: {}, brands: {}, categories: {} });
    } catch (error) {
      toast({
        title: "Error occurred",
        description: `Failed to update media. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderMediaSection = (
    entities: MediaEntity[],
    entityType: "tags" | "brands" | "categories",
    title: string
  ) => {
    const typeMap = {
      tags: "tag" as const,
      brands: "brand" as const,
      categories: "category" as const,
    };
    const singularType = typeMap[entityType];

    return (
      <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 bg-white my-6">
        <Header2>{title}</Header2>
        <div className="space-y-6">
          {entities.map((entity) => {
            const initialMediaType = getMediaType(entity.media_url);
            const hasUploadedMedia =
              !!mediaStates[entityType][entity.id]?.preview;
            const isMissing = isMissingMedia(entity.id, singularType);
            const showDelete = initialMediaType && !hasUploadedMedia;
            const showClear = hasUploadedMedia;

            return (
              <div
                key={entity.id}
                className={`flex flex-col space-y-2 p-3 rounded-lg ${
                  isMissing ? "bg-red-50 border border-red-200" : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    {entity.name}
                  </span>
                  {isMissing && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Missing Media
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Media <span className="text-gray-500">(video/image)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        handleMediaChange(e, entity.id, entityType)
                      }
                      ref={(el) => {
                        inputRefs.current[entityType][entity.id] = el;
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-silver file:py-2 file:px-4 file:text-sm file:font-semibold file:text-black hover:file:bg-chestNut hover:file:text-white"
                    />

                    {/* Unified action button */}
                    {showDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeleteMedia(
                            entity.id,
                            entityType,
                            entity.media_url!
                          )
                        }
                        className="h-10 px-3"
                      >
                        Delete
                      </Button>
                    )}
                    {showClear && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMedia(entity.id, entityType)}
                        className="h-10 px-3"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Media preview area */}
                  <div className="mt-2">
                    {showDelete && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-md overflow-hidden border border-gray-200 max-w-xs">
                          {initialMediaType === "image" ? (
                            <img
                              src={entity.media_url!}
                              alt={`${entity.name}`}
                              className="w-full h-auto"
                            />
                          ) : (
                            <video
                              src={entity.media_url!}
                              controls
                              className="w-full h-auto"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {showClear && (
                      <div className="rounded-md overflow-hidden border border-gray-200 max-w-xs">
                        {mediaStates[entityType][entity.id].type === "image" ? (
                          <img
                            src={mediaStates[entityType][entity.id].preview!}
                            alt={`${entity.name} preview`}
                            className="w-full h-auto object-cover"
                          />
                        ) : (
                          <video
                            src={mediaStates[entityType][entity.id].preview!}
                            controls
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ShadowedBox>
      {renderMediaSection(tags, "tags", "Tags")}
      {renderMediaSection(brands, "brands", "Brands")}
      {renderMediaSection(categories, "categories", "Categories")}

      <Button
        className="max-w-fit"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin text-white" />
        ) : (
          "Save"
        )}
      </Button>
    </ShadowedBox>
  );
}

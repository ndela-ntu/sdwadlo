"use client";

import { useState, useRef, ChangeEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-manager";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { updateEntityMedia } from "@/app/media-actions";

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Process tags
      for (const [id, media] of Object.entries(mediaStates.tags)) {
        const tag = tags.find((t) => t.id === Number(id));
        if (tag && media.file) {
          await updateEntityMedia("tag", tag.id, tag.media_url, media.file);
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
        }
      }

      // Process categories
      for (const [id, media] of Object.entries(mediaStates.categories)) {
        const category = categories.find((c) => c.id === Number(id));
        if (category && media.file) {
          await updateEntityMedia(
            "category",
            category.id,
            category.media_url,
            media.file
          );
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
  ) => (
    <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 bg-white my-6">
      <Header2>{title}</Header2>
      <div className="space-y-6">
        {entities.map((entity) => {
          const initialMediaType = getMediaType(entity.media_url);
          const hasUploadedMedia =
            !!mediaStates[entityType][entity.id]?.preview;

          return (
            <div
              key={entity.id}
              className="flex flex-col space-y-2 p-3 rounded-lg bg-gray-50"
            >
              <span className="font-medium text-gray-800">{entity.name}</span>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Media (video/image)
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                      handleMediaChange(e, entity.id, entityType)
                    }
                    ref={(el) => {
                      inputRefs.current[entityType][entity.id] = el;
                    }}
                    className="w-full max-w-xs"
                  />
                  {(hasUploadedMedia || initialMediaType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedia(entity.id, entityType)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                {hasUploadedMedia ? (
                  <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
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
                ) : initialMediaType ? (
                  <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                    {initialMediaType === "image" ? (
                      <img
                        src={entity.media_url!}
                        alt={`${entity.name} preview`}
                        className="w-full h-auto object-cover"
                      />
                    ) : (
                      <video
                        src={entity.media_url!}
                        controls
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </ShadowedBox>
  );
}

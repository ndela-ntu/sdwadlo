"use client";

import ICategory from "@/models/category";
import ShadowedBox from "../shadowed-box";
import ITag from "@/models/tag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header2 from "../header2";
import { useState, useRef, ChangeEvent } from "react";
import { X } from "lucide-react";
import IBrand from "@/models/brand";

export default function Media({
  categories,
  tags,
  brands,
}: {
  categories: ICategory[];
  tags: ITag[];
  brands: IBrand[];
}) {
  // State for media uploads
  const [tagMedia, setTagMedia] = useState<{
    [key: string]: {
      file: File | null;
      preview: string | null;
      type: "image" | "video" | null;
    };
  }>({});

  const [categoryMedia, setCategoryMedia] = useState<{
    [key: string]: {
      file: File | null;
      preview: string | null;
      type: "image" | "video" | null;
    };
  }>({});

  const [brandMedia, setBrandMedia] = useState<{
    [key: string]: {
      file: File | null;
      preview: string | null;
      type: "image" | "video" | null;
    };
  }>({});

  // Refs for file inputs
  const tagInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const categoryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>(
    {}
  );
  const brandInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper function to determine media type from URL
  const getMediaType = (url: string): "image" | "video" | null => {
    if (!url) return null;
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    }
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return 'video';
    }
    return null;
  };

  // Handle media upload for any entity
  const handleMediaChange = (
    e: ChangeEvent<HTMLInputElement>,
    id: string,
    mediaState: any,
    setMediaState: any
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isVideo = file.type.includes("video");
    const isImage = file.type.includes("image");

    if (!isVideo && !isImage) {
      alert("Please upload only images or videos");
      return;
    }

    reader.onloadend = () => {
      setMediaState((prev: any) => ({
        ...prev,
        [id]: {
          file,
          preview: reader.result as string,
          type: isVideo ? "video" : "image",
        },
      }));
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      setMediaState((prev: any) => ({
        ...prev,
        [id]: {
          file,
          preview: URL.createObjectURL(file),
          type: "video",
        },
      }));
    }
  };

  // Remove media for any entity
  const removeMedia = (
    id: string,
    mediaState: any,
    setMediaState: any,
    inputRefs: any
  ) => {
    setMediaState((prev: any) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    if (inputRefs.current[id]) {
      inputRefs.current[id]!.value = "";
    }
  };

  return (
    <ShadowedBox>
      {/* Tags Section */}
      <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 bg-white">
        <Header2>Tags</Header2>
        <div className="space-y-6">
          {tags.map((tag) => {
            const initialMediaType = getMediaType(tag.media_url);
            const hasUploadedMedia = !!tagMedia[tag.id]?.preview;
            
            return (
              <div
                key={tag.id}
                className="flex flex-col space-y-2 p-3 rounded-lg bg-gray-50"
              >
                <span className="font-medium text-gray-800">{tag.name}</span>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Media (video/image)
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        handleMediaChange(e, tag.id.toString(), tagMedia, setTagMedia)
                      }
                      ref={(el) => {
                        tagInputRefs.current[tag.id] = el;
                      }}
                      className="w-full max-w-xs"
                    />
                    {(hasUploadedMedia || initialMediaType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMedia(
                            tag.id.toString(),
                            tagMedia,
                            setTagMedia,
                            tagInputRefs
                          )
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  {/* Show uploaded media if exists, otherwise show initial media */}
                  {hasUploadedMedia ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {tagMedia[tag.id].type === "image" ? (
                        <img
                          src={tagMedia[tag.id].preview!}
                          alt={`${tag.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={tagMedia[tag.id].preview!}
                          controls
                          className="w-full h-auto"
                        />
                      )}
                    </div>
                  ) : initialMediaType ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {initialMediaType === "image" ? (
                        <img
                          src={tag.media_url}
                          alt={`${tag.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={tag.media_url}
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

      {/* Brands Section */}
      <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 bg-white my-6">
        <Header2>Brands</Header2>
        <div className="space-y-6">
          {brands.map((brand) => {
            const initialMediaType = getMediaType(brand.media_url);
            const hasUploadedMedia = !!brandMedia[brand.id]?.preview;
            
            return (
              <div
                key={brand.id}
                className="flex flex-col space-y-2 p-3 rounded-lg bg-gray-50"
              >
                <span className="font-medium text-gray-800">{brand.name}</span>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Media (video/image)
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        handleMediaChange(e, brand.id.toString(), brandMedia, setBrandMedia)
                      }
                      ref={(el) => {
                        brandInputRefs.current[brand.id] = el;
                      }}
                      className="w-full max-w-xs"
                    />
                    {(hasUploadedMedia || initialMediaType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMedia(
                            brand.id.toString(),
                            brandMedia,
                            setBrandMedia,
                            brandInputRefs
                          )
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  {hasUploadedMedia ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {brandMedia[brand.id].type === "image" ? (
                        <img
                          src={brandMedia[brand.id].preview!}
                          alt={`${brand.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={brandMedia[brand.id].preview!}
                          controls
                          className="w-full h-auto"
                        />
                      )}
                    </div>
                  ) : initialMediaType ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {initialMediaType === "image" ? (
                        <img
                          src={brand.media_url}
                          alt={`${brand.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={brand.media_url}
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

      {/* Categories Section */}
      <div className="flex flex-col space-y-4 border border-gray-200 rounded-lg p-6 bg-white my-6">
        <Header2>Categories</Header2>
        <div className="space-y-6">
          {categories.map((category) => {
            const initialMediaType = getMediaType(category.media_url);
            const hasUploadedMedia = !!categoryMedia[category.id]?.preview;
            
            return (
              <div
                key={category.id}
                className="flex flex-col space-y-2 p-3 rounded-lg bg-gray-50"
              >
                <span className="font-medium text-gray-800">{category.name}</span>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Media (video/image)
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) =>
                        handleMediaChange(
                          e,
                          category.id.toString(),
                          categoryMedia,
                          setCategoryMedia
                        )
                      }
                      ref={(el) => {
                        categoryInputRefs.current[category.id] = el;
                      }}
                      className="w-full max-w-xs"
                    />
                    {(hasUploadedMedia || initialMediaType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMedia(
                            category.id.toString(),
                            categoryMedia,
                            setCategoryMedia,
                            categoryInputRefs
                          )
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  {hasUploadedMedia ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {categoryMedia[category.id].type === "image" ? (
                        <img
                          src={categoryMedia[category.id].preview!}
                          alt={`${category.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={categoryMedia[category.id].preview!}
                          controls
                          className="w-full h-auto"
                        />
                      )}
                    </div>
                  ) : initialMediaType ? (
                    <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-w-xs">
                      {initialMediaType === "image" ? (
                        <img
                          src={category.media_url}
                          alt={`${category.name} preview`}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <video
                          src={category.media_url}
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

      <Button
        className="max-w-fit"
        onClick={() => {
          console.log({
            tagMedia,
            categoryMedia,
            brandMedia,
          });
        }}
      >
        Save
      </Button>
    </ShadowedBox>
  );
}
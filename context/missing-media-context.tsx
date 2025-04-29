"use client";

import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type MissingMedia = {
  type: "category" | "brand" | "tag";
  mediaId: number;
};

type MissingMediaContextType = {
  missingMedia: MissingMedia[];
  setMissingMedia: React.Dispatch<React.SetStateAction<MissingMedia[]>>;
  addMissingMedia: (missingMedia: MissingMedia) => void;
  removeMissingMedia: (
    mediaId: number,
    type: "category" | "brand" | "tag"
  ) => void;
};

const MissingMediaContext = createContext<MissingMediaContextType | undefined>(
  undefined
);

export const MissingMediaProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const supabase = createClient();
  const [missingMedia, setMissingMedia] = useState<MissingMedia[]>([]);

  const fetchMissingMedia = async () => {
    try {
      // Fetch all categories, tags, and brands with their media_url
      const { data: categories, error: categoriesError } = await supabase
        .from("category")
        .select("id, media_url");

      const { data: tags, error: tagsError } = await supabase
        .from("tag")
        .select("id, media_url");

      const { data: brands, error: brandsError } = await supabase
        .from("brand")
        .select("id, media_url");

      if (categoriesError || tagsError || brandsError) {
        throw categoriesError || tagsError || brandsError;
      }

      // Initialize missingMedia array
      const newMissingMedia: MissingMedia[] = [];

      // Check categories with null media_url
      categories?.forEach((category) => {
        if (category.media_url === null) {
          newMissingMedia.push({
            type: "category",
            mediaId: category.id,
          });
        }
      });

      // Check tags with null media_url
      tags?.forEach((tag) => {
        if (tag.media_url === null) {
          newMissingMedia.push({
            type: "tag",
            mediaId: tag.id,
          });
        }
      });

      // Check brands with null media_url
      brands?.forEach((brand) => {
        if (brand.media_url === null) {
          newMissingMedia.push({
            type: "brand",
            mediaId: brand.id,
          });
        }
      });

      // Update state with all missing media
      setMissingMedia(newMissingMedia);
    } catch (error: any) {
      toast({
        title: "Error occurred",
        description: `Failed to fetch missing media: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMissingMedia();
  }, []);

  const addMissingMedia = (missingMedia: MissingMedia) => {
    setMissingMedia((prev) => {
      if (!prev.includes(missingMedia)) {
        return [...prev, missingMedia];
      }
      return prev;
    });
  };

  const removeMissingMedia = (
    mediaId: number,
    type: "category" | "brand" | "tag"
  ) => {
    setMissingMedia((prev) =>
      prev.filter((v) => !(v.mediaId === mediaId && v.type === type))
    );
  };

  return (
    <MissingMediaContext.Provider
      value={{
        missingMedia,
        setMissingMedia,
        addMissingMedia,
        removeMissingMedia,
      }}
    >
      {children}
    </MissingMediaContext.Provider>
  );
};

export const useMissingMedia = () => {
  const context = useContext(MissingMediaContext);
  if (!context) {
    throw new Error(
      "useMissingMedia must be used within a MissingMediaProvider"
    );
  }

  return context;
};

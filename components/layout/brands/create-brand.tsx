"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploader from "../image-uploader";
import { useActionState, useEffect, useRef, useState } from "react";
import { SubmitButton } from "../submit-button";
import { BrandState, createBrand } from "@/app/brand-actions";
import { useRouter } from "next/navigation";
import { useMissingMedia } from "@/context/missing-media-context";

export default function CreateBrandForm() {
  const initialState: BrandState = {
    message: null,
    errors: {},
    success: false,
    id: null,
  };
  const [state, formAction, pending] = useActionState(
    createBrand,
    initialState
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { missingMedia, addMissingMedia } = useMissingMedia();

  useEffect(() => {
    if (state.success && state.id) {
      const isMissing = missingMedia.some(
        (item) => item.mediaId === state.id && item.type === "brand"
      );
      if (isMissing) {
        addMissingMedia({ mediaId: state.id, type: "brand" });
      }
      router.push(`/dashboard/brands`);
    }
  }, [state.success, state.message, state.id, router]);

  const handleFileUpload = (file: File) => {
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <form action={formAction}>
      <div className="flex flex-col space-y-2 p-3">
        <Label htmlFor="name">Brand Name</Label>
        <Input
          className="max-w-fit"
          name="name"
          type="text"
          placeholder="Brand Name"
          required
        />
        <div id="name-error" aria-live="polite" aria-atomic="true">
          {state.errors?.name &&
            state.errors.name.map((error: string, i) => (
              <p key={i} className="text-sm text-red-500">
                {error}
              </p>
            ))}
        </div>
      </div>
      <div className="flex flex-col space-y-2 p-3">
        <Label htmlFor="logo">Brand Logo</Label>
        <input
          type="file"
          name="logo"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
        />
        <ImageUploader
          onFileUpload={(file) => {
            if (file) {
              handleFileUpload(file);
            }
          }}
        />
        <div id="logo-error" aria-live="polite" aria-atomic="true">
          {state.errors?.logo &&
            state.errors.logo.map((error: string, i) => (
              <p key={i} className="text-sm text-red-500">
                {error}
              </p>
            ))}
        </div>
      </div>
      {state.message && (
        <p className="px-3 pb-3 text-red-500 text-sm">{state.message}</p>
      )}
      <SubmitButton pending={pending}>Save Brand</SubmitButton>
    </form>
  );
}

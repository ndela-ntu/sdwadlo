"use client";

import { BrandState, editBrand } from "@/app/brand-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IBrand from "@/models/brand";
import { useActionState, useRef } from "react";
import { SubmitButton } from "../submit-button";
import ImageUploader from "../image-uploader";

export default function EditBrandForm({ brand }: { brand: IBrand }) {
  const initialState: BrandState = { message: null, errors: {} };
  const [state, formAction, pending] = useActionState<BrandState, FormData>(
    editBrand,
    initialState
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          defaultValue={brand.name}
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
          type="text"
          className="hidden"
          name="currentLogoUrl"
          defaultValue={brand.logo_url}
        />
        <input
          type="text"
          className="hidden"
          name="id"
          defaultValue={brand.id}
        />
        <input
          type="file"
          name="logo"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
        />
        <ImageUploader
          initialImageSrc={brand.logo_url}
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

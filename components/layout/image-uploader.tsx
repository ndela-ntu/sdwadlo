"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  onFileUpload: (file: File | null) => void;
  initialImageSrc?: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onFileUpload, 
  initialImageSrc = null 
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update image preview if initialImageSrc changes
    setImagePreview(initialImageSrc);
  }, [initialImageSrc]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onFileUpload(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    onFileUpload(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleImageChange}
      />
      {imagePreview ? (
        <div className="relative w-full h-full">
          <img 
            src={imagePreview} 
            alt="Uploaded" 
            className="absolute inset-0 w-full h-full object-cover" 
          />
          <button
            type="button"
            onClick={handleClearImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Upload className="w-10 h-10 mb-2" />
          <span className="text-sm">Upload Image</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
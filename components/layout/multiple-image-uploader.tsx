import { X } from "lucide-react";
import { useRef, useState } from "react";

const MultipleImageUpload = ({
  colorId,
  onImagesChange,
}: {
  colorId: number | undefined;
  onImagesChange: (
    colorId: number | undefined,
    images: { file: File; preview: string }[]
  ) => void;
}) => {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => {
        const newImages = [...prev, ...filesArray];
        onImagesChange(colorId, newImages); // Notify parent component
        return newImages;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      onImagesChange(colorId, newImages); // Notify parent after removal
      return newImages;
    });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="max-w-fit bg-black text-white p-2 rounded"
        >
          Select Images
        </button>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.preview}
                alt={`Preview ${index}`}
                className="h-24 w-24 object-cover rounded-md"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
              <p className="text-xs mt-1 text-center overflow-hidden text-ellipsis whitespace-nowrap w-24">
                {image.file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;

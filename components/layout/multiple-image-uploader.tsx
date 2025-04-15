import { X } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type ClothingType = {
  type: "Clothing";
  colorId: number | undefined;
  initialImageUrls?: string[];
  onImagesChange: (
    colorId: number | undefined,
    images: (string | File)[],
    removedUrls?: string[]
  ) => void;
};

type AccessoryType = {
  type: "Accessory";
  initialImageUrls?: string[];
  onImagesChange: (images: (string | File)[], removedUrls?: string[]) => void;
};

type Props = ClothingType | AccessoryType;

const MultipleImageUpload = (props: Props) => {
  const [images, setImages] = useState<
    { file: File; preview: string; url?: string }[]
  >([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with any provided image URLs
  useEffect(() => {
    if (props.initialImageUrls && props.initialImageUrls.length > 0) {
      const initialImages = props.initialImageUrls.map((url) => ({
        preview: url,
        url,
        file: new File([], url.split("/").pop() || "image.jpg"),
      }));
      setImages(initialImages);
    }
  }, []);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray: { file: File; preview: string; url?: string }[] =
        Array.from(e.target.files).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

      const newImages = [...images, ...filesArray];
      setImages(newImages);

      const callbackImages = newImages.map((image) =>
        image.url ? image.url : image.file
      );

      if (props.type === "Clothing") {
        props.onImagesChange(props.colorId, callbackImages, removedUrls);
      } else {
        props.onImagesChange(callbackImages, removedUrls);
      }
    }
  };
  const removeImage = (index: number) => {
    const newImages = [...images];
    const removedImage = newImages[index];
    newImages.splice(index, 1);

    const newRemovedUrls =
      removedImage.url != null
        ? [...removedUrls, removedImage.url]
        : removedUrls;

    setImages(newImages);
    setRemovedUrls(newRemovedUrls);

    const callbackImages = newImages.map((image) =>
      image.url ? image.url : image.file
    );

    if (props.type === "Clothing") {
      props.onImagesChange(props.colorId, callbackImages, newRemovedUrls);
    } else {
      props.onImagesChange(callbackImages, newRemovedUrls);
    }

    URL.revokeObjectURL(removedImage.preview);
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
          type="button"
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeImage(index);
                }}
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

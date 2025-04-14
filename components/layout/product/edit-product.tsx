"use client";

import { ProductState, editProduct } from "@/app/product-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import IBrand from "@/models/brand";
import ICategory from "@/models/category";
import IColor from "@/models/color";
import IMaterial from "@/models/material";
import IProduct from "@/models/product";
import IProductVariant from "@/models/product-variant";
import ISize from "@/models/size";
import ISubcategory from "@/models/subcategory";
import ITag from "@/models/tag";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { TagsSelector } from "../tags-selector";
import Divider from "../divider";
import MultipleImageUpload from "../multiple-image-uploader";
import setOrAppendFormData from "@/lib/set-form-data";
import isRecordOfStringArrays from "@/lib/is-record";
import { SubmitButton } from "../submit-button";

export default function EditProductForm({
  product,
  variants,
  colors,
  categories,
  sizes,
  materials,
  tags,
  brands,
}: {
  product: IProduct;
  variants: IProductVariant[];
  colors: IColor[];
  categories: ICategory[];
  sizes: ISize[];
  materials: IMaterial[];
  tags: ITag[];
  brands: IBrand[];
}) {
  const supabase = createClient();
  const initialState: ProductState = {
    message: null,
    errors: {},
    variantErrors: {},
  };
  const [state, formAction, pending] = useActionState(
    editProduct,
    initialState
  );

  const [isLoadingSub, setIsLoadingSub] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subError, setSubError] = useState<string | null>(null);

  const [imagesByColor, setImagesByColor] = useState<{
    [key: number]: { file: File; preview: string }[];
  }>({});
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    product.brand.id.toString()
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    product.category.id.toString()
  );
  const [subcategories, setSubcategories] = useState<ISubcategory[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedSizeType, setSelectedSizeType] = useState<string | undefined>(
    sizes?.[0]?.type
  );
  const [selectedTags, setSelectedTags] = useState<ITag[]>(tags);
  const [name, setName] = useState<string>(product.name);
  const [description, setDescription] = useState<string>(product.description);
  const [price, setPrice] = useState<number | "">(product.price);
  const [quantity, setQuantity] = useState<number | "">("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [productType, setProductType] = useState<"Clothing" | "Accessory">(
    product.type
  );
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    product.material.id.toString()
  );
  const [selectedSubcat, setSelectedSubcat] = useState<string>(
    product.subcategory.id.toString()
  );

  useEffect(() => {
    const initVariables = () => {
      try {
        setIsLoading(true);
        const colorIds = Array.from(
          new Set(
            variants.map((v) => v.color?.id).filter((id): id is number => !!id)
          )
        );
        setSelectedColorIds(colorIds);

        if (product.type === "Clothing") {
          if (selectedSizeType === "alpha" || selectedSizeType === "numeric") {
            const q: { [key: string]: number } = {};
            variants.forEach((variant) => {
              const key = `quantity_${variant.color?.id}_${variant.size?.id}`;
              q[key] = variant.quantity;
            });
            setQuantities(q);
          } else {
            const q: { [key: string]: number } = {};
            variants.forEach((variant) => {
              const key = `quantity_${variant.color?.id}`;
              q[key] = variant.quantity;
            });
            setQuantities(q);
          }
        } else {
          const quantity = variants.find(
            (variant) => variant.product.id === product.id
          )?.quantity;
          setQuantity(quantity ?? "");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    initVariables();
  }, [product.id]);

  useEffect(() => {
    if (product?.subcategory?.id) {
      setSelectedSubcat(product.subcategory.id.toString());
    }
  }, [product.subcategory]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategoryId) {
        setIsLoadingSub(true);
        try {
          const { data: subcategories, error } = await supabase
            .from("subcategory")
            .select("*")
            .eq("category_id", parseInt(selectedCategoryId));

          if (error) {
            setSubError(error.message);
          } else {
            setSubcategories(subcategories || []);

            // Reset selection if current selection isn't in new subcategories
            if (selectedSubcat && subcategories) {
              const isValid = subcategories.some(
                (sc) => sc.id.toString() === selectedSubcat
              );
              if (!isValid) setSelectedSubcat("");
            }
            console.log("selectedCategoryId", selectedCategoryId);
            console.log("selectedSubcat", selectedSubcat);
            console.log(
              "fetched subcategories",
              subcategories.map((s) => s.id.toString())
            );
          }
        } catch (error) {
          setSubError("Error fetching subcategories");
        } finally {
          setIsLoadingSub(false);
        }
      }
    };

    fetchSubcategories();
  }, [selectedCategoryId]);

  const handleAccessoryImagesChange = (
    images: { file: File; preview: string }[]
  ) => {
    setImages(images);
  };

  const handleClothingImagesChange = (
    colorId: number | undefined,
    images: { file: File; preview: string }[]
  ) => {
    if (colorId) {
      setImagesByColor((prev) => ({
        ...prev,
        [colorId]: images,
      }));
    }
  };

  if (colors.length === 0) {
    return <div>Add some colors in the inventory</div>;
  }

  if (categories.length === 0) {
    return <div>Add some categories in the inventory</div>;
  }

  if (sizes.length === 0) {
    return <div>Add some sizes in the inventory</div>;
  }

  if (materials.length === 0) {
    return <div>Add some materials in the inventory</div>;
  }

  if (tags.length === 0) {
    return <div>Add some tags in the inventory</div>;
  }

  if (brands.length === 0) {
    return <div>Add some brands in the brands section</div>;
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <form
      className="w-full flex flex-col space-y-2.5"
      action={(formData) => {
        setOrAppendFormData(formData, {
          key: "typeChanged",
          value: (product.type === productType).toString(),
        });

        setOrAppendFormData(formData, {
          key: "removedImageUrls",
          value: JSON.stringify(removedImageUrls),
        });

        setOrAppendFormData(formData, {
          key: "productId",
          value: product.id.toString(),
        });

        setOrAppendFormData(formData, {
          key: "tags",
          value: JSON.stringify(selectedTags.map((tag) => tag.id)),
        });

        if (productType === "Clothing") {
          setOrAppendFormData(formData, { key: "type", value: "Clothing" });

          Object.entries(imagesByColor).forEach(([colorId, images]) => {
            images.forEach((image, index) => {
              setOrAppendFormData(formData, {
                key: `image_${colorId}_${index}`,
                value: image.file,
              });
            });
          });

          setOrAppendFormData(formData, {
            key: "selectedColorIds",
            value: JSON.stringify(selectedColorIds),
          });
          setOrAppendFormData(formData, {
            key: "sizes",
            value: JSON.stringify(sizes),
          });
        } else if (productType === "Accessory") {
          setOrAppendFormData(formData, { key: "type", value: "Accessory" });

          images.forEach((image, index) => {
            setOrAppendFormData(formData, {
              key: `image_${index}`,
              value: image.file,
            });
          });
        }

        formAction(formData);
      }}
    >
      <div className="border border-gray-200 rounded-md max-w-[60%]">
        <div className="flex flex-col space-y-2 p-3">
          <Label htmlFor="category">Product Type</Label>
          <Select
            name="type"
            value={productType}
            onValueChange={(value) => {
              if (value) {
                setProductType(value as "Clothing" | "Accessory");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Product Type</SelectLabel>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Accessory">Accessory</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.type &&
              state.errors.type.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="flex flex-col space-y-2 p-3">
          <Label htmlFor="brand">Brand</Label>
          <div className="flex space-x-2.5 w-full">
            <Select
              name="brand"
              value={selectedBrandId}
              onValueChange={(value) => {
                setSelectedBrandId(value);
              }}
            >
              <SelectTrigger className="">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Brands</SelectLabel>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedBrandId &&
            brands.find((brand) => brand.id === parseInt(selectedBrandId)) ? (
              <Image
                className="aspect-square rounded-lg"
                src={
                  brands.find((brand) => brand.id === parseInt(selectedBrandId))
                    ?.logo_url ?? ""
                }
                alt="Image of brand"
                width={56}
                height={56}
              />
            ) : (
              <Image
                className="aspect-square rounded-lg"
                src="/placeholder-image.svg"
                alt="Placeholder"
                width={56}
                height={56}
              />
            )}
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.brand &&
              state.errors.brand.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="flex flex-col space-y-2 p-3">
          <Label htmlFor="category">Category</Label>
          <Select
            name="category"
            value={selectedCategoryId}
            onValueChange={(value) => {
              setSelectedCategoryId(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.category &&
              state.errors.category.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="flex flex-col space-y-2 p-3">
          <Label htmlFor="subcategory">Subcategory</Label>
          {isLoadingSub ? (
            <Loader2 className="animate-spin" />
          ) : subError ? (
            <div className="text-red-500">{subError}</div>
          ) : (
            <Select
              disabled={selectedCategoryId === undefined}
              name="subcategory"
              value={selectedSubcat}
              onValueChange={setSelectedSubcat}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Subcategories</SelectLabel>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.id.toString()}>
                      {subcat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.subcategory &&
              state.errors.subcategory.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
      </div>
      <div className="flex space-x-2.5 w-full border border-gray-200 rounded-md">
        <div className="flex flex-col space-y-2 p-3 w-full">
          <Label htmlFor="name">Product Name</Label>
          <Input
            name="name"
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
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
        <div className="flex flex-col space-y-2 p-3 w-full">
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            placeholder="Description goes here"
            name="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.description &&
              state.errors.description.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
      </div>
      <div className="flex space-x-2.5 w-full border border-gray-200 rounded-md">
        <div className="flex flex-col space-y-2 p-3 w-full">
          <Label htmlFor="price">Product Price</Label>
          <Input
            name="price"
            type="number"
            placeholder="Product Price"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              setPrice(value === "" ? "" : Number(value));
            }}
          />
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.price &&
              state.errors.price.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="flex flex-col space-y-2 p-3 w-full">
          <Label htmlFor="material">Material</Label>
          <Select
            name="material"
            value={selectedMaterial}
            onValueChange={(value) => {
              setSelectedMaterial(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Materials</SelectLabel>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id.toString()}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.material &&
              state.errors.material.map((error: string, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2 p-3 w-full max-w-[60%]">
        <Label htmlFor="material">Tags</Label>
        <TagsSelector
          selectedTags={selectedTags}
          onTagsChange={(tags) => {
            setSelectedTags(tags);
          }}
          availableTags={tags}
        />
        <div id="name-error" aria-live="polite" aria-atomic="true">
          {state.errors?.tags &&
            state.errors.tags.map((error: string, i) => (
              <p key={i} className="text-sm text-red-500">
                {error}
              </p>
            ))}
        </div>
      </div>
      <Divider margin="10px 0px" />
      {productType ? (
        productType === "Accessory" ? (
          <div className="flex flex-col space-y-1 px-3 py-1">
            <MultipleImageUpload
              type="Accessory"
              onImagesChange={handleAccessoryImagesChange}
              initialImageUrls={getUniqueImageUrls(variants)}
            />
            <div id="name-error" aria-live="polite" aria-atomic="true">
              {Array.isArray(state.variantErrors?.image) &&
                state.variantErrors?.image &&
                state.variantErrors?.image.map((error: string, i) => (
                  <p key={i} className="text-sm text-red-500">
                    {error}
                  </p>
                ))}
            </div>
            <Input
              type="number"
              placeholder="Quantity"
              className="max-w-fit"
              name="quantity"
              value={quantity}
              onChange={(e) => {
                if (e.target.value !== "") {
                  setQuantity(Number(e.target.value));
                }
              }}
            />
            <div id="name-error" aria-live="polite" aria-atomic="true">
              {Array.isArray(state.variantErrors?.quantity) &&
                state.variantErrors?.quantity &&
                state.variantErrors?.quantity.map((error: string, i) => (
                  <p key={i} className="text-sm text-red-500">
                    {error}
                  </p>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <h2 className="text-base italic">Variants</h2>
            <div className="flex flex-col space-y-2 p-3 w-full">
              <Label htmlFor="colors">Select Colors</Label>
              <div className="flex items-center flex-wrap space-x-2.5">
                {colors.map((color) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (selectedColorIds.includes(color.id)) {
                        setSelectedColorIds(
                          selectedColorIds.filter(
                            (colorId) => colorId !== color.id
                          )
                        );
                      } else {
                        setSelectedColorIds((prev) => [...prev, color.id]);
                      }
                    }}
                    key={color.id}
                    className={`text-sm flex items-center space-x-2.5 max-w-fit p-2 rounded-lg ${selectedColorIds.includes(color.id) ? "bg-chestNut text-white" : "bg-silver text-eerieBlack"}`}
                  >
                    <span>{color.name}</span>
                    <div
                      className="rounded-full p-2.5 border border-eerieBlack"
                      style={{ backgroundColor: `${color.hex}` }}
                    />
                  </button>
                ))}
              </div>
              <div id="name-error" aria-live="polite" aria-atomic="true">
                {state.variantErrors?.colors &&
                  state.variantErrors?.colors.map((error: string, i) => (
                    <p key={i} className="text-sm text-red-500">
                      {error}
                    </p>
                  ))}
              </div>
            </div>
            <div className="flex flex-col space-y-2 p-3 w-full">
              <input
                type="text"
                className="hidden"
                name="sizeType"
                defaultValue={selectedSizeType}
              />
              <Label htmlFor="colors">Select Size Type</Label>
              <div className="flex items-center flex-wrap space-x-2.5">
                {[
                  ...Array.from(new Set(sizes.map((size) => size.type))),
                  "none",
                ].map((sizeType, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedSizeType(sizeType);
                    }}
                    className={`text-sm flex items-center space-x-2.5 max-w-fit p-2 rounded-lg ${selectedSizeType === sizeType ? "bg-chestNut text-white" : "bg-silver text-eerieBlack"}`}
                  >
                    {sizeType}
                  </button>
                ))}
              </div>
              <div id="name-error" aria-live="polite" aria-atomic="true">
                {state.variantErrors?.sizeType &&
                  state.variantErrors?.sizeType.map((error: string, i) => (
                    <p key={i} className="text-sm text-red-500">
                      {error}
                    </p>
                  ))}
              </div>
            </div>
            <div className="flex flex-col space-y-2.5 w-full">
              {selectedSizeType === "alpha" &&
                selectedColorIds.map((colorId) => {
                  const color = colors.find((color) => color.id === colorId);

                  return (
                    <div
                      key={colorId}
                      className="flex flex-col space-y-1 px-3 py-1"
                    >
                      <h2 className="font-bold text-sm underline">
                        {color?.name}
                      </h2>
                      <MultipleImageUpload
                        type="Clothing"
                        colorId={color?.id}
                        onImagesChange={handleClothingImagesChange}
                        initialImageUrls={getUniqueImageUrls(
                          variants.filter(
                            (variant) => variant.color?.id === color?.id
                          )
                        )}
                      />
                      <div
                        id="name-error"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {isRecordOfStringArrays(state.variantErrors?.image) &&
                          (
                            state.variantErrors?.image?.[`${color?.id}`] ?? []
                          ).map((error: string, i) => (
                            <p key={i} className="text-sm text-red-500">
                              {error}
                            </p>
                          ))}
                      </div>
                      <div className="flex items-center space-x-2.5">
                        {sizes
                          .filter((size) => size.type === "alpha")
                          .map((size) => (
                            <div key={size.id} className="flex flex-col">
                              <Label>{size.name}</Label>
                              <Input
                                type="number"
                                placeholder="Quantity"
                                className="max-w-fit"
                                name={`quantity_${color?.id}_${size.id}`}
                                value={
                                  quantities[
                                    `quantity_${color?.id}_${size.id}`
                                  ] !== undefined
                                    ? quantities[
                                        `quantity_${color?.id}_${size.id}`
                                      ]
                                    : ""
                                }
                                onChange={(e) => {
                                  const key = `quantity_${color?.id}_${size.id}`;
                                  const value = Number(e.target.value);

                                  setQuantities((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }));
                                }}
                              />
                              <div
                                id="name-error"
                                aria-live="polite"
                                aria-atomic="true"
                              >
                                {isRecordOfStringArrays(
                                  state.variantErrors?.quantity
                                ) &&
                                  (
                                    state.variantErrors?.quantity?.[
                                      `${color?.id}_${size.id}`
                                    ] ?? []
                                  ).map((error: string, i) => (
                                    <p key={i} className="text-sm text-red-500">
                                      {error}
                                    </p>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-col space-y-2.5 w-full">
              {selectedSizeType === "numeric" &&
                selectedColorIds.map((colorId) => {
                  const color = colors.find((color) => color.id === colorId);

                  return (
                    <div
                      key={colorId}
                      className="flex flex-col space-y-1 px-3 py-1"
                    >
                      <h2 className="font-bold text-sm underline">
                        {color?.name}
                      </h2>
                      <MultipleImageUpload
                        type="Clothing"
                        colorId={color?.id}
                        onImagesChange={handleClothingImagesChange}
                        initialImageUrls={getUniqueImageUrls(
                          variants.filter(
                            (variant) => variant.color?.id === color?.id
                          )
                        )}
                      />
                      <div
                        id="name-error"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {isRecordOfStringArrays(state.variantErrors?.image) &&
                          (
                            state.variantErrors?.image?.[`${color?.id}`] ?? []
                          ).map((error: string, i) => (
                            <p key={i} className="text-sm text-red-500">
                              {error}
                            </p>
                          ))}
                      </div>
                      <div className="flex items-center space-x-2.5">
                        {sizes
                          .filter((size) => size.type === "numeric")
                          .map((size) => (
                            <div key={size.id} className="flex flex-col">
                              <Label>{size.name}</Label>
                              <Input
                                type="number"
                                placeholder="Quantity"
                                className="max-w-fit"
                                name={`quantity_${color?.id}_${size.id}`}
                                value={
                                  quantities[
                                    `quantity_${color?.id}_${size.id}`
                                  ] !== undefined
                                    ? quantities[
                                        `quantity_${color?.id}_${size.id}`
                                      ]
                                    : ""
                                }
                                onChange={(e) => {
                                  const key = `quantity_${color?.id}_${size.id}`;
                                  const value = Number(e.target.value);

                                  setQuantities((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }));
                                }}
                              />
                              <div
                                id="name-error"
                                aria-live="polite"
                                aria-atomic="true"
                              >
                                {isRecordOfStringArrays(
                                  state.variantErrors?.quantity
                                ) &&
                                  (
                                    state.variantErrors?.quantity?.[
                                      `${color?.id}_${size.id}`
                                    ] ?? []
                                  ).map((error: string, i) => (
                                    <p key={i} className="text-sm text-red-500">
                                      {error}
                                    </p>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="flex flex-col space-y-2.5 w-full">
              {selectedSizeType === "none" &&
                selectedColorIds.map((colorId) => {
                  const color = colors.find((color) => color.id === colorId);

                  return (
                    <div
                      key={colorId}
                      className="flex flex-col space-y-1 px-3 py-1"
                    >
                      <h2 className="font-bold text-sm underline">
                        {color?.name}
                      </h2>
                      <MultipleImageUpload
                        type="Clothing"
                        colorId={color?.id}
                        onImagesChange={handleClothingImagesChange}
                        initialImageUrls={getUniqueImageUrls(
                          variants.filter(
                            (variant) => variant.color?.id === color?.id
                          )
                        )}
                      />
                      <div
                        id="name-error"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {isRecordOfStringArrays(state.variantErrors?.image) &&
                          (
                            state.variantErrors?.image?.[`${color?.id}`] ?? []
                          ).map((error: string, i) => (
                            <p key={i} className="text-sm text-red-500">
                              {error}
                            </p>
                          ))}
                      </div>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="max-w-fit"
                        name={`quantity_${color?.id}`}
                        value={
                          quantities[`quantity_${color?.id}`] !== undefined
                            ? quantities[`quantity_${color?.id}`]
                            : ""
                        }
                        onChange={(e) => {
                          const key = `quantity_${color?.id}`;
                          const value = Number(e.target.value);

                          setQuantities((prev) => ({
                            ...prev,
                            [key]: value,
                          }));
                        }}
                      />
                      <div
                        id="name-error"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {isRecordOfStringArrays(
                          state.variantErrors?.quantity
                        ) &&
                          (
                            state.variantErrors?.quantity?.[`${color?.id}`] ??
                            []
                          ).map((error: string, i) => (
                            <p key={i} className="text-sm text-red-500">
                              {error}
                            </p>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )
      ) : (
        <div></div>
      )}
      {state.message && (
        <p className="px-3 pb-3 text-red-500 text-sm">{state.message}</p>
      )}
      <SubmitButton pending={pending} className="max-w-fit">
        Save Product
      </SubmitButton>
    </form>
  );
}

function getUniqueImageUrls(variants: IProductVariant[]): string[] {
  const allImageUrls = variants.flatMap((variant) => variant.image_urls);
  return Array.from(new Set(allImageUrls));
}

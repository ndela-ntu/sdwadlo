"use client";

import IBrand from "@/models/brand";
import ICategory from "@/models/category";
import IColor from "@/models/color";
import IMaterial from "@/models/material";
import IProduct from "@/models/product";
import ISize from "@/models/size";
import ITag from "@/models/tag";

export default function EditProductForm({
  product,
  colors,
  categories,
  sizes,
  materials,
  tags,
  brands,
}: {
  product: IProduct;
  colors: IColor[];
  categories: ICategory[];
  sizes: ISize[];
  materials: IMaterial[];
  tags: ITag[];
  brands: IBrand[];
}) {
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

  return <form></form>;
}

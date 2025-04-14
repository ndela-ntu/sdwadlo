import Header2 from "@/components/layout/header2";
import EditProductForm from "@/components/layout/product/edit-product";
import ShadowedBox from "@/components/layout/shadowed-box";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Hammer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function (props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const params = await props.params;
  const id = params.id;

  const { data: product, error: productError } = await supabase
    .from("product")
    .select(`*, brand(*), category(*), subcategory(*), material(*)`)
    .eq("id", parseInt(id))
    .single();

  if (!product) {
    notFound();
  }

  const { data: variants, error: variantsError } = await supabase
    .from("product_variant")
    .select(`*, product(*), size(*), color(*)`)
    .eq("product_id", parseInt(id));

  const { data: colors, error: colorsError } = await supabase
    .from("color")
    .select("*");

  const { data: categories, error: categoriesError } = await supabase
    .from("category")
    .select("*");

  const { data: sizes, error: sizesError } = await supabase
    .from("size")
    .select("*");

  const { data: materials, error: materialsError } = await supabase
    .from("material")
    .select("*");

  const { data: tags, error: tagsError } = await supabase
    .from("tag")
    .select("*");

  const { data: brands, error: brandsError } = await supabase
    .from("brand")
    .select("*");

  if (
    productError ||
    colorsError ||
    categoriesError ||
    sizesError ||
    materialsError ||
    tagsError ||
    brandsError ||
    variantsError
  ) {
    return (
      <div>{`An error occurred: ${colorsError?.message || categoriesError?.message || sizesError?.message || materialsError?.message || tagsError?.message || brandsError?.message || productError?.message || variantsError?.message}`}</div>
    );
  }

  return (
    <ShadowedBox>
      <div className="flex justify-between">
        <div className="flex space-x-2.5 items-center">
          <Link href={`/dashboard/products`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Header2>Edit Product</Header2>
        </div>
        <Link
          href={{
            pathname: "/dashboard/products/inventory",
            query: { ref: "edit-product" },
          }}
        >
          <span className="p-2.5 bg-eerieBlack rounded-xl flex space-x-2.5 max-w-fit">
            <span className="text-white">Inventory</span>
            <Hammer className="text-white w-5 h-5" />
          </span>
        </Link>
      </div>
      <EditProductForm
        product={product}
        variants={variants}
        colors={colors}
        categories={categories}
        sizes={sizes}
        materials={materials}
        tags={tags}
        brands={brands}
      />
    </ShadowedBox>
  );
}

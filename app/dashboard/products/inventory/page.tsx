import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import Categories from "@/components/layout/inventory/categories";
import ColorPicker from "@/components/layout/inventory/color-picker";
import Materials from "@/components/layout/inventory/materials";
import SizesTool from "@/components/layout/inventory/sizes";
import Tags from "@/components/layout/inventory/tags";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();

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

  if (colorsError || categoriesError || sizesError || materialsError || tagsError) {
    return (
      <div>{`An error occurred: ${colorsError?.message || categoriesError?.message || sizesError?.message || materialsError?.message || tagsError?.message}`}</div>
    );
  }

  return (
    <div>
      <Header1>Inventory</Header1>
      <Divider />
      <div className="grid grid-cols-2 gap-5">
        <ColorPicker colors={colors} />
        <Categories categories={categories} />
        <SizesTool sizes={sizes} />
        <Materials materials={materials} />
        <Tags tags={tags} />
      </div>
    </div>
  );
}

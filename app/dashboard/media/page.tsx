import Header1 from "@/components/layout/header1";
import MediaManager from "@/components/layout/media-manager/media";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: categories, error: categoriesError } = await supabase
    .from("category")
    .select("*");

  const { data: tags, error: tagsError } = await supabase
    .from("tag")
    .select("*");

  const { data: brands, error: brandsError } = await supabase
    .from("brand")
    .select("*");

  if (categoriesError || tagsError || brandsError) {
    return (
      <div>{`An error occurred: ${categoriesError?.message || tagsError?.message || brandsError?.message}`}</div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <Header1>User Interface</Header1>
      <MediaManager categories={categories} tags={tags} brands={brands} />
    </div>
  );
}

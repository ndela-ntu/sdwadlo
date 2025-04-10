import EditBrandForm from "@/components/layout/brands/edit-brand";
import Header2 from "@/components/layout/header2";
import ShadowedBox from "@/components/layout/shadowed-box";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const params = await props.params;
  const id = params.id;
  
  const { data: brand, error } = await supabase
    .from("brand")
    .select("*")
    .eq("id", parseInt(id))
    .single();

  if (!brand) {
    notFound();
  }

  return (
    <ShadowedBox>
      <Header2>Create Brand</Header2>
      <EditBrandForm brand={brand} />
    </ShadowedBox>
  );
}

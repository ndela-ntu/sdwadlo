import BrandsTable from "@/components/layout/brands/brands-table";
import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data: brands, error } = await supabase.from("brand").select("*");

  if (error) {
    return <div>{`An error occurred: ${error.message}`}</div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <Header1>Brands</Header1>
      <Link
        href={`/dashboard/brands/create-brand`}
        className="max-w-fit bg-black text-white rounded-md px-2.5 py-2 flex space-x-2"
      >
        <Plus /> New brand
      </Link>
      <Divider />
      <BrandsTable brands={brands} />
    </div>
  );
}

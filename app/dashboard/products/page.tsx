import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import ProductTable from "@/components/layout/product/product-table";
import { createClient } from "@/utils/supabase/server";
import { Hammer, Plus } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data: variants, error: variantsError } = await supabase
    .from("product_variant")
    .select(`*, product(*, brand(*), category(*), subcategory(*), material(*)), size(*), color(*)`);

  if (variantsError) {
    <div>{`An error occurred: ${variantsError?.message}`}</div>;
  }
  

  return (
    <div className="flex flex-col space-y-2">
      <Header1>Products</Header1>
      <div className="flex space-x-2">
        <Link href={`/dashboard/products/create-product`}>
          <span className="p-2.5 bg-eerieBlack rounded-xl flex space-x-2.5 max-w-fit">
            <span className="text-white">Add Product</span>
            <Plus className="text-white w-5 h-5" />
          </span>
        </Link>
        <Link
          href={{
            pathname: "/dashboard/products/inventory",
            query: { ref: "products" },
          }}
        >
          <span className="p-2.5 bg-eerieBlack rounded-xl flex space-x-2.5 max-w-fit">
            <span className="text-white">Inventory</span>
            <Hammer className="text-white w-5 h-5" />
          </span>
        </Link>
      </div>
      <Divider />
      <ProductTable variants={variants ?? []} />
    </div>
  );
}

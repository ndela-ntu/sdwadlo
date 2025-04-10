import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import StockTable from "@/components/layout/stocks/stock-table";
import { createClient } from "@/utils/supabase/server";
import { Settings } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data: variants, error: variantsError } = await supabase
    .from("product_variant")
    .select(`*, product(*, brand (*)), size(*), color(*)`);

  if (variantsError) {
    <div>{`An error occurred: ${variantsError?.message}`}</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <Header1>Stocks</Header1>
        <Link
          href="/dashboard/stocks/settings"
          className="text-white bg-chestNut rounded-full p-2.5"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
      <Divider />
      <StockTable />
    </div>
  );
}

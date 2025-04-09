import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import ShadowedBox from "@/components/layout/shadowed-box";
import StockSettings from "@/components/layout/stocks/stock-settings";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data: stockSettings, error } = await supabase
    .from("stock_setting")
    .select(`*`)
    .single();

  if (error) {
    return <div>{`An error occurred: ${error.message}`}</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex space-x-2.5 items-center">
        <Link href="/dashboard/stocks/settings">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Header1>Stock Settings</Header1>
      </div>
      <Divider />
      <ShadowedBox>
        <StockSettings stockSettings={stockSettings} />
      </ShadowedBox>
    </div>
  );
}

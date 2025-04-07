import Header1 from "@/components/layout/header1";
import ShadowedBox from "@/components/layout/shadowed-box";
import StockSettings from "@/components/layout/stocks/stock-settings";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: stockSettings, error } = await supabase
    .from("stock_setting")
    .select(`*`).single();

  if (error) {
    return <div>{`An error occurred: ${error.message}`}</div>;
  }

  return (
    <div className="flex flex-col">
      <Header1>Stock Settings</Header1>
      <ShadowedBox>
        <StockSettings stockSettings={stockSettings} />
      </ShadowedBox>
    </div>
  );
}

import Header1 from "@/components/layout/header1";
import Order from "@/components/layout/orders/order";
import OrderManager from "@/components/layout/orders/order-manager";
import ShadowedBox from "@/components/layout/shadowed-box";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("checkout_detail")
    .select("*");

  if (error) {
    return (
      <div className="text-red-500 flex items-center justify-center">{`An error occurred: ${error.message}`}</div>
    );
  }

  return (
    <ShadowedBox>
      <Header1>Orders</Header1>
      <OrderManager allOrders={orders} />
    </ShadowedBox>
  );
}

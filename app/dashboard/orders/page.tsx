import Header1 from "@/components/layout/header1";
import Order from "@/components/layout/orders/order";
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
      <div className="grid grid-cols-2 gap-5 mt-5">
        {orders.map((order) => (
          <Order key={order.id} initialOrder={order} />
        ))}
      </div>
    </ShadowedBox>
  );
}

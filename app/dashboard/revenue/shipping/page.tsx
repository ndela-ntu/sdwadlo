import Header2 from "@/components/layout/header2";
import ShippingSettings from "@/components/layout/revenue/shipping-settings";
import ShadowedBox from "@/components/layout/shadowed-box";

export default async function Page() {
  return (
    <ShadowedBox>
      <div className="flex flex-col w-full">
        <Header2>Shipping</Header2>
        <ShippingSettings />
      </div>
    </ShadowedBox>
  );
}

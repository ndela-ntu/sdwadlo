import CreateBrandForm from "@/components/layout/brands/create-brand";
import Header2 from "@/components/layout/header2";
import ShadowedBox from "@/components/layout/shadowed-box";

export default function Page() {
  return (
    <ShadowedBox>
      <Header2>Create Brand</Header2>
      <CreateBrandForm />
    </ShadowedBox>
  );
}

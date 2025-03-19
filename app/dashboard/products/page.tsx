import Divider from "@/components/layout/divider";
import Header1 from "@/components/layout/header1";
import { Hammer } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Header1>Products</Header1>
        <Link href="/dashboard/products/inventory">
          <span className="p-2.5 bg-black rounded-xl flex space-x-2.5 max-w-fit">
            <span className="text-white">Inventory</span>
            <Hammer className="text-white w-5 h-5" />
          </span>
        </Link>
      </div>
      <Divider />
    </div>
  );
}

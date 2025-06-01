"use client";

import { usePendingOrders } from "@/context/pending-orders-context";
import { useToast } from "@/hooks/use-toast";
import ICheckoutDetail from "@/models/checkout_detail";
import IProductVariant from "@/models/product-variant";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Order({
  initialOrder,
}: {
  initialOrder: ICheckoutDetail;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [order, setOrder] = useState<ICheckoutDetail>(initialOrder);
  const [variants, setVariants] = useState<IProductVariant[]>([]);
  const { pendingOrders, removePendingOrder } = usePendingOrders();

  useEffect(() => {
    console.log(pendingOrders);
  }, [pendingOrders]);

  const handleStatusChange = async (status: "APPROVE" | "DECLINE") => {
    const { data: updatedOrder, error } = await supabase
      .from("checkout_detail")
      .update({ status: status === "APPROVE" ? "APPROVED" : "DECLINED" })
      .eq("id", order.id)
      .select("*")
      .single();

    if (error) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      removePendingOrder(order.id);
      setOrder(updatedOrder);
      toast({
        title: "Order status updated",
        description: `Marked as ${status === "APPROVE" ? "APPROVED" : "DECLINED"}`,
      });
    }
  };

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const variantPromises = order.items.map(async (item) => {
          const { data: variant, error } = await supabase
            .from("product_variant")
            .select(`*, product(*), size(*), color(*)`)
            .eq("id", item.id)
            .single();

          if (error) throw error;
          if (!variant) throw new Error("Variant not found");

          return variant;
        });

        const variants = await Promise.all(variantPromises);
        setVariants(variants);
      } catch (error: any) {
        toast({
          title: "Error occurred",
          description: `Failed to fetch variants: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    fetchVariants();
  }, []);

  return (
    <div className="relative w-full border-2 border-eerieBlack p-6 rounded-xl space-y-6 max-h-fit">
      {/* Order ID Tag */}
      <div className="absolute -top-3 -left-3 bg-chestNut text-white text-sm px-3 py-1 rounded-md shadow-md">
        Order ID: {order.id}
      </div>

      {/* Contact Details */}
      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-chestNut">Contact Details</h2>
        <p className="text-base text-eerieBlack">
          {order.firstName} {order.lastName}
        </p>
        <div className="flex justify-between text-sm text-gray-700">
          <span>{order.email}</span>
          <span>{order.phoneNumber}</span>
        </div>
      </section>

      {/* Shipping Details */}
      <section className="space-y-1">
        <h2 className="text-xl font-semibold text-chestNut">
          Shipping Details
        </h2>
        <p className="text-base text-eerieBlack">
          {order.streetAddress}, {order.town}, {order.province},{" "}
          {order.postalCode}
        </p>
      </section>

      {/* Order Summary */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-chestNut">Order Summary</h2>
        <div className="flex flex-wrap gap-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="w-[220px] border border-eerieBlack rounded-lg overflow-hidden p-3 flex flex-col space-y-2 shadow-sm"
            >
              <h3 className="text-sm font-semibold truncate">
                {variant.product.name}
              </h3>
              <div className="relative w-full h-[200px] rounded-md overflow-hidden">
                <Image
                  src={variant.image_urls[0]}
                  alt="Product"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                {variant.color && <span>{variant.color.name}</span>}
                {variant.color && variant.size && <span>•</span>}
                {variant.size && <span>{variant.size.name}</span>}
                <span>•</span>
                <span className="bg-chestNut text-white px-3 py-1 rounded-full text-xs">
                  x
                  {order.items.find((item) => item.id === variant.id)
                    ?.quantity ?? 1}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-right text-lg font-semibold text-eerieBlack">
          Total: R{order.total}
        </div>
      </section>
      <span className="font-semibold">Status: {order.status}</span>
      {order.status === "PENDING" && (
        <div className="flex items-center space-x-5 w-full justify-between">
          <button
            onClick={async () => {
              handleStatusChange("APPROVE");
            }}
            className="w-full bg-chestNut text-white rounded-md px-3 py-1"
          >
            Approve
          </button>
          <button
            onClick={async () => {
              handleStatusChange("DECLINE");
            }}
            className="w-full border-4 border-chestNut bg-white text-chestNut rounded-md px-3 py-1"
          >
            Decline
          </button>
        </div>
      )}
      {order.status === "APPROVED" && (
        <button
          onClick={async () => {
            handleStatusChange("DECLINE");
          }}
          className="w-full bg-chestNut text-white rounded-md px-3 py-1"
        >
          Disapprove
        </button>
      )}
      {order.status === "DECLINED" && (
        <button
          onClick={async () => {
            handleStatusChange("APPROVE");
          }}
          className="w-full bg-chestNut text-white rounded-md px-3 py-1"
        >
          Approve
        </button>
      )}
    </div>
  );
}

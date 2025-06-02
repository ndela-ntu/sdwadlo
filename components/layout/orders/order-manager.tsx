"use client";

import ICheckoutDetail from "@/models/checkout_detail";
import Order from "./order";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function OrderManager({
  allOrders,
}: {
  allOrders: ICheckoutDetail[];
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ICheckoutDetail[]>(allOrders);
  const [viewingFor, setViewingFor] = useState<
    "All" | "Pending" | "Approved" | "Declined" | undefined
  >("All");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchId, setSearchId] = useState<string>("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchId.trim().length > 0) {
        setViewingFor(undefined);
        setLoading(true);

        try {
          const { data: order, error } = await supabase
            .from("checkout_detail")
            .select("*")
            .eq("id", Number(searchId))
            .single();

          if (error) {
            if (error.code === "PGRST116") {
              setOrders([]);
              return;
            }
            throw error;
          }

          setOrders([order]);
        } catch (error: any) {
          toast({
            title: "Error occurred",
            description: `An error has occurred: ${error.message}`,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setViewingFor("All");
        const { data: allOrders, error } = await supabase
          .from("checkout_detail")
          .select("*");

        if (error) {
          toast({
            title: "Error occurred",
            description: `An error has occurred: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        setOrders(allOrders);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchId]);

  const handleOnViewChange = async (
    viewType: "All" | "Pending" | "Approved" | "Declined"
  ) => {
    setViewingFor(viewType);
    try {
      setLoading(true);
      switch (viewType) {
        case "All":
          {
            const { data: allOrders, error } = await supabase
              .from("checkout_detail")
              .select("*");

            if (error) throw error;

            setOrders(allOrders);
          }
          break;
        case "Approved":
          {
            const { data: approvedOrders, error } = await supabase
              .from("checkout_detail")
              .select("*")
              .eq("status", "APPROVED");

            if (error) throw error;

            setOrders(approvedOrders);
          }
          break;
        case "Pending":
          {
            const { data: pendingOrders, error } = await supabase
              .from("checkout_detail")
              .select("*")
              .eq("status", "PENDING");

            if (error) throw error;

            setOrders(pendingOrders);
          }
          break;
        case "Declined":
          {
            const { data: declinedOrders, error } = await supabase
              .from("checkout_detail")
              .select("*")
              .eq("status", "DECLINED");

            if (error) throw error;

            setOrders(declinedOrders);
          }
          break;
        default:
          {
            setOrders(allOrders);
          }
          break;
      }
    } catch (error: any) {
      toast({
        title: "Error occurred",
        description: `An error has occurred: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2.5 mt-5">
      <div className="flex flex-wrap items-center space-x-2.5 mb-5">
        <div className="flex items-center space-x-2.5">
          <span className="">Order ID: </span>
          <Input
            onChange={(event) => {
              setSearchId(event.target.value);
            }}
            placeholder="Search using order id..."
            type="number"
          />
        </div>
        <button
          onClick={() => {
            handleOnViewChange("All");
          }}
          className={`${viewingFor === "All" ? "bg-chestNut text-white" : "bg-transparent border-2 border-chestNut"}  px-3 py-1 rounded-lg`}
        >
          All
        </button>
        <button
          onClick={() => {
            handleOnViewChange("Pending");
          }}
          className={`${viewingFor === "Pending" ? "bg-chestNut text-white" : "bg-transparent border-2 border-chestNut"} px-3 py-1 rounded-lg`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            handleOnViewChange("Approved");
          }}
          className={`${viewingFor === "Approved" ? "bg-chestNut text-white" : "bg-transparent border-2 border-chestNut"} px-3 py-1 rounded-lg`}
        >
          Approved
        </button>
        <button
          onClick={() => {
            handleOnViewChange("Declined");
          }}
          className={`${viewingFor === "Declined" ? "bg-chestNut text-white" : "bg-transparent border-2 border-chestNut"} px-3 py-1 rounded-lg`}
        >
          Declined
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 mt-5">
          {orders.map((order) => (
            <Order key={order.id} initialOrder={order} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          No orders found
        </div>
      )}
    </div>
  );
}

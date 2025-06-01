"use client";

import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

export type PendingOrder = {
  orderId: number;
};

type PendingOrdersContextType = {
  pendingOrders: PendingOrder[];
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingOrder[]>>;
  addPendingOrder: (orderId: number) => void;
  removePendingOrder: (orderId: number) => void;
};

const PendingOrderContext = createContext<PendingOrdersContextType | undefined>(
  undefined
);

export const PendingOrdersProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { toast } = useToast();
  const supabase = createClient();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      const { data: pendingOrders, error: ordersError } = await supabase
        .from("checkout_detail")
        .select("id")
        .eq("status", "PENDING");

      if (ordersError) {
        toast({
          title: "Error occurred",
          description: `Failed to fetch stock settings: ${ordersError.message}`,
          variant: "destructive",
        });
        return;
      }

      setPendingOrders(pendingOrders.map((order) => ({ orderId: order.id })));
    };

    fetchPendingOrders();
  }, []);

  const addPendingOrder = (orderId: number) => {
    setPendingOrders((prev) => {
      if (prev.some(order => order.orderId === orderId)) return prev;
      return [...prev, { orderId }];
    });
  };

  const removePendingOrder = (orderId: number) => {
    console.log('removing pending order')
    setPendingOrders((prev) =>
      prev.filter((order) => order.orderId !== orderId)
    );
  };

  return (
    <PendingOrderContext.Provider
      value={{
        pendingOrders, setPendingOrders, addPendingOrder, removePendingOrder
    }}
    >
      {children}
    </PendingOrderContext.Provider>
  );
};

export const usePendingOrders = () => {
    const context = useContext(PendingOrderContext);
    if (!context) {
        throw new Error('usePendingOrders must be within a Provider')
    }

    return context;
}

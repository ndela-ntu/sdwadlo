"use client";

import { useToast } from "@/hooks/use-toast";
import IStockSettings from "@/models/stock-settings";
import { createClient } from "@/utils/supabase/client";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type LowStockVariant = {
  variantId: number;
  quantity: number;
};

type LowStockContextType = {
  lowStockVariants: LowStockVariant[];
  setLowStockVariants: React.Dispatch<React.SetStateAction<LowStockVariant[]>>;
  addLowStockVariant: (variant: LowStockVariant) => void;
  removeLowStockVariant: (variantId: number) => void;
};

const LowStockContext = createContext<LowStockContextType | undefined>(
  undefined
);

export const LowStockProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const supabase = createClient();
  const [lowStockVariants, setLowStockVariants] = useState<LowStockVariant[]>(
    []
  );
  const [lowStockCounter, setLowStockCounter] = useState<number>();

  const fetchLowStockCounter = async () => {
    const { data: stockSettings, error } = await supabase
      .from("stock_setting")
      .select(`*`)
      .single();

    if (error) {
      toast({
        title: "Error occurred",
        description: `Failed to fetch stock settings`,
        variant: "destructive",
      });
    }

    if (stockSettings) {
      const settings = stockSettings as IStockSettings;
      setLowStockCounter(settings.low_stock_counter);
    }
  };

  useEffect(() => {
    fetchLowStockCounter();
  }, [])

  const addLowStockVariant = (variant: LowStockVariant) => {
    setLowStockVariants((prev) => {
      if (variant.quantity <= (lowStockCounter ?? 2)) {
        if (prev.find((v) => v.variantId === variant.variantId)) return prev;

        return [...prev, variant];
      }else {
        return prev;
      }
    
    });
  };

  const removeLowStockVariant = (variantId: number) => {
    setLowStockVariants((prev) =>
      prev.filter((v) => v.variantId !== variantId)
    );
  };

  return (
    <LowStockContext.Provider
      value={{
        lowStockVariants,
        setLowStockVariants,
        addLowStockVariant,
        removeLowStockVariant,
      }}
    >
      {children}
    </LowStockContext.Provider>
  );
};

export const useLowStock = () => {
  const context = useContext(LowStockContext);
  if (!context) {
    throw new Error("useLowStock must be used within a LowStockProvider");
  }

  return context;
};

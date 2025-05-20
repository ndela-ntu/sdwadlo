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

  useEffect(() => {
    const fetchLowStockData = async () => {
      const { data: stockSettings, error: settingsError } = await supabase
        .from("stock_setting")
        .select("*")
        .single();

      if (settingsError) {
        toast({
          title: "Error occurred",
          description: `Failed to fetch stock settings: ${settingsError.message}`,
          variant: "destructive",
        });
        return;
      }

      const settings = stockSettings as IStockSettings;
      const counter = settings.low_stock_counter;
      setLowStockCounter(counter);

      const { data: variants, error: variantsError } = await supabase
        .from("product_variant")
        .select("id, quantity");

      if (variantsError) {
        toast({
          title: "Error occurred",
          description: `Failed to fetch product variants: ${variantsError.message}`,
          variant: "destructive",
        });
        return;
      }

      const lowStock = variants
        .filter((variant) => variant.quantity <= (counter ?? 2))
        .map((variant) => ({
          variantId: variant.id,
          quantity: variant.quantity,
        }));

      setLowStockVariants(lowStock);
    };

    fetchLowStockData();
  }, []);

  const addLowStockVariant = (variant: LowStockVariant) => {
    setLowStockVariants((prev) => {
      if (variant.quantity <= (lowStockCounter ?? 2)) {
        if (prev.find((v) => v.variantId === variant.variantId)) return prev;

        return [...prev, variant];
      } else {
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

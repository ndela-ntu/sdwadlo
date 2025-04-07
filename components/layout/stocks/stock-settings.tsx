"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLowStock } from "@/context/low-stock-contex";
import { useToast } from "@/hooks/use-toast";
import IStockSettings from "@/models/stock-settings";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function StockSettings({
  stockSettings,
}: {
  stockSettings: IStockSettings;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const { setLowStockVariants } = useLowStock();
  const [notificationValue, setNotificationValue] = useState<number | "">(
    stockSettings.low_stock_counter
  );

  const saveSettings = async () => {
    const { error: stockSettingsError } = await supabase
      .from("stock_setting")
      .update({ low_stock_counter: notificationValue })
      .eq("id", 1);

    const { data: variants, error: variantsError } = await supabase
      .from("product_variant")
      .select(`id, quantity`);

    if (stockSettingsError || variantsError) {
      if (stockSettingsError) {
        toast({
          title: "Error occurred",
          description: "Failed to update stock settings",
          variant: "destructive",
        });
      }

      if (variantsError) {
        toast({
          title: "Error occurred",
          description: "Failed to fetch variants",
          variant: "destructive",
        });
      }
    } else {
      if (notificationValue !== "") {
        const newVariants = variants
          .filter((variant) => variant.quantity <= notificationValue)
          .map((variant) => ({
            variantId: variant.id,
            quantity: variant.quantity,
          }));

        setLowStockVariants(newVariants);

        toast({
          title: "Success",
          description: "Successfully updated stock settings",
          variant: "default",
        });
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2.5">
      <div className="flex flex-row space-x-2.5 items-center">
        <span className="">Notify when stocks reach:</span>
        <Input
          className="w-[100px]"
          type="number"
          value={notificationValue}
          onChange={(e) => {
            if (e.target.value !== "") {
              setNotificationValue(Number(e.target.value));
            } else {
              setNotificationValue("");
            }
          }}
        />
      </div>
      <Button
        className="max-w-fit"
        onClick={async () => {
          if (notificationValue !== "") {
            await saveSettings();
          } else {
            toast({
              title: "Invalid value entered",
              description:
                "Please enter a valid number for notification count before updating.",
              variant: "destructive",
            });
          }
        }}
        type="button"
      >
        Save Changes
      </Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import IShippingByProvince from "@/models/shipping-by-province";
import { createClient } from "@/utils/supabase/client";
import { Check, Edit, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ShippingSettings() {
  const supabase = createClient();
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [freeShipmentAmount, setFreeShipmentAmount] = useState<
    number | undefined
  >(undefined);
  const [shippingByProvince, setShippingByProvince] = useState<
    IShippingByProvince[]
  >([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<{ amount: number } | undefined>(
    undefined
  );
  const [editingShipmentAmount, setEditingShipmentAmount] =
    useState<boolean>(false);

  const startEditing = (byProvince: IShippingByProvince) => {
    setEditingId(byProvince.id);
    setEditAmount({ amount: byProvince.cost || 0 });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount({ amount: 0 });
  };

  const handleUpdateShippingAmount = async () => {
    if (freeShipmentAmount !== undefined) {
      try {
        setIsSaving(true);
        const { error } = await supabase
          .from("shipping_setting")
          .update({ free_shipment_amount: freeShipmentAmount })
          .eq("id", 1);

        if (error) throw error;

        setEditingShipmentAmount(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUpdateCost = async (id: number) => {
    if (editAmount !== undefined) {
      try {
        setIsSaving(true);
        const { error } = await supabase
          .from("shipping_by_province")
          .update({ cost: editAmount.amount })
          .eq("id", id)
          .select("*");

        if (error) throw error;

        setShippingByProvince(
          shippingByProvince.map((shipment) =>
            shipment.id === id
              ? { ...shipment, cost: editAmount.amount }
              : shipment
          )
        );

        setEditingId(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    const fetchShipmentData = async () => {
      try {
        setIsFetching(true);

        const { data: amountData, error: shipmentAmountError } = await supabase
          .from("shipping_setting")
          .select("free_shipment_amount")
          .single();

        if (shipmentAmountError || !amountData) {
          throw shipmentAmountError || new Error("No shipping settings found");
        }

        setFreeShipmentAmount(amountData.free_shipment_amount);

        const { data: shippingByProvince, error: byProvinceError } =
          await supabase.from("shipping_by_province").select("*");

        if (byProvinceError) throw byProvinceError;

        setShippingByProvince(shippingByProvince);
      } catch (error: any) {
        toast({
          title: "Error occurred",
          description: `An error occurred: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchShipmentData();
  }, []);

  return (
    <div className="flex flex-col p-5 w-full space-y-4">
      {isFetching || isSaving ? (
        <div className="p-2.5">
          <Loader2 className="text-black animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2.5">
            <p>Free shipping on orders over: </p>
            {editingShipmentAmount ? (
              <Input
                className="w-[15%]"
                type="number"
                onChange={(event) => {
                  const value = event.target.value;
                  setFreeShipmentAmount(
                    value === "" ? undefined : Number(value)
                  );
                }}
                value={freeShipmentAmount}
              />
            ) : (
              <span className="w-[15%] p-2.5 rounded-lg bg-chestNut text-white">
                R{freeShipmentAmount}
              </span>
            )}
            <div className="flex items-center space-x-1">
              {editingShipmentAmount ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateShippingAmount()}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingShipmentAmount(false)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingShipmentAmount(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="border-b border-black" />
          <div className="flex flex-col space-y-2">
            {shippingByProvince.map((provinceValue) => (
              <div
                key={provinceValue.id}
                className="flex space-x-2.5 items-center"
              >
                <span className="w-[10%] font-bold">
                  {provinceValue.province}
                </span>
                {editingId === provinceValue.id ? (
                  <Input
                    className="w-[15%]"
                    type="number"
                    value={editAmount?.amount ?? ""}
                    onChange={(event) => {
                      if (event.target.value === "") {
                        setEditAmount(undefined);
                      } else {
                        const newCost = Number(event.target.value);
                        if (!isNaN(newCost)) {
                          setEditAmount({ amount: newCost });
                        }
                      }
                    }}
                  />
                ) : (
                  <span className="w-[15%] p-2.5 rounded-lg bg-chestNut text-white">
                    R{provinceValue.cost}
                  </span>
                )}
                <div className="flex space-x-1 items-center">
                  {editingId === provinceValue.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateCost(provinceValue.id)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(provinceValue)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

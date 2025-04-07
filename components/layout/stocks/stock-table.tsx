"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useLowStock } from "@/context/low-stock-contex";
import { useToast } from "@/hooks/use-toast";
import IProductVariant from "@/models/product-variant";
import IStockSettings from "@/models/stock-settings";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function StockTable() {
  const supabase = createClient();
  const [variants, setVariants] = useState<IProductVariant[]>([]);
  const { lowStockVariants, addLowStockVariant, removeLowStockVariant } =
    useLowStock();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [lowStockCounter, setLowStockCounter] = useState<number>();

  // Tracks which variant is being edited and the new quantity
  const [editingStockAtId, setEditingStockAtId] = useState<{
    [key: number]: string;
  }>({});

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

  const fetchVariants = async () => {
    setLoading(true);
    const { data: variants, error: variantsError } = await supabase
      .from("product_variant")
      .select(`*, product(*, brand(*)), size(*), color(*)`)
      .order("id", { ascending: true });

    if (variantsError) {
      toast({
        title: "Error occurred",
        description: `Failed to fetch variants`,
        variant: "destructive",
      });
    } else {
      setVariants(variants);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLowStockCounter();
    fetchVariants();
  }, []);

  const updateVariantQuantity = async (variantId: number, quantity: number) => {
    const { error } = await supabase
      .from("product_variant")
      .update({ quantity })
      .eq("id", variantId);

    if (error) {
      toast({
        title: "Error occurred",
        description: `Failed to update quantity for variant: ${variantId}`,
        variant: "destructive",
      });
    } else {
      await fetchVariants();

      if (
        quantity > (lowStockCounter ?? 2) &&
        lowStockVariants.some((variant) => variant.variantId === variantId)
      ) {
        removeLowStockVariant(variantId);
      } else {
        addLowStockVariant({ variantId, quantity });
      }

      toast({
        title: "Stock updated",
        description: `Updated quantity to ${quantity}`,
      });
    }
  };

  const handleEdit = (variantId: number, currentQuantity: number) => {
    setEditingStockAtId((prev) => ({
      ...prev,
      [variantId]: currentQuantity.toString(),
    }));
  };

  const handleUpdate = async (variantId: number) => {
    const value = editingStockAtId[variantId];
    const newQuantity = Number(value);

    if (!value || isNaN(newQuantity)) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid number before updating.",
        variant: "destructive",
      });

      return;
    }

    await updateVariantQuantity(variantId, newQuantity);

    // After updating, stop editing this row
    setEditingStockAtId((prev) => {
      const updated = { ...prev };
      delete updated[variantId];
      return updated;
    });
  };

  return (
    <Table className="table-fixed hover:text-black">
      <TableCaption>A list of low stock products</TableCaption>
      <TableHeader>
        {loading ? (
          <TableRow>
            <TableHead>Please wait...</TableHead>
          </TableRow>
        ) : (
          <TableRow>
            <TableHead className="w-[7.5%]">Image</TableHead>
            <TableHead className="w-[15%]">Brand</TableHead>
            <TableHead className="w-[25%]">Name</TableHead>
            <TableHead className="w-[150px]">Stock Count</TableHead>
            <TableHead className="w-[200px]">Functions</TableHead>
          </TableRow>
        )}
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow className="flex items-center justify-center">
            <TableCell>
              <Loader2 className="animate-spin w-8 h-8" />
            </TableCell>
          </TableRow>
        ) : (
          variants.map((variant) => {
            const isEditing = editingStockAtId.hasOwnProperty(variant.id);
            const isLowStock = lowStockVariants.some(
              (v) => v.variantId === variant.id
            );

            return (
              <TableRow
                key={variant.id}
                className={
                  isLowStock ? "bg-red-500 text-white hover:text-black" : ""
                }
              >
                <TableCell className="w-[7.5%]">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={variant.image_urls[0] || "/placeholder-image.svg"}
                      alt={`${variant.product.name} logo`}
                      fill
                      sizes="96px"
                      style={{
                        objectFit: "contain",
                      }}
                      className="rounded-sm"
                    />
                  </div>
                </TableCell>
                <TableCell>{variant.product.brand.name}</TableCell>
                <TableCell>{variant.product.name}</TableCell>
                <TableCell className="w-[150px]">
                  {isEditing ? (
                    <Input
                      type="number"
                      placeholder="Quantity"
                      className="text-black w-full"
                      value={editingStockAtId[variant.id] ?? ""}
                      onChange={(e) =>
                        setEditingStockAtId((prev) => ({
                          ...prev,
                          [variant.id]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="inline-block w-full">
                      {variant.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="w-[200px]">
                  {isEditing ? (
                    <div className="flex items-center space-x-2.5 w-full">
                      <Button
                        variant="default"
                        onClick={() => handleUpdate(variant.id)}
                        className="whitespace-nowrap"
                      >
                        Update
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setEditingStockAtId((prev) => {
                            const updated = { ...prev };
                            delete updated[variant.id];
                            return updated;
                          });
                        }}
                        className="whitespace-nowrap"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleEdit(variant.id, variant.quantity)}
                      className="whitespace-nowrap"
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

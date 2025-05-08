"use client";

import getColorName from "@/lib/color-name";
import IColor from "@/models/color";
import { useCallback, useEffect, useState } from "react";
import ShadowedBox from "../shadowed-box";
import { Button } from "@/components/ui/button";
import Header2 from "../header2";
import Divider from "../divider";
import { Trash } from "lucide-react";
import debounce from "lodash/debounce";
import { createClient } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { title } from "process";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ColorPicker({
  colors: initialColors,
}: {
  colors: IColor[];
}) {
  const { toast } = useToast();
  const [colors, setColors] = useState<IColor[]>(initialColors);
  const [hex, setHex] = useState("#ffffff");
  const [colorName, setColorName] = useState("White");
  const [isLoading, setIsLoading] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<IColor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchColorName = useCallback(
    debounce(async (newHex: string) => {
      const name = await getColorName(newHex);
      setColorName(name);
    }, 500),
    []
  );

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = event.target.value;
    setHex(newHex);
    fetchColorName(newHex);
  };

  const addColor = async () => {
    setIsLoading(true);
    try {
      // Insert new color into Supabase
      const { data, error } = await supabase
        .from("color")
        .insert([{ hex, name: colorName }])
        .select();

      if (error) {
        console.error("Error adding color:", error);
        return;
      }

      // Update local state with the new color
      if (data && data.length > 0) {
        setColors([...colors, data[0] as IColor]);
      }

      // Reset color input
      setHex("#ffffff");
      setColorName("White");
    } catch (error) {
      console.error("Failed to add color:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeColor = async () => {
    if (!colorToDelete) return;

    setIsLoading(true);
    try {
      // 1. First get all product variants that use this color
      const { data: variantsToDelete, error: variantsError } = await supabase
        .from("product_variant")
        .select("product_id")
        .eq("color_id", colorToDelete.id);

      if (variantsError) throw variantsError;

      const affectedProductIds = Array.from(
        new Set(variantsToDelete?.map((v) => v.product_id) || [])
      );

      // 2. Delete all variants with this color
      const { error: deleteVariantsError } = await supabase
        .from("product_variant")
        .delete()
        .eq("color_id", colorToDelete.id);

      if (deleteVariantsError) throw deleteVariantsError;

      // 3. For affected products, first delete their tags, then check if they have other variants
      if (affectedProductIds.length > 0) {
        // Delete product tags first
        const { error: deleteTagsError } = await supabase
          .from("product_tag")
          .delete()
          .in("product_id", affectedProductIds);

        if (deleteTagsError) throw deleteTagsError;

        // Check which products now have no variants left
        const { data: remainingVariants, error: remainingError } =
          await supabase
            .from("product_variant")
            .select("product_id")
            .in("product_id", affectedProductIds);

        if (remainingError) throw remainingError;

        const productsWithVariants = new Set(
          remainingVariants?.map((v) => v.product_id) || []
        );
        const productsToDelete = affectedProductIds.filter(
          (id) => !productsWithVariants.has(id)
        );

        // Delete the orphaned products
        if (productsToDelete.length > 0) {
          const { error: deleteProductsError } = await supabase
            .from("product")
            .delete()
            .in("id", productsToDelete);

          if (deleteProductsError) throw deleteProductsError;
        }
      }

      // 4. Finally delete the color itself
      const { error: deleteColorError } = await supabase
        .from("color")
        .delete()
        .eq("id", colorToDelete.id);

      if (deleteColorError) throw deleteColorError;

      // Update state and show success
      setColors(colors.filter((color) => color.id !== colorToDelete.id));
      setIsDialogOpen(false);
      setColorToDelete(null);
      toast({
        title: "Success",
        description: "Color and associated data deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during deletion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (color: IColor) => {
    setColorToDelete(color);
    setIsDialogOpen(true);
  };

  return (
    <ShadowedBox>
      <Header2>Color Pallete</Header2>
      <div className="flex flex-wrap gap-4 items-center">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex flex-col items-center justify-center"
          >
            <div
              className="rounded-full p-4 border border-black"
              style={{ backgroundColor: `${color.hex}` }}
            ></div>
            <div className="bg-chestNut text-white flex items-center space-x-2 rounded-lg p-2.5 mt-2.5">
              <span className="text-xs">{color.name}</span>
              <button
                onClick={() => openDeleteDialog(color)}
                disabled={isLoading}
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Divider margin="5px 0" />
      <div className="flex items-center justify-between space-x-2.5 py-2.5">
        <div className="flex items-center space-x-2.5">
          <input type="color" value={hex} onChange={handleColorChange} />
          <div className="flex flex-col">
            <p className="italic">{hex}</p>
            <p className="text-sm font-bold">{colorName || "Fetching..."}</p>
          </div>
        </div>
        <Button onClick={addColor} disabled={isLoading}>
          +
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the color {colorToDelete?.name} and
              any products associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={removeColor}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShadowedBox>
  );
}

"use client";

import { useState } from "react";
import ISize from "@/models/size";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Trash, Check, X } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SizesTool({ sizes: initialSizes }: { sizes: ISize[] }) {
  const { toast } = useToast();
  const [sizes, setSizes] = useState<ISize[]>(initialSizes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newSize, setNewSize] = useState({ name: "", type: "alpha" });
  const [editSize, setEditSize] = useState({ name: "", type: "" });
  const [sizeToDelete, setSizeToDelete] = useState<ISize | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAddSize = async () => {
    if (newSize.name.trim() === "") return;

    try {
      const { data, error } = await supabase
        .from("size")
        .insert([{ name: newSize.name, type: newSize.type }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSizes([...sizes, data[0] as ISize]);
        setNewSize({ name: "", type: "alpha" });
        setIsAdding(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSize = async () => {
    if (!sizeToDelete) return;

    setIsDeleting(true);
    try {
      // 1. First get all product variants using this size
      const { data: variants, error: variantsError } = await supabase
        .from("product_variant")
        .select("product_id")
        .eq("size_id", sizeToDelete.id);

      if (variantsError) throw variantsError;

      const productIds = variants?.map((v) => v.product_id) || [];

      // 2. Delete all variants with this size
      const { error: deleteVariantsError } = await supabase
        .from("product_variant")
        .delete()
        .eq("size_id", sizeToDelete.id);

      if (deleteVariantsError) throw deleteVariantsError;

      // 3. For affected products, check if they have any remaining variants
      if (productIds.length > 0) {
        // Get remaining variants for these products
        const { data: remainingVariants, error: remainingError } =
          await supabase
            .from("product_variant")
            .select("product_id")
            .in("product_id", productIds);

        if (remainingError) throw remainingError;

        // Find products with no remaining variants
        const productsWithVariants = new Set(
          remainingVariants?.map((v) => v.product_id) || []
        );
        const productsToDelete = productIds.filter(
          (id) => !productsWithVariants.has(id)
        );

        // Delete orphaned products and their dependencies
        if (productsToDelete.length > 0) {
          // Delete product tags first
          const { error: deleteProductTagsError } = await supabase
            .from("product_tag")
            .delete()
            .in("product_id", productsToDelete);

          if (deleteProductTagsError) throw deleteProductTagsError;

          // Then delete the products
          const { error: deleteProductsError } = await supabase
            .from("product")
            .delete()
            .in("id", productsToDelete);

          if (deleteProductsError) throw deleteProductsError;
        }
      }

      // 4. Finally delete the size itself
      const { error: deleteSizeError } = await supabase
        .from("size")
        .delete()
        .eq("id", sizeToDelete.id);

      if (deleteSizeError) throw deleteSizeError;

      // Update local state
      setSizes(sizes.filter((size) => size.id !== sizeToDelete.id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSizeToDelete(null);
    }
  };

  const startEditing = (size: ISize) => {
    setEditingId(size.id);
    setEditSize({ name: size.name, type: size.type });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditSize({ name: "", type: "" });
  };

  const handleUpdateSize = async (id: number) => {
    if (editSize.name.trim() === "") return;

    try {
      const { error } = await supabase
        .from("size")
        .update({ name: editSize.name, type: editSize.type })
        .eq("id", id);

      if (error) throw error;

      setSizes(
        sizes.map((size) =>
          size.id === id
            ? { ...size, name: editSize.name, type: editSize.type }
            : size
        )
      );

      setEditingId(null);
    } catch (error) {
      console.error("Error updating size:", error);
    }
  };

  return (
    <ShadowedBox>
      <div className="flex items-center justify-between mb-4">
        <Header2>Sizes</Header2>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (
            <>
              <X className="h-4 w-4 mr-1" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Add Size
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 flex items-center space-x-2 border-b pb-2">
          <Input
            type={newSize.type === "alpha" ? "text" : "number"}
            className="flex-1"
            placeholder="Size name"
            value={newSize.name}
            onChange={(e) => {
              if (e.target.value !== "" || e.target.value.length > 0) {
                setNewSize({ ...newSize, name: e.target.value });
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setNewSize({
                ...newSize,
                type: newSize.type === "alpha" ? "numeric" : "alpha",
              })
            }
          >
            {newSize.type === "alpha" ? "Alpha" : "Numeric"}
          </Button>
          <Button size="sm" onClick={handleAddSize}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div>
        {sizes.map((size) => (
          <div
            key={size.id}
            className="flex justify-between items-center border-b py-2"
          >
            {editingId === size.id ? (
              <div className="flex flex-1 space-x-2">
                <Input
                  type={editSize.type === "alpha" ? "text" : "number"}
                  className="flex-1"
                  value={editSize.name}
                  onChange={(e) =>
                    setEditSize({ ...editSize, name: e.target.value })
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditSize({
                      ...editSize,
                      type: editSize.type === "alpha" ? "numeric" : "alpha",
                    })
                  }
                >
                  {editSize.type === "alpha" ? "Alpha" : "Numeric"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                <span>{size.name}</span>
                <span className="italic text-sm font-bold">{size.type}</span>
              </div>
            )}

            <div className="flex space-x-1">
              {editingId === size.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateSize(size.id)}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditing}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(size)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete Confirmation Dialog */}
                  <Dialog
                    open={isDeleteDialogOpen && sizeToDelete?.id === size.id}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSizeToDelete(size);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4 text-chestNut" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete the size "{size.name}
                          "?
                          <br />
                          <span className="font-semibold text-red-500">
                            This will also delete all product and variants that
                            use this size.
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteSize}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </ShadowedBox>
  );
}

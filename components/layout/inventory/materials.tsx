"use client";

import { Button } from "@/components/ui/button";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import IMaterial from "@/models/material";
import { useState } from "react";
import { Check, Edit, Plus, Trash, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export default function Materials({
  materials: initialMaterials,
}: {
  materials: IMaterial[];
}) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<IMaterial[]>(initialMaterials);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState({ name: "" });
  const [editMaterial, setEditMaterial] = useState({ name: "" });
  const [materialToDelete, setMaterialToDelete] = useState<IMaterial | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddMaterial = async () => {
    if (newMaterial.name.trim() === "") return;

    try {
      const { data, error } = await supabase
        .from("material")
        .insert([{ name: newMaterial.name }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setMaterials([...materials, data[0] as IMaterial]);
        setNewMaterial({ name: "" });
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
  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;

    setIsDeleting(true);
    try {
      // 1. First get all products using this material
      const { data: products, error: productsError } = await supabase
        .from("product")
        .select("id")
        .eq("material_id", materialToDelete.id);

      if (productsError) throw productsError;

      const productIds = products?.map((p) => p.id) || [];

      // 2. Delete all variants for these products first
      if (productIds.length > 0) {
        // Delete product variants
        const { error: variantsError } = await supabase
          .from("product_variant")
          .delete()
          .in("product_id", productIds);

        if (variantsError) throw variantsError;

        // Delete product tags
        const { error: tagsError } = await supabase
          .from("product_tag")
          .delete()
          .in("product_id", productIds);

        if (tagsError) throw tagsError;

        // Delete the products themselves
        const { error: productsError } = await supabase
          .from("product")
          .delete()
          .in("id", productIds);

        if (productsError) throw productsError;
      }

      // 3. Finally delete the material itself
      const { error: deleteMaterialError } = await supabase
        .from("material")
        .delete()
        .eq("id", materialToDelete.id);

      if (deleteMaterialError) throw deleteMaterialError;

      // Update local state
      setMaterials(
        materials.filter((material) => material.id !== materialToDelete.id)
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  const startEditing = (material: IMaterial) => {
    setEditingId(material.id);
    setEditMaterial({ name: material.name });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditMaterial({ name: "" });
  };

  const handleUpdateMaterial = async (id: number) => {
    if (editMaterial.name.trim() === "") return;

    try {
      const { error } = await supabase
        .from("material")
        .update({ name: editMaterial.name })
        .eq("id", id);

      if (error) throw error;

      setMaterials(
        materials.map((material) =>
          material.id === id
            ? { ...material, name: editMaterial.name }
            : material
        )
      );

      setEditingId(null);
    } catch (error) {
      console.error("Error updating material:", error);
    }
  };

  return (
    <ShadowedBox>
      <div className="flex items-center justify-between mb-4">
        <Header2>Materials</Header2>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (
            <>
              <X className="h-4 w-4 mr-1" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Add Material
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 flex items-center space-x-2 border-b pb-2">
          <Input
            type="text"
            className="flex-1"
            placeholder="Material name"
            value={newMaterial.name}
            onChange={(e) => {
              if (e.target.value !== "" || e.target.value.length > 0) {
                setNewMaterial({ name: e.target.value });
              }
            }}
          />
          <Button size="sm" onClick={handleAddMaterial}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div>
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex justify-between items-center border-b py-2"
          >
            {editingId === material.id ? (
              <Input
                type="text"
                className="flex-1"
                value={editMaterial.name}
                onChange={(e) => setEditMaterial({ name: e.target.value })}
              />
            ) : (
              <span>{material.name}</span>
            )}

            <div className="flex space-x-1">
              {editingId === material.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateMaterial(material.id)}
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
                    onClick={() => startEditing(material)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete Confirmation Dialog */}
                  <Dialog
                    open={isDialogOpen && materialToDelete?.id === material.id}
                    onOpenChange={setIsDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMaterialToDelete(material);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4 text-chestNut" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                          This will permanently delete the material{" "}
                          {materialToDelete?.name} and any products associated
                          with it.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteMaterial}
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

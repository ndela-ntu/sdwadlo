'use client';

import { Button } from "@/components/ui/button";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import IMaterial from "@/models/material";
import { useState } from "react";
import { Check, Edit, Plus, Trash, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Materials({
  materials: initialMaterials,
}: {
  materials: IMaterial[];
}) {
  const [materials, setMaterials] = useState<IMaterial[]>(initialMaterials);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState({ name: "" });
  const [editMaterial, setEditMaterial] = useState({ name: "" });

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
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      const { error } = await supabase.from("material").delete().eq("id", id);

      if (error) throw error;

      setMaterials(materials.filter((material) => material.id !== id));
    } catch (error) {
      console.error("Error deleting material:", error);
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMaterial(material.id)}
                  >
                    <Trash className="h-4 w-4 text-chestNut" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </ShadowedBox>
  );
}

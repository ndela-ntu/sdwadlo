"use client";

import { useState } from "react";
import ISize from "@/models/size";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Trash, Check, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SizesTool({ sizes: initialSizes }: { sizes: ISize[] }) {
  const [sizes, setSizes] = useState<ISize[]>(initialSizes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newSize, setNewSize] = useState({ name: "", type: "alpha" });
  const [editSize, setEditSize] = useState({ name: "", type: "" });

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
    } catch (error) {
      console.error("Error adding size:", error);
    }
  };

  const handleDeleteSize = async (id: number) => {
    try {
      const { error } = await supabase.from("size").delete().eq("id", id);

      if (error) throw error;

      setSizes(sizes.filter((size) => size.id !== id));
    } catch (error) {
      console.error("Error deleting size:", error);
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSize(size.id)}
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

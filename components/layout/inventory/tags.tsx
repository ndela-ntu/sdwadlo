"use client";

import { createClient } from "@supabase/supabase-js";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import ITag from "@/models/tag";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Edit, Plus, Trash, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMissingMedia } from "@/context/missing-media-context";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Tags({ tags: initialTags }: { tags: ITag[] }) {
  const { addMissingMedia, removeMissingMedia } = useMissingMedia();
  const [tags, setTags] = useState<ITag[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTag, setNewTag] = useState({ name: "" });
  const [editTag, setEditTag] = useState({ name: "" });

  const handleAddTag = async () => {
    if (newTag.name.trim() === "") return;

    try {
      const { data, error } = await supabase
        .from("tag")
        .insert([{ name: newTag.name }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        addMissingMedia({ mediaId: data[0].id, type: "tag" });
        setTags([...tags, data[0] as ITag]);
        setNewTag({ name: "" });
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      const { error } = await supabase.from("tag").delete().eq("id", id);

      if (error) throw error;

      removeMissingMedia(id, "tag");
      setTags(tags.filter((tag) => tag.id !== id));
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const startEditing = (tag: ITag) => {
    setEditingId(tag.id);
    setEditTag({ name: tag.name });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTag({ name: "" });
  };

  const handleUpdateTag = async (id: number) => {
    if (editTag.name.trim() === "") return;

    try {
      const { error } = await supabase
        .from("tag")
        .update({ name: editTag.name })
        .eq("id", id);

      if (error) throw error;

      setTags(
        tags.map((tag) =>
          tag.id === id ? { ...tag, name: editTag.name } : tag
        )
      );

      setEditingId(null);
    } catch (error) {
      console.error("Error updating tag:", error);
    }
  };

  return (
    <ShadowedBox>
      <div className="flex items-center justify-between mb-4">
        <Header2>Tags</Header2>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (
            <>
              <X className="h-4 w-4 mr-1" /> Cancel
            </>
          ) : (
            <>
              <Plus /> Add Tag
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 flex items-center space-x-2 border-b pb-2">
          <Input
            type="text"
            className="flex-1"
            placeholder="Tag name"
            value={newTag.name}
            onChange={(e) => {
              if (e.target.value !== "" || e.target.value.length > 0) {
                setNewTag({ name: e.target.value });
              }
            }}
          />
          <Button size="sm" onClick={handleAddTag}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex justify-between items-center border-b py-2"
          >
            {editingId === tag.id ? (
              <Input
                type="text"
                className="flex-1"
                value={editTag.name}
                onChange={(e) => setEditTag({ name: e.target.value })}
              />
            ) : (
              <span>{tag.name}</span>
            )}

            <div className="flex space-x-1">
              {editingId === tag.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateTag(tag.id)}
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
                    onClick={() => startEditing(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTag(tag.id)}
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

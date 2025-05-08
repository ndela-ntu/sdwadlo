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

export default function Tags({ tags: initialTags }: { tags: ITag[] }) {
  const { toast } = useToast();
  const { addMissingMedia, removeMissingMedia } = useMissingMedia();
  const [tags, setTags] = useState<ITag[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTag, setNewTag] = useState({ name: "" });
  const [editTag, setEditTag] = useState({ name: "" });
  const [tagToDelete, setTagToDelete] = useState<ITag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    setIsDeleting(true);
    try {
      // 1. First get all products associated with this tag
      const { data: products, error: productsError } = await supabase
        .from("product_tag")
        .select("product_id")
        .eq("tag_id", tagToDelete.id);

      if (productsError) throw productsError;

      const productIds = products?.map((p) => p.product_id) || [];

      // 2. Delete product tags first
      const { error: deleteTagsError } = await supabase
        .from("product_tag")
        .delete()
        .eq("tag_id", tagToDelete.id);

      if (deleteTagsError) throw deleteTagsError;

      // 3. For affected products, check if they have any remaining tags
      if (productIds.length > 0) {
        const { data: remainingTags, error: remainingError } = await supabase
          .from("product_tag")
          .select("product_id")
          .in("product_id", productIds);

        if (remainingError) throw remainingError;

        // Find products with no remaining tags
        const productsWithTags = new Set(
          remainingTags?.map((t) => t.product_id) || []
        );
        const productsToDelete = productIds.filter(
          (id) => !productsWithTags.has(id)
        );

        // Delete orphaned products and their variants
        if (productsToDelete.length > 0) {
          // Delete product variants first
          const { error: deleteVariantsError } = await supabase
            .from("product_variant")
            .delete()
            .in("product_id", productsToDelete);

          if (deleteVariantsError) throw deleteVariantsError;

          // Then delete the products
          const { error: deleteProductsError } = await supabase
            .from("product")
            .delete()
            .in("id", productsToDelete);

          if (deleteProductsError) throw deleteProductsError;
        }
      }

      // 4. Finally delete the tag itself
      const { error: deleteTagError } = await supabase
        .from("tag")
        .delete()
        .eq("id", tagToDelete.id);

      if (deleteTagError) throw deleteTagError;

      removeMissingMedia(tagToDelete.id, "tag");
      setTags(tags.filter((tag) => tag.id !== tagToDelete.id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setTagToDelete(null);
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
              <Plus className="h-4 w-4 mr-1" /> Add Tag
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

                  {/* Delete Confirmation Dialog */}
                  <Dialog
                    open={isDialogOpen && tagToDelete?.id === tag.id}
                    onOpenChange={setIsDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTagToDelete(tag);
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
                          This will permanently delete:
                          <ul className="list-disc pl-5 mt-2">
                            <li>The tag "{tag.name}"</li>
                            <li>All product associations with this tag</li>
                            <li className="font-semibold text-red-500">
                              Any products that no longer have tags after this
                              deletion
                            </li>
                          </ul>
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
                          onClick={handleDeleteTag}
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

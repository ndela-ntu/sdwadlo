"use client";

import ICategory from "@/models/category";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { createClient } from "@supabase/supabase-js";
import ISubcategory from "@/models/subcategory";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash,
  Edit,
  Save,
  X,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMissingMedia } from "@/context/missing-media-context";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Categories({
  categories: initialCategories,
}: {
  categories: ICategory[];
}) {
  const { toast } = useToast();
  const { addMissingMedia, removeMissingMedia } = useMissingMedia();
  const [categories, setCategories] = useState<ICategory[]>(initialCategories);
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: number]: boolean;
  }>({});
  const [subcategoriesMap, setSubcategoriesMap] = useState<{
    [key: number]: ISubcategory[];
  }>({});
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});

  // States for editing
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<
    number | null
  >(null);
  const [editName, setEditName] = useState<string>("");

  // States for adding
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState<{
    [key: number]: boolean;
  }>({});
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState<string>("");

  // Processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "category" | "subcategory";
    categoryId: number;
    subcategoryId?: number;
    name: string;
  } | null>(null);

  const toggleCategory = async (categoryId: number) => {
    // Skip toggling if in edit mode
    if (editingCategoryId || editingSubcategoryId) return;

    // Toggle the expanded state
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));

    // If expanding and no subcategories loaded yet, fetch them
    if (!expandedCategories[categoryId] && !subcategoriesMap[categoryId]) {
      await fetchSubcategories(categoryId);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    setIsLoading((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const { data: subcategories, error } = await supabase
        .from("subcategory")
        .select("*")
        .eq("category_id", categoryId);

      if (error) throw error;

      if (subcategories) {
        setSubcategoriesMap((prev) => ({
          ...prev,
          [categoryId]: subcategories,
        }));
      }
    } catch (fetchError: any) {
      toast({
        title: "Error",
        description: fetchError.message || "An error occurred during fetch",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  // Start editing a category
  const startEditCategory = (category: ICategory) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
  };

  // Start editing a subcategory
  const startEditSubcategory = (subcategory: ISubcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditName(subcategory.name);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingSubcategoryId(null);
    setEditName("");
  };

  // Save edited category
  const saveEditedCategory = async () => {
    if (!editingCategoryId || !editName.trim()) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("category")
        .update({ name: editName.trim() })
        .eq("id", editingCategoryId);

      if (error) throw error;

      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategoryId ? { ...cat, name: editName.trim() } : cat
        )
      );

      // Clear edit state
      setEditingCategoryId(null);
      setEditName("");
    } catch (saveError: any) {
      toast({
        title: "Error",
        description: saveError.message || "An error occurred during fetch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Save edited subcategory
  const saveEditedSubcategory = async (categoryId: number) => {
    if (!editingSubcategoryId || !editName.trim()) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("subcategory")
        .update({ name: editName.trim() })
        .eq("id", editingSubcategoryId);

      if (error) throw error;

      // Update local state
      setSubcategoriesMap((prev) => ({
        ...prev,
        [categoryId]:
          prev[categoryId]?.map((subcat) =>
            subcat.id === editingSubcategoryId
              ? { ...subcat, name: editName.trim() }
              : subcat
          ) || [],
      }));

      // Clear edit state
      setEditingSubcategoryId(null);
      setEditName("");
    } catch (saveError: any) {
      toast({
        title: "Error",
        description: saveError.message || "An error occurred during fetch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show dialog to confirm category deletion
  const confirmDeleteCategory = (category: ICategory) => {
    setItemToDelete({
      type: "category",
      categoryId: category.id,
      name: category.name,
    });
    setDeleteDialogOpen(true);
  };

  // Show dialog to confirm subcategory deletion
  const confirmDeleteSubcategory = (
    categoryId: number,
    subcategory: ISubcategory
  ) => {
    setItemToDelete({
      type: "subcategory",
      categoryId: categoryId,
      subcategoryId: subcategory.id,
      name: subcategory.name,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;

    setIsProcessing(true);
    setDeleteDialogOpen(false);

    try {
      if (itemToDelete.type === "category") {
        // 1. Get all subcategories in this category
        const { data: subcategories, error: subcatFetchError } = await supabase
          .from("subcategory")
          .select("id")
          .eq("category_id", itemToDelete.categoryId);

        if (subcatFetchError) throw subcatFetchError;

        const subcategoryIds = subcategories?.map((sub) => sub.id) || [];

        const { data: directProducts, error: productsFetchError } =
          await supabase
            .from("product")
            .select("id")
            .eq("category_id", itemToDelete.categoryId);

        if (productsFetchError) throw productsFetchError;

        const { data: subcategoryProducts, error: subcatProductsError } =
          await supabase
            .from("product")
            .select("id")
            .in("subcategory_id", subcategoryIds);

        if (subcatProductsError) throw subcatProductsError;

        const allProductIds = [
          ...(directProducts?.map((p) => p.id) || []),
          ...(subcategoryProducts?.map((p) => p.id) || []),
        ].filter((v, i, a) => a.indexOf(v) === i);

        // 2. Delete all dependent records
        if (allProductIds.length > 0) {
          const { error: deleteProductTagsError } = await supabase
            .from("product_tag")
            .delete()
            .in("product_id", allProductIds);

          if (deleteProductTagsError) throw deleteProductTagsError;

          const { error: deleteVariantsError } = await supabase
            .from("product_variant")
            .delete()
            .in("product_id", allProductIds);

          if (deleteVariantsError) throw deleteVariantsError;

          const { error: deleteProductsError } = await supabase
            .from("product")
            .delete()
            .or(
              `id.in.(${allProductIds.join(",")}),category_id.eq.${itemToDelete.categoryId}`
            );

          if (deleteProductsError) throw deleteProductsError;
        }

        const { error: deleteSubcatError } = await supabase
          .from("subcategory")
          .delete()
          .eq("category_id", itemToDelete.categoryId);

        if (deleteSubcatError) throw deleteSubcatError;

        // 3. Now safe to delete category
        const { data: deleteCategoryError } = await supabase
          .from("category")
          .delete()
          .eq("id", itemToDelete.categoryId);

        if (deleteCategoryError) throw deleteCategoryError;

        // Update local state
        removeMissingMedia(itemToDelete.categoryId, "category");
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== itemToDelete.categoryId)
        );

        // Remove from subcategories map and expanded state
        const newSubcatMap = { ...subcategoriesMap };
        delete newSubcatMap[itemToDelete.categoryId];
        setSubcategoriesMap(newSubcatMap);

        const newExpandedState = { ...expandedCategories };
        delete newExpandedState[itemToDelete.categoryId];
        setExpandedCategories(newExpandedState);

        toast({
          title: "Success",
          description: `Category "${itemToDelete.name}" and all its contents have been deleted`,
        });
      } else if (
        itemToDelete.type === "subcategory" &&
        itemToDelete.subcategoryId
      ) {
        // 1. Get all products in this subcategory
        const { data: products, error: productsError } = await supabase
          .from("product")
          .select("id")
          .eq("subcategory_id", itemToDelete.subcategoryId);

        if (productsError) throw productsError;

        const productIds = products?.map((p) => p.id) || [];

        // 2. Delete dependent records
        if (productIds.length > 0) {
          // Delete product tags
          const { error: tagsError } = await supabase
            .from("product_tag")
            .delete()
            .in("product_id", productIds);

          if (tagsError) throw tagsError;

          // Delete product variants
          const { error: variantsError } = await supabase
            .from("product_variant")
            .delete()
            .in("product_id", productIds);

          if (variantsError) throw variantsError;

          // Delete products
          const { error: productsDeleteError } = await supabase
            .from("product")
            .delete()
            .in("id", productIds);

          if (productsDeleteError) throw productsDeleteError;
        }

        // 3. Delete the subcategory
        const { error } = await supabase
          .from("subcategory")
          .delete()
          .eq("id", itemToDelete.subcategoryId);

        if (error) throw error;

        // Update local state
        setSubcategoriesMap((prev) => ({
          ...prev,
          [itemToDelete.categoryId]:
            prev[itemToDelete.categoryId]?.filter(
              (subcat) => subcat.id !== itemToDelete.subcategoryId
            ) || [],
        }));

        toast({
          title: "Success",
          description: `Subcategory "${itemToDelete.name}" and all its products have been deleted`,
        });
      }
    } catch (deleteError: any) {
      toast({
        title: "Error",
        description: deleteError.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setItemToDelete(null);
    }
  };

  // Start adding a new category
  const startAddCategory = () => {
    setIsAddingCategory(true);
    setNewCategoryName("");
  };

  // Cancel adding a new category
  const cancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  // Save a new category
  const saveNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from("category")
        .insert([{ name: newCategoryName.trim() }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Add to local state
        setCategories((prev) => [...prev, data[0] as ICategory]);
        addMissingMedia({ mediaId: data[0].id, type: "category" });
        // Clear add state
        setIsAddingCategory(false);
        setNewCategoryName("");
      }
    } catch (saveError: any) {
      toast({
        title: "Error",
        description: saveError.message || "An error occurred during fetch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start adding a new subcategory
  const startAddSubcategory = (categoryId: number) => {
    setIsAddingSubcategory((prev) => ({
      ...prev,
      [categoryId]: true,
    }));
    setNewSubcategoryName("");

    // Make sure the category is expanded
    if (!expandedCategories[categoryId]) {
      toggleCategory(categoryId);
    }
  };

  // Cancel adding a new subcategory
  const cancelAddSubcategory = (categoryId: number) => {
    setIsAddingSubcategory((prev) => ({
      ...prev,
      [categoryId]: false,
    }));
    setNewSubcategoryName("");
  };

  // Save a new subcategory
  const saveNewSubcategory = async (categoryId: number) => {
    if (!newSubcategoryName.trim()) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from("subcategory")
        .insert([
          {
            name: newSubcategoryName.trim(),
            category_id: categoryId,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Add to local state
        setSubcategoriesMap((prev) => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), data[0] as ISubcategory],
        }));

        // Clear add state
        setIsAddingSubcategory((prev) => ({
          ...prev,
          [categoryId]: false,
        }));
        setNewSubcategoryName("");
      }
    } catch (saveError: any) {
      toast({
        title: "Error",
        description: saveError.message || "An error occurred during fetch",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCategory = async (id: number, value: boolean) => {
    setIsProcessing(true);
    try {
      const { data: updatedCategory, error } = await supabase
        .from("category")
        .update({ status: value ? "Active" : "Inactive" })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      setCategories(
        categories.map((category) => {
          if (category.id === updatedCategory.id) {
            return updatedCategory;
          }

          return category;
        })
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ShadowedBox>
      <div className="flex items-center justify-between mb-4">
        <Header2>Item Categories</Header2>
        <Button
          onClick={startAddCategory}
          disabled={isAddingCategory || isProcessing}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {isAddingCategory && (
        <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded border">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-grow"
          />
          <div className="flex space-x-1">
            <Button size="sm" onClick={saveNewCategory} disabled={isProcessing}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={cancelAddCategory}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2 mt-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`border-b pb-2 ${category.status === 'Inactive' && 'opacity-70 bg-silver text-gray-800'}`}
          >
            <div className="flex items-center justify-between p-2 rounded">
              {editingCategoryId === category.id ? (
                // Editing mode for category
                <div className="flex items-center space-x-2 w-full">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Category name"
                    className="flex-grow"
                  />
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={saveEditedCategory}
                      disabled={isProcessing}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="font-medium flex items-center space-x-2 cursor-pointer flex-grow"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <span>{category.name}</span>
                  </div>
                  <div className="flex space-x-1 items-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startAddSubcategory(category.id)}
                      disabled={isProcessing}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditCategory(category)}
                      disabled={isProcessing}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={category.status === "Active"}
                      onCheckedChange={(value) => {
                        handleToggleCategory(category.id, value);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDeleteCategory(category)}
                      disabled={isProcessing}
                    >
                      <Trash className="h-4 w-4 text-chestNut" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {expandedCategories[category.id] && (
              <div className="pl-6 mt-2 space-y-1">
                {isAddingSubcategory[category.id] && (
                  <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-50 rounded border">
                    <Input
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="New subcategory name"
                      className="flex-grow"
                    />
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => saveNewSubcategory(category.id)}
                        disabled={isProcessing}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelAddSubcategory(category.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {isLoading[category.id] ? (
                  <div className="text-sm text-gray-500">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : subcategoriesMap[category.id]?.length ? (
                  subcategoriesMap[category.id].map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded"
                    >
                      {editingSubcategoryId === subcategory.id ? (
                        // Editing mode for subcategory
                        <div className="flex items-center space-x-2 w-full">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Subcategory name"
                            className="flex-grow"
                          />
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => saveEditedSubcategory(category.id)}
                              disabled={isProcessing}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display mode for subcategory
                        <>
                          <span className="text-sm">{subcategory.name}</span>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditSubcategory(subcategory)}
                              disabled={isProcessing}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                confirmDeleteSubcategory(
                                  category.id,
                                  subcategory
                                )
                              }
                              disabled={isProcessing}
                            >
                              <Trash className="h-3 w-3 text-chestNut" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No subcategories found
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && !isAddingCategory && (
          <div className="text-gray-500 text-center py-4">
            No categories available
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {itemToDelete?.type === "category"
                ? `Are you sure you want to delete the category "${itemToDelete?.name}"?`
                : `Are you sure you want to delete the subcategory "${itemToDelete?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-red-500 font-medium">
              {itemToDelete?.type === "category"
                ? "This will also delete all subcategories and any products associated with this category."
                : "This will delete any products associated with this subcategory."}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete {itemToDelete?.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShadowedBox>
  );
}

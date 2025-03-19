"use client";

import ICategory from "@/models/category";
import Header2 from "../header2";
import ShadowedBox from "../shadowed-box";
import { createClient } from "@supabase/supabase-js";
import ISubcategory from "@/models/subcategory";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Trash, Edit, Save, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Categories({
  categories: initialCategories,
}: {
  categories: ICategory[];
}) {
  const [categories, setCategories] = useState<ICategory[]>(initialCategories);
  const [expandedCategories, setExpandedCategories] = useState<{[key: number]: boolean}>({});
  const [subcategoriesMap, setSubcategoriesMap] = useState<{[key: number]: ISubcategory[]}>({});
  const [isLoading, setIsLoading] = useState<{[key: number]: boolean}>({});
  const [error, setError] = useState<string>("");
  
  // States for editing
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  
  // States for adding
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState<{[key: number]: boolean}>({});
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState<string>("");
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const toggleCategory = async (categoryId: number) => {
    // Skip toggling if in edit mode
    if (editingCategoryId || editingSubcategoryId) return;

    // Toggle the expanded state
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));

    // If expanding and no subcategories loaded yet, fetch them
    if (!expandedCategories[categoryId] && !subcategoriesMap[categoryId]) {
      await fetchSubcategories(categoryId);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    setIsLoading(prev => ({ ...prev, [categoryId]: true }));
    try {
      const { data: subcategories, error } = await supabase
        .from("subcategory")
        .select("*")
        .eq("category_id", categoryId);

      if (error) {
        setError(error.message);
        return;
      }

      if (subcategories) {
        setSubcategoriesMap(prev => ({
          ...prev,
          [categoryId]: subcategories
        }));
      }
    } catch (fetchError) {
      setError("Failed to fetch subcategories");
      console.error(fetchError);
    } finally {
      setIsLoading(prev => ({ ...prev, [categoryId]: false }));
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

      if (error) {
        setError(error.message);
        return;
      }

      // Update local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === editingCategoryId ? { ...cat, name: editName.trim() } : cat
        )
      );
      
      // Clear edit state
      setEditingCategoryId(null);
      setEditName("");
    } catch (saveError) {
      setError("Failed to update category");
      console.error(saveError);
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

      if (error) {
        setError(error.message);
        return;
      }

      // Update local state
      setSubcategoriesMap(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.map(subcat => 
          subcat.id === editingSubcategoryId ? { ...subcat, name: editName.trim() } : subcat
        ) || []
      }));
      
      // Clear edit state
      setEditingSubcategoryId(null);
      setEditName("");
    } catch (saveError) {
      setError("Failed to update subcategory");
      console.error(saveError);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a category
  const deleteCategory = async (categoryId: number) => {
    if (window.confirm("Are you sure you want to delete this category? This will also delete all associated subcategories.")) {
      setIsProcessing(true);
      try {
        // First delete all subcategories
        const { error: subcatError } = await supabase
          .from("subcategory")
          .delete()
          .eq("category_id", categoryId);

        if (subcatError) {
          setError(subcatError.message);
          return;
        }

        // Then delete the category
        const { error } = await supabase
          .from("category")
          .delete()
          .eq("id", categoryId);

        if (error) {
          setError(error.message);
          return;
        }

        // Update local state
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        
        // Remove from subcategories map and expanded state
        const newSubcatMap = { ...subcategoriesMap };
        delete newSubcatMap[categoryId];
        setSubcategoriesMap(newSubcatMap);
        
        const newExpandedState = { ...expandedCategories };
        delete newExpandedState[categoryId];
        setExpandedCategories(newExpandedState);
        
      } catch (deleteError) {
        setError("Failed to delete category");
        console.error(deleteError);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Delete a subcategory
  const deleteSubcategory = async (categoryId: number, subcategoryId: number) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      setIsProcessing(true);
      try {
        const { error } = await supabase
          .from("subcategory")
          .delete()
          .eq("id", subcategoryId);

        if (error) {
          setError(error.message);
          return;
        }

        // Update local state
        setSubcategoriesMap(prev => ({
          ...prev,
          [categoryId]: prev[categoryId]?.filter(subcat => subcat.id !== subcategoryId) || []
        }));
        
      } catch (deleteError) {
        setError("Failed to delete subcategory");
        console.error(deleteError);
      } finally {
        setIsProcessing(false);
      }
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

      if (error) {
        setError(error.message);
        return;
      }

      if (data && data.length > 0) {
        // Add to local state
        setCategories(prev => [...prev, data[0] as ICategory]);
        
        // Clear add state
        setIsAddingCategory(false);
        setNewCategoryName("");
      }
    } catch (saveError) {
      setError("Failed to add category");
      console.error(saveError);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start adding a new subcategory
  const startAddSubcategory = (categoryId: number) => {
    setIsAddingSubcategory(prev => ({
      ...prev,
      [categoryId]: true
    }));
    setNewSubcategoryName("");
    
    // Make sure the category is expanded
    if (!expandedCategories[categoryId]) {
      toggleCategory(categoryId);
    }
  };

  // Cancel adding a new subcategory
  const cancelAddSubcategory = (categoryId: number) => {
    setIsAddingSubcategory(prev => ({
      ...prev,
      [categoryId]: false
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
        .insert([{ 
          name: newSubcategoryName.trim(),
          category_id: categoryId
        }])
        .select();

      if (error) {
        setError(error.message);
        return;
      }

      if (data && data.length > 0) {
        // Add to local state
        setSubcategoriesMap(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), data[0] as ISubcategory]
        }));
        
        // Clear add state
        setIsAddingSubcategory(prev => ({
          ...prev,
          [categoryId]: false
        }));
        setNewSubcategoryName("");
      }
    } catch (saveError) {
      setError("Failed to add subcategory");
      console.error(saveError);
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
            <Button 
              size="sm" 
              onClick={saveNewCategory}
              disabled={isProcessing}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={cancelAddCategory}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-2 mt-4">
        {categories.map((category) => (
          <div key={category.id} className="border-b pb-2">
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
                  <div className="flex space-x-1">
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
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteCategory(category.id)}
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
                  <div className="text-sm text-gray-500"><Loader2 className="animate-spin" /></div>
                ) : subcategoriesMap[category.id]?.length ? (
                  subcategoriesMap[category.id].map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded">
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
                              onClick={() => deleteSubcategory(category.id, subcategory.id)}
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
                  <div className="text-sm text-gray-500">No subcategories found</div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {error && (
          <div className="text-chestNut text-sm mt-2">{error}</div>
        )}
        
        {categories.length === 0 && !isAddingCategory && (
          <div className="text-gray-500 text-center py-4">No categories available</div>
        )}
      </div>
    </ShadowedBox>
  );
}
"use client";

import { deleteProduct } from "@/app/product-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import IProduct from "@/models/product";
import { createClient } from "@/utils/supabase/client";
import { Edit, List, Loader2, MoreVertical, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductEllipsisMenu({
  id,
  onStatusChange,
}: {
  id: number;
  onStatusChange?: (updatedProduct: IProduct) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [fetching, setFetching] = useState<boolean>(true); // Separate state for initial fetch

  useEffect(() => {
    const fetchProduct = async () => {
      setFetching(true);
      try {
        const { data: product, error } = await supabase
          .from("product")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProduct(product);
      } catch (error) {
        toast({
          title: "Error occurred",
          description: `Error: ${error}`,
          variant: "destructive",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchProduct(); // Actually call the function
  }, [id]); // Add id to dependencies

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    router.push(`products/edit-product/${id}`);
  };

  const toggleProductStatus = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const { data: updatedProduct, error } = await supabase
        .from("product")
        .update({ status: product.status === "Listed" ? "Unlisted" : "Listed" })
        .eq("id", id)
        .select(`*, brand(*), category(*), subcategory(*), material(*)`)
        .single();

      if (error) throw error;
      setProduct(updatedProduct);
      console.log(updatedProduct);
      onStatusChange?.(updatedProduct);
    } catch (error) {
      toast({
        title: "Error occurred",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await deleteProduct(id);
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="bg-black p-2.5 text-white rounded-md max-w-fit">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
          disabled={loading}
        >
          {loading ? (
            <span className="bg-black p-2.5 text-white rounded-md">
              <Loader2 className="w-4 h-4 animate-spin" />
            </span>
          ) : (
            <span className="bg-black p-2.5 text-white rounded-md">
              <MoreVertical className="h-5 w-5 " />
            </span>
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem disabled={loading} onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={loading} onClick={toggleProductStatus}>
          <List className="mr-2 h-4 w-4" />
          <span>{product?.status === "Listed" ? "Unlist" : "List"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={loading} onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

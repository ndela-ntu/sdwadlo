"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Edit,
  Trash,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBrand } from "@/app/brand-actions";

export default function BrandEllipsisMenu({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    router.push(`brands/edit-brand/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await deleteBrand(id);
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={loading} onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={loading} onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

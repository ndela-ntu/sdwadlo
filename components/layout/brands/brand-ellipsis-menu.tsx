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

export default function BrandEllipsisMenu({ id }: { id: number }) {
  const { missingMedia, removeMissingMedia } = useMissingMedia();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    router.push(`brands/edit-brand/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteBrand(id);
      
      const isMissing = missingMedia.some(
        (item) => item.mediaId === id && item.type === "brand"
      );
      if (isMissing) {
        removeMissingMedia(id, "brand");
      }
    } finally {
      setDeleteLoading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Brand Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete:
              <ul className="list-disc pl-5 mt-2">
                <li>The brand and its logo</li>
                <li className="font-semibold text-red-500">
                  All products associated with this brand
                </li>
                <li>All variants of those products</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
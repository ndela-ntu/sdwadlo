"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import IBrand from "@/models/brand";
import Image from "next/image";
import BrandEllipsisMenu from "./brand-ellipsis-menu";
import { useEffect } from "react";
import { useMissingMedia } from "@/context/missing-media-context";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BrandsTable({ brands }: { brands: IBrand[] }) {
  const supabase = createClient();
  const { toast } = useToast();
  const { missingMedia, addMissingMedia } = useMissingMedia();

  return (
    <Table>
      <TableCaption>A list of featured brands</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Logo</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Options</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands.map((brand) => (
          <TableRow key={brand.id}>
            <TableCell className="w-[7.5%]">
              <div className="relative aspect-square w-full">
                <Image
                  src={brand.logo_url || "/placeholder-image.svg"}
                  alt={`${brand.name} logo`}
                  fill
                  sizes="96px"
                  style={{
                    objectFit: "contain",
                  }}
                  className="rounded-sm"
                />
              </div>
            </TableCell>
            <TableCell>{brand.name}</TableCell>
            <TableCell className="text-right">
              <BrandEllipsisMenu id={brand.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

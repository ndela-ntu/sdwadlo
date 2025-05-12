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
import { useEffect, useState } from "react";
import { useMissingMedia } from "@/context/missing-media-context";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BrandsTable({ brands }: { brands: IBrand[] }) {
  const [brandsState, setBrandsState] = useState<IBrand[]>(brands);

  const handleBrandStatusChange = (updatedBrand: IBrand) => {
    setBrandsState(
      brandsState.map((brand) => {
        if (brand.id === updatedBrand.id) {
          return updatedBrand;
        }
        return brand;
      })
    );
  };

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
        {brandsState.map((brand) => (
          <TableRow
            key={brand.id}
            className={`hover:bg-gray-100 ${brand.status === "Inactive" && "bg-silver text-gray-500 opacity-70"}`}
          >
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
              <BrandEllipsisMenu
                id={brand.id}
                onStatusChange={handleBrandStatusChange}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

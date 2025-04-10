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
import IProduct from "@/models/product";
import IProductVariant from "@/models/product-variant";
import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function ProductTable({
  variants,
}: {
  variants: IProductVariant[];
}) {
  const [expandedProduct, setExpandedProduct] = useState<{
    [key: number]: boolean;
  }>({});
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    const uniqueProducts = variants.reduce<IProduct[]>((acc, variant) => {
      if (!acc.find((p) => p.id === variant.product.id))
        acc.push(variant.product);
      return acc;
    }, []);
    setFilteredProducts(uniqueProducts);
  }, [variants]);

  const toggleExpand = (productId: number) => {
    setExpandedProduct((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <Table>
      <TableCaption>A list of products</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead className="w-[7.5%]">Brand</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Subcategory</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Functions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredProducts.map((product) => (
          <React.Fragment key={product.id}>
            <TableRow
              onClick={() => toggleExpand(product.id)}
              className="cursor-pointer hover:bg-gray-100"
            >
              <TableCell className="cursor-pointer w-10">
                <span
                  className={`text-white bg-chestNut rounded-full p-2.5 inline-block transform transition-transform duration-200 ${
                    expandedProduct[product.id] ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1 items-center justify-center">
                  <span className="text-sm font-medium">
                    {product.brand.name}
                  </span>
                  <div className="relative aspect-square w-full">
                    <Image
                      src={product.brand.logo_url || "/placeholder-image.svg"}
                      alt={`${product.name} logo`}
                      layout="intrinsic" // Ensure the image maintains its aspect ratio
                      width={92} // Set fixed width
                      height={92} // Set fixed height
                      style={{
                        objectFit: "contain",
                      }}
                      className="rounded-sm"
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>R{product.price.toFixed(2)}</TableCell>
              <TableCell>{product.category.name}</TableCell>
              <TableCell>{product.subcategory.name}</TableCell>
              <TableCell>{product.material.name}</TableCell>
              <TableCell><EllipsisMenu id={product.id}/></TableCell>
            </TableRow>

            {expandedProduct[product.id] &&
              variants
                .filter((v) => v.product.id === product.id)
                .map((variant) => (
                  <TableRow key={variant.id} className="bg-gray-50 w-full">
                    <TableCell colSpan={8}>
                      <div className="flex space-x-4 items-center">
                        <div className="flex flex-col gap-1 p-5 bg-chestNut rounded-md text-white">
                          <div>
                            <strong>Quantity:</strong> {variant.quantity}
                          </div>
                          {variant.color && (
                            <div>
                              <strong>Color:</strong> {variant.color.name}
                            </div>
                          )}
                          {variant.size && (
                            <div>
                              <strong>Size:</strong> {variant.size.name}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {variant.image_urls.map((url, i) => (
                              <div
                                key={i}
                                className="relative aspect-square w-full"
                              >
                                <Image
                                  src={url || "/placeholder-image.svg"}
                                  alt={`Variant picture`}
                                  layout="intrinsic" // Ensure the image maintains its aspect ratio
                                  width={92} // Set fixed width
                                  height={92} // Set fixed height
                                  style={{
                                    objectFit: "contain",
                                  }}
                                  className="rounded-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

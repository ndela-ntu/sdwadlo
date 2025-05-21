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
import ProductEllipsisMenu from "./product-ellipsis-menu";

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
      if (variant.product && !acc.find((p) => p.id === variant.product.id)) {
        acc.push(variant.product);
      }
      return acc;
    }, []);
    setFilteredProducts(uniqueProducts);
  }, [variants]);

  const handleProductStatusChange = (updatedProduct: IProduct) => {
    setFilteredProducts((prevProducts) =>
      prevProducts.map((product) => {
        return product.id === updatedProduct.id ? updatedProduct : product;
      })
    );
  };

  const toggleExpand = (productId: number) => {
    if (
      filteredProducts.find((product) => product.id === productId)?.status ===
      "Listed"
    ) {
      setExpandedProduct((prev) => ({
        ...prev,
        [productId]: !prev[productId],
      }));
    }
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
          <TableHead>Product Type</TableHead>
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
              className={`hover:bg-gray-100 ${product.status === "Unlisted" && "bg-silver text-gray-500 opacity-70"}`}
            >
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer w-10"
              >
                <span
                  className={`text-white bg-chestNut rounded-full p-2.5 inline-block transform transition-transform duration-200 ${
                    expandedProduct[product.id] ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </span>
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                <div className="flex flex-col space-y-1 items-center justify-center">
                  <span className="text-sm font-medium">
                    <span className="text-sm font-medium">
                      {product.brand?.name || "-"}
                    </span>
                  </span>
                  <div className="relative aspect-square w-full border border-silver rounded-md">
                    <Image
                      src={product.brand?.logo_url || "/placeholder-image.svg"}
                      alt={`${product.name} logo`}
                      fill // This makes the image fill the container
                      sizes="92px" // Optional: helps with performance
                      style={{
                        objectFit: "contain", // This ensures the image fits within the container while maintaining aspect ratio
                      }}
                      className="rounded-sm"
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                {product.name || "-"}
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                R{product.price?.toFixed(2) || "-"}
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                {product?.type || "-"}
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                {product.category?.name || "-"}
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                {product.subcategory?.name || "-"}
              </TableCell>
              <TableCell
                onClick={() => toggleExpand(product.id)}
                className="cursor-pointer"
              >
                {product.material?.name || "-"}
              </TableCell>
              <TableCell>
                <ProductEllipsisMenu
                  id={product.id}
                  onStatusChange={handleProductStatusChange}
                />
              </TableCell>
            </TableRow>

            {expandedProduct[product.id] &&
              variants
                .filter((v) => v.product.id === product.id)
                .map((variant) => (
                  <TableRow key={variant.id} className="bg-gray-50 w-full p-10">
                    <TableCell colSpan={9} className="p-0">
                      <Table className="w-full border bg-white">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]"></TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {/* Image column with rowSpan */}
                            <TableCell rowSpan={1} className="align-top">
                              <div className="flex gap-2 overflow-x-auto p-1">
                                {variant.image_urls.map((url, i) => (
                                  <div
                                    key={i}
                                    className="relative aspect-square w-24 h-24 flex-shrink-0"
                                  >
                                    <Image
                                      src={url || "/placeholder-image.svg"}
                                      alt={`Variant picture`}
                                      fill
                                      style={{ objectFit: "contain" }}
                                      className="rounded-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{variant.quantity}</TableCell>
                            <TableCell>{variant.color?.name || "-"}</TableCell>
                            <TableCell>{variant.size?.name || "-"}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

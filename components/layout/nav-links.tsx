"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./sign-out-button";
import {
  Car,
  ClipboardList,
  Home,
  House,
  LandPlot,
  Logs,
  ShoppingBasket,
  Store,
  Trello,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLowStock } from "@/context/low-stock-contex";
import IStockSettings from "@/models/stock-settings";

const links = [
  {
    name: "Products",
    href: "/dashboard/products",
    icon: <ShoppingBasket />,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: <Logs />,
  },
  {
    name: "Brands",
    href: "/dashboard/brands",
    icon: <Trello />,
  },
  {
    name: "Stocks",
    href: "/dashboard/stocks",
    icon: <ClipboardList />,
  },
];

export default function NavLinks() {
  const supabase = createClient();
  const pathname = usePathname();
  const [lowStockCounter, setLowStockCounter] = useState<number>();
  const [error, setError] = useState<string>();
  const { lowStockVariants, addLowStockVariant, removeLowStockVariant } =
    useLowStock();

  useEffect(() => {
    const fetchLowStockCounter = async () => {
      const { data: stockSettings, error } = await supabase
        .from("stock_setting")
        .select(`*`)
        .single();

      if (error) {
        setError(error.message);
      }

      if (stockSettings) {
        const settings = stockSettings as IStockSettings;
        setLowStockCounter(settings.low_stock_counter);
      }
    };

    const fetchLowStockCount = async () => {
      const { data, error } = await supabase
        .from("product_variant")
        .select(`id, quantity`);

      if (error) {
        setError(error.message);
      }

      if (data) {
        data.forEach((variant) => {
          if (variant.quantity <= (lowStockCounter ?? 2)) {
            addLowStockVariant({
              variantId: variant.id,
              quantity: variant.quantity,
            });
          }
        });
      }
    };

    fetchLowStockCount();
    fetchLowStockCount();
  }, []);

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full flex md:flex-col justify-between items-center">
      {links.map((link) => {
        if (link.name === "Stocks") {
          return (
            <Link
              className={`relative w-full flex h-[48px] grow items-center justify-center gap-2 rounded-md ${
                isActive(link.href)
                  ? "text-white bg-black"
                  : "text-black bg-white border border-black"
              } p-3 font-medium md:flex-none md:justify-start md:p-2 md:px-3`}
              key={link.name}
              href={link.href}
            >
              {(error || lowStockVariants.length > 0) && (
                <span className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-red-500 text-white text-sm px-2 py-0.5">
                  {error ? "E" : lowStockVariants.length}
                </span>
              )}

              <span>{link.icon}</span>
              <p className="hidden md:block">{link.name}</p>
            </Link>
          );
        }

        return (
          <Link
            className={`w-full flex h-[48px] grow items-center justify-center gap-2 rounded-md ${
              isActive(link.href)
                ? "text-white bg-black"
                : "text-black bg-white border border-black"
            } p-3 font-medium md:flex-none md:justify-start md:p-2 md:px-3`}
            key={link.name}
            href={link.href}
          >
            <span>{link.icon}</span>
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
      <div className="md:w-full">
        <SignOutButton />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./sign-out-button";
import {
  Banknote,
  Car,
  ChartArea,
  ClipboardList,
  CornerDownRight,
  Hammer,
  HandCoins,
  Home,
  House,
  LandPlot,
  Logs,
  PiggyBank,
  Settings,
  Ship,
  ShoppingBasket,
  Store,
  Trello,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLowStock } from "@/context/low-stock-contex";
import IStockSettings from "@/models/stock-settings";

const links: {
  name: string;
  href: string;
  icon: ReactNode;
  subLinks?: { name: string; href: string; icon: ReactNode }[];
}[] = [
  {
    name: "Products",
    href: "/dashboard/products",
    icon: <ShoppingBasket />,
    subLinks: [
      {
        name: "Inventory",
        href: "/dashboard/products/inventory",
        icon: <Hammer />,
      },
    ],
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
    subLinks: [
      {
        name: "Settings",
        href: "/dashboard/stocks/settings",
        icon: <Settings />,
      },
    ],
  },
  {
    name: "Revenue",
    href: "/dashboard/revenue",
    icon: <HandCoins />,
    subLinks: [
      {
        name: "Profits",
        href: "/dashboard/revenue/profits",
        icon: <Banknote />,
      },
      {
        name: "Taxes",
        href: "/dashboard/revenue/taxes",
        icon: <PiggyBank />,
      },
      {
        name: "Shipping",
        href: "/dashboard/revenue/taxes",
        icon: <Ship />,
      },
    ],
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: <ChartArea />,
  },
];

export default function NavLinks() {
  const supabase = createClient();
  const pathname = usePathname();
  const [error, setError] = useState<string>();
  const { lowStockVariants, addLowStockVariant, removeLowStockVariant } =
    useLowStock();

  useEffect(() => {
    const fetchData = async () => {
      // First fetch the counter setting
      const { data: stockSettings, error: settingsError } = await supabase
        .from("stock_setting")
        .select(`*`)
        .single();

      if (settingsError) {
        setError(settingsError.message);
        return; // Early return on error
      }

      const settings = stockSettings as IStockSettings;

      // Then fetch variants using the counter we just got
      const { data: variants, error: variantsError } = await supabase
        .from("product_variant")
        .select(`id, quantity`);

      if (variantsError) {
        setError(variantsError.message);
        return;
      }

      if (variants) {
        variants.forEach((variant) => {
          if (variant.quantity <= (settings.low_stock_counter ?? 2)) {
            addLowStockVariant({
              variantId: variant.id,
              quantity: variant.quantity,
            });
          }
        });
      }
    };

    fetchData();
  }, []);

  const isActive = (href: string): boolean => {
    return pathname === href;
  };

  const sortedLinks = [...links]
    .map((link) => ({
      ...link,
      subLinks: link.subLinks?.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      ),
    }))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return (
    <div className="w-full flex md:flex-col justify-between items-center">
      {sortedLinks.map((link) => {
        if (link.name === "Stocks") {
          return (
            <div key={link.name} className="flex flex-col w-full">
              <Link
                className={`relative w-full flex h-[48px] grow items-center justify-center gap-2 rounded-md ${
                  isActive(link.href)
                    ? "text-white bg-eerieBlack"
                    : "text-eerieBlack bg-white border border-eerieBlack"
                } p-3 font-medium md:flex-none md:justify-start md:p-2 md:px-3`}
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
              {link.subLinks &&
                link.subLinks.map((sLink) => (
                  <div
                    key={sLink.name}
                    className="flex w-full justify-between pl-3 items-center"
                  >
                    <span>
                      <CornerDownRight />
                    </span>{" "}
                    <div
                      className={`px-3 max-w-fit flex space-x-1 items-center rounded-md font-medium ${
                        isActive(sLink.href) // Changed from link.href to sLink.href
                          ? "text-white bg-eerieBlack"
                          : "text-eerieBlack bg-white border border-eerieBlack"
                      }`}
                    >
                      <Link
                        className="text-sm flex h-[36px] grow items-center gap-2 "
                        href={sLink.href}
                      >
                        <span>{sLink.icon}</span>
                        <p>{sLink.name}</p>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          );
        }

        return (
          <div key={link.name} className="flex flex-col w-full">
            <Link
              className={`w-full flex h-[48px] grow items-center justify-center gap-2 rounded-md ${
                isActive(link.href)
                  ? "text-white bg-eerieBlack"
                  : "text-eerieBlack bg-white border border-eerieBlack"
              } p-3 font-medium md:flex-none md:justify-start md:p-2 md:px-3`}
              href={link.href}
            >
              <span>{link.icon}</span>
              <p className="hidden md:block">{link.name}</p>
            </Link>
            {link.subLinks &&
              link.subLinks.map((sLink) => (
                <div
                  key={sLink.name}
                  className="flex w-full justify-between pl-3 items-center"
                >
                  <span>
                    <CornerDownRight />
                  </span>
                  <div
                    className={`px-3 max-w-fit flex space-x-1 items-center rounded-md font-medium ${
                      isActive(sLink.href) // Changed from link.href to sLink.href
                        ? "text-white bg-eerieBlack"
                        : "text-eerieBlack bg-white border border-eerieBlack"
                    }`}
                  >
                    <Link
                      className="text-sm flex h-[36px] grow items-center gap-2 "
                      href={sLink.href}
                    >
                      <span>{sLink.icon}</span>
                      <p>{sLink.name}</p>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        );
      })}
      <div className="md:w-full">
        <SignOutButton />
      </div>
    </div>
  );
}

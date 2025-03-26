"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./sign-out-button";
import { Car, Home, House, LandPlot, Logs, ShoppingBasket, Store, Trello } from "lucide-react";

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
];

export default function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full flex md:flex-col justify-between items-center">
      {links.map((link) => {
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

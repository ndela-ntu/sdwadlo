import { ReactNode } from "react";

export default function Header2({ children }: { children: ReactNode }) {
  return <h1 className="text-base font-bold underline">{children}</h1>;
}

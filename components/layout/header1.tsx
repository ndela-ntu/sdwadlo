import { ReactNode } from "react";

export default function Header1({ children }: { children: ReactNode }) {
  return <h1 className="text-xl font-bold underline">{children}</h1>;
}

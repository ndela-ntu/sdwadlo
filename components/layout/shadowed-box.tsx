import { ReactNode } from "react";

export default function ShadowedBox({ children }: { children: ReactNode }) {
  return <div className="p-4 shadow-xl rounded-lg max-h-fit">{children}</div>;
}

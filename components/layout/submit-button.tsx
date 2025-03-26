"use client";

import { Button } from "@/components/ui/button";
import {  Loader2 } from "lucide-react";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  pending?: boolean;
};

export function SubmitButton({ children, pending = false, ...props }: Props) {
  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

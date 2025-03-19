import { signOutAction } from "@/app/actions/auth-actions";
import { Power } from "lucide-react";

export default function SignOutButton() {
  return (
    <form action={signOutAction} className="w-full">
      <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md p-2.5 border border-black md:flex-none md:justify-start md:p-2 md:px-3">
        <Power />
        <div className="hidden md:block">Sign Out</div>
      </button>
    </form>
  );
}

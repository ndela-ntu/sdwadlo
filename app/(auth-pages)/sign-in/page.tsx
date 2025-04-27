import { signInAction } from "@/app/actions/auth-actions";
import { FormMessage, Message } from "@/components/layout/form-message";
import PasswordInput from "@/components/layout/password-input";
import { SubmitButton } from "@/components/layout/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  console.log(searchParams);
  
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <Label htmlFor="password">Password</Label>
        <PasswordInput name="password" placeholder="Your password" required />
        <SubmitButton pendingText="Signing In..." formAction={signInAction}>
          Sign in
        </SubmitButton>
        {"error" in searchParams && <FormMessage message={searchParams} />}
      </div>
    </form>
  );
}
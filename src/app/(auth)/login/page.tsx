import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div>
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <BrandMark className="h-12 w-12 lg:hidden" />
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink lg:mt-0">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">Sign in to continue</p>
      </div>

      <form action={loginAction} className="mt-8 space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Input
          label="Username"
          name="username"
          autoComplete="username"
          required
          placeholder="maria.santos"
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted lg:text-left">
        No account? Ask the HOA office.
      </p>
    </div>
  );
}

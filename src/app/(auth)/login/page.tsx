import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardBody>
        <form action={loginAction} className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Input
            label="Username"
            name="username"
            autoComplete="username"
            required
            placeholder="e.g. maria.santos"
          />
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-3 text-sm text-muted">
          <Link
            href="/forgot-password"
            className="text-forest underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </p>

        <p className="mt-4 text-xs text-muted">
          Household logins are issued by the association office.
        </p>
      </CardBody>
    </Card>
  );
}

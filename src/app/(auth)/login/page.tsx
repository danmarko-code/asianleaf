import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/form";
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
        <CardDescription>
          Use the email and password issued to your household.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <form action={loginAction} className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="name@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted">
          Only confirmed accounts can sign in. Pending registrations must be
          approved by an administrator first.
        </p>

        <p className="mt-4 text-sm text-muted">
          New household?{" "}
          <Link
            href="/register"
            className="text-forest underline underline-offset-4"
          >
            Register your unit
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

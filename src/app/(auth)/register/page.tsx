import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/app/(auth)/register/register-form";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard");
  }

  const { submitted } = await searchParams;

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration received</CardTitle>
          <CardDescription>
            Your household request is waiting for administrator review.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            The association will check the unit and household details. Once
            approved, you can sign in with the email and password you submitted.
            No login is active yet.
          </p>
          <Link href="/login" className={buttonStyles({ className: "w-full" })}>
            Back to sign in
          </Link>
        </CardBody>
      </Card>
    );
  }

  return <RegisterForm />;
}

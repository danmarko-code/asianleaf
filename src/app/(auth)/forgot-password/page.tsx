import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          We send a 6-digit code to the email on your account.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <ForgotPasswordForm />
      </CardBody>
    </Card>
  );
}

import type { Metadata } from "next";
import { ChangePasswordForm } from "@/app/(homeowner)/app/change-password/change-password-form";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Change password" };

export default async function HomeownerChangePasswordPage() {
  await requireRole("HOMEOWNER");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Change password"
        description="Enter your current password, then confirm the new one with a one-time code."
      />

      <Card>
        <CardHeader>
          <CardTitle>Update your password</CardTitle>
          <CardDescription>
            Codes expire after 5 minutes and allow five attempts.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}

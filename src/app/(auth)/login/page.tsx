import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Email and password authentication is built in Phase 1.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-4">
        <Alert tone="info" title="Not wired yet">
          The seeded admin and homeowner accounts already exist in the database.
          Phase 1 connects them to this form, adds session cookies and protects
          the admin and homeowner routes.
        </Alert>
        <p className="text-sm text-muted">
          Test credentials are listed in <code>README.md</code>.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-forest underline underline-offset-4">
            Back to preview
          </Link>
          <Link
            href="/app/dashboard"
            className="text-forest underline underline-offset-4"
          >
            View homeowner shell
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

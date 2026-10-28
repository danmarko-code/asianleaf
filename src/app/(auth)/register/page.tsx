import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your household</CardTitle>
        <CardDescription>
          Two-step registration opens in Phase 2.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-4">
        <ol className="space-y-3 text-sm text-muted">
          <li>
            <span className="font-medium text-ink">Step 1 — Account and unit.</span>{" "}
            Name, contact number, email, password, ownership type and unit
            address.
          </li>
          <li>
            <span className="font-medium text-ink">Step 2 — Household.</span>{" "}
            Kasambahay, pets, vehicles and other household members, plus the
            Data Privacy Act consent.
          </li>
          <li>
            <span className="font-medium text-ink">Approval.</span> An admin
            reviews the request. Approval creates the household record and its
            single login.
          </li>
        </ol>
        <p className="text-sm text-muted">
          Each household gets one login. The consent text does not ask for names
          or email addresses inside the notice itself.
        </p>
        <Link href="/" className="text-sm text-forest underline underline-offset-4">
          Back to preview
        </Link>
      </CardBody>
    </Card>
  );
}

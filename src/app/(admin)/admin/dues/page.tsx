import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Dues" };

export default function AdminDuesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Collections"
        title="Dues and reminders"
        description="Monthly dues are billed per household and are due on the 5th."
      />

      <Alert tone="info" title="Partial payments are allowed">
        A household may pay in several transactions, but the balance stays open
        until the full PHP 1,500.00 is settled. After the 5th, overdue reminders
        repeat weekly until the balance is fully paid.
      </Alert>

      <Link
        href="/admin/payments"
        className={buttonStyles({ variant: "secondary" })}
      >
        Review pending GCash payments
      </Link>

      <Card>
        <CardBody>
          <EmptyState
            title="Dues list is not connected yet"
            description="Phase 4 generates monthly dues, shows unpaid and partially paid households, and runs the reminder job."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

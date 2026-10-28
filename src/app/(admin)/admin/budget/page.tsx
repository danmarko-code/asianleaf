import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Budget" };

export default function AdminBudgetPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transparency"
        title="Budget report"
        description="Income and expenses reported to homeowners, with monthly totals."
      />

      <Alert tone="warning" title="No receipt uploads">
        This prototype does not accept uploaded receipts. When paying dues,
        homeowners are reminded to keep a screenshot of their GCash receipt
        until the treasurer approves the payment.
      </Alert>

      <Card>
        <CardBody>
          <EmptyState
            title="The transparency report is not connected yet"
            description="Phase 7 adds income and expense entries, monthly totals and the homeowner view."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Dues and payments" };

export default function HomeownerPaymentsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Payments"
        title="Dues and payments"
        description="Pay your household balance through GCash, Maya or card."
      />

      <Alert tone="info" title="Keep your receipt">
        PayMongo will show a receipt after checkout. Take a screenshot and keep
        it for your records. This prototype does not accept uploaded receipts.
      </Alert>

      <Card>
        <CardBody>
          <EmptyState
            title="Checkout is not connected yet"
            description="PayMongo test-mode checkout, the return page, webhook confirmation and the printable receipt are added in the final phase."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

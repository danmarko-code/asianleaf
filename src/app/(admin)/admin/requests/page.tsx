import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Register requests" };

export default function AdminRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Register requests"
        description="Review a submitted registration. Approval creates the household record and its single login."
      />

      <Card>
        <CardBody>
          <EmptyState
            title="Review queue is not connected yet"
            description="Phase 2 adds the two-step registration form, the pending queue, and approve or reject actions with a reason."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

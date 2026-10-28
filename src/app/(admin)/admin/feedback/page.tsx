import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Feedback" };

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Feedback"
        description="Comments and suggestions submitted by homeowners."
      />

      <Card>
        <CardBody>
          <EmptyState
            title="The feedback inbox is not connected yet"
            description="Phase 7 adds submission from the homeowner app, unread counts and resolution notes."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

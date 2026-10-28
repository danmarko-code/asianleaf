import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Feedback" };

export default function HomeownerFeedbackPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Community"
        title="Feedback"
        description="Report an issue or suggest an improvement to the association."
      />

      <Card>
        <CardBody>
          <EmptyState
            title="Feedback submission is not connected yet"
            description="Phase 7 adds the feedback form and the admin inbox with status tracking."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

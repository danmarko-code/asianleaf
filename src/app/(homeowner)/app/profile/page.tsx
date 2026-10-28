import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Household profile" };

export default function HomeownerProfilePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Household"
        title="Profile"
        description="Contact details, kasambahay, pets, vehicles and household members."
      />

      <Alert tone="info" title="One login per household">
        Each household has one account. Profile edits update the household
        record shown to the association.
      </Alert>

      <Card>
        <CardBody>
          <EmptyState
            title="Profile editing is not connected yet"
            description="Phase 3 adds the profile view and edit form, including the dependent tabs."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

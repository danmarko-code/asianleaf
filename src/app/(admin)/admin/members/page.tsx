import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Members" };

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Members"
        description="Household records, contact details, kasambahay, pets, vehicles and household members."
      />

      <Card>
        <CardBody>
          <EmptyState
            title="Member records are not connected yet"
            description="Phase 3 adds the searchable member list, the detail page with tabs, and add/edit forms."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

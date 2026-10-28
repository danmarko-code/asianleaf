import type { Metadata } from "next";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Collections, unpaid dues and registration requests for the association."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Homeowners"
          value="—"
          hint="Seeded household records are in the database."
        />
        <StatCard
          label="Collected this month"
          value="—"
          hint="Connected in Phase 4."
        />
        <StatCard
          label="Unpaid dues"
          value="—"
          hint="Includes partial payments and overdue balances."
        />
        <StatCard
          label="Pending requests"
          value="—"
          hint="Approval workflow arrives in Phase 2."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="No activity to show yet"
            description="Approvals, payments and reminders will be recorded here as the next phases are connected."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

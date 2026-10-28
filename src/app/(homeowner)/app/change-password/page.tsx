import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Change password" };

export default function HomeownerChangePasswordPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Change password"
        description="Enter your current password, then confirm the new one with a one-time code."
      />

      <Card>
        <CardBody>
          <EmptyState
            title="Password change is not connected yet"
            description="Phase 6 adds SMS or email OTP confirmation, a 5-minute expiry and a limited number of attempts."
            className="border-0 bg-transparent px-0 py-6 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}

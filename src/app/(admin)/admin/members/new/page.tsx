import type { Metadata } from "next";
import Link from "next/link";
import { NewMemberForm } from "@/app/(admin)/admin/members/new/new-member-form";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Add member" };

export default async function AddMemberPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Add member"
        description="Create a household record and its portal login in one step."
        actions={
          <Link
            href="/admin/members"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Back to members
          </Link>
        }
      />

      <NewMemberForm />
    </div>
  );
}

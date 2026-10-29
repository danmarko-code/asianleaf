import type { Metadata } from "next";
import { updateFeedbackAction } from "@/app/(admin)/admin/feedback/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Feedback" };

const statusTone = {
  NEW: "warning",
  READ: "neutral",
  RESOLVED: "success",
} as const;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireRole("ADMIN");
  const { notice, error } = await searchParams;

  const feedback = await prisma.feedback.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: {
        select: {
          email: true,
          household: { select: { unitAddress: true } },
        },
      },
    },
  });

  const newCount = feedback.filter((item) => item.status === "NEW").length;
  const openCount = feedback.filter((item) => item.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Feedback"
        description="Comments and suggestions submitted by homeowners."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total messages" value={String(feedback.length)} />
        <StatCard label="Unread" value={String(newCount)} />
        <StatCard label="Still open" value={String(openCount)} />
      </div>

      {feedback.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Messages submitted from the homeowner app will appear here."
        />
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{item.subject || "Feedback"}</CardTitle>
                  <CardDescription>
                    {item.user.household?.unitAddress ?? "No household"} ·{" "}
                    {item.user.email} · {formatDate(item.createdAt)}
                  </CardDescription>
                </div>
                <Badge tone={statusTone[item.status]}>
                  {item.status === "NEW"
                    ? "New"
                    : item.status === "READ"
                      ? "In review"
                      : "Resolved"}
                </Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="whitespace-pre-line text-sm text-ink">
                  {item.message}
                </p>

                <form
                  action={updateFeedbackAction}
                  className="grid gap-3 border-t border-line pt-4 lg:grid-cols-12"
                >
                  <input type="hidden" name="feedbackId" value={item.id} />
                  <div className="lg:col-span-3">
                    <Select label="Status" name="status" defaultValue={item.status}>
                      <option value="NEW">New</option>
                      <option value="READ">In review</option>
                      <option value="RESOLVED">Resolved</option>
                    </Select>
                  </div>
                  <div className="lg:col-span-7">
                    <Textarea
                      label="Reply / note (optional)"
                      name="adminNote"
                      defaultValue={item.adminNote ?? ""}
                      maxLength={1000}
                      placeholder="Explain what was done. The homeowner sees this note."
                    />
                  </div>
                  <div className="flex items-end lg:col-span-2">
                    <Button type="submit" size="sm" className="w-full">
                      Update
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { submitFeedbackAction } from "@/app/(homeowner)/app/feedback/actions";
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
import { Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Feedback" };

const statusTone = {
  NEW: "warning",
  READ: "neutral",
  RESOLVED: "success",
} as const;

export default async function HomeownerFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const user = await requireRole("HOMEOWNER");
  const { submitted, error } = await searchParams;

  const feedback = await prisma.feedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Community"
        title="Feedback"
        description="Report an issue or suggest an improvement to the association."
      />

      {submitted ? (
        <Alert tone="success" title="Feedback submitted">
          The association will review your message. Replies appear here and in
          your notifications.
        </Alert>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
          <CardDescription>
            Keep it short and specific so the office can act on it.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={submitFeedbackAction} className="space-y-4">
            <Input
              label="Subject (optional)"
              name="subject"
              maxLength={120}
              placeholder="Streetlights"
            />
            <Textarea
              label="Message"
              name="message"
              required
              minLength={5}
              maxLength={2000}
              placeholder="Describe the concern or suggestion."
            />
            <Button type="submit" size="sm">
              Submit feedback
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your feedback</CardTitle>
          <CardDescription>
            {feedback.length === 0
              ? "You have not submitted feedback yet."
              : `${feedback.length} message${feedback.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          {feedback.length === 0 ? (
            <EmptyState
              title="No feedback yet"
              description="Use the form above to send your first message."
              className="border-0 bg-transparent px-0 py-6 shadow-none"
            />
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-line px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {item.subject || "Feedback"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone[item.status]}>
                    {item.status === "NEW"
                      ? "Received"
                      : item.status === "READ"
                        ? "In review"
                        : "Resolved"}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-ink">
                  {item.message}
                </p>
                {item.adminNote ? (
                  <p className="mt-3 rounded-sm bg-cream px-3 py-2 text-xs text-muted">
                    <span className="font-medium text-ink">Association reply: </span>
                    {item.adminNote}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

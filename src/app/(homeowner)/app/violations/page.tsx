import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMonthDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Violations" };

const statusTone = {
  OPEN: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
} as const;

export default async function HomeownerViolationsPage() {
  const user = await requireRole("HOMEOWNER");

  if (!user.householdId) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Community rules"
          title="Violations"
          description="Your login is not linked to a household yet."
        />
        <Alert tone="warning" title="Household link missing">
          Contact the association office so your login can be linked to your
          unit.
        </Alert>
      </div>
    );
  }

  const violations = await prisma.violation.findMany({
    where: { householdId: user.householdId },
    orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
    include: { member: true },
  });

  const openCount = violations.filter((row) => row.status === "OPEN").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Community rules"
        title="Violations"
        description="Warnings and payment requirements issued to your household."
      />

      {openCount > 0 ? (
        <Alert tone="warning" title={`${openCount} open notice${openCount === 1 ? "" : "s"}`}>
          Please review the details below. Contact the association office if you
          need to clarify a notice.
        </Alert>
      ) : (
        <Alert tone="success" title="No open violations">
          Your household has no open notices right now.
        </Alert>
      )}

      {violations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No violation records"
              description="Notices issued by the association will appear here."
              className="border-0 bg-transparent px-0 py-6 shadow-none"
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {violations.map((violation) => (
            <Card key={violation.id}>
              <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{violation.category}</CardTitle>
                  <CardDescription>
                    Issued {formatDate(violation.issuedAt)}
                    {violation.member
                      ? ` · ${violation.member.firstName} ${violation.member.lastName}`
                      : " · Whole household"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={
                      violation.kind === "PAYMENT_REQUIRED" ? "danger" : "warning"
                    }
                  >
                    {violation.kind === "PAYMENT_REQUIRED"
                      ? "Payment required"
                      : "Warning"}
                  </Badge>
                  <Badge tone={statusTone[violation.status]}>
                    {violation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-sm leading-relaxed text-muted">
                  {violation.description}
                </p>

                {violation.fineAmount ? (
                  <div className="rounded-md border border-line bg-cream px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Amount to settle
                    </p>
                    <p className="tabular mt-1 font-serif text-2xl text-forest">
                      {formatPeso(Number(violation.fineAmount))}
                    </p>
                    {violation.dueDate ? (
                      <p className="mt-1 text-xs text-muted">
                        Due {formatMonthDay(violation.dueDate)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {violation.status === "RESOLVED" && violation.resolutionNote ? (
                  <p className="text-xs text-muted">{violation.resolutionNote}</p>
                ) : null}

                {violation.status === "OPEN" &&
                violation.kind === "PAYMENT_REQUIRED" ? (
                  <Link
                    href="/app/payments"
                    className="inline-block text-sm font-medium text-forest underline underline-offset-4"
                  >
                    Go to payments
                  </Link>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

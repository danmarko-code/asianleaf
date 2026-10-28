import type { Metadata } from "next";
import { updateViolationStatusAction } from "@/app/(admin)/admin/violations/actions";
import { ViolationForm } from "@/app/(admin)/admin/violations/violation-form";
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
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
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

export default async function AdminViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  await requireRole("ADMIN");
  const { error, notice } = await searchParams;

  const [households, violations] = await Promise.all([
    prisma.household.findMany({
      orderBy: { unitAddress: "asc" },
      include: {
        members: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.violation.findMany({
      orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
      include: {
        household: true,
        member: true,
        issuedBy: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community rules"
        title="Violations"
        description="Issue a warning or a payment requirement to a specific resident or household."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Alert tone="info" title="Residents see open violations">
        An open violation appears below the resident&apos;s dashboard greeting
        and on their Violations page. Mark it resolved once the concern is
        settled.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Issue a violation</CardTitle>
          <CardDescription>
            Set the resident, type, date and payment details when needed.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ViolationForm households={households} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Violation records</CardTitle>
          <CardDescription>
            {violations.length === 0
              ? "No violations recorded."
              : `${violations.length} violation${violations.length === 1 ? "" : "s"} recorded.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {violations.length === 0 ? (
            <EmptyState
              title="No violations yet"
              description="Use the form above to issue the first notice."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Household</Th>
                    <Th>Violation</Th>
                    <Th>Issued</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((violation) => (
                    <tr key={violation.id}>
                      <Td>
                        <p className="font-medium text-ink">
                          {violation.household.unitAddress}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {violation.member
                            ? `${violation.member.firstName} ${violation.member.lastName}`
                            : "Whole household"}
                        </p>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-ink">
                            {violation.category}
                          </p>
                          <Badge
                            tone={
                              violation.kind === "PAYMENT_REQUIRED"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {violation.kind === "PAYMENT_REQUIRED"
                              ? "Payment"
                              : "Warning"}
                          </Badge>
                        </div>
                        <p className="mt-1 max-w-80 text-xs text-muted">
                          {violation.description}
                        </p>
                        {violation.fineAmount ? (
                          <p className="mt-1 text-xs font-medium text-ink">
                            {formatPeso(Number(violation.fineAmount))}
                            {violation.dueDate
                              ? ` due ${formatMonthDay(violation.dueDate)}`
                              : ""}
                          </p>
                        ) : null}
                      </Td>
                      <Td>
                        {formatDate(violation.issuedAt)}
                        <p className="mt-0.5 text-xs text-muted">
                          by {violation.issuedBy?.email ?? "system"}
                        </p>
                      </Td>
                      <Td>
                        <Badge tone={statusTone[violation.status]}>
                          {violation.status}
                        </Badge>
                      </Td>
                      <Td>
                        {violation.status === "OPEN" ? (
                          <div className="flex flex-wrap gap-2">
                            <form action={updateViolationStatusAction}>
                              <input
                                type="hidden"
                                name="violationId"
                                value={violation.id}
                              />
                              <input type="hidden" name="status" value="RESOLVED" />
                              <Button type="submit" size="sm">
                                Resolve
                              </Button>
                            </form>
                            <form action={updateViolationStatusAction}>
                              <input
                                type="hidden"
                                name="violationId"
                                value={violation.id}
                              />
                              <input type="hidden" name="status" value="DISMISSED" />
                              <Button type="submit" size="sm" variant="secondary">
                                Dismiss
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">
                            {violation.resolvedAt
                              ? formatDate(violation.resolvedAt)
                              : "Closed"}
                          </span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

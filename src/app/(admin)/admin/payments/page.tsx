import type { Metadata } from "next";
import {
  approvePaymentAction,
  rejectPaymentAction,
} from "@/app/(admin)/admin/payments/actions";
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
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMonthDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Payments" };

const paymentInclude = {
  channel: true,
  due: true,
  household: {
    include: {
      members: { take: 1, orderBy: { createdAt: "asc" as const } },
    },
  },
};

const statusTone = {
  PENDING: "warning",
  PAID: "success",
  REJECTED: "danger",
} as const;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  await requireRole("ADMIN");
  const { error, notice } = await searchParams;

  const [pending, reviewed] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: paymentInclude,
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PAID", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 15,
      include: paymentInclude,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment verification"
        description="Review GCash payments from homeowners."
      />

      {notice ? <Alert tone="info">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Alert tone="info" title="Before you approve">
        Check that the reference number, amount and date match the GCash account.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Pending payments</CardTitle>
          <CardDescription>
            {pending.length === 0
              ? "You’re all caught up."
              : `${pending.length} payment${pending.length === 1 ? "" : "s"} to review.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {pending.length === 0 ? (
            <EmptyState
              title="No pending payments"
              description="New payments from homeowners will appear here."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Household</Th>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((payment) => {
                    const member = payment.household.members[0];
                    return (
                      <tr key={payment.id}>
                        <Td>
                          <p className="font-medium text-ink">
                            {payment.household.unitAddress}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {member
                              ? `${member.firstName} ${member.lastName}`
                              : "No member on record"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {payment.due
                              ? `Due ${formatMonthDay(payment.due.dueDate)}`
                              : "No invoice linked"}
                          </p>
                        </Td>
                        <Td>
                          <p className="font-mono text-xs">
                            {payment.referenceNumber ?? "N/A"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {payment.channel?.name ?? payment.method} ·{" "}
                            {payment.paidAt ? formatDate(payment.paidAt) : "No date"}
                          </p>
                          {payment.receiptUrl ? (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-xs text-forest underline-offset-2 hover:underline"
                            >
                              View receipt
                            </a>
                          ) : null}
                          {payment.notes ? (
                            <p className="mt-1 max-w-56 text-xs text-muted">
                              {payment.notes}
                            </p>
                          ) : null}
                        </Td>
                        <Td className="tabular font-medium">
                          {formatPeso(Number(payment.amount))}
                        </Td>
                        <Td>
                          <div className="space-y-3">
                            {/* The reason belongs to the reject action; the
                                Reject button below targets this form by id so
                                both actions share one row. */}
                            <form
                              id={`reject-${payment.id}`}
                              action={rejectPaymentAction}
                            >
                              <input
                                type="hidden"
                                name="paymentId"
                                value={payment.id}
                              />
                              <Input
                                label="Rejection reason"
                                name="reason"
                                required
                                minLength={3}
                                maxLength={300}
                                placeholder="Wrong reference"
                              />
                            </form>

                            <div className="flex flex-row items-center gap-2">
                              <form action={approvePaymentAction}>
                                <input
                                  type="hidden"
                                  name="paymentId"
                                  value={payment.id}
                                />
                                <Button type="submit" size="sm">
                                  Approve
                                </Button>
                              </form>
                              <Button
                                type="submit"
                                size="sm"
                                variant="danger"
                                form={`reject-${payment.id}`}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently reviewed</CardTitle>
          <CardDescription>
            Payments you’ve approved or rejected.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {reviewed.length === 0 ? (
            <EmptyState
              title="No reviewed payments yet"
              description="Approved and rejected payments will appear here."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Household</Th>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map((payment) => (
                    <tr key={payment.id}>
                      <Td>
                        {payment.household.unitAddress}
                        <p className="mt-0.5 text-xs text-muted">
                          {payment.due
                            ? `Due ${formatMonthDay(payment.due.dueDate)}`
                            : "No invoice linked"}
                        </p>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">
                          {payment.referenceNumber ?? "N/A"}
                        </span>
                        {payment.receiptNumber ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {payment.receiptNumber}
                          </p>
                        ) : null}
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-xs text-forest underline-offset-2 hover:underline"
                          >
                            View receipt
                          </a>
                        ) : null}
                      </Td>
                      <Td className="tabular">
                        {formatPeso(Number(payment.amount))}
                      </Td>
                      <Td>
                        <Badge tone={statusTone[payment.status]}>
                          {payment.status}
                        </Badge>
                        {payment.rejectionReason ? (
                          <p className="mt-1 max-w-56 text-xs text-muted">
                            {payment.rejectionReason}
                          </p>
                        ) : null}
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

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
  due: {
    include: {
      household: {
        include: {
          members: { take: 1, orderBy: { createdAt: "asc" as const } },
        },
      },
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
        eyebrow="Collections"
        title="Payment verification"
        description="Check the GCash reference against the HOA account before approving a pending payment."
      />

      {notice ? <Alert tone="info">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Alert tone="info" title="Verify before approving">
        Open GCash and confirm the reference number, amount and date. Approval
        marks the payment paid and updates the household balance.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Pending payments</CardTitle>
          <CardDescription>
            {pending.length === 0
              ? "Nothing waiting for verification."
              : `${pending.length} payment${pending.length === 1 ? "" : "s"} waiting for verification.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {pending.length === 0 ? (
            <EmptyState
              title="No pending payments"
              description="New GCash submissions from homeowners will appear here."
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
                    const member = payment.due.household.members[0];
                    return (
                      <tr key={payment.id}>
                        <Td>
                          <p className="font-medium text-ink">
                            {payment.due.household.unitAddress}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {member
                              ? `${member.firstName} ${member.lastName}`
                              : "No member on record"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            Due {formatMonthDay(payment.due.dueDate)}
                          </p>
                        </Td>
                        <Td>
                          <p className="font-mono text-xs">
                            {payment.referenceNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {payment.channel?.name ?? payment.method} ·{" "}
                            {payment.paidAt ? formatDate(payment.paidAt) : "No date"}
                          </p>
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
                          <div className="space-y-2">
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
                            <form action={rejectPaymentAction} className="space-y-2">
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
                              <Button type="submit" size="sm" variant="danger">
                                Reject
                              </Button>
                            </form>
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
            The last approved and rejected payments.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {reviewed.length === 0 ? (
            <EmptyState
              title="No reviewed payments yet"
              description="Approved and rejected payments will be listed here."
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
                        {payment.due.household.unitAddress}
                        <p className="mt-0.5 text-xs text-muted">
                          Due {formatMonthDay(payment.due.dueDate)}
                        </p>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">
                          {payment.referenceNumber}
                        </span>
                        {payment.receiptNumber ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {payment.receiptNumber}
                          </p>
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

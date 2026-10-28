import type { Metadata } from "next";
import { submitPaymentAction } from "@/app/(homeowner)/app/payments/actions";
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
import { Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import {
  formatDate,
  formatMonthDay,
  todayInputValue,
} from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Dues and payments" };

const statusTone = {
  PENDING: "warning",
  PAID: "success",
  REJECTED: "danger",
} as const;

export default async function HomeownerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const user = await requireRole("HOMEOWNER");
  const { submitted, error } = await searchParams;
  const householdId = user.householdId;

  if (!householdId) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Payments"
          title="Dues and payments"
          description="Your login is not linked to a household yet."
        />
        <Alert tone="warning" title="Household link missing">
          Contact the association office so your login can be linked to your
          unit.
        </Alert>
      </div>
    );
  }

  const [dues, channels, payments] = await Promise.all([
    prisma.due.findMany({
      where: { householdId },
      orderBy: { dueDate: "asc" },
      include: {
        payments: {
          where: { status: "PAID" },
          select: { amount: true },
        },
      },
    }),
    prisma.paymentChannel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.payment.findMany({
      where: { due: { householdId } },
      orderBy: { createdAt: "desc" },
      include: { channel: true, due: true },
    }),
  ]);

  const openDues = dues
    .filter((due) => due.status === "UNPAID" || due.status === "PARTIALLY_PAID")
    .map((due) => {
      const paid = due.payments.reduce(
        (total, payment) => total + Number(payment.amount),
        0,
      );
      return { due, paid, balance: Number(due.amount) - paid };
    })
    .filter((row) => row.balance > 0);

  const current = openDues[0];
  const channel = channels[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Payments"
        title="Dues and payments"
        description="Scan the HOA GCash QR, send your payment, then submit the reference number for verification."
      />

      {submitted ? (
        <Alert tone="success" title="Payment submitted">
          The treasurer will verify your GCash reference number. Your balance
          stays open until the payment is approved.
        </Alert>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Alert tone="info" title="Keep your GCash receipt">
        Take a screenshot of your GCash confirmation and keep it until the
        treasurer approves the payment. This app does not accept uploaded
        receipts.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Pay through GCash</CardTitle>
          <CardDescription>
            Send the exact amount, then submit the reference number below.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          {channel ? (
            <div className="rounded-md border border-line bg-cream p-4">
              <p className="text-sm font-medium text-ink">{channel.name}</p>
              <p className="mt-1 text-sm text-muted">
                {channel.accountName} · {channel.accountNumber}
              </p>
              {channel.instructions ? (
                <p className="mt-2 text-xs text-muted">{channel.instructions}</p>
              ) : null}
              {channel.qrImageUrl ? (
                // The official QR image is supplied by the treasurer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.qrImageUrl}
                  alt={`${channel.name} QR code`}
                  className="mt-4 h-48 w-48 rounded-md border border-line bg-surface object-contain p-2"
                />
              ) : (
                <div className="mt-4 flex h-40 w-40 flex-col items-center justify-center rounded-md border border-dashed border-line bg-surface p-4 text-center">
                  <p className="text-xs font-medium text-ink">QR image pending</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Use the account details above for now.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No payment channel available"
              description="The association has not published an active GCash account yet."
              className="border-0 bg-transparent px-0 py-6 shadow-none"
            />
          )}

          {current && channel ? (
            <form action={submitPaymentAction} className="space-y-4 border-t border-line pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Billing period" name="dueId" defaultValue={current.due.id}>
                  {openDues.map((row) => (
                    <option key={row.due.id} value={row.due.id}>
                      Due {formatMonthDay(row.due.dueDate)} ·{" "}
                      {formatPeso(row.balance)} remaining
                    </option>
                  ))}
                </Select>

                <Select label="Payment channel" name="channelId" defaultValue={channel.id}>
                  {channels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Amount sent"
                  name="amount"
                  type="number"
                  min="1"
                  max={current.balance}
                  step="0.01"
                  defaultValue={current.balance.toFixed(2)}
                  hint={`Remaining balance: ${formatPeso(current.balance)}`}
                  required
                />

                <Input
                  label="Date sent"
                  name="paidAt"
                  type="date"
                  defaultValue={todayInputValue()}
                  required
                />

                <Input
                  label="GCash reference number"
                  name="referenceNumber"
                  required
                  minLength={4}
                  maxLength={80}
                  placeholder="e.g. 1234567890123"
                  hint="Find this in your GCash receipt."
                />

                <div className="sm:col-span-2">
                  <Textarea
                    label="Notes (optional)"
                    name="notes"
                    maxLength={500}
                    placeholder="Anything the treasurer should know"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Submit for verification</Button>
                <p className="text-xs text-muted">
                  Your payment stays pending until the treasurer approves it.
                </p>
              </div>
            </form>
          ) : openDues.length === 0 ? (
            <Alert tone="success" title="No open balance">
              Your household has no unpaid dues right now.
            </Alert>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>
            Pending and approved payments for your household.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Submitted payments will appear here with their verification status."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <Td>
                        {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                        <p className="mt-0.5 text-xs text-muted">
                          Due {formatMonthDay(payment.due.dueDate)}
                        </p>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">
                          {payment.referenceNumber}
                        </span>
                        <p className="mt-0.5 text-xs text-muted">
                          {payment.channel?.name ?? payment.method}
                        </p>
                      </Td>
                      <Td className="tabular">
                        {formatPeso(Number(payment.amount))}
                      </Td>
                      <Td>
                        <Badge tone={statusTone[payment.status]}>
                          {payment.status}
                        </Badge>
                        {payment.status === "REJECTED" &&
                        payment.rejectionReason ? (
                          <p className="mt-1 max-w-48 text-xs text-muted">
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

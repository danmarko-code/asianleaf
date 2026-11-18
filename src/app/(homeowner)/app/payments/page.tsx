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
import {
  Table,
  TableWrapper,
  Td,
  Th,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMonthDay, formatTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Payment" };

const PER_PAGE = 10;

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank Transfer",
  EWALLET: "E-wallet",
  OTHER: "Other",
};

const statusTone = {
  PENDING: "warning",
  PAID: "success",
  REJECTED: "danger",
} as const;

const statusLabel = {
  PENDING: "Pending",
  PAID: "Verified",
  REJECTED: "Rejected",
} as const;

export default async function HomeownerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; page?: string }>;
}) {
  const user = await requireRole("HOMEOWNER");
  const { submitted, page } = await searchParams;
  const householdId = user.householdId;

  if (!householdId) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Payment"
          description="Pay your dues with GCash."
        />
        <Alert tone="warning" title="Your account isn’t linked yet">
          Please contact the HOA office so we can connect your account to your home.
        </Alert>
      </div>
    );
  }

  const [total, channel] = await Promise.all([
    prisma.payment.count({ where: { householdId } }),
    prisma.paymentChannel.findFirst({
      where: { isActive: true, type: "GCASH" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const from = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const to = Math.min(currentPage * PER_PAGE, total);

  const payments = await prisma.payment.findMany({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    include: { due: true },
    skip: (currentPage - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payment"
        description="Pay your dues with GCash, then send us the reference number."
      />

      {submitted ? (
        <Alert tone="success" title="Payment sent!">
          We’ll verify it shortly. You can track its status below.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Submit a payment</CardTitle>
          <CardDescription>
            Enter the details from your GCash receipt.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          {channel ? (
            <p className="rounded-md border border-line bg-cream px-4 py-3 text-sm text-muted">
              <span className="font-medium text-ink">
                {channel.name}:
              </span>{" "}
              {channel.accountName} · {channel.accountNumber}
            </p>
          ) : null}

          <PaymentForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My payments</CardTitle>
          <CardDescription>
            {total === 0
              ? "Track your payments here."
              : `Showing ${from}–${to} of ${total}`}
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Once you pay, you can follow its status here."
              className="mx-5 my-5"
            />
          ) : (
            <>
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Submitted</Th>
                      <Th>Invoice</Th>
                      <Th>Amount</Th>
                      <Th>Method</Th>
                      <Th>Reference</Th>
                      <Th>Status</Th>
                      <Th>Note</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <Td className="whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                          <p className="mt-0.5 text-xs text-muted">
                            {formatTime(payment.createdAt)}
                          </p>
                        </Td>
                        <Td className="whitespace-nowrap">
                          {payment.due
                            ? `Due ${formatMonthDay(payment.due.dueDate)}`
                            : "—"}
                        </Td>
                        <Td className="whitespace-nowrap tabular">
                          {formatPeso(Number(payment.amount))}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {methodLabels[payment.method] ?? payment.method}
                        </Td>
                        <Td>
                          <span className="font-mono text-xs">
                            {payment.referenceNumber ?? "N/A"}
                          </span>
                          {payment.receiptUrl ? (
                            <a
                              href={`/api/payments/${payment.id}/receipt`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 block text-xs text-forest underline-offset-2 hover:underline"
                            >
                              Receipt
                            </a>
                          ) : null}
                        </Td>
                        <Td>
                          <Badge tone={statusTone[payment.status]}>
                            {statusLabel[payment.status]}
                          </Badge>
                        </Td>
                        <Td className="max-w-48 text-xs text-muted">
                          {payment.rejectionReason ?? payment.notes ?? "—"}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>

              {pageCount > 1 ? (
                <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
                  <p className="text-xs text-muted">
                    Showing {from}–{to} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <PageLink page={currentPage - 1} disabled={currentPage === 1}>
                      Prev
                    </PageLink>
                    <span className="text-xs text-muted">
                      {currentPage} / {pageCount}
                    </span>
                    <PageLink
                      page={currentPage + 1}
                      disabled={currentPage === pageCount}
                    >
                      Next
                    </PageLink>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: string;
}) {
  const className = "rounded-md border border-line px-2.5 py-1 text-xs";

  if (disabled) {
    return (
      <span className={cn(className, "text-muted opacity-50")}>{children}</span>
    );
  }

  return (
    <Link
      href={`/app/payments?page=${page}`}
      className={cn(className, "text-forest hover:bg-forest-soft")}
    >
      {children}
    </Link>
  );
}

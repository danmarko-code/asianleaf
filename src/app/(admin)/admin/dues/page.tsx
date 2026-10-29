import type { Metadata } from "next";
import {
  generateDuesAction,
  runRemindersAction,
  waiveDueAction,
} from "@/app/(admin)/admin/dues/actions";
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
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { MONTHLY_DUES } from "@/lib/constants";
import { formatMonthDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  currentMonthKey,
  isValidMonthKey,
  periodFromMonthKey,
} from "@/lib/dues";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Dues" };

const statusTone = {
  UNPAID: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  WAIVED: "neutral",
} as const;

export default async function AdminDuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    notice?: string;
    error?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const query = await searchParams;
  const month = isValidMonthKey(query.month ?? "")
    ? (query.month as string)
    : currentMonthKey();
  const periodStart = periodFromMonthKey(month);

  const [dues, households] = await Promise.all([
    prisma.due.findMany({
      where: { periodStart },
      orderBy: { household: { unitAddress: "asc" } },
      include: {
        household: { select: { id: true, unitAddress: true } },
        payments: {
          where: { status: "PAID" },
          select: { amount: true },
        },
      },
    }),
    prisma.household.count(),
  ]);

  const rows = dues.map((due) => {
    const paid = due.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );
    return {
      due,
      paid,
      balance: Math.max(Number(due.amount) - paid, 0),
    };
  });

  const billed = rows.reduce((total, row) => total + Number(row.due.amount), 0);
  const collected = rows.reduce((total, row) => total + row.paid, 0);
  const outstanding = rows.reduce((total, row) => total + row.balance, 0);
  const openCount = rows.filter(
    (row) => row.due.status === "UNPAID" || row.due.status === "PARTIALLY_PAID",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Collections"
        title="Dues and reminders"
        description="Generate the monthly billing run, track balances and send reminders."
      />

      {query.notice ? <Alert tone="success">{query.notice}</Alert> : null}
      {query.error ? <Alert tone="danger">{query.error}</Alert> : null}

      <Alert tone="info" title="Partial payments are allowed">
        Each household is billed {formatPeso(MONTHLY_DUES)} on the 5th. A due
        stays open until the paid amount reaches the full amount. Reminders are
        de-duplicated per billing period and repeat weekly while overdue.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Households"
          value={String(households)}
          hint="Every household is billed."
        />
        <StatCard
          label="Billed this month"
          value={formatPeso(billed)}
          hint={`${rows.length} due record${rows.length === 1 ? "" : "s"}.`}
        />
        <StatCard
          label="Collected"
          value={formatPeso(collected)}
          hint="Approved payments only."
        />
        <StatCard
          label="Outstanding"
          value={formatPeso(outstanding)}
          hint={`${openCount} open due${openCount === 1 ? "" : "s"}.`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing run</CardTitle>
          <CardDescription>
            Generation is safe to repeat; existing dues are skipped.
          </CardDescription>
        </CardHeader>
        <CardBody className="grid gap-4 lg:grid-cols-2">
          <form action={generateDuesAction} className="space-y-3">
            <Input
              label="Billing month"
              name="month"
              type="month"
              defaultValue={month}
              required
            />
            <Button type="submit" size="sm">
              Generate dues
            </Button>
          </form>

          <form action={runRemindersAction} className="space-y-3">
            <input type="hidden" name="month" value={month} />
            <div>
              <p className="text-sm font-medium text-ink">Send reminders</p>
              <p className="mt-1 text-xs text-muted">
                Creates in-app notices and writes the outbound message to the
                server log. Already-sent reminders are skipped.
              </p>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Run reminders now
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dues for {month}</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "No dues generated for this month yet."
              : `${rows.length} household${rows.length === 1 ? "" : "s"} billed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {rows.length === 0 ? (
            <EmptyState
              title="No dues for this month"
              description="Choose a billing month above and generate the run."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Household</Th>
                    <Th>Due date</Th>
                    <Th>Amount</Th>
                    <Th>Paid</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ due, paid, balance }) => (
                    <tr key={due.id}>
                      <Td>{due.household.unitAddress}</Td>
                      <Td>{formatMonthDay(due.dueDate)}</Td>
                      <Td className="tabular">{formatPeso(Number(due.amount))}</Td>
                      <Td className="tabular">{formatPeso(paid)}</Td>
                      <Td className="tabular">{formatPeso(balance)}</Td>
                      <Td>
                        <Badge tone={statusTone[due.status]}>
                          {due.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td>
                        {due.status === "UNPAID" ||
                        due.status === "PARTIALLY_PAID" ? (
                          <form action={waiveDueAction}>
                            <input type="hidden" name="dueId" value={due.id} />
                            <Button type="submit" size="sm" variant="ghost">
                              Waive
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted">—</span>
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

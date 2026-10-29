import type { Metadata } from "next";
import {
  createBudgetEntryAction,
  deleteBudgetEntryAction,
} from "@/app/(admin)/admin/budget/actions";
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
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate, manilaNow, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Budget" };

export default async function AdminBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireRole("ADMIN");
  const { notice, error } = await searchParams;

  const { year, month } = manilaNow();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const [entries, monthEntries] = await Promise.all([
    prisma.budgetEntry.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { createdBy: { select: { email: true } } },
    }),
    prisma.budgetEntry.findMany({
      where: { occurredAt: { gte: monthStart, lt: monthEnd } },
    }),
  ]);

  const income = monthEntries
    .filter((entry) => entry.type === "INCOME")
    .reduce((total, entry) => total + Number(entry.amount), 0);
  const expenses = monthEntries
    .filter((entry) => entry.type === "EXPENSE")
    .reduce((total, entry) => total + Number(entry.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transparency"
        title="Budget report"
        description="Income and expenses reported to homeowners, with monthly totals."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Income this month"
          value={formatPeso(income)}
          hint={`${monthEntries.filter((entry) => entry.type === "INCOME").length} entries.`}
        />
        <StatCard
          label="Expenses this month"
          value={formatPeso(expenses)}
          hint={`${monthEntries.filter((entry) => entry.type === "EXPENSE").length} entries.`}
        />
        <StatCard
          label="Net this month"
          value={formatPeso(income - expenses)}
          hint="Income minus expenses."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add entry</CardTitle>
          <CardDescription>
            Homeowners see this report on their Transparency page.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={createBudgetEntryAction} className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <Select label="Type" name="type" defaultValue="EXPENSE">
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Input
                label="Category"
                name="category"
                required
                minLength={2}
                maxLength={80}
                placeholder="Security"
              />
            </div>
            <div className="lg:col-span-4">
              <Input
                label="Description"
                name="description"
                required
                minLength={2}
                maxLength={300}
                placeholder="Guard services, first half of the month"
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                label="Amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="lg:col-span-3">
              <Input
                label="Date"
                name="occurredAt"
                type="date"
                defaultValue={todayInputValue()}
                required
              />
            </div>
            <div className="flex items-end lg:col-span-2">
              <Button type="submit" size="sm" className="w-full">
                Add entry
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
          <CardDescription>
            The latest 100 income and expense records.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {entries.length === 0 ? (
            <EmptyState
              title="No budget entries yet"
              description="Add the first income or expense record above."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th>Amount</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <Td>{formatDate(entry.occurredAt)}</Td>
                      <Td>
                        <Badge
                          tone={entry.type === "INCOME" ? "success" : "warning"}
                        >
                          {entry.type === "INCOME" ? "Income" : "Expense"}
                        </Badge>
                      </Td>
                      <Td>{entry.category}</Td>
                      <Td>
                        <p className="max-w-80 text-sm">{entry.description}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          by {entry.createdBy.email}
                        </p>
                      </Td>
                      <Td className="tabular">
                        {formatPeso(Number(entry.amount))}
                      </Td>
                      <Td>
                        <form action={deleteBudgetEntryAction}>
                          <input
                            type="hidden"
                            name="entryId"
                            value={entry.id}
                          />
                          <Button type="submit" size="sm" variant="ghost">
                            Delete
                          </Button>
                        </form>
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

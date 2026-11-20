import type { Metadata } from "next";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate, manilaNow } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Transparency" };

export default async function HomeownerBudgetPage() {
  await requireRole("HOMEOWNER");

  const { year, month } = manilaNow();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const [entries, monthEntries] = await Promise.all([
    prisma.budgetEntry.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 100,
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
    <div className="space-y-5">
      <PageHeader
        title="Transparency"
        description="See how the association’s funds are used."
      />

      

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Income this month" value={formatPeso(income)} />
        <StatCard label="Expenses this month" value={formatPeso(expenses)} />
        <StatCard label="Net this month" value={formatPeso(income - expenses)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
          <CardDescription>The latest income and expenses.</CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {entries.length === 0 ? (
            <EmptyState
              title="Nothing posted yet"
              description="Budget updates from the treasurer will appear here."
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
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <Td>{formatDate(entry.occurredAt)}</Td>
                      <Td>
                        {entry.type === "INCOME" ? "Income" : "Expense"}
                      </Td>
                      <Td>{entry.category}</Td>
                      <Td>
                        <p className="max-w-72 text-sm">{entry.description}</p>
                      </Td>
                      <Td className="tabular">
                        {formatPeso(Number(entry.amount))}
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

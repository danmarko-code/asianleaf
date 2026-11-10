import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
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
import { formatDate } from "@/lib/dates";
import { buildReport, isReportKey, REPORT_KEYS } from "@/lib/reports";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

const labels: Record<(typeof REPORT_KEYS)[number], string> = {
  unpaid: "Unpaid dues",
  inactive: "Inactive members",
  violations: "Open violations",
  payments: "Payments",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; from?: string; to?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const active = isReportKey(params.report) ? params.report : "unpaid";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const table = await buildReport(active, from || undefined, to || undefined);

  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const exportHref = `/admin/reports/export?report=${active}${
    query.size ? `&${query.toString()}` : ""
  }`;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Reporting"
          title="Reports"
          description="Export or print the lists the association needs: unpaid dues, inactive members, open violations and payments."
        />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {REPORT_KEYS.map((key) => {
          const href = `/admin/reports?report=${key}${
            query.size ? `&${query.toString()}` : ""
          }`;
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                key === active
                  ? "border-forest bg-forest text-white"
                  : "border-line bg-surface text-ink hover:border-forest",
              )}
            >
              {labels[key]}
            </Link>
          );
        })}
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Dates apply to the payment date, violation issue date and due date
            depending on the report. Leave blank for everything.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <input type="hidden" name="report" value={active} />
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">From</span>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">To</span>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-md bg-forest px-4 text-sm font-medium text-white"
            >
              Apply
            </button>
            {from || to ? (
              <Link
                href={`/admin/reports?report=${active}`}
                className="h-11 rounded-md border border-line px-4 text-sm font-medium leading-[2.75rem] text-ink"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="print:border-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{table.title}</CardTitle>
              <CardDescription>
                {table.description} {table.rows.length} row
                {table.rows.length === 1 ? "" : "s"}.
              </CardDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              <PrintButton />
              <a
                href={exportHref}
                className="inline-flex h-11 items-center rounded-md bg-forest px-4 text-sm font-medium text-white"
              >
                Download CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-0 py-0 print:px-0">
          {table.rows.length === 0 ? (
            <EmptyState
              title="Nothing to report"
              description="No records match this report and date range."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <Th key={column}>{column}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <Td
                          key={cellIndex}
                          className={cellIndex === 0 ? "font-medium" : undefined}
                        >
                          {cell || "—"}
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-muted print:block">
        Generated {formatDate(new Date())} · Asian Leaf Homeowners Association
      </p>
    </div>
  );
}

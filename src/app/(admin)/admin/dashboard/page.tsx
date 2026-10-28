import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { manilaNow } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const { year, month } = manilaNow();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const [
    homeowners,
    collected,
    unpaidDues,
    pendingRequests,
    pendingPayments,
    openViolations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "HOMEOWNER", status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.due.count({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    }),
    prisma.registrationRequest.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.violation.count({ where: { status: "OPEN" } }),
  ]);

  const attention = [
    {
      href: "/admin/payments",
      label: "Payments waiting for verification",
      value: pendingPayments,
    },
    {
      href: "/admin/violations",
      label: "Open violations",
      value: openViolations,
    },
    {
      href: "/admin/requests",
      label: "Pending registration requests",
      value: pendingRequests,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Collections, unpaid dues and community notices for the association."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Homeowners"
          value={String(homeowners)}
          hint="Active homeowner logins."
        />
        <StatCard
          label="Collected this month"
          value={formatPeso(Number(collected._sum.amount ?? 0))}
          hint="Approved payments only."
        />
        <StatCard
          label="Unpaid dues"
          value={String(unpaidDues)}
          hint="Includes partial payments and overdue balances."
        />
        <StatCard
          label="Pending requests"
          value={String(pendingRequests)}
          hint="Registration approvals still waiting."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-line px-0 py-0">
          {attention.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.label}</p>
              </div>
              <span className="tabular text-sm font-medium text-forest">
                {item.value}
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

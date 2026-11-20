import type { Metadata } from "next";
import Link from "next/link";
import {
  CollectionsTrendChart,
  ProportionBar,
} from "@/components/admin/dashboard-charts";
import {
  AlertIcon,
  ArrowRightIcon,
  ChartIcon,
  CheckIcon,
  HomeIcon,
  InboxIcon,
  MessageIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Hero } from "@/components/ui/hero";
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

  // Build 6 months trend intervals
  const monthsTrendIntervals = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(Date.UTC(year, month - 1 - i, 1));
    const end = new Date(Date.UTC(year, month - i, 1));
    const label = start.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    monthsTrendIntervals.push({
      start,
      end,
      label,
      isCurrent: i === 0,
    });
  }

  const [
    homeowners,
    collected,
    unpaidDues,
    pendingPayments,
    openViolations,
    resolvedViolations,
    members,
    households,
    budgetEntries,
    newFeedback,
    inactiveMembers,
    auditEntries,
    currentMonthDues,
    trendPayments,
    ownerMembers,
    tenantMembers,
    petCount,
    vehicleCount,
    kasambahayCount,
    paidPaymentsCount,
    rejectedPaymentsCount,
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
      where: { status: "UNPAID" },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.violation.count({ where: { status: "OPEN" } }),
    prisma.violation.count({ where: { status: "RESOLVED" } }),
    prisma.member.count(),
    prisma.household.count(),
    prisma.budgetEntry.count(),
    prisma.feedback.count({ where: { status: "NEW" } }),
    prisma.member.count({ where: { status: "INACTIVE" } }),
    prisma.auditLog.count(),
    prisma.due.findMany({
      where: { periodStart: monthStart },
      select: {
        amount: true,
        status: true,
        payments: {
          where: { status: "PAID" },
          select: { amount: true },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: {
          gte: monthsTrendIntervals[0].start,
          lt: monthsTrendIntervals[monthsTrendIntervals.length - 1].end,
        },
      },
      select: { amount: true, paidAt: true },
    }),
    prisma.member.count({ where: { occupancyType: "OWNER_OCCUPIED" } }),
    prisma.member.count({ where: { occupancyType: "TENANT" } }),
    prisma.pet.count(),
    prisma.vehicle.count(),
    prisma.kasambahay.count(),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "REJECTED" } }),
  ]);

  // Aggregate monthly trend data
  const trendData = monthsTrendIntervals.map((interval) => {
    const total = trendPayments
      .filter(
        (p) =>
          p.paidAt &&
          p.paidAt >= interval.start &&
          p.paidAt < interval.end,
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      label: interval.label,
      amount: total,
      isCurrent: interval.isCurrent,
    };
  });

  // Calculate current month dues collection metrics
  const totalBilledThisMonth = currentMonthDues.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );
  const totalCollectedThisMonth = Number(collected._sum.amount ?? 0);
  const paidDuesCount = currentMonthDues.filter((d) => d.status === "PAID").length;
  const unpaidDuesThisMonth = currentMonthDues.filter(
    (d) => d.status === "UNPAID",
  ).length;

  const sections = [
    {
      href: "/admin/members",
      label: "Members",
      value: String(members),
      hint: `in ${households} homes · ${inactiveMembers} inactive`,
      icon: UsersIcon,
      tone: "forest",
    },
    {
      href: "/admin/dues",
      label: "Dues",
      value: String(unpaidDues),
      hint: "Unpaid",
      icon: ReceiptIcon,
      tone: unpaidDues > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/payments",
      label: "Payments",
      value: String(pendingPayments),
      hint: pendingPayments > 0 ? "To verify" : "All clear",
      icon: WalletIcon,
      tone: pendingPayments > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/budget",
      label: "Budget",
      value: String(budgetEntries),
      hint: "Entries",
      icon: ChartIcon,
      tone: "forest",
    },
    {
      href: "/admin/violations",
      label: "Violations",
      value: String(openViolations),
      hint: "Open",
      icon: AlertIcon,
      tone: openViolations > 0 ? "danger" : "forest",
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      value: String(newFeedback),
      hint: "New",
      icon: MessageIcon,
      tone: newFeedback > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/reports",
      label: "Reports",
      value: "CSV",
      hint: "& print",
      icon: InboxIcon,
      tone: "forest",
    },
    {
      href: "/admin/audit",
      label: "Audit log",
      value: String(auditEntries),
      hint: "Entries",
      icon: HomeIcon,
      tone: "forest",
    },
  ];

  const rate =
    totalBilledThisMonth > 0
      ? Math.round((totalCollectedThisMonth / totalBilledThisMonth) * 100)
      : 0;

  const todos = [
    pendingPayments > 0 && {
      href: "/admin/payments",
      label: `${pendingPayments} payment${pendingPayments === 1 ? "" : "s"} to verify`,
      tone: "warning" as const,
      icon: WalletIcon,
    },
    openViolations > 0 && {
      href: "/admin/violations",
      label: `${openViolations} open violation${openViolations === 1 ? "" : "s"}`,
      tone: "danger" as const,
      icon: AlertIcon,
    },
    newFeedback > 0 && {
      href: "/admin/feedback",
      label: `${newFeedback} new feedback`,
      tone: "warning" as const,
      icon: MessageIcon,
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    tone: "warning" | "danger";
    icon: typeof WalletIcon;
  }[];

  return (
    <div className="space-y-6">
      <Hero eyebrow="Collected this month">
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tabular font-serif text-5xl font-semibold leading-none tracking-tight">
              {formatPeso(totalCollectedThisMonth)}
            </p>
            <p className="mt-2 text-sm opacity-80">
              of {formatPeso(totalBilledThisMonth)} · {paidDuesCount} paid ·{" "}
              {unpaidDuesThisMonth} unpaid
            </p>
          </div>
          <p className="tabular text-sm font-semibold">
            {rate}%
          </p>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-lime"
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
      </Hero>

      {todos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {todos.map((todo) => {
            const Icon = todo.icon;
            return (
              <Link
                key={todo.href}
                href={todo.href}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  todo.tone === "danger"
                    ? "bg-red-soft text-red"
                    : "bg-amber-soft text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {todo.label}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CheckIcon className="h-4 w-4 text-leaf" />
          All caught up
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {sections.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="tile flex items-center gap-3 rounded-lg border border-line bg-surface p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-forest-soft text-forest">
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.label}
                </p>
                <p className="truncate text-xs text-muted">
                  <span
                    className={`tabular font-semibold ${
                      item.tone === "danger"
                        ? "text-red"
                        : item.tone === "warning"
                          ? "text-amber"
                          : "text-forest"
                    }`}
                  >
                    {item.value}
                  </span>{" "}
                  {item.hint}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardBody>
            <CollectionsTrendChart data={trendData} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Residents</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProportionBar
              title="Occupancy"
              segments={[
                { label: "Owners", value: ownerMembers, color: "bg-forest" },
                { label: "Tenants", value: tenantMembers, color: "bg-leaf" },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{kasambahayCount} Kasambahay</Badge>
              <Badge tone="neutral">{vehicleCount} Vehicles</Badge>
              <Badge tone="neutral">{petCount} Pets</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Violations</CardTitle>
          </CardHeader>
          <CardBody>
            <ProportionBar
              title="Status"
              segments={[
                { label: "Resolved", value: resolvedViolations, color: "bg-forest" },
                {
                  label: "Open",
                  value: openViolations,
                  color: "bg-amber",
                  textColor: "text-amber",
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>{homeowners} active logins</CardDescription>
          </CardHeader>
          <CardBody>
            <ProportionBar
              title="Review"
              segments={[
                { label: "Approved", value: paidPaymentsCount, color: "bg-forest" },
                {
                  label: "Pending",
                  value: pendingPayments,
                  color: "bg-amber",
                  textColor: "text-amber",
                },
                { label: "Rejected", value: rejectedPaymentsCount, color: "bg-line" },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

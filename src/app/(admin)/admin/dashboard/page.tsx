import type { Metadata } from "next";
import Link from "next/link";
import {
  CollectionRateMeter,
  CollectionsTrendChart,
  ProportionBar,
} from "@/components/admin/dashboard-charts";
import {
  AlertIcon,
  ArrowRightIcon,
  ChartIcon,
  HomeIcon,
  InboxIcon,
  MessageIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { manilaNow } from "@/lib/dates";
import { prisma } from "@/lib/db";

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
      hint: `${households} households · ${inactiveMembers} inactive`,
      icon: UsersIcon,
      tone: "forest",
    },
    {
      href: "/admin/dues",
      label: "Dues",
      value: String(unpaidDues),
      hint: `${unpaidDues} unpaid account${unpaidDues === 1 ? "" : "s"}`,
      icon: ReceiptIcon,
      tone: unpaidDues > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/payments",
      label: "Payments",
      value: String(pendingPayments),
      hint:
        pendingPayments > 0
          ? `${pendingPayments} pending verification`
          : "All verified",
      icon: WalletIcon,
      tone: pendingPayments > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/budget",
      label: "Budget",
      value: String(budgetEntries),
      hint: "Income & expense tracker",
      icon: ChartIcon,
      tone: "forest",
    },
    {
      href: "/admin/violations",
      label: "Violations",
      value: String(openViolations),
      hint:
        openViolations > 0
          ? `${openViolations} open notices`
          : "Zero open notices",
      icon: AlertIcon,
      tone: openViolations > 0 ? "danger" : "forest",
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      value: String(newFeedback),
      hint: newFeedback > 0 ? `${newFeedback} new message(s)` : "Up to date",
      icon: MessageIcon,
      tone: newFeedback > 0 ? "warning" : "forest",
    },
    {
      href: "/admin/reports",
      label: "Reports",
      value: "Export",
      hint: "Unpaid dues, audits & CSV",
      icon: InboxIcon,
      tone: "forest",
    },
    {
      href: "/admin/audit",
      label: "Audit log",
      value: String(auditEntries),
      hint: "Privileged actions logged",
      icon: HomeIcon,
      tone: "forest",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Visual overview of collections, community compliance and operations."
      />

      {/* Action alerts if items need attention */}
      {pendingPayments > 0 || openViolations > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {pendingPayments > 0 && (
            <Alert tone="warning" title="Payments awaiting verification" className="flex-1">
              There {pendingPayments === 1 ? "is" : "are"} {pendingPayments}{" "}
              pending GCash payment{pendingPayments === 1 ? "" : "s"} waiting for
              treasurer approval.{" "}
              <Link
                href="/admin/payments"
                className="font-medium underline underline-offset-2"
              >
                Review now
              </Link>
            </Alert>
          )}
          {openViolations > 0 && (
            <Alert tone="danger" title="Open violation notices" className="flex-1">
              {openViolations} violation notice{openViolations === 1 ? "" : "s"}{" "}
              active in the community.{" "}
              <Link
                href="/admin/violations"
                className="font-medium underline underline-offset-2"
              >
                View notices
              </Link>
            </Alert>
          )}
        </div>
      ) : null}

      {/* Primary Visual Row: 6-Month Trend & Monthly Collection Gauge */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 6-Month Trend Chart */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Collections Trend</CardTitle>
            <CardDescription>
              Verified GCash payments received over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <CollectionsTrendChart data={trendData} />
          </CardBody>
        </Card>

        {/* Current Month Rate Meter */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Current Month Collection</CardTitle>
            <CardDescription>
              Collection rate and breakdown for the active billing cycle.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <CollectionRateMeter
              billed={totalBilledThisMonth}
              collected={totalCollectedThisMonth}
              unpaidCount={unpaidDuesThisMonth}
              paidCount={paidDuesCount}
            />
          </CardBody>
        </Card>
      </div>

      {/* Secondary Visual Row: Community Breakdown & Operational Indicators */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Occupancy Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy & Residents</CardTitle>
            <CardDescription>
              Household residency status and community composition.
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProportionBar
              title="Residency breakdown"
              segments={[
                {
                  label: "Owners",
                  value: ownerMembers,
                  color: "bg-forest",
                },
                {
                  label: "Tenants",
                  value: tenantMembers,
                  color: "bg-leaf",
                },
              ]}
            />
            <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
              <Badge tone="neutral">
                {kasambahayCount} Kasambahay
              </Badge>
              <Badge tone="neutral">
                {vehicleCount} Vehicles
              </Badge>
              <Badge tone="neutral">
                {petCount} Pets
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Violations & Compliance Meter */}
        <Card>
          <CardHeader>
            <CardTitle>Community Compliance</CardTitle>
            <CardDescription>
              Status of all issued community notices and violations.
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProportionBar
              title="Violation resolution"
              segments={[
                {
                  label: "Resolved",
                  value: resolvedViolations,
                  color: "bg-forest",
                },
                {
                  label: "Open notices",
                  value: openViolations,
                  color: "bg-amber",
                  textColor: "text-amber",
                },
              ]}
            />
            <p className="text-xs text-muted pt-2 border-t border-line">
              {openViolations === 0
                ? "All community violations have been resolved."
                : `${openViolations} notice${openViolations === 1 ? "" : "s"} require member settlement or review.`}
            </p>
          </CardBody>
        </Card>

        {/* Payment Verification Health */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Payment Processing</CardTitle>
            <CardDescription>
              GCash payment submission flow and review status.
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <ProportionBar
              title="Payment review status"
              segments={[
                {
                  label: "Approved",
                  value: paidPaymentsCount,
                  color: "bg-forest",
                },
                {
                  label: "Pending",
                  value: pendingPayments,
                  color: "bg-amber",
                  textColor: "text-amber",
                },
                {
                  label: "Rejected",
                  value: rejectedPaymentsCount,
                  color: "bg-line",
                },
              ]}
            />
            <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
              <span className="text-muted">Homeowner accounts:</span>
              <span className="font-semibold text-ink">
                {homeowners} active logins
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Interactive Quick Navigation Grid */}
      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold text-ink">
          Operational Areas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col justify-between rounded-lg border border-line bg-surface p-4 shadow-card transition-all hover:border-forest/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cream text-forest group-hover:bg-forest group-hover:text-cream transition-colors">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span
                    className={`tabular text-base font-bold ${
                      item.tone === "danger"
                        ? "text-red"
                        : item.tone === "warning"
                          ? "text-amber"
                          : "text-forest"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink group-hover:text-forest transition-colors">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
                </div>
                <div className="mt-3 flex items-center justify-end text-xs font-medium text-forest opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Open</span>
                  <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

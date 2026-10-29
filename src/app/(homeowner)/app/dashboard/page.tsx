import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { MONTHLY_DUES } from "@/lib/constants";
import { formatDate, formatMonthDay, greetingForHour, manilaNow } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Home" };

const links = [
  {
    href: "/app/profile",
    title: "Household profile",
    description: "Contact details, kasambahay, pets, vehicles and household members.",
  },
  {
    href: "/app/change-password",
    title: "Change password",
    description: "Confirm the change with a one-time code sent to your email.",
  },
  {
    href: "/app/budget",
    title: "Transparency report",
    description: "See the association income and expenses posted by the treasurer.",
  },
  {
    href: "/app/feedback",
    title: "Send feedback",
    description: "Report an issue or suggest an improvement to the association.",
  },
];

export default async function HomeownerDashboardPage() {
  const user = await requireRole("HOMEOWNER");
  const greeting = greetingForHour(manilaNow().hour);
  const name = user.member?.firstName ?? "Homeowner";
  const householdId = user.householdId;

  if (!householdId) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Asian Leaf HOA"
          title={`${greeting}, ${name}.`}
          description="Your account is not linked to a household yet."
        />
        <Alert tone="warning" title="Household link missing">
          Contact the association office so your login can be linked to your
          unit.
        </Alert>
      </div>
    );
  }

  const [due, openViolations, notifications] = await Promise.all([
    prisma.due.findFirst({
      where: {
        householdId,
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      orderBy: { dueDate: "asc" },
      include: {
        payments: {
          where: { status: "PAID" },
          select: { amount: true },
        },
      },
    }),
    prisma.violation.findMany({
      where: { householdId, status: "OPEN" },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const balance = due
    ? Number(due.amount) -
      due.payments.reduce((total, payment) => total + Number(payment.amount), 0)
    : 0;

  const violation = openViolations[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Asian Leaf HOA"
        title={`${greeting}, ${name}.`}
        description={
          user.household?.unitAddress
            ? `${user.household.unitAddress}. Here is your household at a glance.`
            : "Here is your household at a glance."
        }
      />

      {violation ? (
        <Alert
          tone="danger"
          title={
            violation.kind === "PAYMENT_REQUIRED"
              ? `Payment required: ${violation.category}`
              : `Warning: ${violation.category}`
          }
        >
          <p>{violation.description}</p>
          <p className="mt-2 text-xs">
            Issued {formatDate(violation.issuedAt)}
            {violation.fineAmount
              ? ` · Fine ${formatPeso(Number(violation.fineAmount))}`
              : ""}
            {violation.dueDate
              ? ` · Due ${formatMonthDay(violation.dueDate)}`
              : ""}
          </p>
          <Link
            href="/app/violations"
            className="mt-2 inline-block text-sm font-medium text-forest underline underline-offset-4"
          >
            View violation details
          </Link>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{due ? "Next dues" : "Dues"}</CardTitle>
            <CardDescription>
              Billed per household on the 5th of each month.
            </CardDescription>
          </div>
          <Badge tone={due ? "warning" : "success"}>
            {due ? (balance < Number(due.amount) ? "Partially paid" : "Unpaid") : "Paid up"}
          </Badge>
        </CardHeader>
        <CardBody>
          {due ? (
            <>
              <p className="tabular font-serif text-4xl text-forest">
                {formatPeso(balance)}
              </p>
              <p className="mt-2 text-sm text-muted">
                Billing period starts {formatMonthDay(due.periodStart)}. Due{" "}
                {formatMonthDay(due.dueDate)}. Full dues are{" "}
                {formatPeso(Number(due.amount))}; partial payments are allowed.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/app/payments" className={buttonStyles()}>
                  Pay dues
                </Link>
                <p className="text-xs text-muted">
                  Scan the HOA GCash QR, then submit your reference number for
                  verification.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="tabular font-serif text-4xl text-forest">
                {formatPeso(0)}
              </p>
              <p className="mt-2 text-sm text-muted">
                No open balance right now. The next billing period is{" "}
                {formatPeso(MONTHLY_DUES)}.
              </p>
              <div className="mt-5">
                <Link
                  href="/app/payments"
                  className={buttonStyles({ variant: "secondary" })}
                >
                  View payment history
                </Link>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {openViolations.length > 1 ? (
        <p className="text-sm text-muted">
          You have {openViolations.length} open violations.{" "}
          <Link
            href="/app/violations"
            className="text-forest underline underline-offset-4"
          >
            Review all
          </Link>
        </p>
      ) : null}

      {notifications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Dues reminders and updates from the association.
            </CardDescription>
          </CardHeader>
          <CardBody className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-md border border-line px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {notification.title}
                  </p>
                  {notification.readAt ? null : (
                    <Badge tone="warning">New</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">{notification.body}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <Card className="divide-y divide-line">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{link.title}</p>
              <p className="mt-1 text-xs text-muted">{link.description}</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        ))}
      </Card>
    </div>
  );
}

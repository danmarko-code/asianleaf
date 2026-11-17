import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  MessageIcon,
  WalletIcon,
} from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { Hero } from "@/components/ui/hero";
import { requireRole } from "@/lib/auth";
import { formatDate, greetingForHour, manilaNow } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Home" };

const actions = [
  { href: "/app/payments", label: "Payments", icon: WalletIcon },
  { href: "/app/violations", label: "Notices", icon: AlertIcon },
  { href: "/app/budget", label: "Budget", icon: ChartIcon },
  { href: "/app/feedback", label: "Feedback", icon: MessageIcon },
];

export default async function HomeownerDashboardPage() {
  const user = await requireRole("HOMEOWNER");
  const greeting = greetingForHour(manilaNow().hour);
  const name = user.member?.firstName ?? "Homeowner";
  const householdId = user.householdId;

  if (!householdId) {
    return (
      <div className="space-y-5">
        <Alert tone="warning" title="Your account isn’t linked yet">
          Please contact the HOA office so we can connect your account to your home.
        </Alert>
      </div>
    );
  }

  const [due, openViolations, notifications] = await Promise.all([
    prisma.due.findFirst({
      where: { householdId, status: "UNPAID" },
      orderBy: { dueDate: "asc" },
      include: {
        payments: { where: { status: "PAID" }, select: { amount: true } },
      },
    }),
    prisma.violation.findMany({
      where: { householdId, status: "OPEN" },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const balance = due
    ? Number(due.amount) -
      due.payments.reduce((total, payment) => total + Number(payment.amount), 0)
    : 0;

  const violation = openViolations[0];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Home</h1>
      <p className="font-serif text-3xl font-semibold tracking-tight text-ink">
        {greeting}, {name}
      </p>

      <Hero>
        <p className="text-sm opacity-80">
          {due ? "Balance due" : "Your dues"}
        </p>
        <p className="tabular mt-1 font-serif text-5xl font-semibold tracking-tight">
          {formatPeso(due ? balance : 0)}
        </p>
        {due ? (
          <>
            <p className="mt-1 text-sm opacity-80">
              Due {formatDate(due.dueDate)}
            </p>
            <Link
              href="/app/payments"
              className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-lime text-sm font-semibold text-[#1a220f] sm:w-auto sm:px-8"
            >
              Pay now
            </Link>
          </>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
            <CheckIcon className="h-4 w-4" />
            You’re all paid up
          </p>
        )}
      </Hero>

      {violation ? (
        <Alert
          tone="danger"
          title={
            violation.kind === "PAYMENT_REQUIRED"
              ? `Payment required: ${violation.category}`
              : `Warning: ${violation.category}`
          }
        >
          <Link
            href="/app/violations"
            className="text-sm font-medium underline underline-offset-4"
          >
            {openViolations.length === 1
              ? "View the notice"
              : `View all ${openViolations.length} notices`}
          </Link>
        </Alert>
      ) : null}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="tile flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-1 py-3 text-center sm:p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-soft text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-ink">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      {notifications.length > 0 ? (
        <Card className="divide-y divide-line">
          <p className="px-5 pb-2 pt-4 font-serif text-lg font-semibold tracking-tight text-ink">
            Latest updates
          </p>
          {notifications.map((notification) => (
            <CardBody
              key={notification.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <p className="min-w-0 truncate text-sm text-ink">
                {notification.title}
              </p>
              <span className="shrink-0 text-[11px] text-muted">
                {formatDate(notification.createdAt)}
              </span>
            </CardBody>
          ))}
        </Card>
      ) : null}

    </div>
  );
}

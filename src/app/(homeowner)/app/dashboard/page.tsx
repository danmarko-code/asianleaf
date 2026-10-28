import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MONTHLY_DUES } from "@/lib/constants";
import { formatMonthDay, greetingForHour, manilaNow, nextDueDate } from "@/lib/dates";
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
    description: "Confirm the change with a one-time code sent by SMS or email.",
  },
  {
    href: "/app/feedback",
    title: "Send feedback",
    description: "Report an issue or suggest an improvement to the association.",
  },
];

export default function HomeownerDashboardPage() {
  const greeting = greetingForHour(manilaNow().hour);
  const dueDate = nextDueDate();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Asian Leaf HOA"
        title={`${greeting}.`}
        description="Sign in to see your household balance, payment history and reminders."
      />

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Next dues</CardTitle>
            <CardDescription>Billed per household on the 5th of each month.</CardDescription>
          </div>
          <Badge tone="warning">Sign-in required</Badge>
        </CardHeader>
        <CardBody>
          <p className="tabular font-serif text-4xl text-forest">
            {formatPeso(MONTHLY_DUES)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Due {formatMonthDay(dueDate)}. Your current balance and payment
            history will appear here after sign-in is connected.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button disabled>Pay dues</Button>
            <p className="text-xs text-muted">
              Payment opens once PayMongo checkout is connected. Partial
              payments are allowed, but the balance must reach the full amount.
            </p>
          </div>
        </CardBody>
      </Card>

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

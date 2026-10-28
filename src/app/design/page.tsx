import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { LeafMark } from "@/components/brand/leaf-mark";
import { CheckIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Style guide" };

const colors = [
  { name: "forest", hex: "#4F6B1F", className: "bg-forest" },
  { name: "leaf", hex: "#7BA11E", className: "bg-leaf" },
  { name: "lime", hex: "#B7D335", className: "bg-lime" },
  { name: "cream", hex: "#F5F8EC", className: "bg-cream" },
  { name: "ink", hex: "#2A3414", className: "bg-ink" },
  { name: "amber", hex: "#E0A100", className: "bg-amber" },
  { name: "red", hex: "#C8402F", className: "bg-red" },
  { name: "surface", hex: "#FFFFFF", className: "bg-surface" },
  { name: "muted", hex: "#66704F", className: "bg-muted" },
  { name: "line", hex: "#DCE4C6", className: "bg-line" },
  { name: "forest-soft", hex: "#E8EED9", className: "bg-forest-soft" },
  { name: "amber-soft", hex: "#FBF1D6", className: "bg-amber-soft" },
  { name: "red-soft", hex: "#F8E4E0", className: "bg-red-soft" },
  { name: "success-soft", hex: "#EAF2D2", className: "bg-success-soft" },
];

const tableRows = [
  ["12 Sampaguita St., Phase 1", "Maria Santos", "Owner-occupied", "PHP 0.00"],
  ["8 Ilang-Ilang St., Phase 1", "Jose Reyes", "Owner, non-occupied", "PHP 800.00"],
  ["22 Narra St., Phase 2", "Ana Dela Cruz", "Tenant", "PHP 1,500.00"],
  ["5 Acacia Lane, Phase 2", "Pedro Lim", "Owner-occupied", "PHP 0.00"],
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function DesignPage() {
  const user = await requireUser();
  const home = user.role === "ADMIN" ? "/admin/dashboard" : "/app/dashboard";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href={home} className="flex items-center gap-2">
            <LeafMark className="h-7 w-7 text-forest" />
            <span className="font-serif text-lg text-forest">Asian Leaf</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={home}
              className="text-sm text-forest underline underline-offset-4"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-10">
        <PageHeader
          eyebrow="Internal"
          title="Style guide"
          description="The single source of truth for color, type, components and UI states. Sample content is used here only to show layout."
        />

        <Section
          title="Color"
          description="Seven brand colors plus a small set of surface and status tints. No gradients."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {colors.map((color) => (
              <div
                key={color.name}
                className="overflow-hidden rounded-lg border border-line bg-surface shadow-card"
              >
                <div className={cn("h-16", color.className)} />
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-ink">{color.name}</p>
                  <p className="font-mono text-xs text-muted">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Typography"
          description="Playfair Display for headings. Inter for body, labels, tables and numbers."
        >
          <Card className="space-y-4 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Heading one
            </p>
            <p className="font-serif text-4xl leading-tight text-ink">
              Association dues, clearly reported.
            </p>
            <p className="font-serif text-2xl text-ink">Heading two</p>
            <p className="text-sm leading-relaxed text-muted">
              Body copy uses Inter at 14px with a comfortable line height. Real
              amounts and dates replace generic placeholders, for example
              &ldquo;PHP 1,500.00 due Nov 5&rdquo;.
            </p>
            <p className="tabular font-serif text-3xl text-forest">
              PHP 24,300.00
            </p>
            <p className="text-xs text-muted">
              Caption: last updated October 28, 2026
            </p>
          </Card>
        </Section>

        <Section
          title="Buttons"
          description="One primary action per view. Loading and disabled states are built in."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Pay dues</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="ghost">View details</Button>
            <Button variant="danger">Reject request</Button>
            <Button disabled>Disabled</Button>
            <Button isLoading>Processing</Button>
          </div>
        </Section>

        <Section
          title="Form controls"
          description="Labels stay visible. Errors appear under the field in red."
        >
          <Card className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="First name" defaultValue="Maria" />
              <Input label="Contact number" defaultValue="+639171000001" />
              <Input
                label="Email"
                defaultValue="maria.santos"
                error="Enter a valid email address."
              />
              <Select label="Occupancy" defaultValue="OWNER_OCCUPIED">
                <option value="OWNER_OCCUPIED">Owner-occupied</option>
                <option value="OWNER_NON_OCCUPIED">Owner, non-occupied</option>
                <option value="TENANT">Tenant</option>
              </Select>
              <div className="sm:col-span-2">
                <Textarea
                  label="Feedback"
                  defaultValue="Please repaint the parking markings near Phase 2."
                  hint="Keep it specific so the association can act on it."
                />
              </div>
              <div className="sm:col-span-2">
                <Checkbox
                  label="I agree to the Data Privacy Act notice"
                  description="The notice explains how the association collects and uses household information."
                  defaultChecked
                />
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-sm font-medium text-ink">
                Password requirement
              </p>
              <p className="text-xs text-muted">
                Checked while typing, before the form can be submitted.
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2 text-forest">
                  <CheckIcon className="h-4 w-4" /> At least 8 characters
                </li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section
          title="Badges"
          description="Short status labels. No emoji and no decorative icons."
        >
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Draft</Badge>
            <Badge tone="forest">Paid</Badge>
            <Badge tone="lime">Approved</Badge>
            <Badge tone="warning">Partially paid</Badge>
            <Badge tone="danger">Overdue</Badge>
            <Badge tone="success">Settled</Badge>
          </div>
        </Section>

        <Section
          title="Alerts"
          description="Left border carries the status. The message stays readable on cream and white."
        >
          <div className="space-y-3">
            <Alert tone="info" title="Partial payments are allowed">
              A household may pay in several transactions, but the balance stays
              open until the full amount is settled.
            </Alert>
            <Alert tone="success" title="Payment received">
              We received PHP 1,500.00 for October dues. Receipt RCPT-2026-0001.
            </Alert>
            <Alert tone="warning" title="Balance still open">
              PHP 800.00 remains for October. The due date was November 5.
            </Alert>
            <Alert tone="danger" title="Payment rejected">
              The reference number could not be verified. No amount was added to
              your balance. Submit a corrected reference to try again.
            </Alert>
            <Alert tone="warning" title="Warning: No vehicle sticker">
              Vehicle plate ABC 1234 was seen inside the subdivision without the
              2026 HOA sticker. Please secure one from the office by Oct 30.
            </Alert>
            <Alert tone="danger" title="Payment required: Improper waste disposal">
              Household waste was left outside the collection area. Please settle
              the PHP 500.00 penalty by Oct 31.
            </Alert>
          </div>
        </Section>

        <Section
          title="Cards"
          description="One card style: white surface, 1px olive border, 16px radius, one small shadow."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Next dues</CardTitle>
                  <p className="mt-1 text-sm text-muted">
                    Billed per household on the 5th.
                  </p>
                </div>
                <Badge tone="warning">Unpaid</Badge>
              </CardHeader>
              <CardBody>
                <p className="tabular font-serif text-4xl text-forest">
                  PHP 1,500.00
                </p>
                <p className="mt-2 text-sm text-muted">Due Nov 5</p>
              </CardBody>
            </Card>
            <StatCard
              label="Collected this month"
              value="PHP 24,300.00"
              hint="Sample figure for layout only."
            />
          </div>
        </Section>

        <Section
          title="Table"
          description="Tables scroll horizontally inside their card on phone widths. The page itself never scrolls sideways."
        >
          <Card>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Household</Th>
                    <Th>Member</Th>
                    <Th>Occupancy</Th>
                    <Th>Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row[0]}>
                      <Td className="font-medium text-ink">{row[0]}</Td>
                      <Td>{row[1]}</Td>
                      <Td className="text-muted">{row[2]}</Td>
                      <Td className="tabular text-forest">{row[3]}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          </Card>
        </Section>

        <Section
          title="States"
          description="Every data view must be designed for loading, empty, error and success."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="mb-3 text-sm font-medium text-ink">Loading</p>
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-32" />
              </div>
            </Card>

            <Card className="p-5">
              <p className="mb-3 text-sm font-medium text-ink">Empty</p>
              <EmptyState
                title="No dues generated yet"
                description="October dues will appear here once the monthly run is complete."
                className="px-4 py-6"
              />
            </Card>

            <Card className="p-5">
              <p className="mb-3 text-sm font-medium text-ink">Error</p>
              <Alert tone="danger" title="Could not load the balance">
                Check your connection and try again. Existing payments are not
                affected.
              </Alert>
            </Card>

            <Card className="p-5">
              <p className="mb-3 text-sm font-medium text-ink">Success</p>
              <Alert tone="success" title="Payment confirmed">
                PHP 1,500.00 was added to your October dues. Receipt
                RCPT-2026-0001 is ready.
              </Alert>
            </Card>
          </div>
        </Section>
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        Asian Leaf Homeowners Association · General Trias, Cavite
      </footer>
    </div>
  );
}

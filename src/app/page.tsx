import Link from "next/link";
import { LeafMark } from "@/components/brand/leaf-mark";
import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const destinations = [
  {
    href: "/admin/dashboard",
    title: "Admin workspace",
    description: "Sidebar shell, dashboard metrics and association records.",
  },
  {
    href: "/app/dashboard",
    title: "Homeowner app",
    description: "Mobile bottom navigation, greeting and next dues card.",
  },
  {
    href: "/design",
    title: "Style guide",
    description: "Colors, type, components and every required UI state.",
  },
  {
    href: "/register",
    title: "Registration flow",
    description: "The two-step household registration planned for Phase 2.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LeafMark className="h-7 w-7 text-forest" />
            <span className="font-serif text-lg text-forest">Asian Leaf</span>
          </div>
          <Badge tone="neutral">Phase 0 scaffold</Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-12 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            General Trias, Cavite
          </p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight text-ink sm:text-6xl">
            Asian Leaf Homeowners Association
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            A mobile-friendly portal for dues, household records and the
            association budget. Phase 0 sets up the shared design system, both
            navigation shells and the seeded PostgreSQL database.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {destinations.map((destination) => (
            <Link key={destination.href} href={destination.href}>
              <Card className="p-5 transition-colors hover:border-forest">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl text-ink">
                      {destination.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {destination.description}
                    </p>
                  </div>
                  <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-muted" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-line bg-surface p-6 shadow-card">
          <h2 className="font-serif text-xl text-ink">What is ready</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
            <li>Design tokens and shared components</li>
            <li>Admin sidebar and homeowner bottom nav</li>
            <li>Session-scoped splash intro</li>
            <li>PostgreSQL schema and seeded data</li>
            <li>Style guide with loading, empty, error and success states</li>
            <li>
              Health check at{" "}
              <a
                href="/api/health"
                className="text-forest underline underline-offset-4"
              >
                /api/health
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Authentication, registration, dues, payments and feedback arrive in
            the next phases. Seeded test accounts are listed in README.md.
          </p>
        </div>
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        Asian Leaf Homeowners Association · General Trias, Cavite
      </footer>
    </div>
  );
}

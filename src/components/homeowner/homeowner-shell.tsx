"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LeafMark } from "@/components/brand/leaf-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/app/(auth)/actions";
import {
  AlertIcon,
  HomeIcon,
  LogOutIcon,
  MessageIcon,
  ReceiptIcon,
  UserIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", label: "Home", icon: HomeIcon },
  { href: "/app/payments", label: "Dues", icon: ReceiptIcon },
  { href: "/app/violations", label: "Violations", icon: AlertIcon },
  { href: "/app/feedback", label: "Feedback", icon: MessageIcon },
  { href: "/app/profile", label: "Profile", icon: UserIcon },
];

export function HomeownerShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; unit: string | null };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex h-16 w-full max-w-mobile items-center justify-between px-4 lg:max-w-5xl">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <LeafMark className="h-7 w-7 text-forest" />
            <div>
              <p className="font-serif text-base leading-tight text-forest">
                Asian Leaf
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                Homeowner
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "border-b-2 px-3 py-5 text-sm transition-colors",
                      active
                        ? "border-lime font-medium text-forest"
                        : "border-transparent text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden border-l border-line pl-3 text-right lg:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-[11px] text-muted">{user.unit ?? user.email}</p>
            </div>

            <ThemeToggle />

            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                className="rounded-md p-2 text-muted transition-colors hover:bg-forest-soft hover:text-forest"
              >
                <LogOutIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-mobile px-4 py-6 pb-28 lg:max-w-3xl lg:pb-12">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto grid max-w-mobile grid-cols-5">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  active ? "font-medium text-forest" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 h-0.5 w-6 rounded-sm",
                    active ? "bg-lime" : "bg-transparent",
                  )}
                />
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

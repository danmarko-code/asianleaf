"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/app/(auth)/actions";
import {
  AlertIcon,
  HomeIcon,
  LogOutIcon,
  MessageIcon,
  UserIcon,
  WalletIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", label: "Home", icon: HomeIcon },
  { href: "/app/payments", label: "Payment", icon: WalletIcon },
  { href: "/app/violations", label: "Violations", icon: AlertIcon },
  { href: "/app/feedback", label: "Feedback", icon: MessageIcon },
  { href: "/app/profile", label: "Profile", icon: UserIcon },
];

export function HomeownerShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; username: string; unit: string | null };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex h-16 w-full max-w-mobile items-center justify-between px-4 lg:max-w-5xl">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="font-serif text-lg font-semibold tracking-tight text-ink">
              Asian Leaf
            </span>
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

            <ThemeToggle />

            <Link
              href="/app/profile"
              aria-label="Profile"
              title={user.unit ?? user.username}
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-forest-soft text-sm font-semibold uppercase text-forest lg:flex"
            >
              {user.name.slice(0, 1)}
            </Link>

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

      <main
        key={pathname}
        className="mx-auto w-full max-w-mobile px-4 py-6 pb-24 lg:max-w-3xl lg:pb-12"
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto grid max-w-mobile grid-cols-5 p-1.5">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md py-2 text-[11px] transition-colors",
                  active
                    ? "bg-forest-soft font-medium text-forest"
                    : "text-muted hover:text-ink",
                )}
              >
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

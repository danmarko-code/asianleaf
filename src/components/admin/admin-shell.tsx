"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LeafMark } from "@/components/brand/leaf-mark";
import {
  AlertIcon,
  ChartIcon,
  ChevronLeftIcon,
  CloseIcon,
  InboxIcon,
  LogOutIcon,
  MenuIcon,
  MessageIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
  HomeIcon,
} from "@/components/icons";
import { logoutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/members", label: "Members", icon: UsersIcon },
  { href: "/admin/dues", label: "Dues", icon: ReceiptIcon },
  { href: "/admin/payments", label: "Payments", icon: WalletIcon },
  { href: "/admin/budget", label: "Budget", icon: ChartIcon },
  { href: "/admin/requests", label: "Register requests", icon: InboxIcon },
  { href: "/admin/violations", label: "Violations", icon: AlertIcon },
  { href: "/admin/feedback", label: "Feedback", icon: MessageIcon },
];

function SidebarContent({
  collapsed,
  pathname,
  user,
  onNavigate,
  onToggle,
}: {
  collapsed: boolean;
  pathname: string;
  user: { name: string; email: string };
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-line px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <LeafMark className="h-8 w-8 shrink-0 text-forest" />
        {!collapsed ? (
          <div>
            <p className="font-serif text-lg leading-tight text-forest">
              Asian Leaf
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Administration
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-lime bg-cream font-medium text-forest"
                  : "border-transparent text-muted hover:bg-cream hover:text-ink",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-line p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? user.email : undefined}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-soft text-xs font-semibold uppercase text-forest">
            {user.name.slice(0, 1)}
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          ) : null}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-cream hover:text-ink",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOutIcon className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </form>

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-cream hover:text-ink",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeftIcon
              className={cn("h-5 w-5 shrink-0 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        ) : null}
      </div>
    </>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem("asialeaf:admin-collapsed") === "1");
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("asialeaf:admin-collapsed", next ? "1" : "0");
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }

  const current =
    navItems.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-cream">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          user={user}
          onToggle={toggleCollapsed}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[rgba(42,52,20,0.4)]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="absolute right-3 top-4">
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-md p-2 text-muted hover:bg-cream hover:text-ink"
                onClick={() => setMobileOpen(false)}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              collapsed={false}
              pathname={pathname}
              user={user}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-md p-2 text-muted hover:bg-cream hover:text-ink lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <LeafMark className="h-6 w-6 text-forest lg:hidden" />
            <p className="truncate text-sm font-medium text-ink">{current}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-xs text-muted sm:block">{user.email}</span>
            <Badge tone="success">Confirmed</Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="border-t border-line px-4 py-4 text-xs text-muted lg:px-8">
          Asian Leaf Homeowners Association · General Trias, Cavite
        </footer>
      </div>
    </div>
  );
}

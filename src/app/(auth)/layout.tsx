import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Brand panel: desktop only. */}
      <aside className="relative hidden overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#6f8f2b_0%,#4f6b1f_45%,#2b3b15_100%)] p-12 text-cream lg:flex lg:flex-col lg:justify-between dark:bg-[radial-gradient(120%_120%_at_0%_0%,#2c3a1f_0%,#141a0f_70%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-lime opacity-20 blur-3xl"
        />
        <BrandMark className="relative h-10 w-10" />
        <div className="relative">
          <p className="font-serif text-5xl font-semibold tracking-tight">
            Asian Leaf
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] opacity-70">
            General Trias, Cavite
          </p>
        </div>
      </aside>

      <div className="relative flex flex-col">
        <ThemeToggle className="absolute right-4 top-4" />
        <main className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { LeafMark } from "@/components/brand/leaf-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <LeafMark className="h-7 w-7 text-forest" />
            <span className="font-serif text-lg text-forest">Asian Leaf</span>
          </Link>
          <ThemeToggle className="ml-auto" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted">
        Asian Leaf Homeowners Association · General Trias, Cavite
      </footer>
    </div>
  );
}

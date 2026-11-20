import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Green brand panel, same look as the sign-in screen's side panel. */
export function Hero({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg px-6 py-7 text-cream",
        "bg-[radial-gradient(120%_120%_at_0%_0%,#6f8f2b_0%,#4f6b1f_45%,#2b3b15_100%)]",
        "dark:bg-[radial-gradient(120%_120%_at_0%_0%,#2c3a1f_0%,#141a0f_70%)] dark:text-ink",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-lime opacity-20 blur-3xl"
      />
      <div className="relative">
        {eyebrow ? <p className="text-sm opacity-80">{eyebrow}</p> : null}
        {title ? (
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">
            {title}
          </h1>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm opacity-80">{description}</p>
        ) : null}
        {children}
        {actions ? <div className="mt-5">{actions}</div> : null}
      </div>
    </section>
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-forest bg-forest-soft",
  success: "border-leaf bg-success-soft",
  warning: "border-amber bg-amber-soft",
  danger: "border-red bg-red-soft",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border-l-2 px-4 py-3 text-sm text-ink",
        tones[tone],
        className,
      )}
      {...props}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? (
        <div className={cn(title ? "mt-1 text-muted" : "text-muted")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "forest" | "lime" | "warning" | "danger" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-forest-soft text-forest",
  forest: "bg-forest text-white dark:bg-lime dark:text-[#1a220f]",
  lime: "bg-lime text-ink dark:text-[#1a220f]",
  warning: "bg-amber-soft text-ink",
  danger: "bg-red-soft text-red",
  success: "bg-success-soft text-forest",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

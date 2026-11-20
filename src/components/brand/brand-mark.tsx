import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Leaf-'A' mark cropped from the official logo. Sits beside the wordmark text,
 * so it is decorative and carries no alt text.
 * shortcut: raster crop of the supplied PNG, replace the asset with an SVG if a
 * vector source ever arrives.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        "dark:rounded-[22%] dark:bg-cream",
        className,
      )}
    >
      <Image
        src="/brand/asianleaf-mark.png"
        alt=""
        width={256}
        height={256}
        priority
        className="h-full w-full object-contain dark:scale-[0.72]"
      />
    </span>
  );
}

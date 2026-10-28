"use client";

import { useEffect, useState } from "react";
import { LeafMark } from "@/components/brand/leaf-mark";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "asialeaf:splash-seen";

type Phase = "checking" | "visible" | "closing" | "hidden";

export function Splash() {
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SPLASH_KEY) === "1";
    } catch {
      // Private browsing can block sessionStorage. Showing the intro once is
      // safer than crashing the page.
    }

    if (seen) {
      setPhase("hidden");
      return;
    }

    try {
      window.sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // Ignore storage failures.
    }

    setPhase("visible");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setPhase("closing"),
      reducedMotion ? 1400 : 2200,
    );

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        setPhase("closing");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("hidden"), 320);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "hidden") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  if (phase === "hidden") return null;

  const isChecking = phase === "checking";
  const isClosing = phase === "closing";

  return (
    <div
      data-splash
      className={cn(
        "splash-root fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream",
        isClosing && "splash-closing opacity-0",
      )}
      onClick={() => {
        if (phase === "visible") setPhase("closing");
      }}
    >
      <div className="splash-content flex flex-col items-center">
        <div
          className={cn(
            "splash-mark-wrap flex h-20 w-20 items-center justify-center",
            !isChecking && "splash-mark",
          )}
        >
          <LeafMark
            className="h-16 w-16 text-forest"
            veinClassName={!isChecking ? "splash-vein" : undefined}
          />
        </div>

        <div className={cn("mt-6 text-center", !isChecking && "splash-copy")}>
          <p className="splash-eyebrow text-[10px] font-medium uppercase tracking-[0.28em] text-muted">
            Homeowners Association
          </p>
          <p className="splash-title mt-3 font-serif text-4xl font-semibold tracking-tight text-forest">
            Asian Leaf
          </p>
          <p className="splash-place mt-3 text-[11px] uppercase tracking-[0.2em] text-muted">
            General Trias, Cavite
          </p>
        </div>
      </div>

      <div
        className={cn(
          "splash-progress mt-10 h-px w-48 overflow-hidden rounded-sm bg-line",
          !isChecking && "splash-progress-in",
        )}
      >
        <div className="splash-bar h-full w-full bg-lime" />
      </div>

      {phase === "visible" ? (
        <button
          type="button"
          className="splash-skip absolute bottom-8 text-sm text-muted transition-colors hover:text-forest"
          onClick={(event) => {
            event.stopPropagation();
            setPhase("closing");
          }}
        >
          Tap to skip
        </button>
      ) : null}

      <span className="sr-only" role="status">
        Loading Asian Leaf
      </span>
    </div>
  );
}

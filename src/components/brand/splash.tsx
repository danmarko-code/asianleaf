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
      reducedMotion ? 1500 : 1900,
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
    const timer = window.setTimeout(() => setPhase("hidden"), 280);
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

  return (
    <div
      data-splash
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream transition-opacity duration-300",
        phase === "closing" && "opacity-0",
      )}
      onClick={() => {
        if (phase === "visible") setPhase("closing");
      }}
    >
      <div className="flex flex-col items-center">
        <LeafMark
          className={cn(
            "h-16 w-16 text-forest",
            !isChecking && "splash-leaf",
          )}
        />
        <div
          className={cn("mt-5 text-center", !isChecking && "splash-word")}
        >
          <p className="font-serif text-3xl font-semibold tracking-tight text-forest">
            Asian Leaf
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            Homeowners Association
          </p>
        </div>
      </div>

      <div className="mt-10 h-0.5 w-40 overflow-hidden rounded-sm bg-line">
        <div
          className={cn("h-full bg-lime", !isChecking && "splash-bar")}
        />
      </div>

      {phase === "visible" ? (
        <button
          type="button"
          className="absolute bottom-8 text-sm text-muted hover:text-forest"
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

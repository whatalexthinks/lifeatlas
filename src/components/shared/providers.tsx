"use client";

import * as React from "react";
import { useDemoStore } from "@/store/demo-store";
import { Toaster } from "@/components/ui/feedback";

/** Loads local demo data and applies display preferences to <html>. */
export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useDemoStore((s) => s.hydrate);
  const prefs = useDemoStore((s) => s.db.account.preferences);
  const hydrated = useDemoStore((s) => s.hydrated);

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.textSize = prefs.textSize;
    if (prefs.reducedMotion === "system") delete root.dataset.motion;
    else root.dataset.motion = prefs.reducedMotion;
  }, [hydrated, prefs.theme, prefs.textSize, prefs.reducedMotion]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

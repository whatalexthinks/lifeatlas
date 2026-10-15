"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { HardDriveDownload, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersistence } from "@/hooks/use-data";
import { flushSave } from "@/store/demo-store";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/**
 * Shown whenever this browser can't keep what people add. Saving problems must never be
 * quiet: say what happened in plain words, what it means for their work, and what to do.
 */
export function StorageAlert({ audience = "organizer", className }: { audience?: "organizer" | "guest"; className?: string }) {
  const { mode, error } = usePersistence();
  const [retrying, setRetrying] = React.useState(false);
  if (mode !== "memory" && !error) return null;

  const cantSave = mode === "memory";
  const retry = async () => {
    setRetrying(true);
    await flushSave().catch(() => undefined);
    setRetrying(false);
  };

  return (
    <div role="alert" className={cn("flex flex-col gap-3 rounded-[16px] border border-danger/30 bg-danger-soft px-5 py-4 sm:flex-row sm:items-start", className)}>
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{cantSave ? "This browser isn't saving anything." : "Your latest changes aren't saved yet."}</p>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
          {cantSave
            ? audience === "guest"
              ? "Anything you record or write here will be lost when this page closes. Try opening the link in a regular (not private) browser window."
              : `Anything you add will disappear when this tab closes. This usually means a private window, or a setting that blocks site data. Open ${brand.name} in a regular window to keep your work.`
            : error}
        </p>
        {!cantSave || audience === "organizer" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {!cantSave ? (
              <Button size="sm" variant="secondary" leading={<RotateCcw className="size-4" />} loading={retrying} onClick={() => void retry()}>
                Try saving again
              </Button>
            ) : null}
            {audience === "organizer" ? (
              <Link href="/app/preservation" className="inline-flex min-h-9 items-center gap-1.5 rounded-[9px] px-3 text-[0.875rem] font-medium text-ink underline-offset-2 hover:underline">
                <HardDriveDownload className="size-4" /> {cantSave ? "Download what you've added" : "Free up space or download a copy"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

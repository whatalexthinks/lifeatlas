"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { roleLabels } from "@/domain/policies/permissions";
import { toast } from "@/components/ui/feedback";
import { useDb, usePersona, useRole } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

/** The demo identity that stands for the account holder (Sarah in the sample family). */
export function useOwnPersona() {
  const personas = useDb((d) => d.personas);
  const ownPersonId = useDb((d) => d.account.profile.personId);
  return personas.find((p) => p.personId === ownPersonId) ?? personas[0];
}

export function useBackToSelf() {
  const own = useOwnPersona();
  return async () => {
    await services().auth.switchPersona(own.id);
    toast.info(`Back to ${own.name}`);
  };
}

/**
 * Shown while looking at OurLifeCapsule as someone else, so a preview is never mistaken for
 * your own view, and getting back is one click.
 */
export function PreviewBanner({ capsuleId, tone = "paper" }: { capsuleId?: string; tone?: "paper" | "night" }) {
  const persona = usePersona();
  const own = useOwnPersona();
  const role = useRole(capsuleId);
  const back = useBackToSelf();
  if (persona.id === own.id || persona.kind === "operations") return null;
  const night = tone === "night";
  const sees = role === "owner" || role === "organizer" ? "everything, including private stories" : role ? "approved, family-visible stories only" : "nothing here yet";

  return (
    <div role="status" className={cn("border-b text-[0.875rem]", night ? "border-white/[0.07] bg-[#d7bc92]/[0.12] text-night-ink" : "border-brass/30 bg-brass-soft/60 text-ink")}>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-8">
        <Eye className={cn("size-4 shrink-0", night ? "text-[#d7bc92]" : "text-brass-ink")} aria-hidden />
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">Previewing as {persona.name}</strong>
          {capsuleId ? (
            <span className={night ? "text-night-ink-2" : "text-ink-2"}>
              {" "}
              · {role ? roleLabels[role].label : "No access"}, sees {sees}.
            </span>
          ) : null}
        </p>
        <button type="button" onClick={() => void back()} className={cn("min-h-9 rounded-full px-3 font-medium underline underline-offset-2", night ? "hover:bg-white/10" : "hover:bg-surface")}>
          Back to {own.name.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}

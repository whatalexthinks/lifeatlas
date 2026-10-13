"use client";

import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { SealedLetter } from "@/components/marketing/objects";
import { FutureStatusBadge } from "@/components/studio/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { useDb } from "@/hooks/use-data";
import { describeInterval } from "@/lib/dates";
import { cn, formatDate } from "@/lib/utils";

export default function ViewerLetters() {
  const { capsule, tone } = useViewer();
  const letters = useDb((d) => d.futureMessages).filter((m) => m.capsuleId === capsule.id || m.isExample);
  const night = tone === "night";
  return (
    <ViewerPage eyebrow="Letters Through Time" title={<>Words <em>waiting for their day.</em></>} lead="Letters written for the future stay sealed. You can see who they're for and when they're meant to be opened — never what they say.">
      {letters.length === 0 ? (
        <EmptyState title="No letters yet" body="When someone writes a letter for the future, its envelope will appear here." />
      ) : (
        <ul className="grid gap-8 md:grid-cols-2">
          {letters.map((l) => (
            <li key={l.id} className={cn("rounded-[24px] p-6", night ? "bg-white/[0.04] ring-1 ring-white/10" : "card-paper")}>
              <SealedLetter to={l.recipient.name} openOn={formatDate(l.release.date, "long")} tone={night ? "night" : "paper"} />
              <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={cn("font-serif text-[1.5rem] leading-tight", night ? "text-night-ink" : "text-ink")}>{l.isExample ? l.title : `A letter from ${l.authorName}`}</p>
                  <p className={cn("mt-1 text-[0.875rem]", night ? "text-night-ink-3" : "text-ink-3")}>
                    For {l.recipient.name} · {l.release.milestone ? l.release.milestone.replace(/_/g, " ") : `opens ${describeInterval(l.release.date)}`}
                  </p>
                </div>
                <FutureStatusBadge status={l.status} example={l.isExample} />
              </div>
              {l.isExample ? (
                <Link href={`/future/open/${l.token}`} className={cn("mt-5 inline-flex items-center gap-1.5 font-medium hover:underline", night ? "text-[#d2bb93]" : "text-evergreen")}>
                  Preview what opening feels like <ArrowUpRight className="size-4" />
                </Link>
              ) : (
                <p className={cn("mt-5 inline-flex items-center gap-2 text-[0.875rem]", night ? "text-night-ink-3" : "text-ink-3")}>
                  <Lock className="size-4" /> Sealed. Long-term delivery isn&rsquo;t live yet — nothing is scheduled.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ViewerPage>
  );
}

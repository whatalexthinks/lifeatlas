"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { AudioPlayer } from "@/components/audio/audio-player";
import { EmptyState } from "@/components/ui/feedback";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterById } from "@/data/chapters";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, formatDuration } from "@/lib/utils";

export function VoicesView({ capsule, scope, hrefFor, tone = "paper" }: { capsule: Capsule; scope: "studio" | "viewer"; hrefFor: (m: Memory) => string; tone?: "paper" | "night" }) {
  const memories = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio", type: "audio" });
  const media = useDb((d) => d.media);
  const night = tone === "night";
  const total = memories.reduce((s, m) => s + (media.find((a) => a.id === m.audioId)?.durationSec ?? 0), 0);
  const hasSynthetic = memories.some((m) => media.find((a) => a.id === m.audioId)?.sampleNotice);

  if (!memories.length)
    return (
      <EmptyState
        title="No voices yet"
        body={`Recordings appear here as ${capsule.preferredName} answers questions. In a real capsule, this is where you'll hear their voice.`}
        action={
          scope === "studio" ? (
            <Link href={`/app/gather?capsule=${capsule.id}`} className="text-link font-medium text-evergreen">
              Record a first answer
            </Link>
          ) : null
        }
      />
    );

  return (
    <div>
      <p className={cn("mb-6 text-[0.9375rem]", night ? "text-night-ink-2" : "text-ink-2")}>
        {memories.length} recordings · {formatDuration(total)} in all. Nothing plays until you press play.
      </p>
      {hasSynthetic ? (
        <p className={cn("mb-6 rounded-[14px] px-4 py-3 text-[0.875rem]", night ? "bg-white/[0.05] text-night-ink-3" : "bg-brass-soft/60 text-ink-2")}>
          The sample family&rsquo;s recordings are synthetic narration made with an open-source voice model. They are not real people&rsquo;s voices. Recordings you make are kept exactly as spoken.
        </p>
      ) : null}
      <ul className="grid gap-4 lg:grid-cols-2">
        {memories.map((m) => (
          <li key={m.id} className={cn("rounded-[20px] p-5", night ? "bg-white/[0.04] ring-1 ring-white/10" : "card-paper")}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={cn("catalog", night && "text-[#d7bc92]")}>
                  {formatFuzzyDate(m.date)} · {chapterById(m.chapter).title}
                </p>
                <h3 className={cn("mt-1 font-serif text-[1.45rem] leading-tight", night ? "text-night-ink" : "text-ink")}>{m.title}</h3>
                <p className={cn("mt-0.5 text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>Told by {m.attribution.displayName}</p>
              </div>
              <Link href={hrefFor(m)} className={cn("inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-medium hover:underline", night ? "text-[#d7bc92]" : "text-evergreen")}>
                Story <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <AudioPlayer mediaId={m.audioId} title={m.title} variant="inline" tone={night ? "light" : "ink"} showNotice={false} />
          </li>
        ))}
      </ul>
    </div>
  );
}

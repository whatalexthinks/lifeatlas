"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { Memory } from "@/domain/models";
import { MediaImage } from "@/components/media/media-image";
import { AudioPlayer } from "@/components/audio/audio-player";
import { usePlace } from "@/hooks/use-data";
import { chapterById, chapterColorVar } from "@/data/chapters";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, excerpt } from "@/lib/utils";

/**
 * The flagship memory composition: one photograph, a title, a small date and
 * place, and the voice. Used for the first-memory payoff and share previews.
 */
export function MemoryReveal({ memory, subjectName, className, format = "card", animate = true }: { memory: Memory; subjectName?: string; className?: string; format?: "card" | "portrait" | "square"; animate?: boolean }) {
  const place = usePlace(memory.placeId);
  const chapter = chapterById(memory.chapter);
  const photo = memory.photoIds[0];
  const aspect = format === "portrait" ? "aspect-[9/16]" : format === "square" ? "aspect-square" : "";
  const color = chapterColorVar[chapter.color];

  return (
    <article className={cn("relative isolate overflow-hidden rounded-[22px] bg-night text-night-ink shadow-lg", aspect, animate && "animate-[fade-up_900ms_var(--ease-out)_both]", className)}>
      {photo ? (
        <div className={cn("relative overflow-hidden", format === "card" ? "aspect-[4/3]" : "absolute inset-0")}>
          <MediaImage mediaId={photo} className="absolute inset-0" develop={animate} />
          <div className={cn("absolute inset-0", format === "card" ? "bg-gradient-to-t from-night via-transparent to-transparent" : "bg-gradient-to-t from-black/85 via-black/25 to-black/10")} />
        </div>
      ) : (
        <div className={cn("relative", format === "card" ? "aspect-[21/9]" : "absolute inset-0")} style={{ background: `radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, ${color} 55%, #131815), #131815 70%)` }}>
          <div className="topo-lines absolute inset-0 opacity-25" />
          <span aria-hidden className="absolute left-6 top-2 font-serif text-[9rem] leading-none text-[#c4ad86]/35 sm:left-7">&ldquo;</span>
        </div>
      )}
      <div className={cn("relative z-10 p-6 sm:p-7", format !== "card" && "absolute inset-x-0 bottom-0")}>
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[#d7bd8a]">
          <span>{chapter.title}</span>
          <span aria-hidden>·</span>
          <span>{formatFuzzyDate(memory.date, "short")}</span>
          {place ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {place.locality ?? place.name}
              </span>
            </>
          ) : null}
        </p>
        <h3 className={cn("mt-3 font-serif leading-[1.04] tracking-[-0.015em]", format === "portrait" ? "text-[2.4rem]" : "text-[2.1rem]")}>{memory.title}</h3>
        {memory.quote || memory.narrative ? <p className="mt-3 max-w-xl font-serif text-[1.15rem] italic leading-snug text-night-ink-2">&ldquo;{memory.quote ?? excerpt(memory.narrative, 150)}&rdquo;</p> : null}
        {memory.audioId ? <AudioPlayer mediaId={memory.audioId} variant="mini" tone="light" className="mt-5" title={memory.title} showNotice={false} /> : null}
        {subjectName ? <p className="mt-5 text-[0.8125rem] text-night-ink-3">From the archive of {subjectName}</p> : null}
      </div>
    </article>
  );
}

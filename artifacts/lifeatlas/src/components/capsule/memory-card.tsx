"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { AudioLines, Images, Lock, Pin } from "lucide-react";
import type { Memory } from "@/domain/models";
import { MediaImage } from "@/components/media/media-image";
import { MemoryStatusBadge } from "@/components/studio/primitives";
import { useDb, usePlace } from "@/hooks/use-data";
import { chapterColorVar } from "@/data/chapters";
import { chapterFor } from "@/domain/capsule-kinds";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, excerpt } from "@/lib/utils";

/** Archive story card, used in the studio and the viewer. */
export function MemoryCard({
  memory,
  href,
  onClick,
  showStatus = false,
  layout = "card",
  className,
  catalog,
}: {
  memory: Memory;
  href?: string;
  onClick?: () => void;
  showStatus?: boolean;
  layout?: "card" | "row";
  className?: string;
  catalog?: string;
}) {
  const place = usePlace(memory.placeId);
  const capsule = useDb((d) => d.capsules.find((c) => c.id === memory.capsuleId));
  const chapter = chapterFor(capsule, memory.chapter);
  const cover = memory.photoIds[0];
  const body = (
    <>
      {layout === "card" ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-[inherit] bg-linen">
          {cover ? (
            <MediaImage mediaId={cover} className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6" style={{ background: `color-mix(in srgb, ${chapterColorVar[chapter.color]} 14%, var(--ivory))` }}>
              <p className="line-clamp-4 text-center font-serif text-[1.2rem] italic leading-snug text-ink-2">&ldquo;{memory.quote ?? excerpt(memory.narrative, 110)}&rdquo;</p>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {memory.pinned ? (
              <span className="grid size-7 place-items-center rounded-full bg-surface/90 text-terracotta shadow-sm" title="Pinned">
                <Pin className="size-3.5" />
              </span>
            ) : null}
            {memory.privacy === "private" ? (
              <span className="grid size-7 place-items-center rounded-full bg-surface/90 text-ink-2 shadow-sm" title="Private">
                <Lock className="size-3.5" />
              </span>
            ) : null}
          </div>
          {memory.audioId || memory.photoIds.length > 1 ? (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {memory.audioId ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface/92 px-2.5 text-[0.75rem] font-medium shadow-sm">
                  <AudioLines className="size-3.5 text-evergreen" /> Voice
                </span>
              ) : null}
              {memory.photoIds.length > 1 ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface/92 px-2.5 text-[0.75rem] font-medium shadow-sm">
                  <Images className="size-3.5" /> {memory.photoIds.length}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-linen sm:size-24">{cover ? <MediaImage mediaId={cover} className="absolute inset-0" /> : <div className="absolute inset-0" style={{ background: `color-mix(in srgb, ${chapterColorVar[chapter.color]} 18%, var(--ivory))` }} />}</div>
      )}
      <div className={cn("min-w-0", layout === "card" ? "p-4 sm:p-5" : "flex-1 py-1")}>
        <p className="catalog flex flex-wrap items-center gap-x-2">
          {catalog ? <span className="text-ink-4">{catalog}</span> : null}
          <span>{formatFuzzyDate(memory.date, "short")}</span>
          {place ? <span>· {place.locality ?? place.name}</span> : null}
        </p>
        <h3 className={cn("mt-1.5 font-serif leading-[1.12] tracking-[-0.01em] text-ink", layout === "card" ? "text-[1.45rem]" : "text-[1.3rem]")}>{memory.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-[0.8125rem] text-ink-3">
          <span className="size-1.5 rounded-full" style={{ background: chapterColorVar[chapter.color] }} aria-hidden />
          {chapter.title} · {memory.attribution.displayName}
          {layout === "row" && memory.audioId ? (
            <span className="inline-flex items-center gap-1">
              · <AudioLines className="size-3.5" /> voice
            </span>
          ) : null}
        </p>
        {showStatus && memory.status !== "approved" ? (
          <div className="mt-3">
            <MemoryStatusBadge status={memory.status} />
          </div>
        ) : null}
      </div>
    </>
  );
  const cls = cn(
    "group block overflow-hidden text-left transition-[box-shadow,transform,border-color] duration-300",
    layout === "card" ? "card-paper hover:-translate-y-0.5 hover:shadow-md" : "flex items-center gap-4 rounded-[16px] p-2 hover:bg-surface",
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cn(cls, "w-full")}>
      {body}
    </button>
  );
}

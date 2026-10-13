"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, BookOpenText, ArrowUpRight } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage, Mounted } from "@/components/media/media-image";
import { EmptyState } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterById, chapterColorVar } from "@/data/chapters";
import { formatFuzzyDate } from "@/lib/dates";
import { readingMinutes } from "@/lib/memory-utils";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

/** Book-like reading: chapters in the capsule's chosen order, bookmarks, continuous mode. */
export function ChaptersView({ capsule, scope, hrefFor, tone = "paper" }: { capsule: Capsule; scope: "studio" | "viewer"; hrefFor: (m: Memory) => string; tone?: "paper" | "night" }) {
  const memories = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio" });
  const bookmarks = useDb((d) => d.bookmarks);
  const places = useDb((d) => d.places);
  const [mode, setMode] = React.useState<"contents" | "continuous">("contents");
  const night = tone === "night";
  const order = capsule.chapterOrder;
  const groups = order.map((id) => ({ chapter: chapterById(id), items: memories.filter((m) => m.chapter === id) })).filter((g) => g.items.length);
  const isMarked = (m: Memory) => bookmarks.some((b) => b.capsuleId === capsule.id && b.memoryId === m.id);
  const marked = memories.filter(isMarked);

  if (!memories.length) return <EmptyState title="No chapters yet" body="Stories are grouped into chapters — childhood, love, work, journeys — as they're added." />;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Reading mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "contents", label: "Contents" },
            { value: "continuous", label: "Read continuously", icon: <BookOpenText className="size-4" /> },
          ]}
        />
        {marked.length ? (
          <p className={cn("text-[0.875rem]", night ? "text-night-ink-3" : "text-ink-3")}>
            {marked.length} bookmarked ·{" "}
            <a href={`#bm`} className="underline underline-offset-2">
              jump
            </a>
          </p>
        ) : null}
      </div>

      {mode === "contents" ? (
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {groups.map((g, gi) => (
            <section key={g.chapter.id} aria-labelledby={`ch-${g.chapter.id}`}>
              <div className="flex items-baseline gap-3 border-b pb-3" style={{ borderColor: night ? "rgb(255 255 255 / 0.12)" : "var(--line)" }}>
                <span className="font-mono text-[0.75rem] tracking-[0.14em]" style={{ color: chapterColorVar[g.chapter.color] }}>
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <h2 id={`ch-${g.chapter.id}`} className={cn("font-serif text-[2rem] leading-none", night ? "text-night-ink" : "text-ink")}>
                  {g.chapter.title}
                </h2>
              </div>
              <p className={cn("mt-2 font-serif italic", night ? "text-night-ink-2" : "text-ink-2")}>{g.chapter.subtitle}</p>
              <ol className="mt-4 space-y-1">
                {g.items.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <Link href={hrefFor(m)} className={cn("group flex min-w-0 flex-1 items-baseline justify-between gap-4 rounded-[10px] px-2 py-2", night ? "hover:bg-white/[0.05]" : "hover:bg-ivory")}>
                      <span className={cn("truncate font-serif text-[1.2rem]", night ? "text-night-ink" : "text-ink")}>{m.title}</span>
                      <span className={cn("catalog shrink-0", night && "text-night-ink-3")}>{formatFuzzyDate(m.date, "short")}</span>
                    </Link>
                    <BookmarkButton capsuleId={capsule.id} memory={m} on={isMarked(m)} night={night} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-[44rem]">
          {groups.map((g, gi) => (
            <section key={g.chapter.id} className="mb-24">
              <header className="mb-14 text-center">
                <p className="font-mono text-[0.75rem] uppercase tracking-[0.2em]" style={{ color: chapterColorVar[g.chapter.color] }}>
                  Chapter {gi + 1}
                </p>
                <h2 className={cn("mt-3 font-serif text-[clamp(2.6rem,2rem+2.5vw,4rem)] leading-none", night ? "text-night-ink" : "text-ink")}>{g.chapter.title}</h2>
                <p className={cn("mt-3 font-serif italic", night ? "text-night-ink-2" : "text-ink-2")}>{g.chapter.subtitle}</p>
              </header>
              {g.items.map((m) => {
                const place = places.find((p) => p.id === m.placeId);
                return (
                  <article key={m.id} id={isMarked(m) ? "bm" : undefined} className="mb-16 scroll-mt-28">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className={cn("catalog", night && "text-[#c4ad86]")}>
                        {formatFuzzyDate(m.date)}
                        {place ? ` · ${place.name}` : ""} · {readingMinutes(m.narrative)} min
                      </p>
                      <BookmarkButton capsuleId={capsule.id} memory={m} on={isMarked(m)} night={night} />
                    </div>
                    <h3 className={cn("font-serif text-[2.2rem] leading-[1.08] tracking-[-0.015em]", night ? "text-night-ink" : "text-ink")}>{m.title}</h3>
                    {m.photoIds[0] ? (
                      <Mounted className="my-8" caption={m.title} meta={formatFuzzyDate(m.date, "short")}>
                        <MediaImage mediaId={m.photoIds[0]} className="aspect-[4/3]" />
                      </Mounted>
                    ) : null}
                    {m.audioId ? <AudioPlayer mediaId={m.audioId} title={m.title} tone={night ? "light" : "ink"} className="my-6" showNotice={false} /> : null}
                    <div className={cn("prose-story mt-6", night && "text-night-ink")}>
                      {m.narrative.split(/\n{2,}/).map((p, i) => (
                        <p key={i} className={i === 0 ? "drop-cap" : undefined}>
                          {p}
                        </p>
                      ))}
                    </div>
                    <p className={cn("mt-6 text-[0.875rem]", night ? "text-night-ink-3" : "text-ink-3")}>
                      — {m.attribution.displayName}
                      {m.attribution.relationship && m.attribution.relationship !== "Storyteller" ? `, ${m.attribution.relationship.toLowerCase()}` : ""}
                      <Link href={hrefFor(m)} className="ml-3 inline-flex items-center gap-1 underline-offset-2 hover:underline">
                        Open <ArrowUpRight className="size-3" />
                      </Link>
                    </p>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarkButton({ capsuleId, memory, on, night }: { capsuleId: string; memory: Memory; on: boolean; night: boolean }) {
  return (
    <button
      type="button"
      onClick={() => void services().capsules.toggleBookmark(capsuleId, memory.id)}
      aria-pressed={on}
      aria-label={on ? `Remove bookmark from ${memory.title}` : `Bookmark ${memory.title}`}
      className={cn("grid size-9 shrink-0 place-items-center rounded-full", night ? "text-night-ink-3 hover:bg-white/10" : "text-ink-3 hover:bg-ivory", on && (night ? "text-[#c4ad86]" : "text-terracotta"))}
    >
      {on ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
    </button>
  );
}

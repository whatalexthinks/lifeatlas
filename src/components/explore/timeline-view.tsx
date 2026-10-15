"use client";

import * as React from "react";
import Link from "next/link";
import { AudioLines, Images, MapPin } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { MediaImage } from "@/components/media/media-image";
import { MemoryStatusBadge } from "@/components/studio/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Segmented, Select } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterColorVar, chapters } from "@/data/chapters";
import { approxYear, decadeOf, formatFuzzyDate } from "@/lib/dates";
import { cn, excerpt } from "@/lib/utils";
import { chapterFor } from "@/domain/capsule-kinds";

/**
 * Editorial biographical timeline: a ribbon of decades on top, then the life
 * in chapters of ten years. Elegant with 2 stories or 200.
 */
export function TimelineView({
  capsule,
  scope,
  hrefFor,
  onOpen,
  highlightId,
  tone = "paper",
}: {
  capsule: Capsule;
  scope: "studio" | "viewer";
  hrefFor?: (m: Memory) => string;
  onOpen?: (m: Memory) => void;
  highlightId?: string | null;
  tone?: "paper" | "night";
}) {
  const [chapter, setChapter] = React.useState<string>("");
  const [type, setType] = React.useState<"" | "photo" | "audio" | "text">("");
  const [density, setDensity] = React.useState<"story" | "compact">("story");
  const memories = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio", chapter: chapter || undefined, type: type || undefined });
  const all = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio" });
  const places = useDb((d) => d.places);
  const night = tone === "night";

  const dated = memories.filter((m) => approxYear(m.date) !== null);
  const undated = memories.filter((m) => approxYear(m.date) === null);
  const decades = React.useMemo(() => {
    const map = new Map<number, Memory[]>();
    for (const m of dated) {
      const d = decadeOf(m.date)!;
      map.set(d, [...(map.get(d) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [dated]);

  const ribbon = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const m of all) {
      const d = decadeOf(m.date);
      if (d !== null) map.set(d, (map.get(d) ?? 0) + 1);
    }
    const start = capsule.birthYear ? Math.floor(capsule.birthYear / 10) * 10 : Math.min(...map.keys(), new Date().getFullYear());
    const end = Math.floor(new Date().getFullYear() / 10) * 10;
    const out: { decade: number; count: number }[] = [];
    for (let d = start; d <= end; d += 10) out.push({ decade: d, count: map.get(d) ?? 0 });
    return out;
  }, [all, capsule.birthYear]);
  const maxCount = Math.max(1, ...ribbon.map((r) => r.count));

  React.useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`tl-${highlightId}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
  }, [highlightId]);

  const ageLabel = (decade: number) => {
    if (!capsule.birthYear) return null;
    const a = Math.max(0, decade - capsule.birthYear);
    const b = decade + 9 - capsule.birthYear;
    if (b < 0) return "Before they were born";
    return `${capsule.preferredName}, age ${a}–${b}`;
  };

  const renderItem = (m: Memory) => {
    const place = places.find((p) => p.id === m.placeId);
    const ch = chapterFor(capsule, m.chapter);
    const content = (
      <div
        id={`tl-${m.id}`}
        className={cn(
          "group relative grid gap-4 rounded-[18px] p-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4",
          night ? "hover:bg-white/[0.04]" : "hover:bg-surface",
          highlightId === m.id && (night ? "bg-white/[0.06] ring-1 ring-[#d7bc92]/50" : "bg-surface ring-2 ring-terracotta/40"),
        )}
      >
        <span aria-hidden className="absolute -left-[27px] top-6 size-3 rounded-full border-2 sm:-left-[35px]" style={{ background: chapterColorVar[ch.color], borderColor: night ? "#1b1a18" : "var(--paper)" }} />
        <div className="min-w-0">
          <p className={cn("catalog flex flex-wrap items-center gap-x-2", night && "text-[#d7bc92]")}>
            <span>{formatFuzzyDate(m.date)}</span>
            {place ? (
              <span className="inline-flex items-center gap-1">
                · <MapPin className="size-3" /> {place.locality ?? place.name}
              </span>
            ) : null}
          </p>
          <h3 className={cn("mt-1.5 font-serif leading-[1.1] tracking-[-0.01em]", density === "story" ? "text-[1.7rem]" : "text-[1.3rem]", night ? "text-night-ink" : "text-ink")}>{m.title}</h3>
          {density === "story" ? <p className={cn("mt-2 max-w-2xl text-[1rem] leading-relaxed", night ? "text-night-ink-2" : "text-ink-2")}>{excerpt(m.quote ? `“${m.quote}”` : m.narrative, 190)}</p> : null}
          <p className={cn("mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: chapterColorVar[ch.color] }} /> {ch.title}
            </span>
            <span>{m.attribution.displayName}</span>
            {m.audioId ? (
              <span className="inline-flex items-center gap-1">
                <AudioLines className="size-3.5" /> Voice
              </span>
            ) : null}
            {m.photoIds.length ? (
              <span className="inline-flex items-center gap-1">
                <Images className="size-3.5" /> {m.photoIds.length}
              </span>
            ) : null}
          </p>
          {scope === "studio" && m.status !== "approved" ? (
            <div className="mt-2.5">
              <MemoryStatusBadge status={m.status} />
            </div>
          ) : null}
        </div>
        {m.photoIds[0] && density === "story" ? (
          <div className="relative h-36 w-full overflow-hidden rounded-[12px] sm:h-32 sm:w-44">
            <MediaImage mediaId={m.photoIds[0]} className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]" />
          </div>
        ) : null}
      </div>
    );
    if (hrefFor)
      return (
        <Link href={hrefFor(m)} className="block rounded-[18px]">
          {content}
        </Link>
      );
    return (
      <button type="button" onClick={() => onOpen?.(m)} className="block w-full rounded-[18px] text-left">
        {content}
      </button>
    );
  };

  return (
    <div>
      {/* Ribbon */}
      <nav aria-label="Decades" className={cn("rounded-[20px] p-4 sm:p-5", night ? "bg-white/[0.04] ring-1 ring-white/10" : "card-quiet")}>
        <div className="flex items-end gap-1.5 overflow-x-auto scrollbar-none">
          {ribbon.map((r) => (
            <a
              key={r.decade}
              href={r.count ? `#decade-${r.decade}` : undefined}
              aria-label={`${r.decade}s: ${r.count} ${r.count === 1 ? "story" : "stories"}`}
              className={cn("group flex min-w-[52px] flex-1 flex-col items-center gap-2", !r.count && "pointer-events-none")}
            >
              <span className="flex h-16 w-full items-end">
                <span
                  className={cn("w-full rounded-t-[6px] transition-colors", r.count ? (night ? "bg-[#d7bc92]/70 group-hover:bg-[#d7bc92]" : "bg-evergreen/75 group-hover:bg-evergreen") : night ? "bg-white/10" : "bg-line")}
                  style={{ height: `${Math.max(6, (r.count / maxCount) * 100)}%` }}
                />
              </span>
              <span className={cn("font-mono text-[11px] tabular-nums", night ? "text-night-ink-3" : "text-ink-3", r.count && (night ? "text-night-ink" : "text-ink"))}>{r.decade}s</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Select value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Filter by chapter" className="h-10 w-48 rounded-full text-[0.875rem]">
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <Segmented
          label="Type of memory"
          size="sm"
          value={type || "all"}
          onChange={(v) => setType(v === "all" ? "" : (v as "photo" | "audio" | "text"))}
          options={[
            { value: "all", label: "All" },
            { value: "photo", label: "Photos" },
            { value: "audio", label: "Voices" },
            { value: "text", label: "Words" },
          ]}
        />
        <Segmented
          label="Density"
          size="sm"
          className="ml-auto"
          value={density}
          onChange={setDensity}
          options={[
            { value: "story", label: "Stories" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </div>

      {memories.length === 0 ? (
        <EmptyState className="mt-10" title="Nothing here yet" body={chapter || type ? "No memories match these filters." : "As memories arrive, this life will unfold here, decade by decade."} />
      ) : (
        <div className="mt-10 space-y-14">
          {decades.map(([decade, ms]) => (
            <section key={decade} id={`decade-${decade}`} className="scroll-mt-28" aria-labelledby={`h-${decade}`}>
              <div className="mb-5 flex items-baseline gap-4">
                <h2 id={`h-${decade}`} className={cn("font-serif text-[clamp(2.6rem,2rem+2vw,3.8rem)] leading-none tracking-[-0.03em]", night ? "text-night-ink" : "text-ink")}>
                  {decade}
                  <span className={night ? "text-night-ink-3" : "text-ink-4"}>s</span>
                </h2>
                {ageLabel(decade) ? <span className={cn("catalog", night && "text-night-ink-3")}>{ageLabel(decade)}</span> : null}
              </div>
              <ol className={cn("ml-3 space-y-2 border-l pl-5 sm:ml-4 sm:pl-7", night ? "border-white/15" : "border-line-strong")}>
                {ms.map((m) => (
                  <li key={m.id}>
                    {renderItem(m)}
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {undated.length ? (
            <section aria-labelledby="h-undated">
              <div className="mb-5 flex items-baseline gap-4">
                <h2 id="h-undated" className={cn("font-serif text-[2.2rem] leading-none", night ? "text-night-ink" : "text-ink")}>
                  Some time, somewhere
                </h2>
                <span className={cn("catalog", night && "text-night-ink-3")}>Undated memories</span>
              </div>
              <ol className={cn("ml-3 space-y-2 border-l border-dashed pl-5 sm:ml-4 sm:pl-7", night ? "border-white/15" : "border-line-strong")}>
                {undated.map((m) => (
                  <li key={m.id}>
                    {renderItem(m)}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

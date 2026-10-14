"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Route } from "lucide-react";
import { memories as allMemories } from "@/data/fixtures/memories";
import { places } from "@/data/fixtures/places";
import { chapterById } from "@/data/chapters";
import { MemoryMap } from "@/components/map/memory-map";
import { MediaImage } from "@/components/media/media-image";
import { decadesOf, journeyOrder, placesToPoints } from "@/lib/memory-utils";
import { decadeOf, formatFuzzyDate, sortKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { MapView } from "@/components/map/geo";

/** Homepage chapter 3: the timeline becomes places on a map. Real sample data. */
export function LifeExplorer() {
  const memories = React.useMemo(
    () => allMemories.filter((m) => m.capsuleId === "cap_margaret" && m.status === "approved" && m.privacy === "family").sort((a, b) => sortKey(a.date) - sortKey(b.date)),
    [],
  );
  const decades = decadesOf(memories);
  const [decade, setDecade] = React.useState<number | null>(1970);
  const [activeId, setActiveId] = React.useState<string>("mem_summer");
  const [view, setView] = React.useState<MapView>("northeast");
  const [journey, setJourney] = React.useState(false);
  const visible = memories.filter((m) => decade === null || decadeOf(m.date) === decade);
  const active = memories.find((m) => m.id === activeId) ?? visible[0];
  const points = React.useMemo(() => placesToPoints(memories, places), [memories]);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectPlace = (placeId: string) => {
    const first = memories.find((m) => m.placeId === placeId);
    if (!first) return;
    setDecade(null);
    setActiveId(first.id);
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-mid="${first.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Decades">
          <button role="tab" aria-selected={decade === null} onClick={() => setDecade(null)} className={cn("h-9 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors", decade === null ? "bg-night-ink text-night" : "text-night-ink-2 hover:bg-white/10")}>
            All
          </button>
          {decades.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={decade === d}
              onClick={() => {
                setDecade(d);
                const first = memories.find((m) => decadeOf(m.date) === d);
                if (first) setActiveId(first.id);
              }}
              className={cn("h-9 rounded-full px-3.5 font-mono text-[0.8125rem] transition-colors", decade === d ? "bg-night-ink text-night" : "text-night-ink-2 hover:bg-white/10")}
            >
              {d}s
            </button>
          ))}
        </div>

        <div ref={listRef} className="scrollbar-none snap-x-mandatory -mx-5 mt-6 flex gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:max-h-[520px] lg:grid-cols-1 lg:overflow-y-auto lg:overflow-x-visible lg:px-0 lg:pr-2">
          {visible.map((m) => {
            const on = m.id === active?.id;
            const place = places.find((p) => p.id === m.placeId);
            return (
              <button
                key={m.id}
                data-mid={m.id}
                onClick={() => setActiveId(m.id)}
                aria-pressed={on}
                className={cn(
                  "group flex w-[78vw] max-w-[320px] shrink-0 snap-center items-center gap-4 rounded-[18px] p-3 text-left transition-colors lg:w-auto lg:max-w-none",
                  on ? "bg-white/[0.09] ring-1 ring-white/15" : "hover:bg-white/[0.05]",
                )}
              >
                <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px]">
                  {m.photoIds[0] ? <MediaImage mediaId={m.photoIds[0]} className="absolute inset-0" /> : <div className="absolute inset-0 bg-night-3" />}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#c8b28d]">
                    {formatFuzzyDate(m.date, "short")} · {place?.locality ?? "—"}
                  </p>
                  <p className="mt-1 font-serif text-[1.25rem] leading-tight text-night-ink">{m.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-night-ink-2">{chapterById(m.chapter).title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <div className="overflow-hidden rounded-[22px] ring-1 ring-white/10">
          <MemoryMap points={points} activeId={active?.placeId} onSelect={selectPlace} view={view} onViewChange={setView} journey={journeyOrder(memories)} showJourney={journey} tone="night" aspect={1.25} label="Map of the places in Margaret's life" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setJourney((v) => !v)}
            aria-pressed={journey}
            className={cn("inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium transition-colors", journey ? "bg-[#c4ad86] text-[#1b221e]" : "bg-white/[0.08] text-night-ink hover:bg-white/[0.12]")}
          >
            <Route className="size-4" /> {journey ? "Hide the journey" : "Trace her journey"}
          </button>
          <Link href="/view/cap_margaret/map" className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-[#d2bb93] hover:underline">
            Open the full memory map <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

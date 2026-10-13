"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { memories } from "@/data/fixtures/memories";
import { places } from "@/data/fixtures/places";
import { chapterById } from "@/data/chapters";
import { MediaImage, Mounted } from "@/components/media/media-image";
import { AudioPlayer } from "@/components/audio/audio-player";
import { displayCoords } from "@/components/map/geo";
import { formatFuzzyDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const FEATURED = ["mem_bread", "mem_letter", "mem_seat", "mem_summer", "mem_florence", "mem_know"];

export function HeroVignette() {
  const items = FEATURED.map((id) => memories.find((m) => m.id === id)!).filter(Boolean);
  const [activeId, setActiveId] = React.useState("mem_summer");
  const active = items.find((m) => m.id === activeId) ?? items[0];
  const place = places.find((p) => p.id === active.placeId);
  const photo = active.photoIds[0];
  const minYear = 1940;
  const maxYear = 2026;
  const pos = (y: number) => ((y - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <span className="catalog">The Ellis Family Archive · Sample</span>
        <span className="catalog hidden sm:inline">Est. 1940</span>
      </div>

      <div className="relative">
        <Mounted
          className="relative z-0 [&_figcaption]:hidden lg:[&_figcaption]:flex"
          caption={active.title}
          meta={
            <>
              {formatFuzzyDate(active.date, "short")} · {place?.locality}
            </>
          }
        >
          <div className="relative aspect-[4/3.1] overflow-hidden">
            <MediaImage key={photo} mediaId={photo} className="absolute inset-0" priority develop />
          </div>
        </Mounted>

        {/* Memory card */}
        <div className="relative z-10 -mt-14 ml-auto w-[88%] sm:w-[72%] lg:absolute lg:-bottom-10 lg:-left-8 lg:mt-0 lg:w-[19.5rem] xl:-left-14">
          <div className="card-paper animate-[fade-up_700ms_var(--ease-out)_both] p-5 shadow-lg" key={active.id}>
            <div className="flex items-center justify-between">
              <span className="eyebrow plain">{chapterById(active.chapter).title}</span>
              <span className="catalog">{String(FEATURED.indexOf(active.id) + 1).padStart(2, "0")} / {String(FEATURED.length).padStart(2, "0")}</span>
            </div>
            <p className="mt-3 font-serif text-[1.55rem] leading-[1.1] tracking-[-0.01em]">“{active.quote}”</p>
            <p className="mt-2 text-[0.8125rem] text-ink-3">Margaret Ellis, remembering {formatFuzzyDate(active.date).toLowerCase().startsWith("around") ? formatFuzzyDate(active.date).toLowerCase() : formatFuzzyDate(active.date)}</p>
            {active.audioId ? (
              <AudioPlayer mediaId={active.audioId} variant="mini" title={active.title} className="mt-4" showNotice={false} />
            ) : (
              <p className="mt-4 text-[0.8125rem] text-ink-3">Written story · no recording yet</p>
            )}
            <p className="mt-3 text-[0.6875rem] leading-snug text-ink-4">Fictional family. Sample narration is synthesized, not a real voice.</p>
          </div>
        </div>

        {/* Place chip */}
        {place ? (
          <div className="absolute right-3 top-3 z-10 hidden items-center gap-2 rounded-full bg-surface/92 px-3 py-1.5 shadow-sm backdrop-blur sm:inline-flex">
            <MapPin className="size-3.5 text-terracotta" />
            <span className="text-[0.75rem] font-medium">{place.name}</span>
            <span className="catalog hidden xl:inline">{displayCoords(place.point.lat, place.point.lng, place.precision)}</span>
          </div>
        ) : null}
      </div>

      {/* Life ribbon */}
      <div className="mt-8 lg:mt-20 lg:pl-[18rem] xl:pl-[16rem]">
        <div className="flex items-center justify-between">
          <span className="catalog">A life, 1940 — today</span>
          <Link href="/demo" className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-evergreen hover:underline">
            Explore all {memories.filter((m) => m.capsuleId === "cap_margaret" && m.status === "approved").length} stories <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="relative mx-3 mt-4 h-12" role="radiogroup" aria-label="Choose a year in Margaret's life">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
          {[1940, 1960, 1980, 2000, 2020].map((y) => (
            <span key={y} className="catalog absolute top-[calc(50%+10px)] -translate-x-1/2 text-[10px]" style={{ left: `${pos(y)}%` }}>
              {y}
            </span>
          ))}
          {items.map((m) => {
            const y = m.date.year ?? (m.date.decade ?? 1950) + 5;
            const on = m.id === active.id;
            return (
              <button
                key={m.id}
                role="radio"
                aria-checked={on}
                aria-label={`${formatFuzzyDate(m.date)} — ${m.title}`}
                onClick={() => setActiveId(m.id)}
                className="group absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${pos(y)}%` }}
              >
                <span className={cn("block rounded-full border-2 border-paper transition-all duration-300", on ? "size-4 bg-terracotta shadow-[0_0_0_4px_color-mix(in_srgb,var(--terracotta)_20%,transparent)]" : "size-2.5 bg-evergreen group-hover:size-3.5")} />
                <span className={cn("catalog pointer-events-none absolute -top-5 whitespace-nowrap text-[10px] transition-opacity", on ? "opacity-100 text-ink" : "opacity-0 group-hover:opacity-100")}>{y}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ChevronLeft, ChevronRight, List, Map as MapIcon, MapPin, Pause, Play, Route } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { MemoryMap } from "@/components/map/memory-map";
import { displayCoords, type MapView as View } from "@/components/map/geo";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Segmented, Select } from "@/components/ui/field";
import { useCapsuleMemories, useDb, usePrefersReducedMotionSafe } from "./shared";
import { chapters } from "@/data/chapters";
import { decadeOf, formatFuzzyDate } from "@/lib/dates";
import { decadesOf, journeyOrder, placesToPoints } from "@/lib/memory-utils";
import { cn, pluralize } from "@/lib/utils";
import { chapterFor } from "@/domain/capsule-kinds";

export function MapView({
  capsule,
  scope,
  hrefFor,
  onOpen,
  tone = "paper",
}: {
  capsule: Capsule;
  scope: "studio" | "viewer";
  hrefFor?: (m: Memory) => string;
  onOpen?: (m: Memory) => void;
  tone?: "paper" | "night";
}) {
  const [mode, setMode] = React.useState<"map" | "list">("map");
  const [decade, setDecade] = React.useState<string>("");
  const [chapter, setChapter] = React.useState<string>("");
  const [person, setPerson] = React.useState<string>("");
  const [activePlace, setActivePlace] = React.useState<string | null>(null);
  const [view, setView] = React.useState<View>("northeast");
  const [journeyOn, setJourneyOn] = React.useState(false);
  const [journeyIndex, setJourneyIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const reduced = usePrefersReducedMotionSafe();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const places = useDb((d) => d.places);
  const people = useDb((d) => d.people);
  const night = tone === "night";

  const base = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio", chapter: chapter || undefined, personId: person || undefined });
  const memories = React.useMemo(() => base.filter((m) => !decade || decadeOf(m.date) === Number(decade)), [base, decade]);
  const located = React.useMemo(() => memories.filter((m) => m.placeId && places.some((p) => p.id === m.placeId && p.visibility !== "hidden")), [memories, places]);
  const unlocated = React.useMemo(() => memories.filter((m) => !located.includes(m)), [memories, located]);
  const points = React.useMemo(() => placesToPoints(located, places), [located, places]);
  const journey = React.useMemo(() => journeyOrder(located), [located]);
  const decades = decadesOf(base);
  const peopleInCapsule = people.filter((p) => base.some((m) => m.peopleIds.includes(p.id)));

  // group by place, in journey order
  const groups = React.useMemo(() => {
    const order = [...new Set(journey)];
    return order.map((pid) => ({ place: places.find((p) => p.id === pid)!, items: located.filter((m) => m.placeId === pid) })).filter((g) => g.place);
  }, [journey, located, places]);

  const select = (placeId: string, scroll = true) => {
    setActivePlace(placeId);
    const p = places.find((x) => x.id === placeId);
    if (p && view === "northeast" && !(p.point.lng >= -75.6 && p.point.lng <= -66.4 && p.point.lat >= 40.2 && p.point.lat <= 47.6)) setView("world");
    if (scroll) requestAnimationFrame(() => listRef.current?.querySelector(`[data-place="${placeId}"]`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }));
  };

  // Journey stepping: moving to a stop and selecting its place happen together.
  const goTo = (i: number) => {
    if (!journey.length) return;
    const next = Math.max(0, Math.min(journey.length - 1, i));
    setJourneyIndex(next);
    select(journey[next]);
  };
  const advance = React.useEffectEvent(() => {
    if (journeyIndex >= journey.length - 1) setPlaying(false);
    else goTo(journeyIndex + 1);
  });

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => advance(), 2600);
    return () => clearInterval(t);
  }, [playing]);

  // Sync marker with scrolled list (desktop)
  React.useEffect(() => {
    const root = listRef.current;
    if (!root || mode !== "map" || journeyOn) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActivePlace((vis.target as HTMLElement).dataset.place ?? null);
      },
      { root, rootMargin: "0px 0px -65% 0px", threshold: 0 },
    );
    root.querySelectorAll("[data-place]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups, mode, journeyOn]);

  const openProps = (m: Memory) => (hrefFor ? { href: hrefFor(m) } : { onClick: () => onOpen?.(m) });
  const currentJourneyPlace = journeyOn ? places.find((p) => p.id === journey[journeyIndex]) : undefined;

  const storyRow = (m: Memory) => {
    const props = openProps(m);
    const inner = (
      <span className={cn("flex items-center gap-3.5 rounded-[14px] p-2.5 transition-colors", night ? "hover:bg-white/[0.06]" : "hover:bg-ivory/80")}>
        <span className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-linen">{m.photoIds[0] ? <MediaImage mediaId={m.photoIds[0]} className="absolute inset-0" /> : null}</span>
        <span className="min-w-0">
          <span className={cn("catalog block", night && "text-[#d7bc92]")}>{formatFuzzyDate(m.date, "short")}</span>
          <span className={cn("block font-serif text-[1.2rem] leading-snug", night ? "text-night-ink" : "text-ink")}>{m.title}</span>
          <span className={cn("block text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>{chapterFor(capsule, m.chapter).title}</span>
        </span>
      </span>
    );
    return "href" in props ? (
      <Link key={m.id} href={props.href!} className="block">
        {inner}
      </Link>
    ) : (
      <button key={m.id} type="button" onClick={props.onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented
          label="View as"
          value={mode}
          onChange={setMode}
          options={[
            { value: "map", label: "Map", icon: <MapIcon className="size-4" /> },
            { value: "list", label: "Places list", icon: <List className="size-4" /> },
          ]}
        />
        <Select value={decade} onChange={(e) => setDecade(e.target.value)} aria-label="Filter by era" className="h-10 w-36 rounded-full text-[0.875rem]">
          <option value="">Every era</option>
          {decades.map((d) => (
            <option key={d} value={d}>
              {d}s
            </option>
          ))}
        </Select>
        <Select value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Filter by chapter" className="h-10 w-44 rounded-full text-[0.875rem]">
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        {peopleInCapsule.length ? (
          <Select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filter by person" className="h-10 w-44 rounded-full text-[0.875rem]">
            <option value="">Everyone</option>
            {peopleInCapsule.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </Select>
        ) : null}
        <Button
          size="sm"
          variant={journeyOn ? "primary" : "secondary"}
          className="ml-auto"
          leading={<Route className="size-4" />}
          onClick={() => {
            const on = !journeyOn;
            setJourneyOn(on);
            setPlaying(false);
            setMode("map");
            if (on) goTo(0);
            else setJourneyIndex(0);
          }}
          aria-pressed={journeyOn}
          disabled={journey.length < 2}
        >
          Journey through a life
        </Button>
      </div>

      {journeyOn && currentJourneyPlace ? (
        <div className={cn("mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] px-4 py-3", night ? "bg-white/[0.06] text-night-ink" : "bg-evergreen text-on-evergreen")} role="status" aria-live="polite">
          <p className="text-[0.9375rem]">
            <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] opacity-75">
              Stop {journeyIndex + 1} of {journey.length}
            </span>
            <span className="ml-3 font-serif text-[1.25rem]">{currentJourneyPlace.name}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button className="grid size-9 place-items-center rounded-full hover:bg-white/15" aria-label="Previous stop" onClick={() => goTo(journeyIndex - 1)}>
              <ChevronLeft className="size-5" />
            </button>
            <button className="grid size-9 place-items-center rounded-full hover:bg-white/15" aria-label={playing ? "Pause journey" : "Play journey"} onClick={() => setPlaying((v) => !v)}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button className="grid size-9 place-items-center rounded-full hover:bg-white/15" aria-label="Next stop" onClick={() => goTo(journeyIndex + 1)}>
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      {memories.length === 0 ? (
        <EmptyState title="No places yet" body="Add a town or city to a memory and it will appear here. Exact addresses are never stored." />
      ) : mode === "map" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className={cn("overflow-hidden rounded-[22px]", night ? "ring-1 ring-white/10" : "ring-1 ring-line shadow-sm")}>
              <MemoryMap points={points} activeId={activePlace} onSelect={(id) => select(id)} view={view} onViewChange={setView} journey={journey} showJourney={journeyOn} tone={night ? "night" : "paper"} aspect={1.15} label={`Map of places in ${capsule.preferredName}'s life`} />
            </div>
            <p className={cn("mt-3 text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>
              {pluralize(points.length, "place")} · locations shown at city level. Offline map — no live tiles or geocoding in this preview.
            </p>
          </div>
          <div ref={listRef} className="lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1">
            {groups.map((g) => (
              <section key={g.place.id} data-place={g.place.id} className={cn("mb-4 scroll-mt-4 rounded-[20px] p-4 transition-colors", activePlace === g.place.id ? (night ? "bg-white/[0.06] ring-1 ring-[#d7bc92]/40" : "bg-surface shadow-sm ring-1 ring-line") : "")}>
                <button type="button" onClick={() => select(g.place.id, false)} className="flex w-full items-start justify-between gap-3 text-left">
                  <span>
                    <span className={cn("flex items-center gap-2 font-serif text-[1.45rem] leading-tight", night ? "text-night-ink" : "text-ink")}>
                      <MapPin className="size-4 text-terracotta" /> {g.place.name}
                    </span>
                    {g.place.nickname ? <span className={cn("mt-0.5 block font-serif italic", night ? "text-night-ink-2" : "text-ink-2")}>“{g.place.nickname}”</span> : null}
                  </span>
                  <span className={cn("catalog shrink-0 pt-1.5", night && "text-night-ink-3")}>{displayCoords(g.place.point.lat, g.place.point.lng, g.place.precision)}</span>
                </button>
                <div className="mt-2">{g.items.map(storyRow)}</div>
              </section>
            ))}
            {unlocated.length ? (
              <section className="mt-6 px-4">
                <p className={cn("catalog mb-2", night && "text-night-ink-3")}>Not on the map · {unlocated.length}</p>
                <p className={cn("mb-2 text-[0.875rem]", night ? "text-night-ink-3" : "text-ink-3")}>These memories don&rsquo;t have a place yet{scope === "studio" ? " — open one to add a town or city." : "."}</p>
                {unlocated.map(storyRow)}
              </section>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <section key={g.place.id} className={cn("rounded-[20px] p-4", night ? "bg-white/[0.04] ring-1 ring-white/10" : "card-paper")}>
              <p className={cn("flex items-center gap-2 font-serif text-[1.4rem] leading-tight", night ? "text-night-ink" : "text-ink")}>
                <MapPin className="size-4 text-terracotta" /> {g.place.name}
              </p>
              <p className={cn("catalog mt-1", night && "text-night-ink-3")}>
                {g.place.country} · {pluralize(g.items.length, "memory", "memories")}
              </p>
              <div className="mt-3">{g.items.map(storyRow)}</div>
            </section>
          ))}
          {unlocated.length ? (
            <section className={cn("rounded-[20px] border border-dashed p-4", night ? "border-white/15" : "border-line-strong")}>
              <p className={cn("font-serif text-[1.4rem]", night ? "text-night-ink" : "text-ink")}>Not on the map</p>
              <div className="mt-3">{unlocated.map(storyRow)}</div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

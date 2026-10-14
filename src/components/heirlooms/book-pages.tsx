"use client";

import * as React from "react";
import type { BookConfiguration, ChapterKey, Memory, Place } from "@/domain/models";
import { chapterById } from "@/data/chapters";
import { BrandMark } from "@/components/brand/logo";
import { MediaImage } from "@/components/media/media-image";
import { useMediaAsset } from "@/hooks/use-data";
import { formatFuzzyDate, sortKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Page model                                                          */
/* ------------------------------------------------------------------ */

export type BookPage =
  | { kind: "blank" }
  | { kind: "half_title"; title: string }
  | { kind: "title"; title: string; subtitle: string }
  | { kind: "dedication"; text: string }
  | { kind: "contents"; entries: { title: string; page: number }[] }
  | { kind: "chapter"; n: number; title: string; subtitle: string; chapter: ChapterKey }
  | { kind: "photo"; mediaId: string; fullBleed: boolean; chapterTitle: string }
  | { kind: "story"; memory: Memory; placeName?: string; paragraphs: string[]; start: boolean; end: boolean; chapterTitle: string }
  | { kind: "timeline"; items: { year: string; title: string }[] }
  | { kind: "colophon"; title: string };

export const bookAspect: Record<BookConfiguration["size"], number> = { "8x10": 8 / 10, "10x10": 1, "11x8.5": 11 / 8.5 };
export const bookSizeLabel: Record<BookConfiguration["size"], string> = { "8x10": "8 × 10 in · portrait", "10x10": "10 × 10 in · square", "11x8.5": "11 × 8.5 in · landscape" };

/** Words that comfortably fit on a page at the body size, by trim. */
const WORDS: Record<BookConfiguration["size"], { start: number; cont: number }> = {
  "8x10": { start: 125, cont: 235 },
  "10x10": { start: 100, cont: 200 },
  "11x8.5": { start: 62, cont: 140 },
};

function paginate(text: string, firstMax: number, nextMax: number) {
  const paras = text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  let remaining = paras.reduce((n, p) => n + p.split(" ").length, 0);
  const pages: string[][] = [[]];
  let room = firstMax;
  // A page may stretch ~10% rather than strand a few words on a page of their own.
  const slack = (max: number) => Math.round(max * 0.1);
  for (const para of paras) {
    let words = para.split(" ");
    while (words.length) {
      const max = pages.length === 1 ? firstMax : nextMax;
      if (room < 25 && remaining > room + slack(max)) {
        pages.push([]);
        room = nextMax;
      }
      const fitsWithSlack = remaining <= room + slack(max);
      const take = fitsWithSlack ? words : words.slice(0, Math.max(room, 1));
      words = words.slice(take.length);
      remaining -= take.length;
      pages[pages.length - 1].push(take.join(" "));
      room -= take.length + 8; // paragraph spacing costs a little room
    }
  }
  return pages;
}

/** Story order inside the book: chapter order first, then life order. */
export function orderStories(memories: Memory[], chapterOrder: ChapterKey[]) {
  const rank = (c: ChapterKey) => {
    const i = chapterOrder.indexOf(c);
    return i === -1 ? 99 : i;
  };
  return [...memories].sort((a, b) => rank(a.chapter) - rank(b.chapter) || sortKey(a.date) - sortKey(b.date));
}

export function buildBookPages(config: BookConfiguration, memories: Memory[], places: Place[]): BookPage[] {
  const chosen = orderStories(
    memories.filter((m) => config.storyIds.includes(m.id)),
    config.chapterOrder,
  );
  const words = WORDS[config.size];
  const pages: BookPage[] = [];
  pages.push({ kind: "half_title", title: config.title });
  // Frontispiece: the cover photograph faces the title page.
  pages.push(config.coverMediaId ? { kind: "photo", mediaId: config.coverMediaId, fullBleed: false, chapterTitle: "" } : { kind: "blank" });
  pages.push({ kind: "title", title: config.title, subtitle: config.subtitle });
  pages.push(config.dedication.trim() ? { kind: "dedication", text: config.dedication.trim() } : { kind: "blank" });
  const contentsIndex = pages.length;
  pages.push({ kind: "contents", entries: [] });
  pages.push({ kind: "blank" });

  const entries: { title: string; page: number }[] = [];
  const groups = config.chapterOrder.map((c) => ({ chapter: c, stories: chosen.filter((m) => m.chapter === c) })).filter((g) => g.stories.length);
  let photoToggle = false;
  groups.forEach((g, gi) => {
    // Chapter openers start on a right-hand page: page 1 is index 0, so right-hand pages have even indexes.
    if (pages.length % 2 === 1) pages.push({ kind: "blank" });
    const ch = chapterById(g.chapter);
    entries.push({ title: ch.title, page: pages.length + 1 });
    pages.push({ kind: "chapter", n: gi + 1, title: ch.title, subtitle: ch.subtitle, chapter: g.chapter });
    for (const m of g.stories) {
      const place = places.find((p) => p.id === m.placeId);
      const photo = m.photoIds[0];
      const fullBleed = config.layout === "full_bleed" || (config.layout === "mixed" && (photoToggle = !photoToggle));
      const chunks = paginate(m.narrative, words.start, words.cont);
      const storyPages: BookPage[] = chunks.map((paragraphs, i) => ({ kind: "story", memory: m, placeName: place?.nickname ?? place?.name, paragraphs, start: i === 0, end: i === chunks.length - 1, chapterTitle: ch.title }));
      // Photographs face their story: the photo takes the left-hand page whenever it can.
      const nextIsLeft = pages.length % 2 === 1;
      if (photo && nextIsLeft) pages.push({ kind: "photo", mediaId: photo, fullBleed, chapterTitle: ch.title }, ...storyPages);
      else if (photo) pages.push(...storyPages, { kind: "photo", mediaId: photo, fullBleed, chapterTitle: ch.title });
      else pages.push(...storyPages);
      // Extra photographs sit on their own pages after the story.
      for (const extra of m.photoIds.slice(1, 3)) pages.push({ kind: "photo", mediaId: extra, fullBleed: false, chapterTitle: ch.title });
    }
  });

  if (config.includeTimeline && chosen.length) {
    if (pages.length % 2 === 1) pages.push({ kind: "blank" });
    entries.push({ title: "A timeline", page: pages.length + 1 });
    const items = [...chosen].sort((a, b) => sortKey(a.date) - sortKey(b.date)).map((m) => ({ year: formatFuzzyDate(m.date, "short"), title: m.title }));
    for (let i = 0; i < items.length; i += 14) pages.push({ kind: "timeline", items: items.slice(i, i + 14) });
  }
  pages.push({ kind: "colophon", title: config.title });
  while (pages.length % 4 !== 0) pages.splice(pages.length - 1, 0, { kind: "blank" });
  pages[contentsIndex] = { kind: "contents", entries };
  return pages;
}

/** Spreads as they'll be seen: the first page sits alone on the right. */
export function toSpreads(pages: BookPage[]): [number | null, number | null][] {
  const out: [number | null, number | null][] = [[null, 0]];
  for (let i = 1; i < pages.length; i += 2) out.push([i, i + 1 < pages.length ? i + 1 : null]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Rendering — sizes in cqw so a page reads the same at any scale.     */
/* ------------------------------------------------------------------ */

const ink = "#24221f";
const muted = "#6f6858";

export function BookPageView({ page, index, config, className, proof }: { page: BookPage; index: number; config: BookConfiguration; className?: string; proof?: boolean }) {
  const folio = index + 1;
  const left = folio % 2 === 0;
  const showFolio = !["blank", "half_title", "title", "chapter", "colophon"].includes(page.kind) && !(page.kind === "photo" && page.fullBleed);
  const runningHead = page.kind === "story" && !page.start ? page.chapterTitle : null;
  return (
    <div className={cn("relative overflow-hidden bg-[#fbf8f1]", className)} style={{ aspectRatio: bookAspect[config.size], containerType: "inline-size", color: ink }}>
      <PageBody page={page} config={config} />
      {runningHead ? (
        <p className="absolute inset-x-[10cqw] top-[5cqw] font-serif italic" style={{ fontSize: "2.4cqw", color: muted, textAlign: left ? "left" : "right" }}>
          {runningHead}
        </p>
      ) : null}
      {showFolio ? (
        <p className="absolute bottom-[4.5cqw] font-mono" style={{ fontSize: "2cqw", color: muted, letterSpacing: "0.12em", [left ? "left" : "right"]: "10cqw" }}>
          {folio}
        </p>
      ) : null}
      {proof ? (
        <p className="pointer-events-none absolute left-1/2 top-[3cqw] -translate-x-1/2 whitespace-nowrap rounded-full border px-[1.6cqw] py-[0.5cqw] font-mono uppercase" style={{ fontSize: "1.6cqw", letterSpacing: "0.14em", color: "#9a5238", borderColor: "#9a523855" }}>
          Demo proof
        </p>
      ) : null}
      {/* gutter shading */}
      <div className="pointer-events-none absolute inset-y-0 w-[7cqw]" style={{ [left ? "right" : "left"]: 0, background: `linear-gradient(${left ? "to left" : "to right"}, rgb(0 0 0 / 0.07), transparent)` }} />
    </div>
  );
}

function PageBody({ page, config }: { page: BookPage; config: BookConfiguration }) {
  switch (page.kind) {
    case "blank":
      return null;
    case "half_title":
      return (
        <div className="absolute inset-0 grid place-items-center">
          <p className="font-serif" style={{ fontSize: "4.2cqw" }}>
            {page.title}
          </p>
        </div>
      );
    case "title":
      return (
        <div className="absolute inset-0 flex flex-col items-center px-[12cqw] pb-[10cqw] pt-[24cqw] text-center">
          <p className="font-mono uppercase" style={{ fontSize: "1.9cqw", letterSpacing: "0.28em", color: muted }}>
            The life &amp; stories of
          </p>
          <p className="mt-[5cqw] font-serif leading-[0.95]" style={{ fontSize: "10cqw", letterSpacing: "-0.02em" }}>
            {page.title}
          </p>
          <p className="mt-[3.5cqw] font-serif italic" style={{ fontSize: "4cqw", color: "#474239" }}>
            {page.subtitle}
          </p>
          <span className="mt-auto text-[#34473f]" style={{ width: "6cqw" }}>
            <BrandMark className="size-full" />
          </span>
        </div>
      );
    case "dedication":
      return (
        <div className="absolute inset-0 grid place-items-center px-[18cqw] text-center">
          <p className="font-serif italic leading-[1.45]" style={{ fontSize: "3.6cqw", color: "#3c3830" }}>
            {page.text}
          </p>
        </div>
      );
    case "contents":
      return (
        <div className="absolute inset-0 px-[12cqw]" style={{ paddingTop: page.entries.length > 7 ? "12cqw" : "18cqw" }}>
          <p className="font-serif" style={{ fontSize: "6cqw" }}>
            Contents
          </p>
          <ol className={cn("mt-[5cqw]", page.entries.length > 7 ? "space-y-[1.7cqw]" : "space-y-[2.6cqw]")}>
            {page.entries.map((e, i) => (
              <li key={e.title} className="flex items-baseline gap-[2cqw]" style={{ fontSize: "3cqw" }}>
                <span className="font-mono" style={{ fontSize: "2cqw", color: muted, width: "4cqw" }}>
                  {e.title === "A timeline" ? "—" : String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif">{e.title}</span>
                <span className="flex-1 border-b border-dotted" style={{ borderColor: "#cfc6b3" }} />
                <span className="font-mono" style={{ fontSize: "2.2cqw", color: muted }}>
                  {e.page}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "chapter":
      return (
        <div className="absolute inset-0 flex flex-col justify-end px-[12cqw] pb-[18cqw]">
          <p className="font-serif italic" style={{ fontSize: "16cqw", color: "#d7cdb9", lineHeight: 1 }}>
            {String(page.n).padStart(2, "0")}
          </p>
          <p className="mt-[3cqw] font-serif leading-[1]" style={{ fontSize: "8cqw", letterSpacing: "-0.015em" }}>
            {page.title}
          </p>
          <p className="mt-[2.5cqw] font-serif italic" style={{ fontSize: "3.4cqw", color: muted }}>
            {page.subtitle}
          </p>
          <span className="mt-[6cqw] block h-px w-[14cqw]" style={{ background: "#b9a77f" }} />
        </div>
      );
    case "photo":
      return page.fullBleed ? (
        <MediaImage mediaId={page.mediaId} className="absolute inset-0 size-full" />
      ) : (
        <div className={cn("absolute inset-0 flex flex-col justify-center", config.size === "11x8.5" ? "px-[21cqw]" : "px-[11cqw]")}>
          <div className="bg-white p-[2.4cqw] shadow-[0_1px_2px_rgb(0_0_0/0.08),0_8px_20px_-12px_rgb(0_0_0/0.25)]">
            <MediaImage mediaId={page.mediaId} className="aspect-[4/3] w-full" />
          </div>
          {config.includeCaptions ? <PhotoCaption mediaId={page.mediaId} /> : null}
        </div>
      );
    case "story": {
      const m = page.memory;
      return (
        <div className="absolute inset-0 px-[11cqw] pb-[12cqw] pt-[12cqw]">
          {page.start ? (
            <>
              <p className="font-mono uppercase" style={{ fontSize: "1.8cqw", letterSpacing: "0.22em", color: "#8a7550" }}>
                {formatFuzzyDate(m.date)}
                {page.placeName ? ` · ${page.placeName}` : ""}
              </p>
              <p className="mt-[2.6cqw] font-serif leading-[1.02]" style={{ fontSize: "6.4cqw", letterSpacing: "-0.015em" }}>
                {m.title}
              </p>
              <span className="mt-[3.4cqw] mb-[3.4cqw] block h-px w-[9cqw]" style={{ background: "#b9a77f" }} />
            </>
          ) : null}
          <div className="font-serif" style={{ fontSize: "2.85cqw", lineHeight: 1.58 }}>
            {page.paragraphs.map((p, i) => (
              <p key={i} className={cn(i > 0 && "mt-[1.6cqw] indent-[3cqw]")}>
                {page.start && i === 0 ? (
                  <>
                    <span className="float-left mr-[1.2cqw] mt-[0.6cqw] font-serif leading-[0.8]" style={{ fontSize: "8.4cqw", color: "#34473f" }}>
                      {p.charAt(0)}
                    </span>
                    {p.slice(1)}
                  </>
                ) : (
                  p
                )}
              </p>
            ))}
          </div>
          {page.end ? (
            <p className="mt-[3cqw] font-serif italic" style={{ fontSize: "2.3cqw", color: muted }}>
              — told by {m.attribution.displayName}
            </p>
          ) : null}
        </div>
      );
    }
    case "timeline":
      return (
        <div className="absolute inset-0 px-[11cqw] pt-[12cqw]">
          <p className="font-serif" style={{ fontSize: "5.4cqw" }}>
            A timeline
          </p>
          <ol className="relative mt-[5cqw] border-l pl-[4cqw]" style={{ borderColor: "#d7cdb9" }}>
            {page.items.map((it, i) => (
              <li key={i} className="relative pb-[2.2cqw]">
                <span className="absolute top-[1cqw] block rounded-full" style={{ left: "-5.1cqw", width: "2cqw", height: "2cqw", background: "#fbf8f1", border: "0.4cqw solid #b9a77f" }} />
                <span className="block font-mono" style={{ fontSize: "1.8cqw", color: "#8a7550", letterSpacing: "0.12em" }}>
                  {it.year}
                </span>
                <span className="block font-serif" style={{ fontSize: "2.8cqw" }}>
                  {it.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "colophon":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-end px-[14cqw] pb-[14cqw] text-center">
          <span className="text-[#34473f]" style={{ width: "5cqw" }}>
            <BrandMark className="size-full" />
          </span>
          <p className="mt-[3cqw] font-serif italic" style={{ fontSize: "2.6cqw", color: "#474239" }}>
            {page.title} — made with LifeAtlas from stories told by family.
          </p>
          <p className="mt-[2cqw] font-mono uppercase" style={{ fontSize: "1.6cqw", letterSpacing: "0.18em", color: muted }}>
            Preview edition · not printed
          </p>
        </div>
      );
  }
}

/** Reads the caption from the store so the page model stays small. */
function PhotoCaption({ mediaId }: { mediaId: string }) {
  const caption = useMediaAsset(mediaId)?.caption;
  if (!caption) return null;
  return (
    <p className="mt-[3cqw] font-serif italic" style={{ fontSize: "2.5cqw", color: "#474239" }}>
      {caption}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Spread viewer                                                       */
/* ------------------------------------------------------------------ */

export function SpreadViewer({ pages, config, className }: { pages: BookPage[]; config: BookConfiguration; className?: string }) {
  const spreads = React.useMemo(() => toSpreads(pages), [pages]);
  const [i, setI] = React.useState(0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const idx = Math.min(i, spreads.length - 1);
  const go = React.useCallback(
    (d: 1 | -1) => {
      setDir(d);
      setI((v) => Math.max(0, Math.min(spreads.length - 1, Math.min(v, spreads.length - 1) + d)));
    },
    [spreads.length],
  );
  const [l, r] = spreads[idx];
  return (
    <div className={className}>
      <div
        className="relative rounded-[10px] bg-[radial-gradient(120%_120%_at_50%_0%,#ece5d6,#ddd4c1)] p-[4%] outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        tabIndex={0}
        role="group"
        aria-roledescription="book preview"
        aria-label={`Spread ${idx + 1} of ${spreads.length}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <div key={idx} className="relative grid grid-cols-2 shadow-[0_30px_50px_-28px_rgb(40_30_10/0.55)]" style={{ animation: `${dir === 1 ? "turn-next" : "turn-prev"} 420ms var(--ease-out) both` }}>
          {l === null ? <div /> : <BookPageView page={pages[l]} index={l} config={config} />}
          {r === null ? <div /> : <BookPageView page={pages[r]} index={r} config={config} />}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/10" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(-1)} disabled={idx === 0} className="min-h-11 rounded-full px-4 text-[0.9375rem] text-ink-2 hover:bg-ink/5 disabled:opacity-35">
          ← Previous
        </button>
        <div className="flex flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={spreads.length - 1}
            value={idx}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDir(v >= idx ? 1 : -1);
              setI(v);
            }}
            className="w-full accent-[var(--color-evergreen)]"
            aria-label="Jump to spread"
          />
          <span className="shrink-0 font-mono text-[0.75rem] text-ink-3">
            {idx + 1}/{spreads.length}
          </span>
        </div>
        <button type="button" onClick={() => go(1)} disabled={idx === spreads.length - 1} className="min-h-11 rounded-full px-4 text-[0.9375rem] text-ink-2 hover:bg-ink/5 disabled:opacity-35">
          Next →
        </button>
      </div>
    </div>
  );
}

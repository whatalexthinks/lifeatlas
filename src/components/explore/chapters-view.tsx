"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, BookOpenText, ArrowUpRight, AudioLines, Image as ImageIcon, Search, X } from "lucide-react";
import type { Capsule, ChapterKey, Memory } from "@/domain/models";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage, Mounted } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Segmented, Select } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterById, chapterColorVar } from "@/data/chapters";
import { formatFuzzyDate } from "@/lib/dates";
import { readingMinutes } from "@/lib/memory-utils";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

type Kind = "all" | "audio" | "photo" | "text";
const kindLabel: Record<Kind, string> = { all: "Any kind", audio: "With a voice", photo: "With photographs", text: "Written" };
const decadeOf = (m: Memory) => {
  const y = m.date.year ?? m.date.decade;
  return y === undefined ? null : Math.floor(y / 10) * 10;
};

/** Book-like reading: chapters in the capsule's chosen order, bookmarks, continuous mode — and a finder. */
export function ChaptersView({ capsule, scope, hrefFor, tone = "paper", initial }: { capsule: Capsule; scope: "studio" | "viewer"; hrefFor: (m: Memory) => string; tone?: "paper" | "night"; initial?: { q?: string; saved?: boolean; focus?: boolean } }) {
  const memories = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio" });
  const bookmarks = useDb((d) => d.bookmarks);
  const places = useDb((d) => d.places);
  const people = useDb((d) => d.people);
  const [mode, setMode] = React.useState<"contents" | "continuous">("contents");
  const [query, setQuery] = React.useState(initial?.q ?? "");
  const [chapter, setChapter] = React.useState<ChapterKey | "">("");
  const [decade, setDecade] = React.useState("");
  const [kind, setKind] = React.useState<Kind>("all");
  const [savedOnly, setSavedOnly] = React.useState(!!initial?.saved);
  const night = tone === "night";
  const order = capsule.chapterOrder;
  const groups = order.map((id) => ({ chapter: chapterById(id), items: memories.filter((m) => m.chapter === id) })).filter((g) => g.items.length);
  const isMarked = (m: Memory) => bookmarks.some((b) => b.capsuleId === capsule.id && b.memoryId === m.id);
  const marked = memories.filter(isMarked);
  const decades = [...new Set(memories.map(decadeOf).filter((d): d is number => d !== null))].sort((a, b) => a - b);

  const term = query.trim().toLowerCase();
  const filtering = !!term || !!chapter || !!decade || kind !== "all" || savedOnly;
  const results = filtering
    ? memories.filter((m) => {
        if (savedOnly && !isMarked(m)) return false;
        if (chapter && m.chapter !== chapter) return false;
        if (decade && decadeOf(m) !== Number(decade)) return false;
        if (kind === "audio" && !m.audioId) return false;
        if (kind === "photo" && !m.photoIds.length) return false;
        if (kind === "text" && (m.audioId || m.photoIds.length)) return false;
        if (!term) return true;
        const place = places.find((p) => p.id === m.placeId)?.name ?? "";
        const who = m.peopleIds.map((id) => people.find((p) => p.id === id)?.displayName ?? "").join(" ");
        return `${m.title} ${m.narrative} ${m.quote ?? ""} ${m.tags.join(" ")} ${m.attribution.displayName} ${place} ${who}`.toLowerCase().includes(term);
      })
    : [];
  const clear = () => {
    setQuery("");
    setChapter("");
    setDecade("");
    setKind("all");
    setSavedOnly(false);
  };

  if (!memories.length) return <EmptyState title="No chapters yet" body="Stories are grouped into chapters — childhood, love, work, journeys — as they're added." />;

  const muted = night ? "text-night-ink-3" : "text-ink-3";
  return (
    <div>
      <search className={cn("mb-8 block rounded-[18px] border p-3 sm:p-4", night ? "border-white/[0.09] bg-white/[0.03]" : "border-line bg-surface")} aria-label="Find a story">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search stories</span>
            <Search className={cn("pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2", muted)} aria-hidden />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search words, places, people…" className="pl-10" autoFocus={initial?.focus} />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select aria-label="Chapter" value={chapter} onChange={(e) => setChapter(e.target.value as ChapterKey | "")} className="sm:w-auto">
              <option value="">All chapters</option>
              {groups.map((g) => (
                <option key={g.chapter.id} value={g.chapter.id}>
                  {g.chapter.title}
                </option>
              ))}
            </Select>
            <Select aria-label="Decade" value={decade} onChange={(e) => setDecade(e.target.value)} className="sm:w-auto">
              <option value="">Any time</option>
              {decades.map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </Select>
            <Select aria-label="Kind of story" value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="sm:w-auto">
              {(Object.keys(kindLabel) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {kindLabel[k]}
                </option>
              ))}
            </Select>
            <button
              type="button"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-4 text-[0.9375rem] transition",
                savedOnly ? "border-evergreen bg-evergreen text-on-evergreen" : night ? "border-white/15 hover:border-white/30" : "border-line-strong hover:border-ink/30",
              )}
            >
              <BookmarkCheck className="size-4" /> Saved{marked.length ? ` (${marked.length})` : ""}
            </button>
          </div>
        </div>
      </search>

      {filtering ? (
        <section aria-labelledby="find-results">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="find-results" className={cn("text-[0.9375rem] font-medium", night ? "text-night-ink-2" : "text-ink-2")} aria-live="polite">
              {results.length === 1 ? "1 story" : `${results.length} stories`}
              {savedOnly ? " saved" : ""}
              {term ? ` matching “${query.trim()}”` : ""}
            </h2>
            <Button size="sm" variant="ghost" leading={<X className="size-4" />} onClick={clear}>
              Clear
            </Button>
          </div>
          {results.length ? (
            <ol className={cn("divide-y rounded-[18px] border", night ? "divide-white/[0.07] border-white/[0.09]" : "divide-line border-line bg-surface")}>
              {results.map((m) => {
                const ch = chapterById(m.chapter);
                const place = places.find((p) => p.id === m.placeId);
                return (
                  <li key={m.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                    <span className="mt-2.5 size-2 shrink-0 rounded-full" style={{ background: chapterColorVar[ch.color] }} aria-hidden />
                    <Link href={hrefFor(m)} className="group min-w-0 flex-1">
                      <span className={cn("block font-serif text-[1.25rem] leading-snug group-hover:underline group-hover:underline-offset-4", night ? "text-night-ink" : "text-ink")}>
                        <Highlight text={m.title} term={term} />
                      </span>
                      <span className={cn("mt-1 flex flex-wrap items-center gap-x-2 text-[0.8125rem]", muted)}>
                        {ch.title} · {formatFuzzyDate(m.date, "short")}
                        {place ? ` · ${place.name}` : ""} · {m.attribution.displayName}
                        {m.audioId ? <AudioLines className="size-3.5" aria-label="Has a recording" /> : null}
                        {m.photoIds.length ? <ImageIcon className="size-3.5" aria-label="Has photographs" /> : null}
                      </span>
                      {term ? (
                        <span className={cn("mt-2 block text-[0.9375rem] leading-relaxed", night ? "text-night-ink-2" : "text-ink-2")}>
                          <Highlight text={snippet(m.narrative, term)} term={term} />
                        </span>
                      ) : null}
                    </Link>
                    <BookmarkButton capsuleId={capsule.id} memory={m} on={isMarked(m)} night={night} />
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState
              title={savedOnly && !marked.length ? "Nothing saved yet" : "No stories match"}
              body={savedOnly && !marked.length ? "Tap the bookmark beside any story to keep it here." : "Try fewer words, or clear a filter."}
              action={
                <Button variant="secondary" onClick={clear}>
                  Show all stories
                </Button>
              }
            />
          )}
        </section>
      ) : null}

      <div hidden={filtering}>
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
          <button type="button" onClick={() => setSavedOnly(true)} className={cn("min-h-9 text-[0.875rem] underline underline-offset-2", muted)}>
            {marked.length} saved — show them
          </button>
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
                  <article key={m.id} className="mb-16 scroll-mt-28">
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
    </div>
  );
}

/** A short excerpt around the first match, so search results show why they matched. */
function snippet(text: string, term: string) {
  const i = text.toLowerCase().indexOf(term);
  if (i < 0) return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text;
  const start = Math.max(0, i - 60);
  const end = Math.min(text.length, i + term.length + 100);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term ? (
          <mark key={i} className="rounded-[3px] bg-brass/30 px-0.5 text-inherit">
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
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

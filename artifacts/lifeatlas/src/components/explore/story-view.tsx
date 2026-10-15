"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, MapPin, Share2 } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage, Mounted } from "@/components/media/media-image";
import { VideoClip } from "@/components/media/video-clip";
import { MemoryMap } from "@/components/map/memory-map";
import { displayCoords } from "@/components/map/geo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { MemoryStatusBadge } from "@/components/studio/primitives";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterColorVar } from "@/data/chapters";
import { formatFuzzyDate } from "@/lib/dates";
import { readingMinutes } from "@/lib/memory-utils";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";
import { ShareComposer } from "./share-composer";
import { chapterFor } from "@/domain/capsule-kinds";

export function StoryView({ capsule, memory, scope, hrefFor, tone = "paper", backHref }: { capsule: Capsule; memory: Memory; scope: "studio" | "viewer"; hrefFor: (m: Memory) => string; tone?: "paper" | "night"; backHref: string }) {
  const ordered = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio" });
  const places = useDb((d) => d.places);
  const people = useDb((d) => d.people);
  const media = useDb((d) => d.media);
  const bookmarks = useDb((d) => d.bookmarks);
  const [share, setShare] = React.useState(false);
  const night = tone === "night";
  const place = places.find((p) => p.id === memory.placeId);
  const chapter = chapterFor(capsule, memory.chapter);
  const i = ordered.findIndex((m) => m.id === memory.id);
  const prev = i > 0 ? ordered[i - 1] : undefined;
  const next = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : undefined;
  const marked = bookmarks.some((b) => b.capsuleId === capsule.id && b.memoryId === memory.id);
  const [lead, ...rest] = memory.photoIds;
  const tagged = people.filter((p) => memory.peopleIds.includes(p.id));
  const audio = media.find((a) => a.id === memory.audioId);

  return (
    <article className="pb-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className={cn("inline-flex items-center gap-1.5 text-[0.9rem]", night ? "text-night-ink-3 hover:text-night-ink" : "text-ink-3 hover:text-ink")}>
          <ArrowLeft className="size-4" /> All stories
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant={night ? "outlineLight" : "secondary"}
            size="sm"
            onClick={() => void services().capsules.toggleBookmark(capsule.id, memory.id)}
            aria-pressed={marked}
            leading={marked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          >
            {marked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button variant={night ? "outlineLight" : "secondary"} size="sm" onClick={() => setShare(true)} leading={<Share2 className="size-4" />}>
            Share preview
          </Button>
        </div>
      </div>

      <header className={cn("grid items-end gap-10", lead ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" : "")}>
        {lead ? (
          <Mounted caption={media.find((a) => a.id === lead)?.caption} meta={formatFuzzyDate(memory.date, "short")} className={night ? "bg-[#272522]" : undefined}>
            <MediaImage mediaId={lead} className="aspect-[4/3]" priority develop />
          </Mounted>
        ) : null}
        <div>
          <p className={cn("flex flex-wrap items-center gap-x-2.5 font-mono text-[0.75rem] uppercase tracking-[0.14em]", night ? "text-[#d7bc92]" : "text-brass-ink")}>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: chapterColorVar[chapter.color] }} />
              {chapter.title}
            </span>
            <span>·</span>
            <span>{formatFuzzyDate(memory.date)}</span>
            {place ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {place.name}
                </span>
              </>
            ) : null}
          </p>
          <h1 className={cn("mt-5 font-serif text-[clamp(2.6rem,1.9rem+2.8vw,4.6rem)] leading-[1] tracking-[-0.028em]", night ? "text-night-ink" : "text-ink")}>{memory.title}</h1>
          {memory.quote ? <p className={cn("mt-6 border-l-2 pl-5 font-serif text-[1.45rem] italic leading-snug", night ? "border-[#d7bc92] text-night-ink-2" : "border-evergreen text-ink-2")}>&ldquo;{memory.quote}&rdquo;</p> : null}
          <p className={cn("mt-6 text-[0.9375rem]", night ? "text-night-ink-3" : "text-ink-3")}>
            Shared by <span className={night ? "text-night-ink" : "text-ink"}>{memory.attribution.displayName}</span>
            {memory.attribution.relationship && memory.attribution.relationship !== "Storyteller" ? ` · ${memory.attribution.relationship}` : ""} · {readingMinutes(memory.narrative)} min read
          </p>
          {scope === "studio" && memory.status !== "approved" ? (
            <div className="mt-4">
              <MemoryStatusBadge status={memory.status} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {audio ? <AudioPlayer asset={audio} title={`${memory.title} — ${memory.attribution.displayName}`} tone={night ? "light" : "ink"} className="mb-10" /> : null}
          {memory.narrative ? (
            <div className={cn("prose-story max-w-[40rem]", night && "text-night-ink")}>
              {memory.narrative.split(/\n{2,}/).map((p, k) => (
                <p key={k} className={k === 0 ? "drop-cap" : undefined}>
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <p className={night ? "text-night-ink-3" : "text-ink-3"}>This memory was shared as {audio ? "a recording" : memory.videoIds?.length && !memory.photoIds.length ? "a video" : "photographs"}.</p>
          )}
          {memory.videoIds?.length ? (
            <div className="mt-12 space-y-6">
              {memory.videoIds.map((id) => (
                <VideoClip key={id} mediaId={id} title={`${memory.title} — video`} />
              ))}
            </div>
          ) : null}
          {rest.length ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {rest.map((id) => (
                <Mounted key={id} caption={media.find((a) => a.id === id)?.caption} className={night ? "bg-[#272522]" : undefined}>
                  <MediaImage mediaId={id} className="aspect-[4/3]" />
                </Mounted>
              ))}
            </div>
          ) : null}
          {memory.photoIds.some((id) => media.find((a) => a.id === id)?.sampleNotice) ? (
            <p className={cn("mt-6 text-[0.75rem]", night ? "text-night-ink-3" : "text-ink-4")}>Images here are sample illustrations or a generated sample photograph — not real family photographs.</p>
          ) : null}
        </div>

        <aside className="space-y-8">
          {place ? (
            <div>
              <p className={cn("catalog mb-3", night && "text-night-ink-3")}>Where</p>
              <div className={cn("overflow-hidden rounded-[18px]", night ? "ring-1 ring-white/10" : "ring-1 ring-line")}>
                <MemoryMap points={[{ id: place.id, label: place.name, lat: place.point.lat, lng: place.point.lng, count: 1 }]} activeId={place.id} tone={night ? "night" : "paper"} controls={false} aspect={1.4} view={place.point.lng >= -75.6 && place.point.lng <= -66.4 && place.point.lat >= 40.2 && place.point.lat <= 47.6 ? "northeast" : "world"} />
              </div>
              <p className={cn("mt-2 text-[0.9375rem]", night ? "text-night-ink" : "text-ink")}>{place.name}</p>
              <p className={cn("catalog", night && "text-night-ink-3")}>{displayCoords(place.point.lat, place.point.lng, place.precision)} · {place.precision === "landmark" ? "Public landmark" : "City-level"}</p>
            </div>
          ) : null}
          {tagged.length ? (
            <div>
              <p className={cn("catalog mb-3", night && "text-night-ink-3")}>People in this story</p>
              <ul className="space-y-2">
                {tagged.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className={night ? "text-night-ink" : "text-ink"}>{p.displayName}</span>
                    <span className={cn("catalog", night && "text-night-ink-3")}>
                      {p.birthYear ?? ""}
                      {p.deathYear ? `–${p.deathYear}` : p.birthYear ? "–" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {memory.tags.length ? (
            <div>
              <p className={cn("catalog mb-3", night && "text-night-ink-3")}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {memory.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <nav aria-label="More stories" className={cn("mt-20 grid gap-4 border-t pt-8 sm:grid-cols-2", night ? "border-white/10" : "border-line")}>
        {prev ? (
          <Link href={hrefFor(prev)} className={cn("group rounded-[18px] p-4", night ? "hover:bg-white/[0.05]" : "hover:bg-surface")}>
            <span className={cn("catalog inline-flex items-center gap-1.5", night && "text-night-ink-3")}>
              <ArrowLeft className="size-3.5" /> Earlier · {formatFuzzyDate(prev.date, "short")}
            </span>
            <span className={cn("mt-1 block font-serif text-[1.5rem] leading-tight", night ? "text-night-ink" : "text-ink")}>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={hrefFor(next)} className={cn("group rounded-[18px] p-4 text-right", night ? "hover:bg-white/[0.05]" : "hover:bg-surface")}>
            <span className={cn("catalog inline-flex items-center gap-1.5", night && "text-night-ink-3")}>
              Later · {formatFuzzyDate(next.date, "short")} <ArrowRight className="size-3.5" />
            </span>
            <span className={cn("mt-1 block font-serif text-[1.5rem] leading-tight", night ? "text-night-ink" : "text-ink")}>{next.title}</span>
          </Link>
        ) : null}
      </nav>
      <ShareComposer open={share} onOpenChange={setShare} memory={memory} capsule={capsule} />
    </article>
  );
}

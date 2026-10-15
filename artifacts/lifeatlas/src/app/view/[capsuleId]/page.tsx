"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowDown, ArrowUpRight, AudioLines, BookOpen, Images, Map, Rows3 } from "lucide-react";
import { useViewer } from "@/components/viewer/viewer-shell";
import { MediaImage } from "@/components/media/media-image";
import { MemoryReveal } from "@/components/capture/memory-reveal";
import { RiseText } from "@/components/shared/reveal";
import { typographyClass, paletteStyles } from "@/components/capsule/capsule-cover";
import { useCapsuleMemories, useDb, usePlace, useRole } from "@/hooks/use-data";
import { decadesOf } from "@/lib/memory-utils";
import { cn, pluralize } from "@/lib/utils";
import { chapterFor } from "@/domain/capsule-kinds";

export default function ViewerCover() {
  const { capsule, tone, base } = useViewer();
  const memories = useCapsuleMemories(capsule.id, { scope: "viewer" });
  const media = useDb((d) => d.media);
  const role = useRole(capsule.id);
  const canManage = role === "owner" || role === "organizer";
  const birthplace = usePlace(capsule.birthplaceId);
  const [entered, setEntered] = React.useState(false);
  const night = tone === "night";
  const featured = memories.find((m) => m.id === capsule.featuredMemoryId) ?? memories.find((m) => m.photoIds.length) ?? memories[0];
  const coverMedia = capsule.cover.mediaId ?? featured?.photoIds[0];
  const decades = decadesOf(memories);
  const voices = memories.filter((m) => m.audioId).length;
  const photos = memories.reduce((s, m) => s + m.photoIds.filter((id) => media.some((a) => a.id === id)).length, 0);
  const places = new Set(memories.map((m) => m.placeId).filter(Boolean)).size;
  const p = paletteStyles[capsule.theme.palette];
  const exploreRef = React.useRef<HTMLDivElement | null>(null);

  const chaptersWith = capsule.chapterOrder.map((id) => ({ ch: chapterFor(capsule, id), n: memories.filter((m) => m.chapter === id).length })).filter((x) => x.n);

  return (
    <>
      {/* Entrance */}
      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden" aria-label="Archive cover">
        {coverMedia ? (
          <MediaImage mediaId={coverMedia} className="absolute inset-0 -z-10" priority develop focalY={capsule.cover.focalY} />
        ) : (
          <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(90% 80% at 70% 20%, ${p.bg}, #0f1311 75%)` }}>
            <div className="topo-lines absolute inset-0 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#12110f] via-[#12110f]/55 to-[#12110f]/10" />
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-10 sm:pb-20">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.22em] text-[#d7bc92] animate-[fade-in_1200ms_var(--ease-out)_200ms_both]">
            {capsule.title}
            {capsule.isSample ? " · A fictional sample archive" : ""}
          </p>
          <h1 className={cn("mt-5 max-w-5xl text-[clamp(3.4rem,2rem+7vw,9rem)] leading-[0.92] tracking-[-0.035em] text-[#fbf8f1]", typographyClass(capsule.theme.typography))}>
            <RiseText text={capsule.subjectName} baseDelay={250} />
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-xl animate-[fade-up_1000ms_var(--ease-out)_700ms_both]">
              {capsule.dedication ? <p className="font-serif text-[1.45rem] italic leading-snug text-[#e9e3d6]">{capsule.dedication}</p> : null}
              <p className="mt-4 font-mono text-[0.8125rem] tracking-[0.14em] text-[#c4bdb1]">
                {capsule.birthYear ? `${capsule.birthYear}, ` : ""}
                {birthplace ? `Born in ${birthplace.name}` : capsule.birthplaceLabel ? `Born in ${capsule.birthplaceLabel}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 animate-[fade-up_1000ms_var(--ease-out)_900ms_both]">
              <button
                onClick={() => {
                  setEntered(true);
                  exploreRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex h-14 items-center gap-2.5 rounded-full bg-[#f8f6f1] px-7 text-[1.05rem] font-medium text-[#1b1a18] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Explore this life <ArrowDown className="size-5" />
              </button>
              <Link href={`${base}/timeline`} className="inline-flex h-14 items-center rounded-full border border-white/30 px-6 text-[1rem] text-[#f3efe7] hover:bg-white/10">
                Skip the introduction
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section ref={exploreRef} className="mx-auto max-w-[1180px] scroll-mt-16 px-4 pb-24 pt-20 sm:px-8" aria-labelledby="explore-h">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className={cn("eyebrow", night && "text-[#d7bc92]")}>{entered ? "Welcome in" : "An archive of one life"}</p>
            <h2 id="explore-h" className={cn("mt-4 font-serif text-[clamp(2.4rem,1.8rem+2vw,3.6rem)] leading-[1.02]", night ? "text-night-ink" : "text-ink")}>
              {memories.length ? `${pluralize(memories.length, "story", "stories")}, ${decades.length ? `${decades[0]}s to ${decades[decades.length - 1]}s` : "and counting"}.` : "The first stories are on their way."}
            </h2>
            {memories.length === 0 ? (
              <div className={cn("mt-4 text-lead", night ? "text-night-ink-2" : "text-ink-2")}>
                <p>{canManage ? `Once you add or approve a story, it appears here for the family, with its photographs, places and ${capsule.preferredName}'s voice.` : `When stories are added and approved, they'll appear here, with photographs, places and ${capsule.preferredName}'s voice.`}</p>
                {canManage ? (
                  <Link href={`/app/gather?capsule=${capsule.id}`} className={cn("mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 text-[1rem] font-medium", night ? "bg-[#f8f6f1] text-[#1b1a18]" : "bg-evergreen text-on-evergreen")}>
                    Gather the first memory <ArrowUpRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}
            <p hidden={!memories.length} className={cn("mt-4 text-lead", night ? "text-night-ink-2" : "text-ink-2")}>
              {voices ? `${pluralize(voices, "recording")}, ` : ""}
              {pluralize(photos, "photograph")} and {pluralize(places, "place")}. Wander however you like.
            </p>
            <div hidden={!memories.length} className="mt-8 grid grid-cols-2 gap-3">
              {[
                { href: `${base}/timeline`, label: "Timeline", sub: "Decade by decade", icon: Rows3 },
                { href: `${base}/map`, label: "Memory map", sub: "The places that shaped them", icon: Map },
                { href: `${base}/stories`, label: "Chapters", sub: "Read like a book", icon: BookOpen },
                { href: `${base}/voices`, label: "Voices", sub: voices ? "Press play to listen" : "None yet", icon: AudioLines },
                { href: `${base}/photos`, label: "Photographs", sub: `${photos} images`, icon: Images },
              ].map((x) => (
                <Link key={x.href} href={x.href} className={cn("group flex items-center gap-3 rounded-[16px] p-4 transition-colors", night ? "bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]" : "card-paper hover:bg-surface")}>
                  <x.icon className={cn("size-5 shrink-0", night ? "text-[#d7bc92]" : "text-evergreen")} />
                  <span className="min-w-0">
                    <span className={cn("block font-medium", night ? "text-night-ink" : "text-ink")}>{x.label}</span>
                    <span className={cn("block truncate text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>{x.sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          {featured ? (
            <div>
              <p className={cn("catalog mb-3", night && "text-night-ink-3")}>A place to begin</p>
              <MemoryReveal memory={featured} subjectName={capsule.subjectName} animate={false} />
              <Link href={`${base}/stories/${featured.id}`} className={cn("mt-4 inline-flex items-center gap-1.5 font-medium hover:underline", night ? "text-[#d7bc92]" : "text-evergreen")}>
                Read the story <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ) : null}
        </div>

        {chaptersWith.length ? (
          <div className="mt-20">
            <p className={cn("eyebrow", night && "text-[#d7bc92]")}>Contents</p>
            <ol className={cn("mt-6 grid gap-x-10 sm:grid-cols-2", night ? "text-night-ink" : "text-ink")}>
              {chaptersWith.map(({ ch, n }, i) => (
                <li key={ch.id}>
                  <Link href={`${base}/stories#ch-${ch.id}`} className={cn("flex items-baseline justify-between gap-4 border-b py-4", night ? "border-white/10 hover:text-[#d7bc92]" : "border-line hover:text-evergreen")}>
                    <span className="font-serif text-[1.6rem]">
                      <span className={cn("mr-3 font-mono text-[0.75rem]", night ? "text-night-ink-3" : "text-ink-4")}>{String(i + 1).padStart(2, "0")}</span>
                      {ch.title}
                    </span>
                    <span className={cn("catalog inline-flex items-center gap-1", night && "text-night-ink-3")}>
                      {n} <ArrowUpRight className="size-3" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>
    </>
  );
}

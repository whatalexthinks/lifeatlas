"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { Dialog as RD } from "radix-ui";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Capsule, MediaAsset, Memory } from "@/domain/models";
import { LightboxImage, MediaImage } from "@/components/media/media-image";
import { EmptyState } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { formatFuzzyDate, sortKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { photoForPlate } from "@/lib/media/editorial-photos";

interface Photo {
  asset: MediaAsset;
  memory: Memory;
}

export function GalleryView({ capsule, scope, hrefFor, tone = "paper" }: { capsule: Capsule; scope: "studio" | "viewer"; hrefFor: (m: Memory) => string; tone?: "paper" | "night" }) {
  const memories = useCapsuleMemories(capsule.id, { scope: scope === "viewer" ? "viewer" : "studio" });
  const media = useDb((d) => d.media);
  const places = useDb((d) => d.places);
  const [order, setOrder] = React.useState<"time" | "story">("time");
  const [index, setIndex] = React.useState<number | null>(null);
  const night = tone === "night";

  const photos: Photo[] = React.useMemo(() => {
    const out: Photo[] = [];
    for (const m of memories) for (const id of m.photoIds) {
      const a = media.find((x) => x.id === id);
      if (a) out.push({ asset: a, memory: m });
    }
    if (order === "time") out.sort((a, b) => sortKey(a.asset.takenDate ?? a.memory.date) - sortKey(b.asset.takenDate ?? b.memory.date));
    return out;
  }, [memories, media, order]);

  const current = index !== null ? photos[index] : null;
  const go = React.useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  React.useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!photos.length) return <EmptyState title="No photographs yet" body="Photos added to memories gather here, in the order they were taken." />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-[0.9375rem]", night ? "text-night-ink-2" : "text-ink-2")}>{photos.length} photographs from {new Set(photos.map((p) => p.memory.id)).size} memories</p>
        <Segmented
          label="Order"
          size="sm"
          value={order}
          onChange={setOrder}
          options={[
            { value: "time", label: "When taken" },
            { value: "story", label: "By story" },
          ]}
        />
      </div>
      <div className="columns-2 gap-4 sm:columns-3 xl:columns-4 [&>*]:mb-4">
        {photos.map((p, i) => (
          <button
            key={`${p.asset.id}-${p.memory.id}`}
            type="button"
            onClick={() => setIndex(i)}
            className="group block w-full break-inside-avoid text-left"
            aria-label={`Open photograph: ${p.asset.caption || p.memory.title}`}
          >
            <figure className={cn("overflow-hidden rounded-[6px] p-2 pb-0 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5", night ? "bg-[#272522]" : "bg-surface")}>
              <MediaImage asset={p.asset} className="w-full" intrinsic alt={p.asset.alt} />
              <figcaption className="flex items-baseline justify-between gap-2 px-1 py-2.5">
                <span className={cn("truncate font-serif text-[0.95rem] italic", night ? "text-night-ink-2" : "text-ink-2")}>{p.asset.caption || p.memory.title}</span>
                <span className={cn("catalog shrink-0", night && "text-night-ink-3")}>{formatFuzzyDate(p.asset.takenDate ?? p.memory.date, "short")}</span>
              </figcaption>
            </figure>
          </button>
        ))}
      </div>
      <p className={cn("mt-6 text-[0.8125rem]", night ? "text-night-ink-3" : "text-ink-3")}>Illustrated sample plates are original artworks made for the demo, not real photographs.</p>

      <RD.Root open={index !== null} onOpenChange={(v) => !v && setIndex(null)}>
        <RD.Portal>
          <RD.Overlay className="fixed inset-0 z-[80] bg-[#0c0f0d]/95 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
          <RD.Content className="fixed inset-0 z-[81] flex flex-col text-[#f1ede6] outline-none">
            {current ? (
              <>
                <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                  <RD.Title className="catalog text-[#c4bdb1]">
                    {index! + 1} / {photos.length}
                  </RD.Title>
                  <RD.Description className="sr-only">{current.asset.alt}</RD.Description>
                  <RD.Close asChild>
                    <button className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close">
                      <X className="size-5" />
                    </button>
                  </RD.Close>
                </div>
                <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
                  <LightboxImage key={current.asset.id} asset={current.asset} />
                  {photos.length > 1 ? (
                    <>
                      <button onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:left-6" aria-label="Previous photograph">
                        <ChevronLeft className="size-6" />
                      </button>
                      <button onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:right-6" aria-label="Next photograph">
                        <ChevronRight className="size-6" />
                      </button>
                    </>
                  ) : null}
                </div>
                <div className="mx-auto w-full max-w-3xl px-6 pb-8 pt-5 text-center">
                  <p className="font-serif text-[1.5rem] italic leading-snug">{current.asset.caption || current.memory.title}</p>
                  <p className="catalog mt-2 text-[#c4bdb1]">
                    {formatFuzzyDate(current.asset.takenDate ?? current.memory.date)}
                    {current.asset.placeId || current.memory.placeId ? ` · ${places.find((p) => p.id === (current.asset.placeId ?? current.memory.placeId))?.name ?? ""}` : ""} · {current.asset.contributorName}
                  </p>
                  {current.asset.sampleNotice ? <p className="mt-2 text-[0.75rem] text-[#c4bdb1]">{current.asset.source.kind === "plate" && photoForPlate(current.asset.source.plateId) ? "Editorial photograph supplied for this sample archive. The family stories are fictional." : current.asset.sampleNotice}</p> : null}
                  <Link href={hrefFor(current.memory)} className="mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-[#d7bc92] hover:underline" onClick={() => setIndex(null)}>
                    Read “{current.memory.title}” <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </>
            ) : null}
          </RD.Content>
        </RD.Portal>
      </RD.Root>
    </div>
  );
}

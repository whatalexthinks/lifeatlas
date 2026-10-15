"use client";

import * as React from "react";
import type { Capsule } from "@/domain/models";
import { MediaImage, Plate } from "@/components/media/media-image";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Cover colours, drawn from the brand palette. Keys are stored on capsules and never renamed. */
export const paletteStyles: Record<Capsule["theme"]["palette"], { bg: string; ink: string; accent: string; soft: string; label: string }> = {
  evergreen: { bg: "#4b5647", ink: "#f4f1ea", accent: "#dcc6a0", soft: "#e6e8e1", label: "Forest" },
  terracotta: { bg: "#763f43", ink: "#f8efe9", accent: "#e8c9a6", soft: "#f1e3e1", label: "Oxblood" },
  slate: { bg: "#4a5560", ink: "#eef1f3", accent: "#e2cfa6", soft: "#e2e7ec", label: "Slate" },
  linen: { bg: "#ece5d8", ink: "#252421", accent: "#763f43", soft: "#f5f1e9", label: "Linen" },
  night: { bg: "#252421", ink: "#f3efe7", accent: "#d7bc92", soft: "#33312d", label: "Charcoal" },
};

export function typographyClass(t: Capsule["theme"]["typography"]) {
  return t === "italic" ? "font-serif italic" : t === "modern" ? "font-sans font-medium tracking-[-0.035em]" : "font-serif";
}

/** A stored photograph, or, for public previews, a sample illustration drawn by id. */
function CoverImage({ cover, className }: { cover: Capsule["cover"]; className?: string }) {
  if (!cover.mediaId && cover.plateId) return <Plate id={cover.plateId} alt="" className={className} focalY={cover.focalY} />;
  return <MediaImage mediaId={cover.mediaId} className={className} focalY={cover.focalY} />;
}

/** Editorial cover for a capsule. Works with or without a photograph. */
export function CapsuleCover({
  capsule,
  size = "md",
  className,
  showMeta = true,
}: {
  capsule: Pick<Capsule, "subjectName" | "title" | "birthYear" | "theme" | "cover" | "dedication">;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showMeta?: boolean;
}) {
  const p = paletteStyles[capsule.theme.palette];
  const hasImage = !!(capsule.cover.mediaId || capsule.cover.plateId) && capsule.cover.layout !== "type_only";
  const nameSize = { sm: "text-[1.6rem]", md: "text-[2.2rem]", lg: "text-[3rem]", hero: "text-[clamp(2.6rem,2rem+3vw,5rem)]" }[size];
  const years = capsule.birthYear ? `${capsule.birthYear}, ` : "";

  if (capsule.cover.layout === "full_bleed" && hasImage) {
    return (
      <div className={cn("relative isolate overflow-hidden", className)} style={{ backgroundColor: p.bg }}>
        <CoverImage cover={capsule.cover} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6" style={{ color: "#fbf8f1" }}>
          {showMeta ? <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] opacity-80">{capsule.title}</p> : null}
          <p className={cn("mt-1.5 leading-[0.98]", typographyClass(capsule.theme.typography), nameSize)}>{capsule.subjectName}</p>
          {showMeta && years ? <p className="mt-2 font-mono text-[0.75rem] tracking-[0.18em] opacity-80">{years}</p> : null}
        </div>
      </div>
    );
  }

  if (capsule.cover.layout === "portrait" && hasImage) {
    return (
      <div className={cn("relative isolate flex flex-col overflow-hidden", className)} style={{ backgroundColor: p.bg, color: p.ink }}>
        <div className="relative m-4 mb-0 flex-1 overflow-hidden rounded-[4px] sm:m-5 sm:mb-0">
          <CoverImage cover={capsule.cover} className="absolute inset-0" />
        </div>
        <div className="p-4 sm:p-5">
          {showMeta ? <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em]" style={{ color: p.accent }}>{capsule.title}</p> : null}
          <p className={cn("mt-1 leading-[1]", typographyClass(capsule.theme.typography), nameSize)}>{capsule.subjectName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative isolate flex flex-col justify-between overflow-hidden p-5 sm:p-6", className)} style={{ backgroundColor: p.bg, color: p.ink }}>
      <div className="topo-lines pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <p className="relative font-mono text-[0.6875rem] uppercase tracking-[0.16em]" style={{ color: p.accent }}>
        {showMeta ? capsule.title : `${brand.name}`}
      </p>
      <div className="relative">
        <p className={cn("leading-[0.98]", typographyClass(capsule.theme.typography), nameSize)}>{capsule.subjectName}</p>
        {showMeta && capsule.dedication && size !== "sm" ? <p className="mt-3 max-w-xs font-serif text-[1rem] italic leading-snug opacity-80">{capsule.dedication}</p> : null}
        {showMeta && years ? <p className="mt-3 font-mono text-[0.75rem] tracking-[0.18em] opacity-75">{years}</p> : null}
      </div>
    </div>
  );
}

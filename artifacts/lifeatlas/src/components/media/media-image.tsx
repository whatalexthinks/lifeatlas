"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import type { MediaAsset } from "@/domain/models";
import { useMediaAsset, useMediaUrl } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { photoForPlate } from "@/lib/media/editorial-photos";

/**
 * Displays any media image (sample plate, sample photo, or a photo stored on
 * this device). Shows a calm placeholder while loading and an honest message
 * when the file isn't on this device.
 */
/**
 * Print mode: vector plates use SVG filters (grain, softening) that browsers
 * rasterise at print resolution, producing huge PDFs. Inside a print context
 * each plate is drawn once to a canvas and embedded as a JPEG instead.
 */
const PrintContext = React.createContext(false);
export function PrintQuality({ children }: { children: React.ReactNode }) {
  return <PrintContext.Provider value>{children}</PrintContext.Provider>;
}

const rasterCache = new Map<string, Promise<string>>();
function rasterize(svgUrl: string, width = 1800): Promise<string> {
  let p = rasterCache.get(svgUrl);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth || 0.75;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.round(width * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(svgUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = () => resolve(svgUrl);
      img.src = svgUrl;
    });
    rasterCache.set(svgUrl, p);
  }
  return p;
}

function usePrintSafeUrl(url: string | null | undefined) {
  const print = React.useContext(PrintContext);
  const needs = print && !!url && url.startsWith("data:image/svg");
  const [raster, setRaster] = React.useState<{ from: string; to: string } | null>(null);
  React.useEffect(() => {
    if (!needs || !url) return;
    let live = true;
    void rasterize(url).then((to) => live && setRaster({ from: url, to }));
    return () => {
      live = false;
    };
  }, [needs, url]);
  if (!needs) return url;
  return raster?.from === url ? raster.to : null;
}

export function MediaImage({
  mediaId,
  asset: assetProp,
  className,
  imgClassName,
  sizes,
  priority,
  focalY = 50,
  develop,
  alt,
  intrinsic,
}: {
  mediaId?: string;
  asset?: MediaAsset;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  focalY?: number;
  develop?: boolean;
  alt?: string;
  /** Size the frame to the asset's own aspect ratio (masonry, lightbox). */
  intrinsic?: boolean;
}) {
  const fromStore = useMediaAsset(assetProp ? undefined : mediaId);
  const asset = assetProp ?? fromStore;
  const editorialPhoto = asset?.source.kind === "plate" ? photoForPlate(asset.source.plateId) : undefined;
  const { url: rawUrl, error } = useMediaUrl(asset);
  const url = usePrintSafeUrl(rawUrl);
  const print = React.useContext(PrintContext);
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-linen", className)} style={intrinsic && asset?.width && asset?.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : undefined}>
      {url ? (
        <img
          src={url}
          alt={alt ?? editorialPhoto?.alt ?? asset?.alt ?? ""}
          sizes={sizes}
          loading={priority || print ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          className={cn("size-full object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", develop && loaded && "develop", imgClassName)}
          style={{ objectPosition: `50% ${focalY}%` }}
        />
      ) : null}
      {!url && !error ? <div className="skeleton absolute inset-0 rounded-none" aria-hidden /> : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center">
          <div className="max-w-[16rem] text-ink-3">
            <ImageOff className="mx-auto mb-2 size-5" aria-hidden />
            <p className="text-[0.8125rem] leading-snug">{error}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Direct plate rendering by plate id (marketing pages, no store dependency). Served from the
 * cached /plates route so the illustration isn't inlined into the page's HTML.
 */
export function Plate({ id, className, alt, priority, focalY = 50 }: { id: string; className?: string; alt: string; priority?: boolean; focalY?: number }) {
  const photo = photoForPlate(id);
  return (
    <div className={cn("relative overflow-hidden bg-linen", className)}>
      <img src={photo?.url ?? `/plates/${id}`} alt={photo?.alt ?? alt} className="size-full object-cover" style={{ objectPosition: `50% ${focalY}%` }} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />
    </div>
  );
}

/** A museum mount around any image, with an optional catalogue caption. */
export function Mounted({ children, caption, meta, className, tilt = 0 }: { children: React.ReactNode; caption?: React.ReactNode; meta?: React.ReactNode; className?: string; tilt?: number }) {
  return (
    <figure className={cn("mount", className)} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      {children}
      {caption || meta ? (
        <figcaption className="flex items-baseline justify-between gap-4 px-0.5 pb-0.5 pt-3">
          {caption ? <span className="font-serif text-[0.98rem] italic leading-snug text-ink-2">{caption}</span> : <span />}
          {meta ? <span className="catalog shrink-0">{meta}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Uncropped image for lightboxes. */
export function LightboxImage({ asset, className }: { asset: MediaAsset; className?: string }) {
  const { url, error } = useMediaUrl(asset);
  if (error) return <p className="text-[0.9375rem] text-[#c4bdb1]">{error}</p>;
  if (!url) return <div className="skeleton h-[50dvh] w-[min(80vw,900px)] rounded-[8px] opacity-20" aria-hidden />;
  return <img src={url} alt={asset.alt} className={cn("max-h-[72dvh] max-w-full rounded-[4px] object-contain shadow-2xl", className)} />;
}

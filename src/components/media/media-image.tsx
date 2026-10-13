"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import type { MediaAsset } from "@/domain/models";
import { useMediaAsset, useMediaUrl } from "@/hooks/use-data";
import { plateDataUri } from "@/lib/plates";
import { cn } from "@/lib/utils";

/**
 * Displays any media image (sample plate, sample photo, or a photo stored on
 * this device). Shows a calm placeholder while loading and an honest message
 * when the file isn't on this device.
 */
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
  const { url, error } = useMediaUrl(asset);
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-linen", className)} style={intrinsic && asset?.width && asset?.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : undefined}>
      {url ? (
        <img
          src={url}
          alt={alt ?? asset?.alt ?? ""}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
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

/** Direct plate rendering by plate id (used on marketing pages with no store dependency). */
export function Plate({ id, className, alt, priority }: { id: string; className?: string; alt: string; priority?: boolean }) {
  const src = React.useMemo(() => plateDataUri(id), [id]);
  if (!src) return null;
  return (
    <div className={cn("relative overflow-hidden bg-linen", className)}>
      <img src={src} alt={alt} className="size-full object-cover" loading={priority ? "eager" : "lazy"} decoding="async" />
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
  if (error) return <p className="text-[0.9375rem] text-[#bdb7aa]">{error}</p>;
  if (!url) return <div className="skeleton h-[50dvh] w-[min(80vw,900px)] rounded-[8px] opacity-20" aria-hidden />;
  return <img src={url} alt={asset.alt} className={cn("max-h-[72dvh] max-w-full rounded-[4px] object-contain shadow-2xl", className)} />;
}

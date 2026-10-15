"use client";

import * as React from "react";
import { Film, VideoOff, X } from "lucide-react";
import { useMediaAsset, useMediaUrl } from "@/hooks/use-data";
import { validateVideoDeep, videoDuration, VIDEO_MAX_SECONDS } from "@/domain/media/video";
import { cn, formatBytes } from "@/lib/utils";

/** Plays a stored clip with the browser's own controls (captions, keyboard and screen readers work). */
export function VideoClip({ mediaId, className, title }: { mediaId: string; className?: string; title?: string }) {
  const asset = useMediaAsset(mediaId);
  const { url, error } = useMediaUrl(asset);
  return (
    <figure className={cn("overflow-hidden rounded-[16px] bg-night", className)}>
      {url ? (
        <video src={url} controls playsInline preload="metadata" className="aspect-video w-full bg-black" aria-label={title ?? asset?.caption ?? "Video"} />
      ) : (
        <div className="grid aspect-video place-items-center p-6 text-center text-night-ink-2">
          {error ? (
            <span className="max-w-xs text-[0.875rem]">
              <VideoOff className="mx-auto mb-2 size-5" aria-hidden />
              {error}
            </span>
          ) : (
            <span className="skeleton absolute inset-0 rounded-none" aria-hidden />
          )}
        </div>
      )}
      {asset?.caption ? <figcaption className="px-4 py-3 text-[0.875rem] text-night-ink-2">{asset.caption}</figcaption> : null}
    </figure>
  );
}

export interface PendingVideo {
  id: string;
  file: File;
  url: string;
  caption: string;
  durationSec?: number;
}

/**
 * Add short clips to a memory. Each is checked by its actual bytes, its length is read from the
 * browser, and the limit is explained rather than enforced silently.
 */
export function VideoAdder({ videos, onChange, max = 3 }: { videos: PendingVideo[]; onChange: (v: PendingVideo[]) => void; max?: number }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const latest = React.useRef(videos);
  React.useEffect(() => {
    latest.current = videos;
  }, [videos]);
  React.useEffect(() => () => latest.current.forEach((v) => URL.revokeObjectURL(v.url)), []);

  const add = async (files: FileList | null) => {
    setError(null);
    if (!files?.length) return;
    const next: PendingVideo[] = [];
    for (const file of Array.from(files).slice(0, max - videos.length)) {
      const v = await validateVideoDeep(file);
      if (!v.ok) {
        setError(`${file.name}: ${v.reason}`);
        continue;
      }
      const url = URL.createObjectURL(file);
      const durationSec = await videoDuration(url);
      if (durationSec !== undefined && durationSec > VIDEO_MAX_SECONDS) {
        URL.revokeObjectURL(url);
        setError(`${file.name}: clips can be up to ${VIDEO_MAX_SECONDS / 60} minutes in the preview.`);
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${Date.now()}`, file, url, caption: "", durationSec });
    }
    onChange([...videos, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {videos.length ? (
        <ul className="mb-3 space-y-3">
          {videos.map((v, i) => (
            <li key={v.id} className="overflow-hidden rounded-[14px] border border-line bg-surface">
              <div className="relative">
                <video src={v.url} controls playsInline preload="metadata" className="aspect-video w-full bg-black" aria-label={v.caption || `Video ${i + 1} you added`} />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(v.url);
                    onChange(videos.filter((x) => x.id !== v.id));
                  }}
                  className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75"
                  aria-label={`Remove video ${i + 1}`}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                <input
                  value={v.caption}
                  onChange={(e) => onChange(videos.map((x) => (x.id === v.id ? { ...x, caption: e.target.value } : x)))}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for video ${i + 1}`}
                  maxLength={140}
                  className="min-w-0 flex-1 bg-transparent text-[0.875rem] focus:outline-none"
                />
                <span className="shrink-0 font-mono text-[0.75rem] text-ink-3">
                  {v.durationSec ? `${Math.floor(v.durationSec / 60)}:${String(Math.round(v.durationSec % 60)).padStart(2, "0")} · ` : ""}
                  {formatBytes(v.file.size)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {videos.length < max ? (
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium text-ink-2 hover:border-ink-3 hover:text-ink">
          <Film className="size-4" aria-hidden /> {videos.length ? "Add another clip" : "Add a short video"}
        </button>
      ) : null}
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mov" multiple className="sr-only" tabIndex={-1} aria-label="Choose a video" onChange={(e) => void add(e.target.files)} />
      {error ? (
        <p className="mt-3 text-[0.875rem] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[0.8125rem] text-ink-3">MP4, MOV or WebM, up to 150 MB and 10 minutes. Kept in this browser in the preview.</p>
    </div>
  );
}

"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { validateFileDeep } from "@/domain/media/validation";
import { takenDateOf, type TakenDate } from "@/lib/media/exif";
import { cn } from "@/lib/utils";

export interface PendingPhoto {
  id: string;
  file: File;
  url: string;
  caption: string;
  width?: number;
  height?: number;
  /** The date the camera recorded, if any — offered to confirm, never applied on its own. */
  takenOn?: TakenDate;
}

async function dimensions(url: string) {
  return new Promise<{ width?: number; height?: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = url;
  });
}

/**
 * Photo picker with real MIME + signature validation and local previews. Photos can be
 * dropped in, reordered (buttons, or drag on larger screens) and captioned; the camera's date
 * is read so it can be offered — never assumed.
 */
export function PhotoAdder({ photos, onChange, max = 6, size = "standard" }: { photos: PendingPhoto[]; onChange: (p: PendingPhoto[]) => void; max?: number; size?: "senior" | "standard" }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dropping, setDropping] = React.useState(false);
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const big = size === "senior";
  // Remember the latest photos so their previews can be released on unmount.
  const latest = React.useRef(photos);
  React.useEffect(() => {
    latest.current = photos;
  }, [photos]);

  React.useEffect(
    () => () => {
      latest.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    onChange(next);
    setAnnounce(`Photo moved to position ${to + 1} of ${next.length}.`);
  };

  const add = async (files: FileList | File[] | null) => {
    setError(null);
    if (!files?.length) return;
    const next: PendingPhoto[] = [];
    for (const file of Array.from(files).slice(0, max - photos.length)) {
      const v = await validateFileDeep(file, "image");
      if (!v.ok) {
        setError(`${file.name}: ${v.reason}`);
        continue;
      }
      const url = URL.createObjectURL(file);
      const [dim, takenOn] = await Promise.all([dimensions(url), takenDateOf(file)]);
      next.push({ id: `${file.name}-${file.size}-${Date.now()}`, file, url, caption: "", ...dim, ...(takenOn ? { takenOn } : {}) });
    }
    if (Array.from(files).length > max - photos.length) setError(`You can add up to ${max} photos to one memory.`);
    onChange([...photos, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <div
      onDragOver={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
      }}
      onDrop={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        setDropping(false);
        void add(Array.from(e.dataTransfer.files));
      }}
      className={cn("rounded-[18px] transition-shadow", dropping && "shadow-[0_0_0_2px_var(--ink)] [&]:bg-ivory/60")}
    >
      <div className={cn("grid gap-3", big ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4")}>
        {photos.map((p, i) => (
          <figure
            key={p.id}
            draggable={photos.length > 1}
            onDragStart={(e) => {
              setDragFrom(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.stopPropagation();
              move(dragFrom, i);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
            className={cn("group relative overflow-hidden rounded-[14px] bg-linen", dragFrom === i && "opacity-50")}
          >
            <img src={p.url} alt={p.caption || `Photo ${i + 1} you added`} className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(p.url);
                onChange(photos.filter((x) => x.id !== p.id));
              }}
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="size-4" />
            </button>
            {photos.length > 1 ? (
              <span className="absolute left-2 top-2 flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75 disabled:hidden" aria-label={`Move photo ${i + 1} earlier`}>
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} className="grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75 disabled:hidden" aria-label={`Move photo ${i + 1} later`}>
                  <ArrowRight className="size-4" />
                </button>
              </span>
            ) : null}
            {i === 0 && photos.length > 1 ? <span className="absolute bottom-[2.6rem] left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] font-medium text-white">Cover</span> : null}
            <input
              value={p.caption}
              onChange={(e) => onChange(photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
              placeholder="Caption (optional)"
              aria-label={`Caption for photo ${i + 1}`}
              maxLength={140}
              className="w-full border-t border-line bg-surface px-2.5 py-2 text-[0.8125rem] focus:outline-none"
            />
          </figure>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line-strong bg-surface/60 text-ink-2 transition-colors hover:border-evergreen hover:text-evergreen",
              big ? "text-[1rem]" : "text-[0.875rem]",
            )}
          >
            <ImagePlus className={big ? "size-8" : "size-6"} />
            <span className="font-medium">{photos.length ? "Add another" : "Add a photo"}</span>
          </button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple className="sr-only" tabIndex={-1} onChange={(e) => void add(e.target.files)} />
      {error ? (
        <p className="mt-3 text-[0.875rem] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[0.8125rem] text-ink-3">Drop photos here or choose them. JPEG, PNG, WebP, AVIF or GIF, up to 15 MB each. The first photo leads the story. Photos stay in this browser in the preview.</p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

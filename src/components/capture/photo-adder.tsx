"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { validateFileDeep } from "@/domain/media/validation";
import { cn } from "@/lib/utils";

export interface PendingPhoto {
  id: string;
  file: File;
  url: string;
  caption: string;
  width?: number;
  height?: number;
}

async function dimensions(url: string) {
  return new Promise<{ width?: number; height?: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = url;
  });
}

/** Photo picker with real MIME + signature validation and local previews. */
export function PhotoAdder({ photos, onChange, max = 6, size = "standard" }: { photos: PendingPhoto[]; onChange: (p: PendingPhoto[]) => void; max?: number; size?: "senior" | "standard" }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const big = size === "senior";
  const latest = React.useRef(photos);
  latest.current = photos;

  React.useEffect(
    () => () => {
      latest.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );

  const add = async (files: FileList | null) => {
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
      const dim = await dimensions(url);
      next.push({ id: `${file.name}-${file.size}-${Date.now()}`, file, url, caption: "", ...dim });
    }
    if (files.length > max - photos.length) setError(`You can add up to ${max} photos to one memory.`);
    onChange([...photos, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className={cn("grid gap-3", big ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4")}>
        {photos.map((p) => (
          <figure key={p.id} className="group relative overflow-hidden rounded-[14px] bg-linen">
            <img src={p.url} alt={p.caption || "Photo you added"} className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(p.url);
                onChange(photos.filter((x) => x.id !== p.id));
              }}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
              aria-label="Remove photo"
            >
              <X className="size-4" />
            </button>
            <input
              value={p.caption}
              onChange={(e) => onChange(photos.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
              placeholder="Caption (optional)"
              aria-label="Photo caption"
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
      <p className="mt-2 text-[0.8125rem] text-ink-3">JPEG, PNG, WebP, AVIF or GIF, up to 15 MB each. Photos stay in this browser in the demo.</p>
    </div>
  );
}

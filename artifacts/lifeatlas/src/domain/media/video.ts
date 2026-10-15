import { formatBytes } from "@/lib/utils";

/**
 * Short video clips for memories. In the preview they are stored in this browser, so the
 * limit is deliberately modest and stated plainly; hosted storage arrives with accounts.
 */
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const VIDEO_MAX_BYTES = 150 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 10 * 60;

export type VideoValidation = { ok: true; mime: string } | { ok: false; reason: string };

const baseMime = (t: string) => t.split(";")[0].trim().toLowerCase();

/** Declared type and size. */
export function validateVideoFile(file: Pick<File, "type" | "size" | "name">): VideoValidation {
  const mime = baseMime(file.type || "") || (/\.mov$/i.test(file.name) ? "video/quicktime" : "");
  if (file.size === 0) return { ok: false, reason: "This file is empty." };
  if (!VIDEO_TYPES.includes(mime as (typeof VIDEO_TYPES)[number])) return { ok: false, reason: "Please choose an MP4, MOV or WebM video." };
  if (file.size > VIDEO_MAX_BYTES) return { ok: false, reason: `Videos can be up to ${formatBytes(VIDEO_MAX_BYTES)} in the preview, because they're kept in this browser. Trim the clip, or keep the full film somewhere safe and add a short part of it.` };
  return { ok: true, mime };
}

/** Recognise a video by its first bytes, so a renamed file can't pretend to be one. */
export function sniffVideo(bytes: Uint8Array): "video/mp4" | "video/quicktime" | "video/webm" | null {
  const ascii = (i: number, s: string) => [...s].every((c, j) => bytes[i + j] === c.charCodeAt(0));
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (ascii(4, "ftyp")) return ascii(8, "qt  ") ? "video/quicktime" : "video/mp4";
  // Older QuickTime files can start with other atoms.
  if (ascii(4, "moov") || ascii(4, "mdat") || ascii(4, "wide") || ascii(4, "free")) return "video/quicktime";
  return null;
}

export async function validateVideoDeep(file: File): Promise<VideoValidation> {
  const quick = validateVideoFile(file);
  if (!quick.ok) return quick;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffVideo(head)) return { ok: false, reason: "We couldn't recognise this video. It may be damaged or in a format this browser can't play." };
  return quick;
}

/** Read a clip's length from the browser, if it can play it. Resolves undefined when it can't. */
export function videoDuration(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const done = (d?: number) => {
      v.removeAttribute("src");
      resolve(d);
    };
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : undefined);
    v.onerror = () => done(undefined);
    v.src = url;
  });
}

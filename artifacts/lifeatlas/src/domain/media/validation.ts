import { appConfig } from "@/lib/config";
import { formatBytes } from "@/lib/utils";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
export const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac", "audio/x-m4a"] as const;

export type MediaValidation = { ok: true; kind: "image" | "audio"; mime: string } | { ok: false; reason: string };

const baseMime = (t: string) => t.split(";")[0].trim().toLowerCase();

/** Fast checks on declared type and size. */
export function validateMediaFile(file: Pick<File, "type" | "size" | "name">, expect: "image" | "audio"): MediaValidation {
  const mime = baseMime(file.type || "");
  if (file.size === 0) return { ok: false, reason: "This file is empty." };
  if (expect === "image") {
    if (!IMAGE_TYPES.includes(mime as (typeof IMAGE_TYPES)[number])) {
      if (/heic|heif/.test(mime) || /\.hei[cf]$/i.test(file.name)) {
        return { ok: false, reason: "HEIC photos can't be previewed in this browser yet. Please export as JPEG and try again." };
      }
      return { ok: false, reason: "Please choose a JPEG, PNG, WebP, AVIF or GIF image." };
    }
    if (file.size > appConfig.limits.imageBytes) return { ok: false, reason: `Images can be up to ${formatBytes(appConfig.limits.imageBytes)} on this device.` };
    return { ok: true, kind: "image", mime };
  }
  if (!AUDIO_TYPES.includes(mime as (typeof AUDIO_TYPES)[number])) {
    return { ok: false, reason: "Please choose an audio file (MP3, M4A, WAV, OGG or WebM)." };
  }
  if (file.size > appConfig.limits.audioBytes) return { ok: false, reason: `Recordings can be up to ${formatBytes(appConfig.limits.audioBytes)} on this device.` };
  return { ok: true, kind: "audio", mime };
}

/** Sniff magic bytes so a renamed file can't pretend to be an image. */
export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  const at = (i: number, ...v: number[]) => v.every((x, j) => b[i + j] === x);
  const ascii = (i: number, s: string) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (ascii(0, "GIF8")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(4, "ftyp") && (ascii(8, "avif") || ascii(8, "avis"))) return "image/avif";
  if (ascii(0, "RIFF") && ascii(8, "WAVE")) return "audio/wav";
  if (ascii(0, "OggS")) return "audio/ogg";
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return "audio/webm";
  if (ascii(0, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "audio/mpeg";
  if (ascii(4, "ftyp")) return "audio/mp4"; // m4a / mp4 audio
  return null;
}

export async function validateFileDeep(file: File, expect: "image" | "audio"): Promise<MediaValidation> {
  const quick = validateMediaFile(file, expect);
  if (!quick.ok) return quick;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const sniffed = sniffMime(head);
  if (!sniffed) return { ok: false, reason: "We couldn't recognise this file. It may be damaged or in an unsupported format." };
  const family = sniffed.split("/")[0];
  if (family !== expect) return { ok: false, reason: `This file looks like ${family === "image" ? "an image" : "audio"}, not ${expect === "image" ? "a photo" : "a recording"}.` };
  return { ok: true, kind: expect, mime: quick.mime };
}

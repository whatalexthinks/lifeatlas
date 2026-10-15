"use client";

import type { MediaAsset } from "@/domain/models";
import { validateMediaFile } from "@/domain/media/validation";
import { validateVideoFile } from "@/domain/media/video";
import { plateDataUri, renderPlateSvg } from "@/lib/plates";
import { deleteBlob, getBlob, isQuotaError, putBlob } from "@/lib/storage/idb";
import { sha256Hex, uid } from "@/lib/utils";
import { fail, notConfigured, ok, type MediaStorageProvider, type TranscriptionProvider } from "../contracts";
import { actorName, db, latency, store } from "./shared";
import { brand } from "@/config/brand";
import { photoForPlate } from "@/lib/media/editorial-photos";

/** Object URLs for local blobs, created once per page session and revoked on removal. */
const objectUrls = new Map<string, string>();

export const mockMedia: MediaStorageProvider = {
  async put(input) {
    const v = input.kind === "video" ? validateVideoFile({ type: input.blob.type, size: input.blob.size, name: "upload" }) : validateMediaFile({ type: input.blob.type, size: input.blob.size, name: "upload" }, input.kind);
    if (!v.ok) return fail("validation", v.reason);
    const blobKey = uid("blob");
    try {
      await putBlob(blobKey, input.blob);
    } catch (e) {
      if (isQuotaError(e)) return fail("quota", `This device is out of space for ${brand.name}. Download your archive or remove a recording, then try again.`);
      return fail("unknown", "We couldn't save this file on this device. Nothing was lost from your existing archive.");
    }
    const checksum = await sha256Hex(await input.blob.arrayBuffer());
    const now = new Date().toISOString();
    const asset: MediaAsset = {
      id: uid("med"),
      capsuleId: input.capsuleId,
      kind: input.kind,
      source: { kind: "local", blobKey },
      storage: "this_device",
      mimeType: v.mime,
      byteSize: input.blob.size,
      width: input.width,
      height: input.height,
      durationSec: input.durationSec,
      caption: input.caption ?? "",
      alt: input.alt ?? "",
      contributorName: input.contributorName,
      consent: { contributorAgreed: true, print: input.kind === "image", share: false },
      checksum,
      peaks: input.peaks,
      createdAt: now,
      updatedAt: now,
    };
    store().mutate((d) => {
      d.media.push(asset);
    }, { actor: input.contributorName, action: `media.${input.kind}_saved_on_device`, target: asset.id });
    return ok(asset);
  },

  async resolveUrl(asset) {
    switch (asset.source.kind) {
      case "static":
        return ok(asset.source.url);
      case "plate": {
        const photo = photoForPlate(asset.source.plateId);
        if (photo) return ok(photo.url);
        const uri = plateDataUri(asset.source.plateId);
        return uri ? ok(uri) : fail("not_found", "Sample illustration missing.");
      }
      case "local": {
        const key = asset.source.blobKey;
        const cached = objectUrls.get(key);
        if (cached) return ok(cached);
        try {
          const blob = await getBlob(key);
          if (!blob) return fail("not_found", "This file isn't on this device. It may have been created in another browser, or browser data was cleared.");
          const url = URL.createObjectURL(blob);
          objectUrls.set(key, url);
          return ok(url);
        } catch {
          return fail("unknown", "This browser couldn't open local storage.");
        }
      }
      case "remote":
        return notConfigured("media", "Cloud media storage is not connected in this preview.");
    }
  },

  async getBlob(asset) {
    switch (asset.source.kind) {
      case "local": {
        const b = await getBlob(asset.source.blobKey).catch(() => null);
        return b ? ok(b) : fail("not_found", "Not on this device.");
      }
      case "static": {
        try {
          const res = await fetch(asset.source.url);
          if (!res.ok) return fail("not_found", "Sample file unavailable.");
          return ok(await res.blob());
        } catch {
          return fail("unknown", "Sample file unavailable offline.");
        }
      }
      case "plate": {
        const photo = photoForPlate(asset.source.plateId);
        if (photo) {
          try {
            const response = await fetch(photo.url);
            return response.ok ? ok(await response.blob()) : fail("not_found", "Sample photograph missing.");
          } catch {
            return fail("not_found", "The sample photograph could not be loaded.");
          }
        }
        const svg = renderPlateSvg(asset.source.plateId);
        return svg ? ok(new Blob([svg], { type: "image/svg+xml" })) : fail("not_found", "Sample illustration missing.");
      }
      case "remote":
        return notConfigured("media", "Cloud media storage is not connected in this preview.");
    }
  },

  async remove(mediaId) {
    const asset = db().media.find((m) => m.id === mediaId);
    if (!asset) return fail("not_found", "File not found.");
    if (asset.source.kind === "local") {
      const key = asset.source.blobKey;
      await deleteBlob(key).catch(() => undefined);
      const url = objectUrls.get(key);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrls.delete(key);
      }
    }
    await latency();
    store().mutate(
      (d) => {
        d.media = d.media.filter((m) => m.id !== mediaId);
        for (const m of d.memories) {
          m.photoIds = m.photoIds.filter((p) => p !== mediaId);
          if (m.audioId === mediaId) m.audioId = undefined;
        }
      },
      { actor: actorName(), action: "media.removed", target: mediaId },
    );
    return ok(null);
  },

  async updateMeta(mediaId, patch) {
    store().mutate((d) => {
      const m = d.media.find((x) => x.id === mediaId);
      if (m) Object.assign(m, patch, { updatedAt: new Date().toISOString() });
    });
    const m = db().media.find((x) => x.id === mediaId);
    return m ? ok({ ...m }) : fail("not_found", "File not found.");
  },
};

export function revokeAllObjectUrls() {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
}

const CANDIDATE_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];

export function pickRecorderMime(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  for (const t of CANDIDATE_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export const mockTranscription: TranscriptionProvider = {
  detectSupport() {
    const hasWindow = typeof window !== "undefined";
    return {
      mediaRecorder: hasWindow && typeof MediaRecorder !== "undefined",
      getUserMedia: hasWindow && !!navigator.mediaDevices?.getUserMedia,
      secureContext: hasWindow && window.isSecureContext,
      mimeType: pickRecorderMime(),
    };
  },
  async requestTranscript() {
    return notConfigured("transcription", "Automatic transcription isn't connected in this preview. You can type or paste a transcript yourself, we never invent one.");
  },
  async saveManualTranscript(mediaId, text) {
    const now = new Date().toISOString();
    const existing = db().transcripts.find((t) => t.mediaId === mediaId);
    const id = existing?.id ?? uid("tr");
    store().mutate((d) => {
      const t = d.transcripts.find((x) => x.mediaId === mediaId);
      if (t) {
        t.text = text;
        t.origin = "manual";
        t.updatedAt = now;
      } else d.transcripts.push({ id, mediaId, text, origin: "manual", language: "en", createdAt: now, updatedAt: now });
      const m = d.media.find((x) => x.id === mediaId);
      if (m) m.transcriptId = id;
    });
    return ok(db().transcripts.find((t) => t.id === id)!);
  },
};

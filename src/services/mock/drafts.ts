"use client";

import type { CaptureDraft, GatheringSession } from "@/domain/models";
import { deleteBlob, getBlob, idbAvailable, isQuotaError, putBlob } from "@/lib/storage/idb";
import { uid } from "@/lib/utils";
import { fail, ok, type DraftRepository } from "../contracts";
import { db, store } from "./shared";

const audioKey = (key: string) => `draft-audio:${key}`;
const photoKey = (key: string, i: number) => `draft-photo:${key}:${i}`;

/** Files go to IndexedDB blobs; when storage is unavailable the text still autosaves in memory. */
async function storeBlob(key: string, blob: Blob) {
  if (!idbAvailable()) return;
  await putBlob(key, blob);
}
async function dropBlob(key: string) {
  if (!idbAvailable()) return;
  await deleteBlob(key).catch(() => undefined);
}

export const mockDrafts: DraftRepository = {
  async saveCaptureDraft(fields, files) {
    const existing = db().captureDrafts.find((d) => d.key === fields.key);
    let audio = existing?.audio;
    let photos = existing?.photos ?? [];
    try {
      if (files?.audio === null && audio) {
        await dropBlob(audio.blobKey);
        audio = undefined;
      } else if (files?.audio) {
        const blobKey = audioKey(fields.key);
        await storeBlob(blobKey, files.audio.blob);
        audio = { blobKey, durationSec: files.audio.durationSec, peaks: files.audio.peaks, source: files.audio.source, mime: files.audio.blob.type };
      }
      if (files?.photos) {
        for (let i = files.photos.length; i < photos.length; i++) await dropBlob(photoKey(fields.key, i));
        photos = [];
        for (const [i, p] of files.photos.entries()) {
          const blobKey = photoKey(fields.key, i);
          await storeBlob(blobKey, p.blob);
          photos.push({ blobKey, caption: p.caption, width: p.width, height: p.height, name: p.name, mime: p.blob.type });
        }
      }
    } catch (e) {
      return fail("quota", isQuotaError(e) ? "This device is out of space, so the recording couldn't be kept as a draft. Your words are still saved." : "The recording couldn't be kept as a draft. Your words are still saved.");
    }
    const draft: CaptureDraft = { ...fields, audio, photos, updatedAt: new Date().toISOString() };
    store().mutate((d) => {
      d.captureDrafts = [draft, ...d.captureDrafts.filter((x) => x.key !== draft.key)].slice(0, 30);
    });
    return ok(draft);
  },

  async loadCaptureDraft(key) {
    const draft = db().captureDrafts.find((d) => d.key === key);
    if (!draft) return ok(null);
    const audioBlob = draft.audio && idbAvailable() ? await getBlob(draft.audio.blobKey).catch(() => null) : null;
    const photos = [];
    for (const p of draft.photos) {
      const blob = idbAvailable() ? await getBlob(p.blobKey).catch(() => null) : null;
      if (blob) photos.push({ blob, caption: p.caption, width: p.width, height: p.height, name: p.name });
    }
    return ok({
      draft,
      audio: draft.audio && audioBlob ? { blob: audioBlob, durationSec: draft.audio.durationSec, peaks: draft.audio.peaks, source: draft.audio.source } : undefined,
      photos,
    });
  },

  async discardCaptureDraft(key) {
    const draft = db().captureDrafts.find((d) => d.key === key);
    if (!draft) return ok(null);
    if (draft.audio) await dropBlob(draft.audio.blobKey);
    for (const p of draft.photos) await dropBlob(p.blobKey);
    store().mutate((d) => {
      d.captureDrafts = d.captureDrafts.filter((x) => x.key !== key);
    });
    return ok(null);
  },

  async startGathering(input) {
    if (!input.guests.length) return fail("validation", "Add at least one person to the table.");
    if (!input.questionIds.length) return fail("validation", "Choose at least one kind of question.");
    const now = new Date().toISOString();
    const session: GatheringSession = { id: uid("gth"), ...input, index: 0, turn: 0, answers: [], status: "in_progress", startedAt: now, updatedAt: now };
    store().mutate((d) => {
      d.gatherings.unshift(session);
      if (d.gatherings.length > 20) d.gatherings.length = 20;
    }, { actor: input.guests[0]?.name ?? "Someone", action: "gathering.started", target: input.capsuleId, detail: input.occasion });
    return ok(session);
  },

  async updateGathering(id, patch) {
    if (!db().gatherings.some((g) => g.id === id)) return fail("not_found", "That session isn't on this device.");
    store().mutate((d) => {
      const g = d.gatherings.find((x) => x.id === id)!;
      Object.assign(g, patch, { updatedAt: new Date().toISOString() });
    });
    return ok({ ...db().gatherings.find((g) => g.id === id)! });
  },

  async removeGathering(id) {
    store().mutate((d) => {
      d.gatherings = d.gatherings.filter((g) => g.id !== id);
    });
    return ok(null);
  },
};

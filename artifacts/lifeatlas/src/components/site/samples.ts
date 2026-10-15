import type { Capsule, MediaAsset, Memory, Question } from "@/domain/models";
import { questionLibrary } from "@/data/prompts/questions";
import { capsules } from "@/data/fixtures/capsules";
import { memories } from "@/data/fixtures/memories";
import { audioMedia, media } from "@/data/fixtures/media";
import { places } from "@/data/fixtures/places";
import { extraCapsules, extraMedia, extraMemories, extraPlaces } from "@/data/fixtures/samples-couple-family";
import { sortKey } from "@/lib/dates";

/**
 * The fictional sample family, read straight from the fixtures. Public pages use these, 
 * never the visitor's own stored data, so a preview looks the same for everyone and keeps
 * working after someone removes the samples from their studio.
 */

const allCapsules = [...capsules, ...extraCapsules];
const allMemories = [...memories, ...extraMemories];
const allMedia: MediaAsset[] = [...media, ...extraMedia];
const allPlaces = [...places, ...extraPlaces];

/** The illustration behind a sample media id, when it is one. */
export function plateOf(mediaId: string | undefined) {
  const m = allMedia.find((x) => x.id === mediaId);
  return m?.source.kind === "plate" ? m.source.plateId : undefined;
}

/** Cover plates for samples whose cover is a photograph rather than an illustration. */
const coverFallback: Record<string, string> = { cap_margaret: "shells-1972", cap_sarah: "portrait-sarah" };

/** A sample capsule with its cover drawn from an illustration, independent of stored files. */
export function sampleCapsule(id: string): Capsule {
  const c = allCapsules.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown sample capsule ${id}`);
  const plateId = plateOf(c.cover.mediaId) ?? coverFallback[id];
  return { ...c, cover: { ...c.cover, mediaId: undefined, plateId, layout: plateId ? (c.cover.layout === "type_only" ? "type_only" : c.cover.layout) : "type_only" } };
}

export function sampleMemory(id: string): Memory {
  const m = allMemories.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown sample memory ${id}`);
  return m;
}

/** Approved, family-visible stories in a sample capsule, oldest first. */
export function sampleStories(capsuleId: string) {
  return allMemories.filter((m) => m.capsuleId === capsuleId && m.status === "approved" && m.privacy === "family" && !m.deletedAt).sort((a, b) => sortKey(a.date) - sortKey(b.date));
}

export function placeLabel(id: string | undefined) {
  const p = allPlaces.find((x) => x.id === id);
  return p ? p.locality || p.name : undefined;
}

export function sampleAudio(id: string) {
  return audioMedia.find((a) => a.id === id);
}

export function photoAlt(mediaId: string) {
  return allMedia.find((m) => m.id === mediaId)?.alt ?? "";
}

/**
 * Questions from the library for a public page. Throws on an unknown category so a typo
 * fails the build instead of quietly rendering an empty list.
 */
export function libraryQuestions(category: Question["category"], count: number) {
  const list = questionLibrary.filter((q) => q.category === category);
  if (!list.length) throw new Error(`No questions in category “${category}”`);
  return list.slice(0, count);
}

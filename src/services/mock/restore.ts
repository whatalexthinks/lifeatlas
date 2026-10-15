"use client";

import { strFromU8, unzipSync } from "fflate";
import { z } from "zod";
import type { ChapterKey, FuzzyDate, MemoryStatus, Place } from "@/domain/models";
import { chapters } from "@/data/chapters";
import { fuzzyDateSchema } from "@/domain/schemas";
import { sha256Hex, uid } from "@/lib/utils";
import { fail, ok, type ArchiveInspection, type ExportBuilder } from "../contracts";
import { mockCapsules } from "./capsules";
import { mockMedia } from "./media";
import { actorName, db, store } from "./shared";
import { brand } from "@/config/brand";

/**
 * Restoring from a OurLifeCapsule export. The manifest (schema `lifeatlas.archive` v1) is the
 * contract: it lists every story and file with a SHA-256, so a restore can say exactly
 * what came back intact. A restore always creates a new capsule — it never merges into
 * or overwrites what's already on the device.
 */

const MAX_BYTES = 300 * 1024 * 1024;

const manifestSchema = z.object({
  schema: z.literal("lifeatlas.archive"),
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  capsule: z.object({ id: z.string(), kind: z.enum(["personal", "couple", "family", "parent", "child", "someone"]).optional(), subjectName: z.string().min(1), title: z.string().optional(), description: z.string().optional(), birthYear: z.number().optional(), dedication: z.string().optional() }),
  people: z.array(z.object({ id: z.string(), name: z.string(), birthYear: z.number().optional(), deathYear: z.number().optional() })),
  places: z.array(z.object({ id: z.string(), name: z.string(), country: z.string(), precision: z.string(), lat: z.number(), lng: z.number() })),
  memories: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      narrative: z.string(),
      quote: z.string().optional(),
      date: z.object({ precision: z.string(), year: z.number().optional(), month: z.number().optional(), day: z.number().optional(), season: z.string().optional(), decade: z.number().optional(), lifeStage: z.string().optional(), age: z.number().optional(), note: z.string().optional() }),
      chapter: z.string(),
      placeId: z.string().optional(),
      peopleIds: z.array(z.string()),
      tags: z.array(z.string()),
      contributor: z.string(),
      privacy: z.string(),
      status: z.string(),
      media: z.array(z.string()),
    }),
  ),
  media: z.array(z.object({ id: z.string(), kind: z.string(), caption: z.string(), mimeType: z.string(), path: z.string().nullable(), included: z.boolean(), sha256: z.string().optional(), sampleNotice: z.string().optional() })),
});
type Manifest = z.infer<typeof manifestSchema>;

type Held = { manifest: Manifest; files: Map<string, Uint8Array>; damaged: Set<string>; recordsOnly: boolean };
/** Checked archives waiting for the person to confirm. Kept in memory only. */
const held = new Map<string, Held>();

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const isHtml = (text: string) => /^\s*<(!doctype|html)/i.test(text);

async function inspectArchive(file: File) {
  if (file.size > MAX_BYTES) return fail("validation", "This file is larger than 300 MB, which is more than this browser preview can restore at once.");
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return fail("unknown", "This file couldn't be read. If it's on a removable drive, copy it to this device first.");
  }

  let manifestText: string;
  let files = new Map<string, Uint8Array>();
  let format: "zip" | "json";
  if (isZip(bytes)) {
    format = "zip";
    try {
      files = new Map(Object.entries(unzipSync(bytes)));
    } catch {
      return fail("validation", "This zip file is damaged or incomplete, so it can't be opened. Try another copy of your export.");
    }
    const m = files.get("manifest.json");
    if (!m) return fail("validation", `This zip doesn't contain an ${brand.name} manifest.json, so it isn't an ${brand.name} export.`);
    manifestText = strFromU8(m);
  } else {
    format = "json";
    manifestText = new TextDecoder().decode(bytes);
    if (isHtml(manifestText)) return fail("validation", "This is the offline reading copy (.html). It's for reading, not restoring — use the .zip or .json export instead.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(manifestText);
  } catch {
    return fail("validation", `This file isn't an ${brand.name} export — its contents couldn't be read as an archive manifest.`);
  }
  const parsed = manifestSchema.safeParse(raw);
  if (!parsed.success) {
    const schema = (raw as { schema?: unknown; schemaVersion?: unknown } | null)?.schema;
    if (schema === "lifeatlas.archive") return fail("validation", "This export uses a format version this preview doesn't recognise, or parts of it are missing.");
    return fail("validation", `This file isn't an ${brand.name} export.`);
  }
  const manifest = parsed.data;

  const damaged = new Set<string>();
  let photos = 0;
  let recordings = 0;
  let notInArchive = 0;
  for (const m of manifest.media) {
    const data = m.path ? files.get(m.path) : undefined;
    if (!m.included || !data) {
      notInArchive++;
      continue;
    }
    if (!m.sha256 || (await sha256Hex(data)) !== m.sha256) {
      damaged.add(m.id);
      continue;
    }
    if (m.kind === "audio") recordings++;
    else photos++;
  }

  const warnings: string[] = [];
  if (format === "json") warnings.push("This is a records-only export: stories, dates, places and people come back, but photographs and recordings aren't in it.");
  else if (notInArchive) warnings.push(`${notInArchive} ${notInArchive === 1 ? "file was" : "files were"} left out when this export was made, so ${notInArchive === 1 ? "it" : "they"} can't be restored.`);
  if (damaged.size) warnings.push(`${damaged.size} ${damaged.size === 1 ? "file doesn't" : "files don't"} match the fingerprint recorded at export and won't be restored. Another copy of the export may be intact.`);
  warnings.push("Print permission starts switched off for restored stories — turn it on story by story once the people who told them agree.");

  const token = uid("rst");
  held.set(token, { manifest, files, damaged, recordsOnly: format === "json" });
  const inspection: ArchiveInspection = {
    token,
    fileName: file.name,
    format,
    capsuleName: manifest.capsule.subjectName,
    generatedAt: manifest.generatedAt,
    stories: manifest.memories.length,
    people: manifest.people.length,
    places: manifest.places.length,
    verified: { photos, recordings },
    damaged: manifest.media.filter((m) => damaged.has(m.id)).map((m) => m.caption || m.id),
    notInArchive,
    warnings,
  };
  return ok(inspection);
}

const statuses: MemoryStatus[] = ["draft", "submitted", "under_review", "approved", "returned", "declined"];

/** The exact date when the manifest has it; otherwise the closest thing that's still true. */
function restoreDate(d: Manifest["memories"][number]["date"]): FuzzyDate {
  const full = fuzzyDateSchema.safeParse({ ...d, display: undefined });
  if (full.success) return full.data as FuzzyDate;
  if (d.year) return { precision: "year", year: d.year };
  if (d.decade) return { precision: "decade", decade: d.decade };
  return { precision: "unknown" };
}

async function restoreArchive(token: string) {
  const h = held.get(token);
  if (!h) return fail("not_found", "Choose the export file again — it's only held until the page is closed.");
  const { manifest, files, damaged, recordsOnly } = h;
  const year = manifest.capsule.birthYear;
  const created = await mockCapsules.createFromWizard({
    relationshipKind: "other",
    relationship: "Restored from an export",
    subjectName: manifest.capsule.subjectName.slice(0, 80),
    preferredName: "",
    birthYear: year && year >= 1900 && year <= new Date().getFullYear() ? year : "",
    birthplace: "",
    dedication: manifest.capsule.dedication?.slice(0, 400) ?? "",
    collectionMode: "family",
    startingChapter: "childhood",
    palette: "linen",
    typography: "classic",
    layout: "type_only",
    defaultPrivacy: "family",
    viewerEnabled: true,
    // Older exports carry no kind; the restored capsule keeps its own title either way.
    kind: manifest.capsule.kind ?? "someone",
    title: manifest.capsule.title?.slice(0, 120),
    description: manifest.capsule.description?.slice(0, 600),
  });
  if (created.status !== "ok") return created;
  const capsuleId = created.data.id;
  const skipped: string[] = [];

  // Files first, so stories can point at them.
  const mediaIds = new Map<string, string>();
  const samples = db().media.filter((a) => a.sampleNotice && a.source.kind !== "local");
  for (const m of manifest.media) {
    // Sample illustrations and narration ship with OurLifeCapsule: point at the app's copy —
    // if the export included them (a records-only export never carries files).
    const sample = m.sampleNotice && (m.included || recordsOnly) ? samples.find((a) => a.id === m.id) : undefined;
    if (sample) {
      const id = uid("med");
      store().mutate((d) => {
        d.media.push({ ...structuredClone(sample), id, capsuleId });
      });
      mediaIds.set(m.id, id);
      continue;
    }
    const data = m.path ? files.get(m.path) : undefined;
    if (!m.included || !data || damaged.has(m.id)) continue;
    if (m.mimeType === "image/svg+xml") {
      skipped.push(`${m.caption || m.id}: vector (SVG) files aren't restored, because they can carry scripts. Add it again as a PNG or JPEG.`);
      continue;
    }
    const kind = m.kind === "audio" ? "audio" : "image";
    const r = await mockMedia.put({ capsuleId, blob: new Blob([data as BlobPart], { type: m.mimeType }), kind, caption: m.caption, alt: m.caption, contributorName: "Restored" });
    if (r.status === "ok") mediaIds.set(m.id, r.data.id);
    else skipped.push(`${m.caption || m.id}: ${r.status === "error" ? r.message : "not saved"}`);
    if (r.status === "error" && r.code === "quota") break; // nothing else will fit either
  }

  // People and places: reuse ones already on this device, add the rest.
  const peopleIds = new Map<string, string>();
  const placeIds = new Map<string, string>();
  store().mutate((d) => {
    const now = new Date().toISOString();
    for (const p of manifest.people) {
      if (d.people.some((x) => x.id === p.id)) {
        peopleIds.set(p.id, p.id);
        continue;
      }
      const id = uid("per");
      const [givenName, ...rest] = p.name.trim().split(/\s+/);
      d.people.push({ id, displayName: p.name, givenName, familyName: rest.join(" "), birthYear: p.birthYear, deathYear: p.deathYear, isSample: false, createdAt: now, updatedAt: now });
      peopleIds.set(p.id, id);
    }
    for (const p of manifest.places) {
      if (d.places.some((x) => x.id === p.id)) {
        placeIds.set(p.id, p.id);
        continue;
      }
      const id = uid("pl");
      const place: Place = { id, name: p.name, country: p.country, countryCode: "", point: { lat: p.lat, lng: p.lng }, precision: "city", visibility: "family", source: "manual" };
      d.places.push(place);
      placeIds.set(p.id, id);
    }
  });

  let stories = 0;
  for (const m of manifest.memories) {
    const chapter = (chapters.find((c) => c.title === m.chapter || c.id === m.chapter)?.id ?? "everyday") as ChapterKey;
    const own = m.media.map((id) => ({ old: id, kind: manifest.media.find((x) => x.id === id)?.kind, id: mediaIds.get(id) })).filter((x) => x.id);
    const date = restoreDate(m.date);
    const r = await mockCapsules.createMemory({
      capsuleId,
      title: m.title.length >= 2 ? m.title.slice(0, 160) : `${m.title || "Untitled"} story`,
      narrative: m.narrative,
      quote: m.quote ?? "",
      date,
      chapter,
      placeId: m.placeId ? placeIds.get(m.placeId) : undefined,
      privacy: m.privacy === "private" || m.privacy === "organizers" ? m.privacy : "family",
      tags: m.tags.slice(0, 12),
      peopleIds: m.peopleIds.map((id) => peopleIds.get(id)).filter((x): x is string => !!x),
      consent: { print: false, export: true, share: false },
      photoIds: own.filter((x) => x.kind !== "audio").map((x) => x.id!),
      audioId: own.find((x) => x.kind === "audio")?.id,
      attribution: { displayName: m.contributor || "Unknown", via: "restored" },
      status: statuses.includes(m.status as MemoryStatus) ? (m.status as MemoryStatus) : "approved",
    });
    if (r.status === "ok") stories++;
    else skipped.push(`“${m.title}”: ${r.status === "error" ? r.message : "not saved"}`);
  }

  store().mutate(() => undefined, { actor: actorName(), action: "archive.restored", target: capsuleId, detail: `${stories} stories from ${manifest.capsule.subjectName}'s export` });
  held.delete(token);
  return ok({ capsuleId, stories, files: mediaIds.size, skipped });
}

export const restoreMethods: Pick<ExportBuilder, "inspectArchive" | "restoreArchive"> = { inspectArchive, restoreArchive };

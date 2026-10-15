import { beforeEach, describe, expect, it, vi } from "vitest";

// The IndexedDB stand-in used by unit tests can't store real Blobs; browsers can (the
// browser suite covers that path). Keep files in memory here.
vi.mock("@/lib/storage/idb", async (actual) => {
  const real = await actual<typeof import("@/lib/storage/idb")>();
  const blobs = new Map<string, Blob>();
  return {
    ...real,
    putBlob: async (key: string, blob: Blob) => (blobs.set(key, blob), { key, blob, mime: blob.type, size: blob.size, createdAt: "" }),
    getBlob: async (key: string) => blobs.get(key) ?? null,
    deleteBlob: async (key: string) => void blobs.delete(key),
  };
});
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { useDemoStore } from "@/store/demo-store";
import { services } from "../factory";
import { seed } from "@/tests/fixtures";
import type { ExportOptions } from "@/domain/models";

const db = () => useDemoStore.getState().db;
const options: ExportOptions = { includePhotos: true, includeAudio: true, includePrivate: false, includeDrafts: false, includeSamplePlates: false };
// A real PNG signature followed by arbitrary bytes — enough for type checks and fingerprints.
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
// The start of an MP4 ("....ftypisom") followed by arbitrary bytes.
const mp4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 9, 8, 7, 6, 5, 4, 3, 2]);

beforeEach(() => {
  useDemoStore.setState({ db: seed(), hydrated: true });
});

/** A capsule with one story and one photo of its own, exported the way a person would. */
async function exportOne(format: "zip" | "json" | "html" = "zip") {
  const s = services();
  const photo = await s.media.put({ capsuleId: "cap_sarah", blob: new Blob([png], { type: "image/png" }), kind: "image", caption: "The porch in June", contributorName: "Sarah Ellis" });
  if (photo.status !== "ok") throw new Error("photo not saved");
  const m = await s.capsules.createMemory({
    capsuleId: "cap_sarah",
    title: "The porch swing",
    narrative: "We sat out there every evening in June.",
    quote: "",
    date: { precision: "year", year: 1998 },
    chapter: "family",
    placeId: "pl_portland",
    privacy: "family",
    tags: ["summer"],
    peopleIds: ["per_emma"],
    consent: { print: true, export: true, share: false },
    photoIds: [photo.data.id],
    attribution: { displayName: "Sarah Ellis", via: "organizer" },
    status: "approved",
  });
  if (m.status !== "ok") throw new Error("memory not saved");
  const built = await s.export.build("cap_sarah", options, format);
  if (built.status !== "ok") throw new Error(`export failed: ${built.status === "error" ? built.message : built.status}`);
  return built.data.blob;
}

const asFile = async (blob: Blob, name: string) => new File([new Uint8Array(await blob.arrayBuffer())], name);

describe("restoring from an export", () => {
  it("checks every file and restores into a new capsule without touching the original", async () => {
    const zip = await exportOne("zip");
    const before = db().capsules.length;
    const x = services().export;
    const inspected = await x.inspectArchive(await asFile(zip, "ourlifecapsule-sarah.zip"));
    if (inspected.status !== "ok") throw new Error(inspected.status === "error" ? inspected.message : "not inspected");
    expect(inspected.data).toMatchObject({ format: "zip", capsuleName: "Sarah Ellis", stories: 1, verified: { photos: 1, recordings: 0 }, damaged: [] });
    expect(db().capsules).toHaveLength(before); // inspecting changes nothing

    const restored = await x.restoreArchive(inspected.data.token);
    if (restored.status !== "ok") throw new Error(restored.status === "error" ? restored.message : "not restored");
    expect(restored.data).toMatchObject({ stories: 1, files: 1, skipped: [] });
    expect(db().capsules).toHaveLength(before + 1);
    const story = db().memories.find((m) => m.capsuleId === restored.data.capsuleId)!;
    expect(story).toMatchObject({ title: "The porch swing", chapter: "family", placeId: "pl_portland", peopleIds: ["per_emma"], status: "approved" });
    expect(story.date).toMatchObject({ precision: "year", year: 1998 });
    expect(story.attribution.via).toBe("restored");
    expect(story.consent.print).toBe(false); // permission is asked for again, not assumed
    const photo = db().media.find((a) => a.id === story.photoIds[0])!;
    expect(photo).toMatchObject({ capsuleId: restored.data.capsuleId, caption: "The porch in June" });
    // The original capsule is untouched.
    expect(db().memories.filter((m) => m.capsuleId === "cap_sarah" && m.title === "The porch swing")).toHaveLength(1);
    // A token works once.
    expect((await x.restoreArchive(inspected.data.token)).status).toBe("error");
  });

  it("refuses files whose bytes no longer match their fingerprint", async () => {
    const zip = await exportOne("zip");
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    const path = manifest.media.find((m: { path: string | null }) => m.path).path as string;
    files[path] = new Uint8Array(files[path]);
    files[path][files[path].length - 1] ^= 0xff; // one flipped byte
    const tampered = new Blob([zipSync(files) as BlobPart], { type: "application/zip" });
    const r = await services().export.inspectArchive(await asFile(tampered, "tampered.zip"));
    if (r.status !== "ok") throw new Error("not inspected");
    expect(r.data.damaged).toEqual(["The porch in June"]);
    expect(r.data.verified.photos).toBe(0);
    expect(r.data.warnings.join(" ")).toMatch(/don't match the fingerprint|doesn't match the fingerprint/);
  });

  it("restores stories from a records-only JSON export and says the files aren't in it", async () => {
    const json = await exportOne("json");
    const r = await services().export.inspectArchive(await asFile(json, "ourlifecapsule-sarah.json"));
    if (r.status !== "ok") throw new Error("not inspected");
    expect(r.data.format).toBe("json");
    expect(r.data.warnings[0]).toMatch(/records-only/);
  });

  it("brings dates back exactly — season, decade and life stage included", async () => {
    const s = services();
    const dates = [
      { precision: "season" as const, season: "summer" as const, year: 1963 },
      { precision: "decade" as const, decade: 1970 },
      { precision: "life_stage" as const, lifeStage: "teenage_years" as const },
      { precision: "age" as const, age: 12 },
      { precision: "unknown" as const, note: "Before we moved to California" },
    ];
    for (const [i, date] of dates.entries())
      await s.capsules.createMemory({ capsuleId: "cap_sarah", title: `Dated story ${i}`, narrative: "Words.", quote: "", date, chapter: "love", privacy: "family", tags: [], peopleIds: [], consent: { print: true, export: true, share: false }, photoIds: [], attribution: { displayName: "Sarah Ellis", via: "organizer" }, status: "approved" });
    const built = await s.export.build("cap_sarah", options, "json");
    if (built.status !== "ok") throw new Error("export failed");
    const r = await s.export.inspectArchive(await asFile(built.data.blob, "dates.json"));
    if (r.status !== "ok") throw new Error("not inspected");
    const restored = await s.export.restoreArchive(r.data.token);
    if (restored.status !== "ok") throw new Error("not restored");
    const back = (i: number) => db().memories.find((m) => m.capsuleId === restored.data.capsuleId && m.title === `Dated story ${i}`)!.date;
    dates.forEach((d, i) => expect(back(i)).toMatchObject(d));
  });

  it("keeps video clips as videos, from the bytes to the restored story", async () => {
    const s = services();
    const clip = await s.media.put({ capsuleId: "cap_sarah", blob: new Blob([mp4], { type: "video/mp4" }), kind: "video", caption: "Emma's first steps", contributorName: "Sarah Ellis", durationSec: 14 });
    if (clip.status !== "ok") throw new Error(clip.status === "error" ? clip.message : "clip not saved");
    expect(clip.data.kind).toBe("video");
    const m = await s.capsules.createMemory({ capsuleId: "cap_sarah", title: "First steps", narrative: "", quote: "", date: { precision: "month", year: 2006, month: 4 }, chapter: "family", privacy: "family", tags: [], peopleIds: [], consent: { print: true, export: true, share: false }, photoIds: [], videoIds: [clip.data.id], attribution: { displayName: "Sarah Ellis", via: "organizer" }, status: "approved" });
    if (m.status !== "ok") throw new Error(m.status === "error" ? m.message : "video-only memory not saved");
    const built = await s.export.build("cap_sarah", options, "zip");
    if (built.status !== "ok") throw new Error("export failed");
    const files = unzipSync(new Uint8Array(await built.data.blob.arrayBuffer()));
    expect(Object.keys(files).some((p) => p.startsWith("media/videos/"))).toBe(true);
    const r = await s.export.inspectArchive(await asFile(built.data.blob, "clips.zip"));
    if (r.status !== "ok") throw new Error("not inspected");
    expect(r.data.verified.videos).toBe(1);
    const restored = await s.export.restoreArchive(r.data.token);
    if (restored.status !== "ok") throw new Error("not restored");
    const back = db().memories.find((x) => x.capsuleId === restored.data.capsuleId && x.title === "First steps")!;
    expect(back.photoIds).toEqual([]);
    expect(back.videoIds).toHaveLength(1);
    expect(db().media.find((a) => a.id === back.videoIds![0])).toMatchObject({ kind: "video", caption: "Emma's first steps" });
  });

  it("explains why other files can't be restored", async () => {
    const x = services().export;
    const html = await x.inspectArchive(new File(["<!doctype html><html></html>"], "copy.html"));
    expect(html.status === "error" && html.message).toMatch(/offline reading copy/);
    const other = await x.inspectArchive(new File([JSON.stringify({ hello: "world" })], "notes.json"));
    expect(other.status === "error" && other.message).toBe("This file isn't an OurLifeCapsule export.");
    const broken = await x.inspectArchive(new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 9, 9, 9])], "broken.zip"));
    expect(broken.status === "error" && broken.message).toMatch(/damaged or incomplete/);
    const noManifest = await x.inspectArchive(new File([zipSync({ "a.txt": strToU8("hi") }) as BlobPart], "other.zip"));
    expect(noManifest.status === "error" && noManifest.message).toMatch(/manifest\.json/);
  });
});

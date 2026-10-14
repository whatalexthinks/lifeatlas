"use client";

import { strToU8, zipSync, type Zippable } from "fflate";
import type { ArchiveManifest, DemoDatabase, ExportJob, ExportOptions, MediaAsset, Memory } from "@/domain/models";
import { isExportEligible } from "@/domain/policies/permissions";
import { chapterById } from "@/data/chapters";
import { capsuleKind } from "@/domain/capsule-kinds";
import { formatFuzzyDate, sortKey } from "@/lib/dates";
import { sha256Hex, uid } from "@/lib/utils";
import { fail, ok, type ExportBuilder, type ExportPreview, type ExportPreviewItem } from "../contracts";
import { mockMedia } from "./media";
import { restoreMethods } from "./restore";
import { actorName, db, latency, pushNotification, store } from "./shared";
import { brand } from "@/config/brand";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "audio/mpeg": "mp3",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48) || "item";

/** Pure: which memories and media an export would contain. Unit-tested. */
export function selectExportContent(d: DemoDatabase, capsuleId: string, options: ExportOptions) {
  const memories = d.memories
    .filter((m) => m.capsuleId === capsuleId && isExportEligible(m, { includePrivate: options.includePrivate, includeDrafts: options.includeDrafts }))
    .sort((a, b) => sortKey(a.date) - sortKey(b.date));
  const excludedMemories = d.memories
    .filter((m) => m.capsuleId === capsuleId && !memories.includes(m))
    .map((m) => ({
      kind: "memory",
      id: m.id,
      reason: m.deletedAt ? "Deleted" : !m.consent.export ? "Contributor did not consent to export" : m.status !== "approved" ? `Not approved (${m.status.replace("_", " ")})` : "Private",
    }));
  const mediaIds = new Set(memories.flatMap((m) => [...m.photoIds, ...(m.audioId ? [m.audioId] : [])]));
  const capsule = d.capsules.find((c) => c.id === capsuleId);
  if (capsule?.cover.mediaId) mediaIds.add(capsule.cover.mediaId);
  const media = d.media.filter((x) => mediaIds.has(x.id));
  return { memories, excludedMemories, media };
}

function mediaDecision(asset: MediaAsset, options: ExportOptions): { include: boolean; reason?: string } {
  if (asset.kind === "audio" && !options.includeAudio) return { include: false, reason: "Audio excluded by your choice" };
  if (asset.kind === "image" && !options.includePhotos) return { include: false, reason: "Photos excluded by your choice" };
  if (asset.source.kind === "plate" && !options.includeSamplePlates) return { include: false, reason: "Sample illustration (not your file)" };
  if (asset.source.kind === "remote") return { include: false, reason: "Stored in the cloud — not connected in this preview" };
  return { include: true };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function offlineHtml(manifest: ArchiveManifest, mediaHref: (id: string) => string | null) {
  const places = new Map(manifest.places.map((p) => [p.id, p]));
  const mediaById = new Map(manifest.media.map((m) => [m.id, m]));
  const stories = manifest.memories
    .map((m) => {
      const place = m.placeId ? places.get(m.placeId)?.name : undefined;
      const imgs = m.media
        .map((id) => mediaById.get(id))
        .filter((x) => x && x.kind === "image")
        .map((x) => {
          const href = x!.included ? mediaHref(x!.id) : null;
          return href
            ? `<figure><img src="${esc(href)}" alt="${esc(x!.caption)}" loading="lazy"><figcaption>${esc(x!.caption)}${x!.sampleNotice ? ` <small>· ${esc(x!.sampleNotice)}</small>` : ""}</figcaption></figure>`
            : `<p class="missing">Photo not included: ${esc(x!.caption || x!.id)} — ${esc(x!.reason ?? "")}</p>`;
        })
        .join("");
      const audio = m.media
        .map((id) => mediaById.get(id))
        .filter((x) => x && x.kind === "audio")
        .map((x) => {
          const href = x!.included ? mediaHref(x!.id) : null;
          return href
            ? `<div class="audio"><audio controls preload="none" src="${esc(href)}"></audio>${x!.sampleNotice ? `<small>${esc(x!.sampleNotice)}</small>` : ""}</div>`
            : `<p class="missing">Recording not included — ${esc(x!.reason ?? "")}</p>`;
        })
        .join("");
      return `<article id="${esc(m.id)}"><p class="meta">${esc(m.date.display)}${place ? ` · ${esc(place)}` : ""} · ${esc(m.chapter)}</p><h2>${esc(m.title)}</h2>${m.quote ? `<blockquote>${esc(m.quote)}</blockquote>` : ""}${m.narrative
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p)}</p>`)
        .join("")}${imgs}${audio}<p class="by">Shared by ${esc(m.contributor)}</p></article>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(manifest.capsule.subjectName)} — ${brand.name} archive</title><style>
:root{--paper:#f8f6f1;--ink:#242824;--muted:#62655d;--line:#ded9cf;--green:#34473f}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:18px/1.65 Georgia,'Iowan Old Style',serif}
header,main,footer{max-width:760px;margin:0 auto;padding:0 24px}header{padding-top:72px;padding-bottom:32px;border-bottom:1px solid var(--line)}
h1{font-weight:400;font-size:clamp(40px,7vw,68px);line-height:1;margin:.2em 0}h2{font-weight:400;font-size:32px;line-height:1.15;margin:.2em 0 .5em}
.eyebrow,.meta,.by,small{font:600 12px/1.5 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
article{padding:48px 0;border-bottom:1px solid var(--line)}blockquote{margin:0 0 1em;padding-left:18px;border-left:2px solid var(--green);font-style:italic;font-size:22px}
figure{margin:24px 0}img{max-width:100%;display:block;border:10px solid #fff;box-shadow:0 10px 30px -12px #0003}figcaption{font:14px system-ui,sans-serif;color:var(--muted);margin-top:8px}
audio{width:100%;margin-top:12px}.missing{font:14px system-ui,sans-serif;color:#9a362e;background:#f6e5e1;padding:10px 14px;border-radius:8px}
nav ol{columns:2;font:15px system-ui,sans-serif;padding-left:20px}footer{padding:48px 24px 96px;font:14px system-ui,sans-serif;color:var(--muted)}
</style></head><body><header><p class="eyebrow">${brand.name} · Portable archive</p><h1>${esc(manifest.capsule.subjectName)}</h1><p>${esc(manifest.capsule.title)}${manifest.capsule.birthYear ? ` · Born ${manifest.capsule.birthYear}` : ""}</p>${manifest.capsule.dedication ? `<p><em>${esc(manifest.capsule.dedication)}</em></p>` : ""}<nav><p class="eyebrow">${manifest.memories.length} stories</p><ol>${manifest.memories.map((m) => `<li><a href="#${esc(m.id)}">${esc(m.title)}</a></li>`).join("")}</ol></nav></header><main>${stories}</main><footer><p>Exported ${esc(new Date(manifest.generatedAt).toLocaleString())} from an {brand.name} demonstration on this device. This file opens without {brand.name}, in any modern browser.</p>${manifest.notices.map((n) => `<p>${esc(n)}</p>`).join("")}${manifest.exclusions.length ? `<p><strong>Not included:</strong></p><ul>${manifest.exclusions.map((e) => `<li>${esc(e.kind)} ${esc(e.id)} — ${esc(e.reason)}</li>`).join("")}</ul>` : ""}</footer></body></html>`;
}

function toManifestMemory(m: Memory, d: DemoDatabase): ArchiveManifest["memories"][number] {
  return {
    id: m.id,
    title: m.title,
    narrative: m.narrative,
    quote: m.quote,
    date: {
      display: formatFuzzyDate(m.date),
      precision: m.date.precision,
      year: m.date.year ?? (m.date.decade !== undefined ? m.date.decade : undefined),
      month: m.date.month,
      day: m.date.day,
      season: m.date.season,
      decade: m.date.decade,
      lifeStage: m.date.lifeStage,
      note: m.date.note,
    },
    chapter: chapterById(m.chapter).title,
    placeId: m.placeId,
    peopleIds: m.peopleIds,
    tags: m.tags,
    contributor: m.attribution.displayName,
    privacy: m.privacy,
    status: m.status,
    media: [...m.photoIds, ...(m.audioId ? [m.audioId] : [])].filter((id) => d.media.some((x) => x.id === id)),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

async function blobToDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export const mockExport: ExportBuilder = {
  ...restoreMethods,
  async preview(capsuleId, options) {
    const d = db();
    const capsule = d.capsules.find((c) => c.id === capsuleId);
    if (!capsule) return fail("not_found", "Capsule not found.");
    const { memories, excludedMemories, media } = selectExportContent(d, capsuleId, options);
    const items: ExportPreviewItem[] = [
      ...memories.map((m) => ({ id: m.id, kind: "memory" as const, label: m.title, included: true })),
      ...excludedMemories.map((e) => ({ id: e.id, kind: "memory" as const, label: d.memories.find((m) => m.id === e.id)?.title ?? e.id, included: false, reason: e.reason })),
    ];
    let estimated = 40_000 + memories.reduce((s, m) => s + m.narrative.length * 2, 0);
    for (const a of media) {
      const dec = mediaDecision(a, options);
      let included = dec.include;
      let reason = dec.reason;
      if (included && a.source.kind === "local") {
        const r = await mockMedia.getBlob(a);
        if (r.status !== "ok") {
          included = false;
          reason = "Missing from this device";
        }
      }
      const kind = a.source.kind === "plate" ? "plate" : a.kind === "audio" ? "audio" : "photo";
      items.push({ id: a.id, kind, label: a.caption || a.alt || a.id, included, reason, byteSize: a.byteSize });
      if (included) estimated += a.byteSize ?? (a.source.kind === "plate" ? 60_000 : 250_000);
    }
    const warnings: string[] = [];
    if (options.includePrivate) warnings.push("Private stories are included. Share this file only with people allowed to see them.");
    if (options.includeDrafts) warnings.push("Drafts and unapproved contributions are included.");
    if (items.some((i) => !i.included && i.reason === "Missing from this device")) warnings.push("Some files are missing from this device and can't be exported. They're listed in the manifest.");
    return ok<ExportPreview>({ capsuleId, items, estimatedBytes: estimated, warnings });
  },

  async build(capsuleId, options, format) {
    const d = db();
    const capsule = d.capsules.find((c) => c.id === capsuleId);
    if (!capsule) return fail("not_found", "Capsule not found.");
    const job: ExportJob = { id: uid("exp"), capsuleId, format, options, status: "building", createdAt: new Date().toISOString() };
    store().mutate((x) => {
      x.exportJobs.unshift({ ...job, status: "queued" });
    });
    store().mutate((x) => {
      const j = x.exportJobs.find((y) => y.id === job.id);
      if (j) j.status = "building";
    });
    try {
      await latency(300);
      const { memories, excludedMemories, media } = selectExportContent(d, capsuleId, options);
      const files: Zippable = {};
      const exclusions: ArchiveManifest["exclusions"] = [...excludedMemories];
      const manifestMedia: ArchiveManifest["media"] = [];
      const embedded = new Map<string, string>();
      let missing = 0;
      for (const a of media) {
        const transcript = a.transcriptId ? d.transcripts.find((t) => t.id === a.transcriptId)?.text : undefined;
        const dec = mediaDecision(a, options);
        const ext = EXT[a.mimeType] ?? "bin";
        const path = `media/${a.kind === "audio" ? "audio" : "images"}/${slug(a.caption || a.id)}-${a.id.slice(-6)}.${ext}`;
        if (!dec.include) {
          exclusions.push({ kind: a.kind, id: a.id, reason: dec.reason! });
          manifestMedia.push({ id: a.id, kind: a.kind, caption: a.caption, mimeType: a.mimeType, path: null, included: false, reason: dec.reason, transcript, sampleNotice: a.sampleNotice });
          continue;
        }
        const r = await mockMedia.getBlob(a);
        if (r.status !== "ok") {
          missing++;
          const reason = a.source.kind === "local" ? "Missing from this device" : "Sample file unavailable";
          exclusions.push({ kind: a.kind, id: a.id, reason });
          manifestMedia.push({ id: a.id, kind: a.kind, caption: a.caption, mimeType: a.mimeType, path: null, included: false, reason, transcript, sampleNotice: a.sampleNotice });
          continue;
        }
        const bytes = new Uint8Array(await r.data.arrayBuffer());
        const sha = await sha256Hex(bytes);
        if (format === "zip") files[path] = [bytes, { level: 0 }];
        if (format === "html") embedded.set(a.id, await blobToDataUri(r.data));
        manifestMedia.push({ id: a.id, kind: a.kind, caption: a.caption, mimeType: a.mimeType, path: format === "zip" ? path : null, included: format !== "json", reason: format === "json" ? "JSON export contains records only" : undefined, byteSize: bytes.byteLength, sha256: sha, transcript, sampleNotice: a.sampleNotice });
      }
      const placeIds = new Set(memories.map((m) => m.placeId).filter(Boolean) as string[]);
      const peopleIds = new Set(memories.flatMap((m) => m.peopleIds));
      const manifest: ArchiveManifest = {
        schema: "lifeatlas.archive",
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        generator: `${brand.name} Part One (local demonstration)`,
        mode: "demo_local",
        capsule: { id: capsule.id, kind: capsuleKind(capsule), subjectName: capsule.subjectName, title: capsule.title, description: capsule.description, birthYear: capsule.birthYear, dedication: capsule.dedication },
        options,
        people: d.people.filter((p) => peopleIds.has(p.id)).map((p) => ({ id: p.id, name: p.displayName, birthYear: p.birthYear, deathYear: p.deathYear })),
        places: d.places.filter((p) => placeIds.has(p.id)).map((p) => ({ id: p.id, name: p.name, country: p.country, precision: p.precision, lat: Math.round(p.point.lat * 100) / 100, lng: Math.round(p.point.lng * 100) / 100 })),
        memories: memories.map((m) => toManifestMemory(m, d)),
        media: manifestMedia,
        exclusions,
        notices: [
          `Created from an ${brand.name} demonstration. Data came from this browser on this device only; nothing was uploaded.`,
          "Coordinates are rounded to city level.",
          ...(media.some((m) => m.sampleNotice) ? ["Sample illustrations and synthetic narration are labelled; they are not real photographs or voices."] : []),
        ],
      };
      const base = `${brand.filePrefix}-${slug(capsule.subjectName)}-${new Date().toISOString().slice(0, 10)}`;
      let blob: Blob;
      let fileName: string;
      if (format === "json") {
        blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
        fileName = `${base}.json`;
      } else if (format === "html") {
        blob = new Blob([offlineHtml(manifest, (id) => embedded.get(id) ?? null)], { type: "text/html" });
        fileName = `${base}.html`;
      } else {
        files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
        files["index.html"] = strToU8(offlineHtml(manifest, (id) => manifestMedia.find((m) => m.id === id)?.path ?? null));
        files["stories.md"] = strToU8(
          [`# ${capsule.subjectName}`, capsule.title, "", ...manifest.memories.flatMap((m) => [`## ${m.title}`, `_${m.date.display}_`, "", m.narrative, "", `— ${m.contributor}`, ""])].join("\n"),
        );
        files["README.txt"] = strToU8(
          [
            `${brand.name} archive — ${capsule.subjectName}`,
            "",
            "Open index.html in any web browser to read the stories, see the photographs and listen to recordings.",
            "manifest.json describes every record in a stable, documented format (schema: lifeatlas.archive v1).",
            "Media checksums (SHA-256) are listed in manifest.json so you can verify copies.",
            "",
            `Included: ${manifest.memories.length} stories, ${manifestMedia.filter((m) => m.included).length} files.`,
            `Not included: ${exclusions.length} items (listed in manifest.json and at the end of index.html).`,
            "",
            "Keep at least two copies in different places. This export came from a demo running on one device.",
          ].join("\n"),
        );
        const zipped = zipSync(files, { level: 6 });
        blob = new Blob([zipped as BlobPart], { type: "application/zip" });
        fileName = `${base}.zip`;
      }
      const counts = {
        memories: manifest.memories.length,
        photos: manifestMedia.filter((m) => m.kind === "image" && m.included).length,
        audio: manifestMedia.filter((m) => m.kind === "audio" && m.included).length,
        missing,
        excluded: exclusions.length,
      };
      const done: ExportJob = { ...job, status: "ready", completedAt: new Date().toISOString(), fileName, byteSize: blob.size, counts };
      store().mutate(
        (x) => {
          const j = x.exportJobs.find((y) => y.id === job.id);
          if (j) Object.assign(j, done);
          if (x.exportJobs.length > 20) x.exportJobs.length = 20;
        },
        { actor: actorName(), action: "archive.exported", target: capsuleId, detail: `${fileName} (${counts.memories} stories)` },
      );
      store().track("archive_exported", { format, memories: counts.memories, missing });
      pushNotification({ kind: "export", title: "Your archive is ready", body: `${fileName} — downloaded to this device.`, href: `/app/capsules/${capsuleId}/export` });
      return ok({ job: done, blob });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Export failed";
      store().mutate((x) => {
        const j = x.exportJobs.find((y) => y.id === job.id);
        if (j) {
          j.status = "failed";
          j.error = message;
        }
      });
      return fail("unknown", `We couldn't build the export: ${message}`);
    }
  },
};

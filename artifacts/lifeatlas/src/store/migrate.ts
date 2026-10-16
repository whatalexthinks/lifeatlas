import type { DemoDatabase } from "@/domain/models";
import { CATALOG_VERSION } from "@/data/product-catalog";
import { SAMPLE_VERSION } from "@/data/fixtures";

/**
 * Loading data saved by an older version of the app. Pure and unit-tested: it takes what
 * was stored and a fresh seed, and returns what to use. It never deletes anything a person
 * made, and never overwrites a record they may have edited.
 */
export function withNewFields(stored: DemoDatabase, seed: DemoDatabase): DemoDatabase {
  // Read the stored versions first: data saved before a version field existed is version 1.
  const storedCatalogVersion = stored.catalogVersion ?? 1;
  const storedSampleVersion = stored.sampleVersion ?? 1;
  const fresh = seed as unknown as Record<string, unknown>;
  const out = { ...stored } as unknown as Record<string, unknown>;
  // Collections added after this device first saved arrive empty, except promotions,
  // which are configuration rather than someone's data.
  for (const [k, v] of Object.entries(fresh)) if (!(k in out)) out[k] = Array.isArray(v) && k !== "promotions" ? [] : v;
  const db = out as unknown as DemoDatabase;

  // A new catalog replaces an older saved one (operations' local price edits included),
  // so nobody keeps seeing products or prices that no longer exist.
  if (storedCatalogVersion !== CATALOG_VERSION) {
    db.catalog = seed.catalog;
    db.catalogVersion = CATALOG_VERSION;
    const known = new Set(seed.catalog.map((p) => p.id));
    db.subscriptions = db.subscriptions.filter((s) => known.has(s.productId));
    if (!db.subscriptions.length) db.subscriptions = seed.subscriptions;
  }

  if (storedSampleVersion !== SAMPLE_VERSION) {
    mergeQuestionLibrary(db, seed);
    if (!db.samplesRemoved) mergeNewSampleCapsules(db, seed);
    db.sampleVersion = SAMPLE_VERSION;
  }
  return db;
}

/** The library is ours to update; questions someone wrote themselves are theirs to keep. */
function mergeQuestionLibrary(db: DemoDatabase, seed: DemoDatabase) {
  const libraryIds = new Set(seed.questions.map((q) => q.id));
  db.questions = [...seed.questions, ...db.questions.filter((q) => q.custom && !libraryIds.has(q.id))];
}

/**
 * Sample capsules added in a newer version arrive whole, with their stories, pictures and
 * people. Sample capsules already on the device are left exactly as they are.
 */
function mergeNewSampleCapsules(db: DemoDatabase, seed: DemoDatabase) {
  const have = new Set(db.capsules.map((c) => c.id));
  const arriving = seed.capsules.filter((c) => c.isSample && !have.has(c.id));
  if (!arriving.length) return;
  const ids = new Set(arriving.map((c) => c.id));
  const byId = <T extends { id: string }>(current: T[], incoming: T[], keep: (x: NoInfer<T>) => boolean = () => true) => {
    const present = new Set(current.map((x) => x.id));
    return [...current, ...incoming.filter((x) => keep(x) && !present.has(x.id))];
  };
  db.capsules = [...db.capsules, ...arriving];
  db.memberships = byId(db.memberships, seed.memberships, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.memories = byId(db.memories, seed.memories, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.media = byId(db.media, seed.media, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.futureMessages = byId(db.futureMessages, seed.futureMessages, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.assignments = byId(db.assignments, seed.assignments, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.contributions = byId(db.contributions, seed.contributions, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  db.invitations = byId(db.invitations, seed.invitations, (x) => !!x.capsuleId && ids.has(x.capsuleId));
  const mediaIds = new Set(db.media.map((m) => m.id));
  db.transcripts = byId(db.transcripts, seed.transcripts, (t) => mediaIds.has(t.mediaId));
  // People and places are shared across capsules: add the ones that are missing.
  db.people = byId(db.people, seed.people);
  db.places = byId(db.places, seed.places);
  db.relationships = byId(db.relationships, seed.relationships);
  for (const g of db.familyGroups) {
    const seeded = seed.familyGroups.find((x) => x.id === g.id);
    if (seeded) g.capsuleIds = [...new Set([...g.capsuleIds, ...seeded.capsuleIds.filter((c) => ids.has(c))])];
  }
  for (const p of db.personas) {
    const seeded = seed.personas.find((x) => x.id === p.id);
    for (const r of seeded?.roles ?? []) if (ids.has(r.capsuleId) && !p.roles.some((x) => x.capsuleId === r.capsuleId)) p.roles.push(r);
  }
}

/**
 * "Remove the sample capsules": everything tied to a sample capsule goes, and sample people
 * no one else refers to. Your own capsules, stories and account are untouched. Resetting the
 * demo brings the samples back.
 */
export function removeSampleData(db: DemoDatabase) {
  const ids = new Set(db.capsules.filter((c) => c.isSample).map((c) => c.id));
  const record = db as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(record)) {
    if (!Array.isArray(v) || k === "capsules") continue;
    record[k] = v.filter((x) => !(x && typeof x === "object" && "capsuleId" in x && ids.has((x as { capsuleId?: string }).capsuleId ?? "")));
  }
  db.capsules = db.capsules.filter((c) => !ids.has(c.id));
  const mediaIds = new Set(db.media.map((m) => m.id));
  db.transcripts = db.transcripts.filter((t) => mediaIds.has(t.mediaId));
  for (const g of db.familyGroups) g.capsuleIds = g.capsuleIds.filter((c) => !ids.has(c));
  for (const p of db.personas) p.roles = p.roles.filter((r) => !ids.has(r.capsuleId));

  const referenced = new Set<string>([db.account.profile.personId ?? ""]);
  for (const c of db.capsules) {
    referenced.add(c.ownerPersonId);
    if (c.subjectPersonId) referenced.add(c.subjectPersonId);
    for (const id of c.peopleIds ?? []) referenced.add(id);
  }
  for (const m of db.memories) {
    for (const id of m.peopleIds) referenced.add(id);
    if (m.attribution.personId) referenced.add(m.attribution.personId);
  }
  for (const m of db.memberships) referenced.add(m.personId);
  for (const p of db.personas) if (p.personId) referenced.add(p.personId);
  db.people = db.people.filter((p) => !p.isSample || referenced.has(p.id));
  const people = new Set(db.people.map((p) => p.id));
  db.relationships = db.relationships.filter((r) => people.has(r.fromPersonId) && people.has(r.toPersonId));
  db.lifeEvents = db.lifeEvents.filter((e) => !("personId" in e) || people.has((e as { personId: string }).personId));
  db.samplesRemoved = true;
  return { capsules: ids.size };
}

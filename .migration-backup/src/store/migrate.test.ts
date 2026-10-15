import { describe, expect, it } from "vitest";
import type { DemoDatabase } from "@/domain/models";
import { buildSeed, SAMPLE_VERSION } from "@/data/fixtures";
import { removeSampleData, withNewFields } from "./migrate";

/** What a device that saved before couple and family samples existed would hold. */
function olderDevice(): DemoDatabase {
  const db = buildSeed();
  const added = new Set(["cap_us", "cap_family"]);
  const old = {
    ...db,
    capsules: db.capsules.filter((c) => !added.has(c.id)),
    memories: db.memories.filter((m) => !added.has(m.capsuleId)),
    media: db.media.filter((m) => !added.has(m.capsuleId)),
    memberships: db.memberships.filter((m) => !added.has(m.capsuleId)),
    questions: db.questions.filter((q) => !q.audiences?.length).slice(0, 40),
    personas: db.personas.map((p) => ({ ...p, roles: p.roles.filter((r) => !added.has(r.capsuleId)) })),
    familyGroups: db.familyGroups.map((g) => ({ ...g, capsuleIds: g.capsuleIds.filter((c) => !added.has(c)) })),
  } as Partial<DemoDatabase>;
  delete old.sampleVersion;
  return old as DemoDatabase;
}

describe("loading older saved data", () => {
  it("adds new sample capsules whole, with their stories, pictures, members and roles", () => {
    const db = withNewFields(olderDevice(), buildSeed());
    expect(db.sampleVersion).toBe(SAMPLE_VERSION);
    expect(db.capsules.find((c) => c.id === "cap_us")?.kind).toBe("couple");
    expect(db.memories.filter((m) => m.capsuleId === "cap_family").length).toBeGreaterThan(5);
    expect(db.media.some((m) => m.capsuleId === "cap_us")).toBe(true);
    expect(db.memberships.some((m) => m.capsuleId === "cap_us" && m.personId === "per_jonah")).toBe(true);
    expect(db.personas.find((p) => p.id === "persona_sarah")?.roles).toContainEqual({ capsuleId: "cap_family", role: "owner" });
    expect(db.familyGroups.find((g) => g.id === "fam_ellis")?.capsuleIds).toContain("cap_us");
  });

  it("never overwrites a sample someone already changed", () => {
    const old = olderDevice();
    old.capsules.find((c) => c.id === "cap_margaret")!.title = "Mum, in her own words";
    old.memories.find((m) => m.capsuleId === "cap_margaret")!.title = "Edited on this device";
    const db = withNewFields(old, buildSeed());
    expect(db.capsules.find((c) => c.id === "cap_margaret")?.title).toBe("Mum, in her own words");
    expect(db.memories.some((m) => m.title === "Edited on this device")).toBe(true);
    expect(db.capsules.filter((c) => c.id === "cap_margaret")).toHaveLength(1);
  });

  it("refreshes the question library and keeps questions people wrote", () => {
    const old = olderDevice();
    old.questions.push({ id: "q_custom_mine", text: "What did Dad whistle while he cooked?", category: "Small Ordinary Moments", chapter: "everyday", followUps: [], custom: true, createdBy: "Sarah" });
    const db = withNewFields(old, buildSeed());
    expect(db.questions.some((q) => q.audiences?.includes("couple"))).toBe(true);
    expect(db.questions.some((q) => q.id === "q_custom_mine")).toBe(true);
    expect(new Set(db.questions.map((q) => q.id)).size).toBe(db.questions.length);
  });

  it("doesn't bring samples back after someone removed them", () => {
    const old = olderDevice();
    removeSampleData(old);
    const db = withNewFields(old, buildSeed());
    expect(db.capsules.some((c) => c.isSample)).toBe(false);
  });

  it("replaces a catalog saved before catalogs were versioned", () => {
    const old = olderDevice() as Partial<DemoDatabase>;
    delete old.catalogVersion;
    old.catalog = old.catalog!.map((p) => ({ ...p, price: { ...p.price, amount: 1 } }));
    const db = withNewFields(old as DemoDatabase, buildSeed());
    expect(db.catalog.find((p) => p.id === "digital")?.price.amount).toBe(9900);
  });

  it("is a no-op for data that's already current", () => {
    const seed = buildSeed();
    const db = withNewFields(structuredClone(seed), buildSeed());
    expect(db.capsules.map((c) => c.id)).toEqual(seed.capsules.map((c) => c.id));
    expect(db.memories).toHaveLength(seed.memories.length);
  });
});

describe("removing the sample capsules", () => {
  it("removes samples and everything tied to them, keeping the person's own work", () => {
    const db = buildSeed();
    db.capsules.push({ ...structuredClone(db.capsules.find((c) => c.id === "cap_margaret")!), id: "cap_mine", isSample: false, title: "Mine" });
    db.memories.push({ ...structuredClone(db.memories.find((m) => m.capsuleId === "cap_margaret")!), id: "mem_mine", capsuleId: "cap_mine", peopleIds: ["per_margaret"] });
    const r = removeSampleData(db);
    expect(r.capsules).toBeGreaterThanOrEqual(5);
    expect(db.capsules.map((c) => c.id)).toEqual(["cap_mine"]);
    expect(db.memories.map((m) => m.id)).toEqual(["mem_mine"]);
    expect(db.media.every((m) => m.capsuleId === "cap_mine")).toBe(true);
    expect(db.memberships.every((m) => m.capsuleId === "cap_mine")).toBe(true);
    expect(db.bookmarks).toHaveLength(0);
    // People still mentioned in your own stories, and your own person, stay.
    expect(db.people.some((p) => p.id === "per_margaret")).toBe(true);
    expect(db.people.some((p) => p.id === "per_sarah")).toBe(true);
    expect(db.relationships.every((rel) => db.people.some((p) => p.id === rel.fromPersonId) && db.people.some((p) => p.id === rel.toPersonId))).toBe(true);
    expect(db.samplesRemoved).toBe(true);
  });
});

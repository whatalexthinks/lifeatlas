import { describe, expect, it } from "vitest";
import { can, canDeleteMemory, canEditMemory, canViewMemory, everydayRoles, isExportEligible, isPrintEligible, membershipRole, roleFor, roleSummary } from "./permissions";
import { memory, seed } from "@/tests/fixtures";

describe("roles", () => {
  it("reserves billing and deletion for the owner", () => {
    expect(can("owner", "manage_billing")).toBe(true);
    expect(can("organizer", "manage_billing")).toBe(false);
    expect(can("organizer", "delete_capsule")).toBe(false);
  });
  it("gives a successor no access until a verified handover", () => {
    expect(can("successor", "view_approved")).toBe(false);
  });
  it("treats no role as no capability", () => {
    expect(can(null, "view_approved")).toBe(false);
  });
  it("takes the highest active role, and a successor designation alone grants nothing", () => {
    const { memberships } = seed();
    expect(membershipRole(memberships, "per_daniel", "cap_margaret")).toBe("contributor"); // also a successor
    expect(membershipRole(memberships, "per_jonah", "cap_thomas")).toBeNull();
    const onlySuccessor = memberships.filter((m) => !(m.personId === "per_daniel" && m.role === "contributor"));
    expect(membershipRole(onlySuccessor, "per_daniel", "cap_margaret")).toBeNull();
  });
  it("follows memberships, so a role changed on the Family page applies everywhere", () => {
    const { memberships, personas } = seed();
    const jonah = personas.find((p) => p.personId === "per_jonah")!;
    expect(roleFor(jonah, "cap_margaret", memberships)).toBe("viewer");
    const removed = memberships.map((m) => (m.personId === "per_jonah" ? { ...m, status: "removed" as const } : m));
    expect(roleFor(jonah, "cap_margaret", removed)).toBeNull();
  });
});

describe("viewing", () => {
  it("shows approved family memories to viewers", () => {
    expect(canViewMemory(memory(), "viewer")).toBe(true);
  });
  it("keeps “Only me” stories to their author and the owner, editors don't see them", () => {
    const m = memory({ privacy: "private", attribution: { personId: "per_emma", displayName: "Emma Ellis", via: "invitation" } });
    expect(canViewMemory(m, "viewer")).toBe(false);
    expect(canViewMemory(m, "organizer", "per_jonah")).toBe(false);
    expect(canViewMemory(m, "owner", "per_sarah")).toBe(true);
    expect(canViewMemory(m, "contributor", "per_emma")).toBe(true);
  });
  it("shows owner-and-editor stories to stewards only", () => {
    const m = memory({ privacy: "organizers" });
    expect(canViewMemory(m, "organizer")).toBe(true);
    expect(canViewMemory(m, "contributor", "per_daniel")).toBe(false);
  });
  it("shares a selected-people story with exactly the people chosen", () => {
    const m = memory({ privacy: "selected", sharedWith: ["per_emma"] });
    expect(canViewMemory(m, "viewer", "per_emma")).toBe(true);
    expect(canViewMemory(m, "viewer", "per_daniel")).toBe(false);
    expect(canViewMemory(m, "viewer")).toBe(false);
    expect(canViewMemory(m, "organizer", "per_jonah")).toBe(true);
    // Being on the list grants nothing without a role on the capsule.
    expect(canViewMemory(m, null, "per_emma")).toBe(false);
    expect(canViewMemory(m, "successor", "per_emma")).toBe(false);
  });
  it("lets an author see their own story while it waits in review", () => {
    const m = memory({ status: "submitted", attribution: { personId: "per_emma", displayName: "Emma Ellis", via: "invitation" } });
    expect(canViewMemory(m, "contributor", "per_emma")).toBe(true);
    expect(canViewMemory(m, "viewer", "per_daniel")).toBe(false);
  });
  it("never shows deleted memories", () => {
    expect(canViewMemory(memory({ deletedAt: "2026-10-01T00:00:00Z" }), "owner")).toBe(false);
  });
});

describe("editing, printing and export", () => {
  it("lets contributors edit only their own memories", () => {
    const m = memory({ attribution: { personId: "per_emma", displayName: "Emma Ellis", via: "invitation" } });
    expect(canEditMemory(m, "contributor", "per_emma")).toBe(true);
    expect(canEditMemory(m, "contributor", "per_daniel")).toBe(false);
    expect(canEditMemory(m, "organizer")).toBe(true);
  });
  it("lets people remove only what their role allows", () => {
    const m = memory({ attribution: { personId: "per_emma", displayName: "Emma Ellis", via: "invitation" } });
    expect(canDeleteMemory(m, "contributor", "per_emma")).toBe(true);
    expect(canDeleteMemory(m, "contributor", "per_daniel")).toBe(false);
    expect(canDeleteMemory(m, "viewer", "per_emma")).toBe(false);
    expect(canDeleteMemory(m, "organizer")).toBe(true);
  });
  it("describes each everyday role in the five plain verbs", () => {
    expect(everydayRoles.map((r) => [r, roleSummary(r)])).toEqual([
      ["owner", { read: "everything", add: true, edit: "all", invite: true, export: true, delete: "capsule", billing: true }],
      ["organizer", { read: "all_but_private", add: true, edit: "all", invite: true, export: true, delete: "all", billing: false }],
      ["contributor", { read: "shared", add: true, edit: "own", invite: false, export: false, delete: "own", billing: false }],
      ["viewer", { read: "shared", add: false, edit: "none", invite: false, export: false, delete: "none", billing: false }],
    ]);
  });
  it("prints only approved, consented memories", () => {
    expect(isPrintEligible(memory())).toBe(true);
    expect(isPrintEligible(memory({ consent: { print: false, export: true, share: false } }))).toBe(false);
    expect(isPrintEligible(memory({ status: "submitted" }))).toBe(false);
  });
  it("respects export consent and the private/draft switches", () => {
    expect(isExportEligible(memory({ consent: { print: true, export: false, share: false } }), { includePrivate: true, includeDrafts: true })).toBe(false);
    expect(isExportEligible(memory({ privacy: "private" }), { includePrivate: false, includeDrafts: false })).toBe(false);
    expect(isExportEligible(memory({ privacy: "private" }), { includePrivate: true, includeDrafts: false })).toBe(true);
    expect(isExportEligible(memory({ status: "draft" }), { includePrivate: true, includeDrafts: false })).toBe(false);
    expect(isExportEligible(memory({ privacy: "selected", sharedWith: ["per_emma"] }), { includePrivate: false, includeDrafts: false })).toBe(false);
  });
  it("never exports a story the person exporting couldn't see", () => {
    const theirs = memory({ privacy: "private", attribution: { personId: "per_emma", displayName: "Emma Ellis", via: "invitation" } });
    const all = { includePrivate: true, includeDrafts: true };
    expect(isExportEligible(theirs, all, { role: "organizer", personId: "per_jonah" })).toBe(false);
    expect(isExportEligible(theirs, all, { role: "owner", personId: "per_sarah" })).toBe(true);
  });
});

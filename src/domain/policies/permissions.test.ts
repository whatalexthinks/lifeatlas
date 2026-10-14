import { describe, expect, it } from "vitest";
import { can, canEditMemory, canViewMemory, isExportEligible, isPrintEligible, membershipRole, roleFor } from "./permissions";
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
  it("hides private memories from viewers but not organizers", () => {
    const m = memory({ privacy: "private" });
    expect(canViewMemory(m, "viewer")).toBe(false);
    expect(canViewMemory(m, "organizer")).toBe(true);
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
  });
});

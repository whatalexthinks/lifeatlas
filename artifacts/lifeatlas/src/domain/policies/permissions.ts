import type { Capsule, CapsuleMembership, Memory, MemoryPrivacy, Persona, Role } from "@/domain/models";

/**
 * Permission predicates. In Part One these drive what the UI shows for the
 * selected demo persona, they are NOT a security boundary. Part Two must
 * re-implement every check server-side (see docs/SECURITY_PRIVACY_DECISIONS.md).
 */

export type Capability =
  /** Stories shared with the whole family. */
  | "view_approved"
  /** Stories limited to the owner & editors, or to selected people (stewards see all of them). */
  | "view_restricted"
  /** Other people's "Only me" stories. Owner only: they answer for exports and deletion. */
  | "view_private"
  | "add_memory"
  | "edit_any_memory"
  | "edit_own_memory"
  | "delete_any_memory"
  | "delete_own_memory"
  | "review_contributions"
  | "manage_invitations"
  | "manage_privacy"
  | "export_archive"
  | "manage_billing"
  | "delete_capsule"
  | "order_heirlooms";

export const roleCapabilities: Record<Role, Capability[]> = {
  owner: [
    "view_approved",
    "view_restricted",
    "view_private",
    "add_memory",
    "edit_any_memory",
    "edit_own_memory",
    "delete_any_memory",
    "delete_own_memory",
    "review_contributions",
    "manage_invitations",
    "manage_privacy",
    "export_archive",
    "manage_billing",
    "delete_capsule",
    "order_heirlooms",
  ],
  organizer: ["view_approved", "view_restricted", "add_memory", "edit_any_memory", "edit_own_memory", "delete_any_memory", "delete_own_memory", "review_contributions", "manage_invitations", "export_archive", "order_heirlooms"],
  storyteller: ["view_approved", "add_memory", "edit_own_memory", "delete_own_memory", "export_archive"],
  contributor: ["view_approved", "add_memory", "edit_own_memory", "delete_own_memory"],
  viewer: ["view_approved"],
  successor: [], // designated for the future; no access now
};

export const roleLabels: Record<Role, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Pays for the capsule, manages everything including billing and deletion." },
  organizer: { label: "Editor", description: "Helps run the capsule: adds and edits stories, invites people and reviews contributions." },
  storyteller: { label: "Storyteller", description: "The person whose life this is. Controls their own contributions." },
  contributor: { label: "Contributor", description: "Adds stories, photos or recordings by invitation." },
  viewer: { label: "Viewer", description: "Can explore approved, family-visible memories." },
  successor: { label: "Successor", description: "A designated future steward. No access until a verified handover (Part Two)." },
};

/** The four roles people choose between. ("organizer" is the stored id for Editor.) */
export const everydayRoles: Role[] = ["owner", "organizer", "contributor", "viewer"];

/**
 * What a role may do, in the plain terms shown to people, read, add, edit, invite, export,
 * delete. Derived from roleCapabilities so a public table can never disagree with the app.
 */
export function roleSummary(role: Role) {
  const c = roleCapabilities[role];
  return {
    read: c.includes("view_private") ? ("everything" as const) : c.includes("view_restricted") ? ("all_but_private" as const) : c.includes("view_approved") ? ("shared" as const) : ("nothing" as const),
    add: c.includes("add_memory"),
    edit: c.includes("edit_any_memory") ? ("all" as const) : c.includes("edit_own_memory") ? ("own" as const) : ("none" as const),
    invite: c.includes("manage_invitations"),
    export: c.includes("export_archive"),
    delete: c.includes("delete_capsule") ? ("capsule" as const) : c.includes("delete_any_memory") ? ("all" as const) : c.includes("delete_own_memory") ? ("own" as const) : ("none" as const),
    billing: c.includes("manage_billing"),
  };
}

/** Highest first. Successor is left out: it grants nothing until a verified handover. */
const roleRank: Role[] = ["owner", "organizer", "storyteller", "contributor", "viewer"];

/** A person's working role on a capsule, from their active memberships. */
export function membershipRole(memberships: CapsuleMembership[], personId: string, capsuleId: string): Role | null {
  const held = memberships.filter((m) => m.personId === personId && m.capsuleId === capsuleId && m.status === "active").map((m) => m.role);
  return roleRank.find((r) => held.includes(r)) ?? null;
}

/**
 * The role the selected demo identity holds on a capsule. When memberships are given they
 * decide (so a role changed on the Family page shows everywhere at once); otherwise the
 * persona's own list is used.
 */
export function roleFor(persona: Persona | undefined, capsuleId: string, memberships?: CapsuleMembership[]): Role | null {
  if (!persona) return null;
  if (persona.kind === "operations") return null;
  if (persona.personId && memberships) return membershipRole(memberships, persona.personId, capsuleId);
  return persona.roles.find((r) => r.capsuleId === capsuleId)?.role ?? null;
}

export function can(role: Role | null, capability: Capability) {
  return role ? roleCapabilities[role].includes(capability) : false;
}

/**
 * Whom a privacy setting lets in, besides the memory's author (who always sees their own).
 * "Only me" really is private: editors don't see someone else's private story, only the
 * owner does, because they answer for the capsule's exports and deletion.
 */
export function privacyAdmits(memory: Pick<Memory, "privacy" | "sharedWith">, role: Role | null, personId?: string): boolean {
  const steward = role === "owner" || role === "organizer";
  const member = steward || role === "storyteller" || role === "contributor" || role === "viewer";
  const level: MemoryPrivacy = memory.privacy;
  switch (level) {
    case "family":
      return member;
    case "selected":
      return steward || (member && !!personId && (memory.sharedWith ?? []).includes(personId));
    case "organizers":
      return steward;
    case "private":
      return role === "owner";
  }
}

/**
 * Can this persona see this memory?
 * - Deleted memories are never shown.
 * - Authors always see their own.
 * - Stories waiting for review are seen by the owner and editors, who review them.
 * - Approved stories follow their privacy setting (privacyAdmits).
 */
export function canViewMemory(memory: Memory, role: Role | null, personId?: string): boolean {
  if (memory.deletedAt) return false;
  if (!!personId && memory.attribution.personId === personId) return true;
  if (memory.status !== "approved") return role === "owner" || role === "organizer";
  return privacyAdmits(memory, role, personId);
}

/** Visible in the public-facing sample viewer (no persona), sample capsule only, approved family items. */
export function isViewerVisible(memory: Memory) {
  return !memory.deletedAt && memory.status === "approved" && memory.privacy === "family";
}

export function canEditMemory(memory: Memory, role: Role | null, personId?: string) {
  if (can(role, "edit_any_memory")) return true;
  return can(role, "edit_own_memory") && !!personId && memory.attribution.personId === personId;
}

export function canDeleteMemory(memory: Memory, role: Role | null, personId?: string) {
  if (can(role, "delete_any_memory")) return true;
  return can(role, "delete_own_memory") && !!personId && memory.attribution.personId === personId;
}

/** Content eligible for a printed heirloom: approved and consented. */
export function isPrintEligible(memory: Memory) {
  return !memory.deletedAt && memory.status === "approved" && memory.consent.print;
}

/**
 * Whether a memory belongs in an export. `includePrivate` covers the limited levels ("Only me"
 * and "Selected people"); when the exporter is known, nothing they couldn't see is included.
 */
export function isExportEligible(memory: Memory, opts: { includePrivate: boolean; includeDrafts: boolean }, exporter?: { role: Role | null; personId?: string }) {
  if (memory.deletedAt) return false;
  if (!memory.consent.export) return false;
  if (!opts.includeDrafts && memory.status !== "approved") return false;
  if (!opts.includePrivate && (memory.privacy === "private" || memory.privacy === "selected")) return false;
  if (exporter && !canViewMemory(memory, exporter.role, exporter.personId)) return false;
  return true;
}

export function capsuleIsEditable(capsule: Capsule) {
  return capsule.status === "draft" || capsule.status === "active";
}

/** The in-app permissions table, grouped by what people actually do: read, edit, invite, export, delete. */
export const accessMatrix: { group: string; rows: { capability: Capability; label: string }[] }[] = [
  {
    group: "Reading",
    rows: [
      { capability: "view_approved", label: "Family stories" },
      { capability: "view_restricted", label: "Stories for owner & editors or selected people" },
      { capability: "view_private", label: "Other people's “Only me” stories" },
    ],
  },
  {
    group: "Adding & editing",
    rows: [
      { capability: "add_memory", label: "Add stories" },
      { capability: "edit_own_memory", label: "Edit their own stories" },
      { capability: "edit_any_memory", label: "Edit anyone's stories" },
      { capability: "review_contributions", label: "Approve contributions" },
    ],
  },
  { group: "Inviting", rows: [{ capability: "manage_invitations", label: "Invite people and change roles" }] },
  {
    group: "Exporting",
    rows: [
      { capability: "export_archive", label: "Download the archive" },
      { capability: "order_heirlooms", label: "Order printed keepsakes" },
    ],
  },
  {
    group: "Deleting",
    rows: [
      { capability: "delete_own_memory", label: "Remove their own stories" },
      { capability: "delete_any_memory", label: "Remove anyone's stories" },
      { capability: "delete_capsule", label: "Delete the whole capsule" },
    ],
  },
  { group: "Account", rows: [{ capability: "manage_billing", label: "Plan and billing" }] },
];

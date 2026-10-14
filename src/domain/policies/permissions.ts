import type { Capsule, CapsuleMembership, Memory, MemoryPrivacy, Persona, Role } from "@/domain/models";

/**
 * Permission predicates. In Part One these drive what the UI shows for the
 * selected demo persona — they are NOT a security boundary. Part Two must
 * re-implement every check server-side (see docs/SECURITY_PRIVACY_DECISIONS.md).
 */

export type Capability =
  | "view_approved"
  | "view_private"
  | "add_memory"
  | "edit_any_memory"
  | "edit_own_memory"
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
    "view_private",
    "add_memory",
    "edit_any_memory",
    "edit_own_memory",
    "review_contributions",
    "manage_invitations",
    "manage_privacy",
    "export_archive",
    "manage_billing",
    "delete_capsule",
    "order_heirlooms",
  ],
  organizer: ["view_approved", "view_private", "add_memory", "edit_any_memory", "edit_own_memory", "review_contributions", "manage_invitations", "export_archive", "order_heirlooms"],
  storyteller: ["view_approved", "add_memory", "edit_own_memory", "export_archive"],
  contributor: ["view_approved", "add_memory", "edit_own_memory"],
  viewer: ["view_approved"],
  successor: [], // designated for the future; no access now
};

export const roleLabels: Record<Role, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Pays for the capsule, manages everything including billing and deletion." },
  organizer: { label: "Organizer", description: "Curates prompts, invites people and reviews contributions." },
  storyteller: { label: "Storyteller", description: "The person whose life this is. Controls their own contributions." },
  contributor: { label: "Contributor", description: "Adds stories, photos or recordings by invitation." },
  viewer: { label: "Viewer", description: "Can explore approved, family-visible memories." },
  successor: { label: "Successor", description: "A designated future steward. No access until a verified handover (Part Two)." },
};

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

/** Which privacy levels a role may see (for approved content). */
export function visiblePrivacyLevels(role: Role | null): MemoryPrivacy[] {
  if (role === "owner" || role === "organizer") return ["private", "organizers", "family"];
  if (role === "storyteller" || role === "contributor" || role === "viewer") return ["family"];
  return [];
}

/**
 * Can this persona see this memory in the capsule *viewer*?
 * - Only approved, non-deleted memories appear in the viewer.
 * - Private items are visible to owners/organizers, and to the person who wrote them.
 */
export function canViewMemory(memory: Memory, role: Role | null, personId?: string): boolean {
  if (memory.deletedAt) return false;
  const isAuthor = !!personId && memory.attribution.personId === personId;
  if (memory.status !== "approved") {
    return isAuthor || role === "owner" || role === "organizer";
  }
  if (isAuthor) return true;
  return visiblePrivacyLevels(role).includes(memory.privacy);
}

/** Visible in the public-facing sample viewer (no persona) — sample capsule only, approved family items. */
export function isViewerVisible(memory: Memory) {
  return !memory.deletedAt && memory.status === "approved" && memory.privacy === "family";
}

export function canEditMemory(memory: Memory, role: Role | null, personId?: string) {
  if (can(role, "edit_any_memory")) return true;
  return can(role, "edit_own_memory") && !!personId && memory.attribution.personId === personId;
}

/** Content eligible for a printed heirloom: approved and consented. */
export function isPrintEligible(memory: Memory) {
  return !memory.deletedAt && memory.status === "approved" && memory.consent.print;
}

export function isExportEligible(memory: Memory, opts: { includePrivate: boolean; includeDrafts: boolean }) {
  if (memory.deletedAt) return false;
  if (!memory.consent.export) return false;
  if (!opts.includeDrafts && memory.status !== "approved") return false;
  if (!opts.includePrivate && memory.privacy === "private") return false;
  return true;
}

export function capsuleIsEditable(capsule: Capsule) {
  return capsule.status === "draft" || capsule.status === "active";
}

/** Matrix for the privacy screen. */
export const accessMatrix: { capability: Capability; label: string }[] = [
  { capability: "view_approved", label: "See approved family stories" },
  { capability: "view_private", label: "See private stories" },
  { capability: "add_memory", label: "Add memories" },
  { capability: "edit_any_memory", label: "Edit anyone's memories" },
  { capability: "review_contributions", label: "Approve contributions" },
  { capability: "manage_invitations", label: "Invite people" },
  { capability: "export_archive", label: "Export the archive" },
  { capability: "order_heirlooms", label: "Order printed heirlooms" },
  { capability: "manage_billing", label: "Manage billing" },
  { capability: "delete_capsule", label: "Delete the capsule" },
];

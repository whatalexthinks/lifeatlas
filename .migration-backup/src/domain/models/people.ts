import type { ID, ISODateTime, Timestamps } from "./common";

export type Role = "owner" | "organizer" | "storyteller" | "contributor" | "viewer" | "successor";

/** Demo-only identities used by the persona switcher. */
export type PersonaKind = "organizer" | "storyteller" | "contributor" | "viewer" | "operations";

export interface User extends Timestamps {
  id: ID;
  email: string; // fictional, example.com only
  mfaIntent: "not_set" | "planned"; // real MFA is Part Two
}

export interface Profile {
  userId: ID;
  displayName: string;
  givenName: string;
  personId?: ID;
  pronouns?: string;
}

export interface AccountPreferences {
  theme: "light" | "evening" | "system";
  textSize: "standard" | "large";
  reducedMotion: "system" | "reduced" | "full";
  weeklyDigestIntent: boolean; // no email is sent in demo
  contributionAlertsIntent: boolean;
  language: "en";
}

export interface Persona {
  id: ID;
  kind: PersonaKind;
  name: string;
  personId?: ID;
  description: string;
  /** Capsule roles this persona holds. */
  roles: { capsuleId: ID; role: Role }[];
}

export interface Person extends Timestamps {
  id: ID;
  displayName: string;
  givenName: string;
  familyName: string;
  birthYear?: number;
  deathYear?: number;
  /** City-level only. Never a street address. */
  birthplaceId?: ID;
  note?: string;
  /** e.g. "Margaret's sister" — relative to the capsule's storyteller */
  shortBio?: string;
  isSample: true | false;
}

export type RelationshipKind = "parent" | "spouse" | "sibling" | "friend" | "partner";

export interface Relationship {
  id: ID;
  /** from is the parent/spouse/sibling/friend of to */
  fromPersonId: ID;
  toPersonId: ID;
  kind: RelationshipKind;
  since?: number;
  until?: number;
}

export interface FamilyGroup extends Timestamps {
  id: ID;
  name: string;
  ownerId: ID;
  capsuleIds: ID[];
  description?: string;
}

export interface FamilyMember {
  id: ID;
  familyGroupId: ID;
  personId: ID;
  role: Role;
  joinedAt: ISODateTime;
}

export interface CapsuleMembership {
  id: ID;
  capsuleId: ID;
  personId: ID;
  role: Role;
  status: "active" | "invited" | "removed";
  grantedAt: ISODateTime;
  /** Simulated in Part One. Real enforcement is server-side in Part Two. */
  enforcement: "simulated" | "server";
}

import type { ID, ISODateTime, Timestamps } from "./common";
import type { Role } from "./people";

/**
 * Invitation lifecycle. The "_demo" / "simulated_" suffixes are deliberate:
 * the UI can never confuse a local preview with a delivered message.
 */
export type InvitationStatus =
  | "draft"
  | "prepared"
  | "simulated_sent"
  | "accepted_demo"
  | "expired_demo"
  | "revoked_demo"
  // Part Two (provider-confirmed) states:
  | "sent"
  | "accepted"
  | "expired"
  | "revoked";

export type InvitationChannel = "email" | "sms" | "link";

export interface Invitation extends Timestamps {
  id: ID;
  capsuleId: ID;
  token: string;
  recipientName: string;
  /** Fictional, example.com / 555-01xx only. Optional: links can be shared by hand. */
  recipientContact?: string;
  relationship: string;
  role: Extract<Role, "storyteller" | "contributor" | "viewer" | "organizer">;
  channel: InvitationChannel;
  message: string;
  mode: "questions" | "open";
  questionIds: ID[];
  status: InvitationStatus;
  expiresAt: ISODateTime;
  history: { status: InvitationStatus; at: ISODateTime; note?: string }[];
  personId?: ID;
}

export type ContributionStatus = "draft" | "submitted" | "under_review" | "approved" | "returned" | "declined";

export interface ContributionReview {
  id: ID;
  at: ISODateTime;
  reviewer: string;
  decision: "approved" | "returned" | "declined" | "started_review";
  note?: string;
}

export interface Contribution extends Timestamps {
  id: ID;
  capsuleId: ID;
  memoryId: ID;
  invitationId?: ID;
  contributorName: string;
  contributorPersonId?: ID;
  status: ContributionStatus;
  reviews: ContributionReview[];
}

export interface ShareGrant {
  id: ID;
  capsuleId: ID;
  memoryId?: ID;
  audience: "family_link" | "public_link";
  format: "portrait_story" | "audio_quote" | "invitation_preview" | "milestone";
  consentConfirmedBy: string;
  createdAt: ISODateTime;
  revokedAt?: ISODateTime;
  /** In Part One no public URL is ever created. */
  publicUrl: null;
}

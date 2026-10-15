import type { ID, ISODate, ISODateTime, Timestamps } from "./common";

/**
 * Letters Through Time.
 * Production lifecycle: draft → prepared → sealed → scheduled → delivery_attempted → delivered | failed | canceled
 * Part One can only reach `sealed_demo`. `scheduled` and later require a provider confirmation.
 */
export type FutureMessageStatus =
  | "draft"
  | "prepared"
  | "sealed_demo"
  | "sealed"
  | "scheduled"
  | "delivery_attempted"
  | "delivered"
  | "failed"
  | "canceled";

export interface FutureRecipient {
  name: string;
  relationship: string;
  /** Fictional example.com address only in demo. */
  contact?: string;
  contactStatus: "not_provided" | "unverified" | "verification_pending_service";
  birthYear?: number;
}

export type ReleaseKind = "date" | "interval" | "milestone" | "year";

export interface FutureReleasePolicy {
  kind: ReleaseKind;
  /** The intended opening date (also computed for interval, year and birthday releases). */
  date: ISODate;
  intervalYears?: 5 | 10 | 20 | 30;
  /** "Open it in 2045": the letter waits for a year, not a particular day. */
  year?: number;
  milestone?: "18th_birthday" | "21st_birthday" | "graduation" | "wedding" | "anniversary" | "first_child" | "30th_birthday" | "custom";
  milestoneNote?: string;
  /** Requirement for releases far in the future. */
  requiresReconfirmationEveryYears: number;
}

export interface SuccessorDesignation {
  id: ID;
  /** A trusted person who can act if the author cannot. Not granted access now. */
  name: string;
  relationship: string;
  contact?: string;
  scope: "future_messages" | "capsule_stewardship" | "both";
  status: "draft" | "acknowledged_demo" | "pending_verification_service";
  createdAt: ISODateTime;
}

export interface DeliveryAttempt {
  id: ID;
  messageId: ID;
  at: ISODateTime;
  channel: "email" | "postal" | "in_app";
  outcome: "succeeded" | "bounced" | "deferred" | "failed";
  providerReference?: string;
}

export interface FutureMessage extends Timestamps {
  id: ID;
  token: string;
  capsuleId?: ID;
  authorName: string;
  authorPersonId?: ID;
  title: string;
  dedication?: string;
  body: string;
  format: "letter" | "voice" | "letter_with_media";
  /** Photos, voice notes and video clips sent with the letter. */
  attachmentIds: ID[];
  /** Stories from the capsule given with the letter, a gift of memories. */
  memoryIds?: ID[];
  recipient: FutureRecipient;
  backupRecipient?: FutureRecipient;
  successorId?: ID;
  release: FutureReleasePolicy;
  restrictions: { recipientOnly: boolean; allowFamilyAfterOpening: boolean; personalNote?: string };
  status: FutureMessageStatus;
  /** SHA-256 of the sealed content (demo seal is reversible; production seal is immutable). */
  snapshotHash?: string;
  sealedAt?: ISODateTime;
  /** True only for clearly labelled sample content showing the opening experience. */
  isExample: boolean;
  history: { status: FutureMessageStatus; at: ISODateTime; note?: string }[];
}

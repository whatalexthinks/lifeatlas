import type { FuzzyDate, GeoPoint, ID, ISODateTime, StorageLocation, Timestamps } from "./common";

/* ----------------------------- Places ----------------------------- */

export type LocationPrecision = "landmark" | "city" | "region" | "country";
export type LocationVisibility = "family" | "organizers" | "hidden";

export interface Place {
  id: ID;
  name: string; // "Portland, Maine"
  nickname?: string; // "The harbor"
  locality?: string;
  region?: string;
  country: string;
  countryCode: string;
  /** Stored internally; displayed rounded according to precision. */
  point: GeoPoint;
  precision: LocationPrecision;
  visibility: LocationVisibility;
  source: "fixture" | "manual" | "geocoder";
}

export interface MemoryPlace {
  memoryId: ID;
  placeId: ID;
  role: "primary" | "mentioned";
}

/* ---------------------------- Chapters ---------------------------- */

export type ChapterKey =
  | "childhood"
  | "coming_of_age"
  | "love"
  | "family"
  | "work"
  | "journeys"
  | "everyday"
  | "wisdom";

export interface StoryChapter {
  id: ChapterKey;
  title: string;
  subtitle: string;
  color: "evergreen" | "terracotta" | "slate" | "smoke" | "moss" | "brass";
  order: number;
}

/* ---------------------------- Capsules ---------------------------- */

export type CapsuleStatus = "draft" | "active" | "archived" | "deletion_pending";
export type CollectionMode = "in_person" | "link" | "family";
export type MemoryPrivacy = "private" | "organizers" | "family";

export interface CapsuleTheme {
  palette: "evergreen" | "terracotta" | "slate" | "linen" | "night";
  typography: "classic" | "italic" | "modern";
}

export interface CapsuleCover {
  /** Either a sample plate id or a media asset id. */
  plateId?: string;
  mediaId?: ID;
  layout: "portrait" | "full_bleed" | "type_only";
  focalY: number; // 0–100, object-position
}

/** Whose story a capsule holds. Shapes words, prompts and chapter names — not what it may contain. */
export type CapsuleKind = "personal" | "couple" | "family" | "parent" | "child" | "someone";

/** A date the capsule remembers every year (an anniversary) or once (a milestone). */
export interface KeyDate {
  id: ID;
  label: string;
  kind: "anniversary" | "birthday" | "milestone" | "remembrance";
  month: number; // 1–12
  day: number; // 1–31
  /** The year it first happened, when known. Never invented. */
  year?: number;
  /** Recurs every year (anniversaries, birthdays). */
  recurring: boolean;
}

export interface Capsule extends Timestamps {
  id: ID;
  /** Missing on capsules saved before kinds existed; see capsuleKind(). */
  kind?: CapsuleKind;
  /** A sentence about the capsule, shown under its title. */
  description?: string;
  /** People this capsule is about (both partners, family members). The subject is first. */
  peopleIds?: ID[];
  keyDates?: KeyDate[];
  /** "Margaret Ellis" */
  subjectName: string;
  preferredName: string;
  subjectPersonId?: ID;
  /** Relationship to the owner, e.g. "Mother". Free text. */
  relationship: string;
  relationshipKind: "mother" | "father" | "grandparent" | "partner" | "self" | "other";
  title: string; // "A Life in Her Own Words"
  birthYear?: number;
  birthplaceId?: ID;
  /** Free-text birthplace when no structured place was chosen. */
  birthplaceLabel?: string;
  dedication?: string;
  theme: CapsuleTheme;
  cover: CapsuleCover;
  status: CapsuleStatus;
  collectionMode: CollectionMode;
  defaultPrivacy: MemoryPrivacy;
  startingChapter: ChapterKey;
  chapterOrder: ChapterKey[];
  featuredMemoryId?: ID;
  ownerPersonId: ID;
  familyGroupId?: ID;
  isSample: boolean;
  /** Is the capsule viewer visible to invited viewers (still private, never indexed). */
  viewerEnabled: boolean;
  deletionRequestedAt?: ISODateTime;
}

/* ---------------------------- Memories ---------------------------- */

export type MemoryStatus = "draft" | "submitted" | "under_review" | "approved" | "returned" | "declined";

export interface MemoryAttribution {
  personId?: ID;
  displayName: string;
  relationship?: string; // "Granddaughter"
  via: "organizer" | "storyteller" | "invitation" | "recording_session" | "sample" | "restored";
  invitationId?: ID;
}

export interface MemoryConsent {
  /** May appear in a printed heirloom. */
  print: boolean;
  /** May be included in exports shared beyond the owner. */
  export: boolean;
  /** May be used in an opt-in share card. Never public by default. */
  share: boolean;
}

export interface MemoryRevision {
  id: ID;
  at: ISODateTime;
  by: string;
  summary: string; // "Edited title and date"
  previous: { title: string; narrative: string; date: FuzzyDate; placeId?: ID };
}

export interface Memory extends Timestamps {
  id: ID;
  capsuleId: ID;
  title: string;
  narrative: string;
  summary?: string;
  quote?: string;
  date: FuzzyDate;
  placeId?: ID;
  chapter: ChapterKey;
  peopleIds: ID[];
  tags: string[];
  /** Image media in display order. */
  photoIds: ID[];
  /** Short video clips. Optional so memories saved before video existed stay valid. */
  videoIds?: ID[];
  audioId?: ID;
  questionId?: ID;
  attribution: MemoryAttribution;
  privacy: MemoryPrivacy;
  status: MemoryStatus;
  consent: MemoryConsent;
  pinned: boolean;
  deletedAt?: ISODateTime;
  revisions: MemoryRevision[];
  /** Where the record itself is stored. */
  storage: StorageLocation;
  reviewNote?: string;
}

/* ------------------------------ Media ----------------------------- */

export type MediaKind = "image" | "audio" | "video";

export type MediaSource =
  | { kind: "plate"; plateId: string } // procedurally illustrated sample plate
  | { kind: "static"; url: string } // file shipped in /public (sample)
  | { kind: "local"; blobKey: string } // IndexedDB on this device
  | { kind: "remote"; objectKey: string }; // Part Two

export interface MediaConsent {
  contributorAgreed: boolean;
  print: boolean;
  share: boolean;
}

export interface MediaVariant {
  id: ID;
  mediaId: ID;
  purpose: "thumbnail" | "display" | "print" | "original";
  width?: number;
  height?: number;
  mimeType: string;
}

export interface MediaAsset extends Timestamps {
  id: ID;
  capsuleId: ID;
  kind: MediaKind;
  source: MediaSource;
  storage: StorageLocation;
  mimeType: string;
  byteSize?: number;
  width?: number;
  height?: number;
  durationSec?: number;
  caption: string;
  alt: string;
  credit?: string;
  takenDate?: FuzzyDate;
  placeId?: ID;
  contributorName: string;
  consent: MediaConsent;
  /** SHA-256 hex, computed locally for device media. */
  checksum?: string;
  /** Normalised 0–1 amplitude peaks for waveform rendering (audio only). */
  peaks?: number[];
  transcriptId?: ID;
  /** Honest label for synthetic sample audio and illustrated plates. */
  sampleNotice?: string;
}

export interface Transcript extends Timestamps {
  id: ID;
  mediaId: ID;
  text: string;
  /** Never "inferred" in Part One — we do not invent transcripts. */
  origin: "manual" | "sample_script" | "provider";
  language: "en";
}

/* ---------------------------- Questions --------------------------- */

export type QuestionCategory =
  | "Childhood"
  | "Parents"
  | "School"
  | "Friendship"
  | "Love"
  | "Raising a Family"
  | "Work"
  | "Places"
  | "Travel"
  | "Holidays"
  | "Challenges"
  | "Pride"
  | "Wisdom"
  | "Recipes"
  | "Traditions"
  | "Small Ordinary Moments"
  | "Messages to Descendants"
  | "Our Story"
  | "Us, Now"
  | "Our Future"
  | "Growing Up"
  | "Family History"
  | "Funny Memories"
  | "Values"
  | "Hopes & Dreams"
  | "Adventures"
  | "Advice";

export interface Question {
  id: ID;
  text: string;
  category: QuestionCategory;
  /** Capsule kinds this was written for. Absent = suits any life story. */
  audiences?: CapsuleKind[];
  chapter: ChapterKey;
  followUps: string[];
  custom: boolean;
  createdBy?: string;
}

export interface QuestionCollection extends Timestamps {
  id: ID;
  capsuleId: ID;
  title: string;
  questionIds: ID[];
}

/** "saved" is "save for later": kept aside, not offered in sessions until moved back. */
export type AssignmentStatus = "queued" | "answered" | "skipped" | "saved";

export interface QuestionAssignment {
  id: ID;
  capsuleId: ID;
  questionId: ID;
  order: number;
  status: AssignmentStatus;
  memoryId?: ID;
  invitationId?: ID;
}

export interface RecordingSession extends Timestamps {
  id: ID;
  capsuleId: ID;
  mode: CollectionMode | "holiday";
  storytellerName: string;
  helperName?: string;
  questionIds: ID[];
  memoryIds: ID[];
  status: "active" | "completed";
  endedAt?: ISODateTime;
}

export interface LifeEvent {
  id: ID;
  personId: ID;
  kind: "birth" | "move" | "marriage" | "child" | "career" | "loss" | "other";
  label: string;
  date: FuzzyDate;
  placeId?: ID;
}

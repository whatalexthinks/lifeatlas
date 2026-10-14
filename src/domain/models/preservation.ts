import type { ID, ISODateTime } from "./common";
import type { CapsuleKind } from "./capsule";

/**
 * Preservation health is never inferred. Each state must come from a provider
 * reporting real evidence. In demo mode everything is `unconfigured`.
 */
export type HealthState = "unconfigured" | "checking" | "verified" | "degraded" | "failed";

export interface BackupSnapshot {
  id: ID;
  capsuleId: ID;
  takenAt: ISODateTime;
  provider: string;
  objectCount: number;
  byteSize: number;
  immutableUntil?: ISODateTime;
}

export interface IntegrityCheck {
  id: ID;
  capsuleId: ID;
  at: ISODateTime;
  scope: "primary" | "secondary" | "local_device";
  filesChecked: number;
  mismatches: number;
  result: "passed" | "failed" | "partial";
}

export interface RestoreTest {
  id: ID;
  capsuleId: ID;
  at: ISODateTime;
  restoredFiles: number;
  result: "passed" | "failed";
}

export interface PreservationStatus {
  capsuleId: ID;
  mode: "demo_local_only" | "connected";
  primary: HealthState;
  secondary: HealthState;
  lastIntegrityCheck?: IntegrityCheck;
  lastRestoreTest?: RestoreTest;
  lastBackup?: BackupSnapshot;
  explanation: string;
}

export type ExportStatus = "queued" | "building" | "ready" | "failed" | "expired";
export type ExportFormat = "zip" | "json" | "html";

export interface ExportOptions {
  includeAudio: boolean;
  includePhotos: boolean;
  includePrivate: boolean;
  includeDrafts: boolean;
  includeSamplePlates: boolean;
}

export interface ExportJob {
  id: ID;
  capsuleId: ID;
  format: ExportFormat;
  options: ExportOptions;
  status: ExportStatus;
  createdAt: ISODateTime;
  completedAt?: ISODateTime;
  fileName?: string;
  byteSize?: number;
  counts?: { memories: number; photos: number; audio: number; missing: number; excluded: number };
  error?: string;
}

/** Stable, versioned manifest written into every export. See docs/DATA_MODEL.md. */
export interface ArchiveManifest {
  schema: "lifeatlas.archive";
  schemaVersion: 1;
  generatedAt: ISODateTime;
  generator: string;
  mode: "demo_local";
  capsule: {
    id: ID;
    /** Added within v1; older exports omit it. */
    kind?: CapsuleKind;
    subjectName: string;
    title: string;
    description?: string;
    birthYear?: number;
    dedication?: string;
  };
  options: ExportOptions;
  people: { id: ID; name: string; birthYear?: number; deathYear?: number }[];
  places: { id: ID; name: string; country: string; precision: string; lat: number; lng: number }[];
  memories: {
    id: ID;
    title: string;
    narrative: string;
    quote?: string;
    /** `display` is for people; the other fields restore the date exactly. Season, decade, lifeStage and note were added within v1 and may be absent in older exports. */
    date: { display: string; precision: string; year?: number; month?: number; day?: number; season?: string; decade?: number; lifeStage?: string; note?: string };
    chapter: string;
    placeId?: ID;
    peopleIds: ID[];
    tags: string[];
    contributor: string;
    privacy: string;
    status: string;
    media: ID[];
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
  }[];
  media: {
    id: ID;
    kind: string;
    caption: string;
    mimeType: string;
    path: string | null;
    included: boolean;
    reason?: string;
    byteSize?: number;
    sha256?: string;
    transcript?: string;
    sampleNotice?: string;
  }[];
  exclusions: { kind: string; id: ID; reason: string }[];
  notices: string[];
}

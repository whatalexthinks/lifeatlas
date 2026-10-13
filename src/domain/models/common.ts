/**
 * Shared primitives for the LifeAtlas domain.
 * Every entity uses string IDs with a readable prefix and ISO-8601 timestamps,
 * which maps 1:1 onto a future Postgres schema (text PK / timestamptz).
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string;

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Where a piece of data or media really lives. Drives honest UI copy. */
export type StorageLocation =
  | "fixture" // shipped with the app as sample content
  | "this_device" // IndexedDB in this browser only
  | "remote"; // Part Two: private cloud object storage

export type Season = "spring" | "summer" | "autumn" | "winter";

export type LifeStage =
  | "early_childhood"
  | "childhood"
  | "teenage_years"
  | "young_adulthood"
  | "early_family_years"
  | "middle_years"
  | "later_years"
  | "recent_years";

export type DatePrecision =
  | "day"
  | "month"
  | "season"
  | "year"
  | "circa"
  | "decade"
  | "life_stage"
  | "unknown";

/**
 * A date that may be exact, approximate, or unknown.
 * Family memories are rarely exact — the model must never force precision.
 */
export interface FuzzyDate {
  precision: DatePrecision;
  year?: number;
  month?: number; // 1–12
  day?: number;
  season?: Season;
  decade?: number; // e.g. 1960
  lifeStage?: LifeStage;
  /** Optional free text, e.g. "the winter Dad broke his arm" */
  note?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type ServiceMode = "demo" | "production";

export type Brand<T, B extends string> = T & { readonly __brand: B };

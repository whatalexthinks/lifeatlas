export * from "./common";
export * from "./people";
export * from "./capsule";
export * from "./collaboration";
export * from "./gifting";
export * from "./future";
export * from "./preservation";
export * from "./commerce";
export * from "./heirloom";
export * from "./ops";

import type { AccountPreferences, CapsuleMembership, FamilyGroup, Persona, Person, Profile, Relationship, User } from "./people";
import type {
  Capsule,
  MediaAsset,
  Memory,
  Place,
  Question,
  QuestionAssignment,
  QuestionCollection,
  RecordingSession,
  Transcript,
  LifeEvent,
} from "./capsule";
import type { Contribution, Invitation, ShareGrant } from "./collaboration";
import type { Gift } from "./gifting";
import type { FutureMessage, SuccessorDesignation } from "./future";
import type { ExportJob, IntegrityCheck } from "./preservation";
import type { Cart, CheckoutSession, Invoice, Order, Product, Refund, Subscription } from "./commerce";
import type { HeirloomConfiguration, PrintProject } from "./heirloom";
import type { AnalyticsEvent, AuditEvent, Notification, SupportRequest } from "./ops";

/**
 * The full local demonstration database. Persisted to IndexedDB.
 * Each top-level collection maps to a future Postgres table.
 */
export interface DemoDatabase {
  schemaVersion: number;
  seededAt: string;
  account: { user: User; profile: Profile; preferences: AccountPreferences };
  personas: Persona[];
  activePersonaId: string;
  people: Person[];
  relationships: Relationship[];
  lifeEvents: LifeEvent[];
  familyGroups: FamilyGroup[];
  capsules: Capsule[];
  memberships: CapsuleMembership[];
  memories: Memory[];
  media: MediaAsset[];
  transcripts: Transcript[];
  places: Place[];
  questions: Question[];
  questionCollections: QuestionCollection[];
  assignments: QuestionAssignment[];
  sessions: RecordingSession[];
  invitations: Invitation[];
  contributions: Contribution[];
  shareGrants: ShareGrant[];
  gifts: Gift[];
  futureMessages: FutureMessage[];
  successors: SuccessorDesignation[];
  heirlooms: HeirloomConfiguration[];
  printProjects: PrintProject[];
  cart: Cart;
  checkouts: CheckoutSession[];
  orders: Order[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  refunds: Refund[];
  exportJobs: ExportJob[];
  integrityChecks: IntegrityCheck[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
  analytics: AnalyticsEvent[];
  supportRequests: SupportRequest[];
  catalog: Product[];
  bookmarks: { capsuleId: string; memoryId: string; at: string }[];
  /** Capsule wizard draft — persisted so users can leave and resume. */
  wizardDraft: unknown | null;
}

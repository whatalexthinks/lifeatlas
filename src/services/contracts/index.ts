import type {
  AccountPreferences,
  CaptureDraft,
  GatheringSession,
  LetterDraft,
  Product,
  Role,
  BookConfiguration,
  BoxConfiguration,
  HeirloomConfiguration,
  Capsule,
  CartLine,
  CheckoutSession,
  ChapterKey,
  Contribution,
  ExportFormat,
  ExportJob,
  ExportOptions,
  FutureMessage,
  FutureMessageStatus,
  Gift,
  IntegrityCheck,
  Invitation,
  MediaAsset,
  Memory,
  MemoryStatus,
  Order,
  Persona,
  Place,
  PreservationStatus,
  PrintProof,
  Profile,
  Refund,
  ShippingAddress,
  SupportRequest,
  AnalyticsEventName,
  Transcript,
  SuccessorDesignation,
} from "@/domain/models";
import type { CapsuleWizardValues, FutureMessageFormValues, GiftFormValues, InvitationFormValues, MemoryFormValues } from "@/domain/schemas";

/* ------------------------------------------------------------------ */
/* Result types                                                        */
/* ------------------------------------------------------------------ */

export type ServiceName =
  | "auth"
  | "account"
  | "capsules"
  | "media"
  | "communications"
  | "transcription"
  | "billing"
  | "orders"
  | "gifts"
  | "geocoding"
  | "export"
  | "preservation"
  | "futureDelivery"
  | "fulfillment"
  | "analytics"
  | "support"
  | "heirlooms"
  | "operations"
  | "drafts";

export type ServiceErrorCode = "validation" | "not_found" | "forbidden" | "conflict" | "quota" | "unsupported" | "unknown";

export type ServiceResult<T> =
  | { status: "ok"; data: T; mode: "demo" | "production" }
  | { status: "error"; code: ServiceErrorCode; message: string }
  | { status: "not_configured"; service: ServiceName; message: string };

/** For async UI state. */
export type AsyncState<T> =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; data: T }
  | { state: "error"; message: string }
  | { state: "not_configured"; message: string };

export const ok = <T>(data: T, mode: "demo" | "production" = "demo"): ServiceResult<T> => ({ status: "ok", data, mode });
export const fail = <T = never>(code: ServiceErrorCode, message: string): ServiceResult<T> => ({ status: "error", code, message });
export const notConfigured = <T = never>(service: ServiceName, message: string): ServiceResult<T> => ({
  status: "not_configured",
  service,
  message,
});

/* ------------------------------------------------------------------ */
/* 1. Auth                                                             */
/* ------------------------------------------------------------------ */

export interface Session {
  userId: string;
  personaId: string;
  persona: Persona;
  /** "simulated" = demo persona switch. Never a security boundary. */
  assurance: "simulated" | "password" | "passkey" | "mfa";
}

export interface AuthProvider {
  getSession(): Promise<ServiceResult<Session>>;
  /** Demo only: switch the active persona. */
  switchPersona(personaId: string): Promise<ServiceResult<Session>>;
  /** Demo only: see the studio and viewer as a family member, using their current roles. */
  previewAsPerson(personId: string): Promise<ServiceResult<Session>>;
  signInWithEmail(email: string): Promise<ServiceResult<{ magicLinkSent: boolean }>>;
  enrollMfa(): Promise<ServiceResult<{ secretUri: string }>>;
  signOut(): Promise<ServiceResult<null>>;
}

/* ------------------------------------------------------------------ */
/* 2. Account                                                          */
/* ------------------------------------------------------------------ */

export interface AccountRepository {
  getProfile(): Promise<ServiceResult<Profile>>;
  updateProfile(patch: Partial<Pick<Profile, "displayName" | "givenName" | "pronouns">>): Promise<ServiceResult<Profile>>;
  updatePreferences(patch: Partial<AccountPreferences>): Promise<ServiceResult<AccountPreferences>>;
  requestAccountDeletion(): Promise<ServiceResult<{ scheduledFor: string }>>;
}

/* ------------------------------------------------------------------ */
/* 3. Capsules & memories                                              */
/* ------------------------------------------------------------------ */

export interface NewMemoryInput extends MemoryFormValues {
  capsuleId: string;
  photoIds: string[];
  audioId?: string;
  questionId?: string;
  attribution: Memory["attribution"];
  status: MemoryStatus;
}

export interface CapsuleRepository {
  createFromWizard(values: CapsuleWizardValues & { coverMediaId?: string }): Promise<ServiceResult<Capsule>>;
  updateCapsule(id: string, patch: Partial<Capsule>): Promise<ServiceResult<Capsule>>;
  setCapsuleStatus(id: string, to: Capsule["status"]): Promise<ServiceResult<Capsule>>;
  reorderChapters(id: string, order: ChapterKey[]): Promise<ServiceResult<Capsule>>;
  createMemory(input: NewMemoryInput): Promise<ServiceResult<Memory>>;
  updateMemory(id: string, patch: Partial<MemoryFormValues> & { photoIds?: string[]; audioId?: string | null }, editor: string): Promise<ServiceResult<Memory>>;
  transitionMemory(id: string, to: MemoryStatus, note?: string, reviewer?: string): Promise<ServiceResult<Memory>>;
  softDeleteMemory(id: string): Promise<ServiceResult<Memory>>;
  restoreMemory(id: string): Promise<ServiceResult<Memory>>;
  togglePin(id: string): Promise<ServiceResult<Memory>>;
  setFeatured(capsuleId: string, memoryId: string): Promise<ServiceResult<Capsule>>;
  toggleBookmark(capsuleId: string, memoryId: string): Promise<ServiceResult<boolean>>;
  addPlace(place: Omit<Place, "id">): Promise<ServiceResult<Place>>;
  addCustomQuestion(capsuleId: string, text: string, category: string): Promise<ServiceResult<string>>;
  setAssignments(capsuleId: string, questionIds: string[]): Promise<ServiceResult<null>>;
  markAssignment(capsuleId: string, questionId: string, status: "queued" | "answered" | "skipped", memoryId?: string): Promise<ServiceResult<null>>;
  /** Grant, change or (with null) remove a person's role on a capsule. The owner can't be changed here. */
  setMemberRole(capsuleId: string, personId: string, role: Role | null): Promise<ServiceResult<null>>;
}

/* ------------------------------------------------------------------ */
/* 4. Media storage                                                    */
/* ------------------------------------------------------------------ */

export interface PutMediaInput {
  capsuleId: string;
  blob: Blob;
  kind: "image" | "audio";
  caption?: string;
  alt?: string;
  contributorName: string;
  durationSec?: number;
  peaks?: number[];
  width?: number;
  height?: number;
}

export interface MediaStorageProvider {
  put(input: PutMediaInput): Promise<ServiceResult<MediaAsset>>;
  /** Returns a URL valid for this page session (object URL / static path / signed URL in Part Two). */
  resolveUrl(asset: MediaAsset): Promise<ServiceResult<string>>;
  getBlob(asset: MediaAsset): Promise<ServiceResult<Blob>>;
  remove(mediaId: string): Promise<ServiceResult<null>>;
  updateMeta(mediaId: string, patch: Partial<Pick<MediaAsset, "caption" | "alt" | "capsuleId">>): Promise<ServiceResult<MediaAsset>>;
}

/* ------------------------------------------------------------------ */
/* 5. Communications (invitations)                                     */
/* ------------------------------------------------------------------ */

export interface MessagePreview {
  subject: string;
  preheader: string;
  body: string;
  sms: string;
  link: string;
}

export interface CommunicationsProvider {
  prepareInvitation(capsuleId: string, values: InvitationFormValues): Promise<ServiceResult<Invitation>>;
  preview(invitationId: string, origin: string): Promise<ServiceResult<MessagePreview>>;
  /** Demo: marks simulated_sent after the organizer copies or "sends" — no email leaves the device. */
  simulateSend(invitationId: string): Promise<ServiceResult<Invitation>>;
  /** Production send. Part One: not configured. */
  send(invitationId: string): Promise<ServiceResult<{ providerMessageId: string }>>;
  resolveToken(token: string): Promise<ServiceResult<Invitation>>;
  accept(token: string): Promise<ServiceResult<Invitation>>;
  revoke(invitationId: string): Promise<ServiceResult<Invitation>>;
  reissue(invitationId: string): Promise<ServiceResult<Invitation>>;
  submitContribution(token: string, memoryId: string): Promise<ServiceResult<Contribution>>;
}

/* ------------------------------------------------------------------ */
/* 6. Recording & transcription                                        */
/* ------------------------------------------------------------------ */

export interface RecordingSupport {
  mediaRecorder: boolean;
  getUserMedia: boolean;
  secureContext: boolean;
  mimeType: string | null;
}

export interface TranscriptionProvider {
  detectSupport(): RecordingSupport;
  /** Part One never infers text from audio. */
  requestTranscript(mediaId: string): Promise<ServiceResult<Transcript>>;
  saveManualTranscript(mediaId: string, text: string): Promise<ServiceResult<Transcript>>;
}

/* ------------------------------------------------------------------ */
/* 7. Billing                                                          */
/* ------------------------------------------------------------------ */

export interface CheckoutCustomer {
  name: string;
  email: string;
  shipping?: ShippingAddress;
}

export interface BillingProvider {
  createCheckout(lines: CartLine[], purpose: "self" | "gift"): Promise<ServiceResult<{ checkoutId: string; url: string }>>;
  getCheckout(checkoutId: string): ServiceResult<CheckoutSession>;
  completeMockCheckout(checkoutId: string, customer: CheckoutCustomer): Promise<ServiceResult<Order>>;
  cancelCheckout(checkoutId: string): Promise<ServiceResult<null>>;
  verifyWebhook(payload: string, signature: string): Promise<ServiceResult<{ eventId: string }>>;
  listPaymentMethods(): Promise<ServiceResult<{ brand: string; last4: string }[]>>;
  startLivingArchivePreview(): Promise<ServiceResult<null>>;
  cancelLivingArchivePreview(): Promise<ServiceResult<null>>;
}

/* ------------------------------------------------------------------ */
/* 8. Orders & subscriptions                                           */
/* ------------------------------------------------------------------ */

export interface OrderService {
  cancel(orderId: string): Promise<ServiceResult<Order>>;
  requestRefund(orderId: string, reason: string): Promise<ServiceResult<Refund>>;
  /** Ops demo: advance through the mock lifecycle. */
  advanceMock(orderId: string): Promise<ServiceResult<Order>>;
}

export interface GiftService {
  createGift(values: GiftFormValues): Promise<ServiceResult<Gift>>;
  updateGift(id: string, values: GiftFormValues): Promise<ServiceResult<Gift>>;
  resolveToken(token: string): Promise<ServiceResult<Gift>>;
  markOpened(token: string): Promise<ServiceResult<Gift>>;
}

/* ------------------------------------------------------------------ */
/* 9. Geocoding / maps                                                 */
/* ------------------------------------------------------------------ */

export interface GeocodeResult {
  name: string;
  locality: string;
  region?: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export interface GeocodingProvider {
  /** Demo: searches a small built-in list of cities. Not a live geocoder. */
  search(query: string): Promise<ServiceResult<{ results: GeocodeResult[]; source: "built_in_list" | "provider" }>>;
  tileStyle(): ServiceResult<{ kind: "offline_vector" | "remote_tiles"; attribution: string }>;
}

/* ------------------------------------------------------------------ */
/* 10. Export                                                          */
/* ------------------------------------------------------------------ */

export interface ExportPreviewItem {
  id: string;
  kind: "memory" | "photo" | "audio" | "plate";
  label: string;
  included: boolean;
  reason?: string;
  byteSize?: number;
}

export interface ExportPreview {
  capsuleId: string;
  items: ExportPreviewItem[];
  estimatedBytes: number;
  warnings: string[];
}

export interface ArchiveInspection {
  /** Hands the checked archive to restoreArchive. Valid until the page is closed. */
  token: string;
  fileName: string;
  format: "zip" | "json";
  capsuleName: string;
  generatedAt: string;
  stories: number;
  people: number;
  places: number;
  /** Files whose bytes match the SHA-256 recorded at export. */
  verified: { photos: number; recordings: number };
  /** Captions of files whose bytes no longer match — they won't be restored. */
  damaged: string[];
  /** Files listed in the manifest but not in this archive (or a records-only export). */
  notInArchive: number;
  warnings: string[];
}

export interface ExportBuilder {
  preview(capsuleId: string, options: ExportOptions): Promise<ServiceResult<ExportPreview>>;
  build(capsuleId: string, options: ExportOptions, format: ExportFormat): Promise<ServiceResult<{ job: ExportJob; blob: Blob }>>;
  /** Reads a LifeAtlas export (.zip or .json) and checks every file against its recorded checksum. Changes nothing. */
  inspectArchive(file: File): Promise<ServiceResult<ArchiveInspection>>;
  /** Restores an inspected archive as a new capsule. Never overwrites anything already on this device. */
  restoreArchive(token: string): Promise<ServiceResult<{ capsuleId: string; stories: number; files: number; skipped: string[] }>>;
}

/* ------------------------------------------------------------------ */
/* 11. Preservation                                                    */
/* ------------------------------------------------------------------ */

export interface PreservationProvider {
  status(capsuleId: string): Promise<ServiceResult<PreservationStatus>>;
  /** Verifies checksums of media stored on THIS device. Honest, local, real. */
  runLocalIntegrityCheck(capsuleId: string): Promise<ServiceResult<IntegrityCheck & { details: { id: string; ok: boolean; reason?: string }[] }>>;
  runRestoreTest(capsuleId: string): Promise<ServiceResult<never>>;
  saveSuccessor(input: Omit<SuccessorDesignation, "id" | "createdAt" | "status">): Promise<ServiceResult<SuccessorDesignation>>;
  removeSuccessor(id: string): Promise<ServiceResult<null>>;
}

/* ------------------------------------------------------------------ */
/* 12. Future delivery                                                 */
/* ------------------------------------------------------------------ */

export interface FutureDeliveryProvider {
  saveDraft(values: FutureMessageFormValues, opts: { id?: string; capsuleId?: string; attachmentIds: string[]; authorName: string; recipientBirthYear?: number }): Promise<ServiceResult<FutureMessage>>;
  transition(id: string, to: FutureMessageStatus): Promise<ServiceResult<FutureMessage>>;
  /** Demo seal: computes a real SHA-256 snapshot hash locally; reversible. */
  sealDemo(id: string): Promise<ServiceResult<FutureMessage>>;
  /** Production scheduling — not configured until Part Two. */
  schedule(id: string): Promise<ServiceResult<{ jobId: string }>>;
  remove(id: string): Promise<ServiceResult<null>>;
  resolveToken(token: string): Promise<ServiceResult<FutureMessage>>;
}

/* ------------------------------------------------------------------ */
/* 13. Print & shipping fulfillment                                    */
/* ------------------------------------------------------------------ */

export interface FulfillmentProvider {
  createProof(configurationId: string): Promise<ServiceResult<PrintProof>>;
  approveProof(projectId: string, proofId: string): Promise<ServiceResult<PrintProof>>;
  quoteShipping(address: ShippingAddress): Promise<ServiceResult<{ amount: number; carrier: string }>>;
  submitToVendor(orderId: string): Promise<ServiceResult<{ vendorJobId: string }>>;
}

/* ------------------------------------------------------------------ */
/* 14. Analytics                                                       */
/* ------------------------------------------------------------------ */

export interface AnalyticsProvider {
  track(name: AnalyticsEventName, properties?: Record<string, string | number | boolean>): void;
}

/* ------------------------------------------------------------------ */
/* 15. Support                                                         */
/* ------------------------------------------------------------------ */

export interface SupportProvider {
  create(input: { name: string; email: string; topic: SupportRequest["topic"]; message: string }): Promise<ServiceResult<SupportRequest>>;
  setStatus(id: string, status: SupportRequest["status"]): Promise<ServiceResult<SupportRequest>>;
}

/* ------------------------------------------------------------------ */

export interface HeirloomInput {
  id?: string;
  kind: HeirloomConfiguration["kind"];
  capsuleId: string;
  name: string;
  book?: BookConfiguration;
  box?: BoxConfiguration;
}

/** Saved book and keepsake-box configurations, and turning one into a checkout line. */
export interface HeirloomRepository {
  save(input: HeirloomInput): Promise<ServiceResult<HeirloomConfiguration>>;
  remove(id: string): Promise<ServiceResult<null>>;
  /** Prices the configuration from the catalog and returns a checkout line. */
  toCartLine(id: string): ServiceResult<CartLine>;
}

export type SimulatedEvent = "contribution" | "invitation_opened" | "proof_ready" | "storage_warning";

/** Staff tools for the operations demo. In production these sit behind staff sign-in. */
export interface OperationsService {
  updateProduct(id: string, patch: { amount?: number; availability?: Product["availability"]; note?: string }): Promise<ServiceResult<Product>>;
  /** Plays a realistic event through the same code paths a real one would use. */
  simulate(event: SimulatedEvent): Promise<ServiceResult<string>>;
}

export interface CaptureDraftFiles {
  /** undefined = leave as saved; null = remove. */
  audio?: { blob: Blob; durationSec: number; peaks: number[]; source: "microphone" | "upload" } | null;
  photos?: { blob: Blob; caption: string; width?: number; height?: number; name: string }[];
}

export interface LoadedCaptureDraft {
  draft: CaptureDraft;
  audio?: { blob: Blob; durationSec: number; peaks: number[]; source: "microphone" | "upload" };
  photos: { blob: Blob; caption: string; width?: number; height?: number; name: string }[];
}

/** Autosaved answers in progress and resumable family gatherings. Local-first by design. */
export interface DraftRepository {
  saveCaptureDraft(fields: Omit<CaptureDraft, "audio" | "photos" | "updatedAt">, files?: CaptureDraftFiles): Promise<ServiceResult<CaptureDraft>>;
  loadCaptureDraft(key: string): Promise<ServiceResult<LoadedCaptureDraft | null>>;
  discardCaptureDraft(key: string): Promise<ServiceResult<null>>;
  startGathering(input: Pick<GatheringSession, "capsuleId" | "occasion" | "guests" | "questionIds">): Promise<ServiceResult<GatheringSession>>;
  updateGathering(id: string, patch: Partial<Pick<GatheringSession, "index" | "turn" | "answers" | "status" | "guests">>): Promise<ServiceResult<GatheringSession>>;
  /** Letter composer writing, kept until it's saved as a letter. */
  saveLetterDraft(draft: Omit<LetterDraft, "updatedAt">): Promise<ServiceResult<LetterDraft>>;
  discardLetterDraft(key: string): Promise<ServiceResult<null>>;
  removeGathering(id: string): Promise<ServiceResult<null>>;
}

export interface Services {
  mode: "demo" | "production";
  auth: AuthProvider;
  account: AccountRepository;
  capsules: CapsuleRepository;
  media: MediaStorageProvider;
  communications: CommunicationsProvider;
  transcription: TranscriptionProvider;
  billing: BillingProvider;
  orders: OrderService;
  gifts: GiftService;
  geocoding: GeocodingProvider;
  export: ExportBuilder;
  preservation: PreservationProvider;
  futureDelivery: FutureDeliveryProvider;
  fulfillment: FulfillmentProvider;
  analytics: AnalyticsProvider;
  support: SupportProvider;
  heirlooms: HeirloomRepository;
  operations: OperationsService;
  drafts: DraftRepository;
}

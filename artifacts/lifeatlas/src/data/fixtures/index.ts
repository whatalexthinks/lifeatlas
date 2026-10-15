import type { DemoDatabase, FeatureFlag } from "@/domain/models";
import { CATALOG_VERSION, defaultCatalog } from "@/data/product-catalog";
import { questionLibrary } from "@/data/prompts/questions";
import { capsules, familyGroups, memberships } from "./capsules";
import { assignments, contributions, invitations, questionCollections, sessions } from "./collaboration";
import { futureMessages, gifts, heirlooms, invoices, notifications, orders, printProjects, sampleCredits, sampleReferralEvents, subscriptions, successors, supportRequests } from "./business";
import { defaultPromotions } from "@/data/promotions";
import { makeReferralCode } from "@/domain/commerce/referrals";
import { media, transcripts } from "./media";
import { memories } from "./memories";
import { lifeEvents, people, personas, relationships } from "./people";
import { places } from "./places";
import { extraCapsules, extraFutureMessages, extraMedia, extraMemberships, extraMemories, extraPlaces } from "./samples-couple-family";

export const SCHEMA_VERSION = 3;
/** Bump when sample capsules or the question library change, so saved devices receive them. */
export const SAMPLE_VERSION = 2;

/** Every integration flag is locked off in Part One. */
export const featureFlags: FeatureFlag[] = [
  { key: "real_auth", label: "Secure accounts", description: "Real sign-in, sessions and MFA.", enabled: false, dependency: "Auth provider + server sessions" },
  { key: "real_billing", label: "Payments", description: "Stripe Checkout, subscriptions and webhooks.", enabled: false, dependency: "Stripe account, webhook endpoint" },
  { key: "cloud_media", label: "Cloud media storage", description: "Private object storage with signed URLs.", enabled: false, dependency: "S3-compatible bucket, KMS key" },
  { key: "email_invitations", label: "Email invitations", description: "Transactional email and SMS for invites.", enabled: false, dependency: "Email/SMS provider, verified domain" },
  { key: "transcription", label: "Transcription", description: "Speech-to-text for recordings, always editable.", enabled: false, dependency: "Transcription provider, consent flow" },
  { key: "geocoding", label: "Place search", description: "Geocoding and live map tiles.", enabled: false, dependency: "Geocoder + tile provider" },
  { key: "future_delivery", label: "Future delivery", description: "Long-term scheduled letter delivery.", enabled: false, dependency: "Legal review, continuity model, scheduler" },
  { key: "print_fulfillment", label: "Print & ship", description: "Book/box manufacturing and shipping.", enabled: false, dependency: "Print vendor, carrier, tax service" },
  { key: "backups", label: "Independent backups", description: "Encrypted secondary copies, integrity audits, restore drills.", enabled: false, dependency: "Secondary storage provider, audit jobs" },
  { key: "public_share_links", label: "Public share links", description: "Opt-in public story cards.", enabled: false, dependency: "Moderation, consent ledger, signed URLs" },
];

/** Build a fresh, isolated copy of the sample database. */
export function buildSeed(now = new Date()): DemoDatabase {
  const seed: DemoDatabase = {
    schemaVersion: SCHEMA_VERSION,
    seededAt: now.toISOString(),
    account: {
      user: { id: "usr_sarah", email: "sarah@example.com", mfaIntent: "not_set", createdAt: "2026-09-02T13:40:00.000Z", updatedAt: "2026-09-02T13:40:00.000Z" },
      profile: { userId: "usr_sarah", displayName: "Sarah Ellis", givenName: "Sarah", personId: "per_sarah" },
      preferences: { theme: "light", textSize: "standard", reducedMotion: "system", weeklyDigestIntent: true, contributionAlertsIntent: true, language: "en" },
    },
    personas,
    activePersonaId: "persona_sarah",
    people,
    relationships,
    lifeEvents,
    familyGroups: familyGroups.map((g) => (g.id === "fam_ellis" ? { ...g, capsuleIds: [...g.capsuleIds, ...extraCapsules.map((c) => c.id)] } : g)),
    capsules: [...capsules, ...extraCapsules],
    memberships: [...memberships, ...extraMemberships],
    memories: [...memories, ...extraMemories],
    media: [...media, ...extraMedia],
    transcripts,
    places: [...places, ...extraPlaces],
    questions: questionLibrary,
    questionCollections,
    assignments,
    sessions,
    invitations,
    contributions,
    shareGrants: [],
    gifts,
    futureMessages: [...futureMessages, ...extraFutureMessages],
    successors,
    heirlooms,
    printProjects,
    cart: { id: "cart_local", lines: [], purpose: "self" },
    checkouts: [],
    orders,
    subscriptions,
    invoices,
    refunds: [],
    exportJobs: [],
    integrityChecks: [],
    notifications,
    auditEvents: [
      { id: "aud_1", at: "2026-09-02T14:00:00.000Z", actor: "Sarah Ellis", action: "capsule.created", target: "cap_margaret" },
      { id: "aud_2", at: "2026-09-20T14:00:00.000Z", actor: "Sarah Ellis", action: "contribution.approved", target: "mem_june" },
      { id: "aud_3", at: "2026-10-08T08:00:00.000Z", actor: "Sarah Ellis", action: "contribution.review_started", target: "mem_kiln" },
    ],
    analytics: [],
    supportRequests,
    catalog: defaultCatalog,
    catalogVersion: CATALOG_VERSION,
    sampleVersion: SAMPLE_VERSION,
    promotions: defaultPromotions,
    promotionRedemptions: [],
    referrals: { code: makeReferralCode("Sarah", "usr_sarah"), events: sampleReferralEvents },
    credits: sampleCredits,
    bookmarks: [{ capsuleId: "cap_margaret", memoryId: "mem_seat", at: "2026-10-01T09:00:00.000Z" }],
    questionFavorites: ["q_ourstory_1"],
    captureDrafts: [],
    letterDrafts: [],
    gatherings: [],
    wizardDraft: null,
  };
  return structuredClone(seed);
}

export { featureFlags as defaultFeatureFlags };

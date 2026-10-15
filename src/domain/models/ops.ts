import type { ID, ISODateTime } from "./common";

export interface Notification {
  id: ID;
  at: ISODateTime;
  kind: "contribution" | "invitation" | "order" | "export" | "system" | "future_message";
  title: string;
  body: string;
  href?: string;
  read: boolean;
}

export interface AuditEvent {
  id: ID;
  at: ISODateTime;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
}

export type AnalyticsEventName =
  | "landing_cta_clicked"
  | "preview_started"
  | "capsule_created"
  | "first_memory_saved"
  | "memory_saved"
  | "invite_prepared"
  | "contribution_completed"
  | "first_audio_played"
  | "gift_configured"
  | "gift_previewed"
  | "checkout_started"
  | "checkout_completed_mock"
  | "heirloom_configured"
  | "print_started"
  | "archive_exported"
  | "future_message_saved"
  | "referral_link_copied"
  | "referral_link_shared";

export interface AnalyticsEvent {
  id: ID;
  name: AnalyticsEventName;
  at: ISODateTime;
  properties?: Record<string, string | number | boolean>;
  /** Demo events never leave the device. */
  destination: "local_only";
}

export interface SupportRequest {
  id: ID;
  createdAt: ISODateTime;
  from: string;
  topic: "billing" | "privacy" | "export" | "print" | "access" | "other";
  subject: string;
  body: string;
  status: "new_demo" | "open_demo" | "resolved_demo";
  isSample: boolean;
}

export type FeatureFlagKey =
  | "real_auth"
  | "real_billing"
  | "cloud_media"
  | "email_invitations"
  | "transcription"
  | "geocoding"
  | "future_delivery"
  | "print_fulfillment"
  | "backups"
  | "public_share_links";

export interface FeatureFlag {
  key: FeatureFlagKey;
  label: string;
  description: string;
  /** In Part One, every integration flag is locked off. */
  enabled: false;
  dependency: string;
}

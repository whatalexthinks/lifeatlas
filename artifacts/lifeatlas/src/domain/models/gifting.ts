import type { ID, ISODate, ISODateTime, Timestamps } from "./common";

export type GiftOccasion =
  | "christmas"
  | "hanukkah"
  | "birthday"
  | "mothers_day"
  | "fathers_day"
  | "anniversary"
  | "retirement"
  | "new_baby"
  | "just_because"
  | "other";

export type EnvelopeArtwork = "linen" | "botanical" | "night_sky" | "harbor" | "winter";

export interface GiftRecipient {
  name: string;
  relation: string;
  /** Optional, the giver can share the link themselves. */
  contact?: string;
}

export interface GiftReveal {
  envelope: EnvelopeArtwork;
  color: "evergreen" | "terracotta" | "slate" | "brass" | "ink";
  showGiverName: boolean;
}

export type GiftStatus =
  | "draft"
  | "checkout_mock"
  | "ready_demo" // "purchased" in a demo sense, never charged
  | "opened_demo"
  | "canceled_demo";

export interface Gift extends Timestamps {
  id: ID;
  token: string;
  occasion: GiftOccasion;
  occasionLabel?: string;
  recipient: GiftRecipient;
  giverName: string;
  dedication: string;
  reveal: GiftReveal;
  deliveryMode: "share_link_myself" | "scheduled_preview" | "in_person";
  /** Scheduled notification preview only, nothing is scheduled in Part One. */
  notifyOn?: ISODate;
  productId: string;
  addOnIds: string[];
  status: GiftStatus;
  orderId?: ID;
  capsuleId?: ID;
  openedAt?: ISODateTime;
}

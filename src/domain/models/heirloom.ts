import type { ID, ISODateTime, Timestamps } from "./common";

export type HeirloomKind = "book" | "keepsake_box" | "legacy_capsule_concept";

export type BookCoverMaterial = "linen" | "cloth" | "soft_touch";
export type BookCoverColor = "evergreen" | "oat" | "terracotta" | "slate" | "ink";
export type BookFoil = "none" | "brass" | "blind_deboss";
export type BookSize = "8x10" | "10x10" | "11x8.5";

export interface BookConfiguration {
  material: BookCoverMaterial;
  color: BookCoverColor;
  foil: BookFoil;
  size: BookSize;
  title: string;
  subtitle: string;
  dedication: string;
  coverPlateId?: string;
  coverMediaId?: ID;
  storyIds: ID[];
  chapterOrder: string[];
  layout: "editorial" | "full_bleed" | "mixed";
  includeCaptions: boolean;
  includeTimeline: boolean;
  copies: number;
}

export type BoxFinish = "walnut" | "white_oak" | "ebonised_ash" | "linen_wrapped";
export type BoxEngraving = "none" | "name" | "name_and_years" | "custom";

export interface BoxConfiguration {
  finish: BoxFinish;
  engraving: BoxEngraving;
  engravingText: string;
  contents: {
    book: boolean;
    letterBundle: boolean;
    photoPrints: number; // 0, 12, 24
    archiveDrive: boolean; // convenience copy, never the only copy
    preservationGuide: boolean;
  };
  selectedLetterIds: ID[];
  selectedPhotoIds: ID[];
  intendedUse: "display" | "burial_concept";
}

export interface HeirloomConfiguration extends Timestamps {
  id: ID;
  kind: HeirloomKind;
  capsuleId: ID;
  name: string;
  book?: BookConfiguration;
  box?: BoxConfiguration;
  estimatedPages?: number;
  status: "editing" | "in_cart" | "ordered_demo";
}

export interface PrintProof {
  id: ID;
  version: number;
  createdAt: ISODateTime;
  status: "pending_review" | "approved_demo" | "changes_requested";
  notes?: string;
}

export interface PrintProject extends Timestamps {
  id: ID;
  configurationId: ID;
  orderId?: ID;
  proofs: PrintProof[];
  status: "awaiting_proof" | "proof_review" | "approved_demo" | "in_production_mock";
}

export interface FulfillmentJob {
  id: ID;
  orderId: ID;
  vendor: "not_connected";
  status: "not_submitted" | "submitted" | "in_production" | "shipped";
  createdAt: ISODateTime;
}

export interface Shipment {
  id: ID;
  orderId: ID;
  carrier: null;
  trackingNumber: null;
  status: "not_available_demo";
}

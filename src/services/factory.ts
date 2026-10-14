"use client";

import { appConfig } from "@/lib/config";
import type { Services } from "./contracts";
import { createProductionServices } from "./adapters/production";
import { mockCapsules } from "./mock/capsules";
import { mockBilling, mockFulfillment, mockGifts, mockOrders } from "./mock/commerce";
import { mockCommunications } from "./mock/communications";
import { mockExport } from "./mock/export";
import { mockFutureDelivery } from "./mock/future";
import { mockHeirlooms } from "./mock/heirlooms";
import { mockOperations } from "./mock/operations";
import { mockMedia, mockTranscription } from "./mock/media";
import { mockAccount, mockAnalytics, mockAuth, mockGeocoding, mockPreservation, mockSupport } from "./mock/misc";

/**
 * The single switch between the local demonstration and real providers.
 * Screens call `services()` — they never import an SDK directly.
 */
const demoServices: Services = {
  mode: "demo",
  auth: mockAuth,
  account: mockAccount,
  capsules: mockCapsules,
  media: mockMedia,
  communications: mockCommunications,
  transcription: mockTranscription,
  billing: mockBilling,
  orders: mockOrders,
  gifts: mockGifts,
  geocoding: mockGeocoding,
  export: mockExport,
  preservation: mockPreservation,
  futureDelivery: mockFutureDelivery,
  fulfillment: mockFulfillment,
  analytics: mockAnalytics,
  support: mockSupport,
  heirlooms: mockHeirlooms,
  operations: mockOperations,
};

let instance: Services | null = null;

export function services(): Services {
  instance ??= appConfig.mode === "production" ? createProductionServices() : demoServices;
  return instance;
}

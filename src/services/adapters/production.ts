import { notConfigured, type Services, type ServiceName } from "../contracts";

/**
 * Production adapters — intentionally unimplemented in Part One.
 * Every method returns a typed `not_configured` result instead of throwing,
 * so a misconfigured deployment degrades gracefully rather than going live
 * with fake behaviour. Part Two replaces these one service at a time.
 * See docs/INTEGRATIONS_PART_TWO.md.
 */

function unavailable<T extends object>(service: ServiceName): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      if (prop === "detectSupport") {
        return () => ({ mediaRecorder: false, getUserMedia: false, secureContext: false, mimeType: null });
      }
      if (prop === "tileStyle") return () => notConfigured(service, "Map tiles are not configured.");
      if (prop === "getCheckout") return () => notConfigured(service, "Billing is not configured.");
      if (prop === "toCartLine") return () => notConfigured(service, "Heirloom ordering is not configured.");
      if (prop === "track") return () => undefined;
      return async () => notConfigured(service, `The ${service} service is not configured for production yet.`);
    },
  });
}

export function createProductionServices(): Services {
  return {
    mode: "production",
    auth: unavailable("auth"),
    account: unavailable("account"),
    capsules: unavailable("capsules"),
    media: unavailable("media"),
    communications: unavailable("communications"),
    transcription: unavailable("transcription"),
    billing: unavailable("billing"),
    orders: unavailable("orders"),
    gifts: unavailable("gifts"),
    geocoding: unavailable("geocoding"),
    export: unavailable("export"),
    preservation: unavailable("preservation"),
    futureDelivery: unavailable("futureDelivery"),
    fulfillment: unavailable("fulfillment"),
    analytics: unavailable("analytics"),
    support: unavailable("support"),
    heirlooms: unavailable("heirlooms"),
    operations: unavailable("operations"),
    drafts: unavailable("drafts"),
  };
}

import type { FutureMessage, FutureMessageStatus } from "@/domain/models";
import { integrations as connected, type Integrations } from "@/config/integrations";

/**
 * Where a letter for the future really is, as separate, explicit steps. A step is only ever
 * marked reached when something that can actually reach it has done so, a letter saved on
 * this device is never shown as stored, scheduled or delivered.
 */
export type LadderStepKey = "drafted" | "saved_locally" | "stored" | "scheduled" | "attempted" | "delivered";

export type LadderState =
  /** This has happened. */
  | "done"
  /** Possible with the services connected, but it hasn't happened yet. */
  | "later"
  /** Needs a service that isn't connected, so it cannot happen in this build. */
  | "unavailable"
  /** It was tried and didn't work. */
  | "failed"
  /** Stopped on purpose. */
  | "canceled";

export interface LadderStep {
  key: LadderStepKey;
  label: string;
  state: LadderState;
  note: string;
}

const order: LadderStepKey[] = ["drafted", "saved_locally", "stored", "scheduled", "attempted", "delivered"];

/** How far along the production lifecycle each status has provably got. */
const reached: Record<FutureMessageStatus, LadderStepKey> = {
  draft: "saved_locally",
  prepared: "saved_locally",
  sealed_demo: "saved_locally",
  sealed: "stored",
  scheduled: "scheduled",
  delivery_attempted: "attempted",
  delivered: "delivered",
  failed: "attempted",
  canceled: "stored",
};

const labels: Record<LadderStepKey, string> = {
  drafted: "Draft created",
  saved_locally: "Saved on this device",
  stored: "Uploaded and securely stored",
  scheduled: "Scheduled with a delivery service",
  attempted: "Delivery attempted",
  delivered: "Delivered",
};

/** Which service each later step depends on. */
const needs: Partial<Record<LadderStepKey, keyof Integrations>> = {
  stored: "cloudStorage",
  scheduled: "futureDelivery",
  attempted: "futureDelivery",
  delivered: "futureDelivery",
};

const unavailableNote: Partial<Record<LadderStepKey, string>> = {
  stored: "Not in this preview, nothing leaves this device.",
  scheduled: "No delivery service is connected, so nothing is scheduled.",
  attempted: "Needs a delivery service.",
  delivered: "Needs a delivery service. We never promise a letter will arrive years from now.",
};

const doneNote: Record<LadderStepKey, string> = {
  drafted: "Written and kept.",
  saved_locally: "In this browser's storage. Download a copy to keep it safe.",
  stored: "Held in durable storage with backups.",
  scheduled: "Confirmed by the delivery service.",
  attempted: "The delivery service has tried to deliver it.",
  delivered: "The recipient has it.",
};

type LetterLike = Pick<FutureMessage, "status">;

export function deliveryLadder(message: LetterLike, services: Integrations = connected): LadderStep[] {
  const upTo = order.indexOf(reached[message.status]);
  return order.map((key, i) => {
    const service = needs[key];
    const label = key === "delivered" && message.status === "failed" ? "Delivery failed" : labels[key];
    if (i <= upTo) return { key, label, state: "done", note: doneNote[key] };
    if (key === "delivered" && message.status === "failed") return { key, label, state: "failed", note: "The delivery service couldn't deliver it. You'd be told here, with what to try next." };
    if (message.status === "canceled") return { key, label, state: "canceled", note: "Canceled, this letter won't be delivered." };
    if (service && !services[service]) return { key, label, state: "unavailable", note: unavailableNote[key] ?? "Not available yet." };
    return { key, label, state: "later", note: "Not yet." };
  });
}

/** One plain sentence for a letter's card: what's true now, and what isn't. */
export function ladderSummary(message: LetterLike, services: Integrations = connected) {
  const steps = deliveryLadder(message, services);
  const last = [...steps].reverse().find((s) => s.state === "done")!;
  const position = steps.indexOf(last) + 1;
  const missing = steps.filter((s) => s.state === "unavailable").map((s) => s.key);
  const caveat =
    missing.includes("stored") && missing.includes("scheduled")
      ? "Not uploaded, not scheduled."
      : missing.includes("scheduled")
        ? "Not scheduled."
        : message.status === "failed"
          ? "Delivery failed."
          : "";
  return { position, total: steps.length, current: last.label, caveat };
}

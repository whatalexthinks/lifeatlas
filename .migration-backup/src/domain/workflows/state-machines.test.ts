import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, futureMessageTransitions, memoryTransitions, orderTransitions, PROVIDER_ONLY_FUTURE_STATES, PROVIDER_ONLY_PAYMENT_STATES, paymentTransitions, preservationStateIsHonest, TransitionError } from "./state-machines";

describe("state machines", () => {
  it("routes contributions through review and keeps declined stories declined", () => {
    expect(canTransition(memoryTransitions, "submitted", "approved")).toBe(true);
    expect(canTransition(memoryTransitions, "declined", "approved")).toBe(false);
    expect(canTransition(memoryTransitions, "returned", "approved")).toBe(false);
  });
  it("lets an organizer publish their own draft directly", () => {
    expect(canTransition(memoryTransitions, "draft", "approved")).toBe(true);
  });
  it("never moves a canceled or refunded order", () => {
    expect(orderTransitions.canceled_mock).toEqual([]);
    expect(orderTransitions.refunded_mock).toEqual([]);
  });
  it("cannot ship before printing", () => {
    expect(canTransition(orderTransitions, "ready_for_fulfillment", "shipped_mock")).toBe(false);
  });
  it("throws a descriptive error on an illegal move", () => {
    expect(() => assertTransition("order", orderTransitions, "shipped_mock", "printing_mock")).toThrow(TransitionError);
  });
  it("keeps real-delivery and real-payment states unreachable from the demo", () => {
    for (const s of PROVIDER_ONLY_FUTURE_STATES) expect(canTransition(futureMessageTransitions, "sealed_demo", s)).toBe(false);
    for (const s of PROVIDER_ONLY_PAYMENT_STATES) expect(canTransition(paymentTransitions, "mock_uncharged", s)).toBe(false);
  });
  it("refuses a green preservation badge without evidence", () => {
    expect(preservationStateIsHonest("verified", undefined)).toBe(false);
    expect(preservationStateIsHonest("verified", { checkedAt: "2026-10-13", provider: "s3" })).toBe(true);
    expect(preservationStateIsHonest("unconfigured", undefined)).toBe(true);
  });
});

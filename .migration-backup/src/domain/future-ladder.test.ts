import { describe, expect, it } from "vitest";
import type { FutureMessageStatus } from "@/domain/models";
import type { Integrations } from "@/config/integrations";
import { deliveryLadder, ladderSummary } from "./future-ladder";

const none: Integrations = { accounts: false, cloudStorage: false, email: false, payments: false, futureDelivery: false, printFulfillment: false };
const all: Integrations = { accounts: true, cloudStorage: true, email: true, payments: true, futureDelivery: true, printFulfillment: true };
const states = (status: FutureMessageStatus, s = none) => deliveryLadder({ status }, s).map((x) => [x.key, x.state]);

describe("future delivery ladder", () => {
  it("lists the steps people need to tell apart, in order", () => {
    expect(deliveryLadder({ status: "draft" }, none).map((s) => s.label)).toEqual([
      "Draft created",
      "Saved on this device",
      "Uploaded and securely stored",
      "Scheduled with a delivery service",
      "Delivery attempted",
      "Delivered",
    ]);
  });

  it("never shows a local letter as stored or scheduled when no service is connected", () => {
    for (const status of ["draft", "prepared", "sealed_demo"] as const) {
      expect(states(status)).toEqual([
        ["drafted", "done"],
        ["saved_locally", "done"],
        ["stored", "unavailable"],
        ["scheduled", "unavailable"],
        ["attempted", "unavailable"],
        ["delivered", "unavailable"],
      ]);
    }
    expect(ladderSummary({ status: "sealed_demo" }, none)).toEqual({ position: 2, total: 6, current: "Saved on this device", caveat: "Not uploaded, not scheduled." });
  });

  it("with real services, later steps are possible but not claimed until they happen", () => {
    expect(states("draft", all).slice(2)).toEqual([
      ["stored", "later"],
      ["scheduled", "later"],
      ["attempted", "later"],
      ["delivered", "later"],
    ]);
    expect(states("scheduled", all).map(([, s]) => s)).toEqual(["done", "done", "done", "done", "later", "later"]);
    expect(ladderSummary({ status: "scheduled" }, all).current).toBe("Scheduled with a delivery service");
  });

  it("shows a failed delivery as failed, never as delivered", () => {
    const steps = deliveryLadder({ status: "failed" }, all);
    expect(steps.at(-1)).toMatchObject({ label: "Delivery failed", state: "failed" });
    expect(steps.at(-2)?.state).toBe("done");
    expect(ladderSummary({ status: "failed" }, all).caveat).toBe("Delivery failed.");
  });

  it("marks the remaining steps of a canceled letter as canceled", () => {
    expect(states("canceled", all).map(([, s]) => s)).toEqual(["done", "done", "done", "canceled", "canceled", "canceled"]);
  });
});

"use client";

import { canActivate } from "@/domain/commerce/promotions";
import { fail, ok, type OperationsService } from "../contracts";
import { mockCapsules } from "./capsules";
import { mockFulfillment } from "./commerce";
import { actorName, db, latency, pushNotification, store } from "./shared";

export const mockOperations: OperationsService = {
  async setPromotionStatus(id, status) {
    const p = db().promotions.find((x) => x.id === id);
    if (!p) return fail("not_found", "Promotion not found.");
    if (status === "active") {
      const gate = canActivate(p);
      if (!gate.ok) return fail("forbidden", gate.reason);
      if (p.endsAt && new Date(p.endsAt) < new Date()) return fail("conflict", "This promotion's end date has passed. Set a new window first.");
    }
    store().mutate(
      (d) => {
        d.promotions.find((x) => x.id === id)!.status = status;
      },
      { actor: actorName(), action: `promotion.${status}`, target: id, detail: p.name },
    );
    return ok({ ...db().promotions.find((x) => x.id === id)! });
  },

  async recordLegalReview(id, reviewedBy, notes) {
    const p = db().promotions.find((x) => x.id === id);
    if (!p) return fail("not_found", "Promotion not found.");
    if (!reviewedBy.trim()) return fail("validation", "Record who completed the review.");
    store().mutate(
      (d) => {
        d.promotions.find((x) => x.id === id)!.legalReview = { reviewedBy: reviewedBy.trim(), approvedAt: new Date().toISOString(), notes: notes?.trim() || undefined };
      },
      { actor: actorName(), action: "promotion.legal_review_recorded", target: id, detail: `${p.name}, demo record, not legal advice` },
    );
    return ok({ ...db().promotions.find((x) => x.id === id)! });
  },

  async updateProduct(id, patch) {
    const product = db().catalog.find((p) => p.id === id);
    if (!product) return fail("not_found", "Product not found.");
    if (patch.amount !== undefined && (!Number.isInteger(patch.amount) || patch.amount < 0 || patch.amount > 1_000_000)) return fail("validation", "Prices are whole cents between $0 and $10,000.");
    if (patch.availability === "available_demo" && product.kind === "physical" && product.id === "legacy_capsule") return fail("forbidden", "The Legacy Capsule can't be offered until it is independently tested.");
    await latency(120);
    store().mutate(
      (d) => {
        const p = d.catalog.find((x) => x.id === id)!;
        if (patch.amount !== undefined) p.price.amount = patch.amount;
        if (patch.availability) p.availability = patch.availability;
        if (patch.note !== undefined) p.note = patch.note || undefined;
      },
      { actor: actorName(), action: "catalog.updated_demo", target: id, detail: JSON.stringify(patch) },
    );
    return ok(db().catalog.find((p) => p.id === id)!);
  },

  async simulate(event) {
    const d = db();
    switch (event) {
      case "contribution": {
        const r = await mockCapsules.createMemory({
          capsuleId: "cap_margaret",
          title: "The radio in the workshop",
          narrative: "Grandpa kept a radio on the shelf above the wheel, always tuned to the ball game. Grandma pretended to hate it and knew every player's name.",
          quote: "",
          date: { precision: "decade", decade: 1990 },
          chapter: "work",
          privacy: "family",
          tags: ["simulated"],
          peopleIds: [],
          consent: { print: true, export: true, share: false },
          photoIds: [],
          attribution: { personId: "per_daniel", displayName: "Daniel Ellis", relationship: "Son", via: "invitation" },
          status: "submitted",
        });
        return r.status === "ok" ? ok("Daniel's story is waiting in review.") : fail("unknown", "Couldn't simulate the contribution.");
      }
      case "invitation_opened": {
        const inv = d.invitations.find((i) => i.status === "prepared" || i.status === "simulated_sent");
        if (!inv) return fail("not_found", "No waiting invitations to open.");
        pushNotification({ kind: "invitation", title: `${inv.recipientName} opened their invitation`, body: "Simulated, no one was contacted.", href: "/app/invitations" });
        store().mutate(() => undefined, { actor: "Simulator", action: "invitation.opened_simulated", target: inv.id });
        return ok(`${inv.recipientName} opened their invitation (simulated).`);
      }
      case "proof_ready": {
        const project = d.printProjects[0];
        if (!project) return fail("not_found", "No print projects yet, place a demo book order first.");
        const r = await mockFulfillment.createProof(project.configurationId);
        if (r.status !== "ok") return fail("unknown", "Couldn't create a proof.");
        pushNotification({ kind: "order", title: `Proof v${r.data.version} ready (demo)`, body: "Nothing will print until you approve, and printing isn't connected.", href: "/app/orders" });
        return ok(`Proof v${r.data.version} is ready to review.`);
      }
      case "storage_warning": {
        pushNotification({ kind: "system", title: "This browser is running low on space", body: "Simulated. Download an archive from Preservation before adding long recordings.", href: "/app/preservation" });
        store().mutate(() => undefined, { actor: actorName(), action: "storage.warning_simulated" });
        return ok("A low-storage notice was added.");
      }
    }
  },
};

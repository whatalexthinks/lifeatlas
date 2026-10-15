"use client";

import type { FutureMessage } from "@/domain/models";
import { futureMessageSchema } from "@/domain/schemas";
import { canTransition, futureMessageTransitions, PROVIDER_ONLY_FUTURE_STATES } from "@/domain/workflows/state-machines";
import { sha256Hex, token as makeToken, uid } from "@/lib/utils";
import { fail, notConfigured, ok, type FutureDeliveryProvider } from "../contracts";
import { actorName, db, latency, store } from "./shared";

export const mockFutureDelivery: FutureDeliveryProvider = {
  async saveDraft(values, opts) {
    const parsed = futureMessageSchema.safeParse(values);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the letter.");
    const v = parsed.data;
    await latency(180);
    const now = new Date().toISOString();
    const existing = opts.id ? db().futureMessages.find((m) => m.id === opts.id) : undefined;
    if (existing && existing.status === "sealed_demo") return fail("conflict", "Unseal this letter before editing it.");
    const base: Omit<FutureMessage, "id" | "token" | "createdAt" | "history" | "status" | "isExample"> = {
      capsuleId: opts.capsuleId,
      authorName: opts.authorName,
      title: v.title,
      dedication: v.dedication || undefined,
      body: v.body,
      format: !v.body && opts.attachmentIds.length ? "voice" : opts.attachmentIds.length || opts.memoryIds?.length ? "letter_with_media" : "letter",
      attachmentIds: opts.attachmentIds,
      memoryIds: opts.memoryIds?.length ? opts.memoryIds : undefined,
      recipient: {
        name: v.recipientName,
        relationship: v.recipientRelationship,
        contact: v.recipientContact || undefined,
        contactStatus: v.recipientContact ? "unverified" : "not_provided",
        birthYear: opts.recipientBirthYear,
      },
      backupRecipient: v.backupName ? { name: v.backupName, relationship: "Backup recipient", contactStatus: "not_provided" } : undefined,
      release: {
        kind: v.releaseKind,
        date: v.releaseDate,
        intervalYears: v.releaseKind === "interval" ? v.intervalYears : undefined,
        year: v.releaseKind === "year" ? v.releaseYear : undefined,
        milestone: v.releaseKind === "milestone" ? v.milestone : undefined,
        milestoneNote: v.milestoneNote || undefined,
        requiresReconfirmationEveryYears: 2,
      },
      restrictions: { recipientOnly: v.recipientOnly, allowFamilyAfterOpening: v.allowFamilyAfterOpening, personalNote: v.personalNote || undefined },
      updatedAt: now,
    };
    let id = existing?.id;
    store().mutate(
      (d) => {
        if (existing) {
          const m = d.futureMessages.find((x) => x.id === existing.id)!;
          Object.assign(m, base);
        } else {
          id = uid("fm");
          d.futureMessages.unshift({
            ...base,
            id,
            token: makeToken(v.recipientName.split(" ")[0]),
            status: "draft",
            isExample: false,
            history: [{ status: "draft", at: now }],
            createdAt: now,
          });
        }
      },
      { actor: actorName(), action: existing ? "future_message.updated" : "future_message.drafted", target: id },
    );
    store().track("future_message_saved", { releaseKind: v.releaseKind });
    return ok({ ...db().futureMessages.find((m) => m.id === id)! });
  },

  async transition(id, to) {
    const m = db().futureMessages.find((x) => x.id === id);
    if (!m) return fail("not_found", "Letter not found.");
    if (m.isExample) return fail("forbidden", "Example letters can't be changed.");
    if (PROVIDER_ONLY_FUTURE_STATES.includes(to)) return notConfigured("futureDelivery", "Scheduled long-term delivery isn't available yet. Your letter stays safely as a draft on this device.");
    if (!canTransition(futureMessageTransitions, m.status, to)) return fail("conflict", `A ${m.status.replace("_", " ")} letter can't move to ${to.replace("_", " ")}.`);
    await latency();
    store().mutate(
      (d) => {
        const x = d.futureMessages.find((y) => y.id === id)!;
        x.status = to;
        x.updatedAt = new Date().toISOString();
        if (to === "draft") {
          x.sealedAt = undefined;
          x.snapshotHash = undefined;
        }
        x.history.push({ status: to, at: x.updatedAt, note: to === "draft" && m.status === "sealed_demo" ? "Unsealed in demo" : undefined });
      },
      { actor: actorName(), action: `future_message.${to}`, target: id },
    );
    return ok({ ...db().futureMessages.find((x) => x.id === id)! });
  },

  async sealDemo(id) {
    const m = db().futureMessages.find((x) => x.id === id);
    if (!m) return fail("not_found", "Letter not found.");
    if (m.status === "draft") {
      const r = await this.transition(id, "prepared");
      if (r.status !== "ok") return r;
    }
    const cur = db().futureMessages.find((x) => x.id === id)!;
    if (!canTransition(futureMessageTransitions, cur.status, "sealed_demo")) return fail("conflict", "This letter can't be sealed right now.");
    const snapshot = JSON.stringify({ title: cur.title, dedication: cur.dedication, body: cur.body, recipient: cur.recipient.name, release: cur.release, attachments: cur.attachmentIds, ...(cur.memoryIds?.length ? { memories: cur.memoryIds } : {}) });
    const hash = await sha256Hex(snapshot);
    await latency(400);
    store().mutate(
      (d) => {
        const x = d.futureMessages.find((y) => y.id === id)!;
        x.status = "sealed_demo";
        x.snapshotHash = hash;
        x.sealedAt = new Date().toISOString();
        x.updatedAt = x.sealedAt;
        x.history.push({ status: "sealed_demo", at: x.sealedAt, note: "Demo seal, reversible. Not scheduled for delivery." });
      },
      { actor: actorName(), action: "future_message.sealed_demo", target: id, detail: hash.slice(0, 12) },
    );
    return ok({ ...db().futureMessages.find((x) => x.id === id)! });
  },

  async schedule() {
    return notConfigured("futureDelivery", "Long-term delivery is coming later. Nothing is scheduled, and no prepaid delivery plan is sold in this preview.");
  },

  async remove(id) {
    const m = db().futureMessages.find((x) => x.id === id);
    if (!m) return fail("not_found", "Letter not found.");
    if (m.isExample) return fail("forbidden", "Example letters can't be deleted.");
    store().mutate((d) => {
      d.futureMessages = d.futureMessages.filter((x) => x.id !== id);
    }, { actor: actorName(), action: "future_message.deleted", target: id });
    return ok(null);
  },

  async resolveToken(tok) {
    await latency(120);
    const m = db().futureMessages.find((x) => x.token === tok);
    return m ? ok({ ...m }) : fail("not_found", "We couldn't find this letter.");
  },
};

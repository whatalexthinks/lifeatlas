"use client";

import { isPrintEligible } from "@/domain/policies/permissions";
import { boxBlockers } from "@/domain/commerce/fulfillment";
import type { CartLine, HeirloomConfiguration } from "@/domain/models";
import { estimateBookPages, quoteBook, quoteBox } from "@/domain/commerce/pricing";
import { uid } from "@/lib/utils";
import { fail, ok, type HeirloomRepository } from "../contracts";
import { flushSave } from "@/store/demo-store";
import { actorName, db, latency, store } from "./shared";

function bookPages(h: HeirloomConfiguration) {
  if (!h.book) return 0;
  const memories = db().memories.filter((m) => h.book!.storyIds.includes(m.id));
  const photos = memories.reduce((n, m) => n + m.photoIds.length, 0);
  return estimateBookPages(memories.length, photos, h.book.includeTimeline);
}

export const mockHeirlooms: HeirloomRepository = {
  async save(input) {
    if (!input.name.trim()) return fail("validation", "Give this heirloom a name.");
    if (input.kind === "book") {
      if (!input.book) return fail("validation", "Book details are missing.");
      if (!input.book.title.trim()) return fail("validation", "The book needs a title.");
      if (input.book.storyIds.length < 3) return fail("validation", "Choose at least three stories for a book.");
      if (input.book.copies < 1 || input.book.copies > 25) return fail("validation", "Copies must be between 1 and 25.");
    }
    if (input.kind === "keepsake_box") {
      if (!input.box) return fail("validation", "Box details are missing.");
      if (input.box.intendedUse === "burial_concept") return fail("validation", "Burial-rated capsules aren't available. Choose the display box.");
      if (input.box.engraving !== "none" && !input.box.engravingText.trim()) return fail("validation", "Add the words to engrave, or choose no engraving.");
      if (input.box.engravingText.length > 48) return fail("validation", "Engraving is limited to 48 characters.");
    }
    if (input.kind === "legacy_capsule_concept") return fail("unsupported", "The Legacy Capsule is a concept and can't be configured yet.");
    await latency(160);
    const now = new Date().toISOString();
    const existing = input.id ? db().heirlooms.find((h) => h.id === input.id) : undefined;
    const config: HeirloomConfiguration = {
      id: existing?.id ?? uid("hl"),
      kind: input.kind,
      capsuleId: input.capsuleId,
      name: input.name.trim(),
      book: input.book ? structuredClone(input.book) : undefined,
      box: input.box ? structuredClone(input.box) : undefined,
      status: existing && existing.status === "ordered_demo" ? "editing" : (existing?.status ?? "editing"),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    config.estimatedPages = config.kind === "book" ? bookPages(config) : undefined;
    store().mutate(
      (d) => {
        const i = d.heirlooms.findIndex((h) => h.id === config.id);
        if (i >= 0) d.heirlooms[i] = config;
        else d.heirlooms.unshift(config);
      },
      { actor: actorName(), action: "heirloom.saved", target: config.id, detail: config.name },
    );
    store().track("heirloom_configured", { kind: config.kind });
    // Proofs open in a new tab, which reads from storage, write now, not after the debounce.
    await flushSave().catch(() => undefined);
    return ok(config);
  },

  async remove(id) {
    const h = db().heirlooms.find((x) => x.id === id);
    if (!h) return fail("not_found", "Heirloom not found.");
    if (h.status === "ordered_demo") return fail("conflict", "This heirloom is part of a demo order. Cancel the order first.");
    store().mutate((d) => {
      d.heirlooms = d.heirlooms.filter((x) => x.id !== id);
    });
    return ok(null);
  },

  toCartLine(id) {
    const h = db().heirlooms.find((x) => x.id === id);
    if (!h) return fail("not_found", "Heirloom not found.");
    const catalog = db().catalog;
    const bookProduct = catalog.find((p) => p.id === "book")!;
    if (h.kind === "book" && h.book) {
      const q = quoteBook(bookProduct.price.amount, h.book, bookPages(h));
      const line: CartLine = { id: uid("cl"), productId: "book", quantity: h.book.copies, configurationId: h.id, extrasAmount: q.extras, label: `${h.book.title}, printed book` };
      return ok(line);
    }
    if (h.kind === "keepsake_box" && h.box) {
      // Nothing personal is ordered before the content it's made from exists.
      const d = db();
      const blockers = boxBlockers(h.box, {
        printableStories: d.memories.filter((m) => m.capsuleId === h.capsuleId && isPrintEligible(m)).length,
        printablePhotos: d.media.filter((m) => m.capsuleId === h.capsuleId && m.kind === "image" && m.consent.print !== false).length,
        letters: h.box.selectedLetterIds.length,
      });
      if (blockers.length) return fail("validation", blockers[0]);
      const boxProduct = catalog.find((p) => p.id === "keepsake_box")!;
      const q = quoteBox(boxProduct.price.amount, h.box, bookProduct.price.amount);
      const line: CartLine = { id: uid("cl"), productId: "keepsake_box", quantity: 1, configurationId: h.id, extrasAmount: q.extras, label: `${h.name}, keepsake box` };
      return ok(line);
    }
    return fail("unsupported", "This heirloom can't be ordered.");
  },
};

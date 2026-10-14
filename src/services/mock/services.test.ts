import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "@/store/demo-store";
import { quoteBook, estimateBookPages } from "@/domain/commerce/pricing";
import { selectExportContent } from "./export";
import { services } from "../factory";
import { seed } from "@/tests/fixtures";
import type { ExportOptions } from "@/domain/models";

const db = () => useDemoStore.getState().db;

beforeEach(() => {
  useDemoStore.setState({ db: seed(), hydrated: true });
});

describe("checkout never charges", () => {
  it("creates an uncharged order, a demo invoice and a proof for a book", async () => {
    const s = services();
    const book = db().heirlooms.find((h) => h.kind === "book")!;
    await s.heirlooms.save({ id: book.id, kind: "book", capsuleId: book.capsuleId, name: book.name, book: book.book });
    const line = s.heirlooms.toCartLine(book.id);
    expect(line.status).toBe("ok");
    if (line.status !== "ok") return;
    const c = await s.billing.createCheckout([line.data], "self");
    expect(c.status).toBe("ok");
    if (c.status !== "ok") return;
    const shipping = { name: "Sarah Ellis", line1: "12 Sample St", city: "Portland", region: "ME", postalCode: "04101", country: "United States" };
    const o = await s.billing.completeMockCheckout(c.data.checkoutId, { name: "Sarah Ellis", email: "sarah@example.com", shipping });
    expect(o.status).toBe("ok");
    if (o.status !== "ok") return;
    expect(o.data.payment).toBe("mock_uncharged");
    expect(o.data.status).toBe("proof_required");
    expect(o.data.shippingEstimate).toBeNull();
    expect(db().invoices[0]).toMatchObject({ orderId: o.data.id, status: "demo_uncharged" });
    expect(db().printProjects.some((p) => p.orderId === o.data.id)).toBe(true);
    // Completing twice returns the same order instead of charging again.
    const again = await s.billing.completeMockCheckout(c.data.checkoutId, { name: "Sarah Ellis", email: "sarah@example.com", shipping });
    expect(again.status === "ok" && again.data.id).toBe(o.data.id);
  });
  it("refuses an empty bag", async () => {
    expect((await services().billing.createCheckout([], "self")).status).toBe("error");
  });
  it("reports payment methods as not configured rather than faking a card", async () => {
    expect((await services().billing.listPaymentMethods()).status).toBe("not_configured");
  });
});

describe("heirlooms", () => {
  const book = () => structuredClone(db().heirlooms.find((h) => h.kind === "book")!.book!);
  it("needs a title and at least three stories", async () => {
    const s = services().heirlooms;
    expect((await s.save({ kind: "book", capsuleId: "cap_margaret", name: "x", book: { ...book(), title: " " } })).status).toBe("error");
    expect((await s.save({ kind: "book", capsuleId: "cap_margaret", name: "x", book: { ...book(), storyIds: ["mem_bread"] } })).status).toBe("error");
  });
  it("prices a saved book exactly like the pricing module", async () => {
    const s = services().heirlooms;
    const r = await s.save({ kind: "book", capsuleId: "cap_margaret", name: "Test book", book: { ...book(), copies: 3, material: "soft_touch" } });
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    const line = s.toCartLine(r.data.id);
    if (line.status !== "ok") throw new Error("no line");
    const memories = db().memories.filter((m) => r.data.book!.storyIds.includes(m.id));
    const pages = estimateBookPages(memories.length, memories.reduce((n, m) => n + m.photoIds.length, 0), r.data.book!.includeTimeline);
    const q = quoteBook(db().catalog.find((p) => p.id === "book")!.price.amount, r.data.book!, pages);
    expect(line.data.quantity).toBe(3);
    expect(line.data.extrasAmount).toBe(q.extras);
  });
  it("won't configure a burial capsule", async () => {
    const r = await services().heirlooms.save({
      kind: "keepsake_box",
      capsuleId: "cap_margaret",
      name: "Box",
      box: { finish: "walnut", engraving: "none", engravingText: "", contents: { book: false, letterBundle: false, photoPrints: 0, archiveDrive: false, preservationGuide: true }, selectedLetterIds: [], selectedPhotoIds: [], intendedUse: "burial_concept" },
    });
    expect(r.status).toBe("error");
  });
  it("won't remove a design that's part of an order", async () => {
    const ordered = db().heirlooms.find((h) => h.status === "ordered_demo")!;
    expect((await services().heirlooms.remove(ordered.id)).status).toBe("error");
  });
});

describe("family roles", () => {
  it("never changes the owner", async () => {
    const r = await services().capsules.setMemberRole("cap_margaret", "per_sarah", "viewer");
    expect(r.status).toBe("error");
  });
  it("only lets the subject be the storyteller", async () => {
    expect((await services().capsules.setMemberRole("cap_margaret", "per_emma", "storyteller")).status).toBe("error");
  });
  it("grants, changes and removes a role", async () => {
    const s = services().capsules;
    await s.setMemberRole("cap_thomas", "per_june", "viewer");
    const active = () => db().memberships.find((m) => m.capsuleId === "cap_thomas" && m.personId === "per_june" && m.status === "active");
    expect(active()?.role).toBe("viewer");
    await s.setMemberRole("cap_thomas", "per_june", "contributor");
    expect(active()?.role).toBe("contributor");
    await s.setMemberRole("cap_thomas", "per_june", null);
    expect(active()).toBeUndefined();
    expect(db().auditEvents[0].action).toBe("membership.removed");
  });
  it("adds someone new to the family when they open their invitation", async () => {
    const c = services().communications;
    const inv = await c.prepareInvitation("cap_margaret", { recipientName: "Rosa Delgado", relationship: "Neighbour", recipientContact: "", role: "contributor", mode: "open", questionIds: [], message: "", channel: "link" });
    if (inv.status !== "ok") throw new Error(inv.status === "error" ? inv.message : "not prepared");
    expect((await c.accept(inv.data.token)).status).toBe("ok");
    const personId = db().invitations.find((i) => i.id === inv.data.id)!.personId!;
    expect(db().people.find((p) => p.id === personId)).toMatchObject({ displayName: "Rosa Delgado", givenName: "Rosa", familyName: "Delgado" });
    expect(db().memberships.filter((m) => m.personId === personId && m.status === "active").map((m) => m.role)).toEqual(["contributor"]);
    // Opening it again doesn't add them twice.
    await c.accept(inv.data.token);
    expect(db().people.filter((p) => p.displayName === "Rosa Delgado")).toHaveLength(1);
  });
  it("previews anyone using their current roles, and switches back", async () => {
    const a = services().auth;
    await services().capsules.setMemberRole("cap_thomas", "per_june", "viewer");
    const r = await a.previewAsPerson("per_june");
    expect(r.status === "ok" && r.data.persona).toMatchObject({ name: "June Whitaker", personId: "per_june", kind: "contributor" });
    expect(db().personas.filter((p) => p.id === "persona_preview")).toHaveLength(1);
    // A person who already has a demo identity uses it.
    const e = await a.previewAsPerson("per_emma");
    expect(e.status === "ok" && e.data.personaId).toBe("persona_emma");
    await a.switchPersona("persona_sarah");
    expect(db().activePersonaId).toBe("persona_sarah");
  });
});

describe("contributor resubmission", () => {
  it("a returned story can be edited and sent back to review", async () => {
    const s = services().capsules;
    const id = db().memories.find((m) => m.attribution.invitationId === "inv_emma")!.id;
    await s.transitionMemory(id, "returned", "Roughly what year?", "Sarah Ellis");
    expect(db().memories.find((m) => m.id === id)!.reviewNote).toBe("Roughly what year?");
    await s.updateMemory(id, { narrative: "It was 2009." }, "Emma Ellis");
    const r = await s.transitionMemory(id, "submitted", undefined, "Emma Ellis");
    expect(r.status === "ok" && r.data).toMatchObject({ status: "submitted", narrative: "It was 2009." });
    expect(db().contributions.find((c) => c.memoryId === id)!.reviews[0]).toMatchObject({ decision: "returned", note: "Roughly what year?" });
  });
});

describe("operations", () => {
  it("stores prices as whole cents only", async () => {
    const s = services().operations;
    expect((await s.updateProduct("personal", { amount: 39.5 })).status).toBe("error");
    const r = await s.updateProduct("personal", { amount: 4400 });
    expect(r.status === "ok" && r.data.price.amount).toBe(4400);
  });
  it("can't put the untested Legacy Capsule on sale", async () => {
    expect((await services().operations.updateProduct("legacy_capsule", { availability: "available_demo" })).status).toBe("error");
  });
  it("simulates a contribution that lands in review", async () => {
    const before = db().memories.filter((m) => m.status === "submitted").length;
    expect((await services().operations.simulate("contribution")).status).toBe("ok");
    expect(db().memories.filter((m) => m.status === "submitted").length).toBe(before + 1);
  });
});

describe("letters and preservation", () => {
  it("seals with a real content fingerprint and never schedules delivery", async () => {
    const s = services().futureDelivery;
    const draft = db().futureMessages.find((m) => m.status === "draft" && !m.isExample)!;
    const r = await s.sealDemo(draft.id);
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
    expect((await s.schedule(draft.id)).status).toBe("not_configured");
  });
  it("is honest that backups aren't connected", async () => {
    const r = await services().preservation.status("cap_margaret");
    expect(r.status === "ok" && r.data.primary).toBe("unconfigured");
    expect((await services().preservation.runRestoreTest("cap_margaret")).status).toBe("not_configured");
  });
  it("keeps private stories out of exports unless asked", () => {
    const base: ExportOptions = { includePhotos: true, includeAudio: true, includePrivate: false, includeDrafts: false, includeSamplePlates: true };
    const d = db();
    const priv = d.memories.find((m) => m.capsuleId === "cap_margaret" && m.privacy === "private" && !m.deletedAt);
    const without = selectExportContent(d, "cap_margaret", base);
    const withPrivate = selectExportContent(d, "cap_margaret", { ...base, includePrivate: true, includeDrafts: true });
    if (priv) expect(without.memories.some((m) => m.id === priv.id)).toBe(false);
    expect(withPrivate.memories.length).toBeGreaterThanOrEqual(without.memories.length);
  });
});

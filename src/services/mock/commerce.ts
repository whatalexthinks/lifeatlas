"use client";

import type { CheckoutSession, Gift, Order, OrderItem, OrderStatus } from "@/domain/models";
import { giftSchema } from "@/domain/schemas";
import { quoteCart } from "@/domain/commerce/pricing";
import { canTransition, orderTransitions } from "@/domain/workflows/state-machines";
import { token as makeToken, uid } from "@/lib/utils";
import { fail, notConfigured, ok, type BillingProvider, type FulfillmentProvider, type GiftService, type OrderService } from "../contracts";
import { actorName, db, latency, pushNotification, store } from "./shared";

let orderSeq = 1040;

function nextOrderNumber() {
  const existing = db().orders.map((o) => Number(o.number.split("-").pop())).filter(Number.isFinite);
  orderSeq = Math.max(orderSeq, ...existing) + 1;
  return `LA-DEMO-${orderSeq}`;
}

export const mockBilling: BillingProvider = {
  async createCheckout(lines, purpose) {
    if (!lines.length) return fail("validation", "Your bag is empty.");
    try {
      quoteCart(lines, db().catalog);
    } catch (e) {
      return fail("validation", e instanceof Error ? e.message : "Invalid order");
    }
    await latency(180);
    const session: CheckoutSession = { id: uid("chk"), lines: structuredClone(lines), purpose, status: "open", createdAt: new Date().toISOString() };
    store().mutate((d) => {
      d.checkouts.unshift(session);
      if (d.checkouts.length > 30) d.checkouts.length = 30;
    });
    store().track("checkout_started", { lines: lines.length, purpose });
    return ok({ checkoutId: session.id, url: `/checkout/preview?session=${session.id}` });
  },

  getCheckout(checkoutId) {
    const s = db().checkouts.find((c) => c.id === checkoutId);
    return s ? ok(s) : fail("not_found", "This checkout preview has expired. Start again from your bag.");
  },

  async completeMockCheckout(checkoutId, customer) {
    const session = db().checkouts.find((c) => c.id === checkoutId);
    if (!session) return fail("not_found", "This checkout preview has expired.");
    if (session.status !== "open") {
      const existing = db().orders.find((o) => o.id === session.orderId);
      return existing ? ok(existing) : fail("conflict", "This checkout was already completed.");
    }
    const catalog = db().catalog;
    const quote = quoteCart(session.lines, catalog);
    await latency(650);
    const now = new Date().toISOString();
    const items: OrderItem[] = session.lines.map((l) => {
      const p = catalog.find((c) => c.id === l.productId)!;
      return { id: uid("oi"), productId: l.productId, name: l.label ?? p.name, quantity: l.quantity, unitAmount: p.price.amount, extrasAmount: l.extrasAmount, configurationId: l.configurationId, giftId: l.giftId };
    });
    const hasPhysical = quote.hasPhysical;
    const giftLine = session.lines.find((l) => l.giftId);
    const kind: Order["kind"] = giftLine ? "gift" : hasPhysical ? (items.some((i) => i.productId === "keepsake_box") ? "capsule" : "print") : "digital";
    const status: OrderStatus = hasPhysical ? "proof_required" : "paid_mock";
    const order: Order = {
      id: uid("ord"),
      number: nextOrderNumber(),
      kind,
      items,
      subtotal: quote.subtotal,
      shippingEstimate: null,
      taxEstimate: null,
      total: quote.total,
      currency: "USD",
      status,
      payment: "mock_uncharged",
      customerName: customer.name,
      shippingTo: customer.shipping,
      history: [
        { status: "preview", at: session.createdAt },
        { status: "paid_mock", at: now, note: "Demo checkout — no payment was taken" },
        ...(hasPhysical ? [{ status: "proof_required" as const, at: now, note: "Proof preview available — nothing will be printed" }] : []),
      ],
      isSample: false,
      createdAt: session.createdAt,
      updatedAt: now,
    };
    store().mutate(
      (d) => {
        d.orders.unshift(order);
        d.invoices.unshift({ id: uid("invc"), orderId: order.id, number: `DEMO-INV-${String(d.invoices.length + 1).padStart(4, "0")}`, issuedAt: now, amount: order.total, status: "demo_uncharged" });
        const s = d.checkouts.find((c) => c.id === checkoutId)!;
        s.status = "completed";
        s.orderId = order.id;
        d.cart.lines = [];
        for (const it of items) {
          if (it.giftId) {
            const g = d.gifts.find((x) => x.id === it.giftId);
            if (g) {
              g.status = "ready_demo";
              g.orderId = order.id;
              g.updatedAt = now;
            }
          }
          if (it.configurationId) {
            const h = d.heirlooms.find((x) => x.id === it.configurationId);
            if (h) {
              h.status = "ordered_demo";
              h.updatedAt = now;
              d.printProjects.unshift({
                id: uid("pp"),
                configurationId: h.id,
                orderId: order.id,
                proofs: [{ id: uid("proof"), version: 1, createdAt: now, status: "pending_review" }],
                status: "proof_review",
                createdAt: now,
                updatedAt: now,
              });
            }
          }
          if (it.productId === "living") {
            const sub = d.subscriptions.find((x) => x.productId === "living");
            if (sub) {
              sub.status = "preview_active";
              sub.startedAt = now;
              sub.renewsOn = new Date(Date.now() + 365 * 86400_000).toISOString();
            }
          }
        }
      },
      { actor: customer.name, action: "order.mock_completed", target: order.id, detail: `${order.number} — no charge` },
    );
    store().track("checkout_completed_mock", { total: order.total, kind });
    pushNotification({ kind: "order", title: `Demo order ${order.number}`, body: "Preview only — no payment was charged and nothing will ship.", href: `/app/orders#${order.id}` });
    return ok(order);
  },

  async cancelCheckout(checkoutId) {
    store().mutate((d) => {
      const s = d.checkouts.find((c) => c.id === checkoutId);
      if (s && s.status === "open") s.status = "canceled";
    });
    return ok(null);
  },

  async verifyWebhook() {
    return notConfigured("billing", "Payment webhooks are not connected in this preview.");
  },

  async listPaymentMethods() {
    return notConfigured("billing", "Saved payment methods will be managed by the payment provider in a later release. No card details are collected here.");
  },

  async startLivingArchivePreview() {
    store().mutate((d) => {
      const sub = d.subscriptions.find((x) => x.productId === "living");
      if (sub) {
        sub.status = "preview_active";
        sub.startedAt = new Date().toISOString();
        sub.renewsOn = new Date(Date.now() + 365 * 86400_000).toISOString();
      }
    }, { actor: actorName(), action: "subscription.preview_started" });
    return ok(null);
  },

  async cancelLivingArchivePreview() {
    store().mutate((d) => {
      const sub = d.subscriptions.find((x) => x.productId === "living");
      if (sub) sub.status = "preview_canceled";
    }, { actor: actorName(), action: "subscription.preview_canceled" });
    return ok(null);
  },
};

const lifecycle: Record<Order["kind"], OrderStatus[]> = {
  digital: ["paid_mock"],
  gift: ["paid_mock"],
  print: ["paid_mock", "proof_required", "ready_for_fulfillment", "printing_mock", "shipped_mock"],
  capsule: ["paid_mock", "proof_required", "ready_for_fulfillment", "printing_mock", "shipped_mock"],
};

function setOrderStatus(id: string, to: OrderStatus, note?: string) {
  store().mutate(
    (d) => {
      const o = d.orders.find((x) => x.id === id)!;
      o.status = to;
      o.updatedAt = new Date().toISOString();
      o.history.push({ status: to, at: o.updatedAt, note });
    },
    { actor: actorName(), action: `order.${to}`, target: id, detail: note },
  );
  return { ...db().orders.find((x) => x.id === id)! };
}

export const mockOrders: OrderService = {
  async cancel(orderId) {
    const o = db().orders.find((x) => x.id === orderId);
    if (!o) return fail("not_found", "Order not found.");
    if (!canTransition(orderTransitions, o.status, "canceled_mock")) return fail("conflict", "This order can no longer be canceled in the demo.");
    await latency();
    return ok(setOrderStatus(orderId, "canceled_mock", "Canceled — nothing was charged"));
  },
  async requestRefund(orderId, reason) {
    const o = db().orders.find((x) => x.id === orderId);
    if (!o) return fail("not_found", "Order not found.");
    await latency();
    const refund = { id: uid("rf"), orderId, requestedAt: new Date().toISOString(), reason, status: "requested_demo" as const };
    store().mutate((d) => {
      d.refunds.unshift(refund);
    }, { actor: actorName(), action: "refund.requested_demo", target: orderId });
    return ok(refund);
  },
  async advanceMock(orderId) {
    const o = db().orders.find((x) => x.id === orderId);
    if (!o) return fail("not_found", "Order not found.");
    const path = lifecycle[o.kind];
    const i = path.indexOf(o.status);
    const next = path[i + 1];
    if (!next || !canTransition(orderTransitions, o.status, next)) return fail("conflict", "No further mock steps for this order.");
    await latency();
    return ok(setOrderStatus(orderId, next, "Advanced in operations demo — simulated"));
  },
};

export const mockGifts: GiftService = {
  async createGift(values) {
    const parsed = giftSchema.safeParse(values);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the gift details.");
    await latency(160);
    const v = parsed.data;
    const now = new Date().toISOString();
    const gift: Gift = {
      id: uid("gift"),
      token: makeToken(`for ${v.recipientName.split(" ")[0]}`),
      occasion: v.occasion,
      occasionLabel: v.occasionLabel || undefined,
      recipient: { name: v.recipientName, relation: v.recipientRelation },
      giverName: v.giverName,
      dedication: v.dedication,
      reveal: { envelope: v.envelope, color: v.color, showGiverName: true },
      deliveryMode: v.deliveryMode,
      notifyOn: v.deliveryMode === "scheduled_preview" ? v.notifyOn : undefined,
      productId: v.productId,
      addOnIds: [...(v.addPrintedCard ? ["gift_wrap"] : []), ...(v.addBook ? ["book"] : [])],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    store().mutate((d) => {
      d.gifts.unshift(gift);
    }, { actor: v.giverName, action: "gift.configured", target: gift.id });
    store().track("gift_configured", { occasion: v.occasion, product: v.productId });
    return ok(gift);
  },
  async updateGift(id, values) {
    const parsed = giftSchema.safeParse(values);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the gift details.");
    const v = parsed.data;
    store().mutate((d) => {
      const g = d.gifts.find((x) => x.id === id);
      if (!g) return;
      Object.assign(g, {
        occasion: v.occasion,
        occasionLabel: v.occasionLabel || undefined,
        recipient: { name: v.recipientName, relation: v.recipientRelation },
        giverName: v.giverName,
        dedication: v.dedication,
        reveal: { envelope: v.envelope, color: v.color, showGiverName: true },
        deliveryMode: v.deliveryMode,
        notifyOn: v.deliveryMode === "scheduled_preview" ? v.notifyOn : undefined,
        productId: v.productId,
        addOnIds: [...(v.addPrintedCard ? ["gift_wrap"] : []), ...(v.addBook ? ["book"] : [])],
        updatedAt: new Date().toISOString(),
      });
    });
    const g = db().gifts.find((x) => x.id === id);
    return g ? ok({ ...g }) : fail("not_found", "Gift not found.");
  },
  async resolveToken(tok) {
    await latency(120);
    const g = db().gifts.find((x) => x.token === tok);
    if (!g) return fail("not_found", "We couldn't find this gift.");
    if (g.status === "canceled_demo") return fail("forbidden", "This gift was canceled.");
    return ok({ ...g });
  },
  async markOpened(tok) {
    store().mutate((d) => {
      const g = d.gifts.find((x) => x.token === tok);
      if (g && g.status !== "opened_demo") {
        g.status = g.status === "draft" ? "draft" : "opened_demo";
        g.openedAt = new Date().toISOString();
      }
    });
    const g = db().gifts.find((x) => x.token === tok);
    return g ? ok({ ...g }) : fail("not_found", "Gift not found.");
  },
};

export const mockFulfillment: FulfillmentProvider = {
  async createProof(configurationId) {
    const project = db().printProjects.find((p) => p.configurationId === configurationId);
    if (!project) return fail("not_found", "No print project yet — complete a demo order first.");
    const proof = { id: uid("proof"), version: project.proofs.length + 1, createdAt: new Date().toISOString(), status: "pending_review" as const };
    store().mutate((d) => {
      const p = d.printProjects.find((x) => x.id === project.id)!;
      p.proofs.unshift(proof);
      p.status = "proof_review";
      p.updatedAt = proof.createdAt;
    });
    return ok(proof);
  },
  async approveProof(projectId, proofId) {
    const project = db().printProjects.find((p) => p.id === projectId);
    if (!project) return fail("not_found", "Print project not found.");
    store().mutate(
      (d) => {
        const p = d.printProjects.find((x) => x.id === projectId)!;
        const pr = p.proofs.find((x) => x.id === proofId);
        if (pr) pr.status = "approved_demo";
        p.status = "approved_demo";
        p.updatedAt = new Date().toISOString();
        const o = d.orders.find((x) => x.id === p.orderId);
        if (o && o.status === "proof_required") {
          o.status = "ready_for_fulfillment";
          o.updatedAt = p.updatedAt;
          o.history.push({ status: "ready_for_fulfillment", at: p.updatedAt, note: "Proof approved in demo — printing is not connected" });
        }
      },
      { actor: actorName(), action: "proof.approved_demo", target: proofId },
    );
    return ok({ ...db().printProjects.find((p) => p.id === projectId)!.proofs.find((x) => x.id === proofId)! });
  },
  async quoteShipping() {
    return notConfigured("fulfillment", "Shipping rates will be calculated by the carrier once fulfillment is connected.");
  },
  async submitToVendor() {
    return notConfigured("fulfillment", "Print production is not connected in this preview. Nothing will be printed or shipped.");
  },
};

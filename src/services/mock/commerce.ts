"use client";

import type { BillingInterval, CheckoutSession, Gift, Order, OrderItem, OrderStatus } from "@/domain/models";
import { unitAmount } from "@/domain/commerce/plans";
import { evaluatePromotion, findPromotion, normalizeCode, type PromotionResult } from "@/domain/commerce/promotions";
import { isReferralCodeShape, referralProgram } from "@/domain/commerce/referrals";
import { giftSchema } from "@/domain/schemas";
import { quoteCart } from "@/domain/commerce/pricing";
import { canTransition, orderTransitions } from "@/domain/workflows/state-machines";
import { token as makeToken, uid } from "@/lib/utils";
import { fail, notConfigured, ok, type BillingProvider, type CheckoutQuote, type FulfillmentProvider, type GiftService, type OrderService } from "../contracts";
import { actorName, db, latency, pushNotification, store } from "./shared";

let orderSeq = 1040;

function nextOrderNumber() {
  const existing = db().orders.map((o) => Number(o.number.split("-").pop())).filter(Number.isFinite);
  orderSeq = Math.max(orderSeq, ...existing) + 1;
  return `OLC-DEMO-${orderSeq}`;
}

/* -------------------------- Promotions & credit -------------------------- */

const isNewCustomer = () => !db().orders.some((o) => !o.isSample && o.status !== "canceled_mock" && o.items.some((i) => db().catalog.find((p) => p.id === i.productId)?.kind === "plan"));
const creditBalance = () => db().credits.reduce((s, c) => s + c.amount, 0);

/** Resolve a typed code: a promotion code, or a friend's referral code. */
function resolveCode(code: string, lines: CheckoutSession["lines"]): PromotionResult {
  const d = db();
  const normalized = normalizeCode(code);
  const ctx = (promotionId: string, hasReferralCode = false) => ({
    now: new Date(),
    isNewCustomer: isNewCustomer(),
    usedByCustomer: d.promotionRedemptions.filter((r) => r.promotionId === promotionId).length,
    hasReferralCode,
  });
  const promo = findPromotion(d.promotions, normalized);
  if (promo) return evaluatePromotion(promo, lines, d.catalog, ctx(promo.id));
  if (isReferralCodeShape(normalized)) {
    if (normalized === d.referrals.code) return { ok: false, reason: "That's your own referral code — share it with someone you think would love this." };
    const referral = d.promotions.find((p) => p.id === referralProgram.friendPromotionId);
    return evaluatePromotion(referral, lines, d.catalog, ctx(referralProgram.friendPromotionId, true));
  }
  return evaluatePromotion(undefined, lines, d.catalog, ctx(""));
}

function checkoutQuote(session: CheckoutSession): CheckoutQuote {
  const d = db();
  const promo = session.promoCode ? resolveCode(session.promoCode, session.lines) : null;
  const available = session.useCredit === false ? 0 : creditBalance();
  const quote = quoteCart(session.lines, d.catalog, { discount: promo?.ok ? { amount: promo.discount, label: promo.label } : null, availableCredit: available });
  return {
    quote,
    promo: session.promoCode ? (promo!.ok ? { code: session.promoCode, ok: true, label: promo!.label } : { code: session.promoCode, ok: false, reason: promo!.reason }) : null,
    creditAvailable: creditBalance(),
  };
}

/** Personal inserts make a physical capsule made-to-order; the ready-made kit ships after payment. */
function lineFulfillment(productId: string, configurationId?: string) {
  const p = db().catalog.find((c) => c.id === productId);
  if (!p) return "none" as const;
  if (productId === "keepsake_box" && configurationId) {
    const box = db().heirlooms.find((h) => h.id === configurationId)?.box;
    if (box && (box.contents.book || box.contents.letterBundle || box.contents.photoPrints > 0)) return "made_to_order" as const;
  }
  return p.fulfillment ?? (p.kind === "physical" ? "made_to_order" : "digital");
}

const addTerm = (from: Date, interval: BillingInterval) => {
  const d = new Date(from);
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

export const mockBilling: BillingProvider = {
  async createCheckout(lines, purpose, opts) {
    if (!lines.length) return fail("validation", "Your bag is empty.");
    try {
      quoteCart(lines, db().catalog);
    } catch (e) {
      return fail("validation", e instanceof Error ? e.message : "Invalid order");
    }
    await latency(180);
    const session: CheckoutSession = { id: uid("chk"), lines: structuredClone(lines), purpose, status: "open", createdAt: new Date().toISOString(), promoCode: opts?.promoCode ? normalizeCode(opts.promoCode) : undefined, useCredit: true };
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

  quoteCheckout(checkoutId) {
    const s = db().checkouts.find((c) => c.id === checkoutId);
    if (!s) return fail("not_found", "This checkout preview has expired. Start again from your bag.");
    try {
      return ok(checkoutQuote(s));
    } catch (e) {
      return fail("validation", e instanceof Error ? e.message : "Something in your bag is no longer available.");
    }
  },

  async applyPromoCode(checkoutId, code) {
    const s = db().checkouts.find((c) => c.id === checkoutId);
    if (!s) return fail("not_found", "This checkout preview has expired.");
    if (!normalizeCode(code)) return fail("validation", "Type a code first.");
    const result = resolveCode(code, s.lines);
    if (!result.ok) return fail("validation", result.reason);
    store().mutate((d) => {
      d.checkouts.find((c) => c.id === checkoutId)!.promoCode = normalizeCode(code);
    });
    return ok(checkoutQuote(db().checkouts.find((c) => c.id === checkoutId)!));
  },

  async removePromoCode(checkoutId) {
    store().mutate((d) => {
      const c = d.checkouts.find((x) => x.id === checkoutId);
      if (c) c.promoCode = undefined;
    });
    const s = db().checkouts.find((c) => c.id === checkoutId);
    return s ? ok(checkoutQuote(s)) : fail("not_found", "This checkout preview has expired.");
  },

  async setUseCredit(checkoutId, use) {
    store().mutate((d) => {
      const c = d.checkouts.find((x) => x.id === checkoutId);
      if (c) c.useCredit = use;
    });
    const s = db().checkouts.find((c) => c.id === checkoutId);
    return s ? ok(checkoutQuote(s)) : fail("not_found", "This checkout preview has expired.");
  },

  async completeMockCheckout(checkoutId, customer) {
    const session = db().checkouts.find((c) => c.id === checkoutId);
    if (!session) return fail("not_found", "This checkout preview has expired.");
    if (session.status !== "open") {
      const existing = db().orders.find((o) => o.id === session.orderId);
      return existing ? ok(existing) : fail("conflict", "This checkout was already completed.");
    }
    const catalog = db().catalog;
    let cq: CheckoutQuote;
    try {
      cq = checkoutQuote(session);
    } catch (e) {
      return fail("validation", e instanceof Error ? e.message : "Something in your bag is no longer available.");
    }
    // A code that stopped applying (expired, fully claimed) is dropped, never silently honoured.
    const promoResult = session.promoCode ? resolveCode(session.promoCode, session.lines) : null;
    const quote = cq.quote;
    await latency(650);
    const now = new Date().toISOString();
    const items: OrderItem[] = session.lines.map((l) => {
      const p = catalog.find((c) => c.id === l.productId)!;
      const interval = p.kind === "plan" ? (l.interval ?? "year") : undefined;
      const name = l.label ?? (p.kind === "plan" ? `${p.name} — ${l.asGift ? "one year, as a gift" : interval === "month" ? "monthly" : "annual"}` : p.name);
      return { id: uid("oi"), productId: l.productId, name, quantity: l.quantity, unitAmount: unitAmount(p, interval), extrasAmount: l.extrasAmount, configurationId: l.configurationId, giftId: l.giftId };
    });
    const fulfillments = session.lines.map((l) => lineFulfillment(l.productId, l.configurationId));
    const giftLine = session.lines.find((l) => l.giftId);
    const kind: Order["kind"] = giftLine ? "gift" : quote.hasPhysical ? (items.some((i) => i.productId === "keepsake_box") ? "capsule" : "print") : "digital";
    const status: OrderStatus = fulfillments.includes("made_to_order") ? "proof_required" : fulfillments.includes("ships_after_payment") ? "ready_for_fulfillment" : "paid_mock";
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
      discount: quote.discount && promoResult?.ok ? { promotionId: promoResult.promotion.id, code: session.promoCode, amount: quote.discount.amount, label: quote.discount.label } : undefined,
      creditApplied: quote.credit || undefined,
      customerName: customer.name,
      shippingTo: customer.shipping,
      history: [
        { status: "preview", at: session.createdAt },
        { status: "paid_mock", at: now, note: "Demo checkout — no payment was taken" },
        ...(status === "proof_required" ? [{ status: "proof_required" as const, at: now, note: "Made to order — waiting for your proof approval. Nothing will be printed." }] : []),
        ...(status === "ready_for_fulfillment" ? [{ status: "ready_for_fulfillment" as const, at: now, note: "Ready-made kit — would ship once fulfillment is connected. Nothing will ship." }] : []),
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
        if (order.discount) {
          const promo = d.promotions.find((p) => p.id === order.discount!.promotionId);
          if (promo) promo.redemptions += 1;
          d.promotionRedemptions.unshift({ id: uid("red"), promotionId: order.discount.promotionId, orderId: order.id, customer: customer.name, discount: order.discount.amount, at: now });
        }
        if (order.creditApplied) d.credits.push({ id: uid("cr"), amount: -order.creditApplied, reason: `Used on ${order.number}`, source: "redemption", at: now, status: "demo" });
        for (const [i, it] of items.entries()) {
          const line = session.lines[i];
          const product = d.catalog.find((p) => p.id === it.productId);
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
              if (fulfillments[i] === "made_to_order")
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
          // A plan bought for yourself becomes (or extends) your subscription. A gifted plan
          // belongs to the recipient once they accept it, so it isn't added here.
          if (product?.kind === "plan" && product.planId !== "preview" && !line.asGift && !it.giftId) {
            const interval = line.interval ?? "year";
            const existing = d.subscriptions.find((x) => x.productId === product.id);
            const sub = existing ?? { id: uid("sub"), productId: product.id, status: "none" as const };
            Object.assign(sub, { status: "preview_active", interval, startedAt: now, renewsOn: addTerm(new Date(), interval), cancelAtPeriodEnd: false, orderId: order.id });
            if (!existing) d.subscriptions.push(sub);
            // One plan at a time: a new plan replaces the others at their next renewal.
            for (const other of d.subscriptions) if (other !== sub && (other.status === "active" || other.status === "preview_active")) other.cancelAtPeriodEnd = true;
          }
        }
      },
      { actor: customer.name, action: "order.mock_completed", target: order.id, detail: `${order.number} — no charge` },
    );
    store().track("checkout_completed_mock", { total: order.total, kind, promotion: order.discount?.promotionId ?? "none" });
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

  async changeInterval(subscriptionId, interval) {
    const sub = db().subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return fail("not_found", "That plan isn't on this account.");
    const product = db().catalog.find((p) => p.id === sub.productId);
    if (interval === "month" && !product?.monthly) return fail("validation", `${product?.name ?? "This plan"} is billed yearly only.`);
    if (sub.giftedBy) return fail("conflict", "A gifted plan is prepaid for its term. You can choose how to continue when it ends.");
    store().mutate((d) => {
      const s = d.subscriptions.find((x) => x.id === subscriptionId)!;
      s.interval = interval;
    }, { actor: actorName(), action: "subscription.interval_changed", target: subscriptionId, detail: `${interval === "month" ? "Monthly" : "Annual"} from the next renewal` });
    return ok({ ...db().subscriptions.find((s) => s.id === subscriptionId)! });
  },

  async setCancelAtPeriodEnd(subscriptionId, cancel) {
    if (!db().subscriptions.some((s) => s.id === subscriptionId)) return fail("not_found", "That plan isn't on this account.");
    store().mutate((d) => {
      d.subscriptions.find((x) => x.id === subscriptionId)!.cancelAtPeriodEnd = cancel;
    }, { actor: actorName(), action: cancel ? "subscription.cancel_scheduled" : "subscription.resumed", target: subscriptionId });
    return ok({ ...db().subscriptions.find((s) => s.id === subscriptionId)! });
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

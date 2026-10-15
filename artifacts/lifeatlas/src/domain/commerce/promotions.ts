import type { CartLine, Product, Promotion } from "@/domain/models";
import { unitAmount } from "./plans";

/**
 * The promotion evaluator. Pure and unit-tested: given a code, a cart and who's buying,
 * say whether it applies and exactly how much it takes off, or why it doesn't, in words a
 * customer understands. One promotion per order; promotions don't stack.
 */

export interface PromotionContext {
  now: Date;
  /** Never bought a plan before (on this device in the demo). */
  isNewCustomer: boolean;
  /** How many times this customer already used this promotion. */
  usedByCustomer: number;
  /** A referral code from someone else was used to arrive. */
  hasReferralCode?: boolean;
}

export type PromotionResult =
  | { ok: true; promotion: Promotion; discount: number; label: string; appliedTo: string[] }
  | { ok: false; reason: string };

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

export function findPromotion(promotions: Promotion[], code: string) {
  const c = normalizeCode(code);
  return c ? promotions.find((p) => p.code && normalizeCode(p.code) === c) : undefined;
}

/** A promotion can go live only when it's safe to: giveaways need a recorded legal review. */
export function canActivate(p: Promotion): { ok: true } | { ok: false; reason: string } {
  if (p.kind === "giveaway" && !p.legalReview) return { ok: false, reason: "Giveaways need a recorded legal and eligibility review before they can run." };
  if (p.requiresLegalReview && !p.legalReview) return { ok: false, reason: "This promotion needs a recorded legal review before it can run." };
  if (p.kind === "percent_off" && (!p.percentOff || p.percentOff <= 0 || p.percentOff > 100)) return { ok: false, reason: "Set a percentage between 1 and 100." };
  if (p.kind === "amount_off" && (!p.amountOff || !Number.isInteger(p.amountOff) || p.amountOff <= 0)) return { ok: false, reason: "Set a whole-cent amount." };
  if (p.endsAt && p.startsAt && new Date(p.endsAt) <= new Date(p.startsAt)) return { ok: false, reason: "The end date is before the start date." };
  return { ok: true };
}

function lineApplies(p: Promotion, product: Product) {
  if (p.appliesTo === "all") return true;
  if (p.appliesTo === "plans") return product.kind === "plan";
  return p.appliesTo.includes(product.id);
}

export function evaluatePromotion(p: Promotion | undefined, lines: CartLine[], catalog: Product[], ctx: PromotionContext): PromotionResult {
  if (!p) return { ok: false, reason: "That code isn't recognised. Check the spelling, codes aren't case-sensitive." };
  if (p.status !== "active") return { ok: false, reason: p.status === "ended" ? "This offer has ended." : "This offer isn't available right now." };
  const gate = canActivate(p);
  if (!gate.ok) return { ok: false, reason: "This offer isn't available right now." };
  if (p.kind === "giveaway") return { ok: false, reason: "Giveaways are awarded under their published rules, they can't be redeemed as a code." };
  if (p.startsAt && ctx.now < new Date(p.startsAt)) return { ok: false, reason: "This offer hasn't started yet." };
  if (p.endsAt && ctx.now > new Date(p.endsAt)) return { ok: false, reason: "This offer has ended." };
  if (p.limits.maxRedemptions !== undefined && p.redemptions >= p.limits.maxRedemptions) return { ok: false, reason: "This offer has been fully claimed." };
  if (p.limits.perCustomer !== undefined && ctx.usedByCustomer >= p.limits.perCustomer) return { ok: false, reason: "You've already used this offer." };
  if (p.eligibility.newCustomersOnly && !ctx.isNewCustomer) return { ok: false, reason: "This offer is for new members." };
  if (p.eligibility.requiresReferralCode && !ctx.hasReferralCode) return { ok: false, reason: "This offer comes with a friend's referral link." };

  const applicable = lines.filter((l) => {
    const product = catalog.find((c) => c.id === l.productId);
    return !!product && lineApplies(p, product);
  });
  if (!applicable.length) return { ok: false, reason: "Nothing in your bag qualifies for this offer." };
  const eligible = applicable.filter((l) => {
    const product = catalog.find((c) => c.id === l.productId)!;
    if (p.eligibility.excludeGifts && l.asGift) return false;
    if (p.eligibility.intervals && product.kind === "plan" && !p.eligibility.intervals.includes(l.interval ?? "year")) return false;
    return true;
  });
  if (!eligible.length) {
    if (p.eligibility.excludeGifts && applicable.every((l) => l.asGift)) return { ok: false, reason: "This offer can't be used on a gift." };
    return { ok: false, reason: p.eligibility.intervals?.length === 1 && p.eligibility.intervals[0] === "year" ? "This offer applies to annual plans." : "Nothing in your bag qualifies for this offer." };
  }

  const subtotal = lines.reduce((s, l) => {
    const product = catalog.find((c) => c.id === l.productId);
    return product ? s + (unitAmount(product, l.interval) + l.extrasAmount) * l.quantity : s;
  }, 0);
  if (p.eligibility.minSubtotal && subtotal < p.eligibility.minSubtotal) return { ok: false, reason: `This offer needs an order of at least $${(p.eligibility.minSubtotal / 100).toFixed(0)}.` };

  // Discount is computed on qualifying lines only. For "first term only" on a monthly plan,
  // it applies to the first month (that's what is being paid today).
  const base = eligible.reduce((s, l) => {
    const product = catalog.find((c) => c.id === l.productId)!;
    return s + (unitAmount(product, l.interval) + l.extrasAmount) * l.quantity;
  }, 0);
  let discount = 0;
  if (p.kind === "percent_off" || p.kind === "referral_reward") discount = Math.round((base * (p.percentOff ?? 0)) / 100);
  else if (p.kind === "amount_off") discount = Math.min(base, p.amountOff ?? 0);
  else if (p.kind === "free_period") {
    // A free period covers the plan's charge for that period (e.g. 12 free months = the first year).
    discount = eligible.reduce((s, l) => {
      const product = catalog.find((c) => c.id === l.productId)!;
      if (product.kind !== "plan") return s;
      const months = p.freeMonths ?? 0;
      const charge = l.interval === "month" ? Math.min(months, 1) * unitAmount(product, "month") : months >= 12 ? product.price.amount : Math.round((product.price.amount * months) / 12);
      return s + charge * l.quantity;
    }, 0);
  }
  discount = Math.max(0, Math.min(discount, base));
  if (discount === 0) return { ok: false, reason: "This offer doesn't change the price of what's in your bag." };
  const label =
    p.kind === "free_period" ? `${p.name}, ${p.freeMonths} months free` : p.kind === "amount_off" ? `${p.name}, $${((p.amountOff ?? 0) / 100).toFixed(2)} off` : `${p.name}, ${p.percentOff}% off${p.firstTermOnly ? " the first term" : ""}`;
  return { ok: true, promotion: p, discount, label, appliedTo: eligible.map((l) => l.id) };
}

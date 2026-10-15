import { describe, expect, it } from "vitest";
import type { CartLine, Promotion } from "@/domain/models";
import { defaultCatalog } from "@/data/product-catalog";
import { defaultPromotions } from "@/data/promotions";
import { annualSavings, capsuleAllowance, currentPlanId, plans, unitAmount } from "./plans";
import { canActivate, evaluatePromotion, findPromotion, normalizeCode, type PromotionContext } from "./promotions";
import { isReferralCodeShape, makeReferralCode, normalizeReferral, referralSummary } from "./referrals";
import { quoteCart } from "./pricing";

const catalog = defaultCatalog;
const product = (id: string) => catalog.find((p) => p.id === id)!;
const line = (productId: string, over: Partial<CartLine> = {}): CartLine => ({ id: `l_${productId}`, productId, quantity: 1, extrasAmount: 0, ...over });
const ctx = (over: Partial<PromotionContext> = {}): PromotionContext => ({ now: new Date("2026-10-14T12:00:00Z"), isNewCustomer: true, usedByCustomer: 0, ...over });
const promo = (id: string, over: Partial<Promotion> = {}) => ({ ...structuredClone(defaultPromotions.find((p) => p.id === id)!), ...over });

describe("plans and entitlements", () => {
  it("prices plans yearly or monthly from one place", () => {
    expect(unitAmount(product("digital"), "year")).toBe(9900);
    expect(unitAmount(product("digital"), "month")).toBe(999);
    expect(unitAmount(product("family"), "year")).toBe(17900);
    expect(() => unitAmount({ ...product("digital"), monthly: undefined }, "month")).toThrow();
    // One-time products ignore the interval.
    expect(unitAmount(product("keepsake_box"), "month")).toBe(24900);
  });

  it("shows annual savings honestly", () => {
    const s = annualSavings(product("digital"))!;
    expect(s.monthlyYear).toBe(11988);
    expect(s.saving).toBe(2088);
    expect(s.percent).toBe(17);
  });

  it("free contributors and export on every plan", () => {
    for (const p of Object.values(plans)) {
      expect(p.contributors).toBe("unlimited");
      expect(p.viewers).toBe("unlimited");
      expect(p.export).toBe(true);
    }
  });

  it("knows the plan in force and what it allows", () => {
    expect(currentPlanId([], catalog)).toBe("preview");
    expect(currentPlanId([{ id: "s", productId: "digital", status: "preview_active" }], catalog)).toBe("digital");
    expect(currentPlanId([{ id: "a", productId: "digital", status: "active" }, { id: "b", productId: "family", status: "preview_active" }], catalog)).toBe("family");
    expect(currentPlanId([{ id: "s", productId: "family", status: "canceled" }], catalog)).toBe("preview");
    expect(capsuleAllowance("digital", 0)).toMatchObject({ limit: 1, remaining: 1, allowed: true });
    const full = capsuleAllowance("digital", 1);
    expect(full.allowed).toBe(false);
    expect(full.reason).toMatch(/Family plan makes room for five/);
    expect(capsuleAllowance("family", 5).allowed).toBe(false);
  });

  it("keeps the launch prices the brief set", () => {
    expect(product("digital").price.amount).toBe(9900);
    expect(product("keepsake_box").price.amount).toBe(24900);
    expect(product("book").price.amount).toBe(11900);
    const fam = product("family").price.amount;
    expect(fam).toBeGreaterThanOrEqual(14900);
    expect(fam).toBeLessThanOrEqual(24900);
    // Every product says how it reaches the customer; personalised books are made to order.
    expect(product("book").fulfillment).toBe("made_to_order");
    expect(product("keepsake_box").fulfillment).toBe("ships_after_payment");
  });
});

describe("promotions", () => {
  it("finds codes regardless of case and spacing", () => {
    expect(normalizeCode(" founders ")).toBe("FOUNDERS");
    expect(findPromotion(defaultPromotions, "Founders")?.id).toBe("promo_founders");
    expect(findPromotion(defaultPromotions, "")).toBeUndefined();
  });

  it("FOUNDERS takes 20% off the first year of an annual plan", () => {
    const r = evaluatePromotion(promo("promo_founders"), [line("digital", { interval: "year" })], catalog, ctx());
    expect(r).toMatchObject({ ok: true, discount: 1980 });
  });

  it("explains every refusal in words", () => {
    const f = promo("promo_founders");
    expect(evaluatePromotion(f, [line("digital", { interval: "month" })], catalog, ctx())).toMatchObject({ ok: false, reason: "This offer applies to annual plans." });
    expect(evaluatePromotion(f, [line("digital")], catalog, ctx({ isNewCustomer: false }))).toMatchObject({ ok: false, reason: "This offer is for new members." });
    expect(evaluatePromotion(f, [line("digital")], catalog, ctx({ usedByCustomer: 1 }))).toMatchObject({ ok: false, reason: "You've already used this offer." });
    expect(evaluatePromotion({ ...f, redemptions: 500 }, [line("digital")], catalog, ctx())).toMatchObject({ ok: false, reason: "This offer has been fully claimed." });
    expect(evaluatePromotion(f, [line("digital")], catalog, ctx({ now: new Date("2027-07-01T00:00:00Z") }))).toMatchObject({ ok: false, reason: "This offer has ended." });
    expect(evaluatePromotion(f, [line("keepsake_box")], catalog, ctx())).toMatchObject({ ok: false, reason: "Nothing in your bag qualifies for this offer." });
    expect(evaluatePromotion(undefined, [line("digital")], catalog, ctx())).toMatchObject({ ok: false });
    expect(evaluatePromotion(promo("promo_holiday"), [line("book")], catalog, ctx())).toMatchObject({ ok: false, reason: "This offer has ended." });
    expect(evaluatePromotion(promo("promo_partner_year"), [line("digital")], catalog, ctx())).toMatchObject({ ok: false, reason: "This offer isn't available right now." });
  });

  it("amount-off and free-period offers never exceed what they apply to", () => {
    const k = evaluatePromotion(promo("promo_keepsake_gift"), [line("keepsake_box"), line("digital")], catalog, ctx());
    expect(k).toMatchObject({ ok: true, discount: 2500 });
    const free = evaluatePromotion(promo("promo_partner_year", { status: "active" }), [line("digital", { interval: "year" })], catalog, ctx());
    expect(free).toMatchObject({ ok: true, discount: 9900 });
    const big = evaluatePromotion(promo("promo_keepsake_gift", { amountOff: 999_999 }), [line("keepsake_box")], catalog, ctx());
    expect(big.ok && big.discount).toBe(24900);
  });

  it("the every-10th giveaway can't run — or be redeemed — without a recorded legal review", () => {
    const g = promo("promo_every_tenth");
    expect(g.status).toBe("draft");
    expect(canActivate(g)).toMatchObject({ ok: false });
    expect(evaluatePromotion({ ...g, status: "active" }, [line("digital")], catalog, ctx())).toMatchObject({ ok: false });
    const reviewed = { ...g, legalReview: { reviewedBy: "Counsel", approvedAt: "2026-11-01T00:00:00Z" } };
    expect(canActivate(reviewed)).toEqual({ ok: true });
    // Even reviewed, a giveaway is awarded under its rules, never typed in as a code.
    expect(evaluatePromotion({ ...reviewed, status: "active" }, [line("digital")], catalog, ctx())).toMatchObject({ ok: false });
  });

  it("only plain discounts ship active", () => {
    const active = defaultPromotions.filter((p) => p.status === "active");
    expect(active.every((p) => p.kind !== "giveaway" && canActivate(p).ok)).toBe(true);
  });
});

describe("referrals", () => {
  it("makes short, readable, stable codes", () => {
    const c = makeReferralCode("Sarah", "usr_sarah");
    expect(c).toMatch(/^SARAH-[A-Z2-9]{4}$/);
    expect(makeReferralCode("Sarah", "usr_sarah")).toBe(c);
    expect(isReferralCodeShape(c)).toBe(true);
    expect(isReferralCodeShape("FOUNDERS")).toBe(false);
    expect(makeReferralCode("Zoë-Ann", "x")).toMatch(/^ZOEANN-/);
  });

  it("cleans codes that arrive in links", () => {
    expect(normalizeReferral(" sarah-k7pq ")).toBe("SARAH-K7PQ");
    expect(normalizeReferral("<script>alert(1)</script>")).toBe("SCRIPTALERT1SCRI");
    expect(isReferralCodeShape(normalizeReferral("sarah-k7pq"))).toBe(true);
  });

  it("the friend's offer needs a referral code", () => {
    const r = promo("promo_referral");
    expect(evaluatePromotion(r, [line("family")], catalog, ctx())).toMatchObject({ ok: false });
    expect(evaluatePromotion(r, [line("family")], catalog, ctx({ hasReferralCode: true }))).toMatchObject({ ok: true, discount: 3580 });
  });

  it("summarises activity and credit", () => {
    const s = referralSummary(
      [
        { id: "1", friendName: "A", status: "rewarded", at: "", isSample: true },
        { id: "2", friendName: "B", status: "started_preview", at: "", isSample: true },
        { id: "3", friendName: "C", status: "link_shared", at: "", isSample: true },
      ],
      [
        { id: "c1", amount: 2000, reason: "", source: "referral", at: "", status: "demo" },
        { id: "c2", amount: -500, reason: "", source: "redemption", at: "", status: "demo" },
      ],
    );
    expect(s).toMatchObject({ shared: 3, started: 2, subscribed: 1, rewarded: 1, earned: 2000, balance: 1500 });
  });
});

describe("quotes with discounts and credit", () => {
  it("applies a discount, then credit, and never goes below zero", () => {
    const q = quoteCart([line("digital"), line("keepsake_box")], catalog, { discount: { amount: 1980, label: "Founding members" }, availableCredit: 2000 });
    expect(q.subtotal).toBe(9900 + 24900);
    expect(q.discount).toEqual({ amount: 1980, label: "Founding members" });
    expect(q.credit).toBe(2000);
    expect(q.total).toBe(9900 + 24900 - 1980 - 2000);
    const tiny = quoteCart([line("digital", { interval: "month" })], catalog, { availableCredit: 50_000 });
    expect(tiny.credit).toBe(999);
    expect(tiny.total).toBe(0);
  });

  it("prices monthly plan lines monthly and labels what they are", () => {
    const q = quoteCart([line("family", { interval: "month" })], catalog);
    expect(q.lines[0]).toMatchObject({ unit: 1799, interval: "month", fulfillment: "digital" });
    expect(q.notes.join(" ")).toMatch(/renew each month/);
  });

  it("refuses products that aren't available", () => {
    expect(() => quoteCart([line("legacy_capsule")], catalog)).toThrow();
  });
});

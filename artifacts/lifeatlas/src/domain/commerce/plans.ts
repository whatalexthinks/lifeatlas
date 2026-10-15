import type { BillingInterval, Capsule, Product, Subscription } from "@/domain/models";

/**
 * Plans and entitlements, the one place that decides what each plan includes.
 * Screens, checkout and limit checks read from here; nothing hard-codes a limit.
 *
 * Business model: paid capsule ownership, free invited participation. Contributors and
 * viewers never need a plan of their own. Prices live in the catalog (cents, editable in
 * operations); these are the launch hypotheses they start from.
 */

export type PlanId = "preview" | "digital" | "family";

export interface PlanEntitlements {
  id: PlanId;
  /** Capsules this account can own. */
  capsules: number;
  /** Planned hosted storage per account. */
  storageGb: number;
  /** Hosted (cloud) storage and cross-device access, needs the Part Two backend. */
  hosted: boolean;
  /** Invited contributors and viewers. Always free for them. */
  contributors: "unlimited";
  viewers: "unlimited";
  /** Future messages that can be prepared (delivery itself is a separate, unbuilt service). */
  futureMessages: number | "unlimited";
  /** Discount on printed books and physical capsules, percent. */
  keepsakeDiscountPct: number;
  /** Shared family directory and relationships across capsules. */
  familyDirectory: boolean;
  /** Export is never gated: anyone can always download their own content. */
  export: true;
}

export const plans: Record<PlanId, PlanEntitlements> = {
  preview: { id: "preview", capsules: 3, storageGb: 0, hosted: false, contributors: "unlimited", viewers: "unlimited", futureMessages: 3, keepsakeDiscountPct: 0, familyDirectory: true, export: true },
  digital: { id: "digital", capsules: 1, storageGb: 25, hosted: true, contributors: "unlimited", viewers: "unlimited", futureMessages: 10, keepsakeDiscountPct: 0, familyDirectory: false, export: true },
  family: { id: "family", capsules: 5, storageGb: 100, hosted: true, contributors: "unlimited", viewers: "unlimited", futureMessages: "unlimited", keepsakeDiscountPct: 10, familyDirectory: true, export: true },
};

/** Launch price hypotheses in cents. The catalog starts from these; operations can change them. */
export const launchPrices = {
  digital: { year: 9900, month: 999 },
  family: { year: 17900, month: 1799, rangeYear: [14900, 24900] as const },
  physicalCapsule: 24900,
  legacyBook: 11900,
} as const;

/** Unit amount for a plan line, by billing interval. One-time products ignore the interval. */
export function unitAmount(product: Product, interval: BillingInterval | undefined): number {
  if (product.kind === "plan" && interval === "month") {
    if (!product.monthly) throw new Error(`${product.name} has no monthly price`);
    return product.monthly.amount;
  }
  return product.price.amount;
}

/** What a year costs when paid monthly, and how much paying annually saves (cents). */
export function annualSavings(product: Product) {
  if (!product.monthly) return null;
  const monthlyYear = product.monthly.amount * 12;
  return { monthlyYear, saving: monthlyYear - product.price.amount, percent: Math.round(((monthlyYear - product.price.amount) / monthlyYear) * 100) };
}

/** The plan in force: the best active subscription, otherwise the free preview. */
export function currentPlanId(subscriptions: Subscription[], catalog: Product[]): PlanId {
  const active = subscriptions.filter((s) => s.status === "active" || s.status === "preview_active");
  const ids = active.map((s) => catalog.find((p) => p.id === s.productId)?.planId).filter((x): x is PlanId => !!x);
  if (ids.includes("family")) return "family";
  if (ids.includes("digital")) return "digital";
  return "preview";
}

export function entitlementsFor(subscriptions: Subscription[], catalog: Product[]) {
  return plans[currentPlanId(subscriptions, catalog)];
}

/** Capsules that count toward a plan: your own, not samples, not archived or being deleted. */
export function countOwnedCapsules(capsules: Pick<Capsule, "isSample" | "ownerPersonId" | "status">[], personId: string | undefined) {
  if (!personId) return 0;
  return capsules.filter((c) => !c.isSample && c.ownerPersonId === personId && c.status !== "archived" && c.status !== "deletion_pending").length;
}

/**
 * Can this account create another capsule? Returns a reason in plain words when not.
 * Sample capsules never count against a plan.
 */
export function capsuleAllowance(planId: PlanId, ownedNonSample: number) {
  const limit = plans[planId].capsules;
  const remaining = Math.max(0, limit - ownedNonSample);
  return {
    limit,
    used: ownedNonSample,
    remaining,
    allowed: remaining > 0,
    reason:
      remaining > 0
        ? null
        : planId === "family"
          ? `The Family plan includes ${limit} capsules. Archive one you no longer need, or contact us about more.`
          : planId === "digital"
            ? "The Digital plan includes one capsule. The Family plan makes room for five."
            : `The preview keeps up to ${limit} capsules on this device. Choose a plan to keep more, and to keep them beyond this browser.`,
  };
}

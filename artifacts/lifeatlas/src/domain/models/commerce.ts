import type { ID, ISODateTime, Timestamps } from "./common";

export type ProductKind = "plan" | "subscription" | "physical" | "service" | "add_on";
export type Availability = "available_demo" | "coming_soon" | "not_available";

export type BillingInterval = "year" | "month";

export interface Price {
  /** Integer minor units (cents) to avoid floating point errors. */
  amount: number;
  currency: "USD";
  interval: "one_time" | "year" | "month";
  isTestPrice: true;
  from?: boolean; // "from $119"
}

/**
 * How something reaches the customer. A personalised product is never "ready to ship"
 * before the content it's made from exists and the customer has approved a proof.
 */
export type Fulfillment = "digital" | "ships_after_payment" | "made_to_order" | "none";

export interface PlanAllowance {
  storytellers: number | "unlimited";
  storageGb: number;
  hostedEditingMonths: number | null;
  contributors: number | "unlimited";
}

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  tagline: string;
  description: string;
  price: Price;
  availability: Availability;
  allowance?: PlanAllowance;
  /** Plans only: the entitlement set in src/domain/commerce/plans.ts. */
  planId?: "preview" | "digital" | "family";
  /** Plans with a monthly option: the monthly amount in cents. */
  monthly?: { amount: number };
  fulfillment?: Fulfillment;
  /** Plain-language note on what has to happen before it can ship. */
  fulfillmentNote?: string;
  inclusions: string[];
  limitations: string[];
  /** Displayed next to price; editable in operations demo. */
  note?: string;
  giftable: boolean;
  sortOrder: number;
}

export interface CartLine {
  id: ID;
  productId: string;
  quantity: number;
  /** Plans: annual (default) or monthly billing. */
  interval?: BillingInterval;
  /** Plans bought for someone else: one prepaid term, never auto-renewed. */
  asGift?: boolean;
  /** For physical products, the configuration id. */
  configurationId?: ID;
  giftId?: ID;
  options?: Record<string, string>;
  /** Extra cost from configuration in minor units (test). */
  extrasAmount: number;
  label?: string;
}

export interface Cart {
  id: ID;
  lines: CartLine[];
  purpose: "self" | "gift";
  promoCode?: string;
}

/* ----------------------------- Promotions ---------------------------- */

export type PromotionKind = "percent_off" | "amount_off" | "free_period" | "referral_reward" | "giveaway";

/**
 * A promotion is data, not code: discounts, founder offers, referral rewards, gifted
 * free years and giveaways all share one shape and one evaluator
 * (src/domain/commerce/promotions.ts). A giveaway can't be activated until a legal and
 * eligibility review is recorded.
 */
export interface Promotion {
  id: ID;
  /** Customer-entered code (upper case). Referral and giveaway promotions may have none. */
  code?: string;
  name: string;
  description: string;
  kind: PromotionKind;
  percentOff?: number;
  amountOff?: number;
  freeMonths?: number;
  /** Product ids this applies to; "plans" means any plan line. */
  appliesTo: string[] | "plans" | "all";
  /** Only the first term of a plan (e.g. "20% off your first year"). */
  firstTermOnly?: boolean;
  eligibility: {
    newCustomersOnly?: boolean;
    minSubtotal?: number;
    intervals?: BillingInterval[];
    excludeGifts?: boolean;
    requiresReferralCode?: boolean;
  };
  limits: { maxRedemptions?: number; perCustomer?: number };
  startsAt?: ISODateTime;
  endsAt?: ISODateTime;
  status: "draft" | "active" | "paused" | "ended";
  requiresLegalReview: boolean;
  legalReview?: { reviewedBy: string; approvedAt: ISODateTime; notes?: string };
  /** For giveaways: the eligibility rule shown to customers. */
  rulesSummary?: string;
  redemptions: number;
  createdAt: ISODateTime;
}

export interface PromotionRedemption {
  id: ID;
  promotionId: ID;
  orderId: ID;
  customer: string;
  discount: number;
  at: ISODateTime;
}

/* ------------------------------ Referrals ---------------------------- */

export type ReferralEventStatus = "link_shared" | "started_preview" | "subscribed" | "rewarded" | "expired";

export interface ReferralEvent {
  id: ID;
  /** Fictional in the demo; a real program would store only what the friend agreed to. */
  friendName: string;
  status: ReferralEventStatus;
  at: ISODateTime;
  rewardCredit?: number;
  isSample: boolean;
}

export interface ReferralState {
  code: string;
  events: ReferralEvent[];
}

/** Account credit, in cents. Demo credits have no cash value and can't be withdrawn. */
export interface CreditEntry {
  id: ID;
  amount: number;
  reason: string;
  source: "referral" | "goodwill" | "redemption";
  at: ISODateTime;
  status: "demo";
}

export type OrderStatus =
  | "draft"
  | "preview"
  | "payment_pending"
  | "paid_mock"
  | "proof_required"
  | "ready_for_fulfillment"
  | "printing_mock"
  | "shipped_mock"
  | "canceled_mock"
  | "refunded_mock";

/** Payment state machine: production-only states require the billing provider. */
export type PaymentState = "started" | "pending" | "confirmed" | "failed" | "refunded" | "mock_uncharged";

export interface OrderItem {
  id: ID;
  productId: string;
  name: string;
  quantity: number;
  unitAmount: number;
  extrasAmount: number;
  configurationId?: ID;
  giftId?: ID;
  summary?: string;
}

export interface Order extends Timestamps {
  id: ID;
  number: string; // "OLC-DEMO-1042"
  kind: "digital" | "gift" | "print" | "capsule";
  items: OrderItem[];
  subtotal: number;
  shippingEstimate: number | null; // null = not calculated
  taxEstimate: number | null;
  total: number;
  currency: "USD";
  status: OrderStatus;
  payment: PaymentState;
  /** Discount from a promotion code, in cents (already subtracted from total). */
  discount?: { promotionId: ID; code?: string; amount: number; label: string };
  /** Account credit applied, in cents (already subtracted from total). */
  creditApplied?: number;
  customerName: string;
  shippingTo?: ShippingAddress;
  history: { status: OrderStatus; at: ISODateTime; note?: string }[];
  isSample: boolean;
}

/** Fictional shipping addresses only, validated but never sent anywhere. */
export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Purchase {
  id: ID;
  orderId: ID;
  productId: string;
  capsuleId?: ID;
  grantedAt: ISODateTime;
  mode: "demo";
}

export interface Subscription {
  id: ID;
  productId: string;
  status: "none" | "preview_active" | "preview_canceled" | "active" | "past_due" | "canceled";
  interval?: BillingInterval;
  renewsOn?: ISODateTime;
  startedAt?: ISODateTime;
  /** Cancels at the end of the paid term; nothing is deleted. */
  cancelAtPeriodEnd?: boolean;
  /** Prepaid by someone else; doesn't auto-renew. */
  giftedBy?: string;
  orderId?: ID;
}

export interface Invoice {
  id: ID;
  orderId: ID;
  number: string;
  issuedAt: ISODateTime;
  amount: number;
  status: "demo_uncharged" | "paid" | "void";
}

export interface Refund {
  id: ID;
  orderId: ID;
  requestedAt: ISODateTime;
  reason: string;
  status: "requested_demo" | "approved" | "denied" | "processed";
}

export interface CheckoutSession {
  id: ID;
  lines: CartLine[];
  purpose: "self" | "gift";
  status: "open" | "completed" | "canceled";
  createdAt: ISODateTime;
  orderId?: ID;
  /** Applied promotion code (validated again when the order completes). */
  promoCode?: string;
  /** Use available account credit. */
  useCredit?: boolean;
}

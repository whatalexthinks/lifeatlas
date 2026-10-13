import type { ID, ISODateTime, Timestamps } from "./common";

export type ProductKind = "plan" | "subscription" | "physical" | "service" | "add_on";
export type Availability = "available_demo" | "coming_soon" | "not_available";

export interface Price {
  /** Integer minor units (cents) to avoid floating point errors. */
  amount: number;
  currency: "USD";
  interval: "one_time" | "year";
  isTestPrice: true;
  from?: boolean; // "from $149"
}

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
  number: string; // "LA-DEMO-1042"
  kind: "digital" | "gift" | "print" | "capsule";
  items: OrderItem[];
  subtotal: number;
  shippingEstimate: number | null; // null = not calculated
  taxEstimate: number | null;
  total: number;
  currency: "USD";
  status: OrderStatus;
  payment: PaymentState;
  customerName: string;
  shippingTo?: ShippingAddress;
  history: { status: OrderStatus; at: ISODateTime; note?: string }[];
  isSample: boolean;
}

/** Fictional shipping addresses only — validated but never sent anywhere. */
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
  renewsOn?: ISODateTime;
  startedAt?: ISODateTime;
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
}

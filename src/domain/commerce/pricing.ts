import type { BookConfiguration, BoxConfiguration, CartLine, Product } from "@/domain/models";
import { unitAmount } from "./plans";

/**
 * All amounts are integer cents. All prices are TEST prices.
 * Shipping and tax are never invented: they return null until a provider exists.
 */

export interface Quote {
  lines: { id: string; label: string; quantity: number; unit: number; extras: number; total: number; interval?: "year" | "month"; fulfillment?: Product["fulfillment"] }[];
  subtotal: number;
  /** A plan's standing keepsake discount (Family: 10% off physical items), in cents. */
  memberDiscount: { amount: number; label: string } | null;
  /** Promotion discount actually applied (cents). */
  discount: { amount: number; label: string } | null;
  /** Account credit actually applied (cents). */
  credit: number;
  shipping: number | null;
  tax: number | null;
  total: number;
  hasPhysical: boolean;
  notes: string[];
}

export interface QuoteAdjustments {
  discount?: { amount: number; label: string } | null;
  /** Credit available on the account; only what's needed is used. */
  availableCredit?: number;
  /** Percent off physical items that the customer's plan includes, e.g. 10 on the Family plan. */
  keepsakeDiscountPct?: number;
}

export class PricingError extends Error {}

export function assertValidAmount(n: number, label = "amount") {
  if (!Number.isInteger(n) || n < 0) throw new PricingError(`Invalid ${label}: ${n}`);
}

export function lineTotal(unit: number, extras: number, quantity: number) {
  assertValidAmount(unit, "unit price");
  assertValidAmount(extras, "extras");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) throw new PricingError("Quantity must be between 1 and 25");
  return (unit + extras) * quantity;
}

export function quoteCart(lines: CartLine[], catalog: Product[], adjust: QuoteAdjustments = {}): Quote {
  const out: Quote["lines"] = [];
  let hasPhysical = false;
  for (const line of lines) {
    const p = catalog.find((c) => c.id === line.productId);
    if (!p) throw new PricingError(`Unknown product ${line.productId}`);
    if (p.availability === "not_available") throw new PricingError(`${p.name} isn't available`);
    if (p.kind === "physical") hasPhysical = true;
    const interval = p.kind === "plan" ? (line.interval ?? "year") : undefined;
    let unit: number;
    try {
      unit = unitAmount(p, interval);
    } catch (e) {
      throw new PricingError(e instanceof Error ? e.message : "Invalid billing interval");
    }
    out.push({
      id: line.id,
      label: line.label ?? p.name,
      quantity: line.quantity,
      unit,
      extras: line.extrasAmount,
      total: lineTotal(unit, line.extrasAmount, line.quantity),
      interval,
      fulfillment: p.fulfillment,
    });
  }
  const subtotal = out.reduce((s, l) => s + l.total, 0);
  const pct = Math.min(100, Math.max(0, adjust.keepsakeDiscountPct ?? 0));
  const physicalTotal = lines.reduce((s, line, i) => (catalog.find((c) => c.id === line.productId)?.kind === "physical" ? s + out[i].total : s), 0);
  const memberAmount = Math.floor((physicalTotal * pct) / 100);
  const afterMember = subtotal - memberAmount;
  const discountAmount = adjust.discount ? Math.min(afterMember, Math.max(0, adjust.discount.amount)) : 0;
  if (adjust.discount) assertValidAmount(adjust.discount.amount, "discount");
  const afterDiscount = afterMember - discountAmount;
  const credit = Math.min(afterDiscount, Math.max(0, adjust.availableCredit ?? 0));
  const notes = ["Test prices — no payment is collected in this preview."];
  if (hasPhysical) notes.push("Shipping and tax will be calculated once fulfillment is connected.");
  if (out.some((l) => l.interval === "month")) notes.push("Monthly plans renew each month until canceled; annual plans save about 17%.");
  if (lines.some((l) => l.asGift)) notes.push("Gifted plans are one prepaid term and never renew automatically.");
  return {
    lines: out,
    subtotal,
    memberDiscount: memberAmount ? { amount: memberAmount, label: `Family plan · ${pct}% off keepsakes` } : null,
    discount: discountAmount ? { amount: discountAmount, label: adjust.discount!.label } : null,
    credit,
    shipping: null,
    tax: null,
    total: afterDiscount - credit,
    hasPhysical,
    notes,
  };
}

/* ------------------------------- Books ------------------------------ */

export const bookMaterialExtras: Record<BookConfiguration["material"], number> = { linen: 1200, cloth: 0, soft_touch: 600 };
export const bookFoilExtras: Record<BookConfiguration["foil"], number> = { none: 0, brass: 0, blind_deboss: 0 };
export const bookSizeExtras: Record<BookConfiguration["size"], number> = { "8x10": 0, "10x10": 1200, "11x8.5": 800 };

/** Pages: cover/dedication/contents (6) + per story (~4.5 with photos) + timeline (4). */
export function estimateBookPages(storyCount: number, photoCount: number, includeTimeline: boolean) {
  const raw = 6 + storyCount * 3 + Math.ceil(photoCount * 0.75) + (includeTimeline ? 4 : 0);
  const pages = Math.max(24, Math.ceil(raw / 4) * 4); // signatures of 4
  return Math.min(pages, 240);
}

export function bookPageExtras(pages: number) {
  // Base price covers 72 pages; each extra 4-page signature is $3 (test).
  return pages <= 72 ? 0 : Math.ceil((pages - 72) / 4) * 300;
}

export function quoteBook(base: number, config: Pick<BookConfiguration, "material" | "foil" | "size" | "copies">, pages: number) {
  const extras = bookMaterialExtras[config.material] + bookFoilExtras[config.foil] + bookSizeExtras[config.size] + bookPageExtras(pages);
  return { unit: base, extras, total: lineTotal(base, extras, config.copies), pages };
}

/* -------------------------------- Box ------------------------------- */

export const boxFinishExtras: Record<BoxConfiguration["finish"], number> = { walnut: 4000, white_oak: 2500, ebonised_ash: 3000, linen_wrapped: 0 };
export const boxEngravingExtras: Record<BoxConfiguration["engraving"], number> = { none: 0, name: 1500, name_and_years: 1800, custom: 2500 };

/** Prices for what can go inside the box, in cents (test). */
export const boxContentExtras = { letterBundle: 1800, photoPrint: 150, archiveDrive: 2200 };

/** Every extra in the box as its own line, so the estimate is itemised, never lumped. */
export function boxBreakdown(config: BoxConfiguration, bookUnit: number) {
  const rows: { key: string; amount: number }[] = [
    { key: "finish", amount: boxFinishExtras[config.finish] },
    { key: "engraving", amount: boxEngravingExtras[config.engraving] },
    { key: "book", amount: config.contents.book ? bookUnit : 0 },
    { key: "letters", amount: config.contents.letterBundle ? boxContentExtras.letterBundle : 0 },
    { key: "prints", amount: config.contents.photoPrints * boxContentExtras.photoPrint },
    { key: "drive", amount: config.contents.archiveDrive ? boxContentExtras.archiveDrive : 0 },
  ];
  return rows.filter((r) => r.amount > 0);
}

export function quoteBox(base: number, config: BoxConfiguration, bookUnit: number) {
  const extras = boxBreakdown(config, bookUnit).reduce((s, r) => s + r.amount, 0);
  return { unit: base, extras, total: lineTotal(base, extras, 1) };
}

import type { BookConfiguration, BoxConfiguration, CartLine, Product } from "@/domain/models";

/**
 * All amounts are integer cents. All prices are TEST prices.
 * Shipping and tax are never invented: they return null until a provider exists.
 */

export interface Quote {
  lines: { id: string; label: string; quantity: number; unit: number; extras: number; total: number }[];
  subtotal: number;
  shipping: number | null;
  tax: number | null;
  total: number;
  hasPhysical: boolean;
  notes: string[];
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

export function quoteCart(lines: CartLine[], catalog: Product[]): Quote {
  const out: Quote["lines"] = [];
  let hasPhysical = false;
  for (const line of lines) {
    const p = catalog.find((c) => c.id === line.productId);
    if (!p) throw new PricingError(`Unknown product ${line.productId}`);
    if (p.kind === "physical") hasPhysical = true;
    out.push({
      id: line.id,
      label: line.label ?? p.name,
      quantity: line.quantity,
      unit: p.price.amount,
      extras: line.extrasAmount,
      total: lineTotal(p.price.amount, line.extrasAmount, line.quantity),
    });
  }
  const subtotal = out.reduce((s, l) => s + l.total, 0);
  const notes = ["Test prices — no payment is collected in this preview."];
  if (hasPhysical) notes.push("Shipping and tax will be calculated once fulfillment is connected.");
  return { lines: out, subtotal, shipping: null, tax: null, total: subtotal, hasPhysical, notes };
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

export function quoteBox(base: number, config: BoxConfiguration, bookUnit: number) {
  let extras = boxFinishExtras[config.finish] + boxEngravingExtras[config.engraving];
  if (config.contents.book) extras += bookUnit;
  if (config.contents.letterBundle) extras += 1800;
  extras += config.contents.photoPrints * 150;
  if (config.contents.archiveDrive) extras += 2200;
  return { unit: base, extras, total: lineTotal(base, extras, 1) };
}

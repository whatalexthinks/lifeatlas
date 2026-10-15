import { describe, expect, it } from "vitest";
import { bookPageExtras, estimateBookPages, lineTotal, PricingError, quoteBook, quoteBox, quoteCart } from "./pricing";
import { defaultCatalog as productCatalog } from "@/data/product-catalog";

describe("lineTotal", () => {
  it("multiplies unit plus extras by quantity in whole cents", () => {
    expect(lineTotal(14900, 1200, 2)).toBe(32200);
  });
  it.each([
    [10.5, 0, 1],
    [-1, 0, 1],
    [100, 0.1, 1],
    [100, 0, 0],
    [100, 0, 26],
    [100, 0, 1.5],
  ])("rejects invalid input unit=%s extras=%s qty=%s", (u, e, q) => {
    expect(() => lineTotal(u, e, q)).toThrow(PricingError);
  });
});

describe("quoteCart", () => {
  it("sums lines and never invents shipping or tax", () => {
    const q = quoteCart(
      [
        { id: "a", productId: "digital", quantity: 1, extrasAmount: 0 },
        { id: "b", productId: "book", quantity: 2, extrasAmount: 1200 },
      ],
      productCatalog,
    );
    expect(q.subtotal).toBe(7900 + 2 * (11900 + 1200));
    expect(q.total).toBe(q.subtotal);
    expect(q.shipping).toBeNull();
    expect(q.tax).toBeNull();
    expect(q.hasPhysical).toBe(true);
    expect(q.notes.join(" ")).toMatch(/Test prices/);
  });
  it("throws for an unknown product", () => {
    expect(() => quoteCart([{ id: "x", productId: "nope", quantity: 1, extrasAmount: 0 }], productCatalog)).toThrow(/Unknown product/);
  });
});

describe("book pricing", () => {
  it("rounds page estimates up to 4-page signatures within 24–240", () => {
    expect(estimateBookPages(0, 0, false)).toBe(24);
    expect(estimateBookPages(20, 24, true) % 4).toBe(0);
    expect(estimateBookPages(500, 900, true)).toBe(240);
  });
  it("charges nothing for the first 72 pages, then per signature", () => {
    expect(bookPageExtras(72)).toBe(0);
    expect(bookPageExtras(76)).toBe(300);
    expect(bookPageExtras(96)).toBe(1800);
  });
  it("adds material, size and page extras per copy", () => {
    const q = quoteBook(14900, { material: "linen", foil: "brass", size: "10x10", copies: 2 }, 96);
    expect(q.extras).toBe(1200 + 0 + 1200 + 1800);
    expect(q.total).toBe((14900 + q.extras) * 2);
  });
});

describe("keepsake box pricing", () => {
  it("adds finish, engraving and contents", () => {
    const q = quoteBox(
      24900,
      { finish: "walnut", engraving: "name", engravingText: "M", contents: { book: true, letterBundle: true, photoPrints: 12, archiveDrive: true, preservationGuide: true }, selectedLetterIds: [], selectedPhotoIds: [], intendedUse: "display" },
      14900,
    );
    expect(q.extras).toBe(4000 + 1500 + 14900 + 1800 + 12 * 150 + 2200);
    expect(q.total).toBe(24900 + q.extras);
  });
});

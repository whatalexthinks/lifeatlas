import { describe, expect, it } from "vitest";
import type { BoxConfiguration } from "@/domain/models";
import { boxBlockers, fulfillmentFor } from "./fulfillment";

const kit: BoxConfiguration = {
  finish: "linen_wrapped",
  engraving: "none",
  engravingText: "",
  contents: { book: false, letterBundle: false, photoPrints: 0, archiveDrive: false, preservationGuide: true },
  selectedLetterIds: [],
  selectedPhotoIds: [],
  intendedUse: "display",
};
const box = { id: "keepsake_box", kind: "physical" as const, fulfillment: "ships_after_payment" as const };

describe("fulfillment", () => {
  it("ships only the unpersonalised kit straight after payment", () => {
    expect(fulfillmentFor(box, kit)).toBe("ships_after_payment");
    expect(fulfillmentFor(box)).toBe("ships_after_payment");
  });

  it("makes anything personal to order, engraving and the archive drive included", () => {
    expect(fulfillmentFor(box, { ...kit, engraving: "name" })).toBe("made_to_order");
    expect(fulfillmentFor(box, { ...kit, contents: { ...kit.contents, archiveDrive: true } })).toBe("made_to_order");
    expect(fulfillmentFor(box, { ...kit, contents: { ...kit.contents, photoPrints: 12 } })).toBe("made_to_order");
  });

  it("won't let a box go to the bag before its content exists", () => {
    const full = { ...kit, contents: { ...kit.contents, book: true, letterBundle: true, photoPrints: 24 } };
    expect(boxBlockers(full, { printableStories: 2, printablePhotos: 10, letters: 0 })).toEqual([
      "The book needs at least 3 approved stories that may be printed, there are 2.",
      "Choose at least one letter for the bundle (write one in Letters Through Time first if you need to), or leave the bundle out.",
      "You chose 24 photo prints, but only 10 photos may be printed.",
    ]);
    expect(boxBlockers(full, { printableStories: 5, printablePhotos: 30, letters: 1 })).toEqual([]);
    expect(boxBlockers({ ...kit, engraving: "custom" }, { printableStories: 0, printablePhotos: 0, letters: 0 })).toHaveLength(1);
  });
});

import type { BoxConfiguration, Fulfillment, Product } from "@/domain/models";

/** Fewest approved, print-approved stories a printed book needs. */
export const MIN_BOOK_STORIES = 3;

/**
 * How a line reaches the customer. Anything made from their content, a book, letters,
 * photo prints, an engraved lid, a drive holding their archive, is made to order: it waits
 * for the content to exist and for the customer to approve a proof. Only the unpersonalised
 * kit can ship straight after payment.
 */
export function fulfillmentFor(product: Pick<Product, "id" | "kind" | "fulfillment">, box?: BoxConfiguration): Fulfillment {
  if (product.id === "keepsake_box" && box && isPersonalised(box)) return "made_to_order";
  return product.fulfillment ?? (product.kind === "physical" ? "made_to_order" : "digital");
}

export function isPersonalised(box: BoxConfiguration) {
  const c = box.contents;
  return c.book || c.letterBundle || c.photoPrints > 0 || c.archiveDrive || box.engraving !== "none";
}

/**
 * What still has to exist before a box can be ordered. Empty means it can go to the bag.
 * Each reason is a plain sentence the builder shows next to the button.
 */
export function boxBlockers(box: BoxConfiguration, have: { printableStories: number; printablePhotos: number; letters: number }) {
  const out: string[] = [];
  if (box.contents.book && have.printableStories < MIN_BOOK_STORIES)
    out.push(`The book needs at least ${MIN_BOOK_STORIES} approved stories that may be printed, there ${have.printableStories === 1 ? "is" : "are"} ${have.printableStories}.`);
  if (box.contents.letterBundle && have.letters === 0) out.push("Choose at least one letter for the bundle (write one in Letters Through Time first if you need to), or leave the bundle out.");
  if (box.contents.photoPrints > have.printablePhotos) out.push(`You chose ${box.contents.photoPrints} photo prints, but only ${have.printablePhotos} photos may be printed.`);
  if (box.engraving !== "none" && box.engraving === "custom" && !box.engravingText.trim()) out.push("Write the words for the lid, or choose another engraving.");
  return out;
}

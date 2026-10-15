import { formatMoney } from "@/lib/utils";
import type { Product } from "@/domain/models";
import { launchPrices } from "@/domain/commerce/plans";
import { brand } from "@/config/brand";

/**
 * The editable catalog. ALL PRICES ARE TEST PRICES, configurable launch hypotheses, not
 * validated pricing. Amounts are integer cents. Operations can edit a local copy in
 * /demo/operations; these defaults are restored on reset or when CATALOG_VERSION changes.
 *
 * Internal ids `book` and `keepsake_box` predate the rebrand and are kept so existing
 * designs and orders stay valid.
 */
export const CATALOG_VERSION = 4;

export const defaultCatalog: Product[] = [
  {
    id: "preview",
    kind: "plan",
    planId: "preview",
    name: "Start free",
    tagline: "Begin with one story. Try the tools on this device.",
    description: `Explore the sample capsules and start up to three of your own. Everything you add stays in this browser, nothing is hosted or backed up until you choose a plan.`,
    price: { amount: 0, currency: "USD", interval: "one_time", isTestPrice: true },
    availability: "available_demo",
    fulfillment: "none",
    inclusions: ["Explore three sample capsules", "Start up to three capsules on this device", "Record, write and add photographs", "Download everything, any time"],
    limitations: ["Stored only in this browser, clearing it removes your work", "Invitations work as copyable links in this browser only"],
    giftable: false,
    sortOrder: 0,
  },
  {
    id: "digital",
    kind: "plan",
    planId: "digital",
    name: "One capsule",
    tagline: "Give one person's life, your relationship or your family a place to be remembered.",
    description: "A private capsule for you, your partner, your family or someone you love: stories, voices, photographs, timelines and future messages, with free invitations for everyone who contributes.",
    price: { amount: launchPrices.digital.year, currency: "USD", interval: "year", isTestPrice: true },
    monthly: { amount: launchPrices.digital.month },
    availability: "available_demo",
    fulfillment: "digital",
    inclusions: [
      "One capsule of any kind",
      "Guided questions, voice recording, timelines and chapters",
      "Photographs, letters and the stories behind them",
      "Unlimited family contributors and viewers, free for them",
      "Download a complete copy any time",
      "25 GB for photographs, recordings and videos (planned allowance)",
    ],
    limitations: ["Hosted storage and sign-in arrive with accounts; this preview keeps everything in your browser", "Cancel any time, you can still download everything"],
    note: "Test price · billed yearly, or monthly",
    giftable: true,
    sortOrder: 1,
  },
  {
    id: "family",
    kind: "plan",
    planId: "family",
    name: "Family",
    tagline: "Every capsule your family needs, in one place.",
    description: "For the people keeping several stories at once, your parents, your relationship, your children, with a shared family directory and more room for media.",
    price: { amount: launchPrices.family.year, currency: "USD", interval: "year", isTestPrice: true },
    monthly: { amount: launchPrices.family.month },
    availability: "available_demo",
    fulfillment: "digital",
    inclusions: [
      "Up to five capsules",
      "100 GB shared across them (planned allowance)",
      "A shared family directory: people and relationships across capsules",
      "Unlimited contributors and viewers, free for them",
      "Unlimited future messages prepared",
      "10% off printed books and physical capsules",
    ],
    limitations: ["Hosted storage and sign-in arrive with accounts; this preview keeps everything in your browser"],
    note: `Test price · launch range ${formatMoney(launchPrices.family.rangeYear[0])}–${formatMoney(launchPrices.family.rangeYear[1])} a year`,
    giftable: true,
    sortOrder: 2,
  },
  {
    id: "keepsake_box",
    kind: "physical",
    name: `Premium Physical ${brand.product}`,
    tagline: "A keepsake to hold, open and fill together.",
    description:
      "A gift-ready archival kit: a fitted keepsake box, memory prompt cards, archival photo sleeves and letter envelopes. It needs nothing from you to ship, personal printed inserts can be added later, once your stories are ready.",
    price: { amount: launchPrices.physicalCapsule, currency: "USD", interval: "one_time", isTestPrice: true, from: true },
    availability: "available_demo",
    fulfillment: "ships_after_payment",
    fulfillmentNote: "Ready-made kit: would ship after payment once fulfillment is connected. Personal inserts are made to order after you approve a proof.",
    inclusions: [
      "Linen-wrapped keepsake box with a fitted lid (wood finishes available)",
      "52 memory prompt cards",
      "Archival, acid-free photo sleeves and letter envelopes",
      "A printed guide to starting and caring for your capsule",
      "Optional lid engraving and gift message",
    ],
    limitations: ["Display keepsake, not designed or rated for burial", "Shipping and tax calculated once fulfillment is connected", "Payments and shipping aren't connected in this preview"],
    note: "From, test price · add-on",
    giftable: true,
    sortOrder: 3,
  },
  {
    id: "book",
    kind: "physical",
    name: "Printed Legacy Book",
    tagline: "Your stories and photographs, bound to be handed down.",
    description: "A personalised book designed from the memories you choose. It's made to order: you design it, review a page-by-page proof, and only then would it be printed.",
    price: { amount: launchPrices.legacyBook, currency: "USD", interval: "one_time", isTestPrice: true, from: true },
    availability: "available_demo",
    fulfillment: "made_to_order",
    fulfillmentNote: "Made to order: printed only after your stories are in and you approve the proof.",
    inclusions: ["Up to 72 pages; more in 4-page signatures", "Cloth, linen or soft-touch cover", "Foil or debossed title", "A page-by-page proof to approve first"],
    limitations: ["Printing and shipping aren't connected in this preview", "Shipping and tax calculated once fulfillment is connected"],
    note: "From, test price · add-on",
    giftable: true,
    sortOrder: 4,
  },
  {
    id: "legacy_capsule",
    kind: "physical",
    name: "Burial-rated capsule (research)",
    tagline: "For long storage, not offered.",
    description: "A sealed capsule concept for long-term storage. It will not be offered until materials are tested and certified by qualified manufacturers.",
    price: { amount: 0, currency: "USD", interval: "one_time", isTestPrice: true },
    availability: "not_available",
    fulfillment: "none",
    inclusions: [],
    limitations: ["Not burial-rated", "No durability claims until independent testing"],
    giftable: false,
    sortOrder: 9,
  },
  {
    id: "letters",
    kind: "service",
    name: "Future message delivery",
    tagline: "Coming only when it can be promised.",
    description: "Preparing future messages is part of every plan. Delivering them years from now is a separate service that won't be sold until storage continuity, recipient verification and legal review are in place.",
    price: { amount: 0, currency: "USD", interval: "one_time", isTestPrice: true },
    availability: "coming_soon",
    fulfillment: "none",
    inclusions: ["Prepare and preview letters, voice messages and photographs", "Choose dates and milestones", "Name a successor"],
    limitations: ["Nothing is scheduled for delivery today", "No prepaid delivery is sold"],
    giftable: false,
    sortOrder: 10,
  },
  {
    id: "gift_wrap",
    kind: "add_on",
    name: "Printed gift card",
    tagline: "Something to hand over in person.",
    description: "A card with your message and the gift link, to print at home.",
    price: { amount: 0, currency: "USD", interval: "one_time", isTestPrice: true },
    availability: "available_demo",
    fulfillment: "digital",
    inclusions: ["Printable card"],
    limitations: [],
    giftable: true,
    sortOrder: 11,
  },
];

/** The ids shown as plans and add-ons, in order, wherever pricing appears. */
export const planIds = ["preview", "digital", "family"] as const;
export const addOnIds = ["keepsake_box", "book"] as const;

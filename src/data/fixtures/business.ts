import type {
  FutureMessage,
  Gift,
  HeirloomConfiguration,
  Invoice,
  Notification,
  Order,
  PrintProject,
  Subscription,
  SuccessorDesignation,
  SupportRequest,
} from "@/domain/models";

/* ----------------------------- Orders ----------------------------- */

export const orders: Order[] = [
  {
    id: "ord_1001",
    number: "LA-DEMO-1001",
    kind: "digital",
    items: [{ id: "oi_1", productId: "family", name: "Family Collection", quantity: 1, unitAmount: 6900, extrasAmount: 0 }],
    subtotal: 6900,
    shippingEstimate: null,
    taxEstimate: null,
    total: 6900,
    currency: "USD",
    status: "paid_mock",
    payment: "mock_uncharged",
    customerName: "Sarah Ellis",
    history: [
      { status: "preview", at: "2026-09-02T13:50:00.000Z" },
      { status: "paid_mock", at: "2026-09-02T13:55:00.000Z", note: "Demo checkout — no payment taken" },
    ],
    isSample: true,
    createdAt: "2026-09-02T13:50:00.000Z",
    updatedAt: "2026-09-02T13:55:00.000Z",
  },
  {
    id: "ord_1002",
    number: "LA-DEMO-1002",
    kind: "print",
    items: [
      {
        id: "oi_2",
        productId: "book",
        name: "Printed Heirloom Book — Margaret Ellis",
        quantity: 2,
        unitAmount: 14900,
        extrasAmount: 2400,
        configurationId: "hl_book_margaret",
        summary: "Evergreen linen · brass foil · 10×10 · 96 pages (est.)",
      },
    ],
    subtotal: 34600,
    shippingEstimate: null,
    taxEstimate: null,
    total: 34600,
    currency: "USD",
    status: "proof_required",
    payment: "mock_uncharged",
    customerName: "Sarah Ellis",
    history: [
      { status: "preview", at: "2026-10-03T19:00:00.000Z" },
      { status: "paid_mock", at: "2026-10-03T19:04:00.000Z", note: "Demo checkout — no payment taken" },
      { status: "proof_required", at: "2026-10-03T19:05:00.000Z", note: "Proof v1 ready for review (demo)" },
    ],
    isSample: true,
    createdAt: "2026-10-03T19:00:00.000Z",
    updatedAt: "2026-10-03T19:05:00.000Z",
  },
  {
    id: "ord_1003",
    number: "LA-DEMO-1003",
    kind: "gift",
    items: [{ id: "oi_3", productId: "personal", name: "Personal Capsule — gift", quantity: 1, unitAmount: 3900, extrasAmount: 0 }],
    subtotal: 3900,
    shippingEstimate: null,
    taxEstimate: null,
    total: 3900,
    currency: "USD",
    status: "canceled_mock",
    payment: "mock_uncharged",
    customerName: "Sarah Ellis",
    history: [
      { status: "preview", at: "2026-09-25T10:00:00.000Z" },
      { status: "paid_mock", at: "2026-09-25T10:03:00.000Z" },
      { status: "canceled_mock", at: "2026-09-26T08:00:00.000Z", note: "Canceled in demo" },
    ],
    isSample: true,
    createdAt: "2026-09-25T10:00:00.000Z",
    updatedAt: "2026-09-26T08:00:00.000Z",
  },
];

export const invoices: Invoice[] = [
  { id: "invc_1", orderId: "ord_1001", number: "DEMO-INV-0001", issuedAt: "2026-09-02T13:55:00.000Z", amount: 6900, status: "demo_uncharged" },
  { id: "invc_2", orderId: "ord_1002", number: "DEMO-INV-0002", issuedAt: "2026-10-03T19:04:00.000Z", amount: 34600, status: "demo_uncharged" },
];

export const subscriptions: Subscription[] = [{ id: "sub_living", productId: "living", status: "none" }];

/* ---------------------------- Heirlooms --------------------------- */

export const heirlooms: HeirloomConfiguration[] = [
  {
    id: "hl_book_margaret",
    kind: "book",
    capsuleId: "cap_margaret",
    name: "Margaret — In Her Own Words",
    book: {
      material: "linen",
      color: "evergreen",
      foil: "brass",
      size: "10x10",
      title: "Margaret Ellis",
      subtitle: "In Her Own Words · 1940 —",
      dedication: "For the stories that made us, and the ones still to come.",
      coverMediaId: "med_coast_1972",
      storyIds: ["mem_bread", "mem_harbor", "mem_foghorn", "mem_letter", "mem_suitcase", "mem_seat", "mem_wedding", "mem_three", "mem_summer", "mem_show", "mem_house", "mem_pacific", "mem_florence", "mem_grandma", "mem_know"],
      chapterOrder: ["childhood", "coming_of_age", "love", "family", "work", "journeys", "everyday", "wisdom"],
      layout: "editorial",
      includeCaptions: true,
      includeTimeline: true,
      copies: 2,
    },
    estimatedPages: 96,
    status: "ordered_demo",
    createdAt: "2026-10-01T19:00:00.000Z",
    updatedAt: "2026-10-03T19:00:00.000Z",
  },
];

export const printProjects: PrintProject[] = [
  {
    id: "pp_1",
    configurationId: "hl_book_margaret",
    orderId: "ord_1002",
    proofs: [{ id: "proof_1", version: 1, createdAt: "2026-10-03T19:05:00.000Z", status: "pending_review" }],
    status: "proof_review",
    createdAt: "2026-10-03T19:05:00.000Z",
    updatedAt: "2026-10-03T19:05:00.000Z",
  },
];

/* ------------------------------ Gifts ----------------------------- */

export const gifts: Gift[] = [
  {
    id: "gift_holiday",
    token: "for-grandpa-walt",
    occasion: "christmas",
    recipient: { name: "Grandpa Walt", relation: "Grandfather" },
    giverName: "The Okafor grandchildren",
    dedication: "We want to hear the stories you tell at the table — the ones we keep forgetting to write down. Merry Christmas.",
    reveal: { envelope: "winter", color: "evergreen", showGiverName: true },
    deliveryMode: "in_person",
    productId: "personal",
    addOnIds: ["gift_wrap"],
    status: "ready_demo",
    createdAt: "2026-10-06T10:00:00.000Z",
    updatedAt: "2026-10-06T10:10:00.000Z",
  },
];

/* -------------------------- Future letters ------------------------ */

export const futureMessages: FutureMessage[] = [
  {
    id: "fm_emma30",
    token: "emma-at-thirty",
    capsuleId: "cap_margaret",
    authorName: "Margaret Ellis",
    authorPersonId: "per_margaret",
    title: "For Emma, at thirty",
    dedication: "Open this on your thirtieth birthday — or whenever you need it.",
    body:
      "My darling Emma,\n\nBy the time you read this you'll be thirty, which is exactly the age I was when I first sat at a potter's wheel and made something that looked like a bowl. I hope you've already found the thing that makes your hands busy and your head quiet. If you haven't, there's no hurry. I was a late bloomer at nearly everything.\n\nI want you to know that you were the first person who ever called me Grandma, and that I practiced answering to it in the car.\n\nBe curious. Be kind. Write home.\n\nAll my love, always,\nGrandma",
    format: "letter",
    attachmentIds: ["med_bluebowl_2022"],
    recipient: { name: "Emma Ellis", relationship: "Granddaughter", contactStatus: "unverified", birthYear: 2005 },
    backupRecipient: { name: "Sarah Ellis", relationship: "Daughter", contactStatus: "unverified" },
    successorId: "suc_daniel",
    release: { kind: "milestone", milestone: "30th_birthday", date: "2035-04-12", requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: true, allowFamilyAfterOpening: true },
    status: "sealed_demo",
    sealedAt: "2026-10-04T18:00:00.000Z",
    isExample: false,
    history: [
      { status: "draft", at: "2026-10-01T18:00:00.000Z" },
      { status: "prepared", at: "2026-10-04T17:30:00.000Z" },
      { status: "sealed_demo", at: "2026-10-04T18:00:00.000Z", note: "Demo seal — reversible, not scheduled" },
    ],
    createdAt: "2026-10-01T18:00:00.000Z",
    updatedAt: "2026-10-04T18:00:00.000Z",
  },
  {
    id: "fm_leo18",
    token: "leo-eighteen",
    capsuleId: "cap_thomas",
    authorName: "Sarah Ellis",
    authorPersonId: "per_sarah",
    title: "What Grandpa would have told you",
    body: "Leo — Grandpa Tom used to say the world is mostly things we don't understand yet, and that this is good news. Here's what else he would have wanted you to know at eighteen…",
    format: "letter",
    attachmentIds: [],
    recipient: { name: "Leo Ellis", relationship: "Nephew", contactStatus: "not_provided", birthYear: 2010 },
    release: { kind: "milestone", milestone: "18th_birthday", date: "2028-07-02", requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: true, allowFamilyAfterOpening: false },
    status: "draft",
    isExample: false,
    history: [{ status: "draft", at: "2026-10-08T21:00:00.000Z" }],
    createdAt: "2026-10-08T21:00:00.000Z",
    updatedAt: "2026-10-08T21:00:00.000Z",
  },
  {
    id: "fm_twenty",
    token: "for-my-daughter",
    capsuleId: "cap_sarah",
    authorName: "Sarah Ellis",
    authorPersonId: "per_sarah",
    title: "Twenty years from now",
    dedication: "For Emma — when you're the age I was when you were born.",
    body: "Emma, I'm writing this at the kitchen table, the same one Grandma's bowl sits on now…",
    format: "letter",
    attachmentIds: [],
    recipient: { name: "Emma Ellis", relationship: "Daughter", contactStatus: "unverified", birthYear: 2005 },
    release: { kind: "interval", intervalYears: 20, date: "2046-10-13", requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: true, allowFamilyAfterOpening: true },
    status: "prepared",
    isExample: false,
    history: [
      { status: "draft", at: "2026-10-05T22:00:00.000Z" },
      { status: "prepared", at: "2026-10-06T07:00:00.000Z" },
    ],
    createdAt: "2026-10-05T22:00:00.000Z",
    updatedAt: "2026-10-06T07:00:00.000Z",
  },
  {
    id: "fm_example",
    token: "example-opening",
    authorName: "Sample author",
    title: "An example of opening day",
    dedication: "This is a sample showing how a future letter will feel to open.",
    body:
      "Dear one,\n\nIf you're reading this, a little piece of today has travelled a long way to find you. I don't know what your world looks like. I hope the coffee is still good and the people around you still laugh too loudly at dinner.\n\nThis is a sample letter, written to show what opening day might feel like. Long-term delivery isn't live yet — but the letters you write here are ready when it is.",
    format: "letter",
    attachmentIds: [],
    recipient: { name: "You", relationship: "Future reader", contactStatus: "not_provided" },
    release: { kind: "date", date: "2026-10-13", requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: false, allowFamilyAfterOpening: true },
    status: "delivered",
    isExample: true,
    history: [{ status: "delivered", at: "2026-10-13T08:00:00.000Z", note: "Example only — not a real delivery" }],
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
];

export const successors: SuccessorDesignation[] = [
  {
    id: "suc_daniel",
    name: "Daniel Ellis",
    relationship: "Brother",
    contact: "daniel@example.com",
    scope: "both",
    status: "acknowledged_demo",
    createdAt: "2026-10-04T18:10:00.000Z",
  },
];

/* --------------------------- Notifications ------------------------ */

export const notifications: Notification[] = [
  { id: "ntf_1", at: "2026-10-09T19:22:00.000Z", kind: "contribution", title: "Emma added a story", body: "“The blue bowl on the windowsill” — with a photo and a recording. Waiting for your review.", href: "/app/invitations?tab=review", read: false },
  { id: "ntf_2", at: "2026-10-07T21:05:00.000Z", kind: "contribution", title: "Daniel added a story", body: "“The night the kiln set off the alarm” is in review.", href: "/app/invitations?tab=review", read: false },
  { id: "ntf_3", at: "2026-10-03T19:05:00.000Z", kind: "order", title: "Book proof ready to review (demo)", body: "Proof v1 of Margaret's book is ready. Nothing will print until you approve — and printing isn't connected yet.", href: "/app/orders", read: true },
  { id: "ntf_4", at: "2026-10-04T08:01:00.000Z", kind: "invitation", title: "Invitation prepared for June", body: "Email preview only — no email was sent. Share the link yourself.", href: "/app/invitations", read: true },
];

/* ----------------------------- Support ---------------------------- */

export const supportRequests: SupportRequest[] = [
  { id: "sup_1", createdAt: "2026-10-08T10:00:00.000Z", from: "Sample customer A", topic: "export", subject: "Will my export open without LifeAtlas?", body: "If the company disappeared, could I still open the files?", status: "resolved_demo", isSample: true },
  { id: "sup_2", createdAt: "2026-10-10T14:00:00.000Z", from: "Sample customer B", topic: "print", subject: "Can I change a photo after approving the proof?", body: "I noticed a typo in a caption.", status: "open_demo", isSample: true },
  { id: "sup_3", createdAt: "2026-10-11T09:30:00.000Z", from: "Sample customer C", topic: "access", subject: "My father can't hear the record prompt", body: "He uses hearing aids. Is there a larger-text, no-audio mode?", status: "new_demo", isSample: true },
  { id: "sup_4", createdAt: "2026-10-12T16:45:00.000Z", from: "Sample customer D", topic: "privacy", subject: "Remove a story my cousin added", body: "How do I remove something someone else contributed?", status: "new_demo", isSample: true },
];

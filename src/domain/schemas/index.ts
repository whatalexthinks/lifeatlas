import { z } from "zod";
import { addYears, todayIso } from "@/lib/dates";

const CURRENT_YEAR = new Date().getFullYear();
const trimmed = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, `Please keep this under ${max} characters.`);
const optionalText = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`).optional().or(z.literal(""));
const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "That doesn't look like an email address.");

/* ------------------------------ Fuzzy date ------------------------------ */

export const fuzzyDateSchema = z
  .object({
    precision: z.enum(["day", "month", "season", "year", "circa", "decade", "life_stage", "unknown"]),
    year: z.number().int().min(1850).max(CURRENT_YEAR + 1).optional(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
    decade: z.number().int().min(1850).max(CURRENT_YEAR).optional(),
    lifeStage: z
      .enum(["early_childhood", "childhood", "teenage_years", "young_adulthood", "early_family_years", "middle_years", "later_years", "recent_years"])
      .optional(),
    note: z.string().max(120).optional(),
  })
  .superRefine((d, ctx) => {
    const need = (k: string, label: string) => ctx.addIssue({ code: "custom", path: [k], message: label });
    if (["day", "month", "season", "year", "circa"].includes(d.precision) && !d.year) need("year", "Add a year, or choose “Not sure”.");
    if ((d.precision === "day" || d.precision === "month") && !d.month) need("month", "Choose a month.");
    if (d.precision === "day" && !d.day) need("day", "Choose a day.");
    if (d.precision === "day" && d.year && d.month && d.day) {
      const last = new Date(Date.UTC(d.year, d.month, 0)).getUTCDate();
      if (d.day > last) need("day", "That day doesn't exist in that month.");
    }
    if (d.precision === "season" && !d.season) need("season", "Choose a season.");
    if (d.precision === "decade" && d.decade === undefined) need("decade", "Choose a decade.");
    if (d.precision === "life_stage" && !d.lifeStage) need("lifeStage", "Choose a time of life.");
  });

/* ------------------------------ Capsule wizard ------------------------------ */

export const wizardWhoSchema = z.object({
  relationshipKind: z.enum(["mother", "father", "grandparent", "partner", "self", "other"]),
  relationship: trimmed(1, 60, "Tell us how you're related — even “friend” is fine."),
});

export const wizardIntroduceSchema = z.object({
  subjectName: trimmed(1, 80, "What should we call this capsule? A first name is enough."),
  preferredName: optionalText(40),
  birthYear: z
    .union([z.literal(""), z.coerce.number().int().min(1900, "Please check the year.").max(CURRENT_YEAR, "Please check the year.")])
    .optional(),
  birthplace: optionalText(80),
  dedication: optionalText(400),
});

export const wizardCollectionSchema = z.object({ collectionMode: z.enum(["in_person", "link", "family"]) });
export const wizardChapterSchema = z.object({
  startingChapter: z.enum(["childhood", "coming_of_age", "love", "family", "work", "journeys", "everyday", "wisdom"]),
});
export const wizardCoverSchema = z.object({
  palette: z.enum(["evergreen", "terracotta", "slate", "linen", "night"]),
  typography: z.enum(["classic", "italic", "modern"]),
  layout: z.enum(["portrait", "full_bleed", "type_only"]),
});
export const wizardPrivacySchema = z.object({
  defaultPrivacy: z.enum(["private", "organizers", "family"]),
  viewerEnabled: z.boolean(),
});

export const capsuleWizardSchema = wizardWhoSchema
  .and(wizardIntroduceSchema)
  .and(wizardCollectionSchema)
  .and(wizardChapterSchema)
  .and(wizardCoverSchema)
  .and(wizardPrivacySchema);

export type CapsuleWizardValues = z.infer<typeof capsuleWizardSchema>;

/* --------------------------------- Memory --------------------------------- */

export const memoryFormSchema = z.object({
  title: trimmed(2, 160, "Give this memory a short title."),
  narrative: z.string().max(20_000, "This story is very long — consider splitting it into chapters."),
  quote: optionalText(280),
  date: fuzzyDateSchema,
  placeId: z.string().optional(),
  chapter: z.enum(["childhood", "coming_of_age", "love", "family", "work", "journeys", "everyday", "wisdom"]),
  privacy: z.enum(["private", "organizers", "family"]),
  tags: z.array(z.string().trim().min(1).max(32)).max(12, "Up to 12 tags."),
  peopleIds: z.array(z.string()).max(30),
  consent: z.object({ print: z.boolean(), export: z.boolean(), share: z.boolean() }),
});
export type MemoryFormValues = z.infer<typeof memoryFormSchema>;

/** A memory must carry *something*: words, a photo or a recording. */
export function memoryHasContent(v: { narrative: string; photoCount: number; hasAudio: boolean }) {
  return v.narrative.trim().length > 0 || v.photoCount > 0 || v.hasAudio;
}

/* ------------------------------- Invitations ------------------------------- */

export const invitationSchema = z.object({
  recipientName: trimmed(1, 80, "Who is this invitation for?"),
  recipientContact: optionalEmail,
  relationship: trimmed(1, 60, "How are they related?"),
  role: z.enum(["storyteller", "contributor", "viewer", "organizer"]),
  channel: z.enum(["email", "sms", "link"]),
  message: z.string().trim().max(1000, "Keep the note under 1,000 characters."),
  mode: z.enum(["questions", "open"]),
  questionIds: z.array(z.string()).max(12, "Up to 12 questions per invitation."),
});
export type InvitationFormValues = z.infer<typeof invitationSchema>;

export const customQuestionSchema = z.object({
  text: trimmed(8, 240, "Write a question of at least a few words."),
  category: z.string(),
});

/* ----------------------------- Future messages ----------------------------- */

export const futureMessageSchema = z
  .object({
    title: trimmed(2, 120, "Give this letter a title."),
    dedication: optionalText(240),
    body: z.string().trim().min(10, "Write at least a sentence or two.").max(20_000),
    recipientName: trimmed(1, 80, "Who is this for?"),
    recipientRelationship: trimmed(1, 60, "How are they related to you?"),
    recipientContact: optionalEmail,
    backupName: optionalText(80),
    releaseKind: z.enum(["date", "interval", "milestone"]),
    releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    intervalYears: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)]).optional(),
    milestone: z.enum(["18th_birthday", "21st_birthday", "graduation", "wedding", "first_child", "30th_birthday", "custom"]).optional(),
    milestoneNote: optionalText(120),
    recipientOnly: z.boolean(),
    allowFamilyAfterOpening: z.boolean(),
    personalNote: optionalText(500),
  })
  .superRefine((v, ctx) => {
    const today = todayIso();
    if (v.releaseDate <= today) ctx.addIssue({ code: "custom", path: ["releaseDate"], message: "Choose a date in the future." });
    if (v.releaseDate > addYears(today, 50)) ctx.addIssue({ code: "custom", path: ["releaseDate"], message: "Choose a date within the next 50 years." });
    if (v.releaseKind === "milestone" && !v.milestone) ctx.addIssue({ code: "custom", path: ["milestone"], message: "Choose a milestone." });
  });
export type FutureMessageFormValues = z.infer<typeof futureMessageSchema>;

/* ---------------------------------- Gifts --------------------------------- */

export const giftSchema = z
  .object({
    occasion: z.enum(["christmas", "hanukkah", "birthday", "mothers_day", "fathers_day", "anniversary", "retirement", "new_baby", "just_because", "other"]),
    occasionLabel: optionalText(60),
    recipientName: trimmed(1, 80, "Who is the gift for?"),
    recipientRelation: trimmed(1, 60, "How are they related to you?"),
    giverName: trimmed(1, 80, "How should we sign it?"),
    dedication: z.string().trim().max(600, "Keep the dedication under 600 characters."),
    envelope: z.enum(["linen", "botanical", "night_sky", "harbor", "winter"]),
    color: z.enum(["evergreen", "terracotta", "slate", "brass", "ink"]),
    deliveryMode: z.enum(["share_link_myself", "scheduled_preview", "in_person"]),
    notifyOn: z.string().optional(),
    productId: z.enum(["digital", "family"]),
    addPrintedCard: z.boolean(),
    addBook: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMode === "scheduled_preview") {
      if (!v.notifyOn) ctx.addIssue({ code: "custom", path: ["notifyOn"], message: "Choose a date for the preview." });
      else if (v.notifyOn <= todayIso()) ctx.addIssue({ code: "custom", path: ["notifyOn"], message: "Choose a future date." });
    }
    if (v.occasion === "other" && !v.occasionLabel) ctx.addIssue({ code: "custom", path: ["occasionLabel"], message: "Name the occasion." });
  });
export type GiftFormValues = z.infer<typeof giftSchema>;

/* -------------------------------- Checkout -------------------------------- */

export const shippingAddressSchema = z.object({
  name: trimmed(1, 80, "Recipient name"),
  line1: trimmed(3, 120, "Street line"),
  line2: optionalText(120),
  city: trimmed(1, 80, "City"),
  region: trimmed(1, 80, "State or region"),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/, "Check the postal code."),
  country: trimmed(2, 60, "Country"),
});

export const mockCheckoutSchema = z.object({
  name: trimmed(1, 80, "Your name"),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email for the demo receipt (it won't be sent)."),
  acknowledgeDemo: z.literal(true, { message: "Please confirm you understand no payment is taken." }),
});

/* --------------------------------- Support -------------------------------- */

export const contactSchema = z.object({
  name: trimmed(1, 80, "Your name"),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email so we could reply."),
  topic: z.enum(["billing", "privacy", "export", "print", "access", "other"]),
  message: trimmed(10, 4000, "Tell us a little more."),
});

export const successorSchema = z.object({
  name: trimmed(1, 80, "Who would you trust with this?"),
  relationship: trimmed(1, 60, "Relationship"),
  contact: optionalEmail,
  scope: z.enum(["future_messages", "capsule_stewardship", "both"]),
});

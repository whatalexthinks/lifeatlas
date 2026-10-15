import type { Capsule, CapsuleKind, KeyDate } from "@/domain/models";
import type { CapsuleWizardValues, OnboardingDetails } from "@/domain/schemas";
import type { CapsuleCreateExtras } from "@/services/contracts";
import { callName, capsuleKinds } from "@/domain/capsule-kinds";

/**
 * Onboarding asks as little as possible: whose story, a name or two, and how it should look.
 * These helpers turn those answers into a capsule — the page stays a page.
 */

export interface OnboardingLook {
  palette: Capsule["theme"]["palette"];
  typography: Capsule["theme"]["typography"];
  layout: Capsule["cover"]["layout"];
  coverMediaId?: string;
}

const first = (name: string | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/** "Ellis", "the Ellis family" and "The Ellises" all become "Ellis". */
export function familySurname(input: string) {
  return input
    .trim()
    .replace(/^the\s+/i, "")
    .replace(/\s+family$/i, "")
    .replace(/(?<=\w{3})es$/i, (m) => (/(ss|sh|ch|x|z)es$/i.test(input.trim()) ? m : ""))
    .trim();
}

/** Who the capsule is about, as it appears on the cover. */
export function subjectFor(kind: CapsuleKind, d: Pick<OnboardingDetails, "name" | "partnerName">) {
  if (kind === "couple") return [first(d.name), first(d.partnerName)].filter(Boolean).join(" & ");
  if (kind === "family") return `The ${familySurname(d.name)} Family`;
  return d.name.trim();
}

/** The suggested capsule name. The person can always change it. */
export function suggestedTitle(kind: CapsuleKind, d: Pick<OnboardingDetails, "name" | "partnerName">) {
  if (kind === "family") return capsuleKinds.family.title(familySurname(d.name));
  return capsuleKinds[kind].title(kind === "couple" ? subjectFor(kind, d) : d.name.trim());
}

/** The one optional date onboarding asks for. Only what was typed — nothing inferred. */
export function keyDatesFor(kind: CapsuleKind, d: Pick<OnboardingDetails, "name" | "keyDate">): KeyDate[] {
  if (!d.keyDate) return [];
  const [year, month, day] = d.keyDate.split("-").map(Number);
  if (!year || !month || !day) return [];
  if (kind === "couple") return [{ id: "kd_anniversary", label: "Our anniversary", kind: "anniversary", month, day, year, recurring: true }];
  if (kind === "child") return [{ id: "kd_birthday", label: `${callName(d.name) || "Their"}'s birthday`, kind: "birthday", month, day, year, recurring: true }];
  return [];
}

/** Which onboarding fields each kind asks for. */
export const askFor: Record<CapsuleKind, { relationship: boolean; partner: boolean; birthYear: boolean; birthplace: boolean; keyDate: "anniversary" | "birthday" | null }> = {
  personal: { relationship: false, partner: false, birthYear: true, birthplace: true, keyDate: null },
  couple: { relationship: false, partner: true, birthYear: false, birthplace: false, keyDate: "anniversary" },
  family: { relationship: false, partner: false, birthYear: false, birthplace: true, keyDate: null },
  parent: { relationship: true, partner: false, birthYear: true, birthplace: true, keyDate: null },
  child: { relationship: true, partner: false, birthYear: false, birthplace: false, keyDate: "birthday" },
  someone: { relationship: true, partner: false, birthYear: true, birthplace: false, keyDate: null },
};

/** Everything the capsule service needs, from the onboarding answers. */
export function toCreateInput(d: OnboardingDetails, look: OnboardingLook): CapsuleWizardValues & CapsuleCreateExtras {
  const kind = d.kind;
  const config = capsuleKinds[kind];
  const ask = askFor[kind];
  const keyDates = keyDatesFor(kind, d);
  const birthYear = ask.birthYear && typeof d.birthYear === "number" ? d.birthYear : kind === "child" && keyDates[0]?.year ? keyDates[0].year : "";
  return {
    kind,
    relationshipKind: config.relationshipKind,
    relationship: (ask.relationship && d.relationship?.trim()) || config.defaultRelationship,
    subjectName: subjectFor(kind, d),
    preferredName: kind === "couple" || kind === "family" ? "" : callName(d.name),
    partnerName: kind === "couple" ? d.partnerName?.trim() : undefined,
    birthYear,
    birthplace: ask.birthplace ? d.birthplace?.trim() ?? "" : "",
    dedication: "",
    title: d.title.trim() || suggestedTitle(kind, d),
    keyDates,
    collectionMode: kind === "family" ? "family" : "in_person",
    startingChapter: config.chapterOrder[0],
    palette: look.palette,
    typography: look.typography,
    layout: look.coverMediaId ? look.layout : "type_only",
    coverMediaId: look.coverMediaId,
    defaultPrivacy: "family",
    viewerEnabled: true,
  };
}

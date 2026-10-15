import type { Capsule, CapsuleKind, ChapterKey, Question } from "@/domain/models";
import { chapterById } from "@/data/chapters";

/**
 * What kind of story a capsule holds. One platform, specialised gently: the kind decides
 * the words we use, the questions we offer first and how chapters are named — never
 * what a capsule is allowed to contain.
 */
export interface CapsuleKindConfig {
  kind: CapsuleKind;
  /** The onboarding answer to "Whose story would you like to preserve?" */
  option: string;
  optionHint: string;
  /** Short label for cards and filters. */
  label: string;
  /** Default capsule title, given the name(s). */
  title: (name: string) => string;
  /** Who the stories are about, in running text: "your relationship", "Margaret". */
  about: (name: string) => string;
  /** Questions marked for these audiences are offered first. */
  audiences: CapsuleKind[];
  /** Chapters shown first, in order. */
  chapterOrder: ChapterKey[];
  /** Chapter names that read better for this kind. Unlisted chapters keep their usual name. */
  chapterTitles: Partial<Record<ChapterKey, string>>;
  /** The relationship text kept on the capsule for older screens. */
  relationshipKind: Capsule["relationshipKind"];
  defaultRelationship: string;
  /** Marketing page for this kind. */
  page: string;
}

const honorific = /^(mr|mrs|ms|mx|miss|dr|prof|rev|sir|dame|aunt|auntie|aunty|uncle|grandma|grandpa|granny|gran|nana|nan|papa|pop|grandmother|grandfather|sister|brother|father|mother|cousin|tía|tia|tío|tio|abuela|abuelo|oma|opa)\.?$/i;

/** What you'd call someone in a title: "Rosa" from "Rosa Delgado", but "Aunt Rose" and "Dr. Patel" whole. */
export function callName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return honorific.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
}

export const capsuleKinds: Record<CapsuleKind, CapsuleKindConfig> = {
  personal: {
    kind: "personal",
    option: "My own",
    optionHint: "Your life, in your words — for you now, and for the people who come after.",
    label: "Personal",
    title: () => "My Life, So Far",
    about: () => "your life",
    audiences: ["personal"],
    chapterOrder: ["childhood", "coming_of_age", "love", "work", "family", "journeys", "everyday", "wisdom"],
    chapterTitles: { wisdom: "What I've learned" },
    relationshipKind: "self",
    defaultRelationship: "Myself",
    page: "/personal",
  },
  couple: {
    kind: "couple",
    option: "Mine and my partner's",
    optionHint: "How you met, the firsts, the adventures — and the small moments only you two know.",
    label: "Couple",
    title: () => "Our Story",
    about: (name) => (name ? `${name}'s story together` : "your story together"),
    audiences: ["couple"],
    chapterOrder: ["love", "coming_of_age", "journeys", "family", "everyday", "work", "wisdom", "childhood"],
    chapterTitles: { love: "How we met", coming_of_age: "Our firsts", journeys: "Adventures", family: "Home & family", everyday: "Little moments", work: "Building a life", wisdom: "What's next", childhood: "Before us" },
    relationshipKind: "partner",
    defaultRelationship: "Partner",
    page: "/couples",
  },
  family: {
    kind: "family",
    option: "My family",
    optionHint: "Several generations in one place — traditions, family stories and everyone's side of them.",
    label: "Family",
    title: (name) => (name ? `The ${name} Family` : "Our Family"),
    about: (name) => (name ? `the ${name} family` : "your family"),
    audiences: ["family"],
    chapterOrder: ["childhood", "family", "everyday", "journeys", "work", "love", "coming_of_age", "wisdom"],
    chapterTitles: { childhood: "Where we come from", family: "Generations", everyday: "Traditions", journeys: "Homes & journeys", wisdom: "What we pass on" },
    relationshipKind: "other",
    defaultRelationship: "Family",
    page: "/families",
  },
  parent: {
    kind: "parent",
    option: "My parent or grandparent",
    optionHint: "Their stories in their own voice, before the details fade.",
    label: "Parent or grandparent",
    title: (name) => (callName(name) ? `In ${callName(name)}'s Own Words` : "In Their Own Words"),
    about: (name) => callName(name) || "them",
    audiences: ["parent", "personal"],
    chapterOrder: ["childhood", "coming_of_age", "love", "work", "family", "journeys", "everyday", "wisdom"],
    chapterTitles: {},
    relationshipKind: "mother",
    defaultRelationship: "Mother",
    page: "/legacy",
  },
  child: {
    kind: "child",
    option: "My child",
    optionHint: "Milestones, funny sayings and letters they'll open when they're older.",
    label: "Child",
    title: (name) => `For ${callName(name) || "You"}`,
    about: (name) => callName(name) || "your child",
    audiences: ["child"],
    chapterOrder: ["childhood", "coming_of_age", "family", "everyday", "journeys", "love", "work", "wisdom"],
    chapterTitles: { childhood: "The first years", coming_of_age: "Growing up", family: "Family life", everyday: "Little moments", journeys: "Adventures", love: "Friends", work: "School & firsts", wisdom: "Letters to you" },
    relationshipKind: "other",
    defaultRelationship: "Child",
    page: "/families",
  },
  someone: {
    kind: "someone",
    option: "Someone special",
    optionHint: "A friend, a mentor, someone you miss — a place for the stories people tell about them.",
    label: "Someone special",
    title: (name) => (callName(name) ? `The Stories of ${callName(name)}` : "Their Stories"),
    about: (name) => callName(name) || "them",
    audiences: ["someone", "personal"],
    chapterOrder: ["childhood", "coming_of_age", "love", "work", "family", "journeys", "everyday", "wisdom"],
    chapterTitles: {},
    relationshipKind: "other",
    defaultRelationship: "Friend",
    page: "/legacy",
  },
};

export const kindOrder: CapsuleKind[] = ["personal", "couple", "family", "parent", "child", "someone"];

/** A capsule's kind, deriving one for capsules saved before kinds existed. */
export function capsuleKind(c: Pick<Capsule, "kind" | "relationshipKind">): CapsuleKind {
  if (c.kind) return c.kind;
  switch (c.relationshipKind) {
    case "self":
      return "personal";
    case "partner":
      return "couple";
    case "mother":
    case "father":
    case "grandparent":
      return "parent";
    default:
      return "someone";
  }
}

/** Chapter name for this capsule — "How we met" in a couple's capsule, "Love" elsewhere. */
export function chapterTitle(c: Pick<Capsule, "kind" | "relationshipKind">, key: ChapterKey) {
  return capsuleKinds[capsuleKind(c)].chapterTitles[key] ?? chapterById(key).title;
}

/**
 * The questions to offer a capsule, best first: written for this kind, then general ones.
 * Questions written for a different audience (a parent's note to a child, say) are left out.
 */
export function questionsForKind(kind: CapsuleKind, questions: Question[]) {
  const wanted = capsuleKinds[kind].audiences;
  const matched = questions.filter((q) => q.audiences?.some((a) => wanted.includes(a)));
  const general = questions.filter((q) => !q.audiences?.length);
  return [...matched, ...general];
}

/**
 * "Surprise me": a gentle random pick from the questions suited to this capsule, avoiding
 * ones already answered or skipped when possible. `random` is injectable for tests.
 */
export function surpriseQuestion(kind: CapsuleKind, questions: Question[], exclude: Set<string>, random = Math.random) {
  const pool = questionsForKind(kind, questions);
  const fresh = pool.filter((q) => !exclude.has(q.id));
  // Prefer questions written for this kind two times out of three.
  const preferred = fresh.filter((q) => q.audiences?.length);
  const from = preferred.length && random() < 0.67 ? preferred : fresh.length ? fresh : pool;
  return from[Math.floor(random() * from.length)];
}

/** Who a question is for, in running text: "you", "the two of you", "the family", "Rosa". */
export function askingWhom(c: Pick<Capsule, "kind" | "relationshipKind" | "preferredName" | "subjectName">) {
  const kind = capsuleKind(c);
  if (kind === "personal") return "you";
  if (kind === "couple") return "the two of you";
  if (kind === "family") return "the family";
  return c.preferredName || callName(c.subjectName) || "them";
}

/** The chapter with the name this capsule uses for it. Falls back to the standard chapter. */
export function chapterFor(c: Pick<Capsule, "kind" | "relationshipKind"> | undefined, key: ChapterKey) {
  const ch = chapterById(key);
  return c ? { ...ch, title: chapterTitle(c, key) } : ch;
}

import type { Capsule, CapsuleMembership, ChapterKey, KeyDate, Memory } from "@/domain/models";

/**
 * What the home page shows, worked out in one tested place: the dates coming up, how far
 * each capsule has come, and the few next steps worth suggesting. Nothing here invents a
 * fact — a date without a known year never gets an "nth anniversary".
 */

export interface UpcomingDate {
  capsuleId: string;
  capsuleTitle: string;
  keyDate: KeyDate;
  /** The next occurrence, at local midnight. */
  on: Date;
  daysAway: number;
  /** "25th anniversary", "turns 22", "13 years" — only when the first year is known. */
  milestone?: string;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The next time a key date comes round (today counts), or undefined if it has passed for good. */
export function nextOccurrence(k: KeyDate, now: Date): Date | undefined {
  const today = midnight(now);
  if (!k.recurring) {
    if (!k.year) return undefined;
    const once = new Date(k.year, k.month - 1, k.day);
    return once >= today ? once : undefined;
  }
  // February 29th is marked on the 28th in other years.
  const make = (y: number) => {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return new Date(y, k.month - 1, k.month === 2 && k.day === 29 && !leap ? 28 : k.day);
  };
  const thisYear = make(today.getFullYear());
  return thisYear >= today ? thisYear : make(today.getFullYear() + 1);
}

export function milestoneFor(k: KeyDate, on: Date): string | undefined {
  if (!k.year || !k.recurring) return undefined;
  const years = on.getFullYear() - k.year;
  if (years <= 0) return undefined;
  if (k.kind === "anniversary") return `${ordinal(years)} anniversary`;
  if (k.kind === "birthday") return `turns ${years}`;
  if (k.kind === "remembrance") return `${years} ${years === 1 ? "year" : "years"}`;
  return `${years} ${years === 1 ? "year" : "years"} since`;
}

/** Key dates across capsules, soonest first, within the window. */
export function upcomingDates(capsules: Pick<Capsule, "id" | "title" | "keyDates" | "status">[], now: Date, withinDays = 120): UpcomingDate[] {
  const today = midnight(now);
  const out: UpcomingDate[] = [];
  for (const c of capsules) {
    if (c.status === "deletion_pending" || c.status === "archived") continue;
    for (const k of c.keyDates ?? []) {
      const on = nextOccurrence(k, now);
      if (!on) continue;
      const daysAway = Math.round((on.getTime() - today.getTime()) / 86_400_000);
      if (daysAway > withinDays) continue;
      out.push({ capsuleId: c.id, capsuleTitle: c.title, keyDate: k, on, daysAway, milestone: milestoneFor(k, on) });
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway || a.keyDate.label.localeCompare(b.keyDate.label));
}

export function whenLabel(daysAway: number) {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway < 14) return `In ${daysAway} days`;
  if (daysAway < 60) return `In ${Math.round(daysAway / 7)} weeks`;
  return `In ${Math.round(daysAway / 30)} months`;
}

/** Progress that means something: how many chapters have at least one kept story. */
export function chapterProgress(capsule: Pick<Capsule, "id" | "chapterOrder">, memories: Pick<Memory, "capsuleId" | "chapter" | "status" | "deletedAt">[]) {
  const begun = new Set<ChapterKey>();
  let stories = 0;
  for (const m of memories) {
    if (m.capsuleId !== capsule.id || m.deletedAt || m.status !== "approved") continue;
    begun.add(m.chapter);
    stories++;
  }
  const total = capsule.chapterOrder.length || 8;
  return { begun: begun.size, total, stories };
}

/** People helping with a capsule other than its owner. */
export function contributorsOf(capsuleId: string, memberships: Pick<CapsuleMembership, "capsuleId" | "personId" | "role" | "status">[]) {
  return memberships.filter((m) => m.capsuleId === capsuleId && m.status === "active" && m.role !== "owner" && m.role !== "viewer");
}

export interface NextAction {
  id: string;
  label: string;
  detail: string;
  href: string;
}

/**
 * At most a handful of suggestions, most useful first. Each one disappears once it's done,
 * and none is a sales prompt.
 */
export function nextActions(input: {
  capsules: Pick<Capsule, "id" | "title" | "isSample" | "status" | "cover" | "keyDates" | "kind">[];
  memories: Pick<Memory, "capsuleId" | "deletedAt" | "status">[];
  invitations: { capsuleId: string }[];
  exportJobs: unknown[];
  successors: unknown[];
  futureMessages: { isExample?: boolean }[];
}): NextAction[] {
  const own = input.capsules.filter((c) => !c.isSample && c.status !== "deletion_pending" && c.status !== "archived");
  const actions: NextAction[] = [];
  if (!own.length) {
    actions.push({ id: "create", label: "Start your own capsule", detail: "The samples show what's possible. Yours takes about two minutes.", href: "/app/capsules/new" });
  }
  for (const c of own) {
    const stories = input.memories.filter((m) => m.capsuleId === c.id && !m.deletedAt && m.status !== "declined").length;
    if (!stories) actions.push({ id: `first:${c.id}`, label: `Add the first memory to “${c.title}”`, detail: "One question is enough to begin.", href: `/app/gather?capsule=${c.id}` });
    else if (!input.invitations.some((i) => i.capsuleId === c.id)) actions.push({ id: `invite:${c.id}`, label: `Invite someone to “${c.title}”`, detail: "Contributors are always free. They add what only they remember.", href: `/app/invitations?new=1&capsule=${c.id}` });
    if (!c.cover.mediaId && stories) actions.push({ id: `cover:${c.id}`, label: `Choose a cover photograph for “${c.title}”`, detail: "A portrait or a favourite snapshot.", href: `/app/capsules/${c.id}/edit` });
    if (c.kind === "couple" && !c.keyDates?.length) actions.push({ id: `dates:${c.id}`, label: "Add your anniversary", detail: "We'll show it here as it comes round.", href: `/app/capsules/${c.id}/edit` });
  }
  if (own.length && !input.exportJobs.length) actions.push({ id: "export", label: "Download a copy of your capsules", detail: "A file you keep, independent of us.", href: "/app/preservation" });
  if (own.length && !input.successors.length) actions.push({ id: "successor", label: "Choose who looks after your capsules", detail: "Someone you trust, if you can't one day.", href: "/app/preservation/successor" });
  if (own.length && !input.futureMessages.some((m) => !m.isExample)) actions.push({ id: "letter", label: "Write a letter for the future", detail: "For a birthday, an anniversary, or someday.", href: "/app/future-messages/new" });
  return actions.slice(0, 4);
}

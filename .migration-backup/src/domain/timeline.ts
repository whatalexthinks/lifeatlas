import type { Capsule, FuzzyDate, KeyDate, LifeEvent, Memory } from "@/domain/models";
import { approxYear, decadeOf, sortKey } from "@/lib/dates";

/**
 * The shape of a timeline: decades, the years inside them, milestones placed among the
 * stories, and the memories nobody can date. Pure, so it stays fast and testable with
 * thousands of memories.
 */

export interface Milestone {
  id: string;
  label: string;
  date: FuzzyDate;
  kind: KeyDate["kind"] | LifeEvent["kind"];
}

export type TimelineEntry = { type: "memory"; memory: Memory; key: number } | { type: "milestone"; milestone: Milestone; key: number };

export interface TimelineYear {
  /** null when only the decade is known ("The 1970s"). */
  year: number | null;
  entries: TimelineEntry[];
}

export interface TimelineDecade {
  decade: number;
  years: TimelineYear[];
  count: number;
}

export interface Timeline {
  decades: TimelineDecade[];
  undated: Memory[];
  /** Years that hold at least one memory, for "jump to year". */
  years: number[];
}

/** Milestones worth marking: dated key dates and life events of the people in the capsule. */
export function milestonesFor(capsule: Pick<Capsule, "keyDates" | "subjectPersonId" | "peopleIds">, lifeEvents: LifeEvent[] = []): Milestone[] {
  const out: Milestone[] = [];
  for (const k of capsule.keyDates ?? []) {
    if (!k.year) continue; // an anniversary with no known year has no place on a timeline
    out.push({ id: `kd:${k.id}`, label: k.label, date: { precision: "day", year: k.year, month: k.month, day: k.day }, kind: k.kind });
  }
  const people = new Set([capsule.subjectPersonId, ...(capsule.peopleIds ?? [])].filter(Boolean));
  for (const e of lifeEvents) {
    if (!people.has(e.personId) || approxYear(e.date) === null) continue;
    out.push({ id: `le:${e.id}`, label: e.label, date: e.date, kind: e.kind });
  }
  return out;
}

export function buildTimeline(memories: Memory[], milestones: Milestone[] = []): Timeline {
  const undated: Memory[] = [];
  const entries: (TimelineEntry & { decade: number; year: number | null })[] = [];
  const years = new Set<number>();
  for (const m of memories) {
    const decade = decadeOf(m.date);
    if (decade === null) {
      undated.push(m);
      continue;
    }
    const year = m.date.year ?? null;
    if (year !== null) years.add(year);
    entries.push({ type: "memory", memory: m, key: sortKey(m.date), decade, year });
  }
  for (const ms of milestones) {
    const decade = decadeOf(ms.date);
    if (decade === null) continue;
    // A milestone sorts just before memories of the same moment.
    entries.push({ type: "milestone", milestone: ms, key: sortKey(ms.date) - 1e-6, decade, year: ms.date.year ?? null });
  }
  entries.sort((a, b) => a.key - b.key);

  const byDecade = new Map<number, TimelineDecade>();
  for (const e of entries) {
    let d = byDecade.get(e.decade);
    if (!d) {
      d = { decade: e.decade, years: [], count: 0 };
      byDecade.set(e.decade, d);
    }
    let y = d.years.find((x) => x.year === e.year);
    if (!y) {
      y = { year: e.year, entries: [] };
      d.years.push(y);
    }
    const { decade: _decade, year: _year, ...entry } = e;
    void _decade;
    void _year;
    y.entries.push(entry as TimelineEntry);
    if (e.type === "memory") d.count++;
  }
  const decades = [...byDecade.values()]
    .filter((d) => d.count > 0 || d.years.some((y) => y.entries.length))
    .sort((a, b) => a.decade - b.decade)
    .map((d) => ({ ...d, years: d.years.sort((a, b) => (a.year ?? a.entries[0]?.key ?? 0) - (b.year ?? b.entries[0]?.key ?? 0)) }));
  return { decades, undated, years: [...years].sort((a, b) => a - b) };
}

import { describe, expect, it } from "vitest";
import type { KeyDate } from "@/domain/models";
import { buildSeed } from "@/data/fixtures";
import { chapterProgress, milestoneFor, nextActions, nextOccurrence, upcomingDates, whenLabel } from "./dashboard";

const kd = (over: Partial<KeyDate>): KeyDate => ({ id: "k", label: "Our anniversary", kind: "anniversary", month: 6, day: 16, year: 2001, recurring: true, ...over });
const now = new Date(2026, 9, 14, 15, 30); // 14 October 2026, afternoon

describe("upcoming dates", () => {
  it("finds the next occurrence, counting today", () => {
    expect(nextOccurrence(kd({ month: 10, day: 14 }), now)).toEqual(new Date(2026, 9, 14));
    expect(nextOccurrence(kd({ month: 6, day: 16 }), now)).toEqual(new Date(2027, 5, 16));
    expect(nextOccurrence(kd({ month: 11, day: 26, year: 2026, recurring: false }), now)).toEqual(new Date(2026, 10, 26));
    expect(nextOccurrence(kd({ month: 3, day: 1, year: 2020, recurring: false }), now)).toBeUndefined();
    // A leap-day birthday is marked on the 28th in ordinary years.
    expect(nextOccurrence(kd({ month: 2, day: 29, kind: "birthday" }), now)).toEqual(new Date(2027, 1, 28));
  });

  it("names milestones only when the first year is known", () => {
    expect(milestoneFor(kd({}), new Date(2027, 5, 16))).toBe("26th anniversary");
    expect(milestoneFor(kd({ year: 2015 }), new Date(2026, 5, 16))).toBe("11th anniversary");
    expect(milestoneFor(kd({ year: 2024 }), new Date(2026, 5, 16))).toBe("2nd anniversary");
    expect(milestoneFor(kd({ kind: "birthday", year: 2005 }), new Date(2027, 2, 9))).toBe("turns 22");
    expect(milestoneFor(kd({ kind: "remembrance", year: 2025 }), new Date(2026, 1, 3))).toBe("1 year");
    expect(milestoneFor(kd({ year: undefined }), new Date(2027, 5, 16))).toBeUndefined();
  });

  it("lists the sample family's dates soonest first, within the window", () => {
    const list = upcomingDates(buildSeed().capsules, now, 400);
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list[0]).toMatchObject({ keyDate: { label: "The day we met" }, daysAway: 3, milestone: "28th anniversary" });
    expect(list.map((d) => d.daysAway)).toEqual([...list.map((d) => d.daysAway)].sort((a, b) => a - b));
    expect(upcomingDates(buildSeed().capsules, now, 30).every((d) => d.daysAway <= 30)).toBe(true);
  });

  it("speaks plainly about when", () => {
    expect([0, 1, 5, 21, 90].map(whenLabel)).toEqual(["Today", "Tomorrow", "In 5 days", "In 3 weeks", "In 3 months"]);
  });
});

describe("progress and next steps", () => {
  it("measures chapters begun, not an invented score", () => {
    const db = buildSeed();
    const us = db.capsules.find((c) => c.id === "cap_us")!;
    const p = chapterProgress(us, db.memories);
    expect(p.total).toBe(8);
    expect(p.begun).toBeGreaterThan(2);
    expect(p.stories).toBe(db.memories.filter((m) => m.capsuleId === "cap_us" && m.status === "approved" && !m.deletedAt).length);
  });

  it("suggests starting your own capsule when only samples exist, and stops once it's done", () => {
    const db = buildSeed();
    const base = { capsules: db.capsules, memories: db.memories, invitations: db.invitations, exportJobs: [], successors: [], futureMessages: [] };
    expect(nextActions(base)[0].id).toBe("create");
    const mine = { ...db.capsules[0], id: "cap_mine", title: "For Mia", isSample: false, cover: { layout: "type_only" as const, focalY: 45 } };
    const a = nextActions({ ...base, capsules: [...db.capsules, mine] });
    expect(a.map((x) => x.id)).toEqual(["first:cap_mine", "export", "successor", "letter"]);
    const later = nextActions({ ...base, capsules: [...db.capsules, mine], memories: [...db.memories, { capsuleId: "cap_mine", status: "approved" }], exportJobs: [1], successors: [1], futureMessages: [{}] });
    expect(later.map((x) => x.id)).toEqual(["invite:cap_mine", "cover:cap_mine"]);
  });
});

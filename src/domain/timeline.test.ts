import { describe, expect, it } from "vitest";
import type { Memory } from "@/domain/models";
import { buildSeed } from "@/data/fixtures";
import { buildTimeline, milestonesFor } from "./timeline";

const db = buildSeed();
const us = db.capsules.find((c) => c.id === "cap_us")!;
const usStories = db.memories.filter((m) => m.capsuleId === "cap_us");

describe("timeline", () => {
  it("groups by decade and year, oldest first, with undated memories apart", () => {
    const t = buildTimeline(usStories);
    expect(t.decades.map((d) => d.decade)).toEqual([...t.decades.map((d) => d.decade)].sort((a, b) => a - b));
    const nineties = t.decades.find((d) => d.decade === 1990)!;
    const titles = nineties.years.flatMap((y) => y.entries.map((e) => (e.type === "memory" ? e.memory.title : "")));
    // October's meeting comes before December's first date.
    expect(titles.indexOf("The broken umbrella on Newbury Street")).toBeLessThan(titles.indexOf("Our first date: the bookshop on Charles Street"));
    expect(t.years).toContain(1998);
    const counted = t.decades.reduce((s, d) => s + d.count, 0) + t.undated.length;
    expect(counted).toBe(usStories.length);
  });

  it("places dated key dates as milestones, and skips ones with no year", () => {
    const ms = milestonesFor({ ...us, keyDates: [...(us.keyDates ?? []), { id: "x", label: "No year known", kind: "anniversary", month: 1, day: 1, recurring: true }] });
    expect(ms.map((m) => m.label)).toContain("Our wedding anniversary");
    expect(ms.map((m) => m.label)).not.toContain("No year known");
    const t = buildTimeline(usStories, ms);
    const y2001 = t.decades.find((d) => d.decade === 2000)!.years.find((y) => y.year === 2001)!;
    const first = y2001.entries.findIndex((e) => e.type === "milestone");
    const wedding = y2001.entries.findIndex((e) => e.type === "memory" && e.memory.title === "The wedding in the orchard");
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(wedding);
  });

  it("puts an age with no birth year among the undated, never guessing a year", () => {
    const m = { ...usStories[0], id: "age", date: { precision: "age" as const, age: 12 } } as Memory;
    expect(buildTimeline([m]).undated.map((x) => x.id)).toEqual(["age"]);
    const placed = { ...m, date: { precision: "age" as const, age: 12, year: 1952 } } as Memory;
    expect(buildTimeline([placed]).decades[0].decade).toBe(1950);
  });

  it("stays quick with thousands of memories", () => {
    const many: Memory[] = Array.from({ length: 5000 }, (_, i) => ({ ...usStories[0], id: `m${i}`, date: { precision: "year" as const, year: 1900 + (i % 126) } }));
    const t0 = performance.now();
    const t = buildTimeline(many);
    const ms = performance.now() - t0;
    expect(t.decades.reduce((s, d) => s + d.count, 0)).toBe(5000);
    expect(ms).toBeLessThan(250);
  });
});

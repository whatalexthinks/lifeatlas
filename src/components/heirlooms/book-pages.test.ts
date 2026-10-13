import { describe, expect, it } from "vitest";
import type { BookConfiguration } from "@/domain/models";
import { buildBookPages, orderStories, toSpreads } from "./book-pages";
import { seed } from "@/tests/fixtures";

const d = seed();
const config: BookConfiguration = structuredClone(d.heirlooms.find((h) => h.kind === "book")!.book!);
const memories = d.memories.filter((m) => m.capsuleId === "cap_margaret" && !m.deletedAt);

describe("book layout", () => {
  const pages = buildBookPages(config, memories, d.places);

  it("always has a whole number of 4-page signatures", () => {
    expect(pages.length % 4).toBe(0);
  });

  it("opens every chapter on a right-hand page", () => {
    pages.forEach((p, i) => {
      if (p.kind === "chapter") expect((i + 1) % 2).toBe(1);
    });
  });

  it("lists the true page number of every chapter in the contents", () => {
    const contents = pages.find((p) => p.kind === "contents");
    if (contents?.kind !== "contents") throw new Error("no contents page");
    for (const entry of contents.entries.filter((e) => e.title !== "A timeline")) {
      const page = pages[entry.page - 1];
      expect(page.kind === "chapter" && page.title).toBe(entry.title);
    }
  });

  it("includes every selected story exactly once, in chapter order", () => {
    const starts = pages.filter((p) => p.kind === "story" && p.start).map((p) => (p.kind === "story" ? p.memory.id : ""));
    const expected = orderStories(memories.filter((m) => config.storyIds.includes(m.id)), config.chapterOrder).map((m) => m.id);
    expect(starts).toEqual(expected);
  });

  it("never strands a story's last few words on a page of their own", () => {
    for (const p of pages) {
      if (p.kind === "story" && !p.start) expect(p.paragraphs.join(" ").split(" ").length).toBeGreaterThan(20);
    }
  });

  it("puts the first page alone on the right of the first spread", () => {
    const spreads = toSpreads(pages);
    expect(spreads[0]).toEqual([null, 0]);
    expect(spreads[1]).toEqual([1, 2]);
  });

  it("adds a timeline only when asked", () => {
    expect(pages.some((p) => p.kind === "timeline")).toBe(config.includeTimeline);
    const without = buildBookPages({ ...config, includeTimeline: false }, memories, d.places);
    expect(without.some((p) => p.kind === "timeline")).toBe(false);
  });
});

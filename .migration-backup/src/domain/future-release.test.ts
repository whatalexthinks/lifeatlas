import { describe, expect, it } from "vitest";
import { releaseLabel, releasePhrase } from "./future-release";

describe("how a letter's opening is described", () => {
  it("names milestones in words, using the writer's own note when they gave one", () => {
    expect(releaseLabel({ kind: "milestone", milestone: "first_child", date: "2040-06-01" })).toBe("Birth of a first child");
    expect(releaseLabel({ kind: "milestone", milestone: "anniversary", milestoneNote: "Our 50th anniversary", date: "2041-05-02" })).toBe("Our 50th anniversary");
    expect(releaseLabel({ kind: "milestone", milestone: "anniversary", date: "2041-05-02" })).toBe("An anniversary");
    expect(releaseLabel({ kind: "milestone", milestone: "custom", milestoneNote: "  ", date: "2041-05-02" })).toBe("A milestone");
  });

  it("speaks of a year as a year, not a made-up day", () => {
    expect(releaseLabel({ kind: "year", year: 2045, date: "2045-01-01" })).toBe("In 2045");
    expect(releasePhrase({ kind: "year", year: 2045, date: "2045-01-01" })).toBe("To be opened in 2045");
    expect(releasePhrase({ kind: "date", date: "2046-06-01" })).toBe("To be opened on June 1, 2046");
  });
});

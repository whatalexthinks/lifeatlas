import { describe, expect, it } from "vitest";
import { addYears, approxYear, decadeOf, describeInterval, formatFuzzyDate, isApproximate, sortKey } from "./dates";

describe("formatFuzzyDate", () => {
  it.each([
    [{ precision: "day", year: 1965, month: 6, day: 12 }, "June 12, 1965"],
    [{ precision: "month", year: 1958, month: 9 }, "September 1958"],
    [{ precision: "season", year: 1963, season: "spring" }, "Spring 1963"],
    [{ precision: "year", year: 1975 }, "1975"],
    [{ precision: "circa", year: 1947 }, "Around 1947"],
    [{ precision: "decade", decade: 1950 }, "The 1950s"],
    [{ precision: "unknown" }, "Date unknown"],
    [{ precision: "unknown", note: "the winter Dad broke his arm" }, "the winter Dad broke his arm"],
  ] as const)("formats %o as %s", (d, out) => {
    expect(formatFuzzyDate(d)).toBe(out);
  });
  it("has a short style", () => {
    expect(formatFuzzyDate({ precision: "circa", year: 1947 }, "short")).toBe("c. 1947");
  });
});

describe("ordering and decades", () => {
  it("sorts by approximate year, unknown last", () => {
    const dates = [{ precision: "unknown" as const }, { precision: "decade" as const, decade: 1960 }, { precision: "year" as const, year: 1950 }];
    const sorted = [...dates].sort((a, b) => sortKey(a) - sortKey(b));
    expect(sorted.map((d) => d.precision)).toEqual(["year", "decade", "unknown"]);
  });
  it("places a decade mid-way and buckets years", () => {
    expect(approxYear({ precision: "decade", decade: 1960 })).toBe(1965);
    expect(decadeOf({ precision: "year", year: 1979 })).toBe(1970);
    expect(isApproximate({ precision: "circa", year: 1947 })).toBe(true);
    expect(isApproximate({ precision: "year", year: 1947 })).toBe(false);
  });
});

describe("addYears", () => {
  it("adds whole years", () => {
    expect(addYears("2026-10-13", 20)).toBe("2046-10-13");
  });
  it("clamps Feb 29 to Feb 28 in a non-leap year", () => {
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYears("2028-02-29", 4)).toBe("2032-02-29");
  });
});

describe("describeInterval", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  it("speaks in human terms", () => {
    expect(describeInterval("2026-01-01", now)).toBe("in the past");
    expect(describeInterval("2026-10-20", now)).toBe("in a few weeks");
    expect(describeInterval("2046-10-13", now)).toBe("in about 20 years");
  });
});

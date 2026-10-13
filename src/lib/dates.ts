import type { FuzzyDate, LifeStage, Season } from "@/domain/models";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const lifeStageLabels: Record<LifeStage, string> = {
  early_childhood: "Early childhood",
  childhood: "Childhood",
  teenage_years: "Teenage years",
  young_adulthood: "Young adulthood",
  early_family_years: "Early family years",
  middle_years: "Middle years",
  later_years: "Later years",
  recent_years: "Recent years",
};

const SEASON_LABEL: Record<Season, string> = { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };
const SEASON_MONTH: Record<Season, number> = { winter: 1, spring: 4, summer: 7, autumn: 10 };

/** Human display for any level of certainty. Never invents precision. */
export function formatFuzzyDate(d: FuzzyDate | undefined, style: "long" | "short" = "long"): string {
  if (!d) return "Date unknown";
  switch (d.precision) {
    case "day":
      if (d.year && d.month && d.day) {
        return style === "short" ? `${MONTHS[d.month - 1].slice(0, 3)} ${d.day}, ${d.year}` : `${MONTHS[d.month - 1]} ${d.day}, ${d.year}`;
      }
      break;
    case "month":
      if (d.year && d.month) return style === "short" ? `${MONTHS[d.month - 1].slice(0, 3)} ${d.year}` : `${MONTHS[d.month - 1]} ${d.year}`;
      break;
    case "season":
      if (d.year && d.season) return `${SEASON_LABEL[d.season]} ${d.year}`;
      break;
    case "year":
      if (d.year) return String(d.year);
      break;
    case "circa":
      if (d.year) return style === "short" ? `c. ${d.year}` : `Around ${d.year}`;
      break;
    case "decade":
      if (d.decade !== undefined) return `The ${d.decade}s`;
      break;
    case "life_stage":
      if (d.lifeStage) return lifeStageLabels[d.lifeStage];
      break;
    case "unknown":
      return d.note ? d.note : "Date unknown";
  }
  return "Date unknown";
}

/** A sortable approximate year, or null when the date is genuinely unknown. */
export function approxYear(d: FuzzyDate | undefined): number | null {
  if (!d) return null;
  if (d.year) return d.year;
  if (d.decade !== undefined) return d.decade + 5;
  return null;
}

/** Fractional sort key, so "June 1965" sorts after "Spring 1965". */
export function sortKey(d: FuzzyDate | undefined): number {
  const y = approxYear(d);
  if (y === null) return Number.POSITIVE_INFINITY;
  let month = 6.5;
  if (d?.month) month = d.month + (d.day ? d.day / 31 : 0.5);
  else if (d?.season) month = SEASON_MONTH[d.season];
  return y + month / 13;
}

export function decadeOf(d: FuzzyDate | undefined): number | null {
  const y = approxYear(d);
  return y === null ? null : Math.floor(y / 10) * 10;
}

export function isApproximate(d: FuzzyDate | undefined) {
  return !d || ["circa", "decade", "life_stage", "unknown", "season"].includes(d.precision);
}

/** Add years safely, clamping Feb 29 → Feb 28 when needed. Returns YYYY-MM-DD. */
export function addYears(fromIso: string, years: number): string {
  const [y, m, d] = fromIso.slice(0, 10).split("-").map(Number);
  const targetYear = y + years;
  const lastDay = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${targetYear}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function yearsUntil(dateIso: string, now = new Date()) {
  const ms = new Date(`${dateIso}T12:00:00Z`).getTime() - now.getTime();
  return ms / (365.25 * 86400 * 1000);
}

export function describeInterval(dateIso: string, now = new Date()) {
  const y = yearsUntil(dateIso, now);
  if (y < 0) return "in the past";
  if (y < 1 / 12) return "in a few weeks";
  if (y < 1) return `in about ${Math.max(1, Math.round(y * 12))} months`;
  const r = Math.round(y);
  return `in about ${r} ${r === 1 ? "year" : "years"}`;
}

/** Parse a loose user year range input like "1965", "c. 1972", "1960s". */
export function parseLooseYear(input: string): FuzzyDate | null {
  const s = input.trim().toLowerCase();
  if (!s) return { precision: "unknown" };
  const decade = s.match(/^(1[89]|20)(\d)0'?s$/);
  if (decade) return { precision: "decade", decade: Number(`${decade[1]}${decade[2]}0`) };
  const circa = s.match(/^(?:c\.?|ca\.?|circa|around|about)\s*(\d{4})$/);
  if (circa) return { precision: "circa", year: Number(circa[1]) };
  const year = s.match(/^(\d{4})$/);
  if (year) return { precision: "year", year: Number(year[1]) };
  return null;
}

export { MONTHS };

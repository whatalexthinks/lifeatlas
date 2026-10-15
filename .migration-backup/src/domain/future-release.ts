import type { FutureReleasePolicy } from "@/domain/models";
import { formatDate } from "@/lib/utils";

export type Milestone = NonNullable<FutureReleasePolicy["milestone"]>;

/** The occasions a letter can wait for. `age` lets a birth year estimate the date. */
export const milestones: { value: Milestone; label: string; age?: number; askNote?: string }[] = [
  { value: "18th_birthday", label: "18th birthday", age: 18 },
  { value: "21st_birthday", label: "21st birthday", age: 21 },
  { value: "30th_birthday", label: "30th birthday", age: 30 },
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding day" },
  { value: "anniversary", label: "An anniversary", askNote: "Which anniversary? e.g. Our 50th" },
  { value: "first_child", label: "Birth of a first child" },
  { value: "custom", label: "Another milestone", askNote: "Describe it" },
];

/** "To be opened in 2045", "To be opened on June 1, 2046", "To be opened · Wedding day". */
export function releasePhrase(release: Parameters<typeof releaseLabel>[0]) {
  const label = releaseLabel(release);
  if (release.kind === "milestone") return `To be opened · ${label}`;
  if (release.kind === "year") return `To be opened ${label.toLowerCase()}`;
  return `To be opened on ${label}`;
}

/** How a letter's opening reads to people: "18th birthday", "Our 50th anniversary", "In 2045". */
export function releaseLabel(release: Pick<FutureReleasePolicy, "kind" | "date" | "milestone" | "milestoneNote" | "year">) {
  if (release.kind === "milestone" && release.milestone) {
    const m = milestones.find((x) => x.value === release.milestone);
    if (m?.askNote) return release.milestoneNote?.trim() || (release.milestone === "anniversary" ? "An anniversary" : "A milestone");
    return m?.label ?? "A milestone";
  }
  if (release.kind === "year") return `In ${release.year ?? release.date.slice(0, 4)}`;
  return formatDate(release.date, "long");
}

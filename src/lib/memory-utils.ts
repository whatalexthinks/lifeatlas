import type { Memory, Place } from "@/domain/models";
import type { MapPoint } from "@/components/map/memory-map";
import { approxYear, sortKey } from "./dates";

/** Museum-style catalogue number, stable per capsule order: "No. 009". */
export function catalogNumber(memory: Memory, ordered: Memory[]) {
  const i = ordered.findIndex((m) => m.id === memory.id);
  return `No. ${String(i + 1).padStart(3, "0")}`;
}

export function placesToPoints(memories: Memory[], places: Place[]): MapPoint[] {
  const byPlace = new Map<string, Memory[]>();
  for (const m of memories) {
    if (!m.placeId) continue;
    const arr = byPlace.get(m.placeId) ?? [];
    arr.push(m);
    byPlace.set(m.placeId, arr);
  }
  const out: MapPoint[] = [];
  for (const [placeId, ms] of byPlace) {
    const p = places.find((x) => x.id === placeId);
    if (!p || p.visibility === "hidden") continue;
    const years = ms.map((m) => approxYear(m.date)).filter((y): y is number => y !== null);
    out.push({ id: p.id, label: p.name, lat: p.point.lat, lng: p.point.lng, count: ms.length, firstYear: years.length ? Math.min(...years) : null });
  }
  return out;
}

/** Chronological place sequence for "journey through a life" (deduplicated runs). */
export function journeyOrder(memories: Memory[]) {
  const ordered = [...memories].filter((m) => m.placeId).sort((a, b) => sortKey(a.date) - sortKey(b.date));
  const seq: string[] = [];
  for (const m of ordered) if (seq[seq.length - 1] !== m.placeId) seq.push(m.placeId!);
  return seq;
}

export function decadesOf(memories: Memory[]) {
  const set = new Set<number>();
  for (const m of memories) {
    const y = approxYear(m.date);
    if (y !== null) set.add(Math.floor(y / 10) * 10);
  }
  return [...set].sort((a, b) => a - b);
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

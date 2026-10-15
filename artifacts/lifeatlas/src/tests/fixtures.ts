import type { Memory } from "@/domain/models";
import { buildSeed } from "@/data/fixtures";

/** A fresh, isolated sample database for each test. */
export const seed = () => buildSeed(new Date("2026-10-13T12:00:00.000Z"));

/** A real fixture memory with overrides, keeps tests honest about the model's shape. */
export function memory(overrides: Partial<Memory> = {}): Memory {
  const base = seed().memories.find((m) => m.status === "approved" && m.privacy === "family")!;
  return { ...base, ...overrides, consent: { ...base.consent, ...overrides.consent }, attribution: { ...base.attribution, ...overrides.attribution } };
}

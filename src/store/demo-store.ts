"use client";

import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { AnalyticsEventName, AuditEvent, DemoDatabase } from "@/domain/models";
import { buildSeed, SCHEMA_VERSION } from "@/data/fixtures";
import { clearAll, idbAvailable, isQuotaError, loadState, saveState } from "@/lib/storage/idb";
import { uid } from "@/lib/utils";

export type PersistenceMode = "pending" | "indexeddb" | "memory" | "error";

interface DemoStore {
  db: DemoDatabase;
  hydrated: boolean;
  persistence: PersistenceMode;
  lastSavedAt?: string;
  saveError?: string;
  /** Apply a mutation with immer. Optionally append an audit event. */
  mutate: (recipe: (draft: Draft<DemoDatabase>) => void, audit?: Omit<AuditEvent, "id" | "at">) => void;
  track: (name: AnalyticsEventName, properties?: Record<string, string | number | boolean>) => void;
  hydrate: () => Promise<void>;
  reset: () => Promise<void>;
}

/** Deterministic seed for the server render; the client hydrates from IndexedDB. */
const INITIAL = buildSeed(new Date("2026-10-13T12:00:00.000Z"));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useDemoStore = create<DemoStore>()((set, get) => ({
  db: INITIAL,
  hydrated: false,
  persistence: "pending",

  mutate: (recipe, audit) => {
    const next = produce(get().db, (draft) => {
      recipe(draft);
      if (audit) {
        draft.auditEvents.unshift({ id: uid("aud"), at: new Date().toISOString(), ...audit });
        if (draft.auditEvents.length > 300) draft.auditEvents.length = 300;
      }
    });
    set({ db: next });
    scheduleSave();
  },

  track: (name, properties) => {
    get().mutate((d) => {
      d.analytics.unshift({ id: uid("evt"), name, at: new Date().toISOString(), properties, destination: "local_only" });
      if (d.analytics.length > 500) d.analytics.length = 500;
    });
  },

  hydrate: async () => {
    if (get().hydrated) return;
    if (!idbAvailable()) {
      set({ hydrated: true, persistence: "memory" });
      return;
    }
    try {
      const stored = await loadState();
      if (stored && stored.schemaVersion === SCHEMA_VERSION) {
        set({ db: withNewFields(stored), hydrated: true, persistence: "indexeddb" });
      } else {
        const fresh = buildSeed();
        set({ db: fresh, hydrated: true, persistence: "indexeddb" });
        await saveState(fresh);
      }
    } catch (e) {
      set({ hydrated: true, persistence: "memory", saveError: describeError(e) });
    }
  },

  reset: async () => {
    const fresh = buildSeed();
    try {
      if (idbAvailable()) {
        await clearAll();
        await saveState(fresh);
      }
      set({ db: fresh, saveError: undefined, lastSavedAt: new Date().toISOString() });
    } catch (e) {
      set({ db: fresh, saveError: describeError(e) });
    }
  },
}));

/**
 * Forward-compatible load: collections added after a device first saved its data are
 * filled in empty, so new features never require wiping someone's archive.
 */
function withNewFields(stored: DemoDatabase): DemoDatabase {
  const fresh = buildSeed() as unknown as Record<string, unknown>;
  const out = { ...stored } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(fresh)) if (!(k in out)) out[k] = Array.isArray(v) ? [] : v;
  return out as unknown as DemoDatabase;
}

function describeError(e: unknown) {
  if (isQuotaError(e)) return "This device is out of storage space for LifeAtlas. Remove a recording or download your archive, then try again.";
  if (e instanceof Error) return e.message;
  return "Could not save on this device.";
}

function scheduleSave() {
  const { persistence } = useDemoStore.getState();
  if (persistence === "memory" || typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    const { db, hydrated } = useDemoStore.getState();
    if (!hydrated) return;
    try {
      await saveState(db);
      useDemoStore.setState({ lastSavedAt: new Date().toISOString(), saveError: undefined, persistence: "indexeddb" });
    } catch (e) {
      useDemoStore.setState({ saveError: describeError(e), persistence: "error" });
    }
  }, 220);
}

/** Flush pending writes immediately (used before navigation-critical moments). */
export async function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const { db, hydrated, persistence } = useDemoStore.getState();
  if (!hydrated || persistence === "memory" || !idbAvailable()) return;
  await saveState(db);
  useDemoStore.setState({ lastSavedAt: new Date().toISOString() });
}

/** Write only if a debounced save is still waiting — used when the tab is hidden or closing. */
export function flushPendingSave() {
  if (saveTimer) void flushSave().catch(() => undefined);
}

export const getDb = () => useDemoStore.getState().db;

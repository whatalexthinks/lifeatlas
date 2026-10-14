"use client";

import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { AnalyticsEventName, AuditEvent, DemoDatabase } from "@/domain/models";
import { buildSeed, SCHEMA_VERSION } from "@/data/fixtures";
import { CATALOG_VERSION } from "@/data/product-catalog";
import { clearAll, idbAvailable, isQuotaError, loadState, saveState } from "@/lib/storage/idb";
import { uid } from "@/lib/utils";
import { brand } from "@/config/brand";

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
  const seed = buildSeed();
  const fresh = seed as unknown as Record<string, unknown>;
  const out = { ...stored } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(fresh)) if (!(k in out)) out[k] = Array.isArray(v) && k !== "promotions" ? [] : v;
  const db = out as unknown as DemoDatabase;
  // A new catalog replaces an older saved one (operations' local price edits included),
  // so nobody keeps seeing products or prices that no longer exist.
  if (db.catalogVersion !== CATALOG_VERSION) {
    db.catalog = seed.catalog;
    db.catalogVersion = CATALOG_VERSION;
    const known = new Set(seed.catalog.map((p) => p.id));
    db.subscriptions = db.subscriptions.filter((s) => known.has(s.productId));
    if (!db.subscriptions.length) db.subscriptions = seed.subscriptions;
  }
  return db;
}

/** Plain-language storage problems — never a raw browser error. Exported for tests. */
export function describeError(e: unknown) {
  if (isQuotaError(e)) return `This device is out of storage space for ${brand.name}. Remove a recording or download your archive, then try again.`;
  const name = e instanceof DOMException || e instanceof Error ? e.name : "";
  if (name === "SecurityError" || name === "NotAllowedError") return `This browser is blocking ${brand.name} from saving — usually a private window or a setting that blocks site data.`;
  if (name === "InvalidStateError" || name === "UnknownError" || name === "AbortError" || name === "TransactionInactiveError") return "This browser's storage stopped responding. Your earlier changes are safe; reload the page and try again.";
  if (name === "VersionError") return `${brand.name} is open in another tab with a different version. Close the other tab and reload.`;
  return `${brand.name} couldn't save on this device just now. Your earlier changes are safe; try again in a moment.`;
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
  try {
    await saveState(db);
    useDemoStore.setState({ lastSavedAt: new Date().toISOString(), saveError: undefined, persistence: "indexeddb" });
  } catch (e) {
    useDemoStore.setState({ saveError: describeError(e), persistence: "error" });
    throw e;
  }
}

/** Write only if a debounced save is still waiting — used when the tab is hidden or closing. */
export function flushPendingSave() {
  if (saveTimer) void flushSave().catch(() => undefined);
}

export const getDb = () => useDemoStore.getState().db;

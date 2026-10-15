import { openDB, type IDBPDatabase } from "idb";
import type { DemoDatabase } from "@/domain/models";

/**
 * Local demonstration persistence.
 * - `state`: the structured DemoDatabase snapshot (JSON-safe).
 * - `blobs`: user media (recordings, photos) as Blobs — never in localStorage.
 * Data stays in THIS browser on THIS device. It is not encrypted by OurLifeCapsule
 * and it is not backed up.
 */

const DB_NAME = "lifeatlas-demo";
const DB_VERSION = 1;

export interface StoredBlob {
  key: string;
  blob: Blob;
  mime: string;
  size: number;
  createdAt: string;
}

type Schema = {
  state: { key: string; value: DemoDatabase };
  blobs: { key: string; value: StoredBlob };
};

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

export function idbAvailable() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function db() {
  if (!idbAvailable()) return Promise.reject(new Error("IndexedDB is not available in this browser."));
  dbPromise ??= openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("state")) d.createObjectStore("state");
      if (!d.objectStoreNames.contains("blobs")) d.createObjectStore("blobs");
    },
    blocked() {
      // Another tab holds an older version open; the next reload resolves it.
    },
  });
  return dbPromise;
}

export async function loadState(): Promise<DemoDatabase | null> {
  const d = await db();
  return (await d.get("state", "db")) ?? null;
}

export async function saveState(state: DemoDatabase): Promise<void> {
  const d = await db();
  await d.put("state", state, "db");
}

export async function putBlob(key: string, blob: Blob): Promise<StoredBlob> {
  const d = await db();
  const rec: StoredBlob = { key, blob, mime: blob.type, size: blob.size, createdAt: new Date().toISOString() };
  await d.put("blobs", rec, key);
  return rec;
}

export async function getBlob(key: string): Promise<Blob | null> {
  const d = await db();
  return (await d.get("blobs", key))?.blob ?? null;
}

export async function deleteBlob(key: string): Promise<void> {
  const d = await db();
  await d.delete("blobs", key);
}

export async function listBlobs(): Promise<{ key: string; size: number; mime: string; createdAt: string }[]> {
  const d = await db();
  const all = await d.getAll("blobs");
  return all.map(({ key, size, mime, createdAt }) => ({ key, size, mime, createdAt }));
}

export async function clearAll(): Promise<void> {
  const d = await db();
  const tx = d.transaction(["state", "blobs"], "readwrite");
  await Promise.all([tx.objectStore("state").clear(), tx.objectStore("blobs").clear(), tx.done]);
}

export async function storageEstimate(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
  return { usage: est.usage ?? 0, quota: est.quota ?? 0, persisted };
}

/** Ask the browser not to evict this site's storage. The browser may decline. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export function isQuotaError(e: unknown) {
  return e instanceof DOMException && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

/** Test helper. */
export function __resetIdbForTests() {
  dbPromise = null;
}

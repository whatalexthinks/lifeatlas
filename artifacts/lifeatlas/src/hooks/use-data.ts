"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Capsule, DemoDatabase, MediaAsset, Memory, Place, Role } from "@/domain/models";
import { canViewMemory, roleFor } from "@/domain/policies/permissions";
import { sortKey } from "@/lib/dates";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";

/**
 * Read hooks — the "repository read" side of the data layer.
 * In Part Two these become query hooks over the real API; screens don't change.
 */

export function useDb<T>(selector: (db: DemoDatabase) => T): T {
  return useDemoStore((s) => selector(s.db));
}

export function useHydrated() {
  return useDemoStore((s) => s.hydrated);
}

export function usePersistence() {
  return useDemoStore(useShallow((s) => ({ mode: s.persistence, lastSavedAt: s.lastSavedAt, error: s.saveError })));
}

export function useCapsules() {
  return useDb((d) => d.capsules);
}

export function useCapsule(id: string | undefined): Capsule | undefined {
  const capsules = useDb((d) => d.capsules);
  return useMemo(() => capsules.find((c) => c.id === id), [capsules, id]);
}

export function usePersona() {
  const personas = useDb((d) => d.personas);
  const active = useDb((d) => d.activePersonaId);
  return useMemo(() => personas.find((p) => p.id === active) ?? personas[0], [personas, active]);
}

export function useRole(capsuleId: string | undefined): Role | null {
  const persona = usePersona();
  const memberships = useDb((d) => d.memberships);
  return capsuleId ? roleFor(persona, capsuleId, memberships) : null;
}

export interface MemoryQuery {
  /** "viewer" = what the active persona may see in the capsule viewer. "studio" = everything not deleted. */
  scope?: "viewer" | "studio" | "deleted" | "all";
  chapter?: string;
  decade?: number;
  placeId?: string;
  personId?: string;
  type?: "photo" | "audio" | "text";
  search?: string;
  status?: Memory["status"];
}

export function useCapsuleMemories(capsuleId: string | undefined, q: MemoryQuery = {}) {
  const memories = useDb((d) => d.memories);
  const persona = usePersona();
  const role = useRole(capsuleId);
  const { scope = "studio", chapter, decade, placeId, personId, type, search, status } = q;
  return useMemo(() => {
    if (!capsuleId) return [];
    const term = search?.trim().toLowerCase();
    return memories
      .filter((m) => m.capsuleId === capsuleId)
      .filter((m) => {
        if (scope === "deleted") return !!m.deletedAt;
        if (scope === "all") return true;
        if (m.deletedAt) return false;
        if (scope === "viewer") return m.status === "approved" && canViewMemory(m, role, persona?.personId);
        // Studio: everything the person may see, drafts and reviews included. (Who may open the
        // studio at all is decided by the studio shell; the operations identity has no role.)
        return role === null || canViewMemory(m, role, persona?.personId);
      })
      .filter((m) => !chapter || m.chapter === chapter)
      .filter((m) => decade === undefined || Math.floor(((m.date.year ?? m.date.decade ?? -1) as number) / 10) * 10 === decade)
      .filter((m) => !placeId || m.placeId === placeId)
      .filter((m) => !personId || m.peopleIds.includes(personId) || m.attribution.personId === personId)
      .filter((m) => !status || m.status === status)
      .filter((m) => !type || (type === "photo" ? m.photoIds.length > 0 : type === "audio" ? !!m.audioId : m.photoIds.length === 0 && !m.audioId))
      .filter((m) => !term || `${m.title} ${m.narrative} ${m.tags.join(" ")} ${m.attribution.displayName}`.toLowerCase().includes(term))
      .sort((a, b) => sortKey(a.date) - sortKey(b.date));
  }, [memories, capsuleId, scope, chapter, decade, placeId, personId, type, search, status, role, persona]);
}

export function useMemory(id: string | undefined) {
  const memories = useDb((d) => d.memories);
  return useMemo(() => memories.find((m) => m.id === id), [memories, id]);
}

export function useMediaAsset(id: string | undefined): MediaAsset | undefined {
  const media = useDb((d) => d.media);
  return useMemo(() => media.find((m) => m.id === id), [media, id]);
}

export function usePlace(id: string | undefined): Place | undefined {
  const places = useDb((d) => d.places);
  return useMemo(() => places.find((p) => p.id === id), [places, id]);
}

export function usePeople() {
  return useDb((d) => d.people);
}

/** Resolve a media asset to a displayable URL (static path, plate data URI, or object URL). */
export function useMediaUrl(asset: MediaAsset | undefined) {
  const [state, setState] = useState<{ url: string | null; error: string | null; key?: string }>({ url: null, error: null });
  const key = asset ? `${asset.id}:${asset.source.kind === "local" ? asset.source.blobKey : ""}` : undefined;
  useEffect(() => {
    let cancelled = false;
    if (!asset) return;
    services()
      .media.resolveUrl(asset)
      .then((r) => {
        if (cancelled) return;
        if (r.status === "ok") setState({ url: r.data, error: null, key });
        else setState({ url: null, error: r.message, key });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!asset) return { url: null, error: null, loading: false };
  // Static & plate URLs resolve synchronously in effect; show loading until first resolve.
  const stale = state.key !== key;
  return { url: stale ? null : state.url, error: stale ? null : state.error, loading: stale };
}

export function useUnreadNotifications() {
  const n = useDb((d) => d.notifications);
  return useMemo(() => n.filter((x) => !x.read).length, [n]);
}

export function usePendingReviewCount(capsuleId?: string) {
  const memories = useDb((d) => d.memories);
  return useMemo(
    () => memories.filter((m) => !m.deletedAt && (m.status === "submitted" || m.status === "under_review") && (!capsuleId || m.capsuleId === capsuleId)).length,
    [memories, capsuleId],
  );
}

"use client";

import { useDemoStore } from "@/store/demo-store";
import type { DemoDatabase, Notification } from "@/domain/models";
import { uid } from "@/lib/utils";

export const store = () => useDemoStore.getState();
export const db = (): DemoDatabase => useDemoStore.getState().db;

/** Small, realistic latency so loading states are exercised. Disabled in tests. */
export async function latency(ms = 140) {
  if (process.env.NODE_ENV === "test" || process.env.NEXT_PUBLIC_DEMO_LATENCY === "0") return;
  await new Promise((r) => setTimeout(r, ms));
}

export function activePersona() {
  const d = db();
  return d.personas.find((p) => p.id === d.activePersonaId) ?? d.personas[0];
}

export function actorName() {
  return activePersona()?.name ?? "Someone";
}

export function pushNotification(n: Omit<Notification, "id" | "at" | "read">) {
  store().mutate((d) => {
    d.notifications.unshift({ id: uid("ntf"), at: new Date().toISOString(), read: false, ...n });
    if (d.notifications.length > 100) d.notifications.length = 100;
  });
}

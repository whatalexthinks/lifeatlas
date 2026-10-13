"use client";

import type { PreservationStatus } from "@/domain/models";
import { searchGazetteer } from "@/data/gazetteer";
import { sha256Hex, uid } from "@/lib/utils";
import { contactSchema, successorSchema } from "@/domain/schemas";
import {
  fail,
  notConfigured,
  ok,
  type AccountRepository,
  type AnalyticsProvider,
  type AuthProvider,
  type GeocodingProvider,
  type PreservationProvider,
  type SupportProvider,
} from "../contracts";
import { mockMedia } from "./media";
import { actorName, activePersona, db, latency, pushNotification, store } from "./shared";

export const mockAuth: AuthProvider = {
  async getSession() {
    const p = activePersona();
    return ok({ userId: db().account.user.id, personaId: p.id, persona: p, assurance: "simulated" });
  },
  async switchPersona(personaId) {
    const p = db().personas.find((x) => x.id === personaId);
    if (!p) return fail("not_found", "Unknown demo identity.");
    store().mutate((d) => {
      d.activePersonaId = personaId;
    }, { actor: p.name, action: "demo.persona_switched", detail: "Simulated — not a sign-in" });
    return ok({ userId: db().account.user.id, personaId, persona: p, assurance: "simulated" });
  },
  async signInWithEmail() {
    return notConfigured("auth", "Secure sign-in arrives with real accounts. In this preview, use the demo identity switcher.");
  },
  async enrollMfa() {
    return notConfigured("auth", "Multi-factor authentication will be available with real accounts.");
  },
  async signOut() {
    return notConfigured("auth", "There's no real session to sign out of in this preview.");
  },
};

export const mockAccount: AccountRepository = {
  async getProfile() {
    return ok(db().account.profile);
  },
  async updateProfile(patch) {
    await latency();
    store().mutate((d) => {
      Object.assign(d.account.profile, patch);
    }, { actor: actorName(), action: "account.profile_updated" });
    return ok(db().account.profile);
  },
  async updatePreferences(patch) {
    store().mutate((d) => {
      Object.assign(d.account.preferences, patch);
    });
    return ok(db().account.preferences);
  },
  async requestAccountDeletion() {
    return notConfigured("account", "Real account deletion arrives with real accounts. To remove everything from this demo now, use “Erase demo data on this device”.");
  },
};

export const mockGeocoding: GeocodingProvider = {
  async search(query) {
    await latency(90);
    return ok({ results: searchGazetteer(query), source: "built_in_list" });
  },
  tileStyle() {
    return ok({ kind: "offline_vector", attribution: "Coastlines and borders: Natural Earth (public domain), via world-atlas." });
  },
};

export const mockPreservation: PreservationProvider = {
  async status(capsuleId) {
    await latency(120);
    const last = db().integrityChecks.find((c) => c.capsuleId === capsuleId);
    const s: PreservationStatus = {
      capsuleId,
      mode: "demo_local_only",
      primary: "unconfigured",
      secondary: "unconfigured",
      lastIntegrityCheck: last,
      explanation:
        "Storage and backups are not connected in this preview. Your stories live only in this browser on this device. Do not rely on this demo to preserve irreplaceable files — download a copy.",
    };
    return ok(s);
  },

  async runLocalIntegrityCheck(capsuleId) {
    const d = db();
    const memIds = new Set(d.memories.filter((m) => m.capsuleId === capsuleId && !m.deletedAt).flatMap((m) => [...m.photoIds, ...(m.audioId ? [m.audioId] : [])]));
    const assets = d.media.filter((a) => memIds.has(a.id) && a.checksum && (a.source.kind === "local" || a.source.kind === "static"));
    const details: { id: string; ok: boolean; reason?: string }[] = [];
    for (const a of assets) {
      const r = await mockMedia.getBlob(a);
      if (r.status !== "ok") {
        details.push({ id: a.id, ok: false, reason: "File missing" });
        continue;
      }
      const sha = await sha256Hex(await r.data.arrayBuffer());
      details.push(sha === a.checksum ? { id: a.id, ok: true } : { id: a.id, ok: false, reason: "Checksum mismatch" });
    }
    const mismatches = details.filter((x) => !x.ok).length;
    const check = {
      id: uid("ic"),
      capsuleId,
      at: new Date().toISOString(),
      scope: "local_device" as const,
      filesChecked: details.length,
      mismatches,
      result: (mismatches === 0 ? "passed" : details.length > mismatches ? "partial" : "failed") as "passed" | "partial" | "failed",
    };
    store().mutate((x) => {
      x.integrityChecks.unshift(check);
      if (x.integrityChecks.length > 30) x.integrityChecks.length = 30;
    }, { actor: actorName(), action: "preservation.local_integrity_check", target: capsuleId, detail: `${details.length} files, ${mismatches} problems` });
    return ok({ ...check, details });
  },

  async runRestoreTest() {
    return notConfigured("preservation", "Restore drills need connected backup storage, which isn't part of this preview.");
  },

  async saveSuccessor(input) {
    const parsed = successorSchema.safeParse(input);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the details.");
    await latency();
    const s = { id: uid("suc"), ...parsed.data, contact: parsed.data.contact || undefined, status: "draft" as const, createdAt: new Date().toISOString() };
    store().mutate((d) => {
      d.successors = [s, ...d.successors.filter((x) => x.name !== s.name)];
    }, { actor: actorName(), action: "successor.designated_demo", detail: s.name });
    return ok(s);
  },

  async removeSuccessor(id) {
    const s = db().successors.find((x) => x.id === id);
    if (!s) return fail("not_found", "That successor isn't on this device.");
    store().mutate((d) => {
      d.successors = d.successors.filter((x) => x.id !== id);
    }, { actor: actorName(), action: "successor.removed_demo", detail: s.name });
    return ok(null);
  },
};

export const mockAnalytics: AnalyticsProvider = {
  track(name, properties) {
    store().track(name, properties);
  },
};

export const mockSupport: SupportProvider = {
  async create(input) {
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the form.");
    await latency(220);
    const req = {
      id: uid("sup"),
      createdAt: new Date().toISOString(),
      from: parsed.data.name,
      topic: parsed.data.topic,
      subject: parsed.data.message.slice(0, 60),
      body: parsed.data.message,
      status: "new_demo" as const,
      isSample: false,
    };
    store().mutate((d) => {
      d.supportRequests.unshift(req);
    });
    pushNotification({ kind: "system", title: "Message saved on this device", body: "Support messages aren't sent from this preview. It appears in the operations inbox demo.", href: "/demo/operations#support" });
    return ok(req);
  },
  async setStatus(id, status) {
    store().mutate((d) => {
      const r = d.supportRequests.find((x) => x.id === id);
      if (r) r.status = status;
    });
    const r = db().supportRequests.find((x) => x.id === id);
    return r ? ok(r) : fail("not_found", "Request not found.");
  },
};

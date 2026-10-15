"use client";

import type { Capsule, CapsuleKind, ChapterKey, Memory, MemoryRevision, Person, Place, Relationship } from "@/domain/models";
import { callName, capsuleKind, capsuleKinds } from "@/domain/capsule-kinds";
import { capsuleAllowance, countOwnedCapsules, currentPlanId } from "@/domain/commerce/plans";
import { roleLabels } from "@/domain/policies/permissions";
import { capsuleTransitions, canTransition, memoryTransitions } from "@/domain/workflows/state-machines";
import { memoryFormSchema } from "@/domain/schemas";
import { defaultChapterOrder } from "@/data/chapters";
import { searchGazetteer } from "@/data/gazetteer";
import { formatFuzzyDate } from "@/lib/dates";
import { uid } from "@/lib/utils";
import { fail, ok, type CapsuleRepository } from "../contracts";
import { actorName, db, latency, pushNotification, store } from "./shared";

/** Splits "Margaret Ellis" into the parts a person record keeps. */
const nameParts = (name: string) => {
  const [given, ...rest] = name.trim().split(/\s+/);
  return { givenName: given ?? "", familyName: rest.join(" ") };
};

/** The older relationship field, kept for screens that still read it. Derived, never asked twice. */
function legacyRelationshipKind(kind: CapsuleKind, relationship: string): Capsule["relationshipKind"] {
  if (kind !== "parent") return capsuleKinds[kind].relationshipKind;
  if (/grand|nana|nan\b|gran|opa|oma|abuela|abuelo/i.test(relationship)) return "grandparent";
  if (/father|dad|papa|pop/i.test(relationship)) return "father";
  return "mother";
}

export const mockCapsules: CapsuleRepository = {
  async createFromWizard(v) {
    const d0 = db();
    const persona = d0.personas.find((p) => p.id === d0.activePersonaId);
    const ownerPersonId = persona?.personId ?? "per_sarah";
    if (!v.includedWithGift) {
      const allowance = capsuleAllowance(currentPlanId(d0.subscriptions, d0.catalog), countOwnedCapsules(d0.capsules, ownerPersonId));
      if (!allowance.allowed) return fail("forbidden", allowance.reason ?? "Your plan has no room for another capsule.");
    }
    await latency(260);
    const now = new Date().toISOString();
    const id = uid("cap");
    let birthplaceId: string | undefined;
    let birthplaceLabel: string | undefined;
    if (v.birthplace) {
      const match = searchGazetteer(v.birthplace, 1)[0];
      if (match && match.locality.toLowerCase() === v.birthplace.split(",")[0].trim().toLowerCase()) {
        const existing = db().places.find((p) => p.locality === match.locality && p.country === match.country);
        if (existing) birthplaceId = existing.id;
        else {
          birthplaceId = uid("pl");
          const place: Place = {
            id: birthplaceId,
            name: match.name,
            locality: match.locality,
            region: match.region,
            country: match.country,
            countryCode: match.countryCode,
            point: { lat: match.lat, lng: match.lng },
            precision: "city",
            visibility: "family",
            source: "manual",
          };
          store().mutate((d) => {
            d.places.push(place);
          });
        }
      } else birthplaceLabel = v.birthplace;
    }
    const kind = v.kind ?? capsuleKind({ relationshipKind: v.relationshipKind });
    const config = capsuleKinds[kind];
    const name = v.subjectName.trim();
    const birthYear = typeof v.birthYear === "number" ? v.birthYear : undefined;

    // The people this capsule is about become person records — a partner, a parent, a
    // child — so they can be tagged in stories and appear in the family directory.
    const people: Person[] = [];
    const relationships: Relationship[] = [];
    let subjectPersonId: string | undefined;
    const person = (displayName: string, extra: Partial<Person> = {}): Person => ({ id: uid("per"), displayName, ...nameParts(displayName), isSample: false, createdAt: now, updatedAt: now, ...extra });
    if (kind === "personal") subjectPersonId = ownerPersonId;
    else if (kind === "couple" && v.partnerName?.trim()) {
      const partner = person(v.partnerName.trim(), { shortBio: v.relationship.trim() || "Partner" });
      people.push(partner);
      relationships.push({ id: uid("rel"), fromPersonId: ownerPersonId, toPersonId: partner.id, kind: "partner" });
    } else if (kind === "parent" || kind === "child" || kind === "someone") {
      const subject = person(name, { birthYear, birthplaceId, shortBio: v.relationship.trim() || undefined });
      people.push(subject);
      subjectPersonId = subject.id;
      const rel = v.relationship.trim();
      if (kind === "child") relationships.push({ id: uid("rel"), fromPersonId: ownerPersonId, toPersonId: subject.id, kind: "parent" });
      else if (kind === "parent" && legacyRelationshipKind(kind, rel) !== "grandparent") relationships.push({ id: uid("rel"), fromPersonId: subject.id, toPersonId: ownerPersonId, kind: "parent" });
      else if (kind === "someone" && /friend|mentor|neighbo/i.test(rel)) relationships.push({ id: uid("rel"), fromPersonId: subject.id, toPersonId: ownerPersonId, kind: "friend" });
    }

    const startingChapter = v.kind ? config.chapterOrder[0] : v.startingChapter;
    const order = v.kind ? config.chapterOrder : defaultChapterOrder;
    const capsule: Capsule = {
      id,
      kind,
      subjectName: name,
      preferredName: v.preferredName?.trim() || (kind === "couple" || kind === "family" ? name : callName(name)),
      subjectPersonId,
      peopleIds: [...new Set([ownerPersonId, ...people.map((p) => p.id)])],
      relationship: v.relationship.trim() || config.defaultRelationship,
      relationshipKind: v.kind ? legacyRelationshipKind(kind, v.relationship) : v.relationshipKind,
      title: v.title?.trim() || config.title(kind === "couple" || kind === "family" ? name : v.preferredName?.trim() || name),
      description: v.description?.trim() || undefined,
      birthYear,
      birthplaceId,
      birthplaceLabel,
      dedication: v.dedication?.trim() || undefined,
      keyDates: v.keyDates?.length ? v.keyDates : undefined,
      theme: { palette: v.palette, typography: v.typography },
      cover: { mediaId: v.coverMediaId, layout: v.layout, focalY: 45 },
      status: "active",
      collectionMode: v.collectionMode,
      defaultPrivacy: v.defaultPrivacy,
      startingChapter,
      chapterOrder: [startingChapter, ...order.filter((c) => c !== startingChapter)],
      ownerPersonId,
      isSample: false,
      viewerEnabled: v.viewerEnabled,
      createdAt: now,
      updatedAt: now,
    };
    store().mutate(
      (d) => {
        d.capsules.unshift(capsule);
        d.people.push(...people);
        d.relationships.push(...relationships);
        const p = d.personas.find((x) => x.id === "persona_sarah");
        p?.roles.push({ capsuleId: id, role: "owner" });
        const active = d.personas.find((x) => x.id === d.activePersonaId);
        if (active && active.id !== "persona_sarah") active.roles.push({ capsuleId: id, role: "owner" });
        d.memberships.push({ id: uid("mb"), capsuleId: id, personId: capsule.ownerPersonId, role: "owner", status: "active", grantedAt: now, enforcement: "simulated" });
        if (d.familyGroups[0]) d.familyGroups[0].capsuleIds.push(id);
        d.wizardDraft = null;
      },
      { actor: actorName(), action: "capsule.created", target: id, detail: config.label },
    );
    store().track("capsule_created", { kind, relationship: capsule.relationshipKind, mode: v.collectionMode });
    return ok(capsule);
  },

  async updateCapsule(id, patch) {
    await latency();
    let out: Capsule | undefined;
    store().mutate(
      (d) => {
        const c = d.capsules.find((x) => x.id === id);
        if (!c) return;
        Object.assign(c, patch, { updatedAt: new Date().toISOString() });
        out = { ...c };
      },
      { actor: actorName(), action: "capsule.updated", target: id },
    );
    return out ? ok(out) : fail("not_found", "That capsule could not be found.");
  },

  async setCapsuleStatus(id, to) {
    const c = db().capsules.find((x) => x.id === id);
    if (!c) return fail("not_found", "That capsule could not be found.");
    if (!canTransition(capsuleTransitions, c.status, to)) return fail("conflict", `A ${c.status} capsule can't move to ${to}.`);
    await latency();
    store().mutate(
      (d) => {
        const x = d.capsules.find((y) => y.id === id)!;
        x.status = to;
        x.updatedAt = new Date().toISOString();
        x.deletionRequestedAt = to === "deletion_pending" ? x.updatedAt : undefined;
      },
      { actor: actorName(), action: `capsule.${to}`, target: id },
    );
    return ok({ ...db().capsules.find((x) => x.id === id)! });
  },

  async reorderChapters(id, order) {
    return this.updateCapsule(id, { chapterOrder: order as ChapterKey[] });
  },

  async createMemory(input) {
    const parsed = memoryFormSchema.safeParse(input);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the form.");
    if (!input.narrative.trim() && input.photoIds.length === 0 && !input.audioId) {
      return fail("validation", "Add a few words, a photo or a recording before saving.");
    }
    await latency(200);
    const now = new Date().toISOString();
    const isFirstUserMemory = !db().memories.some((m) => m.storage === "this_device");
    const memory: Memory = {
      id: uid("mem"),
      capsuleId: input.capsuleId,
      title: parsed.data.title,
      narrative: parsed.data.narrative,
      quote: parsed.data.quote || undefined,
      date: parsed.data.date,
      placeId: parsed.data.placeId || undefined,
      chapter: parsed.data.chapter,
      peopleIds: parsed.data.peopleIds,
      tags: parsed.data.tags,
      photoIds: input.photoIds,
      audioId: input.audioId,
      questionId: input.questionId,
      attribution: input.attribution,
      privacy: parsed.data.privacy,
      status: input.status,
      consent: parsed.data.consent,
      pinned: false,
      revisions: [],
      storage: "this_device",
      createdAt: now,
      updatedAt: now,
    };
    store().mutate(
      (d) => {
        d.memories.push(memory);
        const cap = d.capsules.find((c) => c.id === input.capsuleId);
        if (cap) {
          cap.updatedAt = now;
          if (cap.status === "draft") cap.status = "active";
          if (!cap.featuredMemoryId && memory.status === "approved") cap.featuredMemoryId = memory.id;
        }
        if (input.questionId) {
          const a = d.assignments.find((x) => x.capsuleId === input.capsuleId && x.questionId === input.questionId);
          if (a) {
            a.status = "answered";
            a.memoryId = memory.id;
          } else {
            d.assignments.push({ id: uid("as"), capsuleId: input.capsuleId, questionId: input.questionId, order: d.assignments.length + 1, status: "answered", memoryId: memory.id });
          }
        }
      },
      { actor: input.attribution.displayName, action: "memory.created", target: memory.id, detail: memory.title },
    );
    store().track(isFirstUserMemory ? "first_memory_saved" : "memory_saved", { hasAudio: !!input.audioId, photos: input.photoIds.length });
    if (memory.status === "submitted") {
      pushNotification({ kind: "contribution", title: `${input.attribution.displayName} added a story`, body: `“${memory.title}” is waiting for review.`, href: "/app/invitations?tab=review" });
    }
    return ok(memory);
  },

  async updateMemory(id, patch, editor) {
    const current = db().memories.find((m) => m.id === id);
    if (!current) return fail("not_found", "That memory could not be found.");
    const merged = { ...current, ...patch };
    const parsed = memoryFormSchema.safeParse({ ...merged, quote: merged.quote ?? "" });
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the form.");
    await latency();
    const changes: string[] = [];
    if (patch.title !== undefined && patch.title !== current.title) changes.push("title");
    if (patch.narrative !== undefined && patch.narrative !== current.narrative) changes.push("story");
    if (patch.date && formatFuzzyDate(patch.date) !== formatFuzzyDate(current.date)) changes.push("date");
    if (patch.placeId !== undefined && patch.placeId !== current.placeId) changes.push("place");
    if (patch.privacy && patch.privacy !== current.privacy) changes.push("privacy");
    if (patch.photoIds) changes.push("photos");
    const revision: MemoryRevision = {
      id: uid("rev"),
      at: new Date().toISOString(),
      by: editor,
      summary: changes.length ? `Edited ${changes.join(", ")}` : "Saved without changes",
      previous: { title: current.title, narrative: current.narrative, date: current.date, placeId: current.placeId },
    };
    store().mutate(
      (d) => {
        const m = d.memories.find((x) => x.id === id)!;
        const { audioId, ...rest } = patch;
        Object.assign(m, rest);
        if (audioId === null) m.audioId = undefined;
        else if (audioId !== undefined) m.audioId = audioId;
        if (m.quote === "") m.quote = undefined;
        if (m.placeId === "") m.placeId = undefined;
        m.updatedAt = revision.at;
        m.revisions.unshift(revision);
        if (m.revisions.length > 20) m.revisions.length = 20;
      },
      { actor: editor, action: "memory.updated", target: id, detail: revision.summary },
    );
    return ok({ ...db().memories.find((m) => m.id === id)! });
  },

  async transitionMemory(id, to, note, reviewer) {
    const m = db().memories.find((x) => x.id === id);
    if (!m) return fail("not_found", "That memory could not be found.");
    if (m.status !== to && !canTransition(memoryTransitions, m.status, to)) return fail("conflict", `Can't move a ${m.status.replace("_", " ")} memory to ${to.replace("_", " ")}.`);
    await latency(180);
    const now = new Date().toISOString();
    const who = reviewer ?? actorName();
    store().mutate(
      (d) => {
        const x = d.memories.find((y) => y.id === id)!;
        x.status = to;
        x.updatedAt = now;
        x.reviewNote = note || undefined;
        const c = d.contributions.find((y) => y.memoryId === id);
        if (c) {
          c.status = to;
          c.updatedAt = now;
          const decision = to === "under_review" ? "started_review" : to === "approved" || to === "returned" || to === "declined" ? to : undefined;
          if (decision) c.reviews.unshift({ id: uid("rev"), at: now, reviewer: who, decision, note });
        }
      },
      { actor: who, action: `memory.${to}`, target: id, detail: note },
    );
    if (to === "approved" && m.attribution.via === "invitation") store().track("contribution_completed", { capsuleId: m.capsuleId });
    return ok({ ...db().memories.find((x) => x.id === id)! });
  },

  async softDeleteMemory(id) {
    await latency();
    store().mutate(
      (d) => {
        const m = d.memories.find((x) => x.id === id);
        if (m) {
          m.deletedAt = new Date().toISOString();
          m.pinned = false;
        }
        for (const c of d.capsules) if (c.featuredMemoryId === id) c.featuredMemoryId = undefined;
      },
      { actor: actorName(), action: "memory.deleted", target: id },
    );
    const m = db().memories.find((x) => x.id === id);
    return m ? ok({ ...m }) : fail("not_found", "That memory could not be found.");
  },

  async restoreMemory(id) {
    await latency();
    store().mutate(
      (d) => {
        const m = d.memories.find((x) => x.id === id);
        if (m) m.deletedAt = undefined;
      },
      { actor: actorName(), action: "memory.restored", target: id },
    );
    const m = db().memories.find((x) => x.id === id);
    return m ? ok({ ...m }) : fail("not_found", "That memory could not be found.");
  },

  async togglePin(id) {
    store().mutate((d) => {
      const m = d.memories.find((x) => x.id === id);
      if (m) m.pinned = !m.pinned;
    });
    const m = db().memories.find((x) => x.id === id);
    return m ? ok({ ...m }) : fail("not_found", "That memory could not be found.");
  },

  async setFeatured(capsuleId, memoryId) {
    return this.updateCapsule(capsuleId, { featuredMemoryId: memoryId });
  },

  async toggleBookmark(capsuleId, memoryId) {
    let now = false;
    store().mutate((d) => {
      const i = d.bookmarks.findIndex((b) => b.capsuleId === capsuleId && b.memoryId === memoryId);
      if (i >= 0) d.bookmarks.splice(i, 1);
      else {
        d.bookmarks.unshift({ capsuleId, memoryId, at: new Date().toISOString() });
        now = true;
      }
    });
    return ok(now);
  },

  async addPlace(input) {
    const existing = db().places.find((p) => p.name === input.name && Math.abs(p.point.lat - input.point.lat) < 0.01);
    if (existing) return ok(existing);
    const place: Place = { ...input, id: uid("pl") };
    store().mutate((d) => {
      d.places.push(place);
    });
    return ok(place);
  },

  async addCustomQuestion(capsuleId, text, category) {
    const t = text.trim();
    if (t.length < 8) return fail("validation", "Write a question of at least a few words.");
    const id = uid("q_custom");
    store().mutate(
      (d) => {
        d.questions.push({ id, text: t, category: (category as never) || "Small Ordinary Moments", chapter: "everyday", followUps: [], custom: true, createdBy: actorName() });
        d.assignments.push({ id: uid("as"), capsuleId, questionId: id, order: d.assignments.filter((a) => a.capsuleId === capsuleId).length + 1, status: "queued" });
      },
      { actor: actorName(), action: "question.created", target: id },
    );
    return ok(id);
  },

  async setAssignments(capsuleId, questionIds) {
    store().mutate((d) => {
      const existing = d.assignments.filter((a) => a.capsuleId === capsuleId);
      const keep = existing.filter((a) => a.status !== "queued" || questionIds.includes(a.questionId));
      const others = d.assignments.filter((a) => a.capsuleId !== capsuleId);
      const queued = questionIds.map((qid, i) => {
        const prev = keep.find((a) => a.questionId === qid);
        return prev ? { ...prev, order: i + 1 } : { id: uid("as"), capsuleId, questionId: qid, order: i + 1, status: "queued" as const };
      });
      const answered = keep.filter((a) => !questionIds.includes(a.questionId));
      d.assignments = [...others, ...queued, ...answered.map((a, i) => ({ ...a, order: queued.length + i + 1 }))];
    });
    return ok(null);
  },

  async markAssignment(capsuleId, questionId, status, memoryId) {
    store().mutate((d) => {
      const a = d.assignments.find((x) => x.capsuleId === capsuleId && x.questionId === questionId);
      if (a) {
        a.status = status;
        if (memoryId) a.memoryId = memoryId;
      } else d.assignments.push({ id: uid("as"), capsuleId, questionId, order: d.assignments.length + 1, status, memoryId });
    });
    return ok(null);
  },

  async toggleFavoriteQuestion(questionId) {
    if (!db().questions.some((q) => q.id === questionId)) return fail("not_found", "That question isn't in the library.");
    let now = false;
    store().mutate((d) => {
      const i = d.questionFavorites.indexOf(questionId);
      if (i >= 0) d.questionFavorites.splice(i, 1);
      else {
        d.questionFavorites.unshift(questionId);
        now = true;
      }
    });
    return ok(now);
  },

  async setMemberRole(capsuleId, personId, role) {
    const d = db();
    const capsule = d.capsules.find((c) => c.id === capsuleId);
    if (!capsule) return fail("not_found", "Capsule not found.");
    const current = d.memberships.find((x) => x.capsuleId === capsuleId && x.personId === personId && x.status === "active");
    if (current?.role === "owner" || role === "owner") return fail("forbidden", "Ownership can't be changed here. It moves only through a verified transfer.");
    if (role === "storyteller" && capsule.subjectPersonId && capsule.subjectPersonId !== personId) return fail("validation", "Only the person this capsule is about can be its storyteller.");
    const person = d.people.find((p) => p.id === personId);
    await latency(120);
    store().mutate(
      (x) => {
        const m = x.memberships.find((y) => y.capsuleId === capsuleId && y.personId === personId && y.status === "active");
        if (!role) {
          if (m) m.status = "removed";
          return;
        }
        if (m) m.role = role;
        else x.memberships.push({ id: uid("mb"), capsuleId, personId, role, status: "active", grantedAt: new Date().toISOString(), enforcement: "simulated" });
      },
      { actor: actorName(), action: role ? "membership.role_set" : "membership.removed", target: capsuleId, detail: `${person?.displayName ?? personId}${role ? ` → ${roleLabels[role].label}` : ""}` },
    );
    return ok(null);
  },
};

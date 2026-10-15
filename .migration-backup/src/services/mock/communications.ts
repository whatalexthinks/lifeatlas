"use client";

import type { Invitation } from "@/domain/models";
import { invitationSchema } from "@/domain/schemas";
import { canTransition, invitationTransitions } from "@/domain/workflows/state-machines";
import { token as makeToken, uid } from "@/lib/utils";
import { fail, notConfigured, ok, type CommunicationsProvider } from "../contracts";
import { actorName, db, latency, pushNotification, store } from "./shared";
import { brand } from "@/config/brand";
import { explainInvitation } from "@/domain/invitations";

function setStatus(id: string, to: Invitation["status"], note?: string) {
  store().mutate(
    (d) => {
      const inv = d.invitations.find((i) => i.id === id);
      if (!inv) return;
      inv.status = to;
      inv.updatedAt = new Date().toISOString();
      inv.history.push({ status: to, at: inv.updatedAt, note });
    },
    { actor: actorName(), action: `invitation.${to}`, target: id, detail: note },
  );
  return db().invitations.find((i) => i.id === id)!;
}

const isExpired = (inv: Invitation) => new Date(inv.expiresAt).getTime() < Date.now();

export const mockCommunications: CommunicationsProvider = {
  async prepareInvitation(capsuleId, values) {
    const parsed = invitationSchema.safeParse(values);
    if (!parsed.success) return fail("validation", parsed.error.issues[0]?.message ?? "Please check the invitation.");
    await latency(200);
    const now = new Date();
    const inv: Invitation = {
      id: uid("inv"),
      capsuleId,
      token: makeToken(parsed.data.recipientName.split(" ")[0]),
      recipientName: parsed.data.recipientName,
      recipientContact: parsed.data.recipientContact || undefined,
      relationship: parsed.data.relationship,
      role: parsed.data.role,
      channel: parsed.data.channel,
      message: parsed.data.message,
      mode: parsed.data.mode,
      questionIds: parsed.data.mode === "questions" ? parsed.data.questionIds : [],
      status: "prepared",
      expiresAt: new Date(now.getTime() + 30 * 86400_000).toISOString(),
      history: [{ status: "prepared", at: now.toISOString() }],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store().mutate((d) => {
      d.invitations.unshift(inv);
    }, { actor: actorName(), action: "invitation.prepared", target: inv.id, detail: inv.recipientName });
    store().track("invite_prepared", { role: inv.role, channel: inv.channel, questions: inv.questionIds.length });
    return ok(inv);
  },

  async preview(invitationId, origin) {
    const inv = db().invitations.find((i) => i.id === invitationId);
    if (!inv) return fail("not_found", "Invitation not found.");
    const capsule = db().capsules.find((c) => c.id === inv.capsuleId);
    const from = db().account.profile.displayName;
    const first = inv.recipientName.split(" ")[0];
    const link = `${origin}/contribute/${inv.token}`;
    const qs = inv.questionIds.map((q) => db().questions.find((x) => x.id === q)?.text).filter(Boolean) as string[];
    const about = capsule?.relationshipKind === "self" ? capsule.preferredName : capsule?.preferredName ?? "the family";
    const roleLine =
      inv.role === "storyteller"
        ? `Your family would love to hear your stories — in your own words, at your own pace.`
        : inv.role === "viewer"
          ? `${from} has invited you to explore ${about}'s archive.`
          : `${from} is gathering stories for ${about}'s archive, and would love one from you.`;
    // The same five answers the invitation page gives: who, what, the ask, cost, and use.
    const points = capsule
      ? explainInvitation({ invitation: inv, capsule, inviterName: from, questions: qs, storyCount: db().memories.filter((m) => m.capsuleId === capsule.id && !m.deletedAt && m.status === "approved").length })
      : [];
    const body = [
      `Hi ${first},`,
      "",
      roleLine,
      inv.message ? `\n“${inv.message}”\n— ${from}` : "",
      ...points.map((p) => `\n${p.title}\n${p.body}${p.questions?.length ? `\n${p.questions.map((q) => `  • ${q}`).join("\n")}` : ""}`),
      "",
      `Open your invitation: ${link}`,
      "",
      "There's no password to remember. You can type, record your voice, or add a photo — skip anything you like.",
    ]
      .filter((l) => l !== "")
      .join("\n");
    return ok({
      subject: inv.role === "storyteller" ? `${from} would love to hear your stories` : `A story for ${about}?`,
      preheader: "Free for you. No account needed. Skip anything you like.",
      body,
      sms: `${from} invited you to add a story to ${about}'s ${brand.name}: ${link}`,
      link,
    });
  },

  async simulateSend(invitationId) {
    const inv = db().invitations.find((i) => i.id === invitationId);
    if (!inv) return fail("not_found", "Invitation not found.");
    if (!canTransition(invitationTransitions, inv.status, "simulated_sent")) return fail("conflict", "This invitation can't be marked as shared right now.");
    await latency();
    const out = setStatus(invitationId, "simulated_sent", `Link shared from this device — no email or text was sent by ${brand.name}`);
    pushNotification({ kind: "invitation", title: `Invitation ready for ${inv.recipientName}`, body: "Invitation preview only — no email was sent. Share the link yourself.", href: "/app/invitations" });
    return ok({ ...out });
  },

  async send() {
    return notConfigured("communications", "Email and text invitations aren't connected in this preview. Copy the link and share it yourself.");
  },

  async resolveToken(tok) {
    await latency(120);
    const inv = db().invitations.find((i) => i.token === tok);
    if (!inv) return fail("not_found", "We couldn't find this invitation.");
    if (inv.status === "revoked_demo" || inv.status === "revoked") return fail("forbidden", "This invitation was withdrawn by the person who sent it.");
    if (inv.status === "expired_demo" || inv.status === "expired" || isExpired(inv)) return fail("conflict", "This invitation has expired.");
    return ok({ ...inv });
  },

  async accept(tok) {
    const inv = db().invitations.find((i) => i.token === tok);
    if (!inv) return fail("not_found", "Invitation not found.");
    if (inv.status === "accepted_demo") return ok({ ...inv });
    if (inv.status === "prepared") setStatus(inv.id, "simulated_sent", "Link opened on this device");
    const cur = db().invitations.find((i) => i.id === inv.id)!;
    if (!canTransition(invitationTransitions, cur.status, "accepted_demo")) return fail("conflict", "This invitation can't be accepted.");
    joinFamily(inv.id);
    return ok({ ...setStatus(inv.id, "accepted_demo") });
  },

  async revoke(invitationId) {
    const inv = db().invitations.find((i) => i.id === invitationId);
    if (!inv) return fail("not_found", "Invitation not found.");
    if (!canTransition(invitationTransitions, inv.status, "revoked_demo")) return fail("conflict", "This invitation can't be revoked.");
    await latency();
    return ok({ ...setStatus(invitationId, "revoked_demo", "Link disabled in this demo") });
  },

  async reissue(invitationId) {
    const inv = db().invitations.find((i) => i.id === invitationId);
    if (!inv) return fail("not_found", "Invitation not found.");
    if (!canTransition(invitationTransitions, inv.status, "prepared") && inv.status !== "simulated_sent") return fail("conflict", "This invitation can't be reissued.");
    await latency();
    store().mutate((d) => {
      const x = d.invitations.find((i) => i.id === invitationId)!;
      x.token = makeToken(x.recipientName.split(" ")[0]);
      x.expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
      x.status = "prepared";
      x.updatedAt = new Date().toISOString();
      x.history.push({ status: "prepared", at: x.updatedAt, note: "New link issued; the old link no longer opens" });
    }, { actor: actorName(), action: "invitation.reissued", target: invitationId });
    return ok({ ...db().invitations.find((i) => i.id === invitationId)! });
  },

  async submitContribution(tok, memoryId) {
    const inv = db().invitations.find((i) => i.token === tok);
    if (!inv) return fail("not_found", "Invitation not found.");
    const memory = db().memories.find((m) => m.id === memoryId);
    if (!memory) return fail("not_found", "Memory not found.");
    const now = new Date().toISOString();
    const id = uid("con");
    store().mutate((d) => {
      d.contributions.unshift({
        id,
        capsuleId: inv.capsuleId,
        memoryId,
        invitationId: inv.id,
        contributorName: memory.attribution.displayName,
        contributorPersonId: memory.attribution.personId,
        status: memory.status === "approved" ? "approved" : "submitted",
        reviews: [],
        createdAt: now,
        updatedAt: now,
      });
    });
    return ok({ ...db().contributions.find((c) => c.id === id)! });
  },
};

/**
 * Opening an invitation makes the person part of the family: someone new is added to
 * People, and they get the invited role on the capsule unless they already have one.
 */
function joinFamily(invitationId: string) {
  store().mutate((d) => {
    const inv = d.invitations.find((i) => i.id === invitationId);
    if (!inv) return;
    const now = new Date().toISOString();
    if (!inv.personId || !d.people.some((p) => p.id === inv.personId)) {
      const [givenName, ...rest] = inv.recipientName.trim().split(/\s+/);
      const id = uid("per");
      d.people.push({ id, displayName: inv.recipientName.trim(), givenName, familyName: rest.join(" "), shortBio: inv.relationship || undefined, isSample: false, createdAt: now, updatedAt: now });
      inv.personId = id;
    }
    const personId = inv.personId;
    if (!d.memberships.some((m) => m.capsuleId === inv.capsuleId && m.personId === personId && m.status === "active" && m.role !== "successor"))
      d.memberships.push({ id: uid("mb"), capsuleId: inv.capsuleId, personId, role: inv.role, status: "active", grantedAt: now, enforcement: "simulated" });
  });
}

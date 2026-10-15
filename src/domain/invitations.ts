import type { Capsule, Invitation } from "@/domain/models";
import { brand } from "@/config/brand";

/**
 * The five things every invitation answers before anyone says yes: who is asking, what the
 * capsule is, what is being asked, whether it costs anything, and what happens to what they
 * share. One function, so the invitation someone opens and the preview its sender sees can't
 * say different things.
 */
export type InvitationPoint = "from" | "capsule" | "ask" | "payment" | "use";

export interface InvitationExplainer {
  key: InvitationPoint;
  title: string;
  body: string;
  /** For "ask": the questions themselves, so nobody agrees to something unseen. */
  questions?: string[];
}

export function explainInvitation(input: {
  invitation: Pick<Invitation, "role" | "relationship" | "mode">;
  capsule: Pick<Capsule, "title" | "subjectName" | "preferredName" | "description" | "defaultPrivacy">;
  inviterName: string;
  questions: string[];
  storyCount: number;
}): InvitationExplainer[] {
  const { invitation, capsule, inviterName, questions, storyCount } = input;
  const who = capsule.preferredName || capsule.subjectName;
  const inviter = inviterName.split(" ")[0] || inviterName;
  const relation = invitation.relationship.trim();

  const from: InvitationExplainer = {
    key: "from",
    title: "Who invited you",
    body: `${inviterName} invited you${relation ? `, as ${who}'s ${relation.toLowerCase()}` : ""}. They look after this capsule.`,
  };

  const capsulePoint: InvitationExplainer = {
    key: "capsule",
    title: "What this is",
    body: `“${capsule.title}” is a private ${brand.product} — a place where a family keeps the stories, voices and photographs of ${capsule.subjectName}. ${
      storyCount ? `It holds ${storyCount} ${storyCount === 1 ? "story" : "stories"} so far.` : "It's just getting started."
    }${capsule.description ? ` ${capsule.description}` : ""}`,
  };

  const ask: InvitationExplainer =
    invitation.role === "viewer"
      ? { key: "ask", title: "What you're asked to do", body: "Nothing at all — just read, look and listen, whenever you like." }
      : invitation.role === "storyteller"
        ? { key: "ask", title: "What you're asked to do", body: `To tell your own stories, in your own words — by speaking, typing or adding a photo.${questions.length ? ` ${inviter} picked ${questions.length === 1 ? "a question" : `${questions.length} questions`} to start with; skip any of them.` : ""}`, questions }
        : invitation.role === "organizer"
          ? { key: "ask", title: "What you're asked to do", body: `To help ${inviter} look after the capsule as an editor: add and edit stories, invite people and read contributions before they're added.` }
          : invitation.mode === "questions" && questions.length
            ? { key: "ask", title: "What you're asked to do", body: `To answer ${questions.length === 1 ? "one question" : `${questions.length} questions`} about ${who}, by speaking, typing or adding a photo. Skip any you'd rather not answer.`, questions }
            : { key: "ask", title: "What you're asked to do", body: `To add any story, photo or recording of ${who} you'd like to share. One is plenty.` };

  const payment: InvitationExplainer = {
    key: "payment",
    title: "Does it cost anything?",
    body: `No. It's free for you, now and later — ${inviter} looks after the plan. You won't be asked for a card or to buy anything to take part.`,
  };

  const visibleTo =
    capsule.defaultPrivacy === "family"
      ? "the family members invited to it"
      : capsule.defaultPrivacy === "organizers"
        ? `${inviter} and the capsule's editors`
        : `${inviter} — and anyone they choose to share it with`;
  const use: InvitationExplainer =
    invitation.role === "viewer"
      ? { key: "use", title: "What happens to what you see", body: `The capsule is private to the people ${inviter} invites. It's never posted publicly or listed in search engines.` }
      : {
          key: "use",
          title: "How what you share is used",
          body: `${invitation.role === "storyteller" || invitation.role === "organizer" ? "It" : `${inviter} reads it first, then it`} becomes part of ${who}'s capsule, seen by ${visibleTo}. It's never posted publicly. The family may include it in a printed keepsake or a download they keep; you can ask for any story to be changed, left out or removed.`,
        };

  return [from, capsulePoint, ask, payment, use];
}

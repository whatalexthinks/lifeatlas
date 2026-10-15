import { describe, expect, it } from "vitest";
import { explainInvitation } from "./invitations";

const capsule = { title: "A Life in Her Own Words", subjectName: "Margaret Ellis", preferredName: "Margaret", description: undefined, defaultPrivacy: "family" as const };
const base = { capsule, inviterName: "Sarah Ellis", questions: ["What was your first job?", "Who taught you to cook?"], storyCount: 12 };

describe("what an invitation explains", () => {
  it("answers the same five questions for every role, in order", () => {
    for (const role of ["contributor", "storyteller", "viewer", "organizer"] as const) {
      const points = explainInvitation({ ...base, invitation: { role, relationship: "Granddaughter", mode: "questions" } });
      expect(points.map((p) => p.key)).toEqual(["from", "capsule", "ask", "payment", "use"]);
    }
  });

  it("says who is asking and what the capsule is", () => {
    const [from, what] = explainInvitation({ ...base, invitation: { role: "contributor", relationship: "Granddaughter", mode: "questions" } });
    expect(from.body).toBe("Sarah Ellis invited you, as Margaret's granddaughter. They look after this capsule.");
    expect(what.body).toContain("“A Life in Her Own Words” is a private capsule");
    expect(what.body).toContain("12 stories so far");
  });

  it("shows the actual questions, and never asks a contributor to pay", () => {
    const points = explainInvitation({ ...base, invitation: { role: "contributor", relationship: "Son", mode: "questions" } });
    expect(points[2]).toMatchObject({ questions: base.questions });
    expect(points[2].body).toContain("2 questions about Margaret");
    expect(points[3].body).toMatch(/^No\. It's free for you/);
  });

  it("tells contributors their story is read first and may be printed, and how to opt out", () => {
    const use = explainInvitation({ ...base, invitation: { role: "contributor", relationship: "Son", mode: "open" } })[4];
    expect(use.body).toContain("Sarah reads it first");
    expect(use.body).toContain("never posted publicly");
    expect(use.body).toContain("printed keepsake");
    expect(use.body).toContain("changed, left out or removed");
  });

  it("is truthful about who sees it when the capsule keeps stories narrow by default", () => {
    const use = explainInvitation({ ...base, capsule: { ...capsule, defaultPrivacy: "organizers" }, invitation: { role: "contributor", relationship: "Son", mode: "open" } })[4];
    expect(use.body).toContain("seen by Sarah and the capsule's editors");
  });

  it("asks a viewer for nothing", () => {
    expect(explainInvitation({ ...base, invitation: { role: "viewer", relationship: "", mode: "open" } })[2].body).toMatch(/^Nothing at all/);
  });
});

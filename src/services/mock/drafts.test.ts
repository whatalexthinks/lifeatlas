import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "@/store/demo-store";
import { saveState, __resetIdbForTests } from "@/lib/storage/idb";
import { services } from "../factory";
import { seed } from "@/tests/fixtures";
import type { DemoDatabase } from "@/domain/models";

const db = () => useDemoStore.getState().db;
const fields = (over: Partial<{ key: string; text: string }> = {}) => ({
  key: "cap_margaret:person:organizer",
  capsuleId: "cap_margaret",
  questionId: "q_first_home",
  label: "The first home",
  who: "Margaret",
  text: "The kitchen had a blue door.",
  title: "",
  date: { precision: "unknown" as const },
  ...over,
});

beforeEach(() => {
  useDemoStore.setState({ db: seed(), hydrated: true });
});

describe("answer drafts", () => {
  it("keeps one draft per key, newest first", async () => {
    const d = services().drafts;
    await d.saveCaptureDraft(fields({ text: "first" }));
    await d.saveCaptureDraft(fields({ key: "cap_margaret:person:emma", text: "other" }));
    await d.saveCaptureDraft(fields({ text: "second" }));
    expect(db().captureDrafts.map((x) => x.text)).toEqual(["second", "other"]);
  });

  it("brings back the words exactly as left", async () => {
    const d = services().drafts;
    await d.saveCaptureDraft(fields());
    const r = await d.loadCaptureDraft("cap_margaret:person:organizer");
    expect(r.status).toBe("ok");
    if (r.status !== "ok" || !r.data) throw new Error("no draft");
    expect(r.data.draft.text).toBe("The kitchen had a blue door.");
    expect(r.data.draft.questionId).toBe("q_first_home");
    expect(r.data.audio).toBeUndefined();
    expect(r.data.photos).toEqual([]);
  });

  it("returns nothing for a key that was never saved", async () => {
    const r = await services().drafts.loadCaptureDraft("nope");
    expect(r.status === "ok" && r.data).toBeNull();
  });

  it("records where a recording is kept and forgets it when removed", async () => {
    const d = services().drafts;
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const saved = await d.saveCaptureDraft(fields(), { audio: { blob, durationSec: 12, peaks: [0.2, 0.5], source: "microphone" } });
    expect(saved.status).toBe("ok");
    expect(db().captureDrafts[0].audio).toMatchObject({ blobKey: "draft-audio:cap_margaret:person:organizer", durationSec: 12, source: "microphone", mime: "audio/webm" });
    await d.saveCaptureDraft(fields(), { audio: null });
    expect(db().captureDrafts[0].audio).toBeUndefined();
  });

  it("is removed once the answer is kept", async () => {
    const d = services().drafts;
    await d.saveCaptureDraft(fields());
    await d.discardCaptureDraft("cap_margaret:person:organizer");
    expect(db().captureDrafts).toEqual([]);
  });

  it("never grows without limit", async () => {
    const d = services().drafts;
    for (let i = 0; i < 35; i++) await d.saveCaptureDraft(fields({ key: `k${i}` }));
    expect(db().captureDrafts).toHaveLength(30);
    expect(db().captureDrafts[0].key).toBe("k34");
  });
});

describe("gathering sessions", () => {
  const input = {
    capsuleId: "cap_margaret",
    occasion: "Thanksgiving",
    guests: [{ key: "g1", name: "Emma" }, { key: "g2", name: "Daniel" }],
    questionIds: ["q_first_home", "q_kitchen"],
  };

  it("needs people and questions", async () => {
    const g = services().drafts;
    expect((await g.startGathering({ ...input, guests: [] })).status).toBe("error");
    expect((await g.startGathering({ ...input, questionIds: [] })).status).toBe("error");
  });

  it("saves progress so a session can resume where it stopped", async () => {
    const g = services().drafts;
    const s = await g.startGathering(input);
    if (s.status !== "ok") throw new Error("not started");
    expect(s.data).toMatchObject({ index: 0, turn: 0, answers: [], status: "in_progress" });
    await g.updateGathering(s.data.id, { index: 1, turn: 1, answers: [{ memoryId: "mem_x", speakerKey: "g1", questionId: "q_first_home" }] });
    const stored = db().gatherings.find((x) => x.id === s.data.id)!;
    expect(stored).toMatchObject({ index: 1, turn: 1, status: "in_progress" });
    expect(stored.answers).toHaveLength(1);
    expect(db().auditEvents[0]).toMatchObject({ action: "gathering.started", target: "cap_margaret" });
  });

  it("finishes and removes", async () => {
    const g = services().drafts;
    const s = await g.startGathering(input);
    if (s.status !== "ok") throw new Error("not started");
    await g.updateGathering(s.data.id, { status: "finished" });
    expect(db().gatherings[0].status).toBe("finished");
    await g.removeGathering(s.data.id);
    expect(db().gatherings).toEqual([]);
    expect((await g.updateGathering(s.data.id, { index: 2 })).status).toBe("error");
  });
});

describe("letter writing", () => {
  const letter = { key: "letter:new", capsuleId: "cap_margaret", values: { title: "For Leo", body: "Dear Leo" }, attachmentIds: [], birthYear: "" };
  it("keeps unfinished writing, even when it isn't a valid letter yet", async () => {
    const d = services().drafts;
    await d.saveLetterDraft(letter);
    await d.saveLetterDraft({ ...letter, values: { title: "For Leo", body: "Dear Leo, I remember" } });
    expect(db().letterDrafts).toHaveLength(1);
    expect(db().letterDrafts[0].values.body).toBe("Dear Leo, I remember");
  });
  it("is discarded on request", async () => {
    const d = services().drafts;
    await d.saveLetterDraft(letter);
    await d.discardLetterDraft("letter:new");
    expect(db().letterDrafts).toEqual([]);
  });
});

describe("saved data from before drafts existed", () => {
  it("loads with the new collections filled in empty instead of being wiped", async () => {
    const old = seed() as Partial<DemoDatabase>;
    old.memories = old.memories!.slice(0, 2);
    delete old.captureDrafts;
    delete old.gatherings;
    delete old.letterDrafts;
    __resetIdbForTests();
    await saveState(old as DemoDatabase);
    useDemoStore.setState({ hydrated: false });
    await useDemoStore.getState().hydrate();
    expect(db().memories).toHaveLength(2); // the person's own data survives
    expect(db().captureDrafts).toEqual([]);
    expect(db().gatherings).toEqual([]);
    expect(db().letterDrafts).toEqual([]);
  });
});

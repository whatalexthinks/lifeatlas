"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "@/lib/router/link";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import { ArrowRight, BookOpen, Check, History, Keyboard, Mic, Play, Plus, Printer, RotateCcw, SkipForward, Trash2, Users, X } from "lucide-react";
import type { GatheringGuest, GatheringSession, Question, QuestionCategory } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Avatar } from "@/components/studio/persona-switcher";
import { Recorder, type RecordedAudio } from "@/components/capture/recorder";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, EmptyState, Skeleton, toast } from "@/components/ui/feedback";
import { Field, Input, Segmented, Select, Textarea } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { flushSave } from "@/store/demo-store";
import { cn, formatDate, formatDuration, pluralize, relativeTime } from "@/lib/utils";
import { brand } from "@/config/brand";

const deckCategories: { value: QuestionCategory; label: string }[] = [
  { value: "Holidays", label: "Holidays" },
  { value: "Traditions", label: "Traditions" },
  { value: "Recipes", label: "Recipes" },
  { value: "Childhood", label: "Childhood" },
];

function shuffle<T>(items: T[], seed: number) {
  const a = [...items];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const joinNames = (names: string[]) => names.join(", ").replace(/, ([^,]*)$/, " and $1");

/** Every step is saved to this device, so the address (`?session=`) is enough to pick a session back up. */
export default function TogetherPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[70vh] max-w-[1080px]" />}>
      <Together />
    </Suspense>
  );
}

function Together() {
  const hydrated = useHydrated();
  const router = useRouter();
  const id = useSearchParams().get("session");
  const session = useDb((d) => (id ? d.gatherings.find((g) => g.id === id) : undefined));

  if (!hydrated) return <Skeleton className="mx-auto h-[70vh] max-w-[1080px]" />;
  if (id && !session)
    return (
      <div className="mx-auto max-w-[720px] py-10">
        <EmptyState icon={<History className="size-6" />} title="That session isn't on this device" body="Sessions are saved in the browser they were started in. It may have been removed, or the demo data was erased." action={<ButtonLink href="/app/together">Start a session</ButtonLink>} />
      </div>
    );
  if (session) return session.status === "finished" ? <Booklet session={session} /> : <Table session={session} />;
  return <Setup onStart={(s) => router.push(`/app/together?session=${s.id}`)} />;
}

/* -------------------------------------------------------------------------- */
/* Setup                                                                      */
/* -------------------------------------------------------------------------- */

function Setup({ onStart }: { onStart: (s: GatheringSession) => void }) {
  const capsules = useDb((d) => d.capsules);
  const people = useDb((d) => d.people);
  const questions = useDb((d) => d.questions);
  const [capsuleId, setCapsuleId] = React.useState(() => (capsules.some((c) => c.id === "cap_margaret") ? "cap_margaret" : capsules[0]?.id ?? ""));
  const [occasion, setOccasion] = React.useState("Around the table");
  const [guests, setGuests] = React.useState<GatheringGuest[]>(() => people.filter((p) => ["per_margaret", "per_sarah", "per_emma"].includes(p.id)).map((p) => ({ key: p.id, name: p.givenName, personId: p.id, relationship: p.shortBio })));
  const [newGuest, setNewGuest] = React.useState("");
  const [cats, setCats] = React.useState<QuestionCategory[]>(["Holidays", "Traditions", "Recipes"]);
  const [length, setLength] = React.useState<"6" | "10" | "15">("6");
  const [starting, setStarting] = React.useState(false);
  const pool = questions.filter((q) => cats.includes(q.category));

  const toggle = (g: GatheringGuest) => setGuests((xs) => (xs.some((x) => x.key === g.key) ? xs.filter((x) => x.key !== g.key) : [...xs, g]));

  const begin = async () => {
    setStarting(true);
    const r = await services().drafts.startGathering({ capsuleId, occasion: occasion.trim() || "Around the table", guests, questionIds: shuffle(pool, Date.now() % 100000).slice(0, Number(length)).map((q) => q.id) });
    setStarting(false);
    if (r.status !== "ok") return toast.error("Couldn't start the session", r.status === "error" ? r.message : undefined);
    await flushSave().catch(() => undefined);
    onStart(r.data);
  };

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Holiday session"
        title={
          <>
            Pass the phone. <em>Keep the stories.</em>
          </>
        }
        description="When everyone's together, let one device go around the table. One question each, answered out loud, and a little booklet of the evening at the end."
      />
      <SessionsOnDevice />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Who's at the table?" description="Tap to add or remove. Guests don't need an account.">
            <div className="flex flex-wrap gap-2">
              {people.map((p) => {
                const on = guests.some((g) => g.personId === p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle({ key: p.id, name: p.givenName, personId: p.id, relationship: p.shortBio })} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[0.9375rem] transition", on ? "border-evergreen bg-evergreen text-on-evergreen" : "border-line bg-surface hover:border-ink/30")}>
                    <Avatar name={p.displayName} size="sm" className={on ? "bg-paper text-ink" : undefined} />
                    {p.givenName}
                    {on ? <Check className="size-4" /> : null}
                  </button>
                );
              })}
              {guests
                .filter((g) => !g.personId)
                .map((g) => (
                  <span key={g.key} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-evergreen bg-evergreen py-1 pl-4 pr-1 text-[0.9375rem] text-on-evergreen">
                    {g.name}
                    <button type="button" className="grid size-9 place-items-center rounded-full hover:bg-on-evergreen/15" aria-label={`Remove ${g.name}`} onClick={() => toggle(g)}>
                      <X className="size-4" />
                    </button>
                  </span>
                ))}
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newGuest.trim();
                if (!name) return;
                setGuests((xs) => [...xs, { key: `guest-${name}-${xs.length}`, name, relationship: "Guest" }]);
                setNewGuest("");
              }}
            >
              <Input aria-label="Add a guest" placeholder="Add a guest, a neighbour, a friend…" value={newGuest} onChange={(e) => setNewGuest(e.target.value)} maxLength={40} />
              <Button type="submit" variant="secondary" leading={<Plus className="size-4" />} disabled={!newGuest.trim()}>
                Add
              </Button>
            </form>
          </Panel>
          <Panel title="The questions">
            <p className="text-[0.9375rem] font-medium">Draw from</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deckCategories.map((c) => {
                const on = cats.includes(c.value);
                return (
                  <button key={c.value} type="button" aria-pressed={on} onClick={() => setCats((xs) => (on ? xs.filter((x) => x !== c.value) : [...xs, c.value]))} className={cn("min-h-11 rounded-[9px] border px-4 text-[0.9375rem] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/30")}>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-[0.9375rem] font-medium">How long?</p>
            <Segmented
              label="Session length"
              className="mt-3"
              value={length}
              onChange={setLength}
              options={[
                { value: "6", label: "6 questions · ~20 min" },
                { value: "10", label: "10 · ~35 min" },
                { value: "15", label: "15 · an evening" },
              ]}
            />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Whose capsule?">
            <div className="space-y-5">
              <Field label="The stories go to" htmlFor="t-capsule">
                <Select id="t-capsule" value={capsuleId} onChange={(e) => setCapsuleId(e.target.value)}>
                  {capsules.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subjectName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="The occasion" htmlFor="t-occ" hint="Printed on the booklet.">
                <Input id="t-occ" value={occasion} maxLength={60} onChange={(e) => setOccasion(e.target.value)} />
              </Field>
            </div>
          </Panel>
          <div className="rounded-[16px] bg-[#2e312a] p-6 text-[#f3efe7]">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#c9c2b3]">Tonight</p>
            <p className="mt-3 font-serif text-[1.9rem] leading-tight">
              {pluralize(guests.length, "person", "people")}, {Math.min(Number(length), pool.length)} questions
            </p>
            <p className="mt-2 text-[0.9375rem] text-[#c9c2b3]">
              {guests.length === 0 ? "Add at least one person to begin." : pool.length === 0 ? "Choose at least one kind of question." : `${pool.length} questions in the deck. Everyone takes a turn in order; anyone can pass.`}
            </p>
            <Button size="lg" variant="light" block className="mt-6" disabled={guests.length < 1 || pool.length === 0} loading={starting} trailing={<ArrowRight className="size-4" />} onClick={() => void begin()}>
              Begin
            </Button>
          </div>
          <DemoNotice>Each step is saved on this device, so you can stop and pick up later. Answers from guests wait in review, so you decide who sees them.</DemoNotice>
        </div>
      </div>
    </div>
  );
}

/** Sessions saved on this device: resume one that was interrupted, or reopen a booklet. */
function SessionsOnDevice() {
  const sessions = useDb((d) => d.gatherings);
  const capsules = useDb((d) => d.capsules);
  const [removing, setRemoving] = React.useState<GatheringSession | null>(null);
  if (!sessions.length) return null;

  return (
    <Panel title="Sessions on this device" description="Every answer is saved as you go, pick up where the table left off." className="mb-6">
      <ul className="divide-y divide-line">
        {sessions.map((s) => {
          const capsule = capsules.find((c) => c.id === s.capsuleId);
          const inProgress = s.status === "in_progress";
          const speaker = s.guests[s.turn % Math.max(1, s.guests.length)];
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", inProgress ? "bg-evergreen/10 text-evergreen" : "bg-ivory text-ink-3")} aria-hidden>
                {inProgress ? <Play className="size-4" /> : <BookOpen className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {s.occasion} <span className="font-normal text-ink-3">· {capsule?.subjectName ?? "a removed capsule"}</span>
                </p>
                <p className="text-[0.875rem] text-ink-3">
                  {inProgress ? `Question ${Math.min(s.index + 1, s.questionIds.length)} of ${s.questionIds.length} · ${speaker?.name ?? "someone"}'s turn` : "Finished"} · {pluralize(s.answers.length, "answer")} kept · {relativeTime(s.updatedAt)}
                </p>
              </div>
              <div className="flex gap-1">
                <ButtonLink size="sm" variant={inProgress ? "primary" : "secondary"} href={`/app/together?session=${s.id}`} aria-label={`${inProgress ? "Resume" : "Open the booklet for"} ${s.occasion}`}>
                  {inProgress ? "Resume" : "Booklet"}
                </ButtonLink>
                <Button size="sm" variant="ghost" aria-label={`Remove ${s.occasion} from this list`} onClick={() => setRemoving(s)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remove this session?"
        body={removing?.status === "in_progress" ? "You won't be able to resume it. Answers already kept stay in the capsule." : "The booklet won't be listed here any more. Answers already kept stay in the capsule."}
        confirmLabel="Remove session"
        tone="danger"
        onConfirm={async () => {
          if (removing) await services().drafts.removeGathering(removing.id);
          setRemoving(null);
        }}
      />
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* At the table                                                               */
/* -------------------------------------------------------------------------- */

function useDeck(session: GatheringSession) {
  const questions = useDb((d) => d.questions);
  return React.useMemo(() => session.questionIds.map((id) => questions.find((q) => q.id === id)).filter((q): q is Question => !!q), [session.questionIds, questions]);
}

function Table({ session }: { session: GatheringSession }) {
  const capsule = useDb((d) => d.capsules.find((c) => c.id === session.capsuleId));
  const deck = useDeck(session);
  const [handoff, setHandoff] = React.useState(false);
  const { index, turn, guests } = session;
  const q = deck[index];
  const speaker = guests[turn % guests.length];
  const nextSpeaker = guests[(turn + 1) % guests.length];
  const last = index >= deck.length - 1;

  const persist = async (patch: Parameters<ReturnType<typeof services>["drafts"]["updateGathering"]>[1]) => {
    const r = await services().drafts.updateGathering(session.id, patch);
    if (r.status !== "ok") toast.error("Progress not saved", r.status === "error" ? r.message : undefined);
    await flushSave().catch(() => undefined);
  };

  const onKept = async (memoryId: string) => {
    const answers = [...session.answers, { memoryId, speakerKey: speaker.key, questionId: q.id }];
    if (last) return persist({ answers, status: "finished" });
    await persist({ answers, index: index + 1, turn: turn + 1 });
    if (guests.length > 1) setHandoff(true);
  };

  if (!capsule || !q)
    return (
      <div className="mx-auto max-w-[720px] py-10">
        <EmptyState icon={<History className="size-6" />} title="This session can't continue" body={!capsule ? "Its capsule is no longer on this device." : "Its questions are no longer in the library."} action={<Button onClick={() => void persist({ status: "finished" })}>See what was kept</Button>} />
      </div>
    );

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {session.occasion} · question {index + 1} of {deck.length}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.875rem] text-ink-3">
            {pluralize(session.answers.length, "answer")} kept · <span className="whitespace-nowrap">progress saved</span>
          </span>
          <ButtonLink size="sm" variant="ghost" href="/app/together">
            Pause
          </ButtonLink>
          <Button size="sm" variant="ghost" onClick={() => void persist({ status: "finished" })}>
            End & see booklet
          </Button>
        </div>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index}>
        <div className="h-full rounded-full bg-evergreen transition-[width] duration-700" style={{ width: `${(index / deck.length) * 100}%` }} />
      </div>

      {handoff ? (
        <div className="grid min-h-[460px] place-items-center rounded-[20px] bg-[#2e312a] px-6 py-16 text-center text-[#f3efe7]" aria-live="polite">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f3efe7]/10">
              <Check className="size-6" />
            </span>
            <p className="mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#c9c2b3]">Kept</p>
            <p className="mx-auto mt-3 max-w-md font-serif text-[clamp(2rem,1.6rem+1.6vw,3rem)] leading-[1.08]">
              Pass it to <em>{speaker.name}.</em>
            </p>
            <Button size="xl" variant="light" className="mt-10" autoFocus onClick={() => setHandoff(false)}>
              I&rsquo;m {speaker.name}, ready
            </Button>
          </div>
        </div>
      ) : (
        <Turn
          key={`${index}:${turn}`}
          session={session}
          question={q}
          speaker={speaker}
          nextSpeaker={nextSpeaker}
          onKept={onKept}
          onSkip={() => persist(last ? { status: "finished" } : { index: index + 1 })}
          onPass={() => persist({ turn: turn + 1 })}
        />
      )}
    </div>
  );
}

/**
 * One person answering one question. Keyed by question and turn, so it starts fresh for
 * each; the answer in progress is saved as a draft and comes back after a reload.
 */
function Turn({
  session,
  question: q,
  speaker,
  nextSpeaker,
  onKept,
  onSkip,
  onPass,
}: {
  session: GatheringSession;
  question: Question;
  speaker: GatheringGuest;
  nextSpeaker: GatheringGuest;
  onKept: (memoryId: string) => Promise<void>;
  onSkip: () => Promise<void>;
  onPass: () => Promise<void>;
}) {
  const capsule = useDb((d) => d.capsules.find((c) => c.id === session.capsuleId))!;
  const organizerPersonId = useDb((d) => d.account.profile.personId);
  const [mode, setMode] = React.useState<"voice" | "type">("voice");
  const [audio, setAudio] = React.useState<RecordedAudio | null>(null);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [recorderKey, setRecorderKey] = React.useState(0);
  const [restored, setRestored] = React.useState<{ url: string } | null>(null);
  const [ready, setReady] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const savedAudio = React.useRef<RecordedAudio | null>(null);
  const draftKey = `${session.capsuleId}:gathering:${session.id}`;
  const fields = { key: draftKey, capsuleId: session.capsuleId, questionId: q.id, label: q.text, who: speaker.key, text, title: "", date: { precision: "unknown" as const } };

  // Bring back an answer that was in progress for this exact question and speaker.
  React.useEffect(() => {
    let live = true;
    void services()
      .drafts.loadCaptureDraft(draftKey)
      .then((r) => {
        if (!live) return;
        const d = r.status === "ok" ? r.data : null;
        if (d && d.draft.questionId === q.id && d.draft.who === speaker.key) {
          setText(d.draft.text);
          if (d.audio) {
            savedAudio.current = d.audio;
            setAudio(d.audio);
            setRestored({ url: URL.createObjectURL(d.audio.blob) });
          } else if (d.draft.text) setMode("type");
        }
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, [draftKey, q.id, speaker.key]);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!ready || !text.trim()) return;
    const t = setTimeout(() => void services().drafts.saveCaptureDraft(fields), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fields is rebuilt from these values
  }, [ready, text]);

  React.useEffect(() => {
    if (!ready || audio === savedAudio.current) return;
    savedAudio.current = audio;
    void services().drafts.saveCaptureDraft(fields, { audio: audio ? { blob: audio.blob, durationSec: audio.durationSec, peaks: audio.peaks, source: audio.source } : null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new recording should trigger this
  }, [ready, audio]);

  React.useEffect(
    () => () => {
      if (restored) URL.revokeObjectURL(restored.url);
    },
    [restored],
  );

  const leave = async (then: () => Promise<void>) => {
    setSaving(true);
    await services().drafts.discardCaptureDraft(draftKey);
    await then();
  };

  const keep = async () => {
    if (!audio && !text.trim()) return;
    setSaving(true);
    try {
      const s = services();
      let audioId: string | undefined;
      if (audio) {
        const m = await s.media.put({ capsuleId: capsule.id, blob: audio.blob, kind: "audio", caption: `“${q.text}”, ${speaker.name}`, alt: `${speaker.name} answering at ${session.occasion}`, contributorName: speaker.name, durationSec: audio.durationSec, peaks: audio.peaks });
        if (m.status !== "ok") throw new Error(m.message);
        audioId = m.data.id;
      }
      const own = !!speaker.personId && speaker.personId === organizerPersonId;
      const r = await s.capsules.createMemory({
        capsuleId: capsule.id,
        title: q.text,
        narrative: text.trim(),
        quote: "",
        date: { precision: "unknown" },
        chapter: q.chapter,
        privacy: capsule.defaultPrivacy,
        tags: ["together", session.occasion.toLowerCase().slice(0, 32)],
        peopleIds: speaker.personId ? [speaker.personId] : [],
        consent: { print: true, export: true, share: false },
        photoIds: [],
        audioId,
        questionId: q.id,
        attribution: { personId: speaker.personId, displayName: speaker.name, relationship: speaker.relationship, via: "recording_session" },
        status: own ? "approved" : "submitted",
      });
      if (r.status !== "ok") throw new Error(r.status === "error" ? r.message : "Not saved");
      await s.drafts.discardCaptureDraft(draftKey);
      await onKept(r.data.id);
    } catch (e) {
      toast.error("Couldn't keep that answer", e instanceof Error ? e.message : undefined);
      setSaving(false);
    }
  };

  return (
    <article className="rounded-[20px] border border-line bg-surface px-6 py-10 shadow-[0_24px_50px_-36px_rgb(33_61_49/0.45)] sm:px-12 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-evergreen/10 py-1 pl-1 pr-4 text-[0.9375rem] text-evergreen">
          <Avatar name={speaker.name} size="sm" /> {speaker.name}&rsquo;s turn
        </span>
        <Segmented
          label="Answer by"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "voice", label: "Speak", icon: <Mic className="size-4" /> },
            { value: "type", label: "Type", icon: <Keyboard className="size-4" /> },
          ]}
        />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-10 max-w-3xl !font-serif text-[clamp(2.2rem,1.6rem+2.6vw,3.8rem)] !font-normal leading-[1.06] tracking-[-0.035em] outline-none">
        {q.text}
      </h1>
      {q.followUps[0] ? <p className="mt-4 text-[1.0625rem] text-ink-3">If it helps: {q.followUps[0]}</p> : null}
      <div className="mt-10">
        <div hidden={mode !== "voice"}>
          {restored && audio ? (
            <div className="rounded-[20px] border border-line bg-paper p-5">
              <p className="flex items-center gap-2 text-[0.9375rem] font-medium">
                <History className="size-4 text-evergreen" /> {speaker.name}&rsquo;s recording, restored · {formatDuration(audio.durationSec)}
              </p>
              <audio controls src={restored.url} className="mt-4 w-full" aria-label="Restored recording" />
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                leading={<RotateCcw className="size-4" />}
                onClick={() => {
                  setAudio(null);
                  setRestored(null);
                  setRecorderKey((k) => k + 1);
                }}
              >
                Record again
              </Button>
            </div>
          ) : (
            <Recorder key={recorderKey} onChange={setAudio} onTypeInstead={() => setMode("type")} />
          )}
        </div>
        {mode === "type" ? <Textarea aria-label={`${speaker.name}'s answer`} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write it as they say it…" className="text-[1.125rem]" /> : null}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" disabled={saving} leading={<SkipForward className="size-4" />} onClick={() => void leave(onSkip)}>
            Different question
          </Button>
          {nextSpeaker.key !== speaker.key ? (
            <Button variant="ghost" disabled={saving} leading={<Users className="size-4" />} onClick={() => void leave(onPass)}>
              Pass to {nextSpeaker.name}
            </Button>
          ) : null}
        </div>
        <Button size="lg" onClick={() => void keep()} loading={saving} disabled={!audio && !text.trim()}>
          Keep this answer
        </Button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Booklet                                                                    */
/* -------------------------------------------------------------------------- */

function Booklet({ session }: { session: GatheringSession }) {
  const capsule = useDb((d) => d.capsules.find((c) => c.id === session.capsuleId));
  const media = useDb((d) => d.media);
  const memories = useDb((d) => d.memories);
  const questions = useDb((d) => d.questions);
  const answers = session.answers.flatMap((a) => {
    const memory = memories.find((m) => m.id === a.memoryId && !m.deletedAt);
    if (!memory) return [];
    const speaker = session.guests.find((g) => g.key === a.speakerKey);
    return [{ memory, speakerName: speaker?.name ?? memory.attribution.displayName, question: questions.find((q) => q.id === a.questionId)?.text ?? memory.title }];
  });
  const pendingReview = answers.filter((a) => a.memory.status === "submitted").length;

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.9375rem] text-ink-2">{answers.length ? `${pluralize(answers.length, "answer")} kept for ${capsule?.subjectName}'s capsule.` : "No answers were kept this time."}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leading={<Printer className="size-4" />} onClick={() => window.print()} disabled={!answers.length}>
            Print the booklet
          </Button>
          {pendingReview ? (
            <ButtonLink variant="secondary" href="/app/invitations?tab=review">
              Review {pendingReview}
            </ButtonLink>
          ) : null}
          <ButtonLink variant="ghost" leading={<RotateCcw className="size-4" />} href="/app/together">
            Another round
          </ButtonLink>
        </div>
      </div>

      <article className="rounded-[6px] bg-[#fbf9f5] px-7 py-12 text-[#252421] shadow-[0_30px_60px_-40px_rgb(33_61_49/0.5)] print:shadow-none sm:px-16 sm:py-16">
        <header className="border-b border-[#ddd6ca] pb-10 text-center">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#5b564d]">{formatDate(session.startedAt, "long")}</p>
          <h1 className="mx-auto mt-5 max-w-xl !font-serif text-[clamp(2.4rem,1.8rem+2.4vw,3.6rem)] !font-normal leading-[1.04] tracking-[-0.035em]">{session.occasion}</h1>
          <p className="mt-4 font-serif text-[1.15rem] italic text-[#55504a]">With {joinNames(session.guests.map((g) => g.name))}</p>
        </header>
        {answers.length === 0 ? (
          <p className="py-16 text-center text-[#55504a]">The table was quiet tonight. That&rsquo;s alright, try again another evening.</p>
        ) : (
          <ol className="divide-y divide-[#e6e0d5]">
            {answers.map((a, i) => {
              const audio = a.memory.audioId ? media.find((m) => m.id === a.memory.audioId) : undefined;
              return (
                <li key={a.memory.id} className="break-inside-avoid py-10">
                  <p className="font-mono text-[0.75rem] text-[#5f5a52]">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 font-serif text-[1.7rem] leading-tight tracking-[-0.02em]">{a.question}</h2>
                  <p className="mt-2 text-[0.875rem] font-medium text-[#586354]">{a.speakerName}</p>
                  {a.memory.narrative ? <p className="mt-4 whitespace-pre-line font-serif text-[1.15rem] leading-[1.65] text-[#2c2a27]">{a.memory.narrative}</p> : null}
                  {audio ? (
                    <>
                      <div className="no-print mt-4">
                        <AudioPlayer asset={audio} title={`${a.speakerName}'s answer`} variant="inline" />
                      </div>
                      <p className="mt-3 hidden font-serif italic text-[#55504a] print:block">A recorded answer ({formatDuration(audio.durationSec ?? 0)}), listen in the family archive.</p>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        <footer className="border-t border-[#ddd6ca] pt-8 text-center text-[0.8125rem] text-[#5f5a52]">Kept in {capsule?.subjectName}&rsquo;s capsule with {brand.name}</footer>
      </article>
      <p className="no-print mt-6 text-center text-[0.875rem] text-ink-3">
        Answers from guests are waiting in <Link href="/app/invitations?tab=review" className="text-link">review</Link>, tidy titles, add dates, and choose who sees them.
      </p>
    </div>
  );
}

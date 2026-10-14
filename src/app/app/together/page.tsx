"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Keyboard, Mic, Plus, Printer, RotateCcw, SkipForward, Users, X } from "lucide-react";
import type { Memory, Question, QuestionCategory } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Avatar } from "@/components/studio/persona-switcher";
import { Recorder, type RecordedAudio } from "@/components/capture/recorder";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { Field, Input, Segmented, Select, Textarea } from "@/components/ui/field";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { flushSave } from "@/store/demo-store";
import { cn, formatDate, formatDuration, pluralize } from "@/lib/utils";

type Guest = { key: string; name: string; personId?: string; relationship?: string };
type Answer = { memory: Memory; speaker: Guest; question: Question };
type Session = { capsuleId: string; occasion: string; guests: Guest[]; deck: Question[]; startedAt: string };

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

export default function TogetherPage() {
  const hydrated = useHydrated();
  const [session, setSession] = React.useState<Session | null>(null);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [done, setDone] = React.useState(false);

  if (!hydrated) return <Skeleton className="mx-auto h-[70vh] max-w-[1080px]" />;
  if (session && done) return <Booklet session={session} answers={answers} onAgain={() => { setSession(null); setAnswers([]); setDone(false); }} />;
  if (session) return <Table session={session} answers={answers} onAnswer={(a) => setAnswers((x) => [...x, a])} onEnd={() => setDone(true)} />;
  return <Setup onStart={setSession} />;
}

/* -------------------------------------------------------------------------- */
/* Setup                                                                      */
/* -------------------------------------------------------------------------- */

function Setup({ onStart }: { onStart: (s: Session) => void }) {
  const capsules = useDb((d) => d.capsules);
  const people = useDb((d) => d.people);
  const questions = useDb((d) => d.questions);
  const [capsuleId, setCapsuleId] = React.useState("cap_margaret");
  const [occasion, setOccasion] = React.useState("Around the table");
  const [guests, setGuests] = React.useState<Guest[]>(() => people.filter((p) => ["per_margaret", "per_sarah", "per_emma"].includes(p.id)).map((p) => ({ key: p.id, name: p.givenName, personId: p.id, relationship: p.shortBio })));
  const [newGuest, setNewGuest] = React.useState("");
  const [cats, setCats] = React.useState<QuestionCategory[]>(["Holidays", "Traditions", "Recipes"]);
  const [length, setLength] = React.useState<"6" | "10" | "15">("6");
  const pool = questions.filter((q) => cats.includes(q.category));

  const toggle = (g: Guest) => setGuests((xs) => (xs.some((x) => x.key === g.key) ? xs.filter((x) => x.key !== g.key) : [...xs, g]));

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Holiday session"
        title={
          <>
            Pass the phone. <em>Keep the stories.</em>
          </>
        }
        description="When everyone's together, let one device go around the table. One question each, answered out loud — and a little booklet of the evening at the end."
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Who's at the table?" description="Tap to add or remove. Guests don't need an account.">
            <div className="flex flex-wrap gap-2">
              {people.map((p) => {
                const on = guests.some((g) => g.personId === p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle({ key: p.id, name: p.givenName, personId: p.id, relationship: p.shortBio })} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[0.9375rem] transition", on ? "border-evergreen bg-evergreen text-paper" : "border-line bg-surface hover:border-ink/30")}>
                    <Avatar name={p.displayName} size="sm" className={on ? "bg-paper/20 text-paper" : undefined} />
                    {p.givenName}
                    {on ? <Check className="size-4" /> : null}
                  </button>
                );
              })}
              {guests
                .filter((g) => !g.personId)
                .map((g) => (
                  <span key={g.key} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-evergreen bg-evergreen py-1 pl-4 pr-1 text-[0.9375rem] text-paper">
                    {g.name}
                    <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-paper/15" aria-label={`Remove ${g.name}`} onClick={() => toggle(g)}>
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
              <Input aria-label="Add a guest" placeholder="Add a guest — a neighbour, a friend…" value={newGuest} onChange={(e) => setNewGuest(e.target.value)} maxLength={40} />
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
                  <button key={c.value} type="button" aria-pressed={on} onClick={() => setCats((xs) => (on ? xs.filter((x) => x !== c.value) : [...xs, c.value]))} className={cn("min-h-10 rounded-[9px] border px-4 text-[0.9375rem] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/30")}>
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
          <div className="rounded-[16px] bg-[#213d31] p-6 text-[#f3f3e8]">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#bdc9aa]">Tonight</p>
            <p className="mt-3 font-serif text-[1.9rem] leading-tight">
              {pluralize(guests.length, "person", "people")}, {length} questions
            </p>
            <p className="mt-2 text-[0.9375rem] text-[#c0cbbb]">{pool.length} questions in the deck. Everyone takes a turn in order; anyone can pass.</p>
            <Button
              size="lg"
              variant="light"
              block
              className="mt-6"
              disabled={guests.length < 1 || pool.length === 0}
              trailing={<ArrowRight className="size-4" />}
              onClick={() => onStart({ capsuleId, occasion: occasion.trim() || "Around the table", guests, deck: shuffle(pool, Date.now() % 100000).slice(0, Number(length)), startedAt: new Date().toISOString() })}
            >
              Begin
            </Button>
          </div>
          <DemoNotice>Recordings stay on this device. Answers from guests wait in review, so you decide later who sees them.</DemoNotice>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* At the table                                                               */
/* -------------------------------------------------------------------------- */

function Table({ session, answers, onAnswer, onEnd }: { session: Session; answers: Answer[]; onAnswer: (a: Answer) => void; onEnd: () => void }) {
  const capsule = useDb((d) => d.capsules.find((c) => c.id === session.capsuleId));
  const organizerPersonId = useDb((d) => d.account.profile.personId);
  const [index, setIndex] = React.useState(0);
  const [turn, setTurn] = React.useState(0);
  const [mode, setMode] = React.useState<"voice" | "type">("voice");
  const [audio, setAudio] = React.useState<RecordedAudio | null>(null);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [handoff, setHandoff] = React.useState(false);
  const [recorderKey, setRecorderKey] = React.useState(0);
  const q = session.deck[index];
  const speaker = session.guests[turn % session.guests.length];
  const nextSpeaker = session.guests[(turn + 1) % session.guests.length];
  const last = index >= session.deck.length - 1;

  const advance = (nextTurn: boolean) => {
    setAudio(null);
    setText("");
    setRecorderKey((k) => k + 1);
    if (last) return onEnd();
    setIndex((i) => i + 1);
    if (nextTurn) setTurn((t) => t + 1);
  };

  const keep = async () => {
    if (!capsule || (!audio && !text.trim())) return;
    setSaving(true);
    try {
      const s = services();
      let audioId: string | undefined;
      if (audio) {
        const m = await s.media.put({ capsuleId: capsule.id, blob: audio.blob, kind: "audio", caption: `“${q.text}” — ${speaker.name}`, alt: `${speaker.name} answering at ${session.occasion}`, contributorName: speaker.name, durationSec: audio.durationSec, peaks: audio.peaks });
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
      await flushSave().catch(() => undefined);
      onAnswer({ memory: r.data, speaker, question: q });
      if (last) return onEnd();
      setHandoff(true);
    } catch (e) {
      toast.error("Couldn't keep that answer", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  if (!capsule || !q) return null;

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {session.occasion} · question {index + 1} of {session.deck.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[0.875rem] text-ink-3">{pluralize(answers.length, "answer")} kept</span>
          <Button size="sm" variant="ghost" onClick={onEnd}>
            End & see booklet
          </Button>
        </div>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-evergreen transition-[width] duration-700" style={{ width: `${((index + (handoff ? 1 : 0)) / session.deck.length) * 100}%` }} />
      </div>

      {handoff ? (
        <div className="grid min-h-[460px] place-items-center rounded-[20px] bg-[#213d31] px-6 py-16 text-center text-[#f3f3e8]" aria-live="polite">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f3f3e8]/10">
              <Check className="size-6" />
            </span>
            <p className="mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#bdc9aa]">Kept</p>
            <p className="mx-auto mt-3 max-w-md font-serif text-[clamp(2rem,1.6rem+1.6vw,3rem)] leading-[1.08]">
              Pass it to <em>{nextSpeaker.name}.</em>
            </p>
            <Button
              size="xl"
              variant="light"
              className="mt-10"
              onClick={() => {
                setHandoff(false);
                advance(true);
              }}
            >
              I&rsquo;m {nextSpeaker.name} — ready
            </Button>
          </div>
        </div>
      ) : (
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
          <h1 className="mt-10 max-w-3xl !font-serif text-[clamp(2.2rem,1.6rem+2.6vw,3.8rem)] !font-normal leading-[1.06] tracking-[-0.035em]">{q.text}</h1>
          {q.followUps[0] ? <p className="mt-4 text-[1.0625rem] text-ink-3">If it helps: {q.followUps[0]}</p> : null}
          <div className="mt-10">
            {mode === "voice" ? (
              <Recorder key={recorderKey} onChange={setAudio} onTypeInstead={() => setMode("type")} />
            ) : (
              <Textarea aria-label={`${speaker.name}'s answer`} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write it as they say it…" className="text-[1.125rem]" />
            )}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" leading={<SkipForward className="size-4" />} onClick={() => advance(false)}>
                Different question
              </Button>
              <Button variant="ghost" leading={<Users className="size-4" />} onClick={() => setTurn((t) => t + 1)}>
                {nextSpeaker.key === speaker.key ? "Pass" : `Pass to ${nextSpeaker.name}`}
              </Button>
            </div>
            <Button size="lg" onClick={() => void keep()} loading={saving} disabled={!audio && !text.trim()}>
              Keep this answer
            </Button>
          </div>
        </article>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Booklet                                                                    */
/* -------------------------------------------------------------------------- */

function Booklet({ session, answers, onAgain }: { session: Session; answers: Answer[]; onAgain: () => void }) {
  const capsule = useDb((d) => d.capsules.find((c) => c.id === session.capsuleId));
  const media = useDb((d) => d.media);
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
          <Button variant="ghost" leading={<RotateCcw className="size-4" />} onClick={onAgain}>
            Another round
          </Button>
        </div>
      </div>

      <article className="rounded-[6px] bg-[#fbfaf4] px-7 py-12 shadow-[0_30px_60px_-40px_rgb(33_61_49/0.5)] print:shadow-none sm:px-16 sm:py-16">
        <header className="border-b border-[#d8dccd] pb-10 text-center">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#5b6b55]">{formatDate(session.startedAt, "long")}</p>
          <h1 className="mx-auto mt-5 max-w-xl !font-serif text-[clamp(2.4rem,1.8rem+2.4vw,3.6rem)] !font-normal leading-[1.04] tracking-[-0.035em]">{session.occasion}</h1>
          <p className="mt-4 font-serif text-[1.15rem] italic text-[#55604f]">
            With {session.guests.map((g) => g.name).join(", ").replace(/, ([^,]*)$/, " and $1")}
          </p>
        </header>
        {answers.length === 0 ? (
          <p className="py-16 text-center text-ink-3">The table was quiet tonight. That&rsquo;s alright — try again another evening.</p>
        ) : (
          <ol className="divide-y divide-[#e2e4d8]">
            {answers.map((a, i) => {
              const audio = a.memory.audioId ? media.find((m) => m.id === a.memory.audioId) : undefined;
              return (
                <li key={a.memory.id} className="break-inside-avoid py-10">
                  <p className="font-mono text-[0.75rem] text-[#7a8473]">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 font-serif text-[1.7rem] leading-tight tracking-[-0.02em]">{a.question.text}</h2>
                  <p className="mt-2 text-[0.875rem] font-medium text-[#476049]">{a.speaker.name}</p>
                  {a.memory.narrative ? <p className="mt-4 whitespace-pre-line font-serif text-[1.15rem] leading-[1.65] text-[#2c332d]">{a.memory.narrative}</p> : null}
                  {audio ? (
                    <>
                      <div className="no-print mt-4">
                        <AudioPlayer asset={audio} title={`${a.speaker.name}'s answer`} variant="inline" />
                      </div>
                      <p className="mt-3 hidden font-serif italic text-[#55604f] print:block">A recorded answer ({formatDuration(audio.durationSec ?? 0)}) — listen in the family archive.</p>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        <footer className="border-t border-[#d8dccd] pt-8 text-center text-[0.8125rem] text-[#6c7569]">Kept in {capsule?.subjectName}&rsquo;s capsule with LifeAtlas</footer>
      </article>
      <p className="no-print mt-6 text-center text-[0.875rem] text-ink-3">
        Answers from guests are waiting in <Link href="/app/invitations?tab=review" className="text-link">review</Link> — tidy titles, add dates, and choose who sees them.
      </p>
    </div>
  );
}

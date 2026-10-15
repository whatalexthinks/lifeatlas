"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, Check, Circle, Lock, Mail, MapPin, Mic, Shuffle } from "lucide-react";
import type { CapsuleKind } from "@/domain/models";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { Plate } from "@/components/media/media-image";
import { AudioPlayer } from "@/components/audio/audio-player";
import { capsuleKinds, surpriseQuestion } from "@/domain/capsule-kinds";
import { questionLibrary } from "@/data/prompts/questions";
import { formatFuzzyDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { people as samplePeople } from "@/data/fixtures/people";
import { photoAlt, placeLabel, plateOf, sampleAudio, sampleCapsule, sampleMemory, sampleStories } from "./samples";
import { SampleTag } from "./kit";

/* ------------------------------------------------------------------ */
/* Capsule covers                                                       */
/* ------------------------------------------------------------------ */

/** Three sample capsules, fanned like books on a table. */
export function CapsuleFan({ ids = ["cap_family", "cap_us", "cap_margaret"], className }: { ids?: string[]; className?: string }) {
  const list = ids.map(sampleCapsule);
  return (
    <figure className={cn("relative mx-auto aspect-[5/4] w-full max-w-[560px]", className)}>
      {list.map((c, i) => {
        const pos = [
          "left-0 top-[8%] w-[46%] -rotate-[5deg]",
          "left-[27%] top-0 z-10 w-[48%]",
          "right-0 top-[10%] w-[44%] rotate-[5deg]",
        ][i];
        return (
          <div key={c.id} className={cn("absolute transition-transform duration-700 motion-reduce:transition-none", pos)}>
            <CapsuleCover capsule={c} size="sm" className="aspect-[4/5] rounded-[14px] shadow-[var(--shadow-object)]" />
          </div>
        );
      })}
      <figcaption className="absolute -bottom-2 left-0 right-0 flex justify-center">
        <SampleTag>Sample capsules · fictional family</SampleTag>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* A story page                                                         */
/* ------------------------------------------------------------------ */

export function StoryPreview({ memoryId = "mem_us_met", className, compact }: { memoryId?: string; className?: string; compact?: boolean }) {
  const m = sampleMemory(memoryId);
  const plate = plateOf(m.photoIds[0]);
  const capsule = sampleCapsule(m.capsuleId);
  const place = placeLabel(m.placeId);
  const paragraphs = m.narrative.split("\n\n");
  return (
    <figure className={cn("overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_40px_80px_-50px_rgb(37_36_33/0.45)]", className)}>
      {plate ? <Plate id={plate} alt={photoAlt(m.photoIds[0])} className="aspect-[16/10]" /> : null}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="catalog">
            {capsule.title} · {capsuleKinds.couple.chapterTitles[m.chapter] ?? m.chapter}
          </p>
          <SampleTag />
        </div>
        <h3 className="mt-4 font-serif text-[clamp(1.6rem,1.35rem+1vw,2.2rem)] leading-[1.1] tracking-[-0.01em]">{m.title}</h3>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-ink-3">
          <span>{formatFuzzyDate(m.date)}</span>
          {place ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {place}
            </span>
          ) : null}
          <span>Told by {m.attribution.displayName.split(" ")[0]}</span>
        </p>
        <div className="mt-5 space-y-3 font-serif text-[1.125rem] leading-[1.6] text-ink">
          {(compact ? paragraphs.slice(0, 1) : paragraphs.slice(0, 2)).map((p, i) => (
            <p key={i} className={cn(i === 0 && "drop-cap")}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                             */
/* ------------------------------------------------------------------ */

export function TimelinePreview({ capsuleId = "cap_us", limit = 6, className }: { capsuleId?: string; limit?: number; className?: string }) {
  const stories = sampleStories(capsuleId)
    .filter((m, i, arr) => arr.findIndex((x) => x.title === m.title) === i && !m.title.startsWith("What I first noticed"))
    .slice(0, limit);
  return (
    <figure className={cn("rounded-[22px] border border-line bg-surface p-6 sm:p-8", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="catalog">Timeline · {sampleCapsule(capsuleId).title}</p>
        <SampleTag />
      </div>
      <ol className="relative mt-6 space-y-5 before:absolute before:bottom-2 before:left-[7.5rem] before:top-2 before:w-px before:bg-line-strong">
        {stories.map((m) => (
          <li key={m.id} className="relative grid grid-cols-[6.5rem_1fr] items-start gap-8">
            <span className="whitespace-nowrap pt-1 text-right font-mono text-[0.6875rem] uppercase tracking-[0.04em] text-ink-3">{formatFuzzyDate(m.date, "short")}</span>
            <span className="relative">
              <span className="absolute -left-[1.32rem] top-2 size-2.5 rounded-full border-2 border-surface bg-oxblood ring-1 ring-oxblood/40" aria-hidden />
              <span className="block font-serif text-[1.15rem] leading-snug">{m.title}</span>
              {placeLabel(m.placeId) ? <span className="text-[0.8125rem] text-ink-3">{placeLabel(m.placeId)}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="mt-6 border-t border-line pt-4 text-[0.8125rem] text-ink-3">Dates can be exact, a season, “around 1950” or simply unknown. Nothing is guessed for you.</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Try a question                                                       */
/* ------------------------------------------------------------------ */

const tryKinds: CapsuleKind[] = ["couple", "family", "personal", "parent", "child"];

/** A working piece of the product: pick whose story, then ask for a question. */
export function QuestionTry({ initialKind = "couple", className }: { initialKind?: CapsuleKind; className?: string }) {
  const [kind, setKind] = React.useState<CapsuleKind>(initialKind);
  const [seen, setSeen] = React.useState<string[]>([]);
  const [questionId, setQuestionId] = React.useState<string | null>(null);
  const first = React.useMemo(() => questionLibrary.find((q) => q.audiences?.includes(kind)) ?? questionLibrary[0], [kind]);
  const question = questionLibrary.find((q) => q.id === questionId) ?? first;
  const surprise = () => {
    const exclude = new Set([...seen, question.id]);
    const q = surpriseQuestion(kind, questionLibrary, exclude);
    if (!q) return;
    setSeen([...exclude]);
    setQuestionId(q.id);
  };
  return (
    <div className={cn("rounded-[24px] bg-night p-6 text-night-ink shadow-[var(--shadow-object)] sm:p-8", className)}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Whose story">
        {tryKinds.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === kind}
            onClick={() => {
              setKind(k);
              setQuestionId(null);
              setSeen([]);
            }}
            className={cn("min-h-10 rounded-full border px-3.5 text-[0.875rem] font-medium transition-colors", k === kind ? "border-night-accent bg-night-accent text-night" : "border-night-line text-night-ink-2 hover:border-night-ink-3 hover:text-night-ink")}
          >
            {capsuleKinds[k].label}
          </button>
        ))}
      </div>
      <div className="mt-8 min-h-[9.5rem]" role="status" aria-label="Suggested question">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-night-accent">{question.category}</p>
        <p className="mt-3 font-serif text-[clamp(1.65rem,1.3rem+1.4vw,2.5rem)] leading-[1.12]">{question.text}</p>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={surprise} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night-ink px-5 text-[0.9375rem] font-medium text-night transition-opacity hover:opacity-90">
          <Shuffle className="size-4" aria-hidden /> Surprise me with a question
        </button>
        <Link href={`/app/capsules/new?kind=${kind}`} className="inline-flex min-h-11 items-center gap-2 px-2 text-[0.9375rem] font-medium text-night-ink-2 hover:text-night-ink">
          Answer it in your own capsule <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-6 text-[0.8125rem] text-night-ink-3">From a library of {questionLibrary.length} questions. Skip any, save some for later, answer one twice.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Voice                                                                */
/* ------------------------------------------------------------------ */

export function VoicePreview({ audioId = "aud_bread", title = "The kitchen always smelled of bread", className }: { audioId?: string; title?: string; className?: string }) {
  const asset = sampleAudio(audioId);
  return (
    <figure className={cn("rounded-[22px] border border-line bg-surface p-6 sm:p-7", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="catalog flex items-center gap-2">
          <Mic className="size-3.5" aria-hidden /> A recorded answer
        </p>
        <SampleTag>Synthesized sample voice</SampleTag>
      </div>
      {asset ? <AudioPlayer asset={asset} title={title} className="mt-5" showNotice={false} /> : null}
      <figcaption className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">A fictional story read by an open-source text-to-speech voice — not a real person. Your recordings stay exactly as spoken; we never invent a transcript.</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* An invitation, as the contributor sees it                            */
/* ------------------------------------------------------------------ */

export function InvitationPreview({ className }: { className?: string }) {
  const capsule = sampleCapsule("cap_family");
  return (
    <figure className={cn("overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_40px_80px_-50px_rgb(37_36_33/0.45)]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <p className="catalog flex items-center gap-2">
          <Mail className="size-3.5" aria-hidden /> An invitation to contribute
        </p>
        <SampleTag />
      </div>
      <div className="grid gap-6 p-6 sm:grid-cols-[120px_1fr] sm:p-7">
        {capsule.cover.plateId ? <Plate id={capsule.cover.plateId} alt="" className="hidden aspect-[4/5] rounded-[10px] sm:block" /> : null}
        <div>
          <p className="text-[0.9375rem] text-ink-2">Sarah Ellis invited you to add to</p>
          <p className="mt-1 font-serif text-[1.6rem] leading-tight">{capsule.title}</p>
          <dl className="mt-5 space-y-3 text-[0.9375rem]">
            <div className="flex gap-3">
              <dt className="sr-only">Cost</dt>
              <Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden />
              <dd>It&rsquo;s free for you. No plan, no card — ever.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">What happens</dt>
              <Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden />
              <dd>Sarah reads what you add before it joins the capsule.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Your words</dt>
              <Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden />
              <dd>Your stories stay credited to you, and you can ask for them back.</dd>
            </div>
          </dl>
        </div>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Future messages — honest delivery states                             */
/* ------------------------------------------------------------------ */

const ladder: { label: string; detail: string; state: "done" | "available" | "not_yet" }[] = [
  { label: "Draft", detail: "Write a letter, record your voice, add photographs.", state: "done" },
  { label: "Saved on this device", detail: "Kept in your browser as you write.", state: "done" },
  { label: "Uploaded", detail: "Needs hosted accounts — not in this preview.", state: "not_yet" },
  { label: "Scheduled", detail: "Only when a real delivery service confirms it.", state: "not_yet" },
  { label: "Delivered", detail: "Reported by that service, never assumed.", state: "not_yet" },
];

export function FutureMessagePreview({ className }: { className?: string }) {
  return (
    <figure className={cn("rounded-[22px] border border-line bg-surface p-6 sm:p-8", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="catalog flex items-center gap-2">
          <Lock className="size-3.5" aria-hidden /> For our thirtieth anniversary
        </p>
        <SampleTag />
      </div>
      <p className="mt-4 font-serif text-[1.35rem] leading-snug">To be opened on June 16, 2031 — by Sarah &amp; Jonah.</p>
      <ol className="mt-6 space-y-3.5">
        {ladder.map((s) => (
          <li key={s.label} className="flex items-start gap-3">
            {s.state === "done" ? <Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-ink-4" aria-hidden />}
            <span>
              <span className={cn("block text-[0.9375rem] font-medium", s.state === "not_yet" && "text-ink-3")}>
                {s.label}
                <span className="sr-only">{s.state === "done" ? " — reached" : " — not reached"}</span>
              </span>
              <span className="block text-[0.8125rem] text-ink-3">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="mt-6 border-t border-line pt-4 text-[0.8125rem] text-ink-3">We will never call a message “scheduled” until a real delivery service has accepted it.</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* A strip of sample illustrations                                      */
/* ------------------------------------------------------------------ */

export function PlateStrip({ memoryIds, className }: { memoryIds: string[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4", className)}>
      {memoryIds.map((id) => {
        const m = sampleMemory(id);
        const plate = plateOf(m.photoIds[0]);
        if (!plate) return null;
        return (
          <li key={id}>
            <figure className="mount">
              <Plate id={plate} alt={photoAlt(m.photoIds[0])} className="aspect-[4/5]" />
              <figcaption className="px-0.5 pt-3">
                <span className="block font-serif text-[1rem] italic leading-snug text-ink-2">{m.title}</span>
                <span className="catalog mt-1 block">{formatFuzzyDate(m.date, "short")}</span>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Hero composition                                                     */
/* ------------------------------------------------------------------ */

export function HeroComposition({ className }: { className?: string }) {
  const capsule = sampleCapsule("cap_us");
  const met = sampleMemory("mem_us_met");
  const notice = sampleMemory("mem_us_notice_jonah");
  return (
    <figure className={cn("relative mx-auto w-full max-w-[600px] pb-24 sm:pb-32", className)}>
      <div className="ml-auto w-[78%] sm:w-[70%]">
        <CapsuleCover capsule={capsule} size="lg" className="aspect-[4/5] rounded-[20px] shadow-[var(--shadow-object)]" />
      </div>
      <div className="absolute bottom-0 left-0 w-[72%] rounded-[18px] border border-line bg-surface/95 p-5 shadow-[0_30px_60px_-30px_rgb(37_36_33/0.45)] backdrop-blur sm:w-[62%] sm:p-6">
        <p className="catalog">
          {formatFuzzyDate(met.date)} · {placeLabel(met.placeId)}
        </p>
        <p className="mt-2 font-serif text-[1.15rem] italic leading-snug sm:text-[1.3rem]">&ldquo;{met.quote}&rdquo;</p>
        <p className="mt-3 text-[0.8125rem] text-ink-3">Sarah, answering &ldquo;How did we meet?&rdquo;</p>
      </div>
      <div className="absolute left-[4%] top-[8%] hidden w-[46%] rounded-[16px] bg-night p-4 text-night-ink shadow-[var(--shadow-object)] sm:block">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-night-accent">Jonah&rsquo;s answer</p>
        <p className="mt-2 font-serif text-[1.05rem] leading-snug">&ldquo;{notice.quote}&rdquo;</p>
      </div>
      <figcaption className="absolute -bottom-1 right-0 translate-y-full pt-3">
        <SampleTag>Fictional sample capsule</SampleTag>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* One question, two answers                                            */
/* ------------------------------------------------------------------ */

export function TwoAnswers({ className }: { className?: string }) {
  const answers = [sampleMemory("mem_us_notice_sarah"), sampleMemory("mem_us_notice_jonah")];
  const question = questionLibrary.find((q) => q.id === answers[0].questionId);
  return (
    <figure className={cn("rounded-[24px] bg-ivory p-5 sm:p-7", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="catalog">One question · two answers</p>
        <SampleTag />
      </div>
      <p className="mt-4 font-serif text-[clamp(1.4rem,1.2rem+0.8vw,1.85rem)] leading-snug">{question?.text ?? "What did you first notice about me?"}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {answers.map((m, i) => (
          <blockquote key={m.id} className={cn("rounded-[18px] p-5", i === 0 ? "bg-surface" : "bg-night text-night-ink")}>
            <p className={cn("font-mono text-[0.6875rem] uppercase tracking-[0.12em]", i === 0 ? "text-oxblood" : "text-night-accent")}>{m.attribution.displayName.split(" ")[0]}</p>
            <p className="mt-3 font-serif text-[1.1rem] leading-[1.5]">{m.narrative.split("\n\n")[0]}</p>
          </blockquote>
        ))}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Generations                                                          */
/* ------------------------------------------------------------------ */

const generationRows: { label: string; couples: string[][] }[] = [
  { label: "Great-grandparents", couples: [["per_walter", "per_eleanor"]] },
  { label: "Grandparents", couples: [["per_margaret", "per_thomas"], ["per_june"]] },
  { label: "Parents", couples: [["per_sarah", "per_jonah"], ["per_daniel", "per_priya"]] },
  { label: "Children", couples: [["per_emma"], ["per_leo"]] },
];

export function GenerationsPreview({ className }: { className?: string }) {
  const person = (id: string) => samplePeople.find((p) => p.id === id)!;
  return (
    <figure className={cn("rounded-[24px] border border-line bg-surface p-5 sm:p-7", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="catalog">The Ellis family · four generations</p>
        <SampleTag />
      </div>
      <ol className="mt-6 space-y-5">
        {generationRows.map((row) => (
          <li key={row.label}>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">{row.label}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {row.couples.map((pair) => (
                <li key={pair.join()} className="flex flex-wrap items-center gap-1.5 rounded-[14px] bg-ivory p-1.5">
                  {pair.map((id) => {
                    const p = person(id);
                    return (
                      <span key={id} className="inline-flex items-center gap-2 rounded-[10px] bg-surface px-2.5 py-1.5 text-[0.875rem]">
                        <span className="grid size-6 place-items-center rounded-full bg-linen font-serif text-[0.8125rem]">{p.givenName[0]}</span>
                        <span>
                          {p.givenName}
                          <span className="ml-1.5 text-[0.75rem] text-ink-3">
                            {p.birthYear}
                            {p.deathYear ? `–${p.deathYear}` : ""}
                          </span>
                        </span>
                      </span>
                    );
                  })}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <figcaption className="mt-6 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-ink-3">June isn&rsquo;t family by blood — she&rsquo;s Margaret&rsquo;s friend of fifty years, and she belongs here too.</figcaption>
    </figure>
  );
}

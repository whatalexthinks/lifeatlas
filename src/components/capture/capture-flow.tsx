"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ImagePlus, Keyboard, Mic, SkipForward, Sparkles } from "lucide-react";
import type { Capsule, FuzzyDate, Memory, MemoryAttribution, MemoryStatus, Question } from "@/domain/models";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FuzzyDateInput, PlacePicker } from "@/components/capsule/inputs";
import { MediaImage } from "@/components/media/media-image";
import { Recorder, type RecordedAudio } from "./recorder";
import { PhotoAdder, type PendingPhoto } from "./photo-adder";
import { MemoryReveal } from "./memory-reveal";
import { services } from "@/services/factory";
import { flushSave } from "@/store/demo-store";
import { cn } from "@/lib/utils";

type Mode = "voice" | "text";

export interface CaptureFlowProps {
  capsule: Capsule;
  questions: Question[];
  attribution: MemoryAttribution;
  status: MemoryStatus;
  variant: "storyteller" | "organizer";
  invitationToken?: string;
  /** Optional cue image per question id (e.g. an old photo). */
  cues?: Record<string, string>;
  onFinished?: (saved: Memory[]) => void;
  finishHref?: string;
  finishLabel?: string;
  /** Show a one-time first-memory celebration. */
  firstMemory?: boolean;
  allowFreeform?: boolean;
}

/** The question itself is an honest, readable default title — rename any time. */
function titleFromQuestion(q?: Question) {
  return q ? q.text : "";
}

export function CaptureFlow({ capsule, questions, attribution, status, variant, invitationToken, cues, onFinished, finishHref, finishLabel = "See it in the archive", firstMemory, allowFreeform }: CaptureFlowProps) {
  const senior = variant === "storyteller";
  const [index, setIndex] = React.useState(0);
  const [mode, setMode] = React.useState<Mode>("voice");
  const [audio, setAudio] = React.useState<RecordedAudio | null>(null);
  const [text, setText] = React.useState("");
  const [photos, setPhotos] = React.useState<PendingPhoto[]>([]);
  const [showPhotos, setShowPhotos] = React.useState(false);
  const [details, setDetails] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<FuzzyDate>({ precision: "unknown" });
  const [placeId, setPlaceId] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<Memory[]>([]);
  const [justSaved, setJustSaved] = React.useState<Memory | null>(null);
  const [followUp, setFollowUp] = React.useState<string | null>(null);
  const [recorderKey, setRecorderKey] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

  const freeform = allowFreeform && questions.length === 0;
  const q = questions[index];
  const total = Math.max(1, questions.length);
  const done = !freeform && index >= questions.length;
  const hasContent = !!audio || text.trim().length > 0 || photos.length > 0;

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [index, justSaved]);

  const resetForm = () => {
    setAudio(null);
    setText("");
    setPhotos([]);
    setShowPhotos(false);
    setDetails(false);
    setTitle("");
    setDate({ precision: "unknown" });
    setPlaceId(undefined);
    setError(null);
    setFollowUp(null);
    setMode("voice");
    setRecorderKey((k) => k + 1);
  };

  const next = () => {
    setJustSaved(null);
    resetForm();
    setIndex((i) => i + 1);
  };

  const skip = async () => {
    if (q) await services().capsules.markAssignment(capsule.id, q.id, "skipped");
    next();
  };

  const save = async () => {
    if (!hasContent) {
      setError("Record, type or add a photo first — or skip this question.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const s = services();
      const photoIds: string[] = [];
      for (const p of photos) {
        const r = await s.media.put({ capsuleId: capsule.id, blob: p.file, kind: "image", caption: p.caption, alt: p.caption || `Photo shared by ${attribution.displayName}`, contributorName: attribution.displayName, width: p.width, height: p.height });
        if (r.status !== "ok") throw new Error(r.message);
        photoIds.push(r.data.id);
      }
      let audioId: string | undefined;
      const finalTitle = title.trim() || (freeform ? "A memory" : titleFromQuestion(q)) || "A memory";
      if (audio) {
        const r = await s.media.put({ capsuleId: capsule.id, blob: audio.blob, kind: "audio", caption: `“${finalTitle}” — ${attribution.displayName}`, alt: `Recording by ${attribution.displayName}`, contributorName: attribution.displayName, durationSec: audio.durationSec, peaks: audio.peaks });
        if (r.status !== "ok") throw new Error(r.message);
        audioId = r.data.id;
      }
      const res = await s.capsules.createMemory({
        capsuleId: capsule.id,
        title: finalTitle.length >= 2 ? finalTitle : "A memory",
        narrative: text.trim(),
        quote: "",
        date,
        placeId,
        chapter: q?.chapter ?? capsule.startingChapter,
        privacy: capsule.defaultPrivacy,
        tags: [],
        peopleIds: [],
        consent: { print: true, export: true, share: false },
        photoIds,
        audioId,
        questionId: q?.id,
        attribution,
        status,
      });
      if (res.status !== "ok") throw new Error(res.message);
      if (invitationToken) await s.communications.submitContribution(invitationToken, res.data.id);
      await flushSave().catch(() => undefined);
      setSaved((prev) => [...prev, res.data]);
      setJustSaved(res.data);
      setFollowUp(q?.followUps?.[0] ?? null);
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      if (firstMemory && saved.length === 0) s.analytics.track("first_memory_saved", { capsuleId: capsule.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save this on your device. Nothing else was changed.");
      toast.error("Couldn't save on this device", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------- Saved reveal ---------------------------- */
  if (justSaved) {
    const isLast = freeform || index >= questions.length - 1;
    return (
      <div className="mx-auto max-w-2xl" aria-live="polite">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-success-soft text-success animate-[marker-pop_500ms_var(--ease-out)_both]">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <div>
            <h2 ref={headingRef} tabIndex={-1} className={cn("font-serif leading-tight outline-none", senior ? "text-[2rem]" : "text-[1.75rem]")}>
              {firstMemory && saved.length === 1 ? "Your first memory is kept." : status === "submitted" ? "Thank you. It's on its way." : "Kept."}
            </h2>
            <p className={cn("text-ink-3", senior ? "text-[1.05rem]" : "text-[0.9375rem]")}>
              {status === "submitted"
                ? `${capsule.preferredName}'s organizer will see it next. It appears in the archive once approved.`
                : `“${justSaved.title}” is now part of ${capsule.preferredName}'s archive.`}
            </p>
          </div>
        </div>
        <MemoryReveal memory={justSaved} subjectName={capsule.subjectName} />
        <DemoNotice compact className="mt-4">
          Saved on this device for the demo — not uploaded or backed up.
        </DemoNotice>
        {followUp && !isLast ? (
          <div className="mt-6 rounded-[18px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-brass-ink">
              <Sparkles className="size-4" /> A gentle follow-up
            </p>
            <p className={cn("mt-2 font-serif leading-snug", senior ? "text-[1.5rem]" : "text-[1.3rem]")}>{followUp}</p>
            <p className="mt-1 text-[0.875rem] text-ink-3">Only if you&rsquo;d like to — you can always come back to it.</p>
          </div>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {!isLast ? (
            <Button size={senior ? "xl" : "lg"} onClick={next} trailing={<ArrowRight className="size-5" />}>
              Next question
            </Button>
          ) : null}
          {freeform ? (
            <Button
              size={senior ? "xl" : "lg"}
              variant={isLast ? "primary" : "secondary"}
              onClick={() => {
                setJustSaved(null);
                resetForm();
              }}
            >
              Add another memory
            </Button>
          ) : null}
          {isLast ? (
            finishHref ? (
              <ButtonLink href={finishHref} size={senior ? "xl" : "lg"} variant={freeform ? "secondary" : "primary"} onClick={() => onFinished?.(saved)}>
                {finishLabel}
              </ButtonLink>
            ) : (
              <Button size={senior ? "xl" : "lg"} onClick={() => onFinished?.(saved)}>
                {finishLabel}
              </Button>
            )
          ) : null}
        </div>
      </div>
    );
  }

  /* ------------------------------ Finished ------------------------------ */
  if (done) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h2 ref={headingRef} tabIndex={-1} className="font-serif text-heading outline-none">
          That&rsquo;s every question for now.
        </h2>
        <p className="mt-3 text-lead text-ink-2">{saved.length ? `${saved.length} ${saved.length === 1 ? "memory" : "memories"} kept today. Thank you.` : "No answers saved this time — that's perfectly fine."}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {finishHref ? (
            <ButtonLink href={finishHref} size="lg" onClick={() => onFinished?.(saved)}>
              {finishLabel}
            </ButtonLink>
          ) : (
            <Button size="lg" onClick={() => onFinished?.(saved)}>
              {finishLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------ Question ------------------------------ */
  const cue = q && cues?.[q.id];
  return (
    <div className="mx-auto max-w-2xl">
      {!freeform ? (
        <div className="mb-8 flex items-center gap-4">
          <span className="catalog shrink-0">
            Question {index + 1} of {total}
          </span>
          <ProgressBar value={index} max={total} label="Questions answered" />
          <button type="button" onClick={() => void skip()} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-medium text-ink-3 hover:bg-ivory hover:text-ink", senior ? "text-[1rem]" : "text-[0.875rem]")}>
            <SkipForward className="size-4" /> Skip
          </button>
        </div>
      ) : null}

      {cue ? (
        <div className="mb-6 w-40 rotate-[-2deg]">
          <div className="mount">
            <MediaImage mediaId={cue} className="aspect-[4/3]" />
          </div>
        </div>
      ) : null}

      <h2 ref={headingRef} tabIndex={-1} className={cn("font-serif leading-[1.08] tracking-[-0.015em] text-ink outline-none", senior ? "text-[clamp(2.1rem,1.6rem+2.4vw,3.2rem)]" : "text-[clamp(1.8rem,1.4rem+1.6vw,2.5rem)]")}>
        {freeform ? "What would you like to remember?" : q?.text}
      </h2>
      {q?.category ? <p className={cn("mt-3 text-ink-3", senior ? "text-[1.05rem]" : "text-[0.9375rem]")}>From the {q.category.toLowerCase()} questions · answer in any way you like</p> : null}

      {/* Mode switch */}
      <div className="mt-8 grid grid-cols-2 gap-2 rounded-full border border-line bg-ivory/60 p-1" role="tablist" aria-label="How would you like to answer?">
        {(
          [
            ["voice", "Speak", Mic],
            ["text", "Type instead", Keyboard],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors", senior ? "h-14 text-[1.1rem]" : "h-11 text-[0.9375rem]", mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
          >
            <Icon className="size-5" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <div hidden={mode !== "voice"}>
          <Recorder key={recorderKey} onChange={setAudio} size={senior ? "senior" : "standard"} onTypeInstead={() => setMode("text")} />
        </div>
        <div hidden={mode !== "text"}>
          <Label htmlFor="answer-text" className={senior ? "text-[1.1rem]" : undefined}>
            Your answer
          </Label>
          <Textarea
            id="answer-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start anywhere. A smell, a sound, a name…"
            className={cn("mt-2 min-h-56", senior && "text-[1.2rem] leading-relaxed")}
            maxLength={20000}
          />
          <p className="mt-2 text-[0.8125rem] text-ink-3">{text.trim() ? `${text.trim().split(/\s+/).length} words` : "No time limit. Spelling doesn't matter."}</p>
        </div>
        {mode === "voice" && audio ? (
          <div className="mt-4">
            <button type="button" onClick={() => setMode("text")} className="text-[0.9375rem] font-medium text-evergreen underline-offset-4 hover:underline">
              Add a few written words too (optional)
            </button>
          </div>
        ) : null}
      </div>

      {/* Photo */}
      <div className="mt-8">
        {showPhotos || photos.length ? (
          <PhotoAdder photos={photos} onChange={setPhotos} size={senior ? "senior" : "standard"} />
        ) : (
          <Button variant="secondary" size={senior ? "lg" : "md"} onClick={() => setShowPhotos(true)} leading={<ImagePlus className="size-5" />}>
            Add a photo
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="mt-8 rounded-[18px] border border-line bg-surface/60">
        <button type="button" onClick={() => setDetails((v) => !v)} aria-expanded={details} className={cn("flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium", senior ? "text-[1.05rem]" : "text-[0.9375rem]")}>
          <span>
            Add a title, date or place <span className="font-normal text-ink-3">— optional, can be done later</span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 transition-transform", details && "rotate-180")} />
        </button>
        {details ? (
          <div className="space-y-6 border-t border-line px-5 pb-6 pt-5">
            <div className="space-y-2">
              <Label htmlFor="mem-title">Title</Label>
              <Input id="mem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={titleFromQuestion(q) || "A short name for this memory"} maxLength={160} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mem-date">When was this?</Label>
              <FuzzyDateInput id="mem-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mem-place">Where was this?</Label>
              <PlacePicker id="mem-place" value={placeId} onChange={setPlaceId} capsuleId={capsule.id} />
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-6 rounded-[12px] bg-danger-soft px-4 py-3 text-[0.9375rem] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-paper/92 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size={senior ? "xl" : "lg"} onClick={() => void save()} loading={saving} disabled={!hasContent} trailing={<ArrowRight className="size-5" />}>
            {status === "submitted" ? "Send this memory" : "Keep this memory"}
          </Button>
          {!freeform ? (
            <Button variant="ghost" size={senior ? "xl" : "lg"} onClick={() => void skip()}>
              Skip this question
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-[0.8125rem] text-ink-3">
          Saved on this device for the demo — not uploaded or backed up. {status === "submitted" ? "The organizer reviews it before it appears." : ""}
        </p>
      </div>
      {saved.length ? (
        <p className="mt-6 text-[0.875rem] text-ink-3">
          {saved.length} kept so far ·{" "}
          <Link href={`/view/${capsule.id}`} className="text-link">
            see the archive
          </Link>
        </p>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Film, History, ImagePlus, Keyboard, Mic, RotateCcw, SkipForward, Sparkles } from "lucide-react";
import type { Capsule, FuzzyDate, Memory, MemoryAttribution, MemoryStatus, Question } from "@/domain/models";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FuzzyDateInput, PhotoDateSuggestion, PlacePicker } from "@/components/capsule/inputs";
import { MediaImage } from "@/components/media/media-image";
import { Recorder, type RecordedAudio } from "./recorder";
import { PhotoAdder, type PendingPhoto } from "./photo-adder";
import { VideoAdder, type PendingVideo } from "@/components/media/video-clip";
import { MemoryReveal } from "./memory-reveal";
import { services } from "@/services/factory";
import type { LoadedCaptureDraft } from "@/services/contracts";
import { flushSave } from "@/store/demo-store";
import { useHydrated } from "@/hooks/use-data";
import { cn, formatDuration, relativeTime, uid } from "@/lib/utils";

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
  const [videos, setVideos] = React.useState<PendingVideo[]>([]);
  const [showVideos, setShowVideos] = React.useState(false);
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

  /* ---------------------- Autosaved draft (this device) ---------------------- */
  const draftKey = `${capsule.id}:${invitationToken ? `invitation:${invitationToken}` : `person:${attribution.personId ?? variant}`}`;
  const [draftReady, setDraftReady] = React.useState(false);
  const [offer, setOffer] = React.useState<LoadedCaptureDraft | null>(null);
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null);
  const [restoredAudio, setRestoredAudio] = React.useState<{ url: string } | null>(null);
  const warnedDraftError = React.useRef(false);

  // Wait for this device's saved data to load — checking earlier would miss the draft
  // and the first autosave would overwrite it.
  const hydrated = useHydrated();
  React.useEffect(() => {
    if (!hydrated) return;
    let live = true;
    void services()
      .drafts.loadCaptureDraft(draftKey)
      .then((r) => {
        if (!live) return;
        const d = r.status === "ok" ? r.data : null;
        if (d && (d.draft.text.trim() || d.draft.title.trim() || d.audio || d.photos.length)) setOffer(d);
        setDraftReady(true);
      });
    return () => {
      live = false;
    };
  }, [draftKey, hydrated]);

  const freeform = allowFreeform && questions.length === 0;
  const q = questions[index];
  const total = Math.max(1, questions.length);
  const done = !freeform && index >= questions.length;
  const hasContent = !!audio || text.trim().length > 0 || photos.length > 0 || videos.length > 0;
  const autosaving = draftReady && !offer && !justSaved && !done;
  const draftFields = { key: draftKey, capsuleId: capsule.id, questionId: q?.id, label: freeform ? "A memory of your own" : (q?.text ?? "A memory"), who: attribution.displayName, text, title, date, placeId };

  const reportDraft = (r: Awaited<ReturnType<ReturnType<typeof services>["drafts"]["saveCaptureDraft"]>>) => {
    if (r.status === "ok") setDraftSavedAt(r.data.updatedAt);
    else if (!warnedDraftError.current) {
      warnedDraftError.current = true;
      toast.warning("Draft not fully saved", r.status === "error" ? r.message : undefined);
    }
  };

  // Words, title, date and place: save after a short pause in typing.
  React.useEffect(() => {
    if (!autosaving || (!text.trim() && !title.trim() && date.precision === "unknown" && !placeId)) return;
    const t = setTimeout(() => void services().drafts.saveCaptureDraft(draftFields).then(reportDraft), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draftFields is rebuilt from these values
  }, [autosaving, text, title, date, placeId, draftKey, q?.id]);

  // Recordings and photos: save as soon as they actually change (not on first render).
  const savedAudio = React.useRef<RecordedAudio | null>(null);
  const savedPhotos = React.useRef<PendingPhoto[]>([]);
  React.useEffect(() => {
    if (!autosaving || audio === savedAudio.current) return;
    savedAudio.current = audio;
    void services()
      .drafts.saveCaptureDraft(draftFields, { audio: audio ? { blob: audio.blob, durationSec: audio.durationSec, peaks: audio.peaks, source: audio.source } : null })
      .then(reportDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new recording should trigger this
  }, [autosaving, audio]);
  React.useEffect(() => {
    if (!autosaving || photos === savedPhotos.current || (!photos.length && !savedPhotos.current.length)) return;
    savedPhotos.current = photos;
    void services()
      .drafts.saveCaptureDraft(draftFields, { photos: photos.map((p) => ({ blob: p.file, caption: p.caption, width: p.width, height: p.height, name: p.file.name })) })
      .then(reportDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only changed photos should trigger this
  }, [autosaving, photos]);

  React.useEffect(
    () => () => {
      if (restoredAudio) URL.revokeObjectURL(restoredAudio.url);
    },
    [restoredAudio],
  );

  const discardDraft = () => {
    setDraftSavedAt(null);
    return services().drafts.discardCaptureDraft(draftKey);
  };

  const restoreDraft = (d: LoadedCaptureDraft) => {
    const qi = d.draft.questionId ? questions.findIndex((x) => x.id === d.draft.questionId) : -1;
    if (qi >= 0) setIndex(qi);
    setText(d.draft.text);
    setTitle(d.draft.title);
    setDate(d.draft.date);
    setPlaceId(d.draft.placeId);
    if (d.draft.title || d.draft.date.precision !== "unknown" || d.draft.placeId) setDetails(true);
    if (d.audio) {
      const restored = { ...d.audio };
      savedAudio.current = restored;
      setAudio(restored);
      setRestoredAudio({ url: URL.createObjectURL(d.audio.blob) });
      setMode("voice");
    } else if (d.draft.text) setMode("text");
    if (d.photos.length) {
      const restoredPhotos: PendingPhoto[] = d.photos.map((p) => ({ id: uid("ph"), file: new File([p.blob], p.name, { type: p.blob.type }), url: URL.createObjectURL(p.blob), caption: p.caption, width: p.width, height: p.height }));
      savedPhotos.current = restoredPhotos;
      setPhotos(restoredPhotos);
      setShowPhotos(true);
    }
    setDraftSavedAt(d.draft.updatedAt);
    setOffer(null);
  };

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [index, justSaved]);

  const resetForm = () => {
    setAudio(null);
    setText("");
    setPhotos([]);
    setVideos([]);
    setShowPhotos(false);
    setDetails(false);
    setTitle("");
    setDate({ precision: "unknown" });
    setPlaceId(undefined);
    setError(null);
    setFollowUp(null);
    setMode("voice");
    setRestoredAudio(null);
    setRecorderKey((k) => k + 1);
  };

  const next = () => {
    setJustSaved(null);
    resetForm();
    setIndex((i) => i + 1);
  };

  const skip = async () => {
    if (q) await services().capsules.markAssignment(capsule.id, q.id, "skipped");
    await discardDraft();
    next();
  };

  const save = async () => {
    if (!hasContent) {
      setError("Record, type, or add a photo or video first — or skip this question.");
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
      const videoIds: string[] = [];
      for (const v of videos) {
        const r = await s.media.put({ capsuleId: capsule.id, blob: v.file, kind: "video", caption: v.caption, alt: v.caption || `Video shared by ${attribution.displayName}`, contributorName: attribution.displayName, durationSec: v.durationSec });
        if (r.status !== "ok") throw new Error(r.message);
        videoIds.push(r.data.id);
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
        videoIds,
        audioId,
        questionId: q?.id,
        attribution,
        status,
      });
      if (res.status !== "ok") throw new Error(res.message);
      await discardDraft();
      if (invitationToken) await s.communications.submitContribution(invitationToken, res.data.id);
      await flushSave().catch(() => undefined);
      setSaved((prev) => [...prev, res.data]);
      setJustSaved(res.data);
      setFollowUp(q?.followUps?.[0] ?? null);
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      videos.forEach((v) => URL.revokeObjectURL(v.url));
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
                ? `The people looking after ${capsule.preferredName}'s capsule will see it next. It appears in the archive once approved.`
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

      {offer ? (
        <div role="status" className="mb-8 flex flex-wrap items-center gap-4 rounded-[18px] border border-evergreen/25 bg-evergreen-soft/60 px-5 py-4">
          <History className="size-5 shrink-0 text-evergreen" />
          <p className="min-w-0 flex-1 text-[0.9375rem]">
            <strong className="font-medium">You were in the middle of an answer.</strong>{" "}
            <span className="text-ink-2">
              “{offer.draft.label}” · saved {relativeTime(offer.draft.updatedAt)}
              {offer.audio ? " · with a recording" : ""}
              {offer.photos.length ? ` · ${offer.photos.length} photo${offer.photos.length === 1 ? "" : "s"}` : ""}
            </span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => restoreDraft(offer)}>
              Pick up where I left off
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOffer(null);
                void discardDraft();
              }}
            >
              Start fresh
            </Button>
          </div>
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
          {restoredAudio && audio ? (
            <div className="rounded-[20px] border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[0.9375rem] font-medium">
                <History className="size-4 text-evergreen" /> Your recording, restored · {formatDuration(audio.durationSec)}
              </p>
              <audio controls src={restoredAudio.url} className="mt-4 w-full" aria-label="Restored recording" />
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                leading={<RotateCcw className="size-4" />}
                onClick={() => {
                  setAudio(null);
                  setRestoredAudio(null);
                  setRecorderKey((k) => k + 1);
                }}
              >
                Record again
              </Button>
            </div>
          ) : (
            <Recorder key={recorderKey} onChange={setAudio} size={senior ? "senior" : "standard"} onTypeInstead={() => setMode("text")} />
          )}
        </div>
        <div hidden={mode !== "text"}>
          <Label htmlFor="answer-text" className={senior ? "text-[1.1rem]" : undefined}>
            Your answer
          </Label>
          <Textarea
            id="answer-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              if (autosaving && text.trim()) void services().drafts.saveCaptureDraft(draftFields).then(reportDraft);
            }}
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
          <div className="space-y-3">
            <PhotoAdder photos={photos} onChange={setPhotos} size={senior ? "senior" : "standard"} />
            <PhotoDateSuggestion takenOn={photos.find((p) => p.takenOn)?.takenOn} value={date} onUse={setDate} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size={senior ? "lg" : "md"} onClick={() => setShowPhotos(true)} leading={<ImagePlus className="size-5" />}>
              Add a photo
            </Button>
            {!showVideos && !videos.length ? (
              <Button variant="ghost" size={senior ? "lg" : "md"} onClick={() => setShowVideos(true)} leading={<Film className="size-5" />}>
                Add a short video
              </Button>
            ) : null}
          </div>
        )}
        {showVideos || videos.length ? (
          <div className="mt-5">
            <VideoAdder videos={videos} onChange={setVideos} />
            {videos.length ? <p className="mt-2 text-[0.8125rem] text-ink-3">Clips are kept once you save this memory; they aren&rsquo;t part of the autosaved draft.</p> : null}
          </div>
        ) : (showPhotos || photos.length) && !showVideos ? (
          <button type="button" onClick={() => setShowVideos(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            <Film className="size-4" aria-hidden /> Add a short video too
          </button>
        ) : null}
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
              <FuzzyDateInput id="mem-date" value={date} onChange={setDate} birthYear={capsule.birthYear} />
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
        <p className="mt-3 text-[0.8125rem] text-ink-3" aria-live="polite">
          {draftSavedAt ? <span className="font-medium text-ink-2">Draft saved {relativeTime(draftSavedAt)} — you can close this and come back. </span> : null}
          Saved on this device for the demo — not uploaded or backed up. {status === "submitted" ? "The owner or an editor reviews it before it appears." : ""}
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

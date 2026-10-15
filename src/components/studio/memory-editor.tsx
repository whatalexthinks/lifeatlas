"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, History, Pin, RotateCcw, Star, Trash2, Undo2, X } from "lucide-react";
import type { Capsule, Memory, MemoryPrivacy } from "@/domain/models";
import { Sheet, ConfirmDialog } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, toast } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Label, Segmented, Select, Textarea } from "@/components/ui/field";
import { FuzzyDateInput, PhotoDateSuggestion, PlacePicker } from "@/components/capsule/inputs";
import { MediaImage } from "@/components/media/media-image";
import { AudioPlayer } from "@/components/audio/audio-player";
import { PhotoAdder, type PendingPhoto } from "@/components/capture/photo-adder";
import { Recorder, type RecordedAudio } from "@/components/capture/recorder";
import { MemoryStatusBadge, privacyCopy } from "./primitives";
import { canEditMemory } from "@/domain/policies/permissions";
import { memoryFormSchema } from "@/domain/schemas";
import { chapters } from "@/data/chapters";
import { useDb, usePersona, useRole } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, relativeTime } from "@/lib/utils";
import { brand } from "@/config/brand";

export function MemoryEditorSheet({ memory, capsule, open, onOpenChange }: { memory: Memory | undefined; capsule: Capsule; open: boolean; onOpenChange: (v: boolean) => void }) {
  // The editor writes whether it has unsaved changes; closing then asks before discarding them.
  const dirtyRef = React.useRef(false);
  const [confirmClose, setConfirmClose] = React.useState(false);
  if (!memory) return null;
  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v && dirtyRef.current) setConfirmClose(true);
          else onOpenChange(v);
        }}
        title={memory.title}
        description={<MemoryStatusBadge status={memory.status} />}
        width="lg"
      >
        <MemoryEditor key={memory.id + memory.updatedAt} memory={memory} capsule={capsule} dirtyRef={dirtyRef} onDone={() => onOpenChange(false)} />
      </Sheet>
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        tone="danger"
        title="Discard your changes?"
        confirmLabel="Discard changes"
        body="You've edited this memory but haven't saved. Close without saving, or go back to keep editing."
        onConfirm={() => {
          dirtyRef.current = false;
          setConfirmClose(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}

export function MemoryEditor({ memory, capsule, onDone, dirtyRef }: { memory: Memory; capsule: Capsule; onDone: () => void; dirtyRef?: React.RefObject<boolean> }) {
  const persona = usePersona();
  const role = useRole(capsule.id);
  const people = useDb((d) => d.people);
  const media = useDb((d) => d.media);
  const transcripts = useDb((d) => d.transcripts);
  const editable = canEditMemory(memory, role, persona.personId) && !memory.deletedAt;
  const canReview = role === "owner" || role === "organizer";

  const [title, setTitle] = React.useState(memory.title);
  const [narrative, setNarrative] = React.useState(memory.narrative);
  const [quote, setQuote] = React.useState(memory.quote ?? "");
  const [date, setDate] = React.useState(memory.date);
  const birthYear = useDb((d) => d.capsules.find((c) => c.id === memory.capsuleId)?.birthYear);
  const [placeId, setPlaceId] = React.useState(memory.placeId);
  const [chapter, setChapter] = React.useState(memory.chapter);
  const [peopleIds, setPeopleIds] = React.useState(memory.peopleIds);
  const [tags, setTags] = React.useState(memory.tags);
  const [tagDraft, setTagDraft] = React.useState("");
  const [privacy, setPrivacy] = React.useState<MemoryPrivacy>(memory.privacy);
  const [consent, setConsent] = React.useState(memory.consent);
  const [photoIds, setPhotoIds] = React.useState(memory.photoIds);
  const [newPhotos, setNewPhotos] = React.useState<PendingPhoto[]>([]);
  const [removeAudio, setRemoveAudio] = React.useState(false);
  const [newAudio, setNewAudio] = React.useState<RecordedAudio | null>(null);
  const [recording, setRecording] = React.useState(false);
  const audio = media.find((a) => a.id === memory.audioId);
  const existingTranscript = transcripts.find((t) => t.mediaId === memory.audioId);
  const [transcript, setTranscript] = React.useState(existingTranscript?.text ?? "");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const featured = capsule.featuredMemoryId === memory.id;
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const dirty =
    title !== memory.title ||
    narrative !== memory.narrative ||
    quote !== (memory.quote ?? "") ||
    !same(date, memory.date) ||
    placeId !== memory.placeId ||
    chapter !== memory.chapter ||
    !same(peopleIds, memory.peopleIds) ||
    !same(tags, memory.tags) ||
    privacy !== memory.privacy ||
    !same(consent, memory.consent) ||
    !same(photoIds, memory.photoIds) ||
    newPhotos.length > 0 ||
    removeAudio ||
    !!newAudio ||
    transcript !== (existingTranscript?.text ?? "");
  React.useEffect(() => {
    if (dirtyRef) dirtyRef.current = dirty;
  }, [dirty, dirtyRef]);

  const save = async () => {
    const parsed = memoryFormSchema.safeParse({ title, narrative, quote, date, placeId, chapter, privacy, tags, peopleIds, consent });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      toast.warning("Please check the highlighted fields");
      return;
    }
    setSaving(true);
    const s = services();
    try {
      const added: string[] = [];
      for (const p of newPhotos) {
        const r = await s.media.put({ capsuleId: capsule.id, blob: p.file, kind: "image", caption: p.caption, alt: p.caption || memory.title, contributorName: persona.name, width: p.width, height: p.height });
        if (r.status !== "ok") throw new Error(r.message);
        added.push(r.data.id);
      }
      let audioId: string | null | undefined = undefined;
      if (newAudio) {
        const r = await s.media.put({ capsuleId: capsule.id, blob: newAudio.blob, kind: "audio", caption: `“${title}”`, alt: `Recording for ${title}`, contributorName: persona.name, durationSec: newAudio.durationSec, peaks: newAudio.peaks });
        if (r.status !== "ok") throw new Error(r.message);
        audioId = r.data.id;
      } else if (removeAudio) audioId = null;
      const res = await s.capsules.updateMemory(memory.id, { ...parsed.data, quote: quote.trim(), photoIds: [...photoIds, ...added], audioId }, persona.name);
      if (res.status !== "ok") throw new Error(res.message);
      const targetAudio = typeof audioId === "string" ? audioId : audioId === null ? undefined : memory.audioId;
      if (targetAudio && transcript.trim() !== (existingTranscript?.text ?? "").trim()) await s.transcription.saveManualTranscript(targetAudio, transcript.trim());
      toast.success("Saved on this device", "Earlier version kept in the history.");
      onDone();
    } catch (e) {
      toast.error("Couldn't save", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const transition = async (to: Memory["status"], msg: string) => {
    const r = await services().capsules.transitionMemory(memory.id, to, note || undefined, persona.name);
    if (r.status === "ok") {
      toast.success(msg);
      onDone();
    } else toast.error("Not possible", r.status === "error" ? r.message : undefined);
  };

  return (
    <div className="space-y-8 pb-10">
      {memory.deletedAt ? (
        <DemoNotice tone="warning" title="In Recently deleted" icon={<Trash2 className="size-[18px]" />}>
          Hidden everywhere. Restore it to edit or show it again.
          <div className="mt-3">
            <Button size="sm" leading={<Undo2 className="size-4" />} onClick={async () => (await services().capsules.restoreMemory(memory.id), toast.success("Memory restored"), onDone())}>
              Restore
            </Button>
          </div>
        </DemoNotice>
      ) : null}

      {/* Review */}
      {canReview && (memory.status === "submitted" || memory.status === "under_review" || memory.status === "returned" || memory.status === "draft") && !memory.deletedAt ? (
        <section className="rounded-[18px] border border-warning/30 bg-warning-soft/50 p-5">
          <p className="font-medium">
            {memory.status === "draft" ? "This is a draft" : `Contributed by ${memory.attribution.displayName}${memory.attribution.relationship ? ` · ${memory.attribution.relationship}` : ""}`}
          </p>
          <p className="mt-1 text-[0.9rem] text-ink-2">{memory.status === "draft" ? "Drafts aren't visible in the family viewer until published." : "It appears in the archive only after you approve it. A note is shown to the contributor."}</p>
          {memory.status !== "draft" ? <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note — e.g. “Could you add the year?”" className="mt-3 min-h-20 text-[0.9375rem]" aria-label="Note to contributor" /> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" leading={<Check className="size-4" />} onClick={() => void transition("approved", memory.status === "draft" ? "Published to the archive" : "Approved — now in the archive")}>
              {memory.status === "draft" ? "Publish" : "Approve"}
            </Button>
            {memory.status === "submitted" ? (
              <Button size="sm" variant="secondary" onClick={() => void transition("under_review", "Marked as in review")}>
                Start review
              </Button>
            ) : null}
            {memory.status !== "draft" && memory.status !== "returned" ? (
              <>
                <Button size="sm" variant="secondary" leading={<RotateCcw className="size-4" />} onClick={() => void transition("returned", "Returned with your note")}>
                  Return with a note
                </Button>
                <Button size="sm" variant="ghost" leading={<X className="size-4" />} onClick={() => void transition("declined", "Not included")}>
                  Don&rsquo;t include
                </Button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {!editable && !memory.deletedAt ? (
        <DemoNotice tone="info">You can view this memory, but only its author or an organizer can edit it. (Simulated permissions.)</DemoNotice>
      ) : null}

      <fieldset disabled={!editable} className="space-y-6 disabled:opacity-70">
        <Field label="Title" htmlFor="ed-title" error={errors.title}>
          <Input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} invalid={!!errors.title} />
        </Field>
        <Field label="The story" htmlFor="ed-story" hint="Plain text. Paragraphs are kept." error={errors.narrative}>
          <Textarea id="ed-story" value={narrative} onChange={(e) => setNarrative(e.target.value)} className="min-h-56 font-serif text-[1.15rem] leading-relaxed" />
        </Field>
        <Field label="Pull quote" htmlFor="ed-quote" optional hint="A line to feature on cards and covers." error={errors.quote}>
          <Input id="ed-quote" value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={280} />
        </Field>
        <div className="space-y-2">
          <Label htmlFor="ed-date">When</Label>
          <FuzzyDateInput id="ed-date" value={date} onChange={setDate} birthYear={birthYear} />
          {errors.date ? <p className="text-[0.875rem] font-medium text-danger">{errors.date}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ed-place">Where</Label>
          <PlacePicker id="ed-place" value={placeId} onChange={setPlaceId} capsuleId={capsule.id} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Chapter" htmlFor="ed-chapter">
            <Select id="ed-chapter" value={chapter} onChange={(e) => setChapter(e.target.value as Memory["chapter"])}>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="space-y-2">
            <Label htmlFor="ed-privacy">Who can see it</Label>
            <Segmented
              label="Privacy"
              value={privacy}
              onChange={setPrivacy}
              size="sm"
              options={(["family", "organizers", "private"] as MemoryPrivacy[]).map((p) => ({ value: p, label: privacyCopy[p].label }))}
            />
            <p className="text-[0.8125rem] text-ink-3">{privacyCopy[privacy].description}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>People in this story</Label>
          <div className="flex flex-wrap gap-1.5">
            {people.map((p) => {
              const on = peopleIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPeopleIds(on ? peopleIds.filter((x) => x !== p.id) : [...peopleIds, p.id])}
                  className={cn("h-8 rounded-full border px-3 text-[0.8125rem]", on ? "border-evergreen bg-evergreen text-on-evergreen" : "border-line-strong text-ink-2 hover:border-ink-3")}
                >
                  {p.displayName}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ed-tag">Tags</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-ivory pl-3 pr-1.5 text-[0.8125rem]">
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="grid size-5 place-items-center rounded-full hover:bg-linen" aria-label={`Remove tag ${t}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <Input
              id="ed-tag"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
                  e.preventDefault();
                  if (!tags.includes(tagDraft.trim()) && tags.length < 12) setTags([...tags, tagDraft.trim().slice(0, 32)]);
                  setTagDraft("");
                }
              }}
              placeholder="Add a tag, press Enter"
              className="h-9 w-48 rounded-full text-[0.875rem]"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <Label>Photographs</Label>
          {photoIds.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoIds.map((id) => (
                <div key={id} className="group relative overflow-hidden rounded-[12px]">
                  <MediaImage mediaId={id} className="aspect-square" />
                  <button type="button" onClick={() => setPhotoIds(photoIds.filter((x) => x !== id))} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white" aria-label="Remove photo from this memory">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <PhotoAdder photos={newPhotos} onChange={setNewPhotos} />
          <PhotoDateSuggestion takenOn={newPhotos.find((p) => p.takenOn)?.takenOn} value={date} onUse={setDate} />
        </div>

        {/* Audio */}
        <div className="space-y-3">
          <Label>Recording</Label>
          {audio && !removeAudio && !newAudio ? (
            <>
              <AudioPlayer asset={audio} title={memory.title} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setRecording(true)}>
                  Replace with a new recording
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoveAudio(true)}>
                  Remove recording
                </Button>
              </div>
              <Field label="Transcript" htmlFor="ed-transcript" optional hint={`Typed by family. ${brand.name} never invents a transcript.`}>
                <Textarea id="ed-transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-28" />
              </Field>
            </>
          ) : recording || newAudio || !audio || removeAudio ? (
            <>
              {removeAudio && !newAudio ? <p className="text-[0.875rem] text-ink-3">The recording will be removed when you save.</p> : null}
              {recording || !audio || removeAudio ? <Recorder size="standard" onChange={setNewAudio} /> : null}
            </>
          ) : null}
        </div>

        <div className="space-y-3 rounded-[16px] border border-line p-4">
          <p className="font-medium">Consent</p>
          <Checkbox id="c-print" checked={consent.print} onCheckedChange={(v) => setConsent({ ...consent, print: v })} label="May appear in printed heirlooms" />
          <Checkbox id="c-export" checked={consent.export} onCheckedChange={(v) => setConsent({ ...consent, export: v })} label="May be included in shared exports" />
          <Checkbox id="c-share" checked={consent.share} onCheckedChange={(v) => setConsent({ ...consent, share: v })} label="May be used in an opt-in share card" description="Never public by default." />
        </div>
      </fieldset>

      {editable ? (
        <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" leading={<Pin className="size-4" />} onClick={async () => (await services().capsules.togglePin(memory.id), toast.success(memory.pinned ? "Unpinned" : "Pinned"))}>
              {memory.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button variant="ghost" size="sm" leading={<Star className={cn("size-4", featured && "fill-brass text-brass")} />} disabled={featured || memory.status !== "approved"} onClick={async () => (await services().capsules.setFeatured(capsule.id, memory.id), toast.success("Featured on the cover"))}>
              {featured ? "Featured" : "Feature"}
            </Button>
            <Button variant="ghost" size="sm" className="text-danger" leading={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
          <Button onClick={() => void save()} loading={saving}>
            Save changes
          </Button>
        </div>
      ) : null}

      {memory.revisions.length ? (
        <section>
          <p className="mb-3 flex items-center gap-2 font-medium">
            <History className="size-4" /> History
          </p>
          <ol className="space-y-2 text-[0.875rem]">
            {memory.revisions.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 rounded-[12px] bg-ivory/60 px-3.5 py-2.5">
                <span>
                  <span className="font-medium">{r.by}</span> · {r.summary}
                  <span className="block text-ink-3">Previously: “{r.previous.title}”</span>
                </span>
                <span className="shrink-0 text-ink-4">{relativeTime(r.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-[0.8125rem] text-ink-3">
        <Badge tone={memory.storage === "fixture" ? "neutral" : "demo"}>{memory.storage === "fixture" ? "Sample content" : "Stored on this device"}</Badge>
        <span>Added {relativeTime(memory.createdAt)} by {memory.attribution.displayName}</span>
        {memory.status === "approved" ? (
          <Link href={`/view/${capsule.id}/stories/${memory.id}`} className="inline-flex items-center gap-1 text-evergreen hover:underline">
            View as family <ArrowUpRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Move to Recently deleted?"
        tone="danger"
        confirmLabel="Delete memory"
        body={
          <>
            “{memory.title}” will disappear from the archive and exports. You can restore it from <strong>Recently deleted</strong> in Memories. In this demo, its files stay on this device until you reset demo data.
          </>
        }
        onConfirm={async () => {
          await services().capsules.softDeleteMemory(memory.id);
          setConfirmDelete(false);
          toast.success("Moved to Recently deleted", undefined, { label: "Undo", onClick: () => void services().capsules.restoreMemory(memory.id) });
          onDone();
        }}
      />
    </div>
  );
}

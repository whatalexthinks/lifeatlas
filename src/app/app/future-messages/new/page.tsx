"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, History, Lock, Mic, Save } from "lucide-react";
import type { FutureMessage, LetterDraft } from "@/domain/models";
import { futureMessageSchema, type FutureMessageFormValues } from "@/domain/schemas";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { LetterOpening } from "@/components/future/letter-opening";
import { SealedLetter } from "@/components/marketing/objects";
import { MediaImage } from "@/components/media/media-image";
import { Recorder, type RecordedAudio } from "@/components/capture/recorder";
import { Button } from "@/components/ui/button";
import { DemoNotice, toast } from "@/components/ui/feedback";
import { Checkbox, ChoiceCards, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { addYears, describeInterval, todayIso } from "@/lib/dates";
import { cn, formatDate, relativeTime } from "@/lib/utils";

const milestones: { value: NonNullable<FutureMessageFormValues["milestone"]>; label: string; age?: number }[] = [
  { value: "18th_birthday", label: "18th birthday", age: 18 },
  { value: "21st_birthday", label: "21st birthday", age: 21 },
  { value: "30th_birthday", label: "30th birthday", age: 30 },
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding day" },
  { value: "first_child", label: "Birth of a first child" },
  { value: "custom", label: "Another milestone" },
];

/** Interval and milestone releases derive their date; a chosen date is left alone. */
function withDerivedDate(v: FutureMessageFormValues, birthYear: string): FutureMessageFormValues {
  if (v.releaseKind === "interval" && v.intervalYears) return { ...v, releaseDate: addYears(todayIso(), v.intervalYears) };
  const m = milestones.find((x) => x.value === v.milestone);
  if (v.releaseKind === "milestone" && m?.age && /^\d{4}$/.test(birthYear)) {
    const d = `${Number(birthYear) + m.age}-06-01`;
    if (d > todayIso()) return { ...v, releaseDate: d };
  }
  return v;
}

function ComposerInner() {
  const params = useSearchParams();
  const router = useRouter();
  const editId = params.get("id");
  const existing = useDb((d) => d.futureMessages.find((m) => m.id === editId));
  const capsules = useDb((d) => d.capsules);
  const memories = useDb((d) => d.memories);
  const profile = useDb((d) => d.account.profile);
  const [capsuleId, setCapsuleId] = React.useState<string>(existing?.capsuleId ?? capsules[0]?.id ?? "");
  const [v, setV] = React.useState<FutureMessageFormValues>(() => ({
    title: existing?.title ?? "",
    dedication: existing?.dedication ?? "",
    body: existing?.body ?? "",
    recipientName: existing?.recipient.name ?? "",
    recipientRelationship: existing?.recipient.relationship ?? "",
    recipientContact: existing?.recipient.contact ?? "",
    backupName: existing?.backupRecipient?.name ?? "",
    releaseKind: existing?.release.kind ?? "interval",
    releaseDate: existing?.release.date ?? addYears(todayIso(), 20),
    intervalYears: existing?.release.intervalYears ?? 20,
    milestone: existing?.release.milestone,
    milestoneNote: existing?.release.milestoneNote ?? "",
    recipientOnly: existing?.restrictions.recipientOnly ?? true,
    allowFamilyAfterOpening: existing?.restrictions.allowFamilyAfterOpening ?? true,
    personalNote: existing?.restrictions.personalNote ?? "",
  }));
  const [attachments, setAttachments] = React.useState<string[]>(existing?.attachmentIds ?? []);
  const [voice, setVoice] = React.useState<RecordedAudio | null>(null);
  const [recordOpen, setRecordOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<null | "save" | "seal">(null);
  const [preview, setPreview] = React.useState(false);
  const set = (p: Partial<FutureMessageFormValues>) => setV((x) => withDerivedDate({ ...x, ...p }, birthYear));
  const photoChoices = memories.filter((m) => m.capsuleId === capsuleId && !m.deletedAt && m.photoIds.length).flatMap((m) => m.photoIds).slice(0, 18);
  const [birthYear, setBirthYear] = React.useState<string>(existing?.recipient.birthYear ? String(existing.recipient.birthYear) : "");

  /* ---- Writing autosaves on this device until it's saved as a letter (it needn't be valid yet) ---- */
  const draftKey = existing ? `letter:${existing.id}` : "letter:new";
  const stored = useDb((d) => d.letterDrafts.find((x) => x.key === draftKey));
  // The studio renders after saved data loads, so this sees any writing left from last time.
  const [offer, setOffer] = React.useState<LetterDraft | null>(() => stored ?? null);
  const [keptAt, setKeptAt] = React.useState<string | null>(null);
  const baseline = React.useRef<string | null>(null);
  React.useEffect(() => {
    const snapshot = JSON.stringify({ v, attachments, capsuleId, birthYear });
    if (baseline.current === null) {
      baseline.current = snapshot; // what the page opened with isn't a change
      return;
    }
    if (offer || busy || snapshot === baseline.current) return;
    const t = setTimeout(() => {
      baseline.current = snapshot;
      const hasWords = [v.title, v.body, v.dedication ?? "", v.recipientName].some((x) => x.trim());
      if (!hasWords) {
        void services().drafts.discardLetterDraft(draftKey);
        setKeptAt(null);
        return;
      }
      void services()
        .drafts.saveLetterDraft({ key: draftKey, letterId: existing?.id, capsuleId, values: v, attachmentIds: attachments, birthYear })
        .then((r) => r.status === "ok" && setKeptAt(r.data.updatedAt));
    }, 600);
    return () => clearTimeout(t);
  }, [v, attachments, capsuleId, birthYear, offer, busy, draftKey, existing?.id]);

  const restore = (d: LetterDraft) => {
    setV((x) => ({ ...x, ...(d.values as Partial<FutureMessageFormValues>) }));
    setAttachments(d.attachmentIds);
    setCapsuleId(d.capsuleId);
    setBirthYear(d.birthYear);
    setKeptAt(d.updatedAt);
    setOffer(null);
  };
  const startFresh = () => {
    void services().drafts.discardLetterDraft(draftKey);
    setOffer(null);
  };

  const save = async (andSeal: boolean) => {
    const r = futureMessageSchema.safeParse(v);
    if (!r.success) {
      const e: Record<string, string> = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      toast.warning("A few details need attention");
      return;
    }
    setErrors({});
    setBusy(andSeal ? "seal" : "save");
    let ids = attachments;
    if (voice) {
      const m = await services().media.put({ capsuleId, blob: voice.blob, kind: "audio", caption: `Voice note for ${v.recipientName}`, alt: `A recorded message for ${v.recipientName}`, contributorName: profile.displayName, durationSec: voice.durationSec, peaks: voice.peaks });
      if (m.status === "ok") ids = [...ids, m.data.id];
    }
    const res = await services().futureDelivery.saveDraft(r.data, { id: existing?.id, capsuleId, attachmentIds: ids, authorName: profile.displayName, recipientBirthYear: /^\d{4}$/.test(birthYear) ? Number(birthYear) : undefined });
    if (res.status !== "ok") {
      setBusy(null);
      toast.error("Couldn't save the letter", res.status === "error" ? res.message : undefined);
      return;
    }
    await services().drafts.discardLetterDraft(draftKey);
    if (andSeal) {
      const s = await services().futureDelivery.sealDemo(res.data.id);
      setBusy(null);
      if (s.status === "ok") toast.success("Sealed in this demo", "Not scheduled for delivery — you can unseal it any time.");
      else toast.error("Saved, but couldn't seal", s.status === "error" ? s.message : undefined);
    } else {
      setBusy(null);
      toast.success("Draft saved on this device", "Not scheduled for delivery.");
    }
    router.push("/app/future-messages");
  };

  const previewMessage: FutureMessage = {
    id: "preview",
    token: "preview",
    capsuleId,
    authorName: profile.displayName,
    title: v.title || "Untitled letter",
    dedication: v.dedication || undefined,
    body: v.body || "Your letter will appear here.",
    format: "letter",
    attachmentIds: attachments,
    recipient: { name: v.recipientName || "Someone you love", relationship: v.recipientRelationship, contactStatus: "not_provided" },
    release: { kind: v.releaseKind, date: v.releaseDate, intervalYears: v.intervalYears, milestone: v.milestone, requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: v.recipientOnly, allowFamilyAfterOpening: v.allowFamilyAfterOpening },
    status: "draft",
    isExample: false,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existing?.status === "sealed_demo") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-serif text-[2.4rem]">This letter is sealed.</h1>
        <p className="mt-3 text-ink-2">Unseal it from Letters Through Time to make changes.</p>
        <Button className="mt-6" onClick={() => router.push("/app/future-messages")}>
          Back to letters
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader eyebrow="Letters Through Time · Preview feature" title={existing ? "Edit your letter" : "Design your future message"} back={{ href: "/app/future-messages", label: "All letters" }} />
      {offer ? (
        <div role="status" className="mb-6 flex flex-col gap-4 rounded-[18px] border border-brass/40 bg-brass-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3">
            <History className="mt-0.5 size-5 shrink-0 text-brass-ink" />
            <span>
              <strong className="font-medium">You were in the middle of this letter.</strong>{" "}
              <span className="text-ink-2">
                {String(offer.values.title || "").trim() ? `“${String(offer.values.title).trim()}”` : "Untitled"}
                {String(offer.values.recipientName || "").trim() ? ` for ${String(offer.values.recipientName).trim()}` : ""} · kept {relativeTime(offer.updatedAt)}
              </span>
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button onClick={() => restore(offer)}>Pick up where I left off</Button>
            <Button variant="ghost" onClick={startFresh}>
              {existing ? "Use the saved letter" : "Start fresh"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="Who is it for?">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Their name" htmlFor="f-name" error={errors.recipientName}>
                <Input id="f-name" value={v.recipientName} onChange={(e) => set({ recipientName: e.target.value })} invalid={!!errors.recipientName} />
              </Field>
              <Field label="They are your…" htmlFor="f-rel" error={errors.recipientRelationship}>
                <Input id="f-rel" value={v.recipientRelationship} onChange={(e) => set({ recipientRelationship: e.target.value })} placeholder="Granddaughter" invalid={!!errors.recipientRelationship} />
              </Field>
              <Field label="Their email" htmlFor="f-contact" optional hint="Stays unverified in this preview — nothing is sent." error={errors.recipientContact}>
                <Input id="f-contact" type="email" value={v.recipientContact ?? ""} onChange={(e) => set({ recipientContact: e.target.value })} placeholder="name@example.com" invalid={!!errors.recipientContact} />
              </Field>
              <Field label="A backup recipient" htmlFor="f-backup" optional hint="Someone who could receive it if they can't be reached.">
                <Input id="f-backup" value={v.backupName ?? ""} onChange={(e) => set({ backupName: e.target.value })} />
              </Field>
              <Field label="Connected capsule" htmlFor="f-capsule" className="sm:col-span-2">
                <Select id="f-capsule" value={capsuleId} onChange={(e) => setCapsuleId(e.target.value)}>
                  {capsules.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subjectName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel title="Your letter">
            <div className="space-y-5">
              <Field label="Title" htmlFor="f-title" error={errors.title}>
                <Input id="f-title" value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="For Emma, at thirty" invalid={!!errors.title} />
              </Field>
              <Field label="A line on the envelope" htmlFor="f-ded" optional>
                <Input id="f-ded" value={v.dedication ?? ""} onChange={(e) => set({ dedication: e.target.value })} placeholder="Open this whenever you need it." maxLength={240} />
              </Field>
              <Field label="The letter" htmlFor="f-body" error={errors.body} hint={`${v.body.trim() ? v.body.trim().split(/\s+/).length : 0} words`}>
                <Textarea id="f-body" value={v.body} onChange={(e) => set({ body: e.target.value })} className="min-h-80 font-serif text-[1.2rem] leading-relaxed" placeholder="My darling…" invalid={!!errors.body} />
              </Field>
              <div>
                <p className="mb-2 font-medium">Include photographs</p>
                {photoChoices.length ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {photoChoices.map((id) => {
                      const on = attachments.includes(id);
                      return (
                        <button key={id} type="button" aria-pressed={on} onClick={() => setAttachments(on ? attachments.filter((x) => x !== id) : [...attachments, id])} className={cn("overflow-hidden rounded-[10px] ring-offset-2 ring-offset-surface", on && "ring-2 ring-evergreen")}>
                          <MediaImage mediaId={id} className="aspect-square" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[0.875rem] text-ink-3">Photos from the connected capsule appear here.</p>
                )}
              </div>
              <div>
                <p className="mb-2 font-medium">A voice note</p>
                {recordOpen || voice ? (
                  <Recorder size="standard" onChange={setVoice} />
                ) : (
                  <Button variant="secondary" leading={<Mic className="size-4" />} onClick={() => setRecordOpen(true)}>
                    Record a voice note
                  </Button>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="When should it open?">
            <ChoiceCards
              name="releaseKind"
              value={v.releaseKind}
              onChange={(k) => set({ releaseKind: k })}
              columns={3}
              options={[
                { value: "interval", label: "In a number of years" },
                { value: "date", label: "On a date" },
                { value: "milestone", label: "At a milestone" },
              ]}
            />
            <div className="mt-6">
              {v.releaseKind === "interval" ? (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Years from now">
                  {([5, 10, 20, 30] as const).map((y) => (
                    <button key={y} type="button" role="radio" aria-checked={v.intervalYears === y} onClick={() => set({ intervalYears: y })} className={cn("h-11 rounded-full border px-5 font-medium", v.intervalYears === y ? "border-evergreen bg-evergreen text-on-evergreen" : "border-line-strong")}>
                      {y} years
                    </button>
                  ))}
                </div>
              ) : v.releaseKind === "date" ? (
                <Field label="Opening date" htmlFor="f-date" error={errors.releaseDate} className="max-w-xs">
                  <Input id="f-date" type="date" value={v.releaseDate} min={todayIso()} onChange={(e) => set({ releaseDate: e.target.value })} invalid={!!errors.releaseDate} />
                </Field>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Milestone" htmlFor="f-ms" error={errors.milestone}>
                    <Select id="f-ms" value={v.milestone ?? ""} onChange={(e) => set({ milestone: (e.target.value || undefined) as FutureMessageFormValues["milestone"] })}>
                      <option value="">Choose…</option>
                      {milestones.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Their birth year" htmlFor="f-by" optional hint="Helps estimate birthday milestones.">
                    <Input id="f-by" type="number" inputMode="numeric" value={birthYear} onChange={(e) => {
                      setBirthYear(e.target.value);
                      setV((x) => withDerivedDate(x, e.target.value));
                    }} />
                  </Field>
                  <Field label="Expected date" htmlFor="f-msdate" error={errors.releaseDate} hint="An estimate — the real date can be confirmed later.">
                    <Input id="f-msdate" type="date" value={v.releaseDate} min={todayIso()} onChange={(e) => set({ releaseDate: e.target.value })} invalid={!!errors.releaseDate} />
                  </Field>
                  {v.milestone === "custom" ? (
                    <Field label="Describe it" htmlFor="f-msnote">
                      <Input id="f-msnote" value={v.milestoneNote ?? ""} onChange={(e) => set({ milestoneNote: e.target.value })} />
                    </Field>
                  ) : null}
                </div>
              )}
              <p className="mt-4 text-[0.9rem] text-ink-2">
                Would open on <strong className="font-medium">{formatDate(v.releaseDate, "long")}</strong> — {describeInterval(v.releaseDate)}.
              </p>
            </div>
          </Panel>

          <Panel title="Sharing">
            <div className="space-y-4">
              <Checkbox id="f-only" checked={v.recipientOnly} onCheckedChange={(x) => set({ recipientOnly: x })} label="Only the recipient may open it" />
              <Checkbox id="f-family" checked={v.allowFamilyAfterOpening} onCheckedChange={(x) => set({ allowFamilyAfterOpening: x })} label="After it's opened, the recipient may share it with family" />
              <Field label="A private note for your successor" htmlFor="f-note" optional hint="Instructions, not part of the letter.">
                <Textarea id="f-note" value={v.personalNote ?? ""} onChange={(e) => set({ personalNote: e.target.value })} className="min-h-20" />
              </Field>
            </div>
          </Panel>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[24px] bg-night p-6">
            <SealedLetter to={v.recipientName || "Someone you love"} openOn={formatDate(v.releaseDate, "long")} tone="night" />
          </div>
          <Button variant="secondary" block leading={<Eye className="size-4" />} onClick={() => setPreview(true)}>
            Preview the opening
          </Button>
          <Button block loading={busy === "save"} leading={<Save className="size-4" />} onClick={() => void save(false)}>
            Save draft
          </Button>
          <Button variant="ghost" block loading={busy === "seal"} leading={<Lock className="size-4" />} onClick={() => void save(true)}>
            Save &amp; seal (demo)
          </Button>
          {keptAt ? (
            <p className="flex items-center gap-2 text-[0.8125rem] text-ink-3" aria-live="polite">
              <History className="size-3.5" /> Writing kept on this device {relativeTime(keptAt)}. Save the draft when you&rsquo;re ready.
            </p>
          ) : null}
          <DemoNotice title="Future message draft — not scheduled">Saved on this device. Sealing records a content fingerprint and can be undone. No delivery is arranged, and no payment is taken.</DemoNotice>
        </aside>
      </div>
      <Dialog open={preview} onOpenChange={setPreview} title="Opening preview" hideTitle size="xl">
        <div className="-mx-6 -mb-6 bg-night px-6 py-10 sm:-mx-8 sm:px-8">
          <LetterOpening message={previewMessage} mode="preview" />
          <p className="mt-6 text-center text-[0.8125rem] text-night-ink-3">Simulated opening — no letter was delivered.</p>
        </div>
      </Dialog>
    </div>
  );
}

export default function NewFutureMessage() {
  return (
    <Suspense fallback={null}>
      <ComposerInner />
    </Suspense>
  );
}

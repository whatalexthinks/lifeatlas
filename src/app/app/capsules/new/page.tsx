"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookHeart, Eye, Heart, HeartHandshake, ImagePlus, Link2, Lock, Mic2, Sparkles, User, UserRound, Users, X } from "lucide-react";
import type { Capsule, ChapterKey } from "@/domain/models";
import {
  wizardChapterSchema,
  wizardCollectionSchema,
  wizardCoverSchema,
  wizardIntroduceSchema,
  wizardPrivacySchema,
  wizardWhoSchema,
  type CapsuleWizardValues,
} from "@/domain/schemas";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Field, Input, Switch, Textarea } from "@/components/ui/field";
import { DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { CapsuleCover, paletteStyles } from "@/components/capsule/capsule-cover";
import { MediaImage } from "@/components/media/media-image";
import { chapters } from "@/data/chapters";
import { questionLibrary } from "@/data/prompts/questions";
import { validateFileDeep } from "@/domain/media/validation";
import { useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

type Draft = Partial<CapsuleWizardValues> & { step: number; coverMediaId?: string; birthYear?: number | "" };

const STEPS = ["Who it's for", "Introduce them", "How you'll gather", "Where to begin", "The cover", "Privacy", "First memory"] as const;

const relationshipDefaults: Record<CapsuleWizardValues["relationshipKind"], string> = {
  mother: "Mother",
  father: "Father",
  grandparent: "Grandmother",
  partner: "Partner",
  self: "Myself",
  other: "",
};

const initial: Draft = {
  step: 0,
  relationshipKind: undefined,
  relationship: "",
  subjectName: "",
  preferredName: "",
  birthYear: "",
  birthplace: "",
  dedication: "",
  collectionMode: "in_person",
  startingChapter: "childhood",
  palette: "evergreen",
  typography: "classic",
  layout: "type_only",
  defaultPrivacy: "family",
  viewerEnabled: true,
};

export default function NewCapsulePage() {
  const router = useRouter();
  const stored = useDb((d) => d.wizardDraft) as Draft | null;
  const mutate = useDemoStore((s) => s.mutate);
  const [draft, setDraftState] = React.useState<Draft>(() => ({ ...initial, ...(stored ?? {}) }));
  const draftRef = React.useRef(draft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [creating, setCreating] = React.useState(false);
  const [restored] = React.useState(!!stored && (stored.step > 0 || !!stored.subjectName));
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const step = draft.step;

  const setDraft = (patch: Partial<Draft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraftState(next);
    mutate((db) => {
      db.wizardDraft = next;
    });
  };

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const validate = (): boolean => {
    const schema = [wizardWhoSchema, wizardIntroduceSchema, wizardCollectionSchema, wizardChapterSchema, wizardCoverSchema, wizardPrivacySchema][step];
    if (!schema) return true;
    const r = schema.safeParse(draft);
    if (r.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const issue of r.error.issues) e[String(issue.path[0] ?? "form")] ??= issue.message;
    setErrors(e);
    return false;
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1 && !validate()) return;
    setDraft({ step: Math.max(0, Math.min(STEPS.length - 1, step + dir)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startOver = () => {
    mutate((db) => {
      db.wizardDraft = null;
    });
    draftRef.current = initial;
    setDraftState(initial);
    setErrors({});
  };

  const preview: Pick<Capsule, "subjectName" | "title" | "birthYear" | "theme" | "cover" | "dedication"> = {
    subjectName: draft.subjectName?.trim() || "Their name",
    title: draft.relationshipKind === "self" ? "In My Own Words" : `The Life & Stories of ${(draft.preferredName || draft.subjectName || "…").split(" ")[0]}`,
    birthYear: typeof draft.birthYear === "number" ? draft.birthYear : draft.birthYear ? Number(draft.birthYear) || undefined : undefined,
    theme: { palette: draft.palette ?? "evergreen", typography: draft.typography ?? "classic" },
    cover: { mediaId: draft.coverMediaId, layout: draft.coverMediaId ? draft.layout ?? "full_bleed" : "type_only", focalY: 45 },
    dedication: draft.dedication || undefined,
  };

  const firstQuestions = questionLibrary.filter((q) => q.chapter === (draft.startingChapter ?? "childhood")).slice(0, 3);
  const [firstQ, setFirstQ] = React.useState<string | undefined>();

  const create = async () => {
    const all = [wizardWhoSchema, wizardIntroduceSchema, wizardCollectionSchema, wizardChapterSchema, wizardCoverSchema, wizardPrivacySchema];
    for (let i = 0; i < all.length; i++) {
      if (!all[i].safeParse(draft).success) {
        setDraft({ step: i });
        toast.warning("A step needs a look", "We took you back to it.");
        return;
      }
    }
    setCreating(true);
    const values = {
      ...(draft as CapsuleWizardValues),
      birthYear: draft.birthYear === "" || draft.birthYear === undefined ? "" : Number(draft.birthYear),
      layout: draft.coverMediaId ? draft.layout ?? "full_bleed" : "type_only",
      coverMediaId: draft.coverMediaId,
    } as CapsuleWizardValues & { coverMediaId?: string };
    const r = await services().capsules.createFromWizard(values);
    if (r.status !== "ok") {
      setCreating(false);
      toast.error("Couldn't create the capsule", r.status === "error" ? r.message : undefined);
      return;
    }
    if (draft.coverMediaId) await services().media.updateMeta(draft.coverMediaId, { capsuleId: r.data.id });
    const q = firstQ ?? firstQuestions[0]?.id;
    router.push(`/app/gather?capsule=${r.data.id}&first=1${q ? `&question=${q}` : ""}`);
  };

  return (
    <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div className="min-w-0">
        <div className="mb-8 flex items-center gap-4">
          <span className="catalog shrink-0">
            Step {step + 1} of {STEPS.length}
          </span>
          <ProgressBar value={step + 1} max={STEPS.length} label="Capsule setup progress" />
          <button type="button" onClick={() => router.push("/app")} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-ivory hover:text-ink" aria-label="Leave setup (your draft is saved)">
            <X className="size-5" />
          </button>
        </div>

        {restored && step > 0 ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-ivory px-4 py-3 text-[0.9rem]">
            <span>Welcome back — we kept your draft on this device.</span>
            <button className="font-medium text-evergreen hover:underline" onClick={startOver}>
              Start over
            </button>
          </div>
        ) : null}

        <p className="eyebrow">{STEPS[step]}</p>
        <div key={step} className="animate-[fade-up_420ms_var(--ease-out)_both]">
          {/* 1. WHO */}
          {step === 0 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                Who is this capsule for?
              </h1>
              <p className="mt-3 text-lead text-ink-2">A parent, a grandparent, someone you love — or yourself.</p>
              <div className="mt-8">
                <ChoiceCards
                  name="relationshipKind"
                  value={draft.relationshipKind}
                  onChange={(v) => setDraft({ relationshipKind: v, relationship: draft.relationship && draft.relationshipKind === v ? draft.relationship : relationshipDefaults[v] })}
                  columns={2}
                  size="lg"
                  options={[
                    { value: "mother", label: "My mother", icon: <Heart className="size-5" /> },
                    { value: "father", label: "My father", icon: <UserRound className="size-5" /> },
                    { value: "grandparent", label: "A grandparent", icon: <Users className="size-5" /> },
                    { value: "partner", label: "My partner", icon: <HeartHandshake className="size-5" /> },
                    { value: "self", label: "Myself", description: "For the people who'll want your stories one day", icon: <User className="size-5" /> },
                    { value: "other", label: "Someone else", description: "A friend, an aunt, a mentor…", icon: <BookHeart className="size-5" /> },
                  ]}
                />
                {errors.relationshipKind ? <p className="mt-3 text-[0.875rem] font-medium text-danger">Choose who it&rsquo;s for.</p> : null}
              </div>
              {draft.relationshipKind ? (
                <Field label="How would you describe them?" htmlFor="relationship" hint="Free text — “Grandma June”, “my stepfather”, “Aunt Rose”." error={errors.relationship} className="mt-8 max-w-md">
                  <Input id="relationship" value={draft.relationship ?? ""} onChange={(e) => setDraft({ relationship: e.target.value })} invalid={!!errors.relationship} />
                </Field>
              ) : null}
            </>
          ) : null}

          {/* 2. INTRODUCE */}
          {step === 1 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                {draft.relationshipKind === "self" ? "Introduce yourself." : "Introduce them."}
              </h1>
              <p className="mt-3 text-lead text-ink-2">Only a name is needed. Everything else is optional and can be added later.</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Field label="Name" htmlFor="subjectName" error={errors.subjectName} className="sm:col-span-2">
                  <Input id="subjectName" value={draft.subjectName ?? ""} onChange={(e) => setDraft({ subjectName: e.target.value })} placeholder="Margaret Ellis" autoComplete="off" invalid={!!errors.subjectName} />
                </Field>
                <Field label="What do you call them?" htmlFor="preferredName" optional hint="Mom, Grandpa Joe, Nana…" error={errors.preferredName}>
                  <Input id="preferredName" value={draft.preferredName ?? ""} onChange={(e) => setDraft({ preferredName: e.target.value })} />
                </Field>
                <Field label="Year born" htmlFor="birthYear" optional hint="Approximate is fine." error={errors.birthYear}>
                  <Input id="birthYear" type="number" inputMode="numeric" min={1900} max={new Date().getFullYear()} value={draft.birthYear ?? ""} onChange={(e) => setDraft({ birthYear: e.target.value === "" ? "" : Number(e.target.value) })} invalid={!!errors.birthYear} />
                </Field>
                <Field label="Where they grew up" htmlFor="birthplace" optional hint="A town or city — never a street address." className="sm:col-span-2">
                  <Input id="birthplace" value={draft.birthplace ?? ""} onChange={(e) => setDraft({ birthplace: e.target.value })} placeholder="Portland, Maine" />
                </Field>
                <Field label="A short dedication" htmlFor="dedication" optional hint="It appears on the cover. You can change it any time." error={errors.dedication} className="sm:col-span-2">
                  <Textarea id="dedication" value={draft.dedication ?? ""} onChange={(e) => setDraft({ dedication: e.target.value })} placeholder="For the stories that made us, and the ones still to come." className="min-h-24" maxLength={400} />
                </Field>
                <CoverPhotoField draft={draft} setDraft={setDraft} />
              </div>
            </>
          ) : null}

          {/* 3. COLLECTION MODE */}
          {step === 2 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                How will memories be gathered?
              </h1>
              <p className="mt-3 text-lead text-ink-2">Choose what fits today. You can do all three over time.</p>
              <div className="mt-8">
                <ChoiceCards
                  name="collectionMode"
                  value={draft.collectionMode}
                  onChange={(v) => setDraft({ collectionMode: v })}
                  columns={1}
                  size="lg"
                  options={[
                    { value: "in_person", label: "Together, in person", description: "Sit side by side. You read the question, they answer. The easiest way to begin.", icon: <Mic2 className="size-5" /> },
                    { value: "link", label: "Send them a link", description: "They answer on their own phone or tablet — one large button, no password.", icon: <Link2 className="size-5" /> },
                    { value: "family", label: "Collaborate with family", description: "Invite siblings, cousins and friends to add what only they remember.", icon: <Users className="size-5" /> },
                  ]}
                />
              </div>
            </>
          ) : null}

          {/* 4. CHAPTER */}
          {step === 3 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                Where would you like to begin?
              </h1>
              <p className="mt-3 text-lead text-ink-2">A starting chapter shapes the first few questions. Nothing is locked in.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {chapters.map((c) => {
                  const on = draft.startingChapter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraft({ startingChapter: c.id as ChapterKey })}
                      aria-pressed={on}
                      className={cn("rounded-[18px] border p-5 text-left transition-[border-color,box-shadow]", on ? "border-evergreen bg-surface shadow-[0_0_0_1px_var(--evergreen)]" : "border-line bg-surface/70 hover:border-line-strong")}
                    >
                      <p className="font-serif text-[1.5rem] leading-tight">{c.title}</p>
                      <p className="mt-1 text-[0.875rem] text-ink-3">{c.subtitle}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 rounded-[18px] bg-ivory p-5">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-brass-ink">Suggested first questions</p>
                <ul className="mt-3 space-y-2">
                  {firstQuestions.map((q) => (
                    <li key={q.id} className="font-serif text-[1.2rem] leading-snug">
                      {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {/* 5. COVER */}
          {step === 4 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                Choose a cover.
              </h1>
              <p className="mt-3 text-lead text-ink-2">Quiet colors and real typography. The preview updates as you choose.</p>
              <div className="mt-8 space-y-8">
                <div>
                  <p className="mb-3 font-medium">Color</p>
                  <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Cover color">
                    {(Object.keys(paletteStyles) as Capsule["theme"]["palette"][]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={draft.palette === k}
                        onClick={() => setDraft({ palette: k })}
                        className={cn("flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-[0.875rem] font-medium", draft.palette === k ? "border-evergreen bg-surface shadow-[0_0_0_1px_var(--evergreen)]" : "border-line-strong")}
                      >
                        <span className="size-8 rounded-full ring-1 ring-black/10" style={{ background: paletteStyles[k].bg }} />
                        {paletteStyles[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 font-medium">Lettering</p>
                  <ChoiceCards
                    name="typography"
                    value={draft.typography}
                    onChange={(v) => setDraft({ typography: v })}
                    columns={3}
                    options={[
                      { value: "classic", label: <span className="font-serif text-[1.3rem]">Classic</span>, description: "Editorial serif" },
                      { value: "italic", label: <span className="font-serif text-[1.3rem] italic">Italic</span>, description: "Warm and personal" },
                      { value: "modern", label: <span className="text-[1.15rem] font-medium tracking-[-0.03em]">Modern</span>, description: "Clean and quiet" },
                    ]}
                  />
                </div>
                {draft.coverMediaId ? (
                  <div>
                    <p className="mb-3 font-medium">Photograph placement</p>
                    <ChoiceCards
                      name="layout"
                      value={draft.layout}
                      onChange={(v) => setDraft({ layout: v })}
                      columns={3}
                      options={[
                        { value: "full_bleed", label: "Full bleed", description: "The photo fills the cover" },
                        { value: "portrait", label: "Framed", description: "A portrait with a border" },
                        { value: "type_only", label: "Type only", description: "No photo on the cover" },
                      ]}
                    />
                  </div>
                ) : (
                  <p className="text-[0.9375rem] text-ink-3">Add a photograph in step 2 to place it on the cover.</p>
                )}
              </div>
            </>
          ) : null}

          {/* 6. PRIVACY */}
          {step === 5 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                Who can see these stories?
              </h1>
              <p className="mt-3 text-lead text-ink-2">Capsules are private and never publicly listed. Choose the default for new memories — each story can be changed later.</p>
              <div className="mt-8">
                <ChoiceCards
                  name="defaultPrivacy"
                  value={draft.defaultPrivacy}
                  onChange={(v) => setDraft({ defaultPrivacy: v })}
                  columns={1}
                  size="lg"
                  options={[
                    { value: "family", label: "Family I invite", description: "People you invite as viewers can explore approved stories.", icon: <Users className="size-5" /> },
                    { value: "organizers", label: "Organizers only", description: "Keep new stories between you and co-organizers until you decide.", icon: <Eye className="size-5" /> },
                    { value: "private", label: "Only me", description: "Private until you choose to share each story.", icon: <Lock className="size-5" /> },
                  ]}
                />
              </div>
              <div className="card-quiet mt-6 p-5">
                <Switch id="viewer" checked={!!draft.viewerEnabled} onCheckedChange={(v) => setDraft({ viewerEnabled: v })} label="Turn on the family viewer" description="An invitation-only presentation of approved stories. You can turn it off any time." />
              </div>
              <DemoNotice className="mt-6" title="In this preview">
                Privacy choices are applied to what each demo identity sees, but real access control isn&rsquo;t active yet. Everything stays on this device.
              </DemoNotice>
            </>
          ) : null}

          {/* 7. FIRST MEMORY */}
          {step === 6 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none">
                Now, the first memory.
              </h1>
              <p className="mt-3 text-lead text-ink-2">Pick one question to ask {draft.relationshipKind === "self" ? "yourself" : draft.preferredName || draft.subjectName?.split(" ")[0] || "them"}. Speak, type or add a photo — it becomes a story page immediately.</p>
              <div className="mt-8 space-y-2.5" role="radiogroup" aria-label="First question">
                {firstQuestions.map((q, i) => {
                  const on = (firstQ ?? firstQuestions[0]?.id) === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setFirstQ(q.id)}
                      className={cn("flex w-full items-start gap-4 rounded-[18px] border p-5 text-left", on ? "border-evergreen bg-surface shadow-[0_0_0_1px_var(--evergreen)]" : "border-line bg-surface/70 hover:border-line-strong")}
                    >
                      <span className="catalog mt-1.5">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-serif text-[1.4rem] leading-snug">{q.text}</span>
                    </button>
                  );
                })}
              </div>
              <DemoNotice className="mt-8">Your capsule and recordings are stored on this device for demonstration — not uploaded or backed up.</DemoNotice>
            </>
          ) : null}
        </div>

        <div className="sticky bottom-[68px] -mx-4 mt-10 flex items-center justify-between gap-3 border-t border-line bg-paper/92 px-4 py-4 backdrop-blur md:bottom-0 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <Button variant="ghost" size="lg" onClick={() => go(-1)} disabled={step === 0} leading={<ArrowLeft className="size-4" />}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="lg" onClick={() => go(1)} trailing={<ArrowRight className="size-4" />}>
              Continue
            </Button>
          ) : (
            <Button size="lg" onClick={() => void create()} loading={creating} trailing={<Sparkles className="size-4" />}>
              Create & ask the first question
            </Button>
          )}
        </div>
      </div>

      {/* Live preview */}
      <aside className="hidden lg:block" aria-label="Cover preview">
        <div className="sticky top-24">
          <p className="catalog mb-3">Live preview</p>
          <CapsuleCover capsule={preview} size="lg" className="aspect-[4/5] rounded-[22px] shadow-lg" />
          <dl className="mt-5 space-y-2 text-[0.875rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">For</dt>
              <dd>{draft.relationship || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Gathering</dt>
              <dd>{{ in_person: "Together, in person", link: "By link", family: "With family" }[draft.collectionMode ?? "in_person"]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Begins with</dt>
              <dd>{chapters.find((c) => c.id === draft.startingChapter)?.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Visible to</dt>
              <dd>{{ family: "Invited family", organizers: "Organizers", private: "Only me" }[draft.defaultPrivacy ?? "family"]}</dd>
            </div>
          </dl>
          <p className="mt-5 text-[0.8125rem] text-ink-3">Draft saved on this device as you go.</p>
        </div>
      </aside>
    </div>
  );
}

function CoverPhotoField({ draft, setDraft }: { draft: Draft; setDraft: (p: Partial<Draft>) => void }) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const media = useDb((d) => d.media);
  const asset = media.find((m) => m.id === draft.coverMediaId);
  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    const v = await validateFileDeep(file, "image");
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setBusy(true);
    const r = await services().media.put({ capsuleId: "cap_pending", blob: file, kind: "image", caption: "Cover photograph", alt: "Cover photograph", contributorName: "Organizer" });
    setBusy(false);
    if (r.status === "ok") setDraft({ coverMediaId: r.data.id, layout: "full_bleed" });
    else setError(r.message);
  };
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 flex items-baseline justify-between text-[0.9375rem] font-medium">
        A photograph <span className="text-[0.8125rem] font-normal text-ink-3">Optional</span>
      </p>
      <div className="flex items-center gap-4 rounded-[16px] border border-dashed border-line-strong bg-surface/60 p-4">
        {asset ? <CoverThumb mediaId={asset.id} /> : <span className="grid size-16 place-items-center rounded-[12px] bg-ivory text-ink-3"><ImagePlus className="size-6" /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem]">{asset ? "Cover photo added" : "A portrait or a favorite snapshot"}</p>
          <p className="text-[0.8125rem] text-ink-3">Stays on this device in the demo.</p>
        </div>
        <Button variant="secondary" size="sm" loading={busy} onClick={() => ref.current?.click()}>
          {asset ? "Replace" : "Choose photo"}
        </Button>
        {asset ? (
          <Button variant="ghost" size="sm" onClick={() => setDraft({ coverMediaId: undefined, layout: "type_only" })}>
            Remove
          </Button>
        ) : null}
        <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      {error ? <p className="mt-2 text-[0.875rem] font-medium text-danger">{error}</p> : null}
    </div>
  );
}

function CoverThumb({ mediaId }: { mediaId: string }) {
  return (
    <span className="relative block size-16 overflow-hidden rounded-[12px]">
      <MediaThumb mediaId={mediaId} />
    </span>
  );
}

function MediaThumb({ mediaId }: { mediaId: string }) {
  return <MediaImage mediaId={mediaId} className="absolute inset-0" />;
}

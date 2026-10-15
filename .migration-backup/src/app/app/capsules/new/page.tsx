"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Baby, Feather, HeartHandshake, ImagePlus, Lock, PenLine, Shuffle, Sparkles, User, Users, X, Armchair } from "lucide-react";
import type { Capsule, CapsuleKind } from "@/domain/models";
import { onboardingDetailsSchema, onboardingKindSchema } from "@/domain/schemas";
import { capsuleKinds, kindOrder, questionsForKind, surpriseQuestion } from "@/domain/capsule-kinds";
import { askFor, subjectFor, suggestedTitle, toCreateInput } from "@/domain/onboarding";
import { capsuleAllowance, countOwnedCapsules, currentPlanId } from "@/domain/commerce/plans";
import { chapterById } from "@/data/chapters";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCards, Field, Input } from "@/components/ui/field";
import { DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { CapsuleCover, paletteStyles } from "@/components/capsule/capsule-cover";
import { MediaImage } from "@/components/media/media-image";
import { validateFileDeep } from "@/domain/media/validation";
import { useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

/**
 * Onboarding: "Whose story would you like to preserve?" — then only what that kind of story
 * needs, a cover, and one question to begin. Four short steps; the draft is kept on this
 * device so nobody loses their place.
 */

interface Draft {
  v: 2;
  step: number;
  kind?: CapsuleKind;
  name: string;
  partnerName: string;
  relationship: string;
  birthYear: number | "";
  birthplace: string;
  keyDate: string;
  title: string;
  titleEdited: boolean;
  palette: Capsule["theme"]["palette"];
  typography: Capsule["theme"]["typography"];
  layout: Capsule["cover"]["layout"];
  coverMediaId?: string;
  questionId?: string;
}

const STEPS = ["Whose story", "A few details", "Make it yours", "The first question"] as const;

const kindIcons: Record<CapsuleKind, React.ReactNode> = {
  personal: <User className="size-5" />,
  couple: <HeartHandshake className="size-5" />,
  family: <Users className="size-5" />,
  parent: <Armchair className="size-5" />,
  child: <Baby className="size-5" />,
  someone: <Feather className="size-5" />,
};

/** Quick answers for "Who are they to you?" — the field stays free text. */
const relationshipChips: Partial<Record<CapsuleKind, string[]>> = {
  parent: ["Mother", "Father", "Grandmother", "Grandfather"],
  child: ["Daughter", "Son", "Child", "Grandchild"],
  someone: ["Friend", "Mentor", "Aunt", "Uncle"],
};

const nameLabel: Record<CapsuleKind, { label: string; hint: string; placeholder: string }> = {
  personal: { label: "Your name", hint: "As you'd like it on the cover.", placeholder: "e.g. Sarah Ellis" },
  couple: { label: "Your name", hint: "A first name is enough.", placeholder: "e.g. Sarah" },
  family: { label: "Family name", hint: "“Ellis” becomes “The Ellis Family”. Blended, chosen and step-families are all welcome.", placeholder: "e.g. Ellis" },
  parent: { label: "Their name", hint: "The name you'd like on the cover — “Grandma June” is fine.", placeholder: "e.g. Margaret Ellis" },
  child: { label: "Their name", hint: "A first name is enough.", placeholder: "e.g. Emma" },
  someone: { label: "Their name", hint: "A friend, a mentor, someone you miss.", placeholder: "e.g. Aunt Rose" },
};

const firstQuestionNote: Record<CapsuleKind, (name: string) => string> = {
  personal: () => "Answer it yourself — type, speak, or add a photograph.",
  couple: () => "Answer it together, or each in your own words. Both answers are kept.",
  family: () => "Ask it at the next family dinner — or answer it yourself first.",
  parent: (n) => `Ask ${n || "them"} — or sit beside them and record the answer in their own voice.`,
  child: (n) => `Write it for ${n || "them"} to read one day.`,
  someone: () => "Answer it with what you remember. Others can add theirs later.",
};

const emptyDraft = (name = ""): Draft => ({
  v: 2,
  step: 0,
  kind: undefined,
  name,
  partnerName: "",
  relationship: "",
  birthYear: "",
  birthplace: "",
  keyDate: "",
  title: "",
  titleEdited: false,
  palette: "linen",
  typography: "classic",
  layout: "type_only",
});

export default function NewCapsulePage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const stored = useDb((d) => d.wizardDraft) as Partial<Draft> | null;
  const ownName = useDb((d) => d.account.profile.displayName);
  const mutate = useDemoStore((s) => s.mutate);
  const [draft, setDraftState] = React.useState<Draft>(() => {
    // Drafts from the earlier, longer wizard don't fit these steps; start fresh instead.
    const base = stored?.v === 2 ? { ...emptyDraft(), ...stored } : emptyDraft();
    const asked = params.get("kind");
    if (!base.kind && asked && (kindOrder as string[]).includes(asked)) base.kind = asked as CapsuleKind;
    return base;
  });
  const draftRef = React.useRef(draft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [creating, setCreating] = React.useState(false);
  const [restored] = React.useState(stored?.v === 2 && ((stored.step ?? 0) > 0 || !!stored.name));
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const step = draft.step;
  const kind = draft.kind;

  const setDraft = (patch: Partial<Draft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraftState(next);
    // A message about a field goes away as soon as that field is changed.
    setErrors((e) => {
      const touched = Object.keys(patch).filter((k) => k in e || (k === "titleEdited" && "title" in e));
      if (!touched.length) return e;
      const rest = { ...e };
      for (const k of touched) delete rest[k === "titleEdited" ? "title" : k];
      return rest;
    });
    mutate((db) => {
      db.wizardDraft = next;
    });
  };

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Plan room — the same rule the service enforces, shown before anyone fills anything in.
  const subscriptions = useDb((d) => d.subscriptions);
  const catalog = useDb((d) => d.catalog);
  const capsules = useDb((d) => d.capsules);
  const personaPerson = useDb((d) => d.personas.find((p) => p.id === d.activePersonaId)?.personId);
  const allowance = capsuleAllowance(currentPlanId(subscriptions, catalog), countOwnedCapsules(capsules, personaPerson ?? "per_sarah"));

  const questions = useDb((d) => d.questions);
  const pool = React.useMemo(() => (kind ? questionsForKind(kind, questions) : []), [kind, questions]);
  const [seen, setSeen] = React.useState<Set<string>>(() => new Set());
  const question = pool.find((q) => q.id === draft.questionId) ?? pool[0];
  const suggestions = pool.filter((q) => q.id !== question?.id).slice(0, 3);

  const names = { name: draft.name, partnerName: draft.partnerName };
  const title = kind ? (draft.titleEdited ? draft.title : suggestedTitle(kind, names)) : "";
  const details = () => ({
    kind,
    name: draft.name,
    partnerName: draft.partnerName,
    relationship: draft.relationship,
    birthYear: draft.birthYear,
    birthplace: draft.birthplace,
    keyDate: draft.keyDate,
    title,
  });

  const showErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
    const e: Record<string, string> = {};
    for (const issue of issues) e[String(issue.path[0] ?? "form")] ??= issue.message;
    setErrors(e);
    const firstKey = Object.keys(e)[0];
    requestAnimationFrame(() => document.getElementById(firstKey === "kind" ? "kind-group" : firstKey)?.focus());
  };

  const validate = (): boolean => {
    const r = step === 0 ? onboardingKindSchema.safeParse({ kind }) : step === 1 ? onboardingDetailsSchema.safeParse(details()) : { success: true as const };
    if (r.success) {
      setErrors({});
      return true;
    }
    showErrors(r.error.issues);
    return false;
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1 && !validate()) return;
    // "Your name" starts as the account's name — however the kind was chosen (a click or a link).
    const prefill = dir === 1 && step === 0 && !draft.name.trim() && (kind === "personal" || kind === "couple") ? { name: kind === "couple" ? ownName.split(" ")[0] : ownName } : {};
    setDraft({ ...prefill, step: Math.max(0, Math.min(STEPS.length - 1, step + dir)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startOver = () => {
    const fresh = emptyDraft();
    mutate((db) => {
      db.wizardDraft = null;
    });
    draftRef.current = fresh;
    setDraftState(fresh);
    setErrors({});
  };

  const surprise = () => {
    if (!kind) return;
    const exclude = new Set([...seen, ...(question ? [question.id] : [])]);
    const q = surpriseQuestion(kind, questions, exclude);
    if (!q) return;
    setSeen(exclude);
    setDraft({ questionId: q.id });
  };

  const create = async (withQuestion: boolean) => {
    const parsed = onboardingDetailsSchema.safeParse(details());
    if (!parsed.success) {
      setDraft({ step: 1 });
      showErrors(parsed.error.issues);
      toast.warning("A detail needs a look", "We took you back to it.");
      return;
    }
    setCreating(true);
    const r = await services().capsules.createFromWizard(toCreateInput(parsed.data, { palette: draft.palette, typography: draft.typography, layout: draft.layout, coverMediaId: draft.coverMediaId }));
    if (r.status !== "ok") {
      setCreating(false);
      toast.error("Couldn't create the capsule", r.status === "error" ? r.message : undefined);
      return;
    }
    if (draft.coverMediaId) await services().media.updateMeta(draft.coverMediaId, { capsuleId: r.data.id });
    router.push(withQuestion && question ? `/app/gather?capsule=${r.data.id}&first=1&question=${question.id}` : `/app/capsules/${r.data.id}`);
  };

  if (!allowance.allowed && !creating) return <PlanGate reason={allowance.reason} limit={allowance.limit} />;

  const config = kind ? capsuleKinds[kind] : undefined;
  const ask = kind ? askFor[kind] : undefined;
  const callThem = kind && kind !== "personal" && kind !== "couple" && kind !== "family" ? config!.about(draft.name) : "";
  const preview: Pick<Capsule, "subjectName" | "title" | "birthYear" | "theme" | "cover" | "dedication"> = {
    subjectName: kind && draft.name.trim() ? subjectFor(kind, names) : kind === "personal" || kind === "couple" ? "Your name" : kind ? "Their name" : "Your capsule",
    title: title || "Every life is a story worth keeping",
    birthYear: ask?.birthYear && typeof draft.birthYear === "number" ? draft.birthYear : undefined,
    theme: { palette: draft.palette, typography: draft.typography },
    cover: { mediaId: draft.coverMediaId, layout: draft.coverMediaId ? draft.layout : "type_only", focalY: 45 },
    dedication: undefined,
  };
  const startsWith = config ? config.chapterTitles[config.chapterOrder[0]] ?? chapterById(config.chapterOrder[0]).title : "—";
  const heading = "mt-4 font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.04] outline-none";

  return (
    <div className={cn("mx-auto grid gap-10 lg:gap-16", step === 0 ? "max-w-[1040px]" : "max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_380px]")}>
      <div className="min-w-0">
        <div className="mb-8 flex items-center gap-4">
          <span className="catalog shrink-0">
            Step {step + 1} of {STEPS.length}
          </span>
          <ProgressBar value={step + 1} max={STEPS.length} label="Capsule setup progress" />
          <button type="button" onClick={() => router.push("/app")} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-ivory hover:text-ink" aria-label="Leave setup (your draft is kept on this device)">
            <X className="size-5" />
          </button>
        </div>

        {restored && step > 0 ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-ivory px-4 py-3 text-[0.9375rem]">
            <span>Welcome back — we kept your draft on this device.</span>
            <button className="min-h-11 font-medium text-oxblood underline-offset-4 hover:underline" onClick={startOver}>
              Start over
            </button>
          </div>
        ) : null}

        <p className="eyebrow">{STEPS[step]}</p>
        <div key={step} className="animate-[fade-up_420ms_var(--ease-out)_both]">
          {/* 1. WHOSE STORY */}
          {step === 0 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={heading}>
                Whose story would you like to <em>preserve?</em>
              </h1>
              <p className="mt-3 text-lead text-ink-2">Choose the closest fit. Every capsule can hold stories, photographs, voices and letters — this only shapes the questions we offer first.</p>
              <div className="mt-8" id="kind-group" tabIndex={-1}>
                <ChoiceCards
                  name="kind"
                  aria-label="Whose story"
                  value={kind}
                  onChange={(v) => {
                    // A capsule about someone else shouldn't start with your own name in it.
                    const wasYours = draft.name.trim() === ownName || draft.name.trim() === ownName.split(" ")[0];
                    const name = v !== "personal" && v !== "couple" && wasYours ? "" : draft.name;
                    setDraft({ kind: v, name, relationship: v === kind ? draft.relationship : "", questionId: undefined, keyDate: v === kind ? draft.keyDate : "" });
                  }}
                  columns={2}
                  size="lg"
                  className="xl:grid-cols-3"
                  options={kindOrder.map((k) => ({ value: k, label: capsuleKinds[k].option, description: capsuleKinds[k].optionHint, icon: kindIcons[k] }))}
                />
                {errors.kind ? (
                  <p className="mt-3 text-[0.9375rem] font-medium text-danger" role="alert">
                    {errors.kind}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {/* 2. DETAILS */}
          {step === 1 && kind && ask ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={heading}>
                {kind === "personal" ? (
                  <>
                    A little <em>about you.</em>
                  </>
                ) : kind === "couple" ? (
                  <>
                    The two <em>of you.</em>
                  </>
                ) : kind === "family" ? (
                  <>
                    Your <em>family.</em>
                  </>
                ) : (
                  <>
                    A little <em>about them.</em>
                  </>
                )}
              </h1>
              <p className="mt-3 text-lead text-ink-2">Only a name is needed. Everything else is optional and can be added later.</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Field label={nameLabel[kind].label} htmlFor="name" hint={nameLabel[kind].hint} error={errors.name} className={ask.partner ? "" : "sm:col-span-2"}>
                  <Input id="name" value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} placeholder={nameLabel[kind].placeholder} autoComplete={kind === "personal" || kind === "couple" ? "name" : "off"} invalid={!!errors.name} />
                </Field>
                {ask.partner ? (
                  <Field label="Your partner's name" htmlFor="partnerName" hint="We'll add them as a person in your capsule." error={errors.partnerName}>
                    <Input id="partnerName" value={draft.partnerName} onChange={(e) => setDraft({ partnerName: e.target.value })} placeholder="e.g. Jonah" autoComplete="off" invalid={!!errors.partnerName} />
                  </Field>
                ) : null}
                {ask.relationship ? (
                  <Field label="Who are they to you?" htmlFor="relationship" hint="Pick one or write your own — “stepfather”, “Nana”, “my oldest friend”." error={errors.relationship} className="sm:col-span-2">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(relationshipChips[kind] ?? []).map((r) => (
                          <button
                            key={r}
                            type="button"
                            aria-pressed={draft.relationship === r}
                            onClick={() => setDraft({ relationship: r })}
                            className={cn("min-h-11 rounded-full border px-4 text-[0.9375rem] font-medium transition-colors", draft.relationship === r ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface hover:border-ink-3")}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <Input id="relationship" value={draft.relationship} onChange={(e) => setDraft({ relationship: e.target.value })} invalid={!!errors.relationship} />
                    </div>
                  </Field>
                ) : null}
                {ask.birthYear ? (
                  <Field label="Year born" htmlFor="birthYear" optional hint="Approximate is fine." error={errors.birthYear}>
                    <Input id="birthYear" type="number" inputMode="numeric" min={1850} max={new Date().getFullYear()} value={draft.birthYear} onChange={(e) => setDraft({ birthYear: e.target.value === "" ? "" : Number(e.target.value) })} invalid={!!errors.birthYear} />
                  </Field>
                ) : null}
                {ask.birthplace ? (
                  <Field label={kind === "family" ? "Where the family is from" : kind === "personal" ? "Where you grew up" : "Where they grew up"} htmlFor="birthplace" optional hint="A town or city — never a street address.">
                    <Input id="birthplace" value={draft.birthplace} onChange={(e) => setDraft({ birthplace: e.target.value })} placeholder="e.g. Portland, Maine" />
                  </Field>
                ) : null}
                {ask.keyDate ? (
                  <Field
                    label={ask.keyDate === "anniversary" ? "Your anniversary" : "Their birthday"}
                    htmlFor="keyDate"
                    optional
                    hint={ask.keyDate === "anniversary" ? "The day you met or married. We'll remind you as it comes round — skip it if you'd rather." : "We'll show it among your upcoming dates. Skip it if you'd rather."}
                    error={errors.keyDate}
                  >
                    <Input id="keyDate" type="date" min="1900-01-01" value={draft.keyDate} onChange={(e) => setDraft({ keyDate: e.target.value })} invalid={!!errors.keyDate} />
                  </Field>
                ) : null}
                <Field label="Capsule name" htmlFor="title" hint="Shown on the cover. Change it whenever you like." error={errors.title} className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Input id="title" value={title} onChange={(e) => setDraft({ title: e.target.value, titleEdited: true })} invalid={!!errors.title} className="font-serif text-[1.15rem]" />
                    {draft.titleEdited ? (
                      <Button variant="ghost" size="sm" onClick={() => setDraft({ titleEdited: false, title: "" })}>
                        Use suggestion
                      </Button>
                    ) : null}
                  </div>
                </Field>
              </div>
            </>
          ) : null}

          {/* 3. MAKE IT YOURS */}
          {step === 2 ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={heading}>
                Make it <em>yours.</em>
              </h1>
              <p className="mt-3 text-lead text-ink-2">A photograph, a colour and lettering. You can change all of it later.</p>
              <div className="mt-6 lg:hidden">
                <p className="catalog mb-2">Preview</p>
                <CapsuleCover capsule={preview} size="md" className="mx-auto aspect-[4/5] max-w-[300px] rounded-[18px] shadow-lg" />
              </div>
              <div className="mt-8 space-y-8">
                <CoverPhotoField draft={draft} setDraft={setDraft} />
                <div>
                  <p className="mb-3 font-medium" id="palette-label">
                    Colour
                  </p>
                  <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby="palette-label">
                    {(Object.keys(paletteStyles) as Capsule["theme"]["palette"][]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={draft.palette === k}
                        onClick={() => setDraft({ palette: k })}
                        className={cn("flex min-h-11 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-[0.9375rem] font-medium", draft.palette === k ? "border-ink bg-surface shadow-[0_0_0_1px_var(--ink)]" : "border-line-strong")}
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
                    aria-label="Lettering"
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
                      aria-label="Photograph placement"
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
                ) : null}
                <div className="flex items-start gap-3 rounded-[16px] bg-ivory p-5">
                  <Lock className="mt-0.5 size-5 shrink-0 text-ink-3" aria-hidden />
                  <p className="text-[0.9375rem] text-ink-2">
                    <span className="font-medium text-ink">Private by default.</span> Nobody else sees this capsule until you invite them, and each memory can be kept to yourself.
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {/* 4. FIRST QUESTION */}
          {step === 3 && kind ? (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={heading}>
                Begin with <em>one question.</em>
              </h1>
              <p className="mt-3 text-lead text-ink-2">{firstQuestionNote[kind](callThem)}</p>
              {question ? (
                <div className="mt-8 rounded-[22px] border border-line bg-surface p-6 shadow-[0_18px_40px_-30px_rgb(37_36_33/0.45)] sm:p-8" aria-live="polite">
                  <p className="catalog">{question.category}</p>
                  <p className="mt-3 font-serif text-[clamp(1.6rem,1.3rem+1.2vw,2.2rem)] leading-[1.15]">{question.text}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={surprise} leading={<Shuffle className="size-4" />}>
                      Surprise me with a question
                    </Button>
                  </div>
                </div>
              ) : null}
              {suggestions.length ? (
                <div className="mt-8">
                  <p className="mb-3 text-[0.9375rem] font-medium text-ink-2">Or choose one of these</p>
                  <ul className="space-y-2.5">
                    {suggestions.map((q) => (
                      <li key={q.id}>
                        <button type="button" onClick={() => setDraft({ questionId: q.id })} className="flex min-h-11 w-full items-start gap-3 rounded-[16px] border border-line bg-surface/70 p-4 text-left hover:border-line-strong hover:bg-surface">
                          <PenLine className="mt-1 size-4 shrink-0 text-ink-4" aria-hidden />
                          <span className="font-serif text-[1.2rem] leading-snug">{q.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-6 text-[0.9375rem] text-ink-3">
                Not ready to answer?{" "}
                <button type="button" onClick={() => void create(false)} disabled={creating} className="min-h-11 font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  Create the capsule without answering
                </button>{" "}
                — this question will wait for you.
              </p>
              <DemoNotice className="mt-8">In this preview, your capsule, photographs and recordings stay in this browser on this device — they aren&rsquo;t uploaded or backed up.</DemoNotice>
            </>
          ) : null}
        </div>

        <div className="sticky bottom-[68px] -mx-4 mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/92 px-4 py-4 backdrop-blur md:bottom-0 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <Button variant="ghost" size="lg" onClick={() => go(-1)} disabled={step === 0} leading={<ArrowLeft className="size-4" />}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="lg" onClick={() => go(1)} trailing={<ArrowRight className="size-4" />}>
              Continue
            </Button>
          ) : (
            <Button size="lg" onClick={() => void create(true)} loading={creating} trailing={<Sparkles className="size-4" />}>
              Create &amp; answer this
            </Button>
          )}
        </div>
      </div>

      {/* Live preview */}
      <aside className={cn("hidden", step > 0 && "lg:block")} aria-label="Capsule preview">
        <div className="sticky top-24">
          <p className="catalog mb-3">Preview</p>
          <CapsuleCover capsule={preview} size="lg" className="aspect-[4/5] rounded-[22px] shadow-lg" />
          <dl className="mt-5 space-y-2 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Story of</dt>
              <dd>{config?.label ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Begins with</dt>
              <dd>{startsWith}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Visible to</dt>
              <dd>Only people you invite</dd>
            </div>
          </dl>
          <p className="mt-5 text-[0.875rem] text-ink-3">A preview only — nothing is created until the last step. Your draft is kept on this device as you go.</p>
        </div>
      </aside>
    </div>
  );
}

function PlanGate({ reason, limit }: { reason: string | null; limit: number }) {
  return (
    <div className="mx-auto max-w-[640px] py-10 text-center">
      <p className="eyebrow">Your capsules</p>
      <h1 className="mt-4 font-serif text-[clamp(2rem,1.6rem+1.6vw,2.9rem)] leading-[1.06]">There&rsquo;s no room for another capsule yet.</h1>
      <p className="mt-4 text-lead text-ink-2">{reason ?? `Your plan includes ${limit} capsules.`}</p>
      <p className="mt-3 text-[0.9375rem] text-ink-3">Sample capsules never count. Archiving a capsule you no longer need makes room, and you can always export it first.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/pricing">Compare plans</ButtonLink>
        <ButtonLink href="/app/capsules" variant="secondary">
          Manage capsules
        </ButtonLink>
      </div>
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
    const r = await services().media.put({ capsuleId: "cap_pending", blob: file, kind: "image", caption: "Cover photograph", alt: "Cover photograph", contributorName: "Owner" });
    setBusy(false);
    if (r.status === "ok") setDraft({ coverMediaId: r.data.id, layout: "full_bleed" });
    else setError(r.message);
  };
  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between text-[0.9375rem] font-medium">
        A cover photograph <span className="text-[0.875rem] font-normal text-ink-3">Optional</span>
      </p>
      <div className="flex flex-wrap items-center gap-4 rounded-[16px] border border-dashed border-line-strong bg-surface/60 p-4">
        {asset ? (
          <span className="relative block size-16 overflow-hidden rounded-[12px]">
            <MediaImage mediaId={asset.id} className="absolute inset-0" />
          </span>
        ) : (
          <span className="grid size-16 place-items-center rounded-[12px] bg-ivory text-ink-3">
            <ImagePlus className="size-6" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem]">{asset ? "Cover photograph added" : "A portrait, a wedding photo, a favourite snapshot"}</p>
          <p className="text-[0.875rem] text-ink-3">Stays on this device in the preview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" loading={busy} onClick={() => ref.current?.click()}>
            {asset ? "Replace" : "Choose photo"}
          </Button>
          {asset ? (
            <Button variant="ghost" size="sm" onClick={() => setDraft({ coverMediaId: undefined, layout: "type_only" })}>
              Remove
            </Button>
          ) : null}
        </div>
        <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Choose a cover photograph" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      {error ? (
        <p className="mt-2 text-[0.9375rem] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

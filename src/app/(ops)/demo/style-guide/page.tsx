"use client";

import * as React from "react";
import { ArrowRight, Check, Moon, Sun } from "lucide-react";
import type { StatusTone } from "@/components/ui/feedback";
import { Badge, DemoNotice, EmptyState, ProgressBar, Skeleton, Spinner, toast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Checkbox, ChoiceCards, Field, Input, Segmented, Select, Switch, Textarea } from "@/components/ui/field";
import { BookObject, KeepsakeBox, SealedLetter } from "@/components/marketing/objects";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Live token readers — values come from the stylesheet, never copies */
/* ------------------------------------------------------------------ */

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function parseRgb(css: string) {
  const m = css.match(/\d+(\.\d+)?/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** Writes the computed value straight into the DOM — no state, so it's always current. */
function readSwatch(el: HTMLElement | null, opts: { contrastAgainst?: string }) {
  if (!el) return;
  const sample = el.querySelector<HTMLElement>("[data-sample]");
  const out = el.querySelector<HTMLElement>("[data-out]");
  if (!sample || !out) return;
  const fg = parseRgb(getComputedStyle(sample).backgroundColor);
  let text = toHex(fg);
  if (opts.contrastAgainst) {
    const bgEl = el.closest<HTMLElement>("[data-preview]") ?? document.body;
    const bg = parseRgb(getComputedStyle(bgEl).backgroundColor);
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    text += ` · ${ratio.toFixed(1)}:1 ${ratio >= 4.5 ? "AA" : ratio >= 3 ? "large text only" : "decorative only"}`;
  }
  out.textContent = text;
}

function Swatch({ token, label, text }: { token: string; label: string; text?: boolean }) {
  return (
    <li ref={(el) => readSwatch(el, { contrastAgainst: text ? "paper" : undefined })} className="flex items-center gap-3">
      <span data-sample className="size-11 shrink-0 rounded-[10px] ring-1 ring-inset ring-black/10" style={{ backgroundColor: `var(--${token})` }} />
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        <span className="block font-mono text-[0.75rem] text-ink-3">
          --{token} · <span data-out />
        </span>
      </span>
    </li>
  );
}

const surfaces = [
  ["paper", "Paper — page"],
  ["surface", "Surface — cards"],
  ["ivory", "Ivory — quiet fills"],
  ["linen", "Linen — mounts"],
  ["line", "Line"],
  ["line-strong", "Line strong"],
] as const;
const inks = [
  ["ink", "Ink"],
  ["ink-2", "Ink 2 — body"],
  ["ink-3", "Ink 3 — secondary"],
  ["ink-4", "Ink 4 — metadata"],
  ["evergreen", "Evergreen — action"],
  ["brass-ink", "Brass ink — eyebrows"],
] as const;
const chapters = [
  ["terracotta", "Terracotta"],
  ["slate", "Slate"],
  ["smoke", "Smoke"],
  ["moss", "Moss"],
  ["brass", "Brass"],
] as const;
const tones: StatusTone[] = ["neutral", "brand", "demo", "success", "warning", "danger", "info"];

function Section({ id, title, children, note }: { id: string; title: string; children: React.ReactNode; note?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line py-12">
      <h2 id={`${id}-h`} className="font-sans text-[1.6rem] font-medium tracking-[-0.03em]">
        {title}
      </h2>
      {note ? <p className="mt-2 max-w-2xl text-ink-2">{note}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function StyleGuidePage() {
  const [evening, setEvening] = React.useState(false);
  const [choice, setChoice] = React.useState<"one" | "two">("one");
  const [seg, setSeg] = React.useState<"a" | "b" | "c">("a");
  const [checked, setChecked] = React.useState(true);
  const [on, setOn] = React.useState(true);
  const [lid, setLid] = React.useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Design system</p>
          <h1 className="mt-3 font-sans text-[clamp(2.2rem,1.7rem+1.8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.05em]">
            The pieces, <em className="font-serif font-normal tracking-[-0.03em]">side by side.</em>
          </h1>
          <p className="mt-4 text-[1.0625rem] text-ink-2">A living reference. Colours are read from the stylesheet as you look, and every text colour shows its measured contrast against this page.</p>
        </div>
        <Segmented
          label="Preview theme"
          value={evening ? "evening" : "light"}
          onChange={(v) => setEvening(v === "evening")}
          options={[
            { value: "light", label: "Daylight", icon: <Sun className="size-4" /> },
            { value: "evening", label: "Evening", icon: <Moon className="size-4" /> },
          ]}
        />
      </div>
      <nav aria-label="Sections" className="mb-2 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem]">
        {["colour", "type", "buttons", "forms", "status", "honesty", "objects"].map((s) => (
          <a key={s} href={`#${s}`} className="capitalize text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            {s}
          </a>
        ))}
      </nav>

      {/* Re-key on theme change so swatches re-read their values. */}
      <div key={evening ? "evening" : "light"} data-preview className={cn("-mx-5 rounded-[20px] px-5 sm:-mx-8 sm:px-8", evening ? "theme-evening bg-paper text-ink" : "bg-paper")}>
        <Section id="colour" title="Colour" note="Tokens are CSS variables on :root and flip together in the evening theme. Status colours are only for status; chapter colours only for chapters.">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Surfaces</p>
              <ul className="space-y-3">
                {surfaces.map(([t, l]) => (
                  <Swatch key={t} token={t} label={l} />
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Text & action</p>
              <ul className="space-y-3">
                {inks.map(([t, l]) => (
                  <Swatch key={t} token={t} label={l} text />
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Chapters</p>
              <ul className="space-y-3">
                {chapters.map(([t, l]) => (
                  <Swatch key={t} token={t} label={l} text />
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="type" title="Typography" note="Geist carries the interface; Newsreader carries the stories. A Geist headline with a Newsreader italic accent is the signature.">
          <div className="space-y-8">
            <p className="font-sans text-[clamp(2.6rem,2rem+3vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.06em]">
              A whole life. <em className="font-serif font-normal tracking-[-0.04em]">In their words.</em>
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="eyebrow">Eyebrow · Geist 600, tracked</p>
                <p className="mt-3 font-sans text-[1.6rem] font-medium tracking-[-0.03em]">Section title · Geist 500</p>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">Body · Geist 400, 17px, generous line height for older eyes. Long reading uses Newsreader.</p>
                <p className="mt-3 font-mono text-[0.8125rem] text-ink-3">Metadata · Geist Mono · OLC-DEMO-1002</p>
              </div>
              <div>
                <p className="font-serif text-[1.9rem] leading-tight">The kitchen always smelled of bread</p>
                <p className="mt-3 font-serif text-[1.15rem] leading-[1.65] text-ink-2">My mother never used a recipe. She knew the dough by the way it felt under her palms — too wet, too tired, just right.</p>
                <p className="mt-3 font-serif text-[1rem] italic text-ink-3">— told by Margaret Ellis</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" note="One primary action per view. Destructive actions always confirm.">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="text">Text link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="brass">Brass</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {(["sm", "md", "lg", "xl"] as const).map((s) => (
              <Button key={s} size={s} trailing={<ArrowRight className="size-4" />}>
                Size {s}
              </Button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[16px] bg-[#2e312a] p-5">
            <Button variant="light">On dark · light</Button>
            <Button variant="outlineLight">On dark · outline</Button>
          </div>
        </Section>

        <Section id="forms" title="Form controls" note="Every field has a visible label; hints and errors are linked for screen readers.">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <Field label="Their name" htmlFor="sg-name" hint="As the family says it.">
                <Input id="sg-name" placeholder="Margaret" />
              </Field>
              <Field label="A memory" htmlFor="sg-mem" error="Tell us a little more.">
                <Textarea id="sg-mem" rows={3} invalid />
              </Field>
              <Field label="Chapter" htmlFor="sg-ch" optional>
                <Select id="sg-ch">
                  <option>Childhood</option>
                  <option>Love</option>
                </Select>
              </Field>
            </div>
            <div className="space-y-6">
              <Checkbox id="sg-cb" checked={checked} onCheckedChange={setChecked} label="Include in the printed book" description="Only approved stories can be printed." />
              <Switch id="sg-sw" checked={on} onCheckedChange={setOn} label="Weekly note of new memories" description="Saved, but not sent in the preview." />
              <Segmented label="Segmented" value={seg} onChange={setSeg} options={[{ value: "a", label: "Speak" }, { value: "b", label: "Type" }, { value: "c", label: "Photo" }]} />
              <ChoiceCards
                name="sg-choice"
                value={choice}
                onChange={setChoice}
                options={[
                  { value: "one", label: "Linen", description: "Textured weave" },
                  { value: "two", label: "Cloth", description: "Smooth, classic" },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section id="status" title="Status & feedback" note="Status always pairs colour with a word; never colour alone.">
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <Badge key={t} tone={t} dot>
                {t}
              </Badge>
            ))}
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <ProgressBar value={64} label="Example progress" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Spinner />
            </div>
            <EmptyState title="No letters yet" body="A few lines for a day that hasn't come yet." />
            <div className="flex flex-wrap content-start gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.success("Saved on this device")} leading={<Check className="size-4" />}>
                Success toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.info("Not connected yet", "Arrives with Part Two.")}>
                Info toast
              </Button>
            </div>
          </div>
        </Section>

        <Section id="honesty" title="Honesty patterns" note="Every simulated outcome says what didn't happen. These aren't disclaimers — they're part of the design.">
          <div className="grid gap-4 md:grid-cols-2">
            <DemoNotice title="Preview only — no payment was charged">Checkout creates an uncharged demo order.</DemoNotice>
            <DemoNotice title="Invitation preview — no email sent">Copy the link and share it yourself.</DemoNotice>
            <DemoNotice title="Future message draft — not scheduled for delivery">Long-term delivery isn&rsquo;t available yet.</DemoNotice>
            <DemoNotice title="Stored on this device — not backed up">Download a copy of anything you can&rsquo;t replace.</DemoNotice>
          </div>
          <p className="mt-6 flex items-center gap-3 text-[0.9375rem]">
            <span className="inline-flex items-center gap-1.5 text-ink-3">
              <span className="size-2 rounded-full bg-ink-4" aria-hidden /> Not connected
            </span>
            <span className="text-ink-3">— unconfigured services are neutral grey, never a green tick.</span>
          </p>
        </Section>

        <Section id="objects" title="Objects" note="Physical heirlooms are drawn in CSS, not images, so they follow every choice a family makes.">
          <div className="grid items-end gap-10 md:grid-cols-3">
            <div className="grid place-items-center">
              <BookObject color="evergreen" material="linen" foil="brass" />
            </div>
            <div>
              <KeepsakeBox finish="white_oak" engraving="Margaret Ellis · 1940 —" open={lid} />
              <div className="mt-3 text-center">
                <Button size="sm" variant="ghost" onClick={() => setLid((v) => !v)}>
                  {lid ? "Close the lid" : "Open the lid"}
                </Button>
              </div>
            </div>
            <div className="grid place-items-center">
              <SealedLetter to="Leo Ellis" openOn="18th birthday" />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

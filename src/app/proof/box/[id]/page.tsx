"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, BookOpen, Check, HardDrive, Image as ImageIcon, Mail, Printer, ScrollText } from "lucide-react";
import { KeepsakeBox, boxFinishes } from "@/components/marketing/objects";
import { Logo } from "@/components/brand/logo";
import { MediaImage, PrintQuality } from "@/components/media/media-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { formatDate, pluralize } from "@/lib/utils";

const ENGRAVING_MAX = 48;
const engravingLabel = { none: "No engraving", name: "Name", name_and_years: "Name and years", custom: "Custom text" } as const;

type Check = { ok: boolean; text: string };

/**
 * A two-sheet proof for a keepsake box: the lid as it will be engraved, then everything
 * that goes inside, with pre-flight checks. Printed on Letter; nothing is made.
 */
export default function BoxProofPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const heirloom = useDb((d) => d.heirlooms.find((h) => h.id === id));
  const capsule = useDb((d) => d.capsules.find((c) => c.id === heirloom?.capsuleId));
  const book = useDb((d) => d.heirlooms.find((h) => h.kind === "book" && h.capsuleId === heirloom?.capsuleId));
  const letters = useDb((d) => d.futureMessages);
  const media = useDb((d) => d.media);
  const box = heirloom?.box;

  if (!hydrated) return <Skeleton className="mx-auto mt-24 h-[60vh] max-w-3xl" />;
  if (!box || !heirloom || !capsule) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-[2.4rem]">This proof isn&rsquo;t on this device.</h1>
          <p className="mt-3 text-ink-2">Proofs are generated from designs saved in this browser.</p>
          <ButtonLink href="/app/heirlooms" variant="secondary" className="mt-6">
            Go to heirlooms
          </ButtonLink>
        </div>
      </div>
    );
  }

  const engraving = box.engraving === "none" ? "" : box.engravingText.trim();
  const chosenLetters = box.contents.letterBundle ? letters.filter((l) => box.selectedLetterIds.includes(l.id)) : [];
  const printable = media.filter((m) => m.capsuleId === capsule.id && m.kind !== "audio" && m.consent.print !== false);
  const chosenPhotos = (box.selectedPhotoIds.length ? printable.filter((p) => box.selectedPhotoIds.includes(p.id)) : printable).slice(0, box.contents.photoPrints);
  const finish = boxFinishes[box.finish];

  const checks: Check[] = [
    box.engraving === "none"
      ? { ok: true, text: "Lid left plain — no engraving." }
      : !engraving
        ? { ok: false, text: "Engraving is switched on but the text is empty." }
        : engraving.length > ENGRAVING_MAX
          ? { ok: false, text: `Engraving is ${engraving.length} characters; the lid fits ${ENGRAVING_MAX}.` }
          : { ok: true, text: `Engraving fits the lid (${engraving.length}/${ENGRAVING_MAX} characters). Check the spelling letter by letter.` },
    !box.contents.book ? { ok: true, text: "No book in this box." } : book ? { ok: true, text: `Book: “${book.book?.title ?? book.name}” — approve its own proof too.` } : { ok: false, text: "The box includes a book, but no book is designed for this capsule yet." },
    !box.contents.letterBundle
      ? { ok: true, text: "No letter bundle." }
      : !chosenLetters.length
        ? { ok: false, text: "The letter bundle is on, but no letters are chosen." }
        : chosenLetters.some((l) => l.status === "draft")
          ? { ok: false, text: `${pluralize(chosenLetters.filter((l) => l.status === "draft").length, "letter is", "letters are")} still a draft and would print as written today.` }
          : { ok: true, text: `${pluralize(chosenLetters.length, "letter")} ready to print.` },
    !box.contents.photoPrints
      ? { ok: true, text: "No photograph prints." }
      : chosenPhotos.length < box.contents.photoPrints
        ? { ok: false, text: `${box.contents.photoPrints} prints chosen, but only ${chosenPhotos.length} photographs allow printing — ${chosenPhotos.length} will print.` }
        : { ok: true, text: `${chosenPhotos.length} photographs, all with print permission.` },
  ];
  const warnings = checks.filter((c) => !c.ok).length;

  return (
    <>
      <style>{`@media print { @page { size: 8.5in 11in; margin: 0; } html, body { background: #fff !important; } .proof-sheet { width: 8.5in !important; min-height: 11in !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; break-after: page; } }`}</style>
      <header className="no-print sticky top-0 z-10 border-b border-black/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <Logo />
          <p className="hidden text-[0.875rem] text-ink-3 md:block">Demo proof · keepsake box · 2 sheets</p>
          <Button size="sm" onClick={() => window.print()} leading={<Printer className="size-4" />}>
            Print or save as PDF
          </Button>
        </div>
      </header>
      <div className="no-print mx-auto max-w-3xl px-5 pt-8 text-center text-[0.9375rem] text-ink-2">
        A demonstration proof made in your browser. Nothing is engraved, printed or shipped, and every sheet is marked &ldquo;Demo proof&rdquo;.
      </div>
      <PrintQuality>
        <main id="main" className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 py-10 text-[#202d27] print:block print:p-0">
          {/* Sheet 1 — the lid */}
          <Sheet title="The lid" heirloomName={heirloom.name} sheet={1}>
            <div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-center">
              <KeepsakeBox finish={box.finish} engraving={engraving} className="max-w-[340px]" />
              <dl className="space-y-4 text-[0.9375rem]">
                <Spec label="Finish">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: finish.top }} aria-hidden />
                    {finish.label}
                  </span>
                </Spec>
                <Spec label="Engraving">{engravingLabel[box.engraving]}</Spec>
                <Spec label="Use">{box.intendedUse === "display" ? "Display — for a shelf or mantel" : "Burial capsule (concept only — not available)"}</Spec>
                <Spec label="For">{capsule.subjectName}</Spec>
              </dl>
            </div>
            <figure className="mt-10">
              <figcaption className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#5b6b55]">Engraving at actual proportions</figcaption>
              <div className="mt-3 grid aspect-[3/1] place-items-center rounded-[6px] p-6" style={{ background: finish.top }}>
                {engraving ? (
                  <p className="text-center font-serif text-[clamp(1.1rem,0.8rem+1.6vw,1.9rem)] tracking-[0.04em]" style={{ color: box.finish === "white_oak" || box.finish === "linen_wrapped" ? "#3d2c1c" : "#e9dcc6" }}>
                    {engraving}
                  </p>
                ) : (
                  <p className="text-[0.875rem] italic" style={{ color: box.finish === "white_oak" || box.finish === "linen_wrapped" ? "#5a4a3a" : "#cdbfa8" }}>
                    Plain lid
                  </p>
                )}
              </div>
            </figure>
            <section className="mt-10 rounded-[10px] border border-[#d8dccd] p-5" aria-labelledby="checks">
              <h2 id="checks" className="flex items-center gap-2 text-[0.9375rem] font-semibold">
                {warnings ? <AlertTriangle className="size-4 text-[#8a5a12]" /> : <Check className="size-4 text-[#2f6b45]" />}
                {warnings ? `Before you approve: ${pluralize(warnings, "thing")} to check` : "Pre-flight checks passed"}
              </h2>
              <ul className="mt-3 space-y-2 text-[0.9375rem]">
                {checks.map((c) => (
                  <li key={c.text} className="flex gap-2.5">
                    {c.ok ? <Check className="mt-0.5 size-4 shrink-0 text-[#2f6b45]" aria-label="OK" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#8a5a12]" aria-label="Check" />}
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Sheet>

          {/* Sheet 2 — inside the box */}
          <Sheet title="Inside the box" heirloomName={heirloom.name} sheet={2}>
            <ol className="divide-y divide-[#e2e4d8]">
              <Item icon={<BookOpen className="size-5" />} title="Printed book" on={box.contents.book}>
                {book ? (
                  <>
                    &ldquo;{book.book?.title ?? book.name}&rdquo;
                    {book.book ? ` · ${book.book.storyIds.length} stories` : ""} ·{" "}
                    <Link href={`/proof/book/${book.id}`} className="underline underline-offset-2 print:no-underline">
                      its own proof
                    </Link>
                  </>
                ) : (
                  "No book designed yet."
                )}
              </Item>
              <Item icon={<Mail className="size-5" />} title="A bundle of letters" on={box.contents.letterBundle}>
                {chosenLetters.length ? (
                  <ul className="mt-1 space-y-1">
                    {chosenLetters.map((l) => (
                      <li key={l.id}>
                        &ldquo;{l.title}&rdquo; — for {l.recipient.name}
                        <span className="text-[#5f6a58]"> · {l.status === "draft" ? "draft" : l.sealedAt ? `sealed ${formatDate(l.sealedAt)}` : l.status.replace("_", " ")}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No letters chosen."
                )}
                <p className="mt-1 text-[0.8125rem] text-[#5f6a58]">Printed on cotton paper and tied with linen. Delivery dates aren&rsquo;t scheduled by printing them.</p>
              </Item>
              <Item icon={<ImageIcon className="size-5" />} title={`Photograph prints · 5 × 7 in`} on={box.contents.photoPrints > 0}>
                {chosenPhotos.length ? (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {chosenPhotos.map((p) => (
                      <figure key={p.id} className="bg-white p-1 shadow-[0_1px_3px_rgb(0_0_0/0.2)]">
                        <MediaImage asset={p} className="aspect-[5/7]" />
                        <figcaption className="mt-1 truncate text-[0.625rem] text-[#5f6a58]">{p.caption || p.alt}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  "None."
                )}
              </Item>
              <Item icon={<HardDrive className="size-5" />} title="Archive copy on a drive" on={box.contents.archiveDrive}>
                A convenience copy of the archive as it is on the day it&rsquo;s made. Never the only copy.
              </Item>
              <Item icon={<ScrollText className="size-5" />} title="Preservation guide" on>
                How to store paper, photographs and media. Always included.
              </Item>
            </ol>
          </Sheet>
        </main>
      </PrintQuality>
    </>
  );
}

function Sheet({ title, heirloomName, sheet, children }: { title: string; heirloomName: string; sheet: number; children: React.ReactNode }) {
  return (
    <article className="proof-sheet relative w-full bg-[#fbfaf4] px-8 py-10 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.45)] sm:px-12 sm:py-12">
      <header className="mb-8 flex items-baseline justify-between gap-4 border-b border-[#d8dccd] pb-4">
        <h1 className="font-serif text-[1.9rem] leading-none">{title}</h1>
        <p className="text-right font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[#5f6a58]">
          {heirloomName} · sheet {sheet} of 2
        </p>
      </header>
      {children}
      <p className="mt-10 text-center font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[#8a5a12]">Demo proof — nothing is made, shipped or charged</p>
    </article>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#5b6b55]">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function Item({ icon, title, on, children }: { icon: React.ReactNode; title: string; on: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 py-5 first:pt-0">
      <span className={on ? "text-[#294f3e]" : "text-[#8b8b80]"} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-[0.9375rem]">
        <p className="flex flex-wrap items-baseline justify-between gap-2 font-medium">
          {title}
          <span className={on ? "text-[0.8125rem] font-normal text-[#2f6b45]" : "text-[0.8125rem] font-normal text-[#5f6a58]"}>{on ? "Included" : "Not included"}</span>
        </p>
        {on ? <div className="mt-1 text-[#3b4740]">{children}</div> : null}
      </div>
    </li>
  );
}

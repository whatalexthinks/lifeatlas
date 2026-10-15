"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import { AlertTriangle, BookOpen, Box, FileText, FlaskConical, HardDrive, Image as ImageIcon, Mail, ScrollText, ShoppingBag } from "lucide-react";
import type { BoxConfiguration } from "@/domain/models";
import { boxBreakdown, boxContentExtras, boxEngravingExtras, boxFinishExtras, quoteBox } from "@/domain/commerce/pricing";
import { boxBlockers, fulfillmentFor } from "@/domain/commerce/fulfillment";
import { isPrintEligible } from "@/domain/policies/permissions";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { KeepsakeBox, boxFinishes } from "@/components/marketing/objects";
import { MediaImage } from "@/components/media/media-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { ChoiceCards, Field, Input, Segmented, Select, Switch } from "@/components/ui/field";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, formatMoney, pluralize } from "@/lib/utils";

export default function CapsuleBuilderPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <HydratedOnly>
        <CapsuleBuilder />
      </HydratedOnly>
    </React.Suspense>
  );
}

function HydratedOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  return hydrated ? children : <Skeleton className="h-[70vh] w-full" />;
}

function CapsuleBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const capsules = useDb((d) => d.capsules);
  const media = useDb((d) => d.media);
  const letters = useDb((d) => d.futureMessages);
  const catalog = useDb((d) => d.catalog);
  const heirlooms = useDb((d) => d.heirlooms);
  const memories = useDb((d) => d.memories);

  const editingId = params.get("id") ?? undefined;
  const [capsuleId, setCapsuleId] = React.useState(() => heirlooms.find((h) => h.id === editingId)?.capsuleId ?? params.get("capsule") ?? (capsules.some((c) => c.id === "cap_margaret") ? "cap_margaret" : capsules[0]?.id ?? ""));
  const capsule = capsules.find((c) => c.id === capsuleId) ?? capsules[0];
  const [savedId, setSavedId] = React.useState<string | undefined>(() => heirlooms.find((h) => h.id === editingId && h.kind === "keepsake_box")?.id);
  const [busy, setBusy] = React.useState<null | "save" | "order">(null);
  const [lidOpen, setLidOpen] = React.useState(false);
  const existing = heirlooms.find((h) => h.id === editingId && h.kind === "keepsake_box");
  const [box, setBox] = React.useState<BoxConfiguration>(() =>
    existing?.box
      ? structuredClone(existing.box)
      : {
          finish: "walnut",
          engraving: "name_and_years",
          engravingText: capsule ? `${capsule.subjectName}${capsule.birthYear ? ` · ${capsule.birthYear}, ` : ""}` : "",
          contents: { book: true, letterBundle: true, photoPrints: 12, archiveDrive: true, preservationGuide: true },
          selectedLetterIds: letters.filter((l) => !l.isExample).map((l) => l.id),
          selectedPhotoIds: [],
          intendedUse: "display",
        },
  );

  const photos = React.useMemo(() => media.filter((m) => m.capsuleId === capsule?.id && m.kind !== "audio" && m.consent.print !== false), [media, capsule?.id]);

  if (!capsule) {
    return (
      <div className="mx-auto max-w-[1320px] space-y-6">
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  const update = (patch: Partial<BoxConfiguration>) => setBox({ ...box, ...patch });
  const contents = (patch: Partial<BoxConfiguration["contents"]>) => setBox({ ...box, contents: { ...box.contents, ...patch } });
  const boxProduct = catalog.find((p) => p.id === "keepsake_box")!;
  const bookProduct = catalog.find((p) => p.id === "book")!;
  const quote = quoteBox(boxProduct.price.amount, box, bookProduct.price.amount);
  const engravingPreview = box.engraving === "none" ? "" : box.engravingText || capsule.subjectName;
  const chosenPhotos = (box.selectedPhotoIds.length ? photos.filter((p) => box.selectedPhotoIds.includes(p.id)) : photos).slice(0, box.contents.photoPrints);
  const userLetters = letters.filter((l) => !l.isExample);

  const save = async () => {
    const r = await services().heirlooms.save({ id: savedId, kind: "keepsake_box", capsuleId: capsule.id, name: `${capsule.subjectName} keepsake box`, box: { ...box, selectedPhotoIds: chosenPhotos.map((p) => p.id) } });
    if (r.status !== "ok") {
      toast.error("Couldn't save", r.status === "error" ? r.message : undefined);
      return null;
    }
    setSavedId(r.data.id);
    if (!editingId) router.replace(`/app/heirlooms/capsule-builder?id=${r.data.id}`, { scroll: false });
    return r.data.id;
  };

  const onOrder = async () => {
    setBusy("order");
    const id = await save();
    if (!id) return setBusy(null);
    const line = services().heirlooms.toCartLine(id);
    if (line.status !== "ok") {
      setBusy(null);
      return toast.error("Couldn't price this box", line.status === "error" ? line.message : undefined);
    }
    const c = await services().billing.addToCart(line.data);
    setBusy(null);
    if (c.status === "ok") router.push("/checkout/bag");
    else toast.error("Couldn't add it to your bag", c.status === "error" ? c.message : undefined);
  };
  const blockers = boxBlockers(box, {
    printableStories: memories.filter((m) => m.capsuleId === capsule?.id && isPrintEligible(m)).length,
    printablePhotos: photos.length,
    letters: box.selectedLetterIds.length || 0,
  });
  const madeToOrder = fulfillmentFor(boxProduct, box) === "made_to_order";

  const inside: { icon: React.ReactNode; label: string; detail: string; on: boolean }[] = [
    { icon: <BookOpen className="size-5" />, label: "The printed book", detail: "Your latest book design, bound to fit the box", on: box.contents.book },
    { icon: <Mail className="size-5" />, label: "A bundle of letters", detail: `${pluralize(box.selectedLetterIds.length, "letter")} printed on cotton paper, tied with linen`, on: box.contents.letterBundle },
    { icon: <ImageIcon className="size-5" />, label: "Photograph prints", detail: box.contents.photoPrints ? `${box.contents.photoPrints} prints, 5 × 7 in` : "None", on: box.contents.photoPrints > 0 },
    { icon: <HardDrive className="size-5" />, label: "Archive copy on a drive", detail: "A convenience copy, keep your own backups too", on: box.contents.archiveDrive },
    { icon: <ScrollText className="size-5" />, label: "Preservation guide", detail: "How to store paper, photos and media, always included", on: box.contents.preservationGuide },
  ];

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        back={{ href: "/app/heirlooms", label: "Heirlooms" }}
        eyebrow="Physical LifeCapsule · Preview"
        title={
          <>
            A place to keep <em>what matters.</em>
          </>
        }
        description="A finished box for the shelf or the mantel, the book, letters, photographs and an archive copy, together. Designed for display, not burial."
        actions={
          <div className="flex flex-wrap gap-2">
            {savedId ? (
              <ButtonLink variant="ghost" href={`/proof/box/${savedId}`} target="_blank" leading={<FileText className="size-4" />}>
                Proof
              </ButtonLink>
            ) : null}
            <Button
              variant="secondary"
              loading={busy === "save"}
              disabled={!!busy}
              onClick={async () => {
                setBusy("save");
                const id = await save();
                setBusy(null);
                if (id) toast.success("Box design saved on this device", "Open the proof to check the engraving and contents.");
              }}
            >
              Save design
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <div className="relative overflow-hidden rounded-[14px] bg-[radial-gradient(90%_70%_at_50%_25%,#f4efe4,#ddd3bf)] px-6 pb-8 pt-12">
            <KeepsakeBox finish={box.finish} engraving={engravingPreview} open={lidOpen} className="max-w-[520px]" />
            <div className="mt-2 flex items-center justify-center gap-3">
              <Segmented
                label="Lid"
                size="sm"
                value={lidOpen ? "open" : "closed"}
                onChange={(v) => setLidOpen(v === "open")}
                options={[
                  { value: "closed", label: "Closed" },
                  { value: "open", label: "Open the lid" },
                ]}
              />
            </div>
          </div>
          <section className="card-paper mt-6 p-5 sm:p-6" aria-label="What's inside">
            <p className="eyebrow">What&rsquo;s inside</p>
            <ul className="mt-4 space-y-3">
              {inside.map((it) => (
                <li key={it.label} className={cn("flex items-start gap-4 rounded-[12px] px-3 py-2.5 transition", it.on ? "bg-ivory/70" : "opacity-45")}>
                  <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", it.on ? "bg-evergreen/10 text-evergreen" : "bg-ink/5 text-ink-3")}>{it.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-medium">{it.label}</span>
                    <span className="block text-[0.875rem] text-ink-3">{it.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            {box.contents.photoPrints && chosenPhotos.length ? (
              <div className="mt-4 flex -space-x-6 overflow-hidden px-3 pb-2">
                {chosenPhotos.slice(0, 7).map((p, i) => (
                  <div key={p.id} className="w-20 shrink-0 bg-white p-1.5 shadow-md" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (2 + i)}deg)` }}>
                    <MediaImage asset={p} className="aspect-[5/7]" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="What kind of keepsake?">
            <ChoiceCards
              name="use"
              value={box.intendedUse}
              onChange={(v) => update({ intendedUse: v })}
              columns={1}
              options={[
                { value: "display", label: "Display keepsake box", description: "For a shelf, a mantel or a cedar chest. Kept indoors.", icon: <Box className="size-5" /> },
                { value: "burial_concept", label: "Legacy Capsule, concept", description: "Burial or long storage. Not available, in research.", icon: <FlaskConical className="size-5" />, disabled: true },
              ]}
            />
            <p className="mt-4 flex gap-2.5 rounded-[12px] bg-warning-soft px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                We won&rsquo;t offer a burial-rated capsule until materials have been independently tested and certified. Ordinary USB drives and paper aren&rsquo;t designed to survive decades underground.{" "}
                <Link href="/heirlooms/time-capsule" className="text-link">
                  Why we&rsquo;re waiting
                </Link>
              </span>
            </p>
          </Panel>

          <Panel title="Capsule">
            <Field label="Whose keepsake is this?" htmlFor="x-capsule">
              <Select id="x-capsule" value={capsule.id} onChange={(e) => setCapsuleId(e.target.value)}>
                {capsules.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectName}
                  </option>
                ))}
              </Select>
            </Field>
          </Panel>

          <Panel title="Finish">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Box finish">
              {(Object.keys(boxFinishes) as (keyof typeof boxFinishes)[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={box.finish === f}
                  onClick={() => update({ finish: f })}
                  className={cn("rounded-[14px] border p-3 text-left transition", box.finish === f ? "border-ink bg-surface shadow-sm ring-1 ring-ink" : "border-line hover:border-ink/30")}
                >
                  <span className="block h-14 rounded-[8px]" style={{ backgroundColor: boxFinishes[f].top, backgroundImage: `repeating-linear-gradient(92deg, ${boxFinishes[f].grain} 0 2px, transparent 2px 9px)` }} />
                  <span className="mt-2.5 block text-[0.9375rem] font-medium">{boxFinishes[f].label}</span>
                  <span className="block text-[0.8125rem] text-ink-3">{boxFinishExtras[f] ? `+${formatMoney(boxFinishExtras[f])}` : "Included"}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Engraving" description="Laser-engraved on the lid. 48 characters at most.">
            <Segmented
              label="Engraving"
              value={box.engraving}
              onChange={(v) => update({ engraving: v, engravingText: v === "name" ? capsule.subjectName : v === "name_and_years" ? `${capsule.subjectName}${capsule.birthYear ? ` · ${capsule.birthYear}, ` : ""}` : box.engravingText })}
              options={[
                { value: "none", label: "None" },
                { value: "name", label: "Name" },
                { value: "name_and_years", label: "Name & years" },
                { value: "custom", label: "Your words" },
              ]}
              className="max-w-full overflow-x-auto"
            />
            {box.engraving !== "none" ? (
              <Field label="Text" htmlFor="x-eng" className="mt-5" hint={`${box.engravingText.length}/48 · +${formatMoney(boxEngravingExtras[box.engraving])}`}>
                <Input id="x-eng" value={box.engravingText} maxLength={48} onChange={(e) => update({ engravingText: e.target.value, engraving: box.engraving === "custom" ? "custom" : box.engraving })} />
              </Field>
            ) : null}
          </Panel>

          <Panel title="Contents">
            <div className="space-y-5">
              <Switch id="x-book" checked={box.contents.book} onCheckedChange={(v) => contents({ book: v })} label={`Include the printed book · +${formatMoney(bookProduct.price.amount)}`} description="Uses your most recent book design." />
              <Switch id="x-letters" checked={box.contents.letterBundle} onCheckedChange={(v) => contents({ letterBundle: v })} label={`Include a bundle of printed letters · +${formatMoney(boxContentExtras.letterBundle)}`} description={userLetters.length ? `${pluralize(userLetters.length, "letter")} from Letters Through Time` : "Write letters in Letters Through Time to include them."} />
              {box.contents.letterBundle && userLetters.length ? (
                <ul className="ml-14 space-y-2">
                  {userLetters.map((l) => (
                    <li key={l.id}>
                      <label className="flex items-center gap-3 text-[0.9375rem]">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--color-evergreen)]"
                          checked={box.selectedLetterIds.includes(l.id)}
                          onChange={(e) => update({ selectedLetterIds: e.target.checked ? [...box.selectedLetterIds, l.id] : box.selectedLetterIds.filter((x) => x !== l.id) })}
                        />
                        {l.title} <span className="text-ink-3">· for {l.recipient.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div>
                <p className="text-[0.9375rem] font-medium">Photograph prints</p>
                <Segmented
                  label="Photograph prints"
                  className="mt-3"
                  value={String(box.contents.photoPrints) as "0" | "12" | "24"}
                  onChange={(v) => contents({ photoPrints: Number(v) })}
                  options={[
                    { value: "0", label: "None" },
                    { value: "12", label: `12 · +${formatMoney(12 * boxContentExtras.photoPrint)}` },
                    { value: "24", label: `24 · +${formatMoney(24 * boxContentExtras.photoPrint)}` },
                  ]}
                />
              </div>
              <Switch id="x-drive" checked={box.contents.archiveDrive} onCheckedChange={(v) => contents({ archiveDrive: v })} label={`Archive copy on a drive · +${formatMoney(boxContentExtras.archiveDrive)}`} description="A convenience copy of the open archive. Never the only copy, keep your own backups." />
              <Switch id="x-guide" checked disabled onCheckedChange={() => undefined} label="Preservation guide" description="Always included." />
            </div>
          </Panel>

          <section className="card-paper p-5 sm:p-6" aria-label="Price summary">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Estimate · test prices</p>
                <p className="mt-2 font-serif text-[2.4rem] leading-none">{formatMoney(quote.total)}</p>
              </div>
              <Badge tone="demo">Preview only</Badge>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[0.9375rem]">
              <Row label="Keepsake box" value={formatMoney(boxProduct.price.amount)} />
              {boxBreakdown(box, bookProduct.price.amount).map((r) => (
                <Row key={r.key} label={breakdownLabel(r.key, box)} value={`+${formatMoney(r.amount)}`} />
              ))}
              <Row label="Shipping" value="Calculated at fulfillment" muted />
              <Row label="Tax" value="Calculated at fulfillment" muted />
            </dl>
            <p className="mt-5 rounded-[12px] bg-ivory px-4 py-3 text-[0.875rem] text-ink-2">
              {madeToOrder ? (
                <>
                  <strong className="font-medium">Made to order.</strong> Because it holds your own words, photos or engraving, it&rsquo;s made only after you approve a proof.
                </>
              ) : (
                <>
                  <strong className="font-medium">Ready-made kit.</strong> Nothing personal inside, so it would ship after payment once fulfillment is connected.
                </>
              )}
            </p>
            {blockers.length ? (
              <ul className="mt-4 space-y-1.5 text-[0.875rem] text-warning" aria-label="Before this box can be ordered">
                {blockers.map((b) => (
                  <li key={b} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {b}
                  </li>
                ))}
              </ul>
            ) : null}
            <Button size="lg" block className="mt-5" leading={<ShoppingBag className="size-4" />} onClick={() => void onOrder()} loading={busy === "order"} disabled={!!busy || blockers.length > 0}>
              Add to bag
            </Button>
            <p className="mt-3 text-center text-[0.8125rem] text-ink-3">Preview only, no payment is charged and nothing is made.</p>
          </section>
          <DemoNotice title="Nothing ships from this preview">You can design it and walk through a demo order. Real orders open once a workshop partner is chosen and samples are approved.</DemoNotice>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className={cn("tabular-nums", muted && "text-ink-3")}>{value}</dd>
    </div>
  );
}

function breakdownLabel(key: string, box: BoxConfiguration) {
  if (key === "finish") return `${boxFinishes[box.finish].label} finish`;
  if (key === "engraving") return "Lid engraving";
  if (key === "book") return "Printed book";
  if (key === "letters") return "Printed letters";
  if (key === "prints") return `${box.contents.photoPrints} photograph prints`;
  return "Archive drive";
}

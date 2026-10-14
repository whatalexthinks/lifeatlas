"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, BookOpen, Check, FileText, Image as ImageIcon, Info, Minus, Plus, ShoppingBag } from "lucide-react";
import type { BookConfiguration, ChapterKey, Memory } from "@/domain/models";
import { chapterById, defaultChapterOrder } from "@/data/chapters";
import { estimateBookPages, quoteBook, bookMaterialExtras, bookPageExtras, bookSizeExtras } from "@/domain/commerce/pricing";
import { isPrintEligible } from "@/domain/policies/permissions";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { BookObject, bookColors } from "@/components/marketing/objects";
import { SpreadViewer, buildBookPages, bookSizeLabel, orderStories } from "@/components/heirlooms/book-pages";
import { MediaImage } from "@/components/media/media-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { Checkbox, ChoiceCards, Field, Input, Segmented, Select, Switch, Textarea } from "@/components/ui/field";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { useDemoStore } from "@/store/demo-store";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, formatMoney, pluralize } from "@/lib/utils";

type Step = "stories" | "cover" | "layout" | "review";
const steps: { id: Step; label: string }[] = [
  { id: "stories", label: "Stories" },
  { id: "cover", label: "Cover" },
  { id: "layout", label: "Pages" },
  { id: "review", label: "Review" },
];

export default function BookBuilderPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <HydratedOnly>
        <BookBuilder />
      </HydratedOnly>
    </React.Suspense>
  );
}

function HydratedOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  return hydrated ? children : <Skeleton className="h-[70vh] w-full" />;
}

function ineligibleReason(m: Memory) {
  if (m.deletedAt) return "Deleted";
  if (m.status !== "approved") return m.status === "draft" ? "Still a draft" : "Waiting for review";
  if (!m.consent.print) return "Contributor hasn't agreed to print";
  return null;
}

function BookBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const capsules = useDb((d) => d.capsules);
  const allMemories = useDb((d) => d.memories);
  const places = useDb((d) => d.places);
  const media = useDb((d) => d.media);
  const catalog = useDb((d) => d.catalog);
  const heirlooms = useDb((d) => d.heirlooms);
  const mutate = useDemoStore((s) => s.mutate);

  const editingId = params.get("id") ?? undefined;
  const existing = heirlooms.find((h) => h.id === editingId && h.kind === "book");
  const [capsuleId, setCapsuleId] = React.useState<string>(existing?.capsuleId ?? params.get("capsule") ?? "cap_margaret");
  const capsule = capsules.find((c) => c.id === capsuleId) ?? capsules[0];
  const [step, setStep] = React.useState<Step>("stories");
  const [busy, setBusy] = React.useState<null | "save" | "order">(null);
  const [savedId, setSavedId] = React.useState<string | undefined>(existing?.id);
  const [dirty, setDirty] = React.useState(false);

  const capsuleMemories = React.useMemo(() => allMemories.filter((m) => m.capsuleId === capsule?.id && !m.deletedAt), [allMemories, capsule?.id]);
  const eligible = React.useMemo(() => capsuleMemories.filter(isPrintEligible), [capsuleMemories]);

  const defaults = React.useCallback((): BookConfiguration => {
    return {
      material: "linen",
      color: "evergreen",
      foil: "brass",
      size: "10x10",
      title: capsule?.subjectName ?? "",
      subtitle: capsule?.title ?? "In their own words",
      dedication: capsule?.dedication ?? "",
      coverMediaId: capsule?.cover.mediaId,
      storyIds: eligible.map((m) => m.id),
      chapterOrder: capsule?.chapterOrder?.length ? capsule.chapterOrder : defaultChapterOrder,
      layout: "editorial",
      includeCaptions: true,
      includeTimeline: true,
      copies: 1,
    };
  }, [capsule, eligible]);

  // Mounted only after hydration, so device data (not fixtures) seeds the form.
  const [config, setConfig] = React.useState<BookConfiguration>(() => (existing?.book ? structuredClone(existing.book) : defaults()));

  const update = (patch: Partial<BookConfiguration>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const pages = React.useMemo(() => buildBookPages(config, capsuleMemories, places), [config, capsuleMemories, places]);
  const chosen = React.useMemo(() => orderStories(eligible.filter((m) => config.storyIds.includes(m.id)), config.chapterOrder), [config, eligible]);
  const photoCount = chosen.reduce((n, m) => n + m.photoIds.length, 0);
  const estPages = estimateBookPages(chosen.length, photoCount, config.includeTimeline);
  const bookProduct = catalog.find((p) => p.id === "book");
  const quote = bookProduct ? quoteBook(bookProduct.price.amount, config, estPages) : null;
  const photos = media.filter((a) => a.capsuleId === capsule?.id && a.kind !== "audio");

  if (!capsule) {
    return (
      <div className="mx-auto max-w-[1320px] space-y-6">
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  const save = async (): Promise<string | null> => {
    const r = await services().heirlooms.save({ id: savedId, kind: "book", capsuleId: capsule.id, name: `${config.title} — book`, book: config });
    if (r.status !== "ok") {
      toast.error("Couldn't save the design", r.status === "error" ? r.message : undefined);
      return null;
    }
    setSavedId(r.data.id);
    setDirty(false);
    if (!editingId) router.replace(`/app/heirlooms/book-builder?id=${r.data.id}`, { scroll: false });
    return r.data.id;
  };

  const onSave = async () => {
    setBusy("save");
    const id = await save();
    setBusy(null);
    if (id) toast.success("Design saved on this device");
  };

  const onOrder = async () => {
    setBusy("order");
    const id = await save();
    if (!id) return setBusy(null);
    const line = services().heirlooms.toCartLine(id);
    if (line.status !== "ok") {
      setBusy(null);
      toast.error("Couldn't price this book", line.status === "error" ? line.message : undefined);
      return;
    }
    mutate((d) => {
      d.cart = { id: d.cart.id, lines: [line.data], purpose: "self" };
    });
    const c = await services().billing.createCheckout([line.data], "self");
    setBusy(null);
    if (c.status === "ok") router.push(c.data.url);
    else toast.error("Couldn't open checkout", c.status === "error" ? c.message : undefined);
  };

  const toggleStory = (id: string, on: boolean) => update({ storyIds: on ? [...config.storyIds, id] : config.storyIds.filter((x) => x !== id) });
  const moveChapter = (c: ChapterKey, d: -1 | 1) => {
    const order = [...config.chapterOrder];
    const i = order.indexOf(c);
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    update({ chapterOrder: order });
  };
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        back={{ href: "/app/heirlooms", label: "Heirlooms" }}
        eyebrow="Printed Legacy Book · Preview"
        title={
          <>
            Design <em>{config.title || "the book"}</em>
          </>
        }
        description="Choose the stories, dress the cover and turn every page before anything is printed. Nothing is printed or shipped from this preview."
        actions={
          <>
            {savedId ? (
              <ButtonLink variant="secondary" href={`/proof/book/${savedId}`} target="_blank" leading={<FileText className="size-4" />}>
                Open print proof
              </ButtonLink>
            ) : null}
            <Button variant="secondary" onClick={() => void onSave()} loading={busy === "save"} disabled={!!busy}>
              {dirty || !savedId ? "Save design" : "Saved"}
            </Button>
          </>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ------------------------------ controls ------------------------------ */}
        <div className="min-w-0">
          <nav aria-label="Book builder steps" className="mb-6">
            <ol className="flex flex-wrap gap-2">
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    aria-current={step === s.id ? "step" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.9375rem] transition",
                      step === s.id ? "border-ink bg-ink text-paper" : i < stepIndex ? "border-line bg-surface text-ink" : "border-line text-ink-3 hover:text-ink",
                    )}
                  >
                    <span className={cn("grid size-5 place-items-center rounded-full font-mono text-[0.6875rem]", step === s.id ? "bg-paper/15" : "bg-ink/5")}>{i < stepIndex ? <Check className="size-3" /> : i + 1}</span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {step === "stories" ? (
            <div className="space-y-6">
              <Panel title="Whose book is this?">
                <Field label="Capsule" htmlFor="b-capsule" hint="Books are made from approved stories that contributors have agreed can be printed.">
                  <Select
                    id="b-capsule"
                    value={capsule.id}
                    onChange={(e) => {
                      const next = capsules.find((c) => c.id === e.target.value);
                      setCapsuleId(e.target.value);
                      if (next) {
                        const nextEligible = allMemories.filter((m) => m.capsuleId === next.id && isPrintEligible(m));
                        setConfig({ ...config, title: next.subjectName, subtitle: next.title, dedication: next.dedication ?? "", coverMediaId: next.cover.mediaId, storyIds: nextEligible.map((m) => m.id), chapterOrder: next.chapterOrder?.length ? next.chapterOrder : defaultChapterOrder });
                        setDirty(true);
                      }
                    }}
                  >
                    {capsules.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.subjectName} — {c.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Panel>

              <Panel
                title="Stories"
                description={`${pluralize(config.storyIds.length, "story", "stories")} selected · ${pluralize(photoCount, "photograph")}`}
                actions={
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => update({ storyIds: eligible.map((m) => m.id) })}>
                      All
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => update({ storyIds: [] })}>
                      None
                    </Button>
                  </div>
                }
                bodyClassName="p-0 sm:p-0"
              >
                {config.chapterOrder.map((c, ci) => {
                  const inChapter = capsuleMemories.filter((m) => m.chapter === c);
                  if (!inChapter.length) return null;
                  const ch = chapterById(c);
                  return (
                    <div key={c} className="border-b border-line last:border-b-0">
                      <div className="flex items-center justify-between gap-3 bg-ivory/50 px-5 py-3 sm:px-6">
                        <p className="flex items-baseline gap-3">
                          <span className="font-mono text-[0.75rem] text-ink-4">{String(ci + 1).padStart(2, "0")}</span>
                          <span className="font-serif text-[1.2rem]">{ch.title}</span>
                        </p>
                        <span className="flex gap-1">
                          <button type="button" className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink disabled:opacity-30" onClick={() => moveChapter(c, -1)} disabled={ci === 0} aria-label={`Move ${ch.title} earlier`}>
                            <ArrowUp className="size-4" />
                          </button>
                          <button type="button" className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink disabled:opacity-30" onClick={() => moveChapter(c, 1)} disabled={ci === config.chapterOrder.length - 1} aria-label={`Move ${ch.title} later`}>
                            <ArrowDown className="size-4" />
                          </button>
                        </span>
                      </div>
                      <ul className="divide-y divide-line">
                        {inChapter.map((m) => {
                          const reason = ineligibleReason(m);
                          return (
                            <li key={m.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                              <Checkbox id={`st-${m.id}`} checked={!reason && config.storyIds.includes(m.id)} disabled={!!reason} onCheckedChange={(v) => toggleStory(m.id, v)} label={m.title} description={reason ? reason : `${formatFuzzyDate(m.date)} · ${m.attribution.displayName}`} className="min-w-0 flex-1" />
                              {m.photoIds[0] ? <MediaImage mediaId={m.photoIds[0]} className={cn("size-12 shrink-0 rounded-[6px]", reason && "opacity-45 grayscale")} /> : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </Panel>
            </div>
          ) : null}

          {step === "cover" ? (
            <div className="space-y-6">
              <Panel title="Words on the cover">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Title" htmlFor="b-title">
                    <Input id="b-title" value={config.title} maxLength={40} onChange={(e) => update({ title: e.target.value })} />
                  </Field>
                  <Field label="Subtitle" htmlFor="b-sub">
                    <Input id="b-sub" value={config.subtitle} maxLength={60} onChange={(e) => update({ subtitle: e.target.value })} />
                  </Field>
                  <Field label="Dedication" htmlFor="b-ded" optional className="sm:col-span-2" hint="Printed on its own page after the title.">
                    <Textarea id="b-ded" rows={3} value={config.dedication} maxLength={240} onChange={(e) => update({ dedication: e.target.value })} />
                  </Field>
                </div>
              </Panel>
              <Panel title="Material">
                <ChoiceCards
                  name="material"
                  value={config.material}
                  onChange={(v) => update({ material: v })}
                  columns={3}
                  options={[
                    { value: "linen", label: "Belgian-style linen", description: `Textured weave · +${formatMoney(bookMaterialExtras.linen)}` },
                    { value: "cloth", label: "Book cloth", description: "Smooth, classic · included" },
                    { value: "soft_touch", label: "Soft-touch", description: `Velvet matte · +${formatMoney(bookMaterialExtras.soft_touch)}` },
                  ]}
                />
                <p className="mt-6 text-[0.875rem] font-medium">Colour</p>
                <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label="Cover colour">
                  {(Object.keys(bookColors) as (keyof typeof bookColors)[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={config.color === c}
                      aria-label={c}
                      onClick={() => update({ color: c })}
                      className={cn("grid size-12 place-items-center rounded-full ring-offset-2 ring-offset-surface transition", config.color === c ? "ring-2 ring-ink" : "hover:ring-1 hover:ring-ink/30")}
                      style={{ backgroundColor: bookColors[c].cloth }}
                    >
                      {config.color === c ? <Check className="size-4" style={{ color: bookColors[c].foil }} /> : null}
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-[0.875rem] font-medium">Title finish</p>
                <Segmented
                  label="Title finish"
                  className="mt-3"
                  value={config.foil}
                  onChange={(v) => update({ foil: v })}
                  options={[
                    { value: "brass", label: "Brass foil" },
                    { value: "blind_deboss", label: "Blind deboss" },
                    { value: "none", label: "Printed" },
                  ]}
                />
              </Panel>
              <Panel title="Frontispiece photograph" description="Faces the title page as the book opens.">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  <button type="button" onClick={() => update({ coverMediaId: undefined })} aria-pressed={!config.coverMediaId} className={cn("grid aspect-square place-items-center rounded-[8px] border text-[0.8125rem] text-ink-3", !config.coverMediaId ? "border-ink ring-2 ring-ink/80" : "border-line")}>
                    None
                  </button>
                  {photos.slice(0, 17).map((p) => (
                    <button key={p.id} type="button" onClick={() => update({ coverMediaId: p.id })} aria-pressed={config.coverMediaId === p.id} aria-label={`Use “${p.caption}” on the cover`} className={cn("overflow-hidden rounded-[8px]", config.coverMediaId === p.id ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "opacity-85 hover:opacity-100")}>
                      <MediaImage asset={p} className="aspect-square" />
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}

          {step === "layout" ? (
            <div className="space-y-6">
              <Panel title="Trim size">
                <ChoiceCards
                  name="size"
                  value={config.size}
                  onChange={(v) => update({ size: v })}
                  columns={3}
                  options={(["8x10", "10x10", "11x8.5"] as const).map((s) => ({ value: s, label: bookSizeLabel[s].split(" · ")[0], description: `${bookSizeLabel[s].split(" · ")[1]} · ${bookSizeExtras[s] ? `+${formatMoney(bookSizeExtras[s])}` : "included"}` }))}
                />
              </Panel>
              <Panel title="Photographs on the page">
                <ChoiceCards
                  name="layout"
                  value={config.layout}
                  onChange={(v) => update({ layout: v })}
                  columns={3}
                  options={[
                    { value: "editorial", label: "Editorial", description: "Mounted prints with generous margins" },
                    { value: "full_bleed", label: "Full bleed", description: "Photographs run to the edge" },
                    { value: "mixed", label: "Mixed", description: "Alternates the two for rhythm" },
                  ]}
                />
                <div className="mt-6 space-y-4">
                  <Switch id="b-captions" checked={config.includeCaptions} onCheckedChange={(v) => update({ includeCaptions: v })} label="Print captions under photographs" />
                  <Switch id="b-timeline" checked={config.includeTimeline} onCheckedChange={(v) => update({ includeTimeline: v })} label="Add a timeline at the back" description="A page of dates and titles — handy for grandchildren." />
                </div>
              </Panel>
              <Panel title="Copies">
                <div className="flex items-center gap-4">
                  <button type="button" className="grid size-11 place-items-center rounded-full border border-line hover:bg-ink/5 disabled:opacity-40" onClick={() => update({ copies: Math.max(1, config.copies - 1) })} disabled={config.copies <= 1} aria-label="One fewer copy">
                    <Minus className="size-4" />
                  </button>
                  <output className="min-w-10 text-center font-serif text-[2rem]" aria-live="polite">
                    {config.copies}
                  </output>
                  <button type="button" className="grid size-11 place-items-center rounded-full border border-line hover:bg-ink/5 disabled:opacity-40" onClick={() => update({ copies: Math.min(25, config.copies + 1) })} disabled={config.copies >= 25} aria-label="One more copy">
                    <Plus className="size-4" />
                  </button>
                  <p className="text-[0.9375rem] text-ink-3">One for each household is a lovely tradition.</p>
                </div>
              </Panel>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-6">
              <Panel title="Before anything is printed">
                <ol className="space-y-4 text-[0.9375rem]">
                  {[
                    ["You approve a proof.", "Every page, exactly as it will print. Nothing happens until you say yes."],
                    ["Contributors keep their say.", "Only approved stories with print consent are included — the list updates if anyone changes their mind."],
                    ["Shipping and tax come later.", "They'll be calculated by the carrier once printing is connected. We won't guess."],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-4">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-evergreen/10 font-mono text-[0.75rem] text-evergreen">{i + 1}</span>
                      <span>
                        <strong className="font-medium">{t}</strong> <span className="text-ink-2">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title="Your book">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[0.9375rem]">
                  {[
                    ["Title", config.title],
                    ["Stories", pluralize(chosen.length, "story", "stories")],
                    ["Cover", `${config.material === "soft_touch" ? "Soft-touch" : config.material === "linen" ? "Linen" : "Cloth"} · ${config.color} · ${config.foil === "brass" ? "brass foil" : config.foil === "blind_deboss" ? "blind deboss" : "printed"}`],
                    ["Size", bookSizeLabel[config.size]],
                    ["Layout", config.layout === "full_bleed" ? "Full bleed" : config.layout === "mixed" ? "Mixed" : "Editorial"],
                    ["Estimated pages", `${estPages} pages`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[0.8125rem] text-ink-3">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(steps[Math.max(0, stepIndex - 1)].id)} disabled={stepIndex === 0}>
              Back
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button variant="secondary" onClick={() => setStep(steps[stepIndex + 1].id)}>
                Next: {steps[stepIndex + 1].label}
              </Button>
            ) : null}
          </div>
        </div>

        {/* ------------------------------ preview ------------------------------ */}
        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <PreviewTabs config={config} pages={pages} title={config.title} />
          <section className="card-paper mt-6 p-5 sm:p-6" aria-label="Price summary">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Estimate · test prices</p>
                <p className="mt-2 font-serif text-[2.4rem] leading-none">{quote ? formatMoney(quote.total) : "—"}</p>
                <p className="mt-2 text-[0.875rem] text-ink-3">
                  {pluralize(config.copies, "copy", "copies")} · about {estPages} pages
                </p>
              </div>
              <Badge tone="demo">Preview only</Badge>
            </div>
            {quote && bookProduct ? (
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[0.9375rem]">
                <Row label="Book, 72 pages" value={formatMoney(bookProduct.price.amount)} />
                {bookMaterialExtras[config.material] ? <Row label="Cover material" value={`+${formatMoney(bookMaterialExtras[config.material])}`} /> : null}
                {bookSizeExtras[config.size] ? <Row label="Trim size" value={`+${formatMoney(bookSizeExtras[config.size])}`} /> : null}
                {bookPageExtras(estPages) ? <Row label={`${estPages - 72} extra pages`} value={`+${formatMoney(bookPageExtras(estPages))}`} /> : null}
                {config.copies > 1 ? <Row label="Copies" value={`× ${config.copies}`} /> : null}
                <Row label="Shipping" value="Calculated at fulfillment" muted />
                <Row label="Tax" value="Calculated at fulfillment" muted />
              </dl>
            ) : null}
            {config.storyIds.length < 3 ? (
              <p className="mt-4 flex gap-2 rounded-[10px] bg-warning/10 px-3 py-2 text-[0.875rem] text-ink-2">
                <Info className="mt-0.5 size-4 shrink-0" /> Choose at least three stories to make a book.
              </p>
            ) : null}
            <Button size="lg" block className="mt-5" leading={<ShoppingBag className="size-4" />} onClick={() => void onOrder()} loading={busy === "order"} disabled={!!busy || config.storyIds.length < 3}>
              Review a demo order
            </Button>
            <p className="mt-3 text-center text-[0.8125rem] text-ink-3">Preview only — no payment is charged and nothing is printed.</p>
          </section>
          <DemoNotice className="mt-6" title="Printing isn't connected yet">
            Pricing uses test amounts. Once a print partner is connected, you&rsquo;ll approve a final proof and see real shipping before you pay. <Link href="/heirlooms/book" className="text-link">About the book</Link>
          </DemoNotice>
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

function PreviewTabs({ config, pages, title }: { config: BookConfiguration; pages: ReturnType<typeof buildBookPages>; title: string }) {
  const [view, setView] = React.useState<"object" | "spreads">("object");
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented
          label="Preview"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "object", label: "The book", icon: <BookOpen className="size-4" /> },
            { value: "spreads", label: `Pages · ${pages.length}`, icon: <ImageIcon className="size-4" /> },
          ]}
        />
        <p className="hidden text-[0.8125rem] text-ink-3 sm:block">{view === "spreads" ? "Use ← → to turn pages" : bookSizeLabel[config.size]}</p>
      </div>
      {view === "object" ? (
        <div className="relative grid min-h-[460px] place-items-center overflow-hidden rounded-[10px] bg-[radial-gradient(90%_80%_at_50%_30%,#f3eee3,#e2d9c6)] px-6 py-14">
          <div className="relative">
            <BookObject title={title || " "} subtitle={config.subtitle} years="" color={config.color} material={config.material} foil={config.foil} size="lg" className="max-w-full" />
            {config.coverMediaId ? (
              <figure className="absolute -bottom-6 -right-16 hidden w-[150px] rotate-[4deg] bg-white p-2 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)] sm:block">
                <MediaImage mediaId={config.coverMediaId} className="aspect-[4/5]" />
                <figcaption className="pt-1.5 text-center font-serif text-[0.8rem] italic text-[#565952]">Frontispiece</figcaption>
              </figure>
            ) : null}
          </div>
        </div>
      ) : (
        <SpreadViewer pages={pages} config={config} />
      )}
    </div>
  );
}

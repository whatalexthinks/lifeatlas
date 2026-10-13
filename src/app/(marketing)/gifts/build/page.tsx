"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Hand, Link2 } from "lucide-react";
import type { EnvelopeArtwork, GiftReveal } from "@/domain/models";
import { giftSchema, type GiftFormValues } from "@/domain/schemas";
import { Container } from "@/components/marketing/blocks";
import { GiftEnvelope, artworkLabels, envelopeColors } from "@/components/gifting/envelope";
import { Button } from "@/components/ui/button";
import { DemoNotice, toast } from "@/components/ui/feedback";
import { Checkbox, ChoiceCards, Field, Input, Textarea } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { todayIso } from "@/lib/dates";
import { cn, formatMoney, uid } from "@/lib/utils";

const occasions: { value: GiftFormValues["occasion"]; label: string }[] = [
  { value: "christmas", label: "Christmas" },
  { value: "hanukkah", label: "Hanukkah" },
  { value: "birthday", label: "Birthday" },
  { value: "mothers_day", label: "Mother's Day" },
  { value: "fathers_day", label: "Father's Day" },
  { value: "anniversary", label: "Anniversary" },
  { value: "retirement", label: "Retirement" },
  { value: "new_baby", label: "New baby" },
  { value: "just_because", label: "Just because" },
  { value: "other", label: "Something else" },
];

function nextChristmasEve(now = new Date()) {
  const y = now.getMonth() === 11 && now.getDate() >= 24 ? now.getFullYear() + 1 : now.getFullYear();
  return `${y}-12-24`;
}

export default function GiftBuilder() {
  const router = useRouter();
  const catalog = useDb((d) => d.catalog);
  const mutate = useDemoStore((s) => s.mutate);
  const [v, setV] = React.useState<GiftFormValues>({
    occasion: "christmas",
    occasionLabel: "",
    recipientName: "",
    recipientRelation: "",
    giverName: "",
    dedication: "",
    envelope: "winter",
    color: "evergreen",
    deliveryMode: "share_link_myself",
    notifyOn: nextChristmasEve(),
    productId: "personal",
    addPrintedCard: true,
    addBook: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const set = (p: Partial<GiftFormValues>) => setV((x) => ({ ...x, ...p }));
  const product = catalog.find((p) => p.id === v.productId)!;
  const occasionLabel = v.occasion === "other" ? v.occasionLabel || "A gift for you" : occasions.find((o) => o.value === v.occasion)?.label;

  React.useEffect(() => {
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  const checkout = async () => {
    const r = giftSchema.safeParse(v);
    if (!r.success) {
      const e: Record<string, string> = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      toast.warning("A few details are missing");
      document.getElementById(Object.keys(e)[0] ? `g-${Object.keys(e)[0]}` : "g-recipientName")?.focus();
      return;
    }
    setBusy(true);
    const g = await services().gifts.createGift(r.data);
    if (g.status !== "ok") {
      setBusy(false);
      toast.error("Couldn't prepare the gift", g.status === "error" ? g.message : undefined);
      return;
    }
    const lines = [
      { id: uid("cl"), productId: v.productId, quantity: 1, extrasAmount: 0, giftId: g.data.id, label: `${product.name} — gift for ${v.recipientName}` },
      ...(v.addPrintedCard ? [{ id: uid("cl"), productId: "gift_wrap", quantity: 1, extrasAmount: 0, label: "Printable gift card" }] : []),
    ];
    mutate((d) => {
      d.cart = { id: d.cart.id, lines, purpose: "gift" };
    });
    services().analytics.track("gift_previewed", { occasion: v.occasion });
    const c = await services().billing.createCheckout(lines, "gift");
    setBusy(false);
    if (c.status === "ok") router.push(c.data.url);
    else toast.error("Couldn't open checkout", c.status === "error" ? c.message : undefined);
  };

  return (
    <div className="pb-24">
      <Container size="wide" className="grid gap-12 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 lg:pt-16">
        <div className="min-w-0">
          <p className="eyebrow">Give a capsule</p>
          <h1 className="mt-5 font-serif text-title">A gift that asks as much as it gives.</h1>
          <p className="mt-5 max-w-xl text-lead text-ink-2">Write a dedication, choose an envelope, and preview exactly what they&rsquo;ll open. You share the link — or hand over a printed card — when the moment is right.</p>

          <div className="mt-12 space-y-10">
            <section aria-labelledby="occ">
              <h2 id="occ" className="mb-3 font-medium">
                The occasion
              </h2>
              <div className="flex flex-wrap gap-2">
                {occasions.map((o) => (
                  <button key={o.value} type="button" onClick={() => set({ occasion: o.value })} aria-pressed={v.occasion === o.value} className={cn("h-10 rounded-full border px-4 text-[0.9rem] font-medium", v.occasion === o.value ? "border-evergreen bg-evergreen text-[#f8f6f1]" : "border-line-strong hover:border-ink-3")}>
                    {o.label}
                  </button>
                ))}
              </div>
              {v.occasion === "other" ? (
                <Field label="Name the occasion" htmlFor="g-occasionLabel" error={errors.occasionLabel} className="mt-4 max-w-sm">
                  <Input id="g-occasionLabel" value={v.occasionLabel} onChange={(e) => set({ occasionLabel: e.target.value })} />
                </Field>
              ) : null}
            </section>

            <section className="grid gap-5 sm:grid-cols-2" aria-label="Who it's for">
              <Field label="Who is it for?" htmlFor="g-recipientName" error={errors.recipientName}>
                <Input id="g-recipientName" value={v.recipientName} onChange={(e) => set({ recipientName: e.target.value })} placeholder="Grandpa Walt" invalid={!!errors.recipientName} />
              </Field>
              <Field label="They are your…" htmlFor="g-recipientRelation" error={errors.recipientRelation}>
                <Input id="g-recipientRelation" value={v.recipientRelation} onChange={(e) => set({ recipientRelation: e.target.value })} placeholder="Grandfather" invalid={!!errors.recipientRelation} />
              </Field>
              <Field label="Signed by" htmlFor="g-giverName" error={errors.giverName} className="sm:col-span-2">
                <Input id="g-giverName" value={v.giverName} onChange={(e) => set({ giverName: e.target.value })} placeholder="With love, the grandchildren" invalid={!!errors.giverName} />
              </Field>
              <Field label="Your dedication" htmlFor="g-dedication" hint={`${v.dedication.length}/600 · It appears on the card they open.`} error={errors.dedication} className="sm:col-span-2">
                <Textarea id="g-dedication" value={v.dedication} onChange={(e) => set({ dedication: e.target.value })} maxLength={600} className="min-h-28 font-serif text-[1.1rem]" placeholder="We want to hear the stories you tell at the table — the ones we keep forgetting to write down." />
              </Field>
            </section>

            <section aria-labelledby="env">
              <h2 id="env" className="mb-3 font-medium">
                Envelope
              </h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(artworkLabels) as EnvelopeArtwork[]).map((a) => (
                  <button key={a} type="button" onClick={() => set({ envelope: a })} aria-pressed={v.envelope === a} className={cn("h-10 rounded-full border px-4 text-[0.9rem]", v.envelope === a ? "border-evergreen bg-surface shadow-[0_0_0_1px_var(--evergreen)]" : "border-line-strong")}>
                    {artworkLabels[a]}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Envelope color">
                {(Object.keys(envelopeColors) as GiftReveal["color"][]).map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={v.color === c} aria-label={c} onClick={() => set({ color: c })} className={cn("size-10 rounded-full ring-offset-2 ring-offset-paper", v.color === c && "ring-2 ring-evergreen")} style={{ background: envelopeColors[c].paper }} />
                ))}
              </div>
            </section>

            <section aria-labelledby="deliv">
              <h2 id="deliv" className="mb-3 font-medium">
                How they&rsquo;ll receive it
              </h2>
              <ChoiceCards
                name="deliveryMode"
                value={v.deliveryMode}
                onChange={(m) => set({ deliveryMode: m })}
                columns={1}
                options={[
                  { value: "share_link_myself", label: "I'll share the link myself", description: "By text, email or a family chat — whenever you choose.", icon: <Link2 className="size-5" /> },
                  { value: "in_person", label: "I'll give it in person", description: "Print the card and hand it over. Perfect under a tree.", icon: <Hand className="size-5" /> },
                  { value: "scheduled_preview", label: "Plan a date (preview)", description: "See how a scheduled notification would look. Nothing is scheduled or sent in this preview.", icon: <CalendarClock className="size-5" /> },
                ]}
              />
              {v.deliveryMode === "scheduled_preview" ? (
                <Field label="Date to plan for" htmlFor="g-notifyOn" error={errors.notifyOn} className="mt-4 max-w-xs">
                  <Input id="g-notifyOn" type="date" value={v.notifyOn} min={todayIso()} onChange={(e) => set({ notifyOn: e.target.value })} invalid={!!errors.notifyOn} />
                </Field>
              ) : null}
            </section>

            <section aria-labelledby="pkg">
              <h2 id="pkg" className="mb-3 font-medium">
                The gift
              </h2>
              <ChoiceCards
                name="productId"
                value={v.productId}
                onChange={(p) => set({ productId: p })}
                columns={2}
                options={(["personal", "family"] as const).map((id) => {
                  const p = catalog.find((x) => x.id === id)!;
                  return { value: id, label: `${p.name} · ${formatMoney(p.price.amount)}`, description: p.tagline };
                })}
              />
              <div className="mt-5 space-y-3">
                <Checkbox id="g-card" checked={v.addPrintedCard} onCheckedChange={(x) => set({ addPrintedCard: x })} label="Printable gift card (free)" description="A letterpress-style card with the link and your dedication, to print at home." />
                <Checkbox id="g-book" checked={false} disabled onCheckedChange={() => undefined} label="Add a printed heirloom book" description="Coming soon — printing isn't available to order yet." />
              </div>
            </section>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="xl" onClick={() => void checkout()} loading={busy} trailing={<ArrowRight className="size-5" />}>
              Review &amp; continue · {formatMoney(product.price.amount)}
            </Button>
            <p className="text-[0.875rem] text-ink-3">Test price. The next step is a clearly-labelled demo checkout — no card details are collected.</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="What they'll open">
          <div className="rounded-[28px] bg-ivory p-6 sm:p-10">
            <p className="catalog mb-6 text-center">What {v.recipientName.split(" ")[0] || "they"}&rsquo;ll open</p>
            <GiftEnvelope recipient={v.recipientName} giver={v.giverName} dedication={v.dedication} reveal={{ envelope: v.envelope, color: v.color }} occasion={occasionLabel} open={open} />
            <div className="mt-8 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen((x) => !x)}>
                {open ? "Close the envelope" : "Open the envelope"}
              </Button>
            </div>
            <p className="mx-auto mt-8 max-w-sm text-center text-[0.9rem] leading-relaxed text-ink-2">
              Then a gentle welcome: how a memory capsule works, and one button to begin with a single question. No forced sign-up, no upsell.
            </p>
          </div>
          <DemoNotice className="mt-5">Preview only — no payment will be charged, and no email or text is sent.</DemoNotice>
        </aside>
      </Container>
    </div>
  );
}

"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import { AlertTriangle, ArrowLeft, Lock, ShieldOff, XCircle } from "lucide-react";
import type { CartLine, CheckoutSession } from "@/domain/models";
import { mockCheckoutSchema, shippingAddressSchema } from "@/domain/schemas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { cn, formatMoney, uid } from "@/lib/utils";

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const catalog = useDb((d) => d.catalog);
  const profile = useDb((d) => d.account.profile);
  const email = useDb((d) => d.account.user.email);
  const mutate = useDemoStore((s) => s.mutate);
  const [form, setForm] = React.useState({ name: profile.displayName, email, acknowledgeDemo: false });
  const [ship, setShip] = React.useState({ name: profile.displayName, line1: "", line2: "", city: "", region: "", postalCode: "", country: "United States" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [outcome, setOutcome] = React.useState<null | "declined" | "canceled">(null);
  const checkouts = useDb((d) => d.checkouts);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const started = React.useRef(false);

  // The session is read live from the store, so completing it updates this page by itself.
  const sid = params.get("session");
  const productId = params.get("product");
  const intervalParam = params.get("interval") === "month" ? "month" : "year";
  const codeParam = params.get("code") ?? undefined;
  const product = productId ? catalog.find((c) => c.id === productId) : undefined;
  const productError = productId && (!product || product.availability !== "available_demo" || product.price.amount === 0) ? (product ? `${product.name} isn't available to order yet.` : "We couldn't find that product.") : null;
  const session: CheckoutSession | null = sid ? (checkouts.find((c) => c.id === sid) ?? null) : null;
  const error = !hydrated ? null : sid ? (session ? null : "This checkout preview has expired. Start again from your bag.") : productId ? (productError ?? createError) : "Your bag is empty.";

  React.useEffect(() => {
    if (!hydrated || sid || !product || productError || started.current) return;
    started.current = true;
    const lines: CartLine[] = [{ id: uid("cl"), productId: product.id, quantity: 1, extrasAmount: 0, ...(product.kind === "plan" ? { interval: product.monthly ? intervalParam : "year" } : {}) }];
    mutate((d) => {
      d.cart = { id: d.cart.id, lines, purpose: "self" };
    });
    // A friend's referral link (from /r/CODE) is remembered on this device and applied here.
    let referral: string | undefined;
    try {
      referral = localStorage.getItem("lifeatlas.referral") ?? undefined;
    } catch {
      referral = undefined;
    }
    void services()
      .billing.createCheckout(lines, "self", { promoCode: codeParam ?? referral })
      .then((r) => {
        if (r.status === "ok") router.replace(r.data.url, { scroll: false });
        else setCreateError(r.status === "error" ? r.message : "Checkout unavailable");
      });
  }, [hydrated, sid, product, productError, mutate, router, intervalParam, codeParam]);

  const promotions = useDb((d) => d.promotions);
  const credits = useDb((d) => d.credits);
  // Recomputed whenever the session, catalog, promotions or credit change (all live from the store).
  const checkoutQuote = React.useMemo(() => {
    void promotions;
    void credits;
    void catalog;
    if (!session) return null;
    const r = services().billing.quoteCheckout(session.id);
    return r.status === "ok" ? r.data : null;
  }, [session, catalog, promotions, credits]);
  const quote = checkoutQuote?.quote ?? null;
  const [code, setCode] = React.useState("");
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const applyCode = async () => {
    if (!session) return;
    setApplying(true);
    const r = await services().billing.applyPromoCode(session.id, code);
    setApplying(false);
    if (r.status === "ok") {
      setCodeError(null);
      setCode("");
      toast.success("Code applied");
    } else setCodeError(r.status === "error" ? r.message : "That code can't be used here.");
  };
  const setLineInterval = (lineId: string, interval: "year" | "month") =>
    mutate((d) => {
      const c = d.checkouts.find((x) => x.id === session?.id);
      const l = c?.lines.find((x) => x.id === lineId);
      if (l) l.interval = interval;
    });

  const place = async () => {
    if (!session || !quote) return;
    const e: Record<string, string> = {};
    const c = mockCheckoutSchema.safeParse(form);
    if (!c.success) for (const i of c.error.issues) e[String(i.path[0])] ??= i.message;
    let shipping: typeof ship | undefined;
    if (quote.hasPhysical) {
      const s = shippingAddressSchema.safeParse(ship);
      if (!s.success) for (const i of s.error.issues) e[`ship_${String(i.path[0])}`] ??= i.message;
      else shipping = s.data as typeof ship;
    }
    setErrors(e);
    if (Object.keys(e).length) {
      toast.warning("Please check the highlighted fields");
      return;
    }
    setBusy(true);
    const r = await services().billing.completeMockCheckout(session.id, { name: form.name, email: form.email, shipping });
    setBusy(false);
    if (r.status === "ok") router.push(`/checkout/complete?order=${r.data.id}`);
    else toast.error("Demo checkout failed", r.status === "error" ? r.message : undefined);
  };

  if (!hydrated || (!session && !error)) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !session || !quote) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-[2.6rem] leading-tight">{error ?? "Checkout unavailable"}</h1>
        <p className="mt-3 text-ink-2">Choose a plan or design a gift to start a demo checkout.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/checkout/bag">Open your bag</ButtonLink>
          <ButtonLink href="/pricing" variant="secondary">See pricing</ButtonLink>
          <ButtonLink href="/gifts/build" variant="secondary">
            Design a gift
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (session.status === "completed" && session.orderId) {
    return <RedirectTo href={`/checkout/complete?order=${session.orderId}`} />;
  }

  if (outcome) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">{outcome === "declined" ? <XCircle className="size-7" /> : <ShieldOff className="size-7" />}</span>
        <h1 className="mt-6 font-serif text-[2.4rem] leading-tight">{outcome === "declined" ? "Payment didn't go through" : "Checkout canceled"}</h1>
        <p className="mt-3 text-ink-2">
          {outcome === "declined"
            ? "This is a preview of what a declined payment would look like. In this demo, nothing was attempted and nothing was charged. Your bag is still here."
            : "This is a preview of a canceled checkout. Nothing was saved or charged. Your bag is still here."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => setOutcome(null)}>Return to checkout</Button>
          <ButtonLink href="/pricing" variant="secondary">
            Back to pricing
          </ButtonLink>
        </div>
        <p className="mt-6 text-[0.8125rem] text-ink-3">Outcome preview, for design review only.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-14">
      <div className="min-w-0">
        <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1 text-[0.875rem] text-ink-3 hover:text-ink">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="font-serif text-[clamp(2.2rem,1.8rem+1.6vw,3rem)] leading-tight">{session.purpose === "gift" ? "Review your gift" : "Review your order"}</h1>
        <DemoNotice className="mt-6" title="Preview only, no payment will be charged" icon={<AlertTriangle className="size-[18px]" />}>
          Payments aren&rsquo;t connected in this preview. There are no card fields, and nothing is sent to a payment provider. Completing this step records a demo order in your current capsule workspace, not a paid order.
        </DemoNotice>

        <section className="mt-10 space-y-5" aria-labelledby="contact-h">
          <h2 id="contact-h" className="text-[1.15rem] font-medium">
            Your details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="c-name" error={errors.name}>
              <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field label="Email for the demo receipt" htmlFor="c-email" hint="Not sent, shown on the receipt only." error={errors.email}>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} autoComplete="email" />
            </Field>
          </div>
        </section>

        {quote.hasPhysical ? (
          <section className="mt-10 space-y-5" aria-labelledby="ship-h">
            <h2 id="ship-h" className="text-[1.15rem] font-medium">
              Shipping address
            </h2>
            <p className="text-[0.9rem] text-ink-3">Please use a sample address. Nothing will be printed or shipped, and the address stays on this device.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["name", "Recipient", "sm:col-span-2"],
                  ["line1", "Street address", "sm:col-span-2"],
                  ["line2", "Apartment, suite (optional)", "sm:col-span-2"],
                  ["city", "City", ""],
                  ["region", "State / region", ""],
                  ["postalCode", "Postal code", ""],
                  ["country", "Country", ""],
                ] as const
              ).map(([k, label, cls]) => (
                <Field key={k} label={label} htmlFor={`s-${k}`} error={errors[`ship_${k}`]} className={cls}>
                  <Input id={`s-${k}`} value={ship[k]} onChange={(e) => setShip({ ...ship, [k]: e.target.value })} invalid={!!errors[`ship_${k}`]} />
                </Field>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10" aria-labelledby="pay-h">
          <h2 id="pay-h" className="text-[1.15rem] font-medium">
            Payment
          </h2>
          <div className="mt-4 rounded-[18px] border border-dashed border-line-strong bg-surface/60 p-6">
            <p className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-3" /> Payment provider not connected
            </p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">In the real product, a secure payment page from our payment provider will appear here. This preview never asks for card numbers, bank details or passwords.</p>
          </div>
          <Checkbox
            id="ack"
            className="mt-6"
            checked={form.acknowledgeDemo}
            onCheckedChange={(v) => setForm({ ...form, acknowledgeDemo: v })}
            label="I understand this is a demo order and no payment is taken"
            description="Nothing will be charged, emailed, printed or shipped."
          />
          {errors.acknowledgeDemo ? <p className="mt-2 text-[0.875rem] font-medium text-danger">{errors.acknowledgeDemo}</p> : null}
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="xl" loading={busy} onClick={() => void place()}>
            Place demo order, no charge
          </Button>
          <Button
            variant="ghost"
            size="xl"
            onClick={async () => {
              await services().billing.cancelCheckout(session.id);
              router.push("/pricing");
            }}
          >
            Cancel
          </Button>
        </div>
        <details className="mt-8 text-[0.875rem] text-ink-3">
          <summary className="cursor-pointer">Preview other outcomes (for design review)</summary>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOutcome("declined")}>
              Declined payment
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setOutcome("canceled")}>
              Canceled checkout
            </Button>
          </div>
        </details>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
        <div className="card-paper p-6">
          <h2 className="font-serif text-[1.6rem]">Summary</h2>
          <ul className="mt-5 divide-y divide-line">
            {quote.lines.map((l) => {
              const line = session.lines.find((x) => x.id === l.id);
              const p = catalog.find((c) => c.id === line?.productId);
              return (
                <li key={l.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block font-medium">{l.label}</span>
                      <span className="text-[0.8125rem] text-ink-3">
                        {l.quantity > 1 ? `${l.quantity} × ` : ""}
                        {l.interval === "month" ? "per month" : l.interval === "year" ? (line?.asGift ? "one year, prepaid" : "per year") : "one time"}
                        {l.extras ? ` · includes ${formatMoney(l.extras)} options` : ""}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums">{formatMoney(l.total, { showFree: true })}</span>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-ink-2">
                    {l.fulfillment === "made_to_order"
                      ? "Made to order, printed only after you approve a proof."
                      : l.fulfillment === "ships_after_payment"
                        ? "Ready-made kit, would ship after payment."
                        : p?.kind === "plan"
                          ? "Plan activation and family invitations are not connected yet."
                          : null}
                  </p>
                  {p?.kind === "plan" && p.monthly && !line?.asGift ? (
                    <div className="mt-2 inline-flex rounded-[9px] border border-line p-0.5 text-[0.8125rem]" role="radiogroup" aria-label={`Billing for ${p.name}`}>
                      {(["year", "month"] as const).map((iv) => (
                        <button key={iv} type="button" role="radio" aria-checked={(l.interval ?? "year") === iv} onClick={() => setLineInterval(l.id, iv)} className={cn("min-h-8 rounded-[7px] px-3", (l.interval ?? "year") === iv ? "bg-ink text-paper" : "text-ink-2 hover:bg-ivory")}>
                          {iv === "year" ? `Annual · ${formatMoney(p.price.amount)}` : `Monthly · ${formatMoney(p.monthly!.amount)}`}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line py-4">
            {checkoutQuote?.promo?.ok ? (
              <p className="flex items-center justify-between gap-3 text-[0.9375rem]">
                <span>
                  <span className="font-mono text-[0.8125rem]">{checkoutQuote.promo.code}</span> · {checkoutQuote.promo.label}
                </span>
                <Button size="sm" variant="ghost" onClick={() => void services().billing.removePromoCode(session.id)}>
                  Remove
                </Button>
              </p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void applyCode();
                }}
              >
                <label htmlFor="promo" className="sr-only">
                  Promotion or referral code
                </label>
                <Input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promotion or friend's code" autoCapitalize="characters" invalid={!!codeError} aria-describedby={codeError ? "promo-error" : undefined} />
                <Button type="submit" variant="secondary" loading={applying} disabled={!code.trim()}>
                  Apply
                </Button>
              </form>
            )}
            {checkoutQuote?.promo && !checkoutQuote.promo.ok ? <p className="mt-2 text-[0.8125rem] text-warning">The code {checkoutQuote.promo.code} no longer applies: {checkoutQuote.promo.reason}</p> : null}
            {codeError ? (
              <p id="promo-error" role="alert" className="mt-2 text-[0.8125rem] text-danger">
                {codeError}
              </p>
            ) : null}
            {checkoutQuote && checkoutQuote.creditAvailable > 0 ? (
              <Checkbox id="use-credit" className="mt-3" checked={session.useCredit !== false} onCheckedChange={(v) => void services().billing.setUseCredit(session.id, v)} label={`Use my ${formatMoney(checkoutQuote.creditAvailable)} credit`} description="Demo credit has no cash value." />
            ) : null}
          </div>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt className="text-ink-3">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatMoney(quote.subtotal)}</dd>
            </div>
            {quote.memberDiscount ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">{quote.memberDiscount.label}</dt>
                <dd className="font-mono tabular-nums text-success">−{formatMoney(quote.memberDiscount.amount)}</dd>
              </div>
            ) : null}
            {quote.discount ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">{quote.discount.label}</dt>
                <dd className="font-mono tabular-nums text-success">−{formatMoney(quote.discount.amount)}</dd>
              </div>
            ) : null}
            {quote.credit ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Credit</dt>
                <dd className="font-mono tabular-nums text-success">−{formatMoney(quote.credit)}</dd>
              </div>
            ) : null}
            {quote.hasPhysical ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Shipping</dt>
                <dd className="text-right text-[0.875rem] text-ink-3">Calculated once fulfillment is connected</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Tax</dt>
              <dd className="text-right text-[0.875rem] text-ink-3">Not calculated in preview</dd>
            </div>
            <div className={cn("flex justify-between border-t border-line pt-3 text-[1.15rem] font-medium")}>
              <dt>Total (test price)</dt>
              <dd className="font-mono tabular-nums">{formatMoney(quote.total)}</dd>
            </div>
          </dl>
          <ul className="mt-5 space-y-1.5 text-[0.8125rem] text-ink-3">
            {quote.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  React.useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}

export default function CheckoutPreview() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}

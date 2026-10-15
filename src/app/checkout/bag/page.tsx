"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, EmptyState, Skeleton, toast } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, formatMoney } from "@/lib/utils";

/**
 * The bag: everything chosen so far, before checkout. A plan and keepsakes can travel
 * together; made-to-order items say plainly that they wait for a proof.
 */
export default function BagPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const cart = useDb((d) => d.cart);
  const catalog = useDb((d) => d.catalog);
  const subscriptions = useDb((d) => d.subscriptions);
  const [busy, setBusy] = React.useState(false);
  // Re-quoted whenever the bag, prices or plan change (all live from the store).
  const quoteResult = React.useMemo(() => {
    void cart;
    void catalog;
    void subscriptions;
    return services().billing.quoteCart();
  }, [cart, catalog, subscriptions]);
  const quote = quoteResult.status === "ok" ? quoteResult.data : null;
  const hasKit = cart.lines.some((l) => l.productId === "keepsake_box");
  const kit = catalog.find((p) => p.id === "keepsake_box");

  const checkout = async () => {
    setBusy(true);
    let referral: string | undefined;
    try {
      referral = localStorage.getItem("lifeatlas.referral") ?? undefined;
    } catch {
      referral = undefined;
    }
    const r = await services().billing.checkoutCart({ promoCode: referral });
    setBusy(false);
    if (r.status === "ok") router.push(r.data.url);
    else toast.error("Couldn't open checkout", r.status === "error" ? r.message : undefined);
  };

  if (!hydrated)
    return (
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <Skeleton className="h-80" />
      </div>
    );

  if (!cart.lines.length)
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-serif text-[clamp(2.2rem,1.8rem+1.6vw,3rem)] leading-tight">Your bag</h1>
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag className="size-6" />}
          title="Your bag is empty"
          body="Choose a plan, design a book or a keepsake box, or add the ready-made kit."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/pricing">See plans</ButtonLink>
              <ButtonLink href="/physical-capsules" variant="secondary">
                Keepsakes
              </ButtonLink>
            </div>
          }
        />
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-14">
      <div className="min-w-0">
        <h1 className="font-serif text-[clamp(2.2rem,1.8rem+1.6vw,3rem)] leading-tight">Your bag</h1>
        <DemoNotice className="mt-6" title="Preview — nothing is charged">
          Your bag is kept on this device. Checkout is a demonstration: no card is asked for and nothing is made or shipped.
        </DemoNotice>
        <ul className="mt-8 divide-y divide-line rounded-[20px] border border-line bg-surface">
          {cart.lines.map((line) => {
            const p = catalog.find((c) => c.id === line.productId);
            const q = quote?.lines.find((x) => x.id === line.id);
            if (!p) return null;
            const adjustable = p.kind === "physical" && !line.configurationId;
            return (
              <li key={line.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{line.label ?? p.name}</p>
                  <p className="mt-1 text-[0.875rem] text-ink-3">
                    {p.kind === "plan" ? (line.asGift || line.giftId ? "One year, prepaid as a gift" : (line.interval ?? "year") === "month" ? "Billed monthly" : "Billed yearly") : q?.fulfillment === "made_to_order" ? "Made to order — printed only after you approve a proof." : q?.fulfillment === "ships_after_payment" ? "Ready-made kit — would ship after payment." : p.tagline}
                    {q?.extras ? ` · includes ${formatMoney(q.extras)} of options` : ""}
                  </p>
                  {p.kind === "plan" && p.monthly && !line.asGift && !line.giftId ? (
                    <div className="mt-3 inline-flex rounded-[9px] border border-line p-0.5 text-[0.8125rem]" role="radiogroup" aria-label={`Billing for ${p.name}`}>
                      {(["year", "month"] as const).map((iv) => (
                        <button key={iv} type="button" role="radio" aria-checked={(line.interval ?? "year") === iv} onClick={() => void services().billing.updateCartLine(line.id, { interval: iv })} className={cn("min-h-9 rounded-[7px] px-3", (line.interval ?? "year") === iv ? "bg-ink text-paper" : "text-ink-2 hover:bg-ivory")}>
                          {iv === "year" ? `Annual · ${formatMoney(p.price.amount)}` : `Monthly · ${formatMoney(p.monthly!.amount)}`}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="font-mono tabular-nums">{q ? formatMoney(q.total, { showFree: true }) : "—"}</span>
                  <div className="flex items-center gap-1">
                    {adjustable ? (
                      <span className="inline-flex items-center rounded-full border border-line">
                        <Button size="sm" variant="ghost" aria-label={`One fewer ${p.name}`} disabled={line.quantity <= 1} onClick={() => void services().billing.updateCartLine(line.id, { quantity: line.quantity - 1 })}>
                          <Minus className="size-4" />
                        </Button>
                        <span className="min-w-6 text-center tabular-nums" aria-live="polite" aria-label={`Quantity ${line.quantity}`}>
                          {line.quantity}
                        </span>
                        <Button size="sm" variant="ghost" aria-label={`One more ${p.name}`} disabled={line.quantity >= 25} onClick={() => void services().billing.updateCartLine(line.id, { quantity: line.quantity + 1 })}>
                          <Plus className="size-4" />
                        </Button>
                      </span>
                    ) : null}
                    <Button size="sm" variant="ghost" aria-label={`Remove ${line.label ?? p.name}`} onClick={() => void services().billing.removeCartLine(line.id).then(() => toast.success("Removed from your bag"))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!hasKit && kit && kit.availability === "available_demo" ? (
          <div className="mt-6 flex flex-col gap-4 rounded-[20px] border border-dashed border-line-strong p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-3">
              <Package className="mt-0.5 size-5 shrink-0 text-oxblood" aria-hidden />
              <span>
                <span className="block font-medium">Add the ready-made {kit.name}</span>
                <span className="text-[0.875rem] text-ink-3">Prompts, archival sleeves and a guide — {formatMoney(kit.price.amount)}. Or <Link href="/app/heirlooms/capsule-builder" className="text-link">design a personal one</Link>.</span>
              </span>
            </p>
            <Button variant="secondary" onClick={() => void services().billing.addToCart({ productId: kit.id, quantity: 1, extrasAmount: 0 }).then((r) => (r.status === "ok" ? toast.success("Added to your bag") : toast.error("Couldn't add it", r.status === "error" ? r.message : undefined)))}>
              Add to bag
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Bag summary">
        <div className="card-paper p-6">
          <h2 className="font-serif text-[1.6rem]">Summary</h2>
          {quote ? (
            <dl className="mt-5 space-y-2 text-[0.9375rem]">
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
              <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-medium">
                <dt>Before codes and credit</dt>
                <dd className="font-mono tabular-nums">{formatMoney(quote.subtotal - (quote.memberDiscount?.amount ?? 0))}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-[0.9375rem] text-danger" role="alert">
              {quoteResult.status === "error" ? quoteResult.message : "Something in your bag can't be priced."}
            </p>
          )}
          <p className="mt-4 text-[0.8125rem] text-ink-3">Promotion and friend&rsquo;s codes are applied at checkout. Shipping and tax aren&rsquo;t calculated in this preview.</p>
          <Button size="lg" block className="mt-6" loading={busy} disabled={!quote} onClick={() => void checkout()}>
            Continue to checkout
          </Button>
        </div>
      </aside>
    </div>
  );
}

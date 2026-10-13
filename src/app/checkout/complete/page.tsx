"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Printer } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { OrderStatusBadge } from "@/components/studio/primitives";
import { useDb, useHydrated } from "@/hooks/use-data";
import { formatDate, formatMoney } from "@/lib/utils";

function CompleteInner() {
  const orderId = useSearchParams().get("order");
  const hydrated = useHydrated();
  const order = useDb((d) => d.orders.find((o) => o.id === orderId));
  const gifts = useDb((d) => d.gifts);
  const invoice = useDb((d) => d.invoices.find((i) => i.orderId === orderId));
  if (!hydrated) return <Skeleton className="mx-auto mt-16 h-96 max-w-2xl" />;
  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-[2.4rem]">We couldn&rsquo;t find that order.</h1>
        <ButtonLink href="/app/orders" className="mt-6">
          See your orders
        </ButtonLink>
      </div>
    );
  }
  const gift = gifts.find((g) => order.items.some((i) => i.giftId === g.id));
  const giftLink = gift ? `${typeof window !== "undefined" ? window.location.origin : ""}/gift/${gift.token}` : null;
  const physical = order.items.some((i) => i.configurationId);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 font-serif text-[clamp(2.4rem,1.9rem+2vw,3.4rem)] leading-tight">{gift ? `Your gift for ${gift.recipient.name} is ready.` : physical ? "Your demo order is placed." : "Your capsule is ready."}</h1>
        <p className="mt-3 text-lead text-ink-2">Demo order {order.number}. No payment was charged.</p>
      </div>

      <article className="card-paper relative mt-10 overflow-hidden p-7 sm:p-9 print:shadow-none" aria-label="Demo receipt">
        <div className="pointer-events-none absolute right-6 top-6 rotate-[8deg] rounded-[6px] border-2 border-danger/50 px-3 py-1 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-danger/70">Demo · no payment charged</div>
        <div className="flex items-center gap-2.5 text-evergreen">
          <BrandMark className="size-7" />
          <span className="font-serif text-[1.3rem] text-ink">Receipt</span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-[0.875rem]">
          <div>
            <dt className="text-ink-3">Order</dt>
            <dd className="font-mono">{order.number}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Date</dt>
            <dd>{formatDate(order.createdAt, "long")}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Customer</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Status</dt>
            <dd>
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
        </dl>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <span>
                {i.name}
                {i.summary ? <span className="block text-[0.8125rem] text-ink-3">{i.summary}</span> : null}
              </span>
              <span className="font-mono tabular-nums">{formatMoney((i.unitAmount + i.extrasAmount) * i.quantity, { showFree: true })}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between text-[1.1rem] font-medium">
          <span>Total (test price)</span>
          <span className="font-mono tabular-nums">{formatMoney(order.total)}</span>
        </div>
        <p className="mt-2 text-[0.8125rem] text-ink-3">
          Charged: <strong>$0.00</strong> · Payment: demo, uncharged{invoice ? ` · ${invoice.number}` : ""}
        </p>
      </article>

      {gift ? (
        <section className="mt-8 rounded-[20px] bg-ivory p-6">
          <p className="font-medium">Share the gift when you&rsquo;re ready</p>
          <p className="mt-1 text-[0.9375rem] text-ink-2">LifeAtlas didn&rsquo;t send anything. Copy the link, or open the gift to see what {gift.recipient.name.split(" ")[0]} will see.</p>
          <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">{giftLink}</code>
            <Button
              size="sm"
              variant="secondary"
              leading={<Copy className="size-3.5" />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(giftLink ?? "");
                  toast.success("Gift link copied");
                } catch {
                  toast.info("Copy the link from the box");
                }
              }}
            >
              Copy
            </Button>
          </div>
          <ButtonLink href={`/gift/${gift.token}`} className="mt-4">
            Open the gift
          </ButtonLink>
        </section>
      ) : null}

      <DemoNotice className="mt-8">{physical ? "A proof preview is waiting in Orders. Nothing will be printed or shipped — fulfillment isn't connected." : "Demo — no payment charged. Your plan is active only in this browser."}</DemoNotice>

      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        <ButtonLink href={physical ? "/app/orders" : gift ? "/app" : "/app/capsules/new"}>{physical ? "Review the proof" : gift ? "Go to the studio" : "Create your capsule"}</ButtonLink>
        <Button variant="secondary" leading={<Printer className="size-4" />} onClick={() => window.print()}>
          Print receipt
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutComplete() {
  return (
    <Suspense fallback={null}>
      <CompleteInner />
    </Suspense>
  );
}

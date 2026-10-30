"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import type { Product } from "@/domain/models";
import { defaultCatalog } from "@/data/product-catalog";
import { plans, type PlanId } from "@/domain/commerce/plans";
import { PrintPhoto } from "@/components/marketing/home/editorial";
import { ButtonLink } from "@/components/ui/button";
import { AddToBagButton } from "@/components/site/bag";
import { cn, formatMoney } from "@/lib/utils";

/**
 * Plans and keepsakes, read from the catalog and the plan table, nothing on this page
 * hard-codes a price or a limit. Every amount is a test price; nothing is charged.
 */

const planIds: PlanId[] = ["preview", "digital", "family"];
const product = (id: string) => defaultCatalog.find((p) => p.id === id)!;

export function PlanPricing({ className }: { className?: string }) {
  const cards = [
    { id: "preview", name: "Explore the experience", description: "Try guided storytelling before purchasing. Demo data isn't a paid hosted archive.", cta: "Explore free", href: "/examples" },
    { id: "digital", name: "One LifeCapsule", description: "A private story for yourself, a couple, or someone you love. One payment, no automatic renewal.", cta: "Choose one capsule", href: "/checkout/preview?product=digital" },
    { id: "family", name: "Family Collection", description: "Up to five capsules for parents, children, couples, and family stories. Pay once.", cta: "Choose family", href: "/checkout/preview?product=family" },
  ] as const;
  return (
    <div className={className}>
      <p className="max-w-3xl text-[1rem] leading-relaxed text-ink-2">One-time purchase. No subscription and no automatic renewal. Paid plans propose five years of hosted access with defined media allowances, starting only when payments and secure storage are connected. Export is always available.</p>
      <ul className="mt-8 grid gap-5 lg:grid-cols-3">
        {cards.map((card) => {
          const p = product(card.id);
          const featured = card.id === "digital";
          return (
            <li key={card.id} className={cn("relative flex flex-col rounded-[24px] border p-7 sm:p-8", featured ? "border-ink bg-surface shadow-[0_40px_80px_-50px_rgb(37_36_33/0.5)]" : "border-line bg-surface/70")}>
              {featured ? <span className="absolute -top-3 left-7 rounded-full bg-oxblood px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-on-oxblood">Recommended</span> : null}
              <h3 className="display-3">{card.name}</h3>
              <p className="mt-2 text-[0.9375rem] text-ink-2">{card.description}</p>
              <p className="mt-6 flex items-baseline gap-2"><span className="font-sans text-[3rem] font-[450] leading-none tracking-[-0.05em]">{p.price.amount ? formatMoney(p.price.amount) : "Free"}</span><span className="text-[0.9375rem] text-ink-3">{p.price.amount ? "once" : "to explore"}</span></p>
              <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-4">{card.id === "preview" ? "No purchase" : "Secure payment not connected yet"}</p>
              <ul className="mt-6 space-y-2.5">{p.inclusions.map((x) => <li key={x} className="flex gap-2.5 text-[0.9375rem] leading-snug"><Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden /><span>{x}</span></li>)}</ul>
              <div className="mt-auto pt-8"><ButtonLink href={card.href} variant={featured ? "primary" : "secondary"} size="lg" block>{card.cta}</ButtonLink></div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[0.9375rem] text-ink-2"><span className="font-medium text-ink">The owner pays once. Invited contributors join free.</span> Shared-access authorization must be completed before public launch.</p>
    </div>
  );
}

/** The two physical keepsakes, with how each one is made and shipped. */
export function KeepsakePricing({ className }: { className?: string }) {
  const items: { p: Product; href: string; action: string; photoSlug: string; photoAlt: string }[] = [
    { p: product("keepsake_box"), href: "/physical-capsules", action: "See the physical capsule", photoSlug: "moss-green-box", photoAlt: "A moss-green family archive box with keepsakes inside" },
    { p: product("book"), href: "/physical-capsules#book", action: "See the legacy book", photoSlug: "family-storybook", photoAlt: "An open family storybook beside its linen-bound cover" },
  ];
  return (
    <ul className={cn("grid gap-5 md:grid-cols-2", className)}>
      {items.map(({ p, href, action, photoSlug, photoAlt }) => (
        <li key={p.id} className="flex flex-col rounded-[22px] border border-line bg-surface/70 p-7">
          <PrintPhoto slug={photoSlug} alt={photoAlt} className="mb-6 aspect-[16/10] rounded-[1px]" />
          <p className="catalog">Add-on · {p.fulfillment === "made_to_order" ? "Made to order" : "Ready-made kit"}</p>
          <h3 className="display-3 mt-3">{p.name}</h3>
          <p className="mt-2 text-[0.9375rem] text-ink-2">{p.tagline}</p>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="text-[0.9375rem] text-ink-3">{p.price.from ? "From" : ""}</span>
            <span className="font-sans text-[2.4rem] font-[450] leading-none tracking-[-0.05em]">{formatMoney(p.price.amount)}</span>
          </p>
          <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-4">Test price · nothing is charged</p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">{p.fulfillmentNote}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
            {p.fulfillment === "ships_after_payment" && p.availability === "available_demo" ? (
              <AddToBagButton productId={p.id} variant="secondary">
                Add the kit to bag
              </AddToBagButton>
            ) : null}
            <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium">
              <span className="link-underline">{action}</span> <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

const rows: { label: string; value: (id: PlanId) => React.ReactNode }[] = [
  { label: "Guided questions, voice, photographs, timeline", value: () => true },
  { label: "Capsules", value: (id) => (id === "preview" ? `Up to ${plans[id].capsules}, on this device` : plans[id].capsules) },
  { label: "Storage for photos, voice and video", value: (id) => (plans[id].storageGb ? `${plans[id].storageGb} GB (planned)` : "Your browser only") },
  { label: "Contributors and viewers", value: () => "Planned, not available yet" },
  { label: "Future messages prepared", value: (id) => (plans[id].futureMessages === "unlimited" ? "Unlimited" : plans[id].futureMessages) },
  { label: "Family directory across capsules", value: (id) => plans[id].familyDirectory },
  { label: "Keepsake discount", value: (id) => (plans[id].keepsakeDiscountPct ? `${plans[id].keepsakeDiscountPct}%` : false) },
  { label: "Download everything, any time", value: () => true },
];

export function PlanComparison({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[20px] border border-line bg-surface", className)} tabIndex={0} role="region" aria-label="Plan comparison (scrolls sideways on small screens)">
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.9375rem]">
        <caption className="sr-only">What each plan includes</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="p-4 font-medium text-ink-3">
              Included
            </th>
            {planIds.map((id) => (
              <th key={id} scope="col" className="p-4 font-medium">
                {id === "preview" ? "Start free" : id === "digital" ? "One capsule" : "Family"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line last:border-0">
              <th scope="row" className="p-4 font-normal text-ink-2">
                {r.label}
              </th>
              {planIds.map((id) => {
                const v = r.value(id);
                return (
                  <td key={id} className="p-4">
                    {v === true ? <Check className="size-4 text-evergreen" aria-label="Included" /> : v === false ? <Minus className="size-4 text-ink-4" aria-label="Not included" /> : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

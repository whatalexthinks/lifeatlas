"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, Check, CircleSlash, Lock } from "lucide-react";
import type { AnalyticsEventName, Product, Promotion } from "@/domain/models";
import { canActivate } from "@/domain/commerce/promotions";
import { defaultFeatureFlags } from "@/data/fixtures";
import { canTransition, orderTransitions } from "@/domain/workflows/state-machines";
import { OrderStatusBadge } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, formatDate, formatMoney, relativeTime } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "support", label: "Support" },
  { id: "catalog", label: "Catalog" },
  { id: "promotions", label: "Promotions" },
  { id: "platform", label: "Integrations" },
  { id: "audit", label: "Audit log" },
] as const;
type TabId = (typeof tabs)[number]["id"];

const funnel: { name: AnalyticsEventName; label: string }[] = [
  { name: "landing_cta_clicked", label: "Clicked “start” on the site" },
  { name: "capsule_created", label: "Created a capsule" },
  { name: "first_memory_saved", label: "Saved a first memory" },
  { name: "invite_prepared", label: "Prepared an invitation" },
  { name: "contribution_completed", label: "Received a contribution" },
  { name: "checkout_started", label: "Started a checkout" },
  { name: "checkout_completed_mock", label: "Completed a demo checkout" },
];

/** What a production deploy would need, per service contract. */
const integrations: { service: string; covers: string; provider: string }[] = [
  { service: "auth", covers: "Accounts, sessions, MFA", provider: "Auth provider" },
  { service: "media", covers: "Photos and recordings", provider: "Private object storage" },
  { service: "communications", covers: "Invitation email and SMS", provider: "Email / SMS provider" },
  { service: "transcription", covers: "Speech to text", provider: "Transcription API" },
  { service: "billing", covers: "Checkout, renewals, webhooks", provider: "Payment provider" },
  { service: "fulfillment", covers: "Print, make, ship", provider: "Print vendor + carrier" },
  { service: "geocoding", covers: "Place search, map tiles", provider: "Geocoder + tiles" },
  { service: "preservation", covers: "Backups, integrity audits", provider: "Secondary storage" },
  { service: "futureDelivery", covers: "Scheduled letters", provider: "Scheduler + legal review" },
  { service: "analytics", covers: "Consent-based product metrics", provider: "Privacy-first analytics" },
];

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export default function OperationsPage() {
  const hydrated = useHydrated();
  const hash = React.useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  // The URL hash is the single source of truth, so links like #support always work.
  const tab: TabId = tabs.some((t) => t.id === hash) ? (hash as TabId) : "overview";

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Operations demo</p>
          <h1 className="mt-3 font-sans text-[clamp(2.2rem,1.7rem+1.8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.05em]">
            Behind the <em className="font-serif font-normal tracking-[-0.03em]">archive.</em>
          </h1>
          <p className="mt-4 text-[1.0625rem] text-ink-2">What the team would see — orders, support, prices and the services still to connect. Built from this device&rsquo;s data only.</p>
        </div>
        <Badge tone="demo">Not real staff access</Badge>
      </div>

      <div role="tablist" aria-label="Operations sections" className="scrollbar-none -mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => {
              window.location.hash = t.id;
            }}
            className={cn("-mb-px min-h-11 shrink-0 border-b-2 px-4 text-[0.9375rem] transition", tab === t.id ? "border-evergreen font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {!hydrated ? (
          <Skeleton className="h-[50vh] w-full" />
        ) : tab === "overview" ? (
          <Overview />
        ) : tab === "orders" ? (
          <Orders />
        ) : tab === "support" ? (
          <Support />
        ) : tab === "catalog" ? (
          <Catalog />
        ) : tab === "promotions" ? (
          <Promotions />
        ) : tab === "platform" ? (
          <Platform />
        ) : (
          <Audit />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Overview -------------------------------- */

function Overview() {
  const analytics = useDb((d) => d.analytics);
  const orders = useDb((d) => d.orders);
  const memories = useDb((d) => d.memories);
  const support = useDb((d) => d.supportRequests);
  const projects = useDb((d) => d.printProjects);
  const [hover, setHover] = React.useState<number | null>(null);
  const counts = funnel.map((f) => analytics.filter((e) => e.name === f.name).length);
  const max = Math.max(1, ...counts);
  const live = orders.filter((o) => !["canceled_mock", "refunded_mock"].includes(o.status));
  const tiles: [string, string | number, string][] = [
    ["Demo revenue", formatMoney(live.reduce((s, o) => s + o.total, 0)), "Test prices · nothing charged"],
    ["Stories waiting for review", memories.filter((m) => m.status === "submitted" || m.status === "under_review").length, "Across all capsules"],
    ["Proofs awaiting approval", projects.filter((p) => p.status === "proof_review").length, "Printing not connected"],
    ["Open support notes", support.filter((s) => s.status !== "resolved_demo").length, "Saved locally"],
  ];

  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([label, value, note]) => (
          <li key={label} className="card-paper p-5">
            <p className="text-[0.875rem] text-ink-3">{label}</p>
            <p className="mt-2 font-sans text-[2.4rem] font-medium leading-none tracking-[-0.04em] tabular-nums">{value}</p>
            <p className="mt-2 text-[0.8125rem] text-ink-4">{note}</p>
          </li>
        ))}
      </ul>

      <section className="card-paper p-6" aria-labelledby="funnel-h">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="funnel-h" className="text-[1.0625rem] font-medium">
            Journey funnel · events on this device
          </h2>
          <p className="text-[0.8125rem] text-ink-3">Local analytics only — never sent anywhere.</p>
        </div>
        <ol className="mt-6 space-y-2.5" aria-label="Funnel steps">
          {funnel.map((f, i) => {
            const prev = i > 0 ? counts[i - 1] : null;
            const rate = prev ? Math.round((counts[i] / prev) * 100) : null;
            return (
              <li key={f.name} className="relative grid grid-cols-[minmax(0,13rem)_1fr_3rem] items-center gap-4 sm:grid-cols-[minmax(0,16rem)_1fr_3rem]" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
                <span className="truncate text-[0.875rem] text-ink-2">{f.label}</span>
                <span className="relative h-7 rounded-[4px] bg-ink/[0.04]">
                  <span className={cn("absolute inset-y-0 left-0 rounded-[4px] bg-evergreen transition-[width,opacity] duration-500", hover !== null && hover !== i && "opacity-55")} style={{ width: `${counts[i] ? Math.max(1.5, (counts[i] / max) * 100) : 0}%` }} />
                </span>
                <span className="text-right text-[0.875rem] tabular-nums text-ink">{counts[i]}</span>
                {hover === i ? (
                  <span role="tooltip" className="pointer-events-none absolute left-[calc(min(16rem,40%)+1rem)] top-[-2.6rem] z-10 whitespace-nowrap rounded-[8px] bg-ink px-3 py-1.5 text-[0.8125rem] text-paper shadow-md">
                    {counts[i]} {counts[i] === 1 ? "event" : "events"}
                    {rate !== null ? ` · ${rate}% of the step before` : ""}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        {counts.some((c) => c === 0) ? <p className="mt-5 text-[0.875rem] text-ink-3">Empty steps haven&rsquo;t happened on this device yet — create a capsule, invite someone or place a demo order, then come back.</p> : null}
      </section>
    </div>
  );
}

/* -------------------------------- Orders --------------------------------- */

function Orders() {
  const orders = useDb((d) => d.orders);
  const projects = useDb((d) => d.printProjects);
  const [busy, setBusy] = React.useState<string | null>(null);
  return (
    <section className="card-paper overflow-hidden" aria-label="Order queue">
      <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-evergreen" tabIndex={0} role="region" aria-label="Order queue">
        <table className="w-full min-w-[820px] text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line text-left text-[0.8125rem] text-ink-3">
              <th className="px-6 py-3 font-normal">Order</th>
              <th className="px-3 py-3 font-normal">Customer</th>
              <th className="px-3 py-3 font-normal">Items</th>
              <th className="px-3 py-3 text-right font-normal">Total</th>
              <th className="px-3 py-3 font-normal">Status</th>
              <th className="px-6 py-3 text-right font-normal">Next step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => {
              const project = projects.find((p) => p.orderId === o.id);
              const waitingOnProof = o.status === "proof_required";
              const canAdvance = !waitingOnProof && ["paid_mock", "ready_for_fulfillment", "printing_mock"].includes(o.status) && (o.kind === "print" || o.kind === "capsule") && canTransition(orderTransitions, o.status, o.status === "paid_mock" ? "proof_required" : o.status === "ready_for_fulfillment" ? "printing_mock" : "shipped_mock");
              return (
                <tr key={o.id}>
                  <td className="px-6 py-3.5">
                    <Link href={`/app/orders#${o.id}`} className="font-mono text-[0.8125rem] hover:underline">
                      {o.number}
                    </Link>
                    <span className="block text-[0.8125rem] text-ink-3">{relativeTime(o.createdAt)}</span>
                  </td>
                  <td className="px-3 py-3.5">{o.customerName}</td>
                  <td className="max-w-[260px] truncate px-3 py-3.5 text-ink-2">{o.items.map((i) => i.name).join(", ")}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">{formatMoney(o.total)}</td>
                  <td className="px-3 py-3.5">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {waitingOnProof ? (
                      <span className="text-[0.8125rem] text-ink-3">Waiting for customer proof approval{project ? ` (v${project.proofs[0]?.version})` : ""}</span>
                    ) : canAdvance ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busy === o.id}
                        trailing={<ArrowRight className="size-4" />}
                        onClick={async () => {
                          setBusy(o.id);
                          const r = await services().orders.advanceMock(o.id);
                          setBusy(null);
                          if (r.status === "ok") toast.success(`${o.number} advanced`, "Simulated — nothing was made or shipped.");
                          else toast.error(r.status === "error" ? r.message : "Couldn't advance");
                        }}
                      >
                        {o.status === "ready_for_fulfillment" ? "Mark printing" : o.status === "printing_mock" ? "Mark shipped" : "Advance"}
                      </Button>
                    ) : (
                      <span className="text-[0.8125rem] text-ink-4">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------- Support -------------------------------- */

function Support() {
  const requests = useDb((d) => d.supportRequests);
  const [selected, setSelected] = React.useState<string | null>(null);
  const current = requests.find((r) => r.id === selected) ?? requests[0];
  if (!requests.length) return <p className="rounded-[14px] bg-ivory/60 px-6 py-10 text-center text-ink-2">The inbox is empty. Notes sent from the studio&rsquo;s Help page land here.</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
      <ul className="space-y-2" aria-label="Support notes">
        {requests.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setSelected(r.id)} aria-current={current?.id === r.id ? "true" : undefined} className={cn("w-full rounded-[12px] border px-4 py-3.5 text-left transition", current?.id === r.id ? "border-ink/70 bg-surface" : "border-line hover:bg-surface/70")}>
              <span className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{r.from}</span>
                <Badge tone={r.status === "resolved_demo" ? "success" : r.status === "open_demo" ? "info" : "warning"}>{r.status === "new_demo" ? "New" : r.status === "open_demo" ? "Open" : "Resolved"}</Badge>
              </span>
              <span className="mt-1 block truncate text-[0.875rem] text-ink-2">{r.subject}</span>
              <span className="mt-1 block text-[0.75rem] text-ink-4">
                {r.topic} · {relativeTime(r.createdAt)}
                {r.isSample ? " · sample" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <article className="card-paper p-6">
          <p className="text-[0.8125rem] text-ink-3">
            {current.from} · {formatDate(current.createdAt, "long")} · {current.topic}
          </p>
          <p className="mt-4 whitespace-pre-line text-[1rem] leading-relaxed">{current.body}</p>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            {(["open_demo", "resolved_demo"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={current.status === s ? "primary" : "secondary"}
                disabled={current.status === s}
                onClick={async () => {
                  const r = await services().support.setStatus(current.id, s);
                  if (r.status === "ok") toast.success(s === "resolved_demo" ? "Marked resolved" : "Marked open");
                }}
              >
                {s === "resolved_demo" ? "Resolve" : "Mark open"}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-[0.8125rem] text-ink-3">Replies need a support inbox, which isn&rsquo;t connected. Nothing is emailed from here.</p>
        </article>
      ) : null}
    </div>
  );
}

/* -------------------------------- Catalog -------------------------------- */

function Catalog() {
  const catalog = useDb((d) => d.catalog);
  return (
    <div className="space-y-4">
      <DemoNotice title="Test prices only">Edits apply to the studio, builders and checkout on this device immediately. The public pricing page shows the published catalog. Amounts are stored as whole cents.</DemoNotice>
      <ul className="grid gap-4 lg:grid-cols-2">
        {[...catalog]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => (
            <ProductRow key={`${p.id}-${p.price.amount}-${p.availability}`} product={p} />
          ))}
      </ul>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const [amount, setAmount] = React.useState((product.price.amount / 100).toFixed(2));
  const [availability, setAvailability] = React.useState(product.availability);
  const [saving, setSaving] = React.useState(false);
  const cents = Math.round(Number(amount) * 100);
  const valid = amount.trim() !== "" && Number.isFinite(cents) && cents >= 0;
  const dirty = valid && (cents !== product.price.amount || availability !== product.availability);
  const locked = product.id === "legacy_capsule";
  return (
    <li className="card-paper p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{product.name}</p>
          <p className="text-[0.8125rem] text-ink-3">
            {product.kind} · {product.price.interval === "year" ? "per year" : "one time"}
          </p>
        </div>
        {locked ? (
          <Badge>
            <Lock className="size-3" /> Locked
          </Badge>
        ) : null}
      </div>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!dirty) return;
          setSaving(true);
          const r = await services().operations.updateProduct(product.id, { amount: cents, availability });
          setSaving(false);
          if (r.status === "ok") toast.success(`${product.name} updated`, `${formatMoney(r.data.price.amount)} · test price`);
          else toast.error(r.status === "error" ? r.message : "Couldn't update");
        }}
      >
        <label className="grid gap-1 text-[0.8125rem] text-ink-3">
          Price (USD)
          <span className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={locked} aria-invalid={!valid} className="h-10 w-32 rounded-[8px] border border-line-strong bg-surface pl-7 pr-3 text-[0.9375rem] tabular-nums text-ink aria-[invalid=true]:border-danger" />
          </span>
        </label>
        <label className="grid gap-1 text-[0.8125rem] text-ink-3">
          Availability
          <select value={availability} onChange={(e) => setAvailability(e.target.value as Product["availability"])} disabled={locked} className="h-10 rounded-[8px] border border-line-strong bg-surface px-2.5 text-[0.9375rem] text-ink">
            <option value="available_demo">Available (demo)</option>
            <option value="coming_soon">Coming soon</option>
            <option value="not_available">Not available</option>
          </select>
        </label>
        <Button type="submit" size="sm" loading={saving} disabled={!dirty || locked}>
          Save
        </Button>
      </form>
    </li>
  );
}

/* ------------------------------- Platform -------------------------------- */

function Platform() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-paper overflow-hidden" aria-labelledby="int-h">
        <h2 id="int-h" className="border-b border-line px-6 py-4 text-[1.0625rem] font-medium">
          Integrations
        </h2>
        <ul className="divide-y divide-line">
          {integrations.map((i) => (
            <li key={i.service} className="flex items-center justify-between gap-4 px-6 py-3.5">
              <span className="min-w-0">
                <span className="block font-medium">{i.covers}</span>
                <span className="text-[0.8125rem] text-ink-3">
                  <code className="font-mono">{i.service}</code> · needs {i.provider}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.8125rem] text-ink-3">
                <CircleSlash className="size-4" /> Mock in demo
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-6 py-4 text-[0.8125rem] text-ink-3">
          In production mode every one of these returns <code className="font-mono">not_configured</code> until a real provider is connected.
        </p>
      </section>
      <section className="card-paper overflow-hidden" aria-labelledby="flags-h">
        <h2 id="flags-h" className="border-b border-line px-6 py-4 text-[1.0625rem] font-medium">
          Feature flags
        </h2>
        <ul className="divide-y divide-line">
          {defaultFeatureFlags.map((f) => (
            <li key={f.key} className="flex items-start justify-between gap-4 px-6 py-3.5">
              <span className="min-w-0">
                <span className="block font-medium">{f.label}</span>
                <span className="text-[0.8125rem] text-ink-3">
                  {f.description} Depends on: {f.dependency}.
                </span>
              </span>
              <Badge>
                <Lock className="size-3" /> Off
              </Badge>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-6 py-4 text-[0.8125rem] text-ink-3">Locked off in Part One. A flag turns on only when its dependency is real.</p>
      </section>
    </div>
  );
}

/* --------------------------------- Audit --------------------------------- */

function Audit() {
  const events = useDb((d) => d.auditEvents);
  const [q, setQ] = React.useState("");
  const term = q.trim().toLowerCase();
  const shown = events.filter((e) => !term || `${e.actor} ${e.action} ${e.target ?? ""} ${e.detail ?? ""}`.toLowerCase().includes(term)).slice(0, 150);
  return (
    <section className="card-paper overflow-hidden" aria-label="Audit log">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <p className="text-[0.875rem] text-ink-3">
          {events.length} recorded actions · newest first {term ? `· ${shown.length} match` : ""}
        </p>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" aria-label="Filter audit log" className="h-10 w-56 rounded-[8px] border border-line-strong bg-surface px-3 text-[0.9375rem]" />
      </div>
      {shown.length === 0 ? (
        <p className="px-6 py-10 text-center text-ink-3">Nothing recorded yet.</p>
      ) : (
        <ol className="divide-y divide-line font-mono text-[0.8125rem]">
          {shown.map((e) => (
            <li key={e.id} className="grid gap-1 px-6 py-2.5 sm:grid-cols-[11rem_9rem_1fr] sm:gap-4">
              <span className="text-ink-3">{formatDate(e.at, "long")}</span>
              <span className="truncate">{e.actor}</span>
              <span className="min-w-0 break-words">
                <span className="text-evergreen">{e.action}</span>
                {e.target ? <span className="text-ink-3"> · {e.target}</span> : null}
                {e.detail ? <span className="text-ink-2"> — {e.detail}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="flex items-center gap-1.5 border-t border-line px-6 py-3 text-[0.8125rem] text-ink-3">
        <Check className="size-4" /> Kept on this device; capped at the latest 300 actions.
      </p>
    </section>
  );
}

/* ------------------------------ Promotions ------------------------------- */

const promoKindLabel: Record<Promotion["kind"], string> = { percent_off: "Percent off", amount_off: "Amount off", free_period: "Free period", referral_reward: "Referral reward", giveaway: "Giveaway" };

function Promotions() {
  const promotions = useDb((d) => d.promotions);
  const redemptions = useDb((d) => d.promotionRedemptions);
  const [reviewer, setReviewer] = React.useState<Record<string, string>>({});

  const set = async (id: string, status: Promotion["status"]) => {
    const r = await services().operations.setPromotionStatus(id, status);
    if (r.status === "ok") toast.success(`${r.data.name}: ${status}`);
    else toast.error("Not changed", r.status === "error" ? r.message : undefined);
  };

  return (
    <div className="space-y-6">
      <DemoNotice title="Promotions are rules, not code changes">
        Every offer here runs through the same evaluator at checkout: eligibility, limits, dates and one-per-order. Giveaways can&rsquo;t be switched on until a legal and eligibility review is recorded — and they&rsquo;re awarded under their rules, never typed in as a code.
      </DemoNotice>
      <ul className="space-y-4">
        {promotions.map((p) => {
          const gate = canActivate(p);
          const used = redemptions.filter((r) => r.promotionId === p.id).length;
          return (
            <li key={p.id} className="rounded-[16px] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {p.name}
                    {p.code ? <span className="rounded-[6px] bg-ivory px-2 py-0.5 font-mono text-[0.75rem]">{p.code}</span> : <span className="text-[0.8125rem] text-ink-3">no code</span>}
                    <Badge tone={p.status === "active" ? "success" : p.status === "ended" ? "neutral" : p.status === "draft" ? "warning" : "info"}>{p.status}</Badge>
                  </p>
                  <p className="mt-1 text-[0.9375rem] text-ink-2">{p.description}</p>
                  <p className="mt-1 text-[0.8125rem] text-ink-3">
                    {promoKindLabel[p.kind]} · {p.redemptions} redeemed{p.limits.maxRedemptions ? ` of ${p.limits.maxRedemptions}` : ""}
                    {used ? ` (${used} on this device)` : ""}
                    {p.endsAt ? ` · ends ${formatDate(p.endsAt)}` : ""}
                    {p.eligibility.newCustomersOnly ? " · new members only" : ""}
                    {p.limits.perCustomer ? ` · ${p.limits.perCustomer} per customer` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status !== "active" && p.status !== "ended" ? (
                    <Button size="sm" variant="secondary" disabled={!gate.ok} onClick={() => void set(p.id, "active")} title={gate.ok ? undefined : gate.reason}>
                      Activate
                    </Button>
                  ) : null}
                  {p.status === "active" ? (
                    <Button size="sm" variant="ghost" onClick={() => void set(p.id, "paused")}>
                      Pause
                    </Button>
                  ) : null}
                  {p.status !== "ended" ? (
                    <Button size="sm" variant="ghost" onClick={() => void set(p.id, "ended")}>
                      End
                    </Button>
                  ) : null}
                </div>
              </div>
              {p.requiresLegalReview ? (
                <div className="mt-4 rounded-[12px] bg-warning-soft px-4 py-3 text-[0.875rem]">
                  {p.legalReview ? (
                    <p>
                      Review recorded by {p.legalReview.reviewedBy} on {formatDate(p.legalReview.approvedAt)} (demo record).
                    </p>
                  ) : (
                    <>
                      <p className="font-medium">Needs a legal and eligibility review before it can run.</p>
                      {p.rulesSummary ? <p className="mt-1 text-ink-2">{p.rulesSummary}</p> : null}
                      <form
                        className="mt-3 flex flex-wrap gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const r = await services().operations.recordLegalReview(p.id, reviewer[p.id] ?? "");
                          if (r.status === "ok") toast.success("Review recorded", "A demo record only — not legal advice.");
                          else toast.error("Not recorded", r.status === "error" ? r.message : undefined);
                        }}
                      >
                        <label htmlFor={`rev-${p.id}`} className="sr-only">
                          Reviewed by
                        </label>
                        <input id={`rev-${p.id}`} className="h-9 rounded-[8px] border border-line-strong bg-surface px-3" placeholder="Reviewed by (counsel)" value={reviewer[p.id] ?? ""} onChange={(e) => setReviewer({ ...reviewer, [p.id]: e.target.value })} />
                        <Button size="sm" type="submit" variant="secondary">
                          Record review
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              ) : null}
              {!gate.ok && !p.requiresLegalReview ? <p className="mt-2 text-[0.8125rem] text-warning">{gate.reason}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

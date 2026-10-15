"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowUpRight, CalendarClock, CreditCard, FileText, Gift, HardDrive, Library, Mail, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { Product, Subscription } from "@/domain/models";
import { annualSavings, capsuleAllowance, countOwnedCapsules, currentPlanId, plans } from "@/domain/commerce/plans";
import { planIds } from "@/data/product-catalog";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { formatBytes, formatDate, formatMoney } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Browser storage actually used by this demo — a real number, not an allowance. */
function useStorageEstimate() {
  const [est, setEst] = React.useState<{ usage: number; quota: number } | null>(null);
  React.useEffect(() => {
    let live = true;
    navigator.storage?.estimate?.().then((e) => live && setEst({ usage: e.usage ?? 0, quota: e.quota ?? 0 }));
    return () => {
      live = false;
    };
  }, []);
  return est;
}

const priceLabel = (p: Product, interval: "year" | "month") => (interval === "month" && p.monthly ? `${formatMoney(p.monthly.amount)} / month` : `${formatMoney(p.price.amount)} / year`);

export default function BillingPage() {
  const hydrated = useHydrated();
  const orders = useDb((d) => d.orders);
  const catalog = useDb((d) => d.catalog);
  const subscriptions = useDb((d) => d.subscriptions);
  const invoices = useDb((d) => d.invoices);
  const capsules = useDb((d) => d.capsules);
  const futureMessages = useDb((d) => d.futureMessages);
  const credits = useDb((d) => d.credits);
  const ownPersonId = useDb((d) => d.account.profile.personId);
  const storage = useStorageEstimate();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [methodsNote, setMethodsNote] = React.useState<string | null>(null);

  const planId = currentPlanId(subscriptions, catalog);
  const ent = plans[planId];
  const sub: Subscription | undefined = subscriptions.find((s) => (s.status === "active" || s.status === "preview_active") && catalog.find((p) => p.id === s.productId)?.planId === planId);
  const plan = catalog.find((p) => p.planId === planId);
  const owned = countOwnedCapsules(capsules, ownPersonId);
  const allowance = capsuleAllowance(planId, owned);
  const prepared = futureMessages.filter((m) => !m.isExample).length;
  const balance = credits.reduce((s, c) => s + c.amount, 0);
  const upgrade = planId !== "family" ? catalog.find((p) => p.id === "family") : undefined;
  const interval = sub?.interval ?? "year";

  React.useEffect(() => {
    void services()
      .billing.listPaymentMethods()
      .then((r) => setMethodsNote(r.status === "not_configured" ? r.message : null));
  }, []);

  const switchInterval = async (to: "year" | "month") => {
    if (!sub || to === interval) return;
    const r = await services().billing.changeInterval(sub.id, to);
    if (r.status === "ok") toast.success(to === "month" ? "Monthly from your next renewal" : "Annual from your next renewal", "Demo — nothing is charged or renewed.");
    else toast.error("Couldn't change billing", r.status === "error" ? r.message : undefined);
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader eyebrow="Account" title="Plan & billing" description="Your plan, what it includes, and every receipt. In this preview no card is collected and nothing is ever charged." />
      <DemoNotice className="mb-8" title="Preview only — no payment is charged">
        Prices are test amounts for the proposed service. Payment processing, renewals and real receipts arrive with a payment provider.
      </DemoNotice>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Your plan" actions={sub ? <Badge tone="demo">Demo subscription</Badge> : <Badge>Preview</Badge>}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-[2.3rem] leading-none tracking-[-0.02em]">{plan?.name ?? "Preview"}</p>
              <p className="mt-2 max-w-md text-ink-2">{plan?.tagline}</p>
            </div>
            {plan && sub ? (
              <p className="text-right">
                <span className="block font-serif text-[1.7rem] leading-none tabular-nums">{priceLabel(plan, interval)}</span>
                <span className="text-[0.8125rem] text-ink-3">test price</span>
              </p>
            ) : null}
          </div>

          {sub && plan ? (
            <>
              <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-[0.9375rem] sm:grid-cols-3">
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">Started</dt>
                  <dd>{sub.startedAt ? formatDate(sub.startedAt, "long") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">{sub.cancelAtPeriodEnd || sub.giftedBy ? "Ends" : "Would renew"}</dt>
                  <dd>{sub.renewsOn ? formatDate(sub.renewsOn, "long") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">Order</dt>
                  <dd>
                    {sub.orderId ? (
                      <Link href={`/app/orders#${sub.orderId}`} className="font-mono text-[0.875rem] text-link">
                        {orders.find((o) => o.id === sub.orderId)?.number ?? "View"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
              {sub.giftedBy ? (
                <p className="mt-5 flex items-start gap-2 rounded-[12px] bg-oxblood-soft px-4 py-3 text-[0.9375rem]">
                  <Gift className="mt-0.5 size-4 shrink-0 text-oxblood" /> A gift from {sub.giftedBy}. It&rsquo;s prepaid for this term and won&rsquo;t renew by itself.
                </p>
              ) : (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-ivory px-5 py-4">
                  <div>
                    <p className="text-[0.9375rem] font-medium">How you&rsquo;re billed</p>
                    {plan.monthly ? (
                      <p className="text-[0.8125rem] text-ink-3">
                        Annual saves {annualSavings(plan)?.percent}% ({formatMoney(annualSavings(plan)!.saving)} a year). Changes take effect at the next renewal.
                      </p>
                    ) : null}
                  </div>
                  {plan.monthly ? (
                    <Segmented
                      label="Billing interval"
                      size="sm"
                      value={interval}
                      onChange={(v) => void switchInterval(v)}
                      options={[
                        { value: "year", label: "Annual" },
                        { value: "month", label: "Monthly" },
                      ]}
                    />
                  ) : null}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {sub.cancelAtPeriodEnd ? (
                  <>
                    <p className="w-full text-[0.9375rem] text-ink-2">
                      Set to end on {sub.renewsOn ? formatDate(sub.renewsOn, "long") : "the renewal date"}. Your capsules stay readable and downloadable afterwards — nothing is deleted.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const r = await services().billing.setCancelAtPeriodEnd(sub.id, false);
                        if (r.status === "ok") toast.success("Your plan will continue", "Demo — nothing is charged.");
                      }}
                    >
                      Keep my plan
                    </Button>
                  </>
                ) : !sub.giftedBy ? (
                  <Button variant="ghost" className="text-danger" onClick={() => setCancelOpen(true)}>
                    Cancel plan
                  </Button>
                ) : null}
                <ButtonLink variant="ghost" href="/pricing">
                  Compare plans
                </ButtonLink>
              </div>
            </>
          ) : (
            <div className="mt-5 border-t border-line pt-5">
              <p className="max-w-lg text-ink-2">You&rsquo;re exploring on this device. Everything works here; a plan keeps your capsules beyond this browser once hosting is connected — and invited family never pay.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {planIds
                  .filter((id) => id !== "preview")
                  .map((id) => {
                    const p = catalog.find((x) => x.id === id);
                    return p ? (
                      <ButtonLink key={id} href={`/checkout/preview?product=${id}`} variant={id === "digital" ? "primary" : "secondary"}>
                        Choose {p.name} · {formatMoney(p.price.amount)}/yr
                      </ButtonLink>
                    ) : null;
                  })}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-5">
            <Usage icon={<Library className="size-4" />} label="Your capsules" used={owned} limit={allowance.limit} note={allowance.allowed ? "Sample capsules never count." : allowance.reason ?? undefined} />
            <Usage icon={<Mail className="size-4" />} label="Future messages prepared" used={prepared} limit={ent.futureMessages === "unlimited" ? undefined : ent.futureMessages} note={ent.futureMessages === "unlimited" ? "Unlimited on this plan. Delivery isn't scheduled by any plan yet." : "Delivery isn't scheduled by any plan yet."} />
            <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
              <span className="flex items-center gap-2">
                <Users className="size-4 text-ink-3" /> Contributors & viewers
              </span>
              <span className="text-ink-2">Unlimited · always free for them</span>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                <span className="flex items-center gap-2">
                  <HardDrive className="size-4 text-ink-3" /> Stored in this browser
                </span>
                <span className="tabular-nums text-ink-2">{hydrated && storage ? formatBytes(storage.usage) : "…"}</span>
              </div>
              <p className="mt-1.5 text-[0.8125rem] text-ink-3">
                Measured on this device.{ent.storageGb ? ` Your plan's ${ent.storageGb} GB is the planned hosted allowance — hosted storage isn't connected yet.` : " The preview doesn't include hosted storage."}{" "}
                <Link href="/app/preservation" className="text-link">
                  Download a copy
                </Link>
              </p>
            </div>
          </div>
          {upgrade ? (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-evergreen-soft px-5 py-4">
              <p className="text-[0.9375rem]">
                <strong className="font-medium">{upgrade.name}</strong> makes room for {plans.family.capsules} capsules and a shared family directory.
              </p>
              <ButtonLink size="sm" href={`/checkout/preview?product=${upgrade.id}`} variant="secondary">
                See the Family plan
              </ButtonLink>
            </div>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel title="Credit" actions={<Sparkles className="size-5 text-ink-3" />}>
            <p className="font-serif text-[2rem] leading-none tabular-nums">{formatMoney(Math.max(0, balance))}</p>
            <p className="mt-2 text-[0.9375rem] text-ink-2">Used automatically on your next renewal, a printed book or a physical capsule. Demo credit has no cash value.</p>
            <ButtonLink href="/app/referrals" variant="secondary" size="sm" className="mt-4" trailing={<ArrowUpRight className="size-4" />}>
              Share {brand.name} with a friend
            </ButtonLink>
          </Panel>

          <Panel title="Payment method" actions={<CreditCard className="size-5 text-ink-3" />}>
            <div className="flex items-center gap-4 rounded-[12px] border border-dashed border-line-strong px-4 py-4">
              <span className="grid h-9 w-14 place-items-center rounded-[6px] bg-ink/5 font-mono text-[0.6875rem] text-ink-3">NONE</span>
              <p className="text-[0.875rem] text-ink-2">{methodsNote ?? "No card on file."}</p>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[0.8125rem] text-ink-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {brand.name} never asks for card details in this preview. If anything ever does, don&rsquo;t enter them.
            </p>
          </Panel>

          <Panel title="Gifts you've given" actions={<Gift className="size-5 text-ink-3" />}>
            <p className="text-[0.9375rem] text-ink-2">Gifted plans are prepaid for one year and never renew on their own. The person you gave it to owns their capsule.</p>
            <ButtonLink href="/gifts" variant="secondary" size="sm" className="mt-4">
              Give a {brand.product}
            </ButtonLink>
          </Panel>
        </div>
      </div>

      <Panel title="Receipts" description="Demo receipts for every demo order. None is a tax document." className="mt-6" bodyClassName="p-0 sm:p-0" actions={<CalendarClock className="size-5 text-ink-3" />}>
        {invoices.length === 0 ? (
          <p className="px-6 py-8 text-center text-ink-3">No receipts yet. They appear here after a demo checkout.</p>
        ) : (
          <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-evergreen" tabIndex={0} role="region" aria-label="Receipts">
            <table className="w-full min-w-[560px] text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.8125rem] text-ink-3">
                  <th className="px-6 py-3 font-normal">Receipt</th>
                  <th className="px-3 py-3 font-normal">Issued</th>
                  <th className="px-3 py-3 font-normal">For</th>
                  <th className="px-3 py-3 text-right font-normal">Amount</th>
                  <th className="px-6 py-3 text-right font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((inv) => {
                  const o = orders.find((x) => x.id === inv.orderId);
                  return (
                    <tr key={inv.id}>
                      <td className="px-6 py-3.5 font-mono text-[0.8125rem]">
                        <Link href={`/app/orders#${inv.orderId}`} className="inline-flex items-center gap-2 hover:underline">
                          <FileText className="size-4 text-ink-3" /> {inv.number}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 text-ink-2">{formatDate(inv.issuedAt)}</td>
                      <td className="max-w-[260px] truncate px-3 py-3.5">{o?.items[0]?.name ?? "—"}</td>
                      <td className="px-3 py-3.5 text-right tabular-nums">{formatMoney(inv.amount)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Badge tone={inv.status === "void" ? "neutral" : "demo"}>{inv.status === "demo_uncharged" ? "Not charged" : inv.status === "void" ? "Void" : "Paid"}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {sub ? (
        <ConfirmDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          title="Cancel your plan?"
          confirmLabel="Cancel at the end of the term"
          tone="danger"
          body={`Your plan would end on ${sub.renewsOn ? formatDate(sub.renewsOn, "long") : "its renewal date"}. Nothing is deleted: your capsules stay readable, and you can download everything before and after. You can change your mind any time before then.`}
          onConfirm={async () => {
            const r = await services().billing.setCancelAtPeriodEnd(sub.id, true);
            setCancelOpen(false);
            if (r.status === "ok") toast.success("Your plan will end at the end of the term", "Demo — nothing is charged or deleted.");
          }}
        />
      ) : null}
    </div>
  );
}

function Usage({ icon, label, used, limit, note }: { icon: React.ReactNode; label: string; used: number; limit?: number; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
        <span className="flex items-center gap-2">
          <span className="text-ink-3">{icon}</span> {label}
        </span>
        <span className="tabular-nums text-ink-2">
          {used}
          {limit !== undefined ? ` of ${limit}` : ""}
        </span>
      </div>
      {limit ? <ProgressBar value={Math.min(100, (used / limit) * 100)} className="mt-2" label={`${label}: ${used} of ${limit}`} /> : null}
      {note ? <p className="mt-1.5 text-[0.8125rem] text-ink-3">{note}</p> : null}
    </div>
  );
}

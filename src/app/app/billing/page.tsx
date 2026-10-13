"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CreditCard, FileText, HardDrive, Library, RefreshCcw, ShieldCheck, Users } from "lucide-react";
import type { Product } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, ProgressBar, toast } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { addYears } from "@/lib/dates";
import { formatBytes, formatDate, formatMoney } from "@/lib/utils";

const PLAN_IDS = ["personal", "family"] as const;

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

export default function BillingPage() {
  const hydrated = useHydrated();
  const orders = useDb((d) => d.orders);
  const catalog = useDb((d) => d.catalog);
  const subscriptions = useDb((d) => d.subscriptions);
  const invoices = useDb((d) => d.invoices);
  const capsules = useDb((d) => d.capsules);
  const memberships = useDb((d) => d.memberships);
  const storage = useStorageEstimate();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [methodsNote, setMethodsNote] = React.useState<string | null>(null);

  // The plan is whatever the latest non-canceled demo plan order bought.
  const planOrder = orders.find((o) => !["canceled_mock", "refunded_mock"].includes(o.status) && o.items.some((i) => (PLAN_IDS as readonly string[]).includes(i.productId) && !i.giftId));
  const planItem = planOrder?.items.find((i) => (PLAN_IDS as readonly string[]).includes(i.productId));
  const plan: Product | undefined = catalog.find((p) => p.id === planItem?.productId);
  const living = catalog.find((p) => p.id === "living");
  const sub = subscriptions.find((s) => s.productId === "living");
  const hostedUntil = planOrder && plan?.allowance?.hostedEditingMonths ? addYears(planOrder.createdAt.slice(0, 10), plan.allowance.hostedEditingMonths / 12) : null;
  const activeCapsules = capsules.filter((c) => c.status !== "archived" && c.status !== "deletion_pending");
  const contributors = new Set(memberships.filter((m) => m.role === "contributor" || m.role === "storyteller").map((m) => m.personId)).size;
  const storytellerLimit = plan?.allowance?.storytellers;
  const upgrade = plan?.id === "personal" ? catalog.find((p) => p.id === "family") : undefined;

  React.useEffect(() => {
    void services()
      .billing.listPaymentMethods()
      .then((r) => setMethodsNote(r.status === "not_configured" ? r.message : null));
  }, []);

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader eyebrow="Account" title="Plan & billing" description="What your family has, what it would cost, and what's connected. In this preview, no card is collected and nothing is ever charged." />
      <DemoNotice className="mb-8" title="Preview only — no payment was charged">
        Prices are test amounts for the proposed service. Payment processing, receipts and renewals arrive with a real payment provider.
      </DemoNotice>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Your plan" actions={plan ? <Badge tone="demo">Demo purchase</Badge> : <Badge>Free preview</Badge>}>
          {plan && planOrder ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-[2.4rem] leading-none tracking-[-0.03em]">{plan.name}</p>
                  <p className="mt-2 text-ink-2">{plan.tagline}</p>
                </div>
                <p className="text-right">
                  <span className="block font-serif text-[1.8rem] leading-none tabular-nums">{formatMoney(plan.price.amount)}</span>
                  <span className="text-[0.8125rem] text-ink-3">one time · test price</span>
                </p>
              </div>
              <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-[0.9375rem] sm:grid-cols-3">
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">Purchased</dt>
                  <dd>{formatDate(planOrder.createdAt, "long")}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">Hosted editing until</dt>
                  <dd>{hostedUntil ? formatDate(hostedUntil, "long") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-ink-3">Order</dt>
                  <dd>
                    <Link href={`/app/orders#${planOrder.id}`} className="font-mono text-[0.875rem] text-link">
                      {planOrder.number}
                    </Link>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div>
              <p className="font-serif text-[2rem] leading-tight">Free preview</p>
              <p className="mt-2 max-w-md text-ink-2">Everything in the studio works with local storage. Plans describe the proposed hosted service.</p>
              <ButtonLink href="/pricing" className="mt-5" trailing={<ArrowUpRight className="size-4" />}>
                Compare plans
              </ButtonLink>
            </div>
          )}

          <div className="mt-7 space-y-5">
            <Usage icon={<Library className="size-4" />} label="Capsules" used={activeCapsules.length} limit={typeof storytellerLimit === "number" ? storytellerLimit : undefined} unit="storyteller" />
            <Usage icon={<Users className="size-4" />} label="Contributors invited" used={contributors} limit={plan?.allowance?.contributors === "unlimited" ? undefined : (plan?.allowance?.contributors as number | undefined)} unit="person" note={plan?.allowance?.contributors === "unlimited" ? "Unlimited on this plan" : undefined} />
            <div>
              <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                <span className="flex items-center gap-2">
                  <HardDrive className="size-4 text-ink-3" /> Stored in this browser
                </span>
                <span className="tabular-nums text-ink-2">{hydrated && storage ? formatBytes(storage.usage) : "…"}</span>
              </div>
              <p className="mt-1.5 text-[0.8125rem] text-ink-3">
                Measured on this device. The plan&rsquo;s {plan?.allowance?.storageGb ?? 25} GB is a proposed cloud allowance — cloud storage isn&rsquo;t connected yet.{" "}
                <Link href="/app/preservation" className="text-link">
                  Back up a copy
                </Link>
              </p>
            </div>
          </div>
          {upgrade ? (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-evergreen/[0.06] px-5 py-4">
              <p className="text-[0.9375rem]">
                <strong className="font-medium">{upgrade.name}</strong> makes room for up to {String(upgrade.allowance?.storytellers)} storytellers.
              </p>
              <ButtonLink size="sm" href={`/checkout/preview?product=${upgrade.id}`} variant="secondary">
                Preview the upgrade
              </ButtonLink>
            </div>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel title="Living Archive" description="Optional renewal for hosted editing after the first year." actions={<RefreshCcw className="size-5 text-ink-3" />}>
            <p className="font-serif text-[1.6rem] leading-none tabular-nums">
              {living ? formatMoney(living.price.amount) : "—"}
              <span className="ml-1 font-sans text-[0.875rem] text-ink-3">/ year · test price</span>
            </p>
            {sub?.status === "preview_active" ? (
              <>
                <p className="mt-4 text-[0.9375rem] text-ink-2">
                  Preview started {sub.startedAt ? formatDate(sub.startedAt, "long") : ""}. In the real service this would renew on {sub.renewsOn ? formatDate(sub.renewsOn, "long") : "—"}.{" "}
                  <strong className="font-medium text-ink">Nothing will be charged and nothing will renew here.</strong>
                </p>
                <Button variant="ghost" className="mt-4 text-danger" onClick={() => setCancelOpen(true)}>
                  Cancel the preview
                </Button>
              </>
            ) : (
              <>
                <p className="mt-4 text-[0.9375rem] text-ink-2">{sub?.status === "preview_canceled" ? "You canceled the preview. Your stories stay exactly where they are." : "Not started. Your first year of hosted editing is included with a plan."}</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await services().billing.startLivingArchivePreview();
                    setBusy(false);
                    if (r.status === "ok") toast.success("Living Archive preview started", "No charge, no automatic renewal.");
                  }}
                >
                  Try the renewal preview
                </Button>
              </>
            )}
          </Panel>

          <Panel title="Payment method" actions={<CreditCard className="size-5 text-ink-3" />}>
            <div className="flex items-center gap-4 rounded-[12px] border border-dashed border-line-strong px-4 py-4">
              <span className="grid h-9 w-14 place-items-center rounded-[6px] bg-ink/5 font-mono text-[0.6875rem] text-ink-3">NONE</span>
              <p className="text-[0.875rem] text-ink-2">{methodsNote ?? "No card on file."}</p>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[0.8125rem] text-ink-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> LifeAtlas never asks for card details in this preview. If anything ever does, don&rsquo;t enter them.
            </p>
          </Panel>
        </div>
      </div>

      <Panel title="Invoices" description="Demo invoices for every demo order. None is a tax document." className="mt-6" bodyClassName="p-0 sm:p-0">
        {invoices.length === 0 ? (
          <p className="px-6 py-8 text-center text-ink-3">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.8125rem] text-ink-3">
                  <th className="px-6 py-3 font-normal">Invoice</th>
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

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel the Living Archive preview?"
        confirmLabel="Cancel preview"
        tone="danger"
        body="Nothing was charged. In the real service, canceling would keep your archive readable and downloadable — only hosted editing would pause."
        onConfirm={async () => {
          const r = await services().billing.cancelLivingArchivePreview();
          setCancelOpen(false);
          if (r.status === "ok") toast.success("Preview canceled");
        }}
      />
    </div>
  );
}

function Usage({ icon, label, used, limit, unit, note }: { icon: React.ReactNode; label: string; used: number; limit?: number; unit: string; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
        <span className="flex items-center gap-2">
          <span className="text-ink-3">{icon}</span> {label}
        </span>
        <span className="tabular-nums text-ink-2">
          {used}
          {limit ? ` of ${limit}` : ""}
        </span>
      </div>
      {limit ? <ProgressBar value={Math.min(100, (used / limit) * 100)} className="mt-2" label={`${label}: ${used} of ${limit} ${unit}s`} /> : null}
      {note ? <p className="mt-1.5 text-[0.8125rem] text-ink-3">{note}</p> : null}
    </div>
  );
}

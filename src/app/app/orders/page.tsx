"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleDashed, FileText, Gift, Package, PenLine, Printer, RotateCcw, Truck, X } from "lucide-react";
import type { Order, OrderStatus } from "@/domain/models";
import { canTransition, orderTransitions } from "@/domain/workflows/state-machines";
import { OrderStatusBadge, PageHeader, Panel } from "@/components/studio/primitives";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, EmptyState, toast } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { ConfirmDialog, Dialog } from "@/components/ui/overlay";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, formatDate, formatMoney, relativeTime } from "@/lib/utils";

const kindIcon: Record<Order["kind"], React.ComponentType<{ className?: string }>> = { digital: Package, gift: Gift, print: Printer, capsule: Package };
const kindLabel: Record<Order["kind"], string> = { digital: "Capsule plan", gift: "Gift", print: "Printed book", capsule: "Keepsake box" };

/** The path an order takes, by kind — used for the progress rail. */
const path: Record<Order["kind"], { status: OrderStatus; label: string }[]> = {
  digital: [
    { status: "preview", label: "Checkout" },
    { status: "paid_mock", label: "Confirmed · demo" },
  ],
  gift: [
    { status: "preview", label: "Checkout" },
    { status: "paid_mock", label: "Gift ready · demo" },
  ],
  print: [
    { status: "paid_mock", label: "Ordered" },
    { status: "proof_required", label: "Proof" },
    { status: "ready_for_fulfillment", label: "Approved" },
    { status: "printing_mock", label: "Printing" },
    { status: "shipped_mock", label: "Shipped" },
  ],
  capsule: [
    { status: "paid_mock", label: "Ordered" },
    { status: "proof_required", label: "Proof" },
    { status: "ready_for_fulfillment", label: "Approved" },
    { status: "printing_mock", label: "Making" },
    { status: "shipped_mock", label: "Shipped" },
  ],
};

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export default function OrdersPage() {
  const orders = useDb((d) => d.orders);
  const hashId = React.useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  const [picked, setPicked] = React.useState<string | null>(null);
  const selectedId = picked ?? (orders.some((o) => o.id === hashId) ? hashId : orders[0]?.id);
  const selected = orders.find((o) => o.id === selectedId);

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader eyebrow="Account" title="Orders" description="Every demo order you've placed, from plans to printed books. Nothing here was charged, printed or shipped." />
      <DemoNotice className="mb-8" title="Preview only — no payment was charged">
        Orders follow the real lifecycle so you can see how proofs, cancellations and refunds will work. Steps after approval are simulated.
      </DemoNotice>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" body="Plans, gifts and heirlooms you order in the demo will appear here." action={<ButtonLink href="/pricing">See plans</ButtonLink>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <ul className="space-y-2.5" aria-label="Orders">
            {orders.map((o) => {
              const Icon = kindIcon[o.kind];
              const active = o.id === selectedId;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(o.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn("flex w-full items-start gap-4 rounded-[16px] border px-4 py-4 text-left transition", active ? "border-ink/80 bg-surface shadow-sm" : "border-line bg-surface/50 hover:border-ink/25 hover:bg-surface")}
                  >
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", active ? "bg-evergreen text-paper" : "bg-ink/5 text-ink-2")}>
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium">{o.items[0]?.name ?? kindLabel[o.kind]}</span>
                        <span className="shrink-0 tabular-nums text-ink-2">{formatMoney(o.total)}</span>
                      </span>
                      <span className="mt-1 block font-mono text-[0.75rem] text-ink-3">
                        {o.number} · {relativeTime(o.createdAt)}
                      </span>
                      <span className="mt-2 block">
                        <OrderStatusBadge status={o.status} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected ? <OrderDetail key={selected.id} order={selected} /> : null}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const projects = useDb((d) => d.printProjects);
  const invoices = useDb((d) => d.invoices);
  const refunds = useDb((d) => d.refunds);
  const heirlooms = useDb((d) => d.heirlooms);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const project = projects.find((p) => p.orderId === order.id);
  const latestProof = project?.proofs[0];
  const config = project ? heirlooms.find((h) => h.id === project.configurationId) : undefined;
  const invoice = invoices.find((i) => i.orderId === order.id);
  const refund = refunds.find((r) => r.orderId === order.id);
  const steps = path[order.kind];
  const reachedIndex = Math.max(
    ...order.history.map((h) => steps.findIndex((s) => s.status === h.status)),
    steps.findIndex((s) => s.status === order.status),
  );
  const ended = order.status === "canceled_mock" || order.status === "refunded_mock";
  const canCancel = canTransition(orderTransitions, order.status, "canceled_mock");
  const canRefund = !refund && canTransition(orderTransitions, order.status, "refunded_mock");

  const approve = async () => {
    if (!project || !latestProof) return;
    setBusy("approve");
    const r = await services().fulfillment.approveProof(project.id, latestProof.id);
    setBusy(null);
    if (r.status === "ok") toast.success("Proof approved in the demo", "Printing isn't connected — nothing will be printed.");
    else toast.error(r.status === "error" ? r.message : "Couldn't approve");
  };
  const regenerate = async () => {
    if (!project) return;
    setBusy("proof");
    const r = await services().fulfillment.createProof(project.configurationId);
    setBusy(null);
    if (r.status === "ok") toast.success(`Proof v${r.data.version} generated`, "Made from your latest saved design.");
  };

  return (
    <div className="min-w-0 space-y-6">
      <Panel
        title={
          <span className="flex flex-wrap items-baseline gap-x-3">
            {kindLabel[order.kind]} <span className="font-mono text-[0.8125rem] text-ink-3">{order.number}</span>
          </span>
        }
        description={`Placed ${formatDate(order.createdAt, "long")} by ${order.customerName}`}
        actions={<OrderStatusBadge status={order.status} />}
      >
        {/* progress rail */}
        <ol className="flex items-start" aria-label="Order progress">
          {steps.map((s, i) => {
            const done = !ended && i <= reachedIndex;
            const current = !ended && i === reachedIndex;
            return (
              <li key={s.status} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 ? <span className={cn("absolute right-1/2 top-[13px] h-[2px] w-full", done ? "bg-evergreen" : "bg-line")} aria-hidden /> : null}
                <span className={cn("relative z-[1] grid size-7 place-items-center rounded-full border-2", done ? "border-evergreen bg-evergreen text-paper" : "border-line bg-surface text-ink-4", current && "ring-4 ring-evergreen/15")}>
                  {done ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
                </span>
                <span className={cn("mt-2 text-[0.75rem] leading-tight sm:text-[0.8125rem]", done ? "text-ink" : "text-ink-3")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
        {ended ? <p className="mt-5 rounded-[12px] bg-ink/5 px-4 py-3 text-[0.9375rem] text-ink-2">{order.status === "canceled_mock" ? "This order was canceled. Nothing was charged." : "This order was refunded in the demo. Nothing was charged in the first place."}</p> : null}

        <table className="mt-6 w-full text-[0.9375rem]">
          <caption className="sr-only">Items</caption>
          <tbody className="divide-y divide-line">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="py-3 pr-4">
                  <span className="block">{it.name}</span>
                  <span className="text-[0.8125rem] text-ink-3">
                    {it.quantity > 1 ? `${it.quantity} × ${formatMoney(it.unitAmount + it.extrasAmount)}` : it.extrasAmount ? `${formatMoney(it.unitAmount)} + ${formatMoney(it.extrasAmount)} options` : "Test price"}
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums">{formatMoney((it.unitAmount + it.extrasAmount) * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line text-ink-2">
            <tr>
              <td className="pt-3">Shipping</td>
              <td className="pt-3 text-right">{order.shippingEstimate === null ? (order.kind === "print" || order.kind === "capsule" ? "Not calculated" : "—") : formatMoney(order.shippingEstimate)}</td>
            </tr>
            <tr>
              <td className="pt-1">Tax</td>
              <td className="pt-1 text-right">{order.taxEstimate === null ? "Not calculated" : formatMoney(order.taxEstimate)}</td>
            </tr>
            <tr className="text-ink">
              <td className="pt-3 font-medium">Total · test price</td>
              <td className="pt-3 text-right font-serif text-[1.6rem] tabular-nums">{formatMoney(order.total)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 text-[0.8125rem] text-ink-3">Payment: {order.payment === "mock_uncharged" ? "Demo — no card was collected and nothing was charged." : order.payment}</p>
      </Panel>

      {project && latestProof ? (
        <Panel
          title="Proof"
          description={`Version ${latestProof.version} · ${formatDate(latestProof.createdAt, "long")}`}
          actions={<Badge tone={latestProof.status === "approved_demo" ? "success" : "warning"}>{latestProof.status === "approved_demo" ? "Approved · demo" : "Waiting for you"}</Badge>}
        >
          <p className="text-ink-2">
            {latestProof.status === "approved_demo"
              ? "You approved this proof. In the real service, it would now go to the printer — here, the order stops before anything is made."
              : "Turn every page before approving. Once approved, a real order would go to print and can no longer be changed."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {config?.kind === "book" ? (
              <ButtonLink variant="secondary" href={`/proof/book/${config.id}`} target="_blank" leading={<FileText className="size-4" />}>
                Open proof
              </ButtonLink>
            ) : null}
            {latestProof.status !== "approved_demo" && order.status === "proof_required" ? (
              <>
                <Button onClick={() => void approve()} loading={busy === "approve"} leading={<Check className="size-4" />}>
                  Approve proof
                </Button>
                {config ? (
                  <ButtonLink variant="ghost" href={config.kind === "book" ? `/app/heirlooms/book-builder?id=${config.id}` : `/app/heirlooms/capsule-builder?id=${config.id}`} leading={<PenLine className="size-4" />}>
                    Make changes
                  </ButtonLink>
                ) : null}
                <Button variant="ghost" onClick={() => void regenerate()} loading={busy === "proof"} leading={<RotateCcw className="size-4" />}>
                  New proof from latest design
                </Button>
              </>
            ) : null}
          </div>
          {project.proofs.length > 1 ? (
            <p className="mt-4 text-[0.8125rem] text-ink-3">
              Earlier versions: {project.proofs.slice(1).map((p) => `v${p.version}`).join(", ")}
            </p>
          ) : null}
        </Panel>
      ) : null}

      {order.shippingTo ? (
        <Panel title="Shipping" actions={<Truck className="size-5 text-ink-3" />}>
          <address className="not-italic text-ink-2">
            {order.shippingTo.name}
            <br />
            {order.shippingTo.line1}
            {order.shippingTo.line2 ? `, ${order.shippingTo.line2}` : ""}
            <br />
            {order.shippingTo.city}, {order.shippingTo.region} {order.shippingTo.postalCode} · {order.shippingTo.country}
          </address>
          <p className="mt-3 text-[0.875rem] text-ink-3">No carrier is connected. Tracking will appear here once shipping is live.</p>
        </Panel>
      ) : null}

      <Panel title="History">
        <ol className="space-y-3">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="flex gap-3 text-[0.9375rem]">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-evergreen/60" />
              <span>
                <span className="font-medium">
                  <OrderStatusLabel status={h.status} />
                </span>{" "}
                <span className="text-ink-3">· {formatDate(h.at, "long")}</span>
                {h.note ? <span className="block text-[0.875rem] text-ink-3">{h.note}</span> : null}
              </span>
            </li>
          ))}
          {refund ? (
            <li className="flex gap-3 text-[0.9375rem]">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-warning" />
              <span>
                <span className="font-medium">Refund requested · demo</span> <span className="text-ink-3">· {formatDate(refund.requestedAt, "long")}</span>
                <span className="block text-[0.875rem] text-ink-3">“{refund.reason}” — support would reply within two working days.</span>
              </span>
            </li>
          ) : null}
        </ol>
      </Panel>

      <div className="flex flex-wrap items-center gap-2.5">
        {invoice ? (
          <InvoiceButton order={order} invoiceNumber={invoice.number} issuedAt={invoice.issuedAt} />
        ) : null}
        {canCancel ? (
          <Button variant="ghost" className="text-danger" leading={<X className="size-4" />} onClick={() => setCancelOpen(true)}>
            Cancel order
          </Button>
        ) : null}
        {canRefund && order.status !== "canceled_mock" ? (
          <Button variant="ghost" leading={<RotateCcw className="size-4" />} onClick={() => setRefundOpen(true)}>
            Request a refund
          </Button>
        ) : null}
        <Link href="/contact" className="ml-auto text-[0.875rem] text-link">
          Questions about an order?
        </Link>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel ${order.number}?`}
        tone="danger"
        confirmLabel="Cancel order"
        body="Nothing was charged, so there's nothing to refund. Any design stays saved."
        onConfirm={async () => {
          const r = await services().orders.cancel(order.id);
          setCancelOpen(false);
          if (r.status === "ok") toast.success("Order canceled", "Nothing was charged.");
          else toast.error(r.status === "error" ? r.message : "Couldn't cancel");
        }}
      />
      <Dialog open={refundOpen} onOpenChange={setRefundOpen} title="Request a refund" description="In the real service, refunds are reviewed by a person. Nothing was charged in this demo.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await services().orders.requestRefund(order.id, reason.trim());
            setRefundOpen(false);
            setReason("");
            if (r.status === "ok") toast.success("Refund request recorded · demo", "No money moves in the preview.");
          }}
        >
          <Field label="What went wrong?" htmlFor="rf-reason">
            <Textarea id="rf-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} required minLength={4} />
          </Field>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRefundOpen(false)}>
              Not now
            </Button>
            <Button type="submit" disabled={reason.trim().length < 4}>
              Send request
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function OrderStatusLabel({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = {
    draft: "Draft",
    preview: "Checkout started",
    payment_pending: "Payment pending",
    paid_mock: "Confirmed · demo",
    proof_required: "Proof ready",
    ready_for_fulfillment: "Proof approved",
    printing_mock: "Printing · simulated",
    shipped_mock: "Shipped · simulated",
    canceled_mock: "Canceled",
    refunded_mock: "Refunded · simulated",
  };
  return <>{labels[status]}</>;
}

/** Prints a simple demo invoice in a new window — clearly marked, never a real tax document. */
function InvoiceButton({ order, invoiceNumber, issuedAt }: { order: Order; invoiceNumber: string; issuedAt: string }) {
  const open = () => {
    const w = window.open("", "_blank", "noopener=no,width=760,height=900");
    if (!w) return toast.error("Allow pop-ups to view the invoice");
    const rows = order.items.map((i) => `<tr><td>${escapeHtml(i.name)}${i.quantity > 1 ? ` × ${i.quantity}` : ""}</td><td style="text-align:right">${formatMoney((i.unitAmount + i.extrasAmount) * i.quantity)}</td></tr>`).join("");
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${invoiceNumber} (demo)</title><style>body{font:15px/1.5 system-ui,sans-serif;color:#222;max-width:620px;margin:48px auto;padding:0 24px}h1{font:400 32px Georgia,serif;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:10px 0;border-bottom:1px solid #e5e0d6}.stamp{display:inline-block;margin-top:12px;padding:4px 10px;border:1px solid #9a5238;color:#9a5238;border-radius:99px;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.muted{color:#777}</style><h1>LifeAtlas</h1><div class="stamp">Demo invoice — nothing was charged</div><p class="muted">${invoiceNumber} · issued ${formatDate(issuedAt, "long")}<br>Order ${order.number} · ${escapeHtml(order.customerName)}</p><table>${rows}<tr><td>Shipping</td><td style="text-align:right">Not calculated</td></tr><tr><td>Tax</td><td style="text-align:right">Not calculated</td></tr><tr><td><strong>Total (test price)</strong></td><td style="text-align:right"><strong>${formatMoney(order.total)}</strong></td></tr></table><p class="muted">This is not a tax invoice. LifeAtlas is a preview; no payment details were collected.</p><button onclick="print()">Print</button>`);
    w.document.close();
  };
  return (
    <Button variant="secondary" leading={<FileText className="size-4" />} onClick={open}>
      Demo invoice
    </Button>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { InvitationStatus, MemoryPrivacy, MemoryStatus, OrderStatus, FutureMessageStatus } from "@/domain/models";
import { Badge, type StatusTone } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {back ? (
          <div className="mb-4">
            <Link href={back.href} className="inline-flex min-h-9 items-center gap-1 text-[0.875rem] text-ink-3 hover:text-ink">
              <ChevronLeft className="size-4" /> {back.label}
            </Link>
          </div>
        ) : null}
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="font-serif text-[clamp(2.1rem,1.6rem+1.8vw,3.2rem)] leading-[1.04] tracking-[-0.022em]">{title}</h1>
        {description ? <div className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-2">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("card-paper overflow-hidden", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title ? <h2 className="font-serif text-[1.45rem] leading-tight">{title}</h2> : null}
            {description ? <p className="mt-1 text-[0.9rem] text-ink-3">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

const memoryStatus: Record<MemoryStatus, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Waiting for review", tone: "warning" },
  under_review: { label: "In review", tone: "info" },
  approved: { label: "In the archive", tone: "success" },
  returned: { label: "Returned with a note", tone: "warning" },
  declined: { label: "Not included", tone: "danger" },
};

export function MemoryStatusBadge({ status }: { status: MemoryStatus }) {
  const s = memoryStatus[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

const privacy: Record<MemoryPrivacy, { label: string; tone: StatusTone }> = {
  private: { label: "Private", tone: "neutral" },
  organizers: { label: "Owner & editors", tone: "info" },
  selected: { label: "Selected people", tone: "info" },
  family: { label: "Family", tone: "brand" },
};

export function PrivacyBadge({ value }: { value: MemoryPrivacy }) {
  return <Badge tone={privacy[value].tone}>{privacy[value].label}</Badge>;
}

export const privacyCopy: Record<MemoryPrivacy, { label: string; description: string }> = {
  private: { label: "Only me", description: "Visible only to the person who added it and the capsule's owner. Editors don't see it." },
  organizers: { label: "Owner & editors", description: "The owner and editors only — good for drafts and sensitive stories." },
  selected: { label: "Selected people", description: "Only the people you choose, plus the owner and editors." },
  family: { label: "Family", description: "Everyone invited to this capsule. Never public." },
};

const invitation: Record<InvitationStatus, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  prepared: { label: "Link ready", tone: "info" },
  simulated_sent: { label: "Shared · preview", tone: "demo" },
  accepted_demo: { label: "Opened · preview", tone: "success" },
  expired_demo: { label: "Expired · preview", tone: "neutral" },
  revoked_demo: { label: "Revoked · preview", tone: "danger" },
  sent: { label: "Sent", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  expired: { label: "Expired", tone: "neutral" },
  revoked: { label: "Revoked", tone: "danger" },
};

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  return (
    <Badge tone={invitation[status].tone} dot>
      {invitation[status].label}
    </Badge>
  );
}

const order: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  preview: { label: "Preview", tone: "neutral" },
  payment_pending: { label: "Payment pending", tone: "warning" },
  paid_mock: { label: "Demo order · not charged", tone: "demo" },
  proof_required: { label: "Proof to review", tone: "warning" },
  ready_for_fulfillment: { label: "Proof approved · demo", tone: "info" },
  printing_mock: { label: "Printing · simulated", tone: "demo" },
  shipped_mock: { label: "Shipped · simulated", tone: "demo" },
  canceled_mock: { label: "Canceled", tone: "neutral" },
  refunded_mock: { label: "Refunded · simulated", tone: "neutral" },
};

/** `readyMade`: an order with nothing to proof — "ready" means ready to pack, never "proof approved". */
export function OrderStatusBadge({ status, readyMade }: { status: OrderStatus; readyMade?: boolean }) {
  return (
    <Badge tone={order[status].tone} dot>
      {readyMade && status === "ready_for_fulfillment" ? "Ready to pack · demo" : order[status].label}
    </Badge>
  );
}

export const futureStatusCopy: Record<FutureMessageStatus, { label: string; tone: StatusTone; explain: string }> = {
  draft: { label: "Draft", tone: "neutral", explain: "Saved on this device. Keep editing whenever you like." },
  prepared: { label: "Ready for review", tone: "info", explain: "Finished and ready to seal. Read it once more with fresh eyes." },
  sealed_demo: { label: "Sealed · demo", tone: "demo", explain: "Sealed in this preview with a content fingerprint. Not scheduled for delivery. You can unseal it." },
  sealed: { label: "Sealed", tone: "brand", explain: "Locked as an immutable snapshot." },
  scheduled: { label: "Scheduled", tone: "brand", explain: "Delivery confirmed by the delivery service." },
  delivery_attempted: { label: "Delivering", tone: "info", explain: "The delivery service is attempting delivery." },
  delivered: { label: "Delivered", tone: "success", explain: "Opened by the recipient." },
  failed: { label: "Delivery problem", tone: "danger", explain: "The delivery service could not deliver this letter." },
  canceled: { label: "Canceled", tone: "neutral", explain: "This letter will not be delivered." },
};

export function FutureStatusBadge({ status, example }: { status: FutureMessageStatus; example?: boolean }) {
  if (example) return <Badge tone="demo">Example only</Badge>;
  const s = futureStatusCopy[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="font-serif text-[2.4rem] leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-2 text-[0.875rem] font-medium text-ink-2">{label}</p>
      {hint ? <p className="text-[0.8125rem] text-ink-3">{hint}</p> : null}
    </div>
  );
}

export function DefinitionList({ items }: { items: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-6 py-2.5 text-[0.9375rem]">
          <dt className="text-ink-3">{k}</dt>
          <dd className="text-right text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

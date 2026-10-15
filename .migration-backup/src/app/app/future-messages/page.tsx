"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, History, Lock, LockOpen, PenLine, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { FutureMessage } from "@/domain/models";
import { PageHeader, FutureStatusBadge, futureStatusCopy, Panel } from "@/components/studio/primitives";
import { SealedLetter } from "@/components/marketing/objects";
import { LetterOpening } from "@/components/future/letter-opening";
import { DeliveryLadderSummary } from "@/components/future/delivery-ladder";
import { releaseLabel } from "@/domain/future-release";
import { SuccessorPanel } from "@/components/studio/successor-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, EmptyState, toast } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/field";
import { ConfirmDialog, Dialog } from "@/components/ui/overlay";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { describeInterval } from "@/lib/dates";
import { formatDate, relativeTime } from "@/lib/utils";

type Tab = "draft" | "prepared" | "sealed_demo" | "pending" | "example";

export default function FutureMessagesPage() {
  const letters = useDb((d) => d.futureMessages);
  const unfinished = useDb((d) => d.letterDrafts);
  const [tab, setTab] = React.useState<Tab>("draft");
  const [preview, setPreview] = React.useState<FutureMessage | null>(null);
  const [del, setDel] = React.useState<FutureMessage | null>(null);

  const byTab: Record<Tab, FutureMessage[]> = {
    draft: letters.filter((l) => !l.isExample && l.status === "draft"),
    prepared: letters.filter((l) => !l.isExample && l.status === "prepared"),
    sealed_demo: letters.filter((l) => !l.isExample && l.status === "sealed_demo"),
    pending: letters.filter((l) => !l.isExample && (l.status === "sealed_demo" || l.status === "prepared")),
    example: letters.filter((l) => l.isExample),
  };
  const list = byTab[tab];

  const seal = async (l: FutureMessage) => {
    const r = await services().futureDelivery.sealDemo(l.id);
    if (r.status === "ok") toast.success("Sealed in this demo", `Fingerprint ${r.data.snapshotHash?.slice(0, 10)}… · Not scheduled for delivery.`);
    else toast.error("Couldn't seal", r.status === "error" ? r.message : undefined);
  };
  const unseal = async (l: FutureMessage) => {
    const r = await services().futureDelivery.transition(l.id, "draft");
    if (r.status === "ok") toast.success("Unsealed — back to draft");
  };
  const schedule = async () => {
    const r = await services().futureDelivery.schedule("x");
    if (r.status === "not_configured") toast.info("Long-term delivery coming later", r.message);
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow="Letters Through Time · Preview feature"
        title="Words for a day that hasn't come yet."
        description="Write letters and record messages for the future. You can draft, preview and seal them here. Long-term delivery isn't available yet — nothing is scheduled."
        actions={
          <ButtonLink href="/app/future-messages/new" leading={<Plus className="size-4" />}>
            Write a letter
          </ButtonLink>
        }
      />
      <DemoNotice className="mb-8" title="Future message drafts — not scheduled for delivery">
        Letters live on this device. Delivery 5, 10, 20 or 30 years from now needs a service with verified contacts, succession, backups and legal review. We won&rsquo;t sell it until those exist.
      </DemoNotice>

      {unfinished.length ? (
        <Panel title="Unfinished writing" description="Kept on this device as you typed. Pick up where you left off, then save it as a letter." className="mb-8">
          <ul className="divide-y divide-line">
            {unfinished.map((d) => {
              const title = String(d.values.title ?? "").trim() || "Untitled letter";
              const to = String(d.values.recipientName ?? "").trim();
              return (
                <li key={d.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <History className="size-4 shrink-0 text-brass-ink" aria-hidden />
                  <p className="min-w-0 flex-1">
                    <span className="font-medium">{title}</span>
                    <span className="text-[0.875rem] text-ink-3">
                      {to ? ` · for ${to}` : ""} · {d.letterId ? "changes to a saved letter" : "new letter"} · {relativeTime(d.updatedAt)}
                    </span>
                  </p>
                  <div className="flex gap-1">
                    <ButtonLink size="sm" variant="secondary" href={d.letterId ? `/app/future-messages/new?id=${d.letterId}` : "/app/future-messages/new"} aria-label={`Continue writing ${title}`}>
                      Continue
                    </ButtonLink>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Discard unfinished writing for ${title}`}
                      onClick={async () => {
                        await services().drafts.discardLetterDraft(d.key);
                        toast.success("Unfinished writing discarded", d.letterId ? "The saved letter is unchanged." : undefined, {
                          label: "Undo",
                          onClick: () => void services().drafts.saveLetterDraft({ key: d.key, letterId: d.letterId, capsuleId: d.capsuleId, values: d.values, attachmentIds: d.attachmentIds, birthYear: d.birthYear }),
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Segmented
        label="Letter status"
        value={tab}
        onChange={setTab}
        className="scrollbar-none mb-8 max-w-full overflow-x-auto"
        options={[
          { value: "draft", label: `Drafts ${byTab.draft.length}` },
          { value: "prepared", label: `Ready for review ${byTab.prepared.length}` },
          { value: "sealed_demo", label: `Sealed · demo ${byTab.sealed_demo.length}` },
          { value: "pending", label: `Waiting for the service ${byTab.pending.length}` },
          { value: "example", label: "Delivered example" },
        ]}
      />

      {tab === "pending" ? (
        <Panel title="What delivery will need" className="mb-6">
          <ul className="grid gap-4 text-[0.9375rem] sm:grid-cols-2">
            {[
              ["An immutable snapshot", "Sealing freezes the exact content with a fingerprint, stored in independent backups."],
              ["Verified recipients", "Contacts confirmed now, and re-confirmed every two years until the day."],
              ["A successor", "Someone you trust who can act if you can't — verified, never automatic."],
              ["Continuity & legal review", "A plan for company changes, data portability and estate rules before anything is sold."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ink-3" />
                <span>
                  <strong className="font-medium">{t}.</strong> <span className="text-ink-2">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-5" onClick={() => void schedule()}>
            Try scheduling delivery
          </Button>
        </Panel>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          title={tab === "draft" ? "No drafts" : "Nothing here"}
          body={tab === "draft" ? "A letter for a wedding day, a thirtieth birthday, a first child. Start with a few lines — you can return to it any time." : "Letters move here as you prepare and seal them."}
          action={tab === "draft" ? <ButtonLink href="/app/future-messages/new">Write a letter</ButtonLink> : null}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {list.map((l) => (
            <article key={l.id} className="card-paper flex flex-col p-6">
              <SealedLetter to={l.recipient.name} openOn={releaseLabel(l.release)} className="mx-auto" />
              <div className="mt-6 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-[1.6rem] leading-tight">{l.title}</h2>
                  <p className="mt-1 text-[0.875rem] text-ink-3">
                    From {l.authorName} · for {l.recipient.name} ({l.recipient.relationship.toLowerCase()})
                  </p>
                </div>
                <FutureStatusBadge status={l.status} example={l.isExample} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.8125rem]">
                <div>
                  <dt className="text-ink-4">Opens</dt>
                  <dd>
                    {formatDate(l.release.date)} · {describeInterval(l.release.date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-4">Recipient contact</dt>
                  <dd>{l.recipient.contactStatus === "not_provided" ? "Not provided" : "Unverified — verification arrives with the service"}</dd>
                </div>
                {l.backupRecipient ? (
                  <div>
                    <dt className="text-ink-4">Backup recipient</dt>
                    <dd>{l.backupRecipient.name}</dd>
                  </div>
                ) : null}
                {l.snapshotHash ? (
                  <div>
                    <dt className="text-ink-4">Content fingerprint</dt>
                    <dd className="font-mono">{l.snapshotHash.slice(0, 16)}…</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-4 text-[0.875rem] text-ink-3">{l.isExample ? "A sample showing how opening day will feel. Not a real delivery." : futureStatusCopy[l.status].explain}</p>
              {l.isExample ? null : <DeliveryLadderSummary message={l} className="mt-4" />}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button size="sm" variant="secondary" leading={<Eye className="size-4" />} onClick={() => setPreview(l)}>
                  Preview opening
                </Button>
                {!l.isExample && l.status !== "sealed_demo" ? (
                  <ButtonLink size="sm" variant="ghost" href={`/app/future-messages/new?id=${l.id}`} leading={<PenLine className="size-4" />}>
                    Edit
                  </ButtonLink>
                ) : null}
                {!l.isExample && (l.status === "draft" || l.status === "prepared") ? (
                  <Button size="sm" variant="ghost" leading={<Lock className="size-4" />} onClick={() => void seal(l)}>
                    Seal (demo)
                  </Button>
                ) : null}
                {!l.isExample && l.status === "sealed_demo" ? (
                  <Button size="sm" variant="ghost" leading={<LockOpen className="size-4" />} onClick={() => void unseal(l)}>
                    Unseal
                  </Button>
                ) : null}
                {!l.isExample ? (
                  <Button size="sm" variant="ghost" className="text-danger" leading={<Trash2 className="size-4" />} onClick={() => setDel(l)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <SuccessorPanel className="mt-10" defaultScope="future_messages" />

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)} title="Opening preview" hideTitle size="xl" className="bg-night">
        <div className="-mx-6 -mb-6 bg-night px-6 py-10 sm:-mx-8 sm:px-8">{preview ? <LetterOpening message={preview} mode={preview.isExample ? "example" : "preview"} /> : null}</div>
        <p className="mt-4 text-center text-[0.8125rem] text-night-ink-3">Simulated opening — no letter was delivered.</p>
      </Dialog>
      <ConfirmDialog
        open={!!del}
        onOpenChange={(v) => !v && setDel(null)}
        title="Delete this letter?"
        tone="danger"
        confirmLabel="Delete letter"
        body={<>“{del?.title}” will be removed from this device. This can&rsquo;t be undone.</>}
        onConfirm={async () => {
          if (del) await services().futureDelivery.remove(del.id);
          setDel(null);
          toast.success("Letter deleted");
        }}
      />
      <p className="mt-10 text-center text-[0.875rem] text-ink-3">
        Curious how it will work? <Link href="/letters-through-time" className="text-link">Read about Letters Through Time</Link>
      </p>
    </div>
  );
}

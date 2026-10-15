"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, FileText, FlaskConical, PenLine, Trash2 } from "lucide-react";
import type { HeirloomConfiguration } from "@/domain/models";
import { PageHeader } from "@/components/studio/primitives";
import { BookObject, KeepsakeBox } from "@/components/marketing/objects";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice, toast } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { formatMoney, pluralize, relativeTime } from "@/lib/utils";

const statusLabel: Record<HeirloomConfiguration["status"], { label: string; tone: "neutral" | "info" | "demo" }> = {
  editing: { label: "Design saved", tone: "neutral" },
  in_cart: { label: "In your bag", tone: "info" },
  ordered_demo: { label: "Demo order placed", tone: "demo" },
};

export default function HeirloomsPage() {
  const heirlooms = useDb((d) => d.heirlooms);
  const capsules = useDb((d) => d.capsules);
  const catalog = useDb((d) => d.catalog);
  const projects = useDb((d) => d.printProjects);
  const [remove, setRemove] = React.useState<HeirloomConfiguration | null>(null);
  const book = catalog.find((p) => p.id === "book");
  const box = catalog.find((p) => p.id === "keepsake_box");

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow="Heirlooms · Preview"
        title={
          <>
            Made to <em>hold.</em>
          </>
        }
        description="Some stories belong in your hands. Design a printed book or a keepsake box from the stories your family has approved, and walk through a demo order to see exactly how it will work."
      />
      <DemoNotice className="mb-10" title="Printing and fulfillment aren't connected">
        Designs and proofs are real and saved on this device. Prices are test amounts; demo orders don&rsquo;t charge anything and nothing is printed or shipped.
      </DemoNotice>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="card-paper group flex flex-col overflow-hidden">
          <div className="grid h-[340px] place-items-center bg-[radial-gradient(90%_80%_at_50%_30%,#f3eee3,#e2d9c6)]">
            <BookObject color="evergreen" material="linen" foil="brass" className="transition-transform duration-700 ease-[var(--ease-out)] group-hover:-translate-y-1.5" />
          </div>
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-serif text-[2rem] leading-tight">The Printed Life Book</h2>
              <p className="shrink-0 text-[0.9375rem] text-ink-2">from {book ? formatMoney(book.price.amount) : "Not set"}</p>
            </div>
            <p className="mt-2 text-ink-2">A designed memoir of approved stories and photographs, in linen, cloth or soft-touch. Turn every page and approve a proof first.</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              <ButtonLink href="/app/heirlooms/book-builder" trailing={<ArrowRight className="size-4" />}>
                Design a book
              </ButtonLink>
              <ButtonLink href="/heirlooms/book" variant="ghost">
                About the book
              </ButtonLink>
            </div>
          </div>
        </article>
        <article className="card-paper group flex flex-col overflow-hidden">
          <div className="grid h-[340px] place-items-center bg-[radial-gradient(90%_80%_at_50%_30%,#f1ece2,#d9cfba)] px-6">
            <KeepsakeBox finish="walnut" engraving="Margaret Ellis · 1940, " className="max-w-[380px]" />
          </div>
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-serif text-[2rem] leading-tight">The Physical LifeCapsule</h2>
              <p className="shrink-0 text-[0.9375rem] text-ink-2">from {box ? formatMoney(box.price.amount) : "Not set"}</p>
            </div>
            <p className="mt-2 text-ink-2">A finished wooden box for display: the book, printed letters, photographs, a preservation guide and an archive copy.</p>
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              <ButtonLink href="/app/heirlooms/capsule-builder" trailing={<ArrowRight className="size-4" />}>
                Design a box
              </ButtonLink>
              <ButtonLink href="/heirlooms/time-capsule" variant="ghost">
                Display vs. burial
              </ButtonLink>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-[20px] border border-dashed border-line-strong px-6 py-5 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-3">
          <FlaskConical className="size-5" />
        </span>
        <p className="flex-1 text-[0.9375rem] text-ink-2">
          <strong className="font-medium text-ink">The Legacy Capsule is a concept.</strong> A burial-capable capsule won&rsquo;t be offered until its materials are independently tested and certified. We make no durability claims before then.
        </p>
        <Badge tone="neutral">Not available</Badge>
      </div>

      <section className="mt-14" aria-labelledby="designs-h">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="designs-h" className="font-serif text-[1.9rem]">
            Your designs
          </h2>
          <p className="text-[0.875rem] text-ink-3">{pluralize(heirlooms.length, "design")}</p>
        </div>
        {heirlooms.length === 0 ? (
          <p className="mt-6 rounded-[16px] bg-ivory/60 px-6 py-8 text-center text-ink-2">Nothing designed yet. Start with a book, it takes about ten minutes.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {heirlooms.map((h) => {
              const cap = capsules.find((c) => c.id === h.capsuleId);
              const project = projects.find((p) => p.configurationId === h.id);
              const s = statusLabel[h.status];
              const editHref = h.kind === "book" ? `/app/heirlooms/book-builder?id=${h.id}` : `/app/heirlooms/capsule-builder?id=${h.id}`;
              return (
                <li key={h.id} className="card-paper flex gap-5 p-5">
                  <div className="grid w-24 shrink-0 place-items-center">
                    {h.kind === "book" && h.book ? <BookObject size="sm" title={h.book.title} subtitle={h.book.subtitle} years="" color={h.book.color} material={h.book.material} foil={h.book.foil} className="!w-[88px]" /> : (
                      <div className="relative h-24 w-24 overflow-hidden" aria-hidden>
                        <div className="absolute left-1/2 top-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2 scale-[0.24]">
                          <KeepsakeBox finish={h.box?.finish ?? "walnut"} engraving="" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {project ? <Badge tone="info">Proof v{project.proofs[0]?.version} · {project.proofs[0]?.status === "approved_demo" ? "approved" : "to review"}</Badge> : null}
                    </div>
                    <h3 className="mt-2 font-serif text-[1.35rem] leading-tight">{h.name}</h3>
                    <p className="mt-1 text-[0.875rem] text-ink-3">
                      {cap?.subjectName}
                      {h.estimatedPages ? ` · about ${h.estimatedPages} pages` : ""}
                      {h.book ? ` · ${pluralize(h.book.copies, "copy", "copies")}` : ""} · updated {relativeTime(h.updatedAt)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <ButtonLink size="sm" variant="secondary" href={editHref} leading={<PenLine className="size-4" />}>
                        {h.status === "ordered_demo" ? "Open design" : "Edit"}
                      </ButtonLink>
                      <ButtonLink size="sm" variant="ghost" href={h.kind === "book" ? `/proof/book/${h.id}` : `/proof/box/${h.id}`} target="_blank" leading={<FileText className="size-4" />}>
                        Proof
                      </ButtonLink>
                      {project?.orderId ? (
                        <ButtonLink size="sm" variant="ghost" href={`/app/orders#${project.orderId}`}>
                          View order
                        </ButtonLink>
                      ) : null}
                      {h.status !== "ordered_demo" ? (
                        <Button size="sm" variant="ghost" className="text-danger" leading={<Trash2 className="size-4" />} onClick={() => setRemove(h)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-12 text-center text-[0.875rem] text-ink-3">
        Prefer a portable copy? Every capsule can be <Link href="/app/preservation" className="text-link">exported as an open archive</Link> at any time, free.
      </p>

      <ConfirmDialog
        open={!!remove}
        onOpenChange={(v) => !v && setRemove(null)}
        title="Remove this design?"
        tone="danger"
        confirmLabel="Remove design"
        body={<>“{remove?.name}” will be removed from this device. Your stories aren&rsquo;t affected.</>}
        onConfirm={async () => {
          if (!remove) return;
          const r = await services().heirlooms.remove(remove.id);
          setRemove(null);
          if (r.status === "ok") toast.success("Design removed");
          else toast.error(r.status === "error" ? r.message : "Couldn't remove");
        }}
      />
    </div>
  );
}

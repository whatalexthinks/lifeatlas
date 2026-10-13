"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/studio/primitives";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { pluralize, relativeTime } from "@/lib/utils";

export default function CapsulesPage() {
  const capsules = useDb((d) => d.capsules);
  const memories = useDb((d) => d.memories);
  const group = useDb((d) => d.familyGroups[0]);
  const [filter, setFilter] = React.useState<"all" | "active" | "draft" | "archived">("all");
  const list = capsules.filter((c) => filter === "all" || c.status === filter || (filter === "archived" && c.status === "deletion_pending"));

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow={group?.name ?? "Your family"}
        title="Capsules"
        description={group?.description ?? "One capsule per life. Link them into a family collection."}
        actions={
          <ButtonLink href="/app/capsules/new" leading={<Plus className="size-4" />}>
            New capsule
          </ButtonLink>
        }
      />
      <Segmented
        label="Filter capsules"
        value={filter}
        onChange={setFilter}
        className="mb-8"
        options={[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "draft", label: "Drafts" },
          { value: "archived", label: "Archived" },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Nothing here" body="No capsules match this filter." />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const ms = memories.filter((m) => m.capsuleId === c.id && !m.deletedAt);
            const approved = ms.filter((m) => m.status === "approved");
            const voices = approved.filter((m) => m.audioId).length;
            const waiting = ms.filter((m) => m.status === "submitted" || m.status === "under_review").length;
            return (
              <Link key={c.id} href={`/app/capsules/${c.id}`} className="group block">
                <CapsuleCover capsule={c} size="md" className="aspect-[4/5] rounded-[22px] shadow-sm transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-lg" />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-[1.6rem] leading-tight">{c.subjectName}</p>
                    <p className="mt-0.5 text-[0.875rem] text-ink-3">
                      {pluralize(approved.length, "story", "stories")} · {pluralize(voices, "voice")} · updated {relativeTime(c.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {c.status !== "active" ? <Badge tone={c.status === "deletion_pending" ? "danger" : "neutral"}>{c.status === "draft" ? "Draft" : c.status === "archived" ? "Archived" : "Deletion pending"}</Badge> : null}
                    {waiting ? <Badge tone="warning">{waiting} to review</Badge> : null}
                  </div>
                </div>
              </Link>
            );
          })}
          <Link href="/app/capsules/new" className="group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-line-strong text-ink-3 transition-colors hover:border-evergreen hover:text-evergreen">
            <span className="grid size-14 place-items-center rounded-full bg-ivory transition-colors group-hover:bg-evergreen group-hover:text-[#f8f6f1]">
              <Plus className="size-6" />
            </span>
            <span className="font-serif text-[1.4rem]">Start another life story</span>
            <span className="text-[0.875rem]">A parent, a grandparent, or yourself</span>
          </Link>
        </div>
      )}
    </div>
  );
}

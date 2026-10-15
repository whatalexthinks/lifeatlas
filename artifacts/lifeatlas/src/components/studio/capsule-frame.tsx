"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { useParams, usePathname } from "@/lib/router/navigation";
import { ArrowUpRight, ChevronLeft, MailPlus, Plus } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { MemoryEditorSheet } from "./memory-editor";
import { useCapsule, useCapsuleMemories, useDb, usePendingReviewCount } from "@/hooks/use-data";
import { cn, pluralize } from "@/lib/utils";

interface CapsuleCtx {
  capsule: Capsule;
  openMemory: (id: string) => void;
  hrefFor: (m: Memory) => string;
}

const Ctx = React.createContext<CapsuleCtx | null>(null);

export function useStudioCapsule() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useStudioCapsule outside CapsuleFrame");
  return c;
}

const statusTone = { draft: "neutral", active: "success", archived: "neutral", deletion_pending: "danger" } as const;
const statusLabel = { draft: "Draft", active: "Active", archived: "Archived", deletion_pending: "Deletion pending" } as const;

export function CapsuleFrame({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const capsule = useCapsule(id);
  const memories = useCapsuleMemories(id, { scope: "studio" });
  const allMemories = useDb((d) => d.memories);
  const pending = usePendingReviewCount(id);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const editing = allMemories.find((m) => m.id === openId);

  if (!capsule) {
    return (
      <EmptyState
        className="mx-auto mt-10 max-w-xl"
        title="We couldn't find that capsule"
        body="It may have been deleted, or created in another browser — capsules in this preview live only on the device where they were made."
        action={<ButtonLink href="/app/capsules">See your capsules</ButtonLink>}
      />
    );
  }

  const base = `/app/capsules/${capsule.id}`;
  const tabs: [string, string, number?][] = [
    ["Overview", base],
    ["Memories", `${base}/memories`, pending || undefined],
    ["Timeline", `${base}/timeline`],
    ["Map", `${base}/map`],
    ["Photos", `${base}/gallery`],
    ["Voices", `${base}/voices`],
    ["Chapters", `${base}/chapters`],
    ["Questions", `${base}/questions`],
    ["People", `${base}/people`],
    ["Privacy", `${base}/privacy`],
    ["Export", `${base}/export`],
  ];
  const approved = memories.filter((m) => m.status === "approved").length;

  return (
    <Ctx.Provider value={{ capsule, openMemory: setOpenId, hrefFor: (m) => `${base}/memories?open=${m.id}` }}>
      <div className="mx-auto max-w-[1240px]">
        <Link href="/app/capsules" className="mb-5 inline-flex items-center gap-1 text-[0.875rem] text-ink-3 hover:text-ink">
          <ChevronLeft className="size-4" /> All capsules
        </Link>
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-5">
            <Link href={`${base}/edit`} aria-label="Edit cover" className="shrink-0">
              <CapsuleCover capsule={capsule} size="sm" showMeta={false} className="aspect-[4/5] w-24 rounded-[14px] shadow-md sm:w-28" />
            </Link>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[capsule.status]} dot>
                  {statusLabel[capsule.status]}
                </Badge>
                {capsule.isSample ? <Badge tone="demo">Sample family</Badge> : <Badge tone="demo">This device only</Badge>}
              </div>
              <h1 className="mt-2.5 font-serif text-[clamp(2.2rem,1.8rem+1.6vw,3.2rem)] leading-[1] tracking-[-0.022em]">{capsule.subjectName}</h1>
              <p className="mt-1.5 text-[0.9375rem] text-ink-3">
                {capsule.title} · {capsule.relationship} · {pluralize(approved, "story", "stories")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/app/gather?capsule=${capsule.id}`} leading={<Plus className="size-4" />}>
              Gather a memory
            </ButtonLink>
            <ButtonLink href={`/app/invitations?new=1&capsule=${capsule.id}`} variant="secondary" leading={<MailPlus className="size-4" />}>
              Invite
            </ButtonLink>
            <ButtonLink href={`/view/${capsule.id}`} variant="secondary" trailing={<ArrowUpRight className="size-4" />}>
              View
            </ButtonLink>
          </div>
        </header>
        <nav aria-label="Capsule sections" className="scrollbar-none -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          {tabs.map(([label, href, badge]) => {
            const on = href === base ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn("relative inline-flex shrink-0 items-center gap-1.5 px-3 pb-3 pt-1 text-[0.9375rem] transition-colors", on ? "font-medium text-ink" : "text-ink-3 hover:text-ink")}
              >
                {label}
                {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1.5 text-[0.6875rem] font-semibold text-white">{badge}</span> : null}
                {on ? <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-evergreen" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="pt-8">{children}</div>
      </div>
      <MemoryEditorSheet memory={editing} capsule={capsule} open={!!editing} onOpenChange={(v) => !v && setOpenId(null)} />
    </Ctx.Provider>
  );
}

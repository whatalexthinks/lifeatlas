"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Rows3, Search, Undo2 } from "lucide-react";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { MemoryCard } from "@/components/capsule/memory-card";
import { Button } from "@/components/ui/button";
import { EmptyState, toast } from "@/components/ui/feedback";
import { Input, Segmented, Select } from "@/components/ui/field";
import { useCapsuleMemories, useDb, type MemoryQuery } from "@/hooks/use-data";
import { chapters } from "@/data/chapters";
import { decadesOf, catalogNumber } from "@/lib/memory-utils";
import { services } from "@/services/factory";
import { relativeTime } from "@/lib/utils";

type Tab = "all" | "archive" | "waiting" | "drafts" | "deleted";

function MemoriesInner() {
  const { capsule, openMemory } = useStudioCapsule();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = React.useState<Tab>("all");
  const [search, setSearch] = React.useState("");
  const [chapter, setChapter] = React.useState("");
  const [decade, setDecade] = React.useState("");
  const [type, setType] = React.useState<"" | "photo" | "audio" | "text">("");
  const [person, setPerson] = React.useState(params.get("person") ?? "");
  const [layout, setLayout] = React.useState<"grid" | "rows">("grid");
  const people = useDb((d) => d.people);

  React.useEffect(() => {
    const open = params.get("open");
    if (open) {
      openMemory(open);
      router.replace(pathname, { scroll: false });
    }
  }, [params, openMemory, router, pathname]);

  const q: MemoryQuery = { scope: tab === "deleted" ? "deleted" : "studio", search, chapter: chapter || undefined, decade: decade ? Number(decade) : undefined, type: type || undefined, personId: person || undefined };
  const base = useCapsuleMemories(capsule.id, q);
  const all = useCapsuleMemories(capsule.id, { scope: "studio" });
  const deletedCount = useCapsuleMemories(capsule.id, { scope: "deleted" }).length;
  const list = base.filter((m) => (tab === "archive" ? m.status === "approved" : tab === "waiting" ? m.status === "submitted" || m.status === "under_review" || m.status === "returned" : tab === "drafts" ? m.status === "draft" : true));
  const counts = {
    all: all.length,
    archive: all.filter((m) => m.status === "approved").length,
    waiting: all.filter((m) => ["submitted", "under_review", "returned"].includes(m.status)).length,
    drafts: all.filter((m) => m.status === "draft").length,
    deleted: deletedCount,
  };
  const decades = decadesOf(all);
  const peopleIn = people.filter((p) => all.some((m) => m.peopleIds.includes(p.id) || m.attribution.personId === p.id));
  const ordered = all.filter((m) => m.status === "approved");

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Memory status"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: `All ${counts.all}` },
            { value: "archive", label: `In archive ${counts.archive}` },
            { value: "waiting", label: `Waiting ${counts.waiting}` },
            { value: "drafts", label: `Drafts ${counts.drafts}` },
            { value: "deleted", label: `Recently deleted ${counts.deleted}` },
          ]}
          className="scrollbar-none max-w-full overflow-x-auto"
        />
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stories, tags, people" className="h-11 rounded-full pl-10" aria-label="Search memories" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Select value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Chapter" className="h-10 w-40 rounded-full text-[0.875rem]">
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <Select value={decade} onChange={(e) => setDecade(e.target.value)} aria-label="Decade" className="h-10 w-36 rounded-full text-[0.875rem]">
          <option value="">Any decade</option>
          {decades.map((d) => (
            <option key={d} value={d}>
              {d}s
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Type" className="h-10 w-36 rounded-full text-[0.875rem]">
          <option value="">Any type</option>
          <option value="photo">With photos</option>
          <option value="audio">With voice</option>
          <option value="text">Words only</option>
        </Select>
        <Select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person" className="h-10 w-44 rounded-full text-[0.875rem]">
          <option value="">Anyone</option>
          {peopleIn.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </Select>
        <Segmented
          label="Layout"
          size="sm"
          className="ml-auto"
          value={layout}
          onChange={setLayout}
          options={[
            { value: "grid", label: "Grid", icon: <LayoutGrid className="size-3.5" /> },
            { value: "rows", label: "List", icon: <Rows3 className="size-3.5" /> },
          ]}
        />
      </div>

      <p className="mt-6 text-[0.875rem] text-ink-3" aria-live="polite">
        {list.length} {list.length === 1 ? "memory" : "memories"}
        {tab === "deleted" ? " · deleted memories are hidden from the archive and exports" : ""}
      </p>

      {list.length === 0 ? (
        <EmptyState className="mt-6" title={tab === "deleted" ? "Nothing deleted" : "No memories match"} body={tab === "deleted" ? "Deleted memories wait here so you can restore them." : "Try clearing a filter, or gather a new memory."} />
      ) : layout === "grid" ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <div key={m.id} className="relative">
              <MemoryCard memory={m} onClick={() => openMemory(m.id)} showStatus catalog={m.status === "approved" ? catalogNumber(m, ordered) : undefined} />
              {tab === "deleted" ? <RestoreButton id={m.id} deletedAt={m.deletedAt!} /> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-line rounded-[20px] border border-line bg-surface/50 p-2">
          {list.map((m) => (
            <div key={m.id} className="relative">
              <MemoryCard memory={m} layout="row" onClick={() => openMemory(m.id)} showStatus catalog={m.status === "approved" ? catalogNumber(m, ordered) : undefined} />
              {tab === "deleted" ? <RestoreButton id={m.id} deletedAt={m.deletedAt!} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RestoreButton({ id, deletedAt }: { id: string; deletedAt: string }) {
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-surface/95 py-1 pl-3 pr-1 text-[0.75rem] text-ink-3 shadow-sm">
      Deleted {relativeTime(deletedAt)}
      <Button
        size="sm"
        variant="secondary"
        className="h-7 px-2.5 text-[0.75rem]"
        leading={<Undo2 className="size-3.5" />}
        onClick={async (e) => {
          e.stopPropagation();
          await services().capsules.restoreMemory(id);
          toast.success("Memory restored");
        }}
      >
        Restore
      </Button>
    </div>
  );
}

export default function MemoriesPage() {
  return (
    <Suspense fallback={null}>
      <MemoriesInner />
    </Suspense>
  );
}

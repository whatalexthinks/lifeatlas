"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, Database, Download, FileText, Gift, HardDrive, Mail, MessageSquarePlus, RotateCcw } from "lucide-react";
import type { PersonaKind } from "@/domain/models";
import type { SimulatedEvent } from "@/services/contracts";
import { Avatar } from "@/components/studio/persona-switcher";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, Skeleton, toast } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb, useHydrated, usePersistence } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { useDemoStore } from "@/store/demo-store";
import { cn, downloadBlob, relativeTime } from "@/lib/utils";
import { brand } from "@/config/brand";

const landing: Record<PersonaKind, { href: string; label: string }> = {
  organizer: { href: "/app", label: "Studio home" },
  storyteller: { href: "/app/gather", label: "Answer a question" },
  contributor: { href: "/contribute/emma-blue-bowl", label: "Contribute link" },
  viewer: { href: "/view/cap_margaret", label: "Family viewer" },
  operations: { href: "/demo/operations", label: "Operations" },
};

const simulations: { event: SimulatedEvent; title: string; body: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { event: "contribution", title: "A relative sends a story", body: "Daniel submits a memory through his invitation. It lands in review.", icon: MessageSquarePlus },
  { event: "invitation_opened", title: "An invitation is opened", body: "The next waiting invitation is marked opened, with a notification.", icon: Mail },
  { event: "proof_ready", title: "A new book proof arrives", body: "The fulfillment mock produces the next proof version.", icon: FileText },
  { event: "storage_warning", title: "The device runs low on space", body: `Shows how ${brand.name} warns before recordings fail.`, icon: HardDrive },
];

const journeys = [
  { href: "/app/capsules/new", label: "Create a capsule", note: "The guided wizard" },
  { href: "/contribute/emma-blue-bowl", label: "Answer as a contributor", note: "Invitation link, no account" },
  { href: "/gift/for-grandpa-walt", label: "Open a gift", note: "What the recipient sees" },
  { href: "/future/open/example-opening", label: "Open a future letter", note: "The opening-day example" },
  { href: "/app/heirlooms/book-builder", label: "Design a book", note: "Spreads, proof and demo order" },
  { href: "/app/together", label: "Holiday session", note: "Pass the device" },
];

export default function ControlCenterPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const db = useDb((d) => d);
  const persistence = usePersistence();
  const reset = useDemoStore((s) => s.reset);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [running, setRunning] = React.useState<SimulatedEvent | null>(null);

  if (!hydrated) return <Skeleton className="h-[70vh] w-full" />;

  const counts: [string, number][] = [
    ["Capsules", db.capsules.length],
    ["Memories", db.memories.filter((m) => !m.deletedAt).length],
    ["In review", db.memories.filter((m) => m.status === "submitted" || m.status === "under_review").length],
    ["Media files", db.media.length],
    ["Invitations", db.invitations.length],
    ["Letters", db.futureMessages.length],
    ["Orders", db.orders.length],
    ["Audit events", db.auditEvents.length],
  ];

  const act = async (personaId: string, href: string) => {
    await services().auth.switchPersona(personaId);
    router.push(href);
  };

  return (
    <div>
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">Demo control center</p>
        <h1 className="mt-3 font-sans text-[clamp(2.2rem,1.7rem+1.8vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.05em]">
          Every view, <em className="font-serif font-normal tracking-[-0.03em]">one browser.</em>
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">Step into each family member&rsquo;s shoes, play events through the real code paths, and reset whenever you like. Everything here affects only this device.</p>
      </div>

      <section aria-labelledby="personas-h">
        <h2 id="personas-h" className="text-[1.0625rem] font-medium">
          Act as
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {db.personas.map((p) => {
            const active = p.id === db.activePersonaId;
            const dest = landing[p.kind];
            return (
              <li key={p.id} className={cn("card-paper flex flex-col p-5", active && "ring-2 ring-evergreen")}>
                <div className="flex items-center justify-between gap-2">
                  <Avatar name={p.name} kind={p.kind} />
                  {active ? <Badge tone="brand">Current</Badge> : null}
                </div>
                <p className="mt-4 font-medium">{p.name}</p>
                <p className="mt-1 flex-1 text-[0.875rem] leading-relaxed text-ink-3">{p.description}</p>
                <Button size="sm" variant={active ? "secondary" : "primary"} className="mt-4" trailing={<ArrowUpRight className="size-4" />} onClick={() => void act(p.id, dest.href)}>
                  {dest.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="sim-h" className="card-paper p-6">
          <h2 id="sim-h" className="flex items-center gap-2 text-[1.0625rem] font-medium">
            <Bell className="size-5 text-ink-3" /> Simulate an event
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {simulations.map((s) => (
              <li key={s.event}>
                <button
                  type="button"
                  disabled={!!running}
                  onClick={async () => {
                    setRunning(s.event);
                    const r = await services().operations.simulate(s.event);
                    setRunning(null);
                    if (r.status === "ok") toast.success(s.title, r.data);
                    else toast.error(s.title, r.status === "error" ? r.message : undefined);
                  }}
                  className="flex h-full w-full gap-3 rounded-[12px] border border-line p-4 text-left transition hover:border-evergreen/40 hover:bg-evergreen/[0.04] disabled:opacity-60"
                >
                  <s.icon className={cn("mt-0.5 size-5 shrink-0 text-evergreen", running === s.event && "animate-pulse")} />
                  <span>
                    <span className="block font-medium">{s.title}</span>
                    <span className="mt-1 block text-[0.875rem] text-ink-3">{s.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="data-h" className="card-paper p-6">
          <h2 id="data-h" className="flex items-center gap-2 text-[1.0625rem] font-medium">
            <Database className="size-5 text-ink-3" /> Demo data
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[0.9375rem]">
            {counts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line pb-2">
                <dt className="text-ink-3">{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[0.8125rem] text-ink-3">
            Stored in {persistence.mode === "indexeddb" ? "IndexedDB on this device" : persistence.mode === "memory" ? "memory only (storage unavailable)" : "this browser"}
            {persistence.lastSavedAt ? ` · saved ${relativeTime(persistence.lastSavedAt)}` : ""} · seeded {relativeTime(db.seededAt)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              leading={<Download className="size-4" />}
              onClick={() => downloadBlob(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }), `${brand.filePrefix}-demo-${new Date().toISOString().slice(0, 10)}.json`)}
            >
              Download records (JSON)
            </Button>
            <Button variant="destructive" size="sm" leading={<RotateCcw className="size-4" />} onClick={() => setResetOpen(true)}>
              Reset demo
            </Button>
          </div>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="journeys-h">
        <h2 id="journeys-h" className="text-[1.0625rem] font-medium">
          Jump into a journey
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {journeys.map((j) => (
            <li key={j.href}>
              <Link href={j.href} className="group flex items-center justify-between gap-4 rounded-[12px] border border-line bg-surface/60 px-5 py-4 transition hover:border-evergreen/40 hover:bg-surface">
                <span>
                  <span className="block font-medium">{j.label}</span>
                  <span className="text-[0.875rem] text-ink-3">{j.note}</span>
                </span>
                {j.href.startsWith("/gift") ? <Gift className="size-4 text-ink-4" /> : <ArrowUpRight className="size-4 text-ink-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-evergreen" />}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DemoNotice className="mt-10" title="This is a demonstration tool">
        In production, persona switching and simulations don&rsquo;t exist — people sign in as themselves and events come from real services.
      </DemoNotice>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        tone="danger"
        title="Reset the demo?"
        confirmLabel="Reset demo"
        body="Everything added on this device is removed and the fictional Ellis family is restored."
        onConfirm={async () => {
          await reset();
          setResetOpen(false);
          toast.success("Demo reset");
        }}
      />
    </div>
  );
}

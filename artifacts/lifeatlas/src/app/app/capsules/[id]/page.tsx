"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, AudioLines, Images, MapPin, MessageCircleQuestion, Users } from "lucide-react";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { Panel } from "@/components/studio/primitives";
import { MemoryCard } from "@/components/capsule/memory-card";
import { MemoryReveal } from "@/components/capture/memory-reveal";
import { ButtonLink } from "@/components/ui/button";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { chapterColorVar } from "@/data/chapters";
import { decadesOf } from "@/lib/memory-utils";
import { pluralize } from "@/lib/utils";
import { chapterFor } from "@/domain/capsule-kinds";

export default function CapsuleOverview() {
  const { capsule, openMemory } = useStudioCapsule();
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const assignments = useDb((d) => d.assignments);
  const questions = useDb((d) => d.questions);
  const memberships = useDb((d) => d.memberships);
  const approved = memories.filter((m) => m.status === "approved");
  const featured = memories.find((m) => m.id === capsule.featuredMemoryId);
  const waiting = memories.filter((m) => m.status === "submitted" || m.status === "under_review");
  const recent = [...memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const queued = assignments.filter((a) => a.capsuleId === capsule.id && a.status === "queued").sort((a, b) => a.order - b.order);
  const answered = assignments.filter((a) => a.capsuleId === capsule.id && a.status === "answered").length;
  const decades = decadesOf(approved);
  const chapterCounts = capsule.chapterOrder.map((id) => ({ ch: chapterFor(capsule, id), n: approved.filter((m) => m.chapter === id).length }));
  const max = Math.max(1, ...chapterCounts.map((c) => c.n));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {featured ? (
          <div>
            <p className="catalog mb-3">Featured on the cover</p>
            <MemoryReveal memory={featured} subjectName={capsule.subjectName} animate={false} />
            <button type="button" onClick={() => openMemory(featured.id)} className="mt-3 text-[0.875rem] font-medium text-evergreen hover:underline">
              Edit this story
            </button>
          </div>
        ) : (
          <Panel>
            <p className="font-serif text-[1.6rem]">No featured story yet</p>
            <p className="mt-1 text-ink-3">Open any approved memory and choose “Feature” to place it on the cover.</p>
          </Panel>
        )}
        <Panel
          title="Recently added"
          actions={
            <Link href={`/app/capsules/${capsule.id}/memories`} className="text-[0.875rem] font-medium text-evergreen hover:underline">
              All memories
            </Link>
          }
        >
          {recent.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {recent.map((m) => (
                <MemoryCard key={m.id} memory={m} onClick={() => openMemory(m.id)} showStatus />
              ))}
            </div>
          ) : (
            <p className="text-ink-3">The first memory will appear here.</p>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="At a glance">
          <dl className="grid grid-cols-2 gap-6">
            {[
              [approved.length, "stories in the archive", <Images key="i" className="size-4" />],
              [approved.filter((m) => m.audioId).length, "with a voice", <AudioLines key="a" className="size-4" />],
              [new Set(approved.map((m) => m.placeId).filter(Boolean)).size, "places", <MapPin key="m" className="size-4" />],
              [memberships.filter((m) => m.capsuleId === capsule.id && m.status === "active").length, "people involved", <Users key="u" className="size-4" />],
            ].map(([n, l, icon]) => (
              <div key={l as string}>
                <dt className="flex items-center gap-1.5 text-[0.8125rem] text-ink-3">
                  {icon} {l}
                </dt>
                <dd className="mt-1 font-serif text-[2.2rem] leading-none">{n as number}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[0.9rem] text-ink-3">{decades.length ? `Spanning the ${decades[0]}s to the ${decades[decades.length - 1]}s.` : "No dated stories yet."}</p>
        </Panel>

        {waiting.length ? (
          <Panel title="Waiting for review" bodyClassName="p-3 sm:p-3">
            {waiting.map((m) => (
              <button key={m.id} type="button" onClick={() => openMemory(m.id)} className="flex w-full items-center justify-between gap-3 rounded-[12px] p-3 text-left hover:bg-ivory/70">
                <span>
                  <span className="block font-serif text-[1.15rem]">{m.title}</span>
                  <span className="text-[0.8125rem] text-ink-3">From {m.attribution.displayName}</span>
                </span>
                <ArrowRight className="size-4 text-ink-3" />
              </button>
            ))}
          </Panel>
        ) : null}

        <Panel
          title="Questions"
          description={`${answered} answered · ${queued.length} waiting`}
          actions={
            <Link href={`/app/capsules/${capsule.id}/questions`} className="text-[0.875rem] font-medium text-evergreen hover:underline">
              Manage
            </Link>
          }
        >
          {queued[0] ? (
            <div>
              <p className="flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-brass-ink">
                <MessageCircleQuestion className="size-4" /> Next up
              </p>
              <p className="mt-2 font-serif text-[1.35rem] leading-snug">{questions.find((q) => q.id === queued[0].questionId)?.text}</p>
              <ButtonLink href={`/app/gather?capsule=${capsule.id}&question=${queued[0].questionId}`} size="sm" className="mt-4">
                Ask it now
              </ButtonLink>
            </div>
          ) : (
            <p className="text-ink-3">No questions waiting. Choose a few from the library.</p>
          )}
        </Panel>

        <Panel title="Chapters">
          <ul className="space-y-2.5">
            {chapterCounts.map(({ ch, n }) => (
              <li key={ch.id} className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-[0.9rem]">
                <span className="truncate">{ch.title}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: chapterColorVar[ch.color] }} />
                </span>
                <span className="catalog w-6 text-right">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.8125rem] text-ink-3">Gentle guide only — every life has its own shape. {chapterCounts.filter((c) => !c.n).length ? `${pluralize(chapterCounts.filter((c) => !c.n).length, "chapter")} still waiting for a first story.` : ""}</p>
        </Panel>
      </div>
    </div>
  );
}

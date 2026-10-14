"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, Gift, HardDrive, History, ImagePlus, MailPlus, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useDb, useHydrated, usePendingReviewCount } from "@/hooks/use-data";
import { ButtonLink } from "@/components/ui/button";
import { Badge, DemoNotice } from "@/components/ui/feedback";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { MemoryCard } from "@/components/capsule/memory-card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { InvitationStatusBadge, MemoryStatusBadge, Panel } from "@/components/studio/primitives";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, pluralize, relativeTime } from "@/lib/utils";

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function StudioHome() {
  const capsules = useDb((d) => d.capsules);
  const memories = useDb((d) => d.memories);
  const invitations = useDb((d) => d.invitations);
  const questions = useDb((d) => d.questions);
  const assignments = useDb((d) => d.assignments);
  const audit = useDb((d) => d.auditEvents);
  const profile = useDb((d) => d.account.profile);
  const media = useDb((d) => d.media);
  const pending = usePendingReviewCount();
  const personId = useDb((d) => d.account.profile.personId);
  // Only the organizer's own drafts — contributors see theirs on their invitation link.
  const unfinished = useDb((d) => d.captureDrafts).filter((d) => d.key.endsWith(`:person:${personId}`) || d.key.endsWith(":person:organizer"));
  const hydrated = useHydrated();
  // One timestamp per visit keeps render pure; the greeting waits for the device clock.
  const [now] = React.useState(() => Date.now());

  const active = capsules.filter((c) => c.status !== "deletion_pending");
  const featuredCapsule = active.find((c) => c.id === "cap_margaret") ?? active[0];
  const live = memories.filter((m) => !m.deletedAt);
  const approved = live.filter((m) => m.status === "approved");
  const inbox = live.filter((m) => m.status === "submitted" || m.status === "under_review").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const drafts = live.filter((m) => m.status === "draft").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const recentLocal = live.filter((m) => m.storage === "this_device").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const featuredMemory = featuredCapsule ? live.find((m) => m.id === featuredCapsule.featuredMemoryId) ?? approved.find((m) => m.capsuleId === featuredCapsule.id) : undefined;
  const waitingInvites = invitations.filter((i) => i.status === "prepared" || i.status === "simulated_sent");
  const nextQuestion = featuredCapsule
    ? assignments
        .filter((a) => a.capsuleId === featuredCapsule.id && a.status === "queued")
        .sort((a, b) => a.order - b.order)
        .map((a) => questions.find((q) => q.id === a.questionId))
        .find(Boolean)
    : undefined;
  const thisWeek = live.filter((m) => now - new Date(m.createdAt).getTime() < 7 * 86400_000).length;
  const voices = approved.filter((m) => m.audioId).length;
  const photos = media.filter((m) => m.kind === "image").length;

  if (!featuredCapsule) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="eyebrow justify-center">Welcome</p>
        <h1 className="mt-5 font-serif text-title">Start with one story.</h1>
        <p className="mt-4 text-lead text-ink-2">Create a capsule for someone you love — or for yourself. It takes about two minutes, and every field but a name is optional.</p>
        <ButtonLink href="/app/capsules/new" size="xl" className="mt-8">
          Create a memory capsule
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px]">
      {/* Greeting */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,1.8rem+2.4vw,3.8rem)] leading-[1.02] tracking-[-0.025em]">
            {hydrated ? greeting(now) : "Welcome back"}, <em>{profile.givenName}.</em>
          </h1>
          <p className="mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
            {thisWeek > 0
              ? `${pluralize(thisWeek, "new memory", "new memories")} arrived this week. ${pending ? `${pluralize(pending, "story is", "stories are")} waiting for you to read.` : "Everything's been read."}`
              : "A quiet week. One good question can change that."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 sm:gap-10">
          {[
            [approved.length, "stories kept"],
            [voices, "voices"],
            [photos, "photographs"],
          ].map(([n, l]) => (
            <div key={l as string}>
              <p className="font-serif text-[2.6rem] leading-none tracking-[-0.02em]">{n}</p>
              <p className="mt-1.5 text-[0.8125rem] text-ink-3">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Featured capsule */}
        <section className="card-paper overflow-hidden" aria-labelledby="featured-capsule">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <Link href={`/app/capsules/${featuredCapsule.id}`} className="block">
              <CapsuleCover capsule={featuredCapsule} size="lg" className="aspect-[4/5] h-full md:aspect-auto md:min-h-[420px]" />
            </Link>
            <div className="flex flex-col p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow plain" id="featured-capsule">
                  Featured capsule
                </p>
                <Badge tone={featuredCapsule.status === "active" ? "success" : "neutral"} dot>
                  {featuredCapsule.status === "active" ? "Active" : featuredCapsule.status}
                </Badge>
              </div>
              {featuredMemory ? (
                <>
                  <p className="catalog mt-6">Featured story · {formatFuzzyDate(featuredMemory.date)}</p>
                  <h2 className="mt-2 font-serif text-[2rem] leading-[1.08]">{featuredMemory.title}</h2>
                  {featuredMemory.quote ? <p className="mt-3 font-serif text-[1.15rem] italic leading-snug text-ink-2">&ldquo;{featuredMemory.quote}&rdquo;</p> : null}
                  {featuredMemory.audioId ? <AudioPlayer mediaId={featuredMemory.audioId} variant="mini" title={featuredMemory.title} className="mt-6" showNotice={false} /> : null}
                </>
              ) : (
                <p className="mt-6 text-ink-3">No stories yet — the first answer will appear here.</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2.5 pt-8">
                <ButtonLink href={`/app/capsules/${featuredCapsule.id}`} trailing={<ArrowRight className="size-4" />}>
                  Open the studio
                </ButtonLink>
                <ButtonLink href={`/view/${featuredCapsule.id}`} variant="secondary" trailing={<ArrowUpRight className="size-4" />}>
                  View as family
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        {/* Right column */}
        <div className="grid content-start gap-6">
          {unfinished.length ? (
            <Panel title="Unfinished answers" description="Saved on this device as you went. Pick up where you left off.">
              <ul className="space-y-2">
                {unfinished.map((d) => (
                  <li key={d.key}>
                    <Link
                      href={`/app/gather?capsule=${d.capsuleId}${d.questionId ? `&question=${d.questionId}` : "&mode=photo"}`}
                      className="flex items-start gap-3 rounded-[12px] px-3 py-2.5 transition hover:bg-ivory"
                    >
                      <History className="mt-0.5 size-4 shrink-0 text-evergreen" />
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-[1.05rem]">{d.label}</span>
                        <span className="text-[0.8125rem] text-ink-3">
                          {capsules.find((c) => c.id === d.capsuleId)?.subjectName} · {relativeTime(d.updatedAt)}
                          {d.audio ? " · recording" : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel
            title="Waiting for you"
            description={inbox.length ? "Family members added these. Nothing appears in the archive until you approve it." : undefined}
            actions={
              inbox.length ? (
                <Link href="/app/invitations?tab=review" className="text-[0.875rem] font-medium text-evergreen hover:underline">
                  Review all
                </Link>
              ) : null
            }
            bodyClassName="p-3 sm:p-3"
          >
            {inbox.length ? (
              <ul>
                {inbox.slice(0, 3).map((m) => (
                  <li key={m.id}>
                    <Link href={`/app/invitations?tab=review&memory=${m.id}`} className="flex items-start gap-3 rounded-[14px] p-3 hover:bg-ivory/70">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-evergreen-soft font-medium text-evergreen">{m.attribution.displayName[0]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[1.15rem] leading-snug">{m.title}</span>
                        <span className="mt-0.5 block text-[0.8125rem] text-ink-3">
                          From {m.attribution.displayName} · {relativeTime(m.createdAt)}
                        </span>
                        <span className="mt-2 block">
                          <MemoryStatusBadge status={m.status} />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-[0.9375rem] text-ink-3">You&rsquo;re all caught up. New contributions will appear here.</p>
            )}
          </Panel>

          {nextQuestion ? (
            <section className="relative overflow-hidden rounded-[20px] bg-[#213d31] p-6 text-[#f3f3e8]">
              <div className="topo-lines pointer-events-none absolute inset-0 opacity-20" aria-hidden />
              <p className="relative flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#d7bd8a]">
                <MessageCircleQuestion className="size-4" /> Next question for {featuredCapsule.preferredName}
              </p>
              <p className="relative mt-4 font-serif text-[1.65rem] leading-[1.15]">{nextQuestion.text}</p>
              <div className="relative mt-6 flex flex-wrap gap-2.5">
                <ButtonLink href={`/app/gather?capsule=${featuredCapsule.id}&question=${nextQuestion.id}`} variant="light" size="md">
                  Ask it now
                </ButtonLink>
                <ButtonLink href={`/app/capsules/${featuredCapsule.id}/questions`} variant="outlineLight" size="md">
                  Choose another
                </ButtonLink>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Quick actions */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Quick actions">
        {[
          { href: "/app/invitations?new=1", icon: MailPlus, label: "Invite family", sub: "Prepare a link" },
          { href: `/app/gather?capsule=${featuredCapsule.id}&mode=photo`, icon: ImagePlus, label: "Add a photograph", sub: "With its story" },
          { href: `/view/${featuredCapsule.id}/voices`, icon: AudioLines, label: "Listen to a story", sub: `${voices} recordings` },
          { href: "/gifts/build", icon: Gift, label: "Prepare a gift", sub: "For someone else" },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="group card-quiet flex items-center gap-3.5 p-4 transition-colors hover:bg-surface">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-evergreen shadow-sm ring-1 ring-line transition-colors group-hover:bg-evergreen group-hover:text-on-evergreen">
              <a.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-medium leading-tight">{a.label}</span>
              <span className="block text-[0.8125rem] text-ink-3">{a.sub}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Continue */}
      {(drafts.length || recentLocal.length) > 0 ? (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-serif text-[1.9rem] leading-tight">Continue where you left off</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...recentLocal, ...drafts]
              .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
              .slice(0, 4)
              .map((m) => (
                <MemoryCard key={m.id} memory={m} href={`/app/capsules/${m.capsuleId}/memories?open=${m.id}`} showStatus />
              ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {/* Capsules */}
        <Panel
          title="Your capsules"
          className="lg:col-span-2"
          actions={
            <ButtonLink href="/app/capsules/new" size="sm" variant="secondary">
              New capsule
            </ButtonLink>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {active.slice(0, 6).map((c) => {
              const count = approved.filter((m) => m.capsuleId === c.id).length;
              return (
                <Link key={c.id} href={`/app/capsules/${c.id}`} className="group block">
                  <CapsuleCover capsule={c} size="sm" className="aspect-[4/5] rounded-[14px] transition-transform duration-500 group-hover:-translate-y-1" />
                  <p className="mt-3 font-medium leading-tight">{c.subjectName}</p>
                  <p className="text-[0.8125rem] text-ink-3">
                    {pluralize(count, "story", "stories")} · {c.status === "draft" ? "Draft" : c.relationship}
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>

        {/* Preservation — truthful */}
        <Panel title="Preservation" actions={<HardDrive className="size-5 text-ink-3" />}>
          <ul className="space-y-3 text-[0.9375rem]">
            <li className="flex items-center justify-between gap-3">
              <span>Cloud storage</span>
              <Badge tone="neutral">Not connected</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Independent backup</span>
              <Badge tone="neutral">Not connected</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>This device</span>
              <Badge tone="demo">Saved locally</Badge>
            </li>
          </ul>
          <DemoNotice compact className="mt-5" tone="warning">
            Storage and backups are not connected in this preview. Do not rely on this demo to preserve irreplaceable files.
          </DemoNotice>
          <ButtonLink href="/app/preservation" variant="secondary" size="sm" className="mt-4">
            Download a copy
          </ButtonLink>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Invitations"
          actions={
            <Link href="/app/invitations" className="text-[0.875rem] font-medium text-evergreen hover:underline">
              Manage
            </Link>
          }
          bodyClassName="p-3 sm:p-3"
        >
          <ul>
            {invitations.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-[12px] p-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{i.recipientName}</span>
                  <span className="block text-[0.8125rem] text-ink-3">
                    {i.relationship} · {capsules.find((c) => c.id === i.capsuleId)?.preferredName}
                  </span>
                </span>
                <InvitationStatusBadge status={i.status} />
              </li>
            ))}
          </ul>
          {waitingInvites.length ? <p className="px-3 pb-2 text-[0.8125rem] text-ink-3">{pluralize(waitingInvites.length, "invitation")} not yet opened.</p> : null}
        </Panel>

        <Panel title="Recent activity" bodyClassName="p-3 sm:p-3">
          <ol className="relative">
            {audit.slice(0, 7).map((e) => (
              <li key={e.id} className="flex gap-3 rounded-[12px] p-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sage" aria-hidden />
                <span className="min-w-0 flex-1 text-[0.9rem] leading-snug">
                  <span className="font-medium">{e.actor}</span> <span className="text-ink-2">{describeAction(e.action)}</span>
                  {e.detail ? <span className="text-ink-3"> — {e.detail}</span> : null}
                  <span className="block text-[0.75rem] text-ink-4">{relativeTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <section className={cn("mt-12 flex flex-col items-start gap-5 rounded-[24px] bg-ivory p-7 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-brass-ink shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-serif text-[1.5rem] leading-tight">Gathering for the holidays?</p>
            <p className="mt-1 text-ink-3">A pass-the-device session with five questions, made for the dinner table.</p>
          </div>
        </div>
        <ButtonLink href="/app/together" variant="secondary" trailing={<ArrowRight className="size-4" />}>
          Plan a session
        </ButtonLink>
      </section>
    </div>
  );
}

function describeAction(action: string) {
  const map: Record<string, string> = {
    "capsule.created": "created a capsule",
    "capsule.updated": "updated a capsule",
    "memory.created": "added a memory",
    "memory.updated": "edited a memory",
    "memory.approved": "approved a contribution",
    "memory.returned": "returned a contribution",
    "memory.declined": "declined a contribution",
    "memory.under_review": "started reviewing",
    "memory.deleted": "moved a memory to Recently deleted",
    "memory.restored": "restored a memory",
    "contribution.approved": "approved a contribution",
    "contribution.review_started": "started reviewing a contribution",
    "invitation.prepared": "prepared an invitation",
    "invitation.simulated_sent": "shared an invitation link",
    "invitation.accepted_demo": "opened an invitation",
    "invitation.revoked_demo": "revoked an invitation",
    "archive.exported": "downloaded an archive",
    "order.mock_completed": "placed a demo order",
    "demo.persona_switched": "switched demo identity",
    "future_message.sealed_demo": "sealed a letter (demo)",
    "future_message.drafted": "drafted a letter",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

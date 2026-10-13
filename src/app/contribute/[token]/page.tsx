"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Ear, Lock, SkipForward } from "lucide-react";
import { useInvitation } from "@/components/contribute/contribute-shell";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/feedback";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

export default function InvitationWelcome() {
  const { invitation, capsule, organizerName } = useInvitation();
  const router = useRouter();
  const personas = useDb((d) => d.personas);
  const questions = useDb((d) => d.questions);
  const [how, setHow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const first = invitation.recipientName.split(" ")[0];
  const isStoryteller = invitation.role === "storyteller";
  const isViewer = invitation.role === "viewer";
  const qs = invitation.questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean);

  const begin = async () => {
    setBusy(true);
    await services().communications.accept(invitation.token);
    const persona = personas.find((p) => p.personId && p.personId === invitation.personId);
    if (persona) await services().auth.switchPersona(persona.id);
    router.push(isViewer ? `/view/${capsule.id}` : `/contribute/${invitation.token}/record`);
  };

  return (
    <div className="pt-6 sm:pt-10">
      <p className="eyebrow">An invitation from {organizerName}</p>
      <h1 className="mt-5 font-serif text-[clamp(2.6rem,1.9rem+3vw,4.2rem)] leading-[1.02] tracking-[-0.025em]">
        Hi {first}.{" "}
        <span className="text-ink-2">
          {isStoryteller ? (
            <>
              Your family would love to <em>hear your stories.</em>
            </>
          ) : isViewer ? (
            <>
              You&rsquo;re invited to explore <em>{capsule.preferredName}&rsquo;s archive.</em>
            </>
          ) : (
            <>
              Would you add a story for <em>{capsule.preferredName}?</em>
            </>
          )}
        </span>
      </h1>

      {invitation.message ? (
        <figure className="mt-10 rounded-[24px] bg-ivory p-6 sm:p-8">
          <blockquote className="font-serif text-[1.5rem] italic leading-snug text-ink">&ldquo;{invitation.message}&rdquo;</blockquote>
          <figcaption className="mt-4 text-[1rem] text-ink-3">— {organizerName}</figcaption>
        </figure>
      ) : null}

      <div className="mt-10 grid gap-8 sm:grid-cols-[180px_1fr] sm:items-center">
        <CapsuleCover capsule={capsule} size="sm" className="aspect-[4/5] w-40 rounded-[16px] shadow-md sm:w-full" />
        <ul className="space-y-4 text-[1.1rem] leading-snug">
          {!isViewer ? (
            <li className="flex gap-3">
              <Ear className="mt-1 size-5 shrink-0 text-evergreen" />
              <span>
                <strong className="font-medium">Who might hear it:</strong> {organizerName} and the family members they invite to {capsule.preferredName}&rsquo;s private archive.
              </span>
            </li>
          ) : null}
          <li className="flex gap-3">
            <SkipForward className="mt-1 size-5 shrink-0 text-evergreen" />
            <span>
              <strong className="font-medium">No pressure:</strong> {isViewer ? "look around as long as you like." : `skip any question, take breaks, and come back later.${qs.length ? ` There ${qs.length === 1 ? "is 1 question" : `are ${qs.length} questions`} waiting.` : ""}`}
            </span>
          </li>
          <li className="flex gap-3">
            <Lock className="mt-1 size-5 shrink-0 text-evergreen" />
            <span>
              <strong className="font-medium">Private:</strong> never posted publicly. No account or password needed.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="xl" onClick={() => void begin()} loading={busy} trailing={<ArrowRight className="size-5" />} className="sm:min-w-[220px]">
          {isViewer ? "Open the archive" : "Begin"}
        </Button>
        <button type="button" onClick={() => setHow((v) => !v)} aria-expanded={how} className="inline-flex h-14 items-center gap-2 rounded-full px-6 text-[1.05rem] font-medium text-ink-2 hover:bg-ivory">
          See how this works <ChevronDown className={cn("size-5 transition-transform", how && "rotate-180")} />
        </button>
      </div>

      {how ? (
        <ol className="mt-8 space-y-5 rounded-[24px] border border-line bg-surface p-6 text-[1.1rem] leading-relaxed sm:p-8">
          {[
            ["One question at a time.", "Read it, think for a moment, and answer however feels natural."],
            ["Tap the big button to speak.", "Your browser asks to use the microphone once. Pause whenever you like, listen back, and try again."],
            ["Or type, or add a photo.", "Every way of answering is just as good."],
            [isStoryteller ? "It becomes part of your story." : `${organizerName} sees it first.`, isStoryteller ? "Your family can read and listen. You can change or remove anything later." : `They add it to ${capsule.preferredName}'s archive once they've read it.`],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-evergreen font-mono text-[0.9rem] text-[#f8f6f1]">{i + 1}</span>
              <span>
                <strong className="font-medium">{t}</strong> <span className="text-ink-2">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <DemoNotice className="mt-12" title="Invitation preview">
        Opened on this device through the demo. No email was sent, and real link security isn&rsquo;t active yet — anyone with this browser could open it.
      </DemoNotice>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { Heart } from "lucide-react";
import type { MemoryAttribution, Question } from "@/domain/models";
import { useInvitation } from "@/components/contribute/contribute-shell";
import { YourStories } from "@/components/contribute/your-stories";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { ButtonLink } from "@/components/ui/button";
import { useDb } from "@/hooks/use-data";
import { brand } from "@/config/brand";

export default function ContributeRecord() {
  const { invitation, capsule, organizerName } = useInvitation();
  const questions = useDb((d) => d.questions);
  const people = useDb((d) => d.people);
  const [finished, setFinished] = React.useState<number | null>(null);
  const qs = invitation.questionIds.map((id) => questions.find((q) => q.id === id)).filter((q): q is Question => !!q);
  const person = people.find((p) => p.id === invitation.personId);
  const isStoryteller = invitation.role === "storyteller";
  const attribution: MemoryAttribution = {
    personId: invitation.personId,
    displayName: person?.displayName ?? invitation.recipientName,
    relationship: isStoryteller ? "Storyteller" : invitation.relationship,
    via: "invitation",
    invitationId: invitation.id,
  };
  // Cue: a photo from the archive that relates to the first question's chapter (for gentle memory prompts).
  const media = useDb((d) => d.media);
  const memories = useDb((d) => d.memories);
  const cues: Record<string, string> = {};
  for (const q of qs) {
    // Gentle cues only, never surface grief or work stories as prompts.
    if (q.chapter === "wisdom" || q.chapter === "work") continue;
    const m = memories.find((x) => x.capsuleId === capsule.id && x.chapter === q.chapter && x.photoIds.length && x.status === "approved");
    if (m && media.some((a) => a.id === m.photoIds[0])) cues[q.id] = m.photoIds[0];
  }

  if (finished !== null) {
    return (
      <div className="pt-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-terracotta text-white">
          <Heart className="size-7" fill="currentColor" />
        </span>
        <h1 className="mt-6 font-serif text-[clamp(2.4rem,1.8rem+2.5vw,3.6rem)] leading-tight">Thank you, {attribution.displayName.split(" ")[0]}.</h1>
        <p className="mx-auto mt-4 max-w-lg text-[1.15rem] leading-relaxed text-ink-2">
          {finished === 0
            ? "Nothing was saved this time, and that's perfectly fine. The link will be here when you're ready."
            : isStoryteller
              ? `${finished === 1 ? "Your story is" : `Your ${finished} stories are`} now part of ${capsule.preferredName === attribution.displayName.split(" ")[0] ? "your" : `${capsule.preferredName}'s`} archive.`
              : `${organizerName} will see ${finished === 1 ? "your story" : `your ${finished} stories`} next, and add ${finished === 1 ? "it" : "them"} to ${capsule.preferredName}'s archive.`}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {capsule.viewerEnabled ? (
            <ButtonLink href={`/view/${capsule.id}`} size="lg">
              Explore the archive
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/contribute/${invitation.token}/record`} variant="secondary" size="lg" onClick={() => setFinished(null)}>
            Add another memory
          </ButtonLink>
        </div>
        <YourStories invitation={invitation} organizerName={organizerName} className="mx-auto mt-16 max-w-2xl text-left" />
        <div className="mx-auto mt-16 max-w-md border-t border-line pt-8">
          <p className="text-[0.9375rem] text-ink-3">
            Is there someone whose stories you&rsquo;d like to keep?{" "}
            <Link href="/" className="text-link text-ink-2">
              Learn about {brand.name}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <CaptureFlow
        capsule={capsule}
        questions={invitation.mode === "questions" ? qs : []}
        allowFreeform={invitation.mode === "open" || qs.length === 0}
        attribution={attribution}
        status={isStoryteller ? "approved" : "submitted"}
        variant="storyteller"
        invitationToken={invitation.token}
        cues={cues}
        finishLabel="I'm finished for now"
        onFinished={(saved) => setFinished(saved.length)}
      />
    </div>
  );
}

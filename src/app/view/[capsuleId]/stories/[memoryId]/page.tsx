"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useViewer } from "@/components/viewer/viewer-shell";
import { StoryView } from "@/components/explore/story-view";
import { useMemory, usePersona, useRole } from "@/hooks/use-data";
import { canViewMemory } from "@/domain/policies/permissions";
import { cn } from "@/lib/utils";

export default function ViewerStory() {
  const { capsule, tone, hrefFor, base } = useViewer();
  const { memoryId } = useParams<{ memoryId: string }>();
  const memory = useMemory(memoryId);
  const persona = usePersona();
  const role = useRole(capsule.id);
  const night = tone === "night";
  const visible = memory && memory.capsuleId === capsule.id && memory.status === "approved" && (canViewMemory(memory, role, persona.personId) || (capsule.isSample && memory.privacy === "family" && !memory.deletedAt));
  if (!visible) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className={cn("font-serif text-[2.6rem] leading-tight", night ? "text-night-ink" : "text-ink")}>This story isn&rsquo;t available.</h1>
        <p className={cn("mt-4", night ? "text-night-ink-2" : "text-ink-2")}>It may be private, still waiting for review, or removed by the organizer.</p>
        <Link href={`${base}/stories`} className={cn("mt-6 inline-block underline underline-offset-4", night ? "text-[#d7bc92]" : "text-evergreen")}>
          Back to all stories
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-8">
      <StoryView capsule={capsule} memory={memory} scope="viewer" hrefFor={hrefFor} tone={tone} backHref={`${base}/stories`} />
    </div>
  );
}

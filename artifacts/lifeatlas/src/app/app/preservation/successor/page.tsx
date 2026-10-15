"use client";

import { BadgeCheck, Clock, Eye, FileLock2 } from "lucide-react";
import { PageHeader } from "@/components/studio/primitives";
import { SuccessorPanel } from "@/components/studio/successor-panel";
import { DemoNotice } from "@/components/ui/feedback";

const principles = [
  { icon: Eye, title: "No access today", body: "Naming someone doesn't let them see anything. They have exactly the access they already had." },
  { icon: BadgeCheck, title: "Verified, never automatic", body: "In the real service, a successor would act only after identity and circumstances are checked by a person." },
  { icon: Clock, title: "Time to object", body: "You'd be notified and given a waiting period to stop any request you didn't make." },
  { icon: FileLock2, title: "Private stays private", body: "Memories you marked private stay private. A successor looks after the archive, they don't unlock it." },
];

export default function SuccessorPage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        back={{ href: "/app/preservation", label: "Preservation" }}
        eyebrow="Account · Successor"
        title={
          <>
            Someone to <em>carry it on.</em>
          </>
        }
        description="A successor is the person who could look after these stories, and any letters you've written for the future, if you no longer can."
      />
      <DemoNotice className="mb-8" title="Nothing is granted or sent in this preview">
        Successors are saved on this device only. No one is contacted, and the verification service that would make this real doesn&rsquo;t exist yet.
      </DemoNotice>
      <ul className="mb-8 grid gap-4 sm:grid-cols-2">
        {principles.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4 rounded-[16px] border border-line px-5 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-evergreen/10 text-evergreen">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-medium">{title}</span>
              <span className="mt-1 block text-[0.9375rem] leading-relaxed text-ink-2">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <SuccessorPanel />
    </div>
  );
}

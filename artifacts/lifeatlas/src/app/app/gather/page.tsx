"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import { HandHeart, ListChecks, PenLine, UserRound } from "lucide-react";
import type { MemoryAttribution, Question } from "@/domain/models";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { QuestionPicker } from "@/components/capsule/question-picker";
import { PageHeader } from "@/components/studio/primitives";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCards, Switch } from "@/components/ui/field";
import { useCapsules, useDb } from "@/hooks/use-data";
import { starterQuestionIds } from "@/data/prompts/questions";

function GatherInner() {
  const params = useSearchParams();
  const router = useRouter();
  const capsules = useCapsules().filter((c) => c.status === "active" || c.status === "draft");
  const questions = useDb((d) => d.questions);
  const assignments = useDb((d) => d.assignments);
  const profile = useDb((d) => d.account.profile);
  const [capsuleId, setCapsuleId] = React.useState<string | null>(params.get("capsule"));
  const capsule = capsules.find((c) => c.id === capsuleId);
  const first = params.get("first") === "1";
  // Who's speaking defaults from the capsule; an explicit choice only applies to the capsule it was made for.
  const [whoChoice, setWhoChoice] = React.useState<{ capsuleId?: string; who: "storyteller" | "me" } | null>(null);
  const who: "storyteller" | "me" = whoChoice && whoChoice.capsuleId === capsule?.id ? whoChoice.who : capsule?.relationshipKind === "self" ? "me" : "storyteller";
  const setWho = (w: "storyteller" | "me") => setWhoChoice({ capsuleId: capsule?.id, who: w });
  const [handOver, setHandOver] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [chosen, setChosen] = React.useState<string[] | null>(params.get("question") ? [params.get("question")!] : null);
  const [freeform, setFreeform] = React.useState(params.get("mode") === "photo");
  const [started, setStarted] = React.useState(first || !!params.get("question") || params.get("mode") === "photo");

  if (!capsule) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader eyebrow="Gather a memory" title="Whose story is this?" description="Choose a capsule. You can record together in person, type, or add a photograph." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capsules.map((c) => (
            <button key={c.id} onClick={() => setCapsuleId(c.id)} className="group text-left">
              <CapsuleCover capsule={c} size="sm" className="aspect-[4/5] rounded-[18px] transition-transform duration-500 group-hover:-translate-y-1" />
              <p className="mt-3 font-medium">{c.subjectName}</p>
              <p className="text-[0.875rem] text-ink-3">{c.relationship}</p>
            </button>
          ))}
        </div>
        <div className="mt-10">
          <ButtonLink href="/app/capsules/new" variant="secondary">
            Create a new capsule
          </ButtonLink>
        </div>
      </div>
    );
  }

  const queued = assignments
    .filter((a) => a.capsuleId === capsule.id && a.status === "queued")
    .sort((a, b) => a.order - b.order)
    .map((a) => questions.find((q) => q.id === a.questionId))
    .filter((q): q is Question => !!q);
  const defaultQs = queued.length ? queued.slice(0, 3) : starterQuestionIds.map((id) => questions.find((q) => q.id === id)!).filter(Boolean).slice(0, 3);
  const selectedQs = freeform ? [] : chosen ? (chosen.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as Question[]) : defaultQs;

  const attribution: MemoryAttribution =
    who === "me"
      ? { personId: profile.personId, displayName: profile.displayName, relationship: capsule.relationshipKind === "self" ? "Self" : "Organizer", via: "organizer" }
      : { personId: capsule.subjectPersonId, displayName: capsule.subjectName, relationship: "Storyteller", via: "recording_session" };

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow={`Gather a memory · ${capsule.subjectName}`} title="Let's ask one good question." description="Sit together if you can. One question at a time, no rush, and every answer can be edited later." back={{ href: "/app", label: "Studio" }} />
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-[1rem] font-medium">Who&rsquo;s answering?</h2>
            <ChoiceCards
              name="who"
              value={who}
              onChange={setWho}
              options={[
                { value: "storyteller", label: `${capsule.preferredName}, with you`, description: "Recording together in person. Credited to them.", icon: <HandHeart className="size-5" /> },
                { value: "me", label: "Me", description: "Your own memory or what you remember of them.", icon: <UserRound className="size-5" /> },
              ]}
            />
          </section>
          {who === "storyteller" ? (
            <div className="card-quiet p-5">
              <Switch id="handover" checked={handOver} onCheckedChange={setHandOver} label={`Hand the device to ${capsule.preferredName}`} description="Larger type, bigger buttons, one decision per screen." />
            </div>
          ) : null}
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-[1rem] font-medium">{freeform ? "No question, just a memory" : "Questions for today"}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" leading={<ListChecks className="size-4" />} onClick={() => setPickerOpen(true)}>
                  Choose
                </Button>
                <Button size="sm" variant={freeform ? "primary" : "ghost"} leading={<PenLine className="size-4" />} onClick={() => setFreeform((v) => !v)} aria-pressed={freeform}>
                  Free memory
                </Button>
              </div>
            </div>
            {!freeform ? (
              <ol className="space-y-2">
                {selectedQs.map((q, i) => (
                  <li key={q.id} className="flex gap-4 rounded-[16px] border border-line bg-surface px-5 py-4">
                    <span className="catalog mt-1.5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-serif text-[1.3rem] leading-snug">{q.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-[16px] border border-line bg-surface px-5 py-4 text-ink-2">Add a story, a recording or a photograph without a prompt, perfect for a picture you just found.</p>
            )}
          </section>
          <Button size="xl" onClick={() => setStarted(true)}>
            Begin
          </Button>
        </div>
        <QuestionPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          selected={selectedQs.map((q) => q.id)}
          onConfirm={(ids) => {
            setChosen(ids);
            setFreeform(false);
          }}
          max={8}
          answeredIds={assignments.filter((a) => a.capsuleId === capsule.id && a.status === "answered").map((a) => a.questionId)}
        />
      </div>
    );
  }

  return (
    <div className={handOver ? "py-4" : ""}>
      <CaptureFlow
        capsule={capsule}
        questions={selectedQs}
        attribution={attribution}
        status="approved"
        variant={handOver || first ? "storyteller" : "organizer"}
        firstMemory={first}
        allowFreeform={freeform}
        finishLabel={first ? "See it in the timeline" : "See it in the archive"}
        onFinished={(saved) => router.push(`/app/capsules/${capsule.id}/timeline${saved[0] ? `?highlight=${saved[0].id}` : ""}`)}
      />
    </div>
  );
}

export default function GatherPage() {
  return (
    <Suspense fallback={null}>
      <GatherInner />
    </Suspense>
  );
}

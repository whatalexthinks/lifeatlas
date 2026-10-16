"use client";

import * as React from "react";
import { useParams } from "@/lib/router/navigation";
import type { Capsule, Gift, MemoryAttribution, Question } from "@/domain/models";
import { BrandMark, Wordmark } from "@/components/brand/logo";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { starterQuestionIds } from "@/data/prompts/questions";

/** The gift recipient's first question, creates their own capsule on the spot. */
export default function GiftBegin() {
  const token = useParams<{ token: string }>().token ?? "";
  const hydrated = useHydrated();
  const capsules = useDb((d) => d.capsules);
  const questions = useDb((d) => d.questions);
  const mutate = useDemoStore((s) => s.mutate);
  const [gift, setGift] = React.useState<Gift | null>(null);
  const [capsuleId, setCapsuleId] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const creating = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || creating.current) return;
    creating.current = true;
    (async () => {
      const r = await services().gifts.resolveToken(token);
      if (r.status !== "ok") return;
      setGift(r.data);
      if (r.data.capsuleId && capsules.some((c) => c.id === r.data.capsuleId)) {
        setCapsuleId(r.data.capsuleId);
        return;
      }
      const c = await services().capsules.createFromWizard({
        relationshipKind: "self",
        relationship: r.data.recipient.relation || "Gift recipient",
        subjectName: r.data.recipient.name,
        preferredName: r.data.recipient.name.split(" ")[0],
        birthYear: "",
        birthplace: "",
        dedication: r.data.dedication.slice(0, 400),
        collectionMode: "in_person",
        startingChapter: "everyday",
        palette: r.data.reveal.color === "brass" ? "linen" : r.data.reveal.color === "ink" ? "night" : r.data.reveal.color,
        typography: "classic",
        layout: "type_only",
        defaultPrivacy: "family",
        viewerEnabled: true,
        includedWithGift: true,
      } as never);
      if (c.status === "ok") {
        mutate((d) => {
          const g = d.gifts.find((x) => x.id === r.data.id);
          if (g) g.capsuleId = c.data.id;
        });
        setCapsuleId(c.data.id);
        // Taking up the gift starts the plan it carries (one prepaid term, never auto-renewed).
        await services().gifts.accept(token);
      }
    })();
  }, [hydrated, token, capsules, mutate]);

  const capsule: Capsule | undefined = capsules.find((c) => c.id === capsuleId);
  const qs = starterQuestionIds.slice(0, 1).map((id) => questions.find((q) => q.id === id)).filter((q): q is Question => !!q);
  const attribution: MemoryAttribution = { displayName: gift?.recipient.name ?? "Storyteller", relationship: "Storyteller", via: "storyteller" };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-20 max-w-3xl items-center px-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5 text-evergreen">
          <BrandMark className="size-8 text-oxblood" title="" />
          <Wordmark className="text-ink" />
        </span>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        {!capsule ? (
          <div className="space-y-5 pt-10">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="h-40" />
          </div>
        ) : done ? (
          <div className="pt-16 text-center">
            <h1 className="font-serif text-[clamp(2.4rem,1.8rem+2.5vw,3.6rem)] leading-tight">That&rsquo;s your first story.</h1>
            <p className="mx-auto mt-4 max-w-md text-[1.15rem] text-ink-2">It&rsquo;s kept in your capsule. Come back for another question whenever you like, {gift?.giverName} will be so glad.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href={`/view/${capsule.id}`} size="lg">
                See your capsule
              </ButtonLink>
            </div>
            <p className="mt-6 text-[0.875rem] text-ink-3">Saved on this device for the demo, not uploaded or backed up.</p>
          </div>
        ) : (
          <div className="pt-4">
            <CaptureFlow capsule={capsule} questions={qs} attribution={attribution} status="approved" variant="storyteller" firstMemory finishLabel="I'm finished for now" onFinished={() => setDone(true)} />
          </div>
        )}
      </main>
    </div>
  );
}

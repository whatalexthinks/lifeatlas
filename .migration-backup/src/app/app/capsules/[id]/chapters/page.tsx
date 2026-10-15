"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ChapterKey } from "@/domain/models";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { ChaptersView } from "@/components/explore/chapters-view";
import { Panel } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/feedback";
import { useCapsuleMemories } from "@/hooks/use-data";
import { chapterColorVar } from "@/data/chapters";
import { services } from "@/services/factory";
import { chapterFor } from "@/domain/capsule-kinds";

export default function StudioChapters() {
  const { capsule, hrefFor } = useStudioCapsule();
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const [order, setOrder] = React.useState<ChapterKey[]>(capsule.chapterOrder);
  const dirty = order.join() !== capsule.chapterOrder.join();
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Panel title="Chapter order" description="How chapters appear in the viewer, the reading mode and printed books.">
        <ol className="space-y-1.5" aria-label="Chapters in order">
          {order.map((id, i) => {
            const ch = chapterFor(capsule, id);
            return (
              <li key={id} className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3 py-2">
                <span className="catalog w-5">{String(i + 1).padStart(2, "0")}</span>
                <span className="size-2 rounded-full" style={{ background: chapterColorVar[ch.color] }} />
                <span className="flex-1 font-serif text-[1.15rem]">{ch.title}</span>
                <span className="catalog">{memories.filter((m) => m.chapter === id).length}</span>
                <span className="flex">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-8 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" aria-label={`Move ${ch.title} earlier`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="grid size-8 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" aria-label={`Move ${ch.title} later`}>
                    <ArrowDown className="size-4" />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 flex gap-2">
          <Button
            disabled={!dirty}
            onClick={async () => {
              await services().capsules.reorderChapters(capsule.id, order);
              toast.success("Chapter order saved");
            }}
          >
            Save order
          </Button>
          <Button variant="ghost" disabled={!dirty} onClick={() => setOrder(capsule.chapterOrder)}>
            Reset
          </Button>
        </div>
      </Panel>
      <div className="min-w-0">
        <ChaptersView capsule={{ ...capsule, chapterOrder: order }} scope="studio" hrefFor={hrefFor} />
      </div>
    </div>
  );
}

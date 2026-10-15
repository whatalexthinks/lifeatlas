"use client";

import { Suspense } from "react";
import { useSearchParams } from "@/lib/router/navigation";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { TimelineView } from "@/components/explore/timeline-view";

function Inner() {
  const { capsule, openMemory } = useStudioCapsule();
  const highlight = useSearchParams().get("highlight");
  return <TimelineView capsule={capsule} scope="studio" onOpen={(m) => openMemory(m.id)} highlightId={highlight} />;
}

export default function StudioTimeline() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

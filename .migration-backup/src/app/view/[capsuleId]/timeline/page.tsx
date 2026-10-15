"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { TimelineView } from "@/components/explore/timeline-view";

function Inner() {
  const { capsule, tone, hrefFor } = useViewer();
  const highlight = useSearchParams().get("highlight");
  return (
    <ViewerPage eyebrow="Timeline" title={<>A life, <em>decade by decade.</em></>}>
      <TimelineView capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} highlightId={highlight} />
    </ViewerPage>
  );
}

export default function ViewerTimeline() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

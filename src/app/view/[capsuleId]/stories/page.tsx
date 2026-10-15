"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { ChaptersView } from "@/components/explore/chapters-view";

export default function ViewerStories() {
  return (
    <Suspense fallback={null}>
      <Stories />
    </Suspense>
  );
}

function Stories() {
  const { capsule, tone, hrefFor } = useViewer();
  const params = useSearchParams();
  // ?q= searches, ?saved=1 shows bookmarks, ?find=1 puts the cursor in the search box.
  const initial = { q: params.get("q") ?? undefined, saved: params.get("saved") === "1", focus: params.has("find") };
  return (
    <ViewerPage eyebrow="Chapters" title={<>Their stories, <em>in their own words.</em></>}>
      <ChaptersView key={`${initial.q}:${initial.saved}:${initial.focus}`} capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} initial={initial} />
    </ViewerPage>
  );
}

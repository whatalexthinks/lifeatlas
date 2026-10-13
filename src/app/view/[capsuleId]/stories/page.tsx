"use client";

import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { ChaptersView } from "@/components/explore/chapters-view";

export default function ViewerStories() {
  const { capsule, tone, hrefFor } = useViewer();
  return (
    <ViewerPage eyebrow="Chapters" title={<>Their stories, <em>in their own words.</em></>}>
      <ChaptersView capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} />
    </ViewerPage>
  );
}

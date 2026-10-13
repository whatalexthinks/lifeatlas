"use client";

import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { VoicesView } from "@/components/explore/voices-view";

export default function ViewerVoices() {
  const { capsule, tone, hrefFor } = useViewer();
  return (
    <ViewerPage eyebrow="Voices" title={<>The voice you <em>never want to forget.</em></>}>
      <VoicesView capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} />
    </ViewerPage>
  );
}

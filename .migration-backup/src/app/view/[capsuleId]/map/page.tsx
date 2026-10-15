"use client";

import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { MapView } from "@/components/explore/map-view";

export default function ViewerMap() {
  const { capsule, tone, hrefFor } = useViewer();
  return (
    <ViewerPage wide eyebrow="Memory map" title={<>The places <em>that made them.</em></>} lead="Every marker is a town, a city or a public landmark — never a home address.">
      <MapView capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} />
    </ViewerPage>
  );
}

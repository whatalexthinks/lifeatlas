"use client";

import { useViewer, ViewerPage } from "@/components/viewer/viewer-shell";
import { GalleryView } from "@/components/explore/gallery-view";

export default function ViewerPhotos() {
  const { capsule, tone, hrefFor } = useViewer();
  return (
    <ViewerPage wide eyebrow="Photographs" title={<>Pictures <em>worth a thousand stories.</em></>}>
      <GalleryView capsule={capsule} scope="viewer" hrefFor={hrefFor} tone={tone} />
    </ViewerPage>
  );
}

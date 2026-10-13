"use client";

import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { GalleryView } from "@/components/explore/gallery-view";

export default function StudioGallery() {
  const { capsule, hrefFor } = useStudioCapsule();
  return <GalleryView capsule={capsule} scope="studio" hrefFor={hrefFor} />;
}

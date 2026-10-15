"use client";

import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { MapView } from "@/components/explore/map-view";

export default function StudioMap() {
  const { capsule, openMemory } = useStudioCapsule();
  return <MapView capsule={capsule} scope="studio" onOpen={(m) => openMemory(m.id)} />;
}

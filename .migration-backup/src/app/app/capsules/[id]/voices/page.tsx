"use client";

import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { VoicesView } from "@/components/explore/voices-view";

export default function StudioVoices() {
  const { capsule, hrefFor } = useStudioCapsule();
  return <VoicesView capsule={capsule} scope="studio" hrefFor={hrefFor} />;
}

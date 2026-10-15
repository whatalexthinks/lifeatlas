"use client";

import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { ExportCenter } from "@/components/studio/export-center";

export default function StudioExport() {
  const { capsule } = useStudioCapsule();
  return <ExportCenter capsule={capsule} />;
}

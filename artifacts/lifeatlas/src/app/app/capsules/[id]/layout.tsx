import { CapsuleFrame } from "@/components/studio/capsule-frame";

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return <CapsuleFrame>{children}</CapsuleFrame>;
}

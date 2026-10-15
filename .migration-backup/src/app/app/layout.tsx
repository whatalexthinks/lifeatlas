import type { Metadata } from "next";
import { StudioShell } from "@/components/studio/studio-shell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: "Studio", template: `%s · Studio · ${brand.name}` },
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}

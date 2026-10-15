import type { Metadata } from "@/lib/router/metadata";
import { ViewerShell } from "@/components/viewer/viewer-shell";

export const metadata: Metadata = {
  title: "Family archive",
  robots: { index: false, follow: false },
};

export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return <ViewerShell>{children}</ViewerShell>;
}

import type { Metadata } from "@/lib/router/metadata";
import { ContributeShell } from "@/components/contribute/contribute-shell";

export const metadata: Metadata = {
  title: "Your invitation",
  robots: { index: false, follow: false },
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <ContributeShell>{children}</ContributeShell>;
}

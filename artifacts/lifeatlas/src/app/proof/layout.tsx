import type { Metadata } from "@/lib/router/metadata";

export const metadata: Metadata = {
  title: "Print proof (demo)",
  robots: { index: false, follow: false },
};

export default function ProofLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#e7e1d4]">{children}</div>;
}

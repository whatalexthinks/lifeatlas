import type { Metadata } from "next";
import { OpsHeader } from "@/components/ops/ops-header";

export const metadata: Metadata = {
  title: { default: "Operations demo", template: "%s · LifeAtlas operations demo" },
  robots: { index: false, follow: false },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <OpsHeader />
      <main id="main" className="mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

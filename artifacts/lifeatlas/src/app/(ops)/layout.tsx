import type { Metadata } from "@/lib/router/metadata";
import { OpsHeader } from "@/components/ops/ops-header";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: "Operations demo", template: `%s · ${brand.name} operations demo` },
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

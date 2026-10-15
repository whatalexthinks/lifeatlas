import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Checkout (demo)",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-paper/90 backdrop-blur" data-site-header>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />
          <span className="inline-flex items-center gap-2 rounded-full bg-brass-soft px-3 py-1.5 text-[0.8125rem] font-medium text-brass-ink">
            <span className="size-1.5 rounded-full bg-brass" aria-hidden /> Demo checkout · no payment is taken
          </span>
          <Link href="/pricing" className="hidden text-[0.875rem] text-ink-3 hover:text-ink sm:inline">
            Back to pricing
          </Link>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}

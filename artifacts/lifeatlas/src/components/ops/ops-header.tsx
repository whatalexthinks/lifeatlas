"use client";

import Link from "@/lib/router/link";
import { usePathname } from "@/lib/router/navigation";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

const tabs = [
  { href: "/demo/control-center", label: "Control center" },
  { href: "/demo/operations", label: "Operations" },
  { href: "/demo/style-guide", label: "Style guide" },
];

export function OpsHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#16241d] text-[#eef0e6]" data-site-header>
      <div className="mx-auto flex min-h-16 max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="size-7 text-[#c9c2b3]" />
          <span className="text-[1.15rem] font-semibold tracking-[-0.05em]">{brand.name}</span>
          <span className="rounded-[6px] bg-[#c9c2b3]/15 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#c9c2b3]">Ops demo</span>
        </Link>
        <nav aria-label="Operations" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={pathname === t.href ? "page" : undefined} className={cn("rounded-[8px] px-3.5 py-2 text-[0.9375rem] transition", pathname === t.href ? "bg-white/12 text-white" : "text-[#c9c2b3] hover:text-white")}>
              {t.label}
            </Link>
          ))}
        </nav>
        <Link href="/app" className="ml-auto inline-flex items-center gap-1.5 text-[0.875rem] text-[#c9c2b3] hover:text-white">
          Open studio <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Dialog as RD } from "radix-ui";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { services } from "@/services/factory";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/demo", label: "The experience" },
  { href: "/heirlooms", label: "Heirlooms" },
  { href: "/gifts", label: "Gifts" },
  { href: "/pricing", label: "Pricing" },
];

const moreNav = [
  { href: "/storytelling", label: "Storytelling" },
  { href: "/memory-map", label: "Memory map" },
  { href: "/family-collaboration", label: "Family collaboration" },
  { href: "/letters-through-time", label: "Letters Through Time" },
  { href: "/preservation", label: "Preservation" },
  { href: "/faq", label: "Questions" },
];

export function SiteHeader({ tone = "paper" }: { tone?: "paper" | "transparent" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-site-header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || tone === "paper" ? "bg-paper/95 backdrop-blur-xl backdrop-saturate-150" : "bg-transparent",
        scrolled && "shadow-[0_1px_0_var(--line)]",
      )}
    >
      <div className="mx-auto flex h-[84px] max-w-[1380px] items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn("rounded-full px-3 py-2 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink", pathname === n.href && "text-ink")}
            >
              <span className="link-underline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/app" className="hidden rounded-full px-3 py-2 text-[0.8125rem] text-ink-2 hover:text-ink sm:inline-flex">
            Open studio
          </Link>
          <ButtonLink
            href="/app/capsules/new"
            size="md"
            className="hidden sm:inline-flex"
            trailing={<ArrowUpRight className="size-4" />}
            onClick={() => services().analytics.track("landing_cta_clicked", { location: "header" })}
          >
            Create a capsule
          </ButtonLink>
          <RD.Root open={open} onOpenChange={setOpen}>
            <RD.Trigger asChild>
              <button className="grid size-11 place-items-center rounded-full text-ink hover:bg-ivory lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
            </RD.Trigger>
            <RD.Portal>
              <RD.Overlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" />
              <RD.Content className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-sm flex-col overflow-y-auto bg-paper px-6 pb-8 pt-5 shadow-lg data-[state=open]:animate-[fade-in_200ms_ease-out]">
                <div className="flex items-center justify-between">
                  <RD.Title asChild>
                    <span>
                      <Logo href={null} />
                    </span>
                  </RD.Title>
                  <RD.Description className="sr-only">Site navigation</RD.Description>
                  <RD.Close asChild>
                    <button className="grid size-11 place-items-center rounded-full hover:bg-ivory" aria-label="Close menu">
                      <X className="size-5" />
                    </button>
                  </RD.Close>
                </div>
                <nav aria-label="Mobile" className="mt-7 flex flex-col">
                  {[...nav, ...moreNav].map((n) => (
                    <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3 font-sans text-[1.15rem] leading-tight text-ink">
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto grid gap-3 pt-8">
                  <ButtonLink href="/app/capsules/new" size="lg" block onClick={() => setOpen(false)}>
                    Create a memory capsule
                  </ButtonLink>
                  <ButtonLink href="/app" variant="secondary" size="lg" block onClick={() => setOpen(false)}>
                    Open the studio
                  </ButtonLink>
                </div>
              </RD.Content>
            </RD.Portal>
          </RD.Root>
        </div>
      </div>
    </header>
  );
}

/** Mobile sticky CTA for long marketing pages. */
export function MobileStickyCta({ label = "Create a memory capsule", href = "/app/capsules/new" }: { label?: string; href?: string }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 transition-transform duration-300 ease-out sm:hidden",
        "bg-gradient-to-t from-paper via-paper/95 to-paper/0",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <ButtonLink href={href} size="lg" block trailing={<ArrowUpRight className="size-4" />}>
        {label}
      </ButtonLink>
    </div>
  );
}

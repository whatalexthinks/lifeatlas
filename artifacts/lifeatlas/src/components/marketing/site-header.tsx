"use client";

import { BagLink } from "@/components/site/bag";
import * as React from "react";
import Link from "@/lib/router/link";
import { usePathname } from "@/lib/router/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Dialog as RD } from "radix-ui";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { services } from "@/services/factory";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/couples", label: "Couples" },
  { href: "/families", label: "Families" },
  { href: "/legacy", label: "Legacy" },
  { href: "/physical-capsules", label: "Keepsakes" },
  { href: "/gifts", label: "Gifts" },
  { href: "/pricing", label: "Pricing" },
];

const moreNav = [
  { href: "/personal", label: "Your own story" },
  { href: "/examples", label: "Example capsules" },
  { href: "/faq", label: "Questions" },
  { href: "/support", label: "Support" },
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
      <div className="hidden border-b border-line/70 bg-night text-night-ink-2 md:block">
        <div className="mx-auto flex h-8 max-w-[1380px] items-center justify-between px-5 font-mono text-[0.625rem] uppercase tracking-[0.22em] sm:px-8">
          <span>A private family archive, kept by hand</span>
          <span className="text-night-accent">Preview edition</span>
        </div>
      </div>
      <div className="mx-auto flex h-[80px] max-w-[1380px] items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn("relative rounded-full px-3 py-2 text-[0.8125rem] tracking-[0.01em] text-ink-2 transition-colors hover:text-ink", pathname === n.href && "text-ink after:absolute after:bottom-0 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-oxblood")}
            >
              <span className="link-underline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <BagLink />
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
            Create your capsule
          </ButtonLink>
          <RD.Root open={open} onOpenChange={setOpen}>
            <RD.Trigger asChild>
              <button className="grid size-11 place-items-center rounded-full text-ink hover:bg-ivory xl:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
            </RD.Trigger>
            <RD.Portal>
              <RD.Overlay className="fixed inset-0 z-[80] bg-[#171a17]/45 backdrop-blur-sm" />
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
                    <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 font-serif text-[1.5rem] font-[350] leading-tight tracking-[-0.02em] text-ink">
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto grid gap-3 pt-8">
                  <ButtonLink href="/app/capsules/new" size="lg" block onClick={() => setOpen(false)}>
                    Create Your LifeCapsule
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
export function MobileStickyCta({ label = "Create Your LifeCapsule", href = "/app/capsules/new" }: { label?: string; href?: string }) {
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

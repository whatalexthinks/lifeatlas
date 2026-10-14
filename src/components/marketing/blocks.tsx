import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { defaultCatalog } from "@/data/product-catalog";
import type { Product } from "@/domain/models";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { cn, formatMoney } from "@/lib/utils";

export function Container({ children, className, size = "default" }: { children: React.ReactNode; className?: string; size?: "default" | "narrow" | "wide" }) {
  return <div className={cn("mx-auto w-full px-5 sm:px-8", size === "narrow" ? "max-w-[880px]" : size === "wide" ? "max-w-[1440px]" : "max-w-[1320px]", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  tone = "ink",
  as: H = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "ink" | "light";
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow ? <p className={cn("eyebrow", align === "center" && "justify-center", tone === "light" && "text-[#d7bc92]")}>{eyebrow}</p> : null}
      <H className={cn("mt-5 font-serif text-heading", H === "h1" && "text-title", tone === "light" ? "text-night-ink" : "text-ink")}>{title}</H>
      {lead ? <div className={cn("mt-5 text-lead", tone === "light" ? "text-night-ink-2" : "text-ink-2", align === "center" && "mx-auto max-w-2xl")}>{lead}</div> : null}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, lead, children, className }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden pb-16 pt-14 sm:pb-20 sm:pt-20", className)}>
      <div className="topo-lines pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
      <Container className="relative">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-6 max-w-4xl font-serif text-title">{title}</h1>
        {lead ? <div className="mt-6 max-w-2xl text-lead text-ink-2">{lead}</div> : null}
        {children ? <div className="mt-9">{children}</div> : null}
      </Container>
    </section>
  );
}

const planOrder = ["preview", "digital", "family"];

export function PricingCards({ catalog = defaultCatalog, compact = false }: { catalog?: Product[]; compact?: boolean }) {
  const plans = planOrder.map((id) => catalog.find((p) => p.id === id)).filter((p): p is Product => !!p);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((p, i) => {
        const featured = p.id === "family";
        return (
          <Reveal key={p.id} delay={i * 80} className={cn("relative flex flex-col rounded-[24px] p-7 sm:p-8", featured ? "bg-night text-night-ink shadow-lg" : "card-paper")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn("eyebrow plain", featured && "text-[#d7bc92]")}>{p.tagline}</p>
              {featured ? <span className="rounded-full bg-[#d7bc92] px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#1b1a18]">For the whole family</span> : null}
            </div>
            <h3 className="mt-4 font-serif text-[2rem] leading-tight">{p.name}</h3>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-[3.25rem] leading-none tracking-[-0.03em]">{formatMoney(p.price.amount)}</span>
              <span className={cn("text-[0.9375rem]", featured ? "text-night-ink-2" : "text-ink-3")}>{p.price.interval === "year" ? `per year${p.monthly ? ` · or ${formatMoney(p.monthly.amount)}/mo` : ""}` : p.price.amount === 0 ? "free, on this device" : "one time"}</span>
            </p>
            <p className={cn("mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em]", featured ? "text-night-ink-3" : "text-ink-4")}>Test price · not charged in this preview</p>
            <p className={cn("mt-5 text-[0.9875rem] leading-relaxed", featured ? "text-night-ink-2" : "text-ink-2")}>{p.description}</p>
            {!compact ? (
              <ul className="mt-6 space-y-2.5">
                {p.inclusions.map((x) => (
                  <li key={x} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                    <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-[#d7bc92]" : "text-evergreen")} />
                    <span className={featured ? "text-night-ink" : "text-ink"}>{x}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {!compact && p.limitations.length ? (
              <div className={cn("mt-5 border-t pt-4 text-[0.8125rem] leading-relaxed", featured ? "border-night-line text-night-ink-3" : "border-line text-ink-3")}>
                {p.limitations.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            ) : null}
            <div className="mt-auto pt-8">
              <ButtonLink
                href={p.id === "preview" ? "/app/capsules/new" : `/checkout/preview?product=${p.id}`}
                variant={featured ? "light" : "secondary"}
                size="lg"
                block
                trailing={<ArrowUpRight className="size-4" />}
              >
                {p.id === "preview" ? "Start on this device" : `Choose ${p.name}`}
              </ButtonLink>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function FaqList({ items, tone = "ink" }: { items: [string, React.ReactNode][]; tone?: "ink" | "light" }) {
  return (
    <div className={cn("divide-y border-y", tone === "light" ? "divide-night-line border-night-line" : "divide-line border-line")}>
      {items.map(([q, a]) => (
        <details key={q} className="group py-1">
          <summary className={cn("flex list-none items-center justify-between gap-6 py-5 text-left font-serif text-[1.35rem] leading-snug [&::-webkit-details-marker]:hidden", tone === "light" ? "text-night-ink" : "text-ink")}>
            {q}
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-transform duration-300 group-open:rotate-45", tone === "light" ? "border-night-line" : "border-line-strong")}>
              <Plus className="size-4" />
            </span>
          </summary>
          <div className={cn("max-w-3xl pb-6 pr-12 text-[1rem] leading-relaxed", tone === "light" ? "text-night-ink-2" : "text-ink-2")}>{a}</div>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = "Start with one story.", body = "For someone you love. Including yourself.", href = "/app/capsules/new", label = "Create a memory capsule" }: { title?: string; body?: string; href?: string; label?: string }) {
  return (
    <section className="relative overflow-hidden bg-ivory py-24 sm:py-32">
      <div className="topo-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <Container className="relative text-center">
        <Reveal>
          <p className="eyebrow justify-center">There&rsquo;s so much left to ask</p>
          <h2 className="mx-auto mt-6 max-w-3xl font-serif text-title">{title.includes("one story") ? <>Start with <em>one story.</em></> : title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lead text-ink-2">{body}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href={href} size="xl" trailing={<ArrowUpRight className="size-5" />}>
              {label}
            </ButtonLink>
            <ButtonLink href="/demo" size="xl" variant="secondary">
              Explore a sample story
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function FeatureList({ items, tone = "ink" }: { items: string[]; tone?: "ink" | "light" }) {
  return (
    <ul className="space-y-3">
      {items.map((x) => (
        <li key={x} className="flex gap-3 text-[1rem] leading-snug">
          <span className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full", tone === "light" ? "bg-white/10 text-[#d7bc92]" : "bg-evergreen-soft text-evergreen")}>
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span className={tone === "light" ? "text-night-ink" : "text-ink"}>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function TextLink({ href, children, tone = "ink" }: { href: string; children: React.ReactNode; tone?: "ink" | "light" }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-1.5 text-[1rem] font-medium", tone === "light" ? "text-[#d7bc92]" : "text-evergreen")}>
      <span className="link-underline">{children}</span>
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

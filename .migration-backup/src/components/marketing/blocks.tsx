import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

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

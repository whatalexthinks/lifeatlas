import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

/**
 * The public site's building blocks. One rhythm everywhere: an oxblood eyebrow, a Geist
 * headline with one Newsreader-italic word, generous space, thin rules. Pages differ in
 * structure, not in vocabulary.
 */

export function Container({ children, className, size = "default" }: { children: React.ReactNode; className?: string; size?: "default" | "narrow" | "wide" | "text" }) {
  const max = { text: "max-w-[720px]", narrow: "max-w-[960px]", default: "max-w-[1240px]", wide: "max-w-[1400px]" }[size];
  return <div className={cn("mx-auto w-full px-4 sm:px-8", max, className)}>{children}</div>;
}

type Tone = "paper" | "ivory" | "night" | "surface";

export function Section({ id, tone = "paper", className, children, labelledBy, space = "default" }: { id?: string; tone?: Tone; className?: string; children: React.ReactNode; labelledBy?: string; space?: "default" | "tight" | "none" }) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative scroll-mt-20",
        space === "default" && "py-20 sm:py-28 lg:py-32",
        space === "tight" && "py-14 sm:py-20",
        tone === "ivory" && "bg-ivory",
        tone === "surface" && "bg-surface",
        tone === "night" && "on-dark bg-night text-night-ink",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className, plain }: { children: React.ReactNode; className?: string; plain?: boolean }) {
  return <p className={cn("eyebrow", plain && "plain", className)}>{children}</p>;
}

/** Section heading. `title` may contain one <em> — the word that matters. */
export function Heading({
  id,
  eyebrow,
  title,
  lead,
  as: H = "h2",
  size = 2,
  align = "left",
  className,
  children,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: 1 | 2 | 3;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow className={cn(align === "center" && "justify-center")}>{eyebrow}</Eyebrow> : null}
      <H id={id} className={cn(`display-${size}`, eyebrow && "mt-5")}>
        {title}
      </H>
      {lead ? <div className={cn("lead mt-5", align === "center" && "mx-auto max-w-2xl")}>{lead}</div> : null}
      {children}
    </Reveal>
  );
}

export function ArrowLink({ href, children, className, external }: { href: string; children: React.ReactNode; className?: string; external?: boolean }) {
  const Icon = external ? ArrowUpRight : ArrowRight;
  return (
    <Link href={href} className={cn("group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-ink [.on-dark_&]:text-night-ink", className)}>
      <span className="link-underline">{children}</span>
      <Icon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
    </Link>
  );
}

/** An honest label for anything that shows the fictional sample family or a preview-only feature. */
export function SampleTag({ children = "Fictional sample", className }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3 backdrop-blur [.on-dark_&]:border-night-line [.on-dark_&]:bg-white/5 [.on-dark_&]:text-night-ink-3", className)}>{children}</span>;
}

export function CheckList({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((x, i) => (
        <li key={i} className="flex gap-3 text-[1rem] leading-snug">
          <Check className="mt-0.5 size-4 shrink-0 text-evergreen [.on-dark_&]:text-night-accent" aria-hidden />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps or principles, separated by thin rules. */
export function Numbered({ items, columns = 3, className }: { items: { title: React.ReactNode; body: React.ReactNode; aside?: React.ReactNode }[]; columns?: 2 | 3 | 4; className?: string }) {
  return (
    <ol className={cn("grid gap-x-10 gap-y-12", columns === 2 && "md:grid-cols-2", columns === 3 && "md:grid-cols-3", columns === 4 && "sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((it, i) => (
        <li key={i} className="border-t border-line-strong pt-6 [.on-dark_&]:border-night-line">
          <Reveal delay={i * 70}>
            <span className="font-mono text-[0.75rem] tracking-[0.12em] text-oxblood [.on-dark_&]:text-night-accent">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="display-3 mt-4 !text-[1.45rem]">{it.title}</h3>
            <div className="mt-3 text-[1rem] leading-relaxed text-ink-2 [.on-dark_&]:text-night-ink-2">{it.body}</div>
            {it.aside ? <div className="mt-4">{it.aside}</div> : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/** Two columns: words and a picture. Stacks on phones with the words first. */
export function Split({ children, media, reverse, className, align = "center" }: { children: React.ReactNode; media: React.ReactNode; reverse?: boolean; className?: string; align?: "center" | "start" }) {
  return (
    <div className={cn("grid gap-12 lg:grid-cols-2 lg:gap-20", align === "center" ? "lg:items-center" : "lg:items-start", className)}>
      <div className={cn(reverse && "lg:order-2")}>{children}</div>
      <div className={cn("min-w-0", reverse && "lg:order-1")}>{media}</div>
    </div>
  );
}

/** A quiet pull-quote in the serif. */
export function PullQuote({ children, cite, className }: { children: React.ReactNode; cite?: React.ReactNode; className?: string }) {
  return (
    <figure className={cn("max-w-3xl", className)}>
      <blockquote className="font-serif text-[clamp(1.6rem,1.25rem+1.4vw,2.6rem)] leading-[1.2] tracking-[-0.01em] text-ink [.on-dark_&]:text-night-ink">{children}</blockquote>
      {cite ? <figcaption className="mt-5 text-[0.9375rem] text-ink-3 [.on-dark_&]:text-night-ink-3">{cite}</figcaption> : null}
    </figure>
  );
}

/** A page's opening. Distinct pages pass their own visual as `media`. */
export function PageIntro({ eyebrow, title, lead, actions, media, note, className }: { eyebrow: React.ReactNode; title: React.ReactNode; lead?: React.ReactNode; actions?: React.ReactNode; media?: React.ReactNode; note?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20", className)}>
      <Container size="wide">
        <div className={cn("grid gap-12", media && "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16")}>
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display-1 mt-6">{title}</h1>
            {lead ? <div className="lead mt-7 max-w-xl">{lead}</div> : null}
            {actions ? <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">{actions}</div> : null}
            {note ? <div className="mt-6 text-[0.875rem] text-ink-3">{note}</div> : null}
          </div>
          {media ? <div className="min-w-0">{media}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/** The closing invitation at the foot of a page. */
export function FinalCta({ title, lead, primary, secondary }: { title: React.ReactNode; lead?: React.ReactNode; primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <Section tone="ivory" className="overflow-hidden">
      <div className="topo-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Container size="narrow" className="relative text-center">
        <Reveal>
          <Eyebrow className="justify-center">Begin</Eyebrow>
          <h2 className="display-2 mx-auto mt-6 max-w-3xl">{title}</h2>
          {lead ? <p className="lead mx-auto mt-5 max-w-xl">{lead}</p> : null}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            {primary}
            {secondary}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Plain-language facts about the preview, shown wherever a feature isn't connected yet. */
export function PreviewNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("max-w-2xl border-l-2 border-taupe pl-4 text-[0.9375rem] leading-relaxed text-ink-3 [.on-dark_&]:text-night-ink-3", className)}>{children}</p>;
}

/** Structured data for search engines, escaped as the Next.js guide recommends. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** A long, readable document with a table of contents — privacy, terms. */
export function LegalDocument({ eyebrow, title, status, updated, sections }: { eyebrow: string; title: React.ReactNode; status: React.ReactNode; updated: string; sections: { id: string; title: string; body: React.ReactNode }[] }) {
  return (
    <>
      <section className="pb-10 pt-12 sm:pt-20">
        <Container size="narrow">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="display-1 mt-6 !text-[clamp(2.6rem,1.8rem+3vw,4.6rem)]">{title}</h1>
          <div className="mt-8 rounded-[16px] border border-taupe/60 bg-ivory px-5 py-4 text-[0.9375rem] leading-relaxed text-ink-2">{status}</div>
          <p className="mt-4 font-mono text-[0.75rem] uppercase tracking-[0.1em] text-ink-3">Last updated {updated}</p>
        </Container>
      </section>
      <section className="pb-24 sm:pb-32">
        <Container size="narrow">
          <nav aria-label="Contents" className="rounded-[16px] border border-line bg-surface p-5">
            <p className="catalog">Contents</p>
            <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-flex min-h-9 items-center gap-2 text-[0.9375rem] text-ink-2 hover:text-ink">
                    <span className="font-mono text-[0.75rem] text-oxblood">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-14 space-y-14">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
                <h2 id={`${s.id}-h`} className="display-3">
                  <span className="mr-3 font-mono text-[0.875rem] tracking-[0.1em] text-oxblood">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="mt-5 space-y-4 text-[1.0625rem] leading-[1.7] text-ink-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:space-y-2">{s.body}</div>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

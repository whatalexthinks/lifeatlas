import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * LifeAtlas mark: a place-marker rising from an open book, with contour rings.
 * Branding is provisional (name/trademark pending). Pass `src` to swap in a
 * commissioned vector asset without touching call sites.
 */
export function BrandMark({ className, src, title = "LifeAtlas" }: { className?: string; src?: string; title?: string }) {
  if (src) return <img src={src} alt={title} className={cn("size-8", className)} />;
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} role="img" aria-label={title}>
      <path d="M16 3.6c4.2 0 7.4 3.2 7.4 7.3 0 4.6-4.6 8.9-7.4 11.6-2.8-2.7-7.4-7-7.4-11.6 0-4.1 3.2-7.3 7.4-7.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16" cy="10.9" r="3.6" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
      <circle cx="16" cy="10.9" r="1.35" fill="currentColor" />
      <path d="M3.5 21.6c4.4-1.9 8.6-1.6 12.5 1.2 3.9-2.8 8.1-3.1 12.5-1.2v6c-4.4-1.9-8.6-1.6-12.5 1.2-3.9-2.8-8.1-3.1-12.5-1.2v-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 22.8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[1.55rem] leading-none tracking-[-0.02em]", className)}>
      Life<span className="italic">Atlas</span>
    </span>
  );
}

export function Logo({ href = "/", className, tone = "ink", compact }: { href?: string | null; className?: string; tone?: "ink" | "light"; compact?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-[#f2eee5]" : "text-evergreen", className)}>
      <BrandMark className="size-[30px]" />
      {!compact ? <Wordmark className={tone === "light" ? "text-[#f2eee5]" : "text-ink"} /> : null}
    </span>
  );
  if (href === null) return inner;
  return (
    <Link href={href} aria-label="LifeAtlas home" className="rounded-md">
      {inner}
    </Link>
  );
}

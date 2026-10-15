import Link from "@/lib/router/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * The OurLifeCapsule seal: a capsule set inside a double ring, like a wax seal or a
 * jeweller's hallmark, with one kept moment in antique gold resting in the lower half.
 * Pass `src` to swap in a commissioned vector without touching call sites.
 */
export function BrandMark({ className, src, title = brand.name }: { className?: string; src?: string; title?: string }) {
  if (src) return <img src={src} alt={title} className={cn("size-8", className)} />;
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("size-8", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <circle cx="20" cy="20" r="18.6" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="20" cy="20" r="15.6" stroke="currentColor" strokeWidth="0.5" opacity="0.55" />
      <rect x="14.6" y="8.6" width="10.8" height="22.8" rx="5.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14.8 18.9c3.3 1.7 7.1 1.7 10.4 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="20" cy="25.2" r="1.7" fill="var(--oxblood)" />
    </svg>
  );
}

/** "OUR LifeCapsule": a tracked small-caps possessive above-left, then the serif name with Life in italic. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.32em] leading-none", className)}>
      <span className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.32em] opacity-75">Our</span>
      <span className="font-serif text-[1.5rem] font-[380] tracking-[-0.03em]">
        <em className="font-[300] italic">Life</em>Capsule
      </span>
    </span>
  );
}

export function Logo({ href = "/", className, tone = "ink", compact }: { href?: string | null; className?: string; tone?: "ink" | "light"; compact?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-[#ad9b76]" : "text-evergreen-deep", className)}>
      <BrandMark className="size-[34px]" title="" />
      {!compact ? <Wordmark className={tone === "light" ? "text-[#e8e7d9]" : "text-ink"} /> : <span className="sr-only">{brand.name}</span>}
    </span>
  );
  if (href === null)
    return (
      <span role="img" aria-label={brand.name}>
        {inner}
      </span>
    );
  return (
    <Link href={href} aria-label={`${brand.name} home`} className="rounded-md">
      {inner}
    </Link>
  );
}

import Link from "@/lib/router/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * The OurLifeCapsule mark: a slim capsule with a curved seam — a lid that opens — and one
 * kept moment inside. Pass `src` to swap in a commissioned vector without touching call sites.
 */
export function BrandMark({ className, src, title = brand.name }: { className?: string; src?: string; title?: string }) {
  if (src) return <img src={src} alt={title} className={cn("size-8", className)} />;
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <rect x="9.25" y="2.75" width="13.5" height="26.5" rx="6.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.4 14.6c4.3 2.2 8.9 2.2 13.2 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M12.6 8.4c1.9-1.5 4.9-1.5 6.8 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <circle cx="16" cy="21.6" r="1.75" fill="currentColor" />
    </svg>
  );
}

/** "Our·Life·Capsule" — the editorial serif, with Life set in italic so the name reads as three words. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[1.42rem] leading-none tracking-[-0.025em]", className)}>
      Our<em className="italic">Life</em>Capsule
    </span>
  );
}

export function Logo({ href = "/", className, tone = "ink", compact }: { href?: string | null; className?: string; tone?: "ink" | "light"; compact?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", tone === "light" ? "text-[#f3efe7]" : "text-oxblood", className)}>
      <BrandMark className="size-[28px]" title="" />
      {!compact ? <Wordmark className={tone === "light" ? "text-[#f3efe7]" : "text-ink"} /> : <span className="sr-only">{brand.name}</span>}
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

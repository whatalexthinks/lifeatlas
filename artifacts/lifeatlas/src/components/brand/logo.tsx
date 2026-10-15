import Link from "@/lib/router/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * The OurLifeCapsule mark: a softened forest tile holding an antique-gold keyhole.
 * One silhouette, no rings: a keepsake that is locked, kept and opened by the people you choose.
 * Built on a 32 grid so it stays crisp at 16px. Pass `src` to swap in a commissioned vector.
 */
export function BrandMark({ className, src, title = brand.name, tone = "ink" }: { className?: string; src?: string; title?: string; tone?: "ink" | "light" }) {
  if (src) return <img src={src} alt={title} className={cn("size-8", className)} />;
  const tile = tone === "light" ? "#e8e4d6" : "#3f4a3c";
  const key = tone === "light" ? "#3f4a3c" : "#c2a979";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <rect width="32" height="32" rx="8" fill={tile} />
      <path d="M16 7.5a4.6 4.6 0 0 1 2.35 8.56L19.6 23.4a1 1 0 0 1-.99 1.1h-5.22a1 1 0 0 1-.99-1.1l1.25-7.34A4.6 4.6 0 0 1 16 7.5z" fill={key} />
    </svg>
  );
}

/** One word, one typeface: Newsreader at a single weight, with Life carried only by colour. */
export function Wordmark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={cn("font-serif text-[1.42rem] font-[460] leading-none tracking-[-0.025em]", tone === "light" ? "text-[#efece2]" : "text-ink", className)}>
      Our<span className={tone === "light" ? "text-[#c9b48a]" : "text-[#8a7350]"}>Life</span>Capsule
    </span>
  );
}

export function Logo({ href = "/", className, tone = "ink", compact }: { href?: string | null; className?: string; tone?: "ink" | "light"; compact?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className="size-[30px]" title="" tone={tone} />
      {!compact ? <Wordmark tone={tone} /> : <span className="sr-only">{brand.name}</span>}
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

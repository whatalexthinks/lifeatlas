import Link from "@/lib/router/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Monogram for tight spaces (favicons, seals, envelopes): a single serif O with a small l,
 * set as type, no container shape. Pass `src` to swap in a commissioned vector.
 */
export function BrandMark({ className, src, title = brand.name, tone = "ink" }: { className?: string; src?: string; title?: string; tone?: "ink" | "light" }) {
  if (src) return <img src={src} alt={title} className={cn("size-8", className)} />;
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <text x="16" y="22.5" textAnchor="middle" fontFamily="Newsreader, 'Iowan Old Style', Georgia, serif" fontSize="18.5" fontWeight="500" letterSpacing="-1.2" fill={tone === "light" ? "#efece2" : "#3f4a3c"}>
        OL
      </text>
    </svg>
  );
}

/**
 * House brand first, product second. OurLife is set as one serif name; Capsule sits beside it
 * on its own tier, in tracked sans capitals, separated by a hairline and aligned to the x-height band.
 */
export function Wordmark({ className, tone = "ink", product = true }: { className?: string; tone?: "ink" | "light"; product?: boolean }) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center leading-none", className)}>
      <span className={cn("font-serif text-[1.6rem] font-[500] tracking-[-0.035em]", light ? "text-[#efece2]" : "text-[#2f382d]")}>{brand.name}</span>
      {product ? (
        <>
          <span aria-hidden className={cn("mx-[0.7rem] h-[1.05rem] w-px translate-y-[0.06rem]", light ? "bg-[#c9b48a]/60" : "bg-[#8a7350]/45")} />
          <span className={cn("translate-y-[0.08rem] font-sans text-[0.7rem] font-[550] uppercase tracking-[0.24em]", light ? "text-[#c9b48a]" : "text-[#7a6646]")}>{brand.product}</span>
        </>
      ) : null}
    </span>
  );
}

export function Logo({ href = "/", className, tone = "ink", compact }: { href?: string | null; className?: string; tone?: "ink" | "light"; compact?: boolean }) {
  const inner = (
    <span className={cn("inline-flex items-center", className)}>
      <Wordmark tone={tone} product={!compact} />
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

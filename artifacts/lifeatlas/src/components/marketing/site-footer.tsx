import Link from "@/lib/router/link";
import { BrandMark, Wordmark } from "@/components/brand/logo";
import { brand } from "@/config/brand";

const cols = [
  {
    title: "Product",
    links: [
      ["How it works", "/how-it-works"],
      ["Example capsules", "/examples"],
      ["Pricing", "/pricing"],
      ["Physical capsules", "/physical-capsules"],
      ["Gifts", "/gifts"],
      ["Open the studio", "/app"],
    ],
  },
  {
    title: "For",
    links: [
      ["Couples", "/couples"],
      ["Families", "/families"],
      ["Your own story", "/personal"],
      ["Parents & grandparents", "/legacy"],
      ["Holiday gatherings", "/gifts/holiday"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Privacy (draft)", "/privacy"],
      ["Terms (draft)", "/terms"],
      ["Preservation", "/preservation"],
      ["Data retention", "/data-retention"],
      ["Accessibility", "/accessibility"],
    ],
  },
  {
    title: `${brand.name}`,
    links: [
      ["About", "/about"],
      ["Questions", "/faq"],
      ["Support", "/support"],
      ["Contact", "/contact"],
      ["Sample story", "/demo"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer data-site-footer className="relative overflow-hidden bg-night text-night-ink">
      <div className="relative mx-auto max-w-[1380px] px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-10 border-b border-night-line pb-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-3xl font-serif text-[clamp(2.2rem,1.4rem+3vw,4.2rem)] font-[300] leading-[1.02] tracking-[-0.03em] text-night-ink">
            The ordinary days are the ones <em className="text-night-accent">we miss most.</em>
          </p>
          <Link href="/app/capsules/new" className="group inline-flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-night-ink-2 hover:text-night-ink">
            <span className="seal size-14 transition-transform duration-500 group-hover:rotate-[18deg]">
              <BrandMark className="size-9 text-[#f6e9dc]" title="" />
            </span>
            Begin a capsule
          </Link>
        </div>
        <div className="grid gap-14 pt-14 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 text-night-accent">
              <BrandMark className="size-[34px]" />
              <Wordmark className="text-night-ink" />
            </div>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-night-ink-2">
              Private capsules for the stories, voices and photographs of the people you love. Shared only with the people you choose, and made to be handed down.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {cols.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="mb-5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.24em] text-night-accent">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="link-underline text-[0.9375rem] text-night-ink-2 transition-colors hover:text-night-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div aria-hidden className="pointer-events-none mt-16 select-none overflow-hidden font-serif text-[clamp(4rem,15vw,15rem)] font-[300] leading-[0.8] tracking-[-0.05em] text-night-3">
          <em>Life</em>Capsule
        </div>
        <div className="mt-8 grid gap-4 border-t border-night-line pt-8 text-[0.8125rem] leading-relaxed text-night-ink-3 md:grid-cols-[1fr_auto]">
          <p>
            This is a preview build. The Ellis family is fictional, and photographs on this site are illustrative. Payments, emails, cloud storage, backups, printing and future delivery are not connected. Nothing on this site charges, sends, ships or
            stores anything beyond your own browser. {brand.name} is a working name; branding and trademark are pending.
          </p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] md:text-right">&copy; 2026 {brand.name} (preview)</p>
        </div>
      </div>
    </footer>
  );
}

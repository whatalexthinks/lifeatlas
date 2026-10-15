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
      <div className="topo-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-[1320px] px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 text-[#d7bc92]">
              <BrandMark className="size-[30px]" />
              <Wordmark className="text-night-ink" />
            </div>
            <p className="mt-6 font-serif text-[1.75rem] leading-[1.15] text-night-ink">A life is made of moments. Keep them close.</p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-night-ink-2">
              Private capsules for the stories, voices and photographs of the people you love — made to be shared with the people you choose, and handed down.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {cols.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#d7bc92]">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-[0.9375rem] text-night-ink-2 transition-colors hover:text-night-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-4 border-t border-night-line pt-8 text-[0.8125rem] leading-relaxed text-night-ink-3 md:grid-cols-[1fr_auto]">
          <p>
            This is a preview build. The Ellis family is fictional. Payments, emails, cloud storage, backups, printing and future delivery are not connected — nothing on this site charges, sends, ships or
            stores anything beyond your own browser. {brand.name} is a working name; branding and trademark are pending.
          </p>
          <p className="md:text-right">© 2026 {brand.name} (preview)</p>
        </div>
      </div>
    </footer>
  );
}

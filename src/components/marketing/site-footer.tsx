import Link from "next/link";
import { BrandMark, Wordmark } from "@/components/brand/logo";

const cols = [
  {
    title: "Product",
    links: [
      ["How it works", "/how-it-works"],
      ["Features", "/features"],
      ["Storytelling", "/storytelling"],
      ["Memory map", "/memory-map"],
      ["Family collaboration", "/family-collaboration"],
      ["Letters Through Time", "/letters-through-time"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "Heirlooms & gifts",
    links: [
      ["Heirlooms", "/heirlooms"],
      ["Printed book", "/heirlooms/book"],
      ["Keepsake box", "/heirlooms/time-capsule"],
      ["Gifts", "/gifts"],
      ["Holiday gathering", "/gifts/holiday"],
      ["For parents", "/gifts/parents"],
      ["For grandparents", "/gifts/grandparents"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Preservation", "/preservation"],
      ["Privacy (draft)", "/privacy"],
      ["Terms (draft)", "/terms"],
      ["Data retention (draft)", "/data-retention"],
      ["Accessibility", "/accessibility"],
    ],
  },
  {
    title: "LifeAtlas",
    links: [
      ["About", "/about"],
      ["Questions", "/faq"],
      ["Contact", "/contact"],
      ["Sample story", "/demo"],
      ["Open the studio", "/app"],
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
            <div className="flex items-center gap-2.5 text-[#c4ad86]">
              <BrandMark className="size-[30px]" />
              <Wordmark className="text-night-ink" />
            </div>
            <p className="mt-6 font-serif text-[1.75rem] leading-[1.15] text-night-ink">Every life has a story worth keeping.</p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-night-ink-2">
              A private family archive for voices, photographs, places and letters — made to be explored together and carried forward.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {cols.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#c4ad86]">{c.title}</p>
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
            stores anything beyond your own browser. LifeAtlas is a working name; branding and trademark are pending.
          </p>
          <p className="md:text-right">© 2026 LifeAtlas (preview)</p>
        </div>
      </div>
    </footer>
  );
}

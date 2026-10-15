import Link from "@/lib/router/link";
import { ArrowUpRight } from "lucide-react";
import { Plate } from "@/components/media/media-image";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

export const audiences = [
  { key: "couples", href: "/couples", plate: "umbrella-1998", label: "For couples", line: "How you met, the firsts, the letters, told by both of you, each in your own words." },
  { key: "families", href: "/families", plate: "table-2019", label: "For families", line: "Generations at one table: traditions, recipes and everyone's side of the story." },
  { key: "legacy", href: "/legacy", plate: "kitchen-1947", label: "For a parent or grandparent", line: "Their stories in their own voice, before the details fade." },
  { key: "personal", href: "/personal", plate: "bookshop-1989", label: "For yourself", line: "Your life, in your words, for you now, and for the people who come after." },
  { key: "children", href: "/families#children", plate: "nightlight-2004", label: "For a child", line: "Milestones, funny sayings and letters they'll open when they're older." },
  { key: "gifts", href: "/gifts", plate: "letter-1952", label: "As a gift", line: "Give someone the beginning of their story, and the time to tell it." },
] as const;

/** Entry points by audience. Each leads to its own page, not a repeat of the homepage. */
export function AudienceGrid({ exclude, className }: { exclude?: string; className?: string }) {
  const list = audiences.filter((a) => a.key !== exclude);
  return (
    <ul className={cn("grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {list.map((a, i) => (
        <li key={a.key}>
          <Reveal delay={(i % 3) * 70}>
            <Link href={a.href} className="group block rounded-[18px] focus-visible:outline-offset-4">
              <div className="overflow-hidden rounded-[16px]">
                <Plate id={a.plate} alt="" className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              </div>
              <h3 className="display-3 mt-5 flex items-center justify-between gap-3 !text-[1.4rem]">
                {a.label}
                <ArrowUpRight className="size-5 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink motion-reduce:transition-none" aria-hidden />
              </h3>
              <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{a.line}</p>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

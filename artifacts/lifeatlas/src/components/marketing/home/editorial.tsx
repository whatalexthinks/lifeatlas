import Link from "@/lib/router/link";
import { cn } from "@/lib/utils";
import { editorialPhotoUrl } from "@/lib/media/editorial-photos";

const src = editorialPhotoUrl;

export function PrintPhoto({ slug, alt, className, caption, eager }: { slug: string; alt: string; className?: string; caption?: string; eager?: boolean }) {
  return (
    <figure className={cn("print-frame", className)}>
      <div className="print-photo h-full">
        <img src={src(slug)} srcSet={`${src(slug).replace(".webp", "-small.webp")} 640w, ${src(slug)} 1440w`} sizes="(max-width: 640px) 75vw, 620px" alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      </div>
      {caption ? <figcaption className="caption-hand -mb-6 mt-2 truncate px-1">{caption}</figcaption> : null}
    </figure>
  );
}

/** Hero: a loose arrangement of prints, as if just lifted from a walnut box. */
export function HeroPrints() {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[620px]">
      <PrintPhoto slug="kitchen-dance" alt="An older couple dancing barefoot in their kitchen" caption="Tuesday, after supper" eager className="hero-rise absolute right-0 top-0 h-[74%] w-[62%] rotate-[2.2deg]" />
      <PrintPhoto slug="lighthouse-family" alt="A family beside a lighthouse in sea fog" caption="Cape Elizabeth, in the fog" eager className="hero-rise absolute left-0 top-[14%] h-[44%] w-[48%] -rotate-[4deg] [--d:180ms]" />
      <PrintPhoto slug="apple-pie" alt="An apple pie cooling by a window" caption="Her pie, no recipe" className="hero-rise absolute bottom-[2%] left-[10%] h-[38%] w-[44%] rotate-[1.5deg] [--d:320ms]" />
      <div className="hero-rise absolute bottom-[6%] right-[4%] w-[44%] rounded-[2px] bg-night p-5 text-night-ink shadow-[var(--shadow-object)] [--d:460ms]">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-night-accent">Recorded answer</p>
        <p className="mt-2 font-serif text-[1.15rem] font-[340] italic leading-snug">&ldquo;He always hummed the same three bars. Never the whole song.&rdquo;</p>
      </div>
      <span className="seal hero-rise absolute -left-2 bottom-[40%] size-16 rotate-[-12deg] font-mono text-[0.5rem] uppercase leading-tight tracking-[0.16em] shadow-[var(--shadow-md)] [--d:600ms]">
        <span className="text-center">Kept
          <br />by us</span>
      </span>
    </div>
  );
}

const sheet: [string, string, string][] = [
  ["harbor-ferry", "A harbour ferry crossing", "The ferry, 1934"],
  ["flour-kitchen", "A flour-dusted kitchen table", "Sunday flour"],
  ["valve-radio", "A valve radio on a workbench", "His workbench"],
  ["maple-house", "A house under a maple tree", "The maple house"],
  ["roadside-wagon", "A station wagon at a roadside stop", "Route 30, 1983"],
  ["family-picnic", "A family picnic in the park", "The long picnic"],
  ["christmas-dinner", "Three generations at Christmas dinner", "Christmas, 1997"],
  ["london-bookshop", "A quiet London bookshop", "Where they met"],
  ["physics-classroom", "Afternoon light in a classroom", "Mr Hale's room"],
  ["nursery-mobile", "A sailboat mobile by a nursery window", "Her first room"],
  ["boston-suitcase", "A blue suitcase above city rooftops", "Leaving for Boston"],
  ["walnut-keepsake", "A walnut box of keepsakes", "The walnut box"],
  ["montreal-letter", "A handwritten letter and its envelope", "A letter from Montreal"],
  ["first-bike-ride", "A father running beside his daughter on her first bicycle ride", "The first ride"],
  ["sea-glass-bowl", "Sea glass and notes in a cobalt bowl", "What we brought home"],
  ["canoe-lesson", "A father and son sharing a canoe lesson", "Out on the lake"],
  ["mending-denim", "A grandmother and granddaughter mending denim together", "Her patient hands"],
  ["kitchen-stories", "Family stories shared around the kitchen table", "One more story"],
  ["keepsake-surprise", "A grandmother sharing a keepsake surprise with her grandson", "Something to pass on"],
  ["birthday-friends", "Friends together around a birthday table", "Another year together"],
];

function Photo({ slug, alt, className, eager }: { slug: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <div className={cn("print-photo", className)}>
      <img src={src(slug)} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

/**
 * Hero explainer: three inputs (guided answer, voice, photograph) flow into one private capsule.
 * The printed book is shown as a separately sold option, never as part of the membership.
 */
export function HeroCapsule() {
  const inputs = [
    { k: "01", label: "Guided answer", body: "\u201cWhat did the house in Maine smell like in summer?\u201d" },
  { k: "02", label: "A story read aloud", body: "The kitchen always smelled of bread." },
    { k: "03", label: "Photograph", body: "Maine, 1972, with the story of who took it" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 sm:gap-5">
        <ol className="flex flex-col gap-2.5 sm:gap-3" aria-label="What you collect">
          {inputs.map((x, i) => (
            <li key={x.k} className="hero-rise rounded-[3px] border border-line bg-surface p-3 shadow-[var(--shadow-sm)] sm:p-4" style={{ ["--d" as string]: `${200 + i * 140}ms` }}>
              <p className="flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.18em] text-oxblood">
                <span>{x.label}</span>
                <span className="text-ink-4">{x.k}</span>
              </p>
              {i === 1 ? (
                <div className="mt-2 flex h-5 items-end gap-[3px]" aria-hidden>
                  {[5, 9, 14, 8, 17, 11, 6, 13, 18, 9, 12, 7, 15, 10, 5, 11].map((h, j) => (
                    <span key={j} className="w-[3px] rounded-full bg-evergreen" style={{ height: h }} />
                  ))}
                </div>
              ) : null}
              <p className={cn("mt-1.5 leading-snug text-ink-2", i === 0 ? "font-serif text-[0.95rem] italic sm:text-[1.05rem]" : "text-[0.78rem] sm:text-[0.85rem]")}>{x.body}</p>
              {i === 2 ? <Photo slug="maine-family-1972" alt="A family sharing a joyful moment on the Maine coast" eager className="mt-2 aspect-[16/10] rounded-[1px]" /> : null}
            </li>
          ))}
        </ol>
        <div className="hero-rise relative flex flex-col rounded-[4px] bg-night p-3 text-night-ink shadow-[var(--shadow-object)] sm:p-5 [--d:640ms]">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-night-accent">Becomes one private capsule</p>
          <p className="mt-1 font-serif text-[1.25rem] italic leading-tight sm:text-[1.6rem]">Margaret&rsquo;s story</p>
          <Photo slug="porch-margaret" alt="Margaret on her porch" eager className="mt-3 aspect-[4/5] rounded-[1px]" />
          <Link href="/view/cap_margaret/voices" className="mt-3 flex items-center gap-2.5 rounded-[3px] bg-night-3 p-2.5 transition-colors hover:bg-night-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-night-accent" aria-label="Listen to sample family recordings">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-night-accent text-night" aria-hidden>
              <svg viewBox="0 0 10 10" className="size-2.5 fill-current"><path d="M2 1l7 4-7 4z" /></svg>
            </span>
            <p className="text-[0.72rem] leading-snug text-night-ink-2 sm:text-[0.8rem]">Listen to the sample family story</p>
          </Link>
          <p className="mt-3 text-[0.68rem] leading-snug text-night-ink-3 sm:text-[0.75rem]">Timeline, chapters and the stories behind each photograph. Shared only with the family you invite.</p>
        </div>
      </div>
      <div className="hero-rise mt-4 flex items-center gap-4 rounded-[3px] border border-dashed border-line-strong bg-ivory/70 p-3 [--d:820ms]">
        <Photo slug="family-storybook" alt="An optional printed family storybook" className="aspect-square w-16 shrink-0 rounded-[1px] sm:w-20" />
        <p className="text-[0.78rem] leading-snug text-ink-3 sm:text-[0.85rem]">
          <span className="font-medium text-ink">Optional, sold separately:</span> a printed book or keepsake box made from your capsule. Not included in any membership.
        </p>
      </div>
    </div>
  );
}

/** A slowly drifting contact sheet. Duplicated once so the loop is seamless. */
export function ContactSheet() {
  const row = [...sheet, ...sheet];
  return (
    <section aria-label="Ordinary moments" className="relative overflow-hidden border-y border-line bg-ivory py-10">
      <div className="filmstrip">
        {row.map(([slug, alt, cap], i) => (
          <figure key={`${slug}-${i}`} className="w-[200px] shrink-0 sm:w-[240px]" aria-hidden={i >= sheet.length || undefined}>
            <div className="print-photo aspect-[4/5] rounded-[1px]">
              <img src={src(slug)} alt={i >= sheet.length ? "" : alt} loading="lazy" decoding="async" />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-3">
              <span className="caption-hand text-[0.9rem]">{cap}</span>
              <span className="font-mono text-[0.6rem] tracking-[0.16em] text-ink-4">{String((i % sheet.length) + 1).padStart(2, "0")}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[1380px] px-5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-4 sm:px-8">Illustrative photographs. Your capsule holds your own.</p>
    </section>
  );
}

/** Night section companion: one large print with an index of what gets lost. */
export function LostThings() {
  const items = ["The recipe nobody ever wrote down.", "The voice on an old answering machine.", "The story only Grandpa told right.", "What you'd want your children to know about you."];
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
      <div className="relative">
        <div className="print-photo aspect-[4/5] rounded-[1px]">
          <img src={src("arlington-home")} alt="A family home on an autumn afternoon" loading="lazy" decoding="async" />
        </div>
        <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-night-ink-3">Illustrative photograph</p>
      </div>
      <ol className="divide-y divide-night-line border-y border-night-line">
        {items.map((x, i) => (
          <li key={x} className="grid grid-cols-[3rem_1fr] items-baseline py-6">
            <span className="font-mono text-[0.7rem] tracking-[0.16em] text-night-accent">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-serif text-[clamp(1.4rem,1.15rem+0.9vw,2rem)] font-[320] leading-snug text-night-ink">{x}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Closing editorial spread: three prints and a single line. */
export function EditorialSpread() {
  return (
    <section aria-label="Kept close" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1380px] gap-8 px-5 sm:px-8 md:grid-cols-12 md:items-end">
        <PrintPhoto slug="charles-bookshop" alt="Autumn light in a bookshop" caption="Charles Street, October" className="h-[420px] md:col-span-4 md:-rotate-[1.5deg]" />
        <div className="md:col-span-4 md:pb-16">
          <p className="font-serif text-[clamp(1.9rem,1.4rem+1.6vw,3rem)] font-[300] leading-[1.05] tracking-[-0.03em]">
            Not the milestones. <em className="text-oxblood">The Tuesdays.</em>
          </p>
          <p className="mt-5 max-w-sm text-[1rem] leading-relaxed text-ink-2">The hum at the stove, the walk home, the seat by the window. A capsule keeps the small hours that turn out to be the whole of it.</p>
          <Link href="/examples" className="mt-6 inline-flex font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink link-underline">See example capsules</Link>
        </div>
        <PrintPhoto slug="boston-rooftops" alt="City rooftops at dusk" caption="The last night in the flat" className="h-[520px] md:col-span-4 md:rotate-[1.2deg]" />
      </div>
    </section>
  );
}

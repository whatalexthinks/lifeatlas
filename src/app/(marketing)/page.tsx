import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, Eye, Gift, HardDrive, Lock, Mic, PenLine, ImagePlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, CtaBand, FaqList, FeatureList, PricingCards, SectionHeading, TextLink } from "@/components/marketing/blocks";
import { HeroVignette } from "@/components/marketing/home/hero-vignette";
import { LifeExplorer } from "@/components/marketing/home/life-explorer";
import { BookObject, KeepsakeBox, PhoneFrame, SealedLetter } from "@/components/marketing/objects";
import { MobileStickyCta } from "@/components/marketing/site-header";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage, Mounted } from "@/components/media/media-image";
import { Reveal, RiseText } from "@/components/shared/reveal";
import { chapters } from "@/data/chapters";
import { memories } from "@/data/fixtures/memories";

export const metadata: Metadata = {
  title: { absolute: "LifeAtlas — Every life has a story worth keeping" },
  alternates: { canonical: "/" },
};

const margaret = memories.filter((m) => m.capsuleId === "cap_margaret" && m.status === "approved" && m.privacy === "family");

const faqs: [string, React.ReactNode][] = [
  [
    "Where are memories stored right now?",
    <>In this preview, everything you add stays in this browser on this device. Nothing is uploaded, and nothing is backed up — clearing your browser data removes it. You can download a complete, portable copy at any time. Private cloud storage with independent backups is being built for launch, and we&rsquo;ll show its real status, not a reassuring badge.</>,
  ],
  [
    "Does my grandmother need an account or a password?",
    <>No. The storyteller opens a link, sees one question at a time, and taps one large button to record — or types, or adds a photo. They can skip anything. In this preview, links are demonstrated on one device with a clearly labelled identity switcher; real, secure invitation links arrive with accounts.</>,
  ],
  [
    "Can we edit stories later — names, dates, places?",
    <>Always. Dates can be exact, approximate (&ldquo;around 1972&rdquo;), a season, a decade, or simply unknown. Every edit keeps a short history, so nothing is quietly lost.</>,
  ],
  [
    "What happens if we stop paying, or LifeAtlas disappears?",
    <>Your archive is yours. You can export stories, photographs, recordings and a documented manifest as ordinary files that open without LifeAtlas. Not renewing never deletes anything you&rsquo;ve made. We won&rsquo;t promise &ldquo;forever&rdquo; — we&rsquo;ll make sure you never need us to keep your files.</>,
  ],
  [
    "Who can see what we add?",
    <>Capsules are private by default and never publicly listed. You choose who can view, who can contribute, and whether each story may appear in a printed book or a shared card. Contributors control their own submissions.</>,
  ],
  [
    "Is it accessible for older storytellers?",
    <>Large type, high contrast, one decision per screen, generous touch targets, a typing alternative to voice, and no time limits. We test with keyboard and screen readers and keep improving.</>,
  ],
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden">
        <div className="topo-lines pointer-events-none absolute -right-40 -top-20 h-[640px] w-[1000px] opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden />
        <Container size="wide" className="relative grid items-center gap-12 pb-20 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:pb-28 lg:pt-16 xl:gap-24">
          <div className="max-w-[640px]">
            <p className="eyebrow animate-[fade-up_700ms_var(--ease-out)_both]">A private family archive</p>
            <h1 className="mt-6 font-serif text-display">
              <RiseText text="Every life has a story worth keeping." italicWords={["keeping"]} />
            </h1>
            <p className="mt-7 max-w-[34rem] text-lead text-ink-2 animate-[fade-up_900ms_var(--ease-out)_300ms_both]">
              Save their voice. Gather their photographs. Remember the places that shaped them. Create a private family archive to revisit and pass down.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center animate-[fade-up_900ms_var(--ease-out)_420ms_both]">
              <ButtonLink href="/app/capsules/new" size="xl" trailing={<ArrowUpRight className="size-5" />}>
                Create a memory capsule
              </ButtonLink>
              <ButtonLink href="/demo" size="xl" variant="secondary">
                Explore a sample story
              </ButtonLink>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[0.875rem] text-ink-3 animate-[fade-in_900ms_var(--ease-out)_600ms_both]">
              <li className="inline-flex items-center gap-2">
                <Lock className="size-4 text-evergreen" /> Private by default
              </li>
              <li className="inline-flex items-center gap-2">
                <Download className="size-4 text-evergreen" /> Download everything, anytime
              </li>
              <li className="inline-flex items-center gap-2">
                <Mic className="size-4 text-evergreen" /> No account for storytellers
              </li>
            </ul>
          </div>
          <HeroVignette />
        </Container>
      </section>

      {/* ------------------------------------------------------- MANIFESTO */}
      <section className="border-y border-line bg-ivory/60">
        <Container size="wide" className="grid gap-3 py-10 font-serif text-[clamp(1.5rem,1.1rem+1.6vw,2.4rem)] leading-tight sm:grid-cols-3 sm:gap-8">
          <Reveal className="text-ink-3">Not just photographs.</Reveal>
          <Reveal delay={120} className="text-ink-3">Not just names and dates.</Reveal>
          <Reveal delay={240} className="text-ink">
            <em>The feeling of being there.</em>
          </Reveal>
        </Container>
      </section>

      {/* ----------------------------------------- 1. A QUESTION WORTH ASKING */}
      <section className="py-24 sm:py-32">
        <Container size="wide" className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              eyebrow="01 — A question worth asking"
              title={
                <>
                  Their stories, told in <em>their own words.</em>
                </>
              }
              lead="The stories we love most rarely begin with something extraordinary. They begin with a kitchen table, a long drive, a question you finally thought to ask. LifeAtlas offers one gentle question at a time — and one large button to answer it."
            />
            <Reveal delay={120} className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: <Mic className="size-5" />, t: "Speak", d: "One tap to record. Pause, listen back, try again." },
                { icon: <PenLine className="size-5" />, t: "Write", d: "Type instead, with plenty of room and no time limit." },
                { icon: <ImagePlus className="size-5" />, t: "Show", d: "Add the photograph only they have." },
              ].map((x) => (
                <div key={x.t} className="card-quiet p-5">
                  <span className="grid size-10 place-items-center rounded-full bg-evergreen text-[#f8f6f1]">{x.icon}</span>
                  <p className="mt-4 font-medium">{x.t}</p>
                  <p className="mt-1 text-[0.9375rem] leading-snug text-ink-3">{x.d}</p>
                </div>
              ))}
            </Reveal>
            <Reveal delay={200} className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <TextLink href="/contribute/margaret-stories">See what Margaret sees</TextLink>
              <TextLink href="/storytelling">How storytelling works</TextLink>
            </Reveal>
          </div>
          <Reveal delay={150} className="relative">
            <div className="absolute -left-6 top-10 hidden w-56 rotate-[-4deg] lg:block">
              <Mounted caption="Portland harbor, 1952" meta="No. 002">
                <MediaImage mediaId="med_harbor_1952" className="aspect-[4/3]" />
              </Mounted>
            </div>
            <PhoneFrame className="lg:translate-x-10">
              <div className="flex h-full flex-col px-5 pb-6 pt-14">
                <p className="catalog">Question 2 of 5</p>
                <p className="mt-5 font-serif text-[1.65rem] leading-[1.12]">What did you see on the walk home from school?</p>
                <div className="mt-auto flex flex-col items-center">
                  <span className="relative grid size-24 place-items-center rounded-full bg-terracotta text-white shadow-[0_18px_40px_-14px_rgb(168_95_69/0.8)]">
                    <span className="breathe absolute inset-0 rounded-full text-terracotta" aria-hidden />
                    <Mic className="size-9" />
                  </span>
                  <p className="mt-4 text-[1.05rem] font-medium">Record answer</p>
                  <div className="mt-6 grid w-full grid-cols-2 gap-2 text-[0.8125rem] font-medium">
                    <span className="rounded-full border border-line-strong py-2.5 text-center">Type instead</span>
                    <span className="rounded-full border border-line-strong py-2.5 text-center">Add a photo</span>
                  </div>
                  <p className="mt-4 text-[0.75rem] text-ink-3">Skip this question</p>
                </div>
              </div>
            </PhoneFrame>
            <div className="card-paper relative -mt-10 ml-auto max-w-sm p-5 shadow-lg sm:-mt-16 lg:-mr-4">
              <p className="catalog">Margaret&rsquo;s answer · winter 1952</p>
              <p className="mt-2 font-serif text-[1.2rem] leading-snug">&ldquo;We took the long way home because it passed the harbor. Peter counted boats while I invented stories about where they had been.&rdquo;</p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------- 2. A VOICE WORTH KEEPING */}
      <section className="relative overflow-hidden bg-night py-24 text-night-ink sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(196_173_134/0.12),transparent)]" aria-hidden />
        <Container size="wide" className="relative grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="grid grid-cols-[1fr_0.7fr] items-end gap-5">
              <Mounted className="rotate-[-1.5deg]" caption="Eleanor's kitchen" meta="c. 1947">
                <MediaImage mediaId="med_kitchen_1947" className="aspect-[4/3]" />
              </Mounted>
              <Mounted className="translate-y-6 rotate-[2deg]" meta="No. 001">
                <MediaImage mediaId="med_breadboard_1947" className="aspect-[4/5]" />
              </Mounted>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading
              tone="light"
              eyebrow="02 — A voice worth keeping"
              title={
                <>
                  The voice you never want <em>to forget.</em>
                </>
              }
              lead="A laugh in the middle of a sentence. The pause before the best part. Recordings are kept as they were spoken, with a transcript you can read, correct and search."
            />
            <Reveal delay={120} className="mt-10">
              <AudioPlayer mediaId="aud_bread" title="“The kitchen always smelled of bread” — Margaret, c. 1947" tone="light" />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* -------------------------------------- 3. A LIFETIME BECOMES A PLACE */}
      <section className="relative overflow-hidden bg-[#18201c] py-24 text-night-ink sm:py-32">
        <div className="topo-lines pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <Container size="wide" className="relative">
          <div className="mb-14 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <SectionHeading
              tone="light"
              eyebrow="03 — A lifetime becomes a place to explore"
              title={
                <>
                  The places that made them. <em>The years in between.</em>
                </>
              }
              lead="Every story carries a time and a place — exact, approximate, or simply “the summer we forgot the time.” Move through the decades and watch a life unfold across a map."
            />
          </div>
          <LifeExplorer />
        </Container>
      </section>

      {/* -------------------------------------------- 4. TOGETHER, WHEREVER */}
      <section className="py-24 sm:py-32">
        <Container size="wide" className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="relative order-2 lg:order-1">
            <div className="card-paper relative z-10 max-w-md rotate-[-1deg] p-7 shadow-lg">
              <p className="catalog">Invitation preview · nothing is sent</p>
              <p className="mt-4 font-serif text-[1.6rem] leading-snug">Hi Emma,</p>
              <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">Grandma&rsquo;s archive is coming together. Would you add the story about the blue bowl? A photo too, if you have one.</p>
              <p className="mt-3 font-serif italic text-ink-2">— Sarah</p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="text-[0.8125rem] text-ink-3">3 gentle questions · no password</span>
                <Link href="/contribute/emma-blue-bowl" className="inline-flex items-center gap-1 text-[0.875rem] font-medium text-evergreen hover:underline">
                  Open as Emma <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
            <div className="relative -mt-8 ml-auto w-[78%] rotate-[2deg] sm:-mt-16">
              <Mounted caption="Whatever the week gives you" meta="From Emma">
                <MediaImage mediaId="med_bluebowl_2022" className="aspect-[4/3]" focalY={60} />
              </Mounted>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="04 — Together, wherever you are"
              title={
                <>
                  A little from everyone. <em>A story that&rsquo;s all theirs.</em>
                </>
              }
              lead="Invite a sibling across the country, a cousin with the box of slides, the friend who was there. Each person adds what only they remember — in about a minute — and you decide what becomes part of the archive."
            />
            <Reveal delay={120} className="mt-9">
              <FeatureList items={["Invite by link — no app to install, no password to remember", "Thoughtful prompts for when words don't come easily", "Review contributions before they appear", "Contributors choose whether their story can be printed or shared"]} />
            </Reveal>
            <Reveal delay={200} className="mt-8">
              <TextLink href="/family-collaboration">How family collaboration works</TextLink>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------- 5. A DIGITAL MUSEUM */}
      <section className="bg-ivory/70 py-24 sm:py-32">
        <Container size="wide">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <SectionHeading
              eyebrow="05 — A private museum of one life"
              title={
                <>
                  Chapters, voices, photographs. <em>One beautiful archive.</em>
                </>
              }
            />
            <Reveal>
              <ButtonLink href="/view/cap_margaret" size="lg" trailing={<ArrowUpRight className="size-4" />}>
                Step inside Margaret&rsquo;s archive
              </ButtonLink>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-5 sm:gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <Mounted caption="The red umbrella" meta="June 12, 1965">
                <MediaImage mediaId="med_umbrella_1965" className="aspect-[4/5]" />
              </Mounted>
            </Reveal>
            <div className="grid gap-5 sm:gap-6 lg:col-span-7">
              <div className="grid grid-cols-[1.25fr_1fr] items-end gap-5 sm:gap-6">
                <Reveal delay={80}>
                  <Mounted caption="The crooked porch" meta="c. 1979">
                    <MediaImage mediaId="med_house_1979" className="aspect-[4/3]" />
                  </Mounted>
                </Reveal>
                <Reveal delay={140}>
                  <Mounted caption="First show" meta="1976">
                    <MediaImage mediaId="med_gallery_1976" className="aspect-[4/5]" />
                  </Mounted>
                </Reveal>
              </div>
              <Reveal delay={200}>
                <div className="card-paper grid gap-6 p-6 sm:grid-cols-[1fr_1fr] sm:p-8">
                  <div>
                    <p className="eyebrow plain">Eight chapters</p>
                    <ol className="mt-5 space-y-2.5">
                      {chapters.map((c, i) => (
                        <li key={c.id} className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5 last:border-0">
                          <span className="font-serif text-[1.2rem]">
                            <span className="catalog mr-2">{String(i + 1).padStart(2, "0")}</span>
                            {c.title}
                          </span>
                          <span className="catalog">{margaret.filter((m) => m.chapter === c.id).length}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex flex-col justify-between gap-6">
                    <p className="font-serif text-[1.45rem] leading-snug text-ink-2">&ldquo;Take the photograph, but put the camera down too. Ask the question you keep saving for later.&rdquo;</p>
                    <AudioPlayer mediaId="aud_know" variant="mini" title="What I know now" showNotice={false} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------- 6. THE GIFT */}
      <section className="py-24 sm:py-32">
        <Container size="wide">
          <SectionHeading
            align="center"
            eyebrow="06 — The gift you make together"
            title={
              <>
                Give a gift that <em>asks</em> as much as it gives.
              </>
            }
            lead="Wrap a capsule with a dedication, then gather around the table this holiday — or send a link to someone far away and let the questions do the rest."
          />
          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <Reveal className="group relative overflow-hidden rounded-[28px] bg-evergreen p-8 text-[#f2eee5] sm:p-10">
              <div className="topo-lines pointer-events-none absolute inset-0 opacity-25" aria-hidden />
              <Users className="relative size-7 text-[#d7bd8a]" />
              <h3 className="relative mt-6 font-serif text-[2.2rem] leading-tight">Together, in person</h3>
              <p className="relative mt-3 max-w-md text-[1.0625rem] leading-relaxed text-[#d7ddd6]">A pass-the-device session for the holidays: choose five questions, record around the table, and end the evening with a little booklet of what you heard.</p>
              <div className="relative mt-8">
                <ButtonLink href="/gifts/holiday" variant="light" trailing={<ArrowUpRight className="size-4" />}>
                  Plan a holiday session
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={100} className="relative overflow-hidden rounded-[28px] bg-[#efe3cf] p-8 sm:p-10">
              <Gift className="size-7 text-terracotta" />
              <h3 className="mt-6 font-serif text-[2.2rem] leading-tight">Send a beautiful link</h3>
              <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-ink-2">Write a dedication, choose an envelope, and preview exactly what they&rsquo;ll open. Share it yourself, when the moment is right.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/gifts" trailing={<ArrowUpRight className="size-4" />}>
                  Design a gift
                </ButtonLink>
                <ButtonLink href="/gift/for-grandpa-walt" variant="secondary">
                  See a gift opening
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------- 7. LETTERS THROUGH TIME */}
      <section className="relative overflow-hidden bg-night py-24 text-night-ink sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_25%_60%,rgb(196_173_134/0.14),transparent)]" aria-hidden />
        <Container size="wide" className="relative grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="flex justify-center">
            <SealedLetter to="Emma Ellis" openOn="April 12, 2035" tone="night" className="rotate-[-3deg]" />
          </Reveal>
          <div>
            <SectionHeading
              tone="light"
              eyebrow="07 — Letters Through Time"
              title={
                <>
                  A little of today, <em>waiting for tomorrow.</em>
                </>
              }
              lead="Write a letter for a wedding day, a thirtieth birthday, a first child. Choose the date or the milestone, seal it, and preview the moment it opens."
            />
            <Reveal delay={120} className="mt-8 rounded-[16px] border border-[#c4ad86]/30 bg-[#c4ad86]/[0.08] px-5 py-4 text-[0.9375rem] leading-relaxed text-night-ink-2">
              <strong className="font-semibold text-night-ink">A preview feature.</strong> You can write, save and preview letters today. Long-term delivery isn&rsquo;t available yet — we won&rsquo;t sell it until the
              service, its succession plan and its legal review are ready.
            </Reveal>
            <Reveal delay={180} className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <TextLink href="/letters-through-time" tone="light">
                Design your future message
              </TextLink>
              <TextLink href="/future/open/example-opening" tone="light">
                Preview an opening
              </TextLink>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------- 8. MADE TO HOLD */}
      <section className="overflow-hidden bg-[#ebe4d6] py-24 sm:py-32">
        <Container size="wide" className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="08 — Made to hold"
              title={
                <>
                  Some stories belong <em>in your hands.</em>
                </>
              }
              lead="Turn the archive into a linen-bound book to leave on the table, or a keepsake box of letters and photographs to open together. Every heirloom starts as a proof you approve."
            />
            <Reveal delay={100} className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/heirlooms" trailing={<ArrowUpRight className="size-4" />}>
                Explore heirlooms
              </ButtonLink>
              <ButtonLink href="/app/heirlooms/book-builder" variant="secondary">
                Design a book
              </ButtonLink>
            </Reveal>
            <p className="mt-5 text-[0.875rem] text-ink-3">Product previews. Printing and shipping are not connected yet; nothing will be made or charged.</p>
          </div>
          <Reveal delay={120} className="relative flex min-h-[420px] items-center justify-center">
            <div className="absolute right-0 top-0 hidden w-[58%] opacity-95 md:block">
              <KeepsakeBox finish="walnut" />
            </div>
            <BookObject className="relative z-10 md:-translate-x-16 md:translate-y-10" size="lg" />
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------- 9. YOUR DECISIONS */}
      <section className="py-24 sm:py-32">
        <Container size="wide">
          <SectionHeading
            eyebrow="09 — Your memories, your decisions"
            title={
              <>
                Private by default. <em>Portable by design.</em>
              </>
            }
            lead="A family archive is a responsibility. We designed LifeAtlas so you never have to take our word for it."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Lock className="size-5" />, t: "Private by default", d: "Never publicly listed or indexed. Sharing a single story is always a deliberate, opt-in choice." },
              { icon: <Eye className="size-5" />, t: "You choose who sees what", d: "Viewers, contributors and organizers each see only what they should. Contributors decide if their story can be printed." },
              { icon: <Download className="size-5" />, t: "Download everything", d: "A real archive file: stories, photos, recordings, a readable offline page and a documented manifest with checksums." },
              { icon: <HardDrive className="size-5" />, t: "Honest preservation", d: "We show exactly where your files live and whether backups are verified — including, in this preview, that they aren't connected yet." },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 80} className="card-paper p-6">
                <span className="grid size-11 place-items-center rounded-full bg-evergreen-soft text-evergreen">{x.icon}</span>
                <h3 className="mt-5 font-serif text-[1.55rem] leading-tight">{x.t}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-3">{x.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8">
            <TextLink href="/preservation">Read our preservation principles</TextLink>
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------- 10. PRICING */}
      <section className="border-t border-line bg-ivory/50 py-24 sm:py-32">
        <Container size="wide">
          <div className="mb-14 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <SectionHeading eyebrow="10 — Simple, transparent pricing" title={<>A small start. <em>Something lasting.</em></>} lead="Pay once for a capsule. Renew only if you want to keep adding. These are test prices for this preview — nothing is charged." />
            <Reveal>
              <TextLink href="/pricing">Compare every detail</TextLink>
            </Reveal>
          </div>
          <PricingCards />
        </Container>
      </section>

      {/* ------------------------------------------- 11. FAQ */}
      <section className="py-24 sm:py-32">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="11 — Questions & reassurance" title={<>Thoughtfully <em>answered.</em></>} lead={<>More in the <Link href="/faq" className="text-link">full FAQ</Link>.</>} />
          <Reveal>
            <FaqList items={faqs} />
          </Reveal>
        </Container>
      </section>

      <CtaBand />
      <MobileStickyCta />
    </>
  );
}

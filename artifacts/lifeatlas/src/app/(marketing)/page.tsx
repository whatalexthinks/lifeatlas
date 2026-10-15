import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/blocks";
import { BookObject, KeepsakeBox, SealedLetter } from "@/components/marketing/objects";
import { MobileStickyCta } from "@/components/marketing/site-header";
import { Plate } from "@/components/media/media-image";
import { ArrowLink, CheckList, Container, Eyebrow, FinalCta, Heading, JsonLd, Numbered, PreviewNote, Section, Split } from "@/components/site/kit";
import { appConfig } from "@/lib/config";
import { FutureMessagePreview, InvitationPreview, QuestionTry, StoryPreview, TimelinePreview, VoicePreview } from "@/components/site/previews";
import { AudienceGrid } from "@/components/site/audiences";
import { PlanPricing } from "@/components/site/pricing";
import { formatMoney } from "@/lib/utils";
import { defaultCatalog } from "@/data/product-catalog";
import { brand } from "@/config/brand";
import { ContactSheet, EditorialSpread, HeroCapsule, LostThings } from "@/components/marketing/home/editorial";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} · Digital and physical family memory capsules` },
  description: "Go beyond names and dates. Gather family stories, voices, photographs and letters with guided questions, then create a digital memory capsule, an optional physical keepsake, or both.",
  alternates: { canonical: "/" },
};

const price = (id: string) => formatMoney(defaultCatalog.find((p) => p.id === id)!.price.amount);
const monthlyPrice = (id: string) => formatMoney(defaultCatalog.find((p) => p.id === id)!.monthly!.amount);

const faqs: [string, React.ReactNode][] = [
  ["What is a memory capsule?", "A private place for the story of a life or a relationship: written memories, recorded answers, photographs, dates and places. You can explore it as a timeline or in chapters, invite people to add what they remember, and turn it into a printed book or a physical keepsake."],
  ["Do the people I invite have to pay?", "No. The owner chooses a plan; invited contributors and readers are planned to join free, with no card. In this preview, invitations are local links on this device."],
  ["What can I try today?", `Almost everything, on this device: create capsules, answer questions, record your voice, add photographs, invite family with a link, design a book and prepare future messages. Accounts, cloud storage, payments, printing and delivery aren't connected yet, the preview says so wherever it matters.`],
  ["Are my memories backed up?", "Not in this preview. What you add stays in this browser. Download a copy of anything that matters, a complete export with your stories and files is always one click away."],
];

export default function HomePage() {
  const site = appConfig.siteUrl.replace(/\/$/, "");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: brand.name, url: site, logo: `${site}/icon.svg` },
            { "@type": "WebSite", name: brand.name, url: site, description: brand.philosophy },
          ],
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
        <Container size="wide">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
            <div>
              <Eyebrow className="hero-rise">For families who keep their history</Eyebrow>
              <h1 className="display-1 hero-rise mt-7 text-[clamp(3.1rem,5vw,5.1rem)] [--d:120ms]">
                A family tree tells you who came before. <em>A memory capsule keeps their stories.</em>
              </h1>
              <p className="lead hero-rise mt-7 max-w-xl [--d:240ms]">
                Bring photographs, voices, letters and memories together, with guided questions that show you where to start. {brand.name} gives you a place and a structure to build a private family capsule: digital, physical, or both.
              </p>
              <p className="hero-rise mt-4 max-w-xl text-[0.875rem] leading-relaxed text-ink-3 [--d:300ms]">
                One digital capsule from {monthlyPrice("digital")} a month. Physical books and keepsake boxes are separate. Demo pricing only, no charge.
              </p>
              <div className="hero-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 [--d:360ms]">
                <ButtonLink href="/app/capsules/new" size="xl">
                  Start free
                </ButtonLink>
                <ButtonLink href="/examples" variant="secondary" size="xl">
                  See a sample capsule
                </ButtonLink>
              </div>
              <div className="hero-rise mt-10 max-w-xl space-y-2 border-t border-line pt-5 [--d:480ms]">
                <p className="text-[0.9375rem] text-ink-2"><span className="font-medium text-ink">The owner pays. Invited family are planned to join free.</span></p>
                <p className="font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.16em] text-ink-3">One capsule from {monthlyPrice("digital")} a month. Demo price only, nothing is charged. This preview runs in your browser. No card, no account. Invitations are local links for now.</p>
              </div>
            </div>
            <HeroCapsule />
          </div>
        </Container>
      </section>

      <section aria-label="Family tree and memory capsule" className="border-y border-line bg-ivory">
        <Container size="wide">
          <div className="grid gap-px bg-line py-0 md:grid-cols-[1fr_1fr_1.2fr]">
            <div className="bg-ivory py-7 md:pr-8">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-4">A family tree</p>
              <p className="mt-2 text-[1rem] leading-snug text-ink-2">Names, dates and who came before. Keep using the tools you already love for that.</p>
            </div>
            <div className="bg-ivory py-7 md:px-8">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-oxblood">A memory capsule</p>
              <p className="mt-2 text-[1rem] leading-snug text-ink">How they sounded, what they cooked, the story behind each photograph and letter.</p>
            </div>
            <div className="bg-ivory py-7 md:pl-8">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-evergreen">What {brand.name} adds</p>
              <p className="mt-2 text-[1rem] leading-snug text-ink">A place and a structure: guided questions, chapters and a timeline for the digital capsule, plus an optional printed book or keepsake box, priced separately.</p>
            </div>
          </div>
        </Container>
      </section>

      <ContactSheet />

      {/* The problem */}
      <Section tone="night" labelledBy="why">
        <Container size="wide">
          <Heading
            id="why"
            eyebrow="Why it matters"
            title={
              <>
                The photographs survive. <em>The stories behind them don&rsquo;t.</em>
              </>
            }
            lead="It isn't the big events we lose first. It's how she said your name, the song he whistled at the stove, the way the two of you tell the story of how you met, each a little differently. Those live in people, not on phones."
          />
          <div className="mt-16">
            <LostThings />
          </div>
        </Container>
      </Section>

      {/* C, Real product */}
      <Section labelledBy="product">
        <Container size="wide">
          <Heading
            id="product"
            eyebrow="Inside a capsule"
            title={
              <>
                Stories, voices and photographs, <em>kept in one place.</em>
              </>
            }
            lead="These are real screens from the product, showing the fictional sample family. Every story page, timeline and recording you see here is something you can make today."
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <StoryPreview />
            <div className="grid content-start gap-6">
              <TimelinePreview limit={5} />
              <VoicePreview />
            </div>
          </div>
        </Container>
      </Section>

      {/* D, Entry points */}
      <Section tone="ivory" labelledBy="whose">
        <Container size="wide">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading
              id="whose"
              eyebrow="Whose story first?"
              title={
                <>
                  One capsule for each story <em>you want to keep.</em>
                </>
              }
            />
            <ArrowLink href="/examples">See example capsules</ArrowLink>
          </div>
          <AudienceGrid className="mt-14" />
        </Container>
      </Section>

      {/* E, How it works */}
      <Section labelledBy="how">
        <Container size="wide">
          <Heading
            id="how"
            eyebrow="How it works"
            title={
              <>
                You don&rsquo;t need a memoir. <em>Just one good question.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={4}
            items={[
              { title: "Choose whose story", body: "Yours, the two of you, your family, a parent, a child or someone special. A name is all we ask." },
              { title: "Answer a question", body: "Speak it, type it or start from a photograph. Skip any question; answer a favourite twice." },
              { title: "Invite people in", body: "Partners, siblings, grandchildren. They add what only they remember, free, and with your say on what's kept." },
              { title: "Keep it close", body: "Explore it as a timeline, print it as a book, prepare messages for the future, and download it any time." },
            ]}
          />
          <div className="mt-12">
            <ArrowLink href="/how-it-works">The whole journey, step by step</ArrowLink>
          </div>
        </Container>
      </Section>

      {/* Try a question (a working piece of the product) */}
      <Section tone="surface" space="tight" labelledBy="try">
        <Container size="wide">
          <Split
            media={<QuestionTry />}
            reverse
          >
            <Heading
              id="try"
              eyebrow="Try it now"
              title={
                <>
                  Not sure where to start? <em>Let us ask.</em>
                </>
              }
              lead="Choose whose story you're thinking of, and we'll offer a question written for it, how you met, what your grandmother cooked without a recipe, what you hope your child remembers."
            />
          </Split>
        </Container>
      </Section>

      {/* F, Voice */}
      <Section labelledBy="voice">
        <Container size="wide">
          <Split media={<VoicePreview audioId="aud_seat" title="The seat by the window" />}>
            <Heading
              id="voice"
              eyebrow="Voice"
              title={
                <>
                  The laugh, the pause, <em>the way they tell it.</em>
                </>
              }
              lead="A recording keeps what writing can't. Answer out loud on a phone or a laptop, one large button, no settings to learn. If recording isn't possible on a device, you can upload a file or type instead."
            >
              <CheckList className="mt-8" items={["Recordings are kept exactly as spoken", "Transcripts are only ever what you type, never invented", "Works with large text and on older phones"]} />
            </Heading>
          </Split>
        </Container>
      </Section>

      {/* G, Example walkthrough */}
      <Section tone="ivory" labelledBy="walkthrough">
        <Container size="wide">
          <Heading
            id="walkthrough"
            eyebrow="An example, start to finish"
            title={
              <>
                Sarah &amp; Jonah&rsquo;s capsule, <em>one answer at a time.</em>
              </>
            }
            lead="A fictional couple, shown to make the idea concrete. Twenty-seven years of marriage began with one broken umbrella."
          />
          <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { plate: "umbrella-1998", step: "Sarah answers “How did we meet?”", body: "She types it on her phone one evening, the rain, the red umbrella, the forty minutes in a doorway." },
              { plate: "bookshop-1998", step: "Jonah answers the same question", body: "His version starts with her laugh. Both answers are kept, side by side." },
              { plate: "orchard-2001", step: "Their daughter adds the wedding", body: "Emma is invited free, and adds the orchard photograph Sarah had never seen." },
              { plate: "porch-2025", step: "A letter for their thirtieth", body: "They write to each other, to be opened in 2031, prepared now, with no false promise about delivery." },
            ].map((s, i) => (
              <li key={s.step} className="flex flex-col">
                <div className="mount">
                  <Plate id={s.plate} alt="" className="aspect-[4/3]" />
                </div>
                <p className="mt-5 font-mono text-[0.7rem] tracking-[0.2em] text-oxblood">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="display-3 mt-2 !text-[1.3rem]">{s.step}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <ArrowLink href="/examples">Explore the sample capsules</ArrowLink>
          </div>
        </Container>
      </Section>

      {/* H, Physical keepsakes */}
      <Section labelledBy="keepsakes">
        <Container size="wide">
          <Split
            media={
              <div className="relative grid min-h-[360px] place-items-center rounded-[2px] bg-ivory p-8 sm:min-h-[460px]">
                <div className="w-[62%] max-w-[330px]">
                  <KeepsakeBox finish="linen_wrapped" engraving="Sarah & Jonah · 1998, " />
                </div>
                <div className="absolute bottom-8 right-8 hidden w-[32%] max-w-[180px] sm:block">
                  <BookObject title="Our Story" subtitle="Sarah & Jonah" years="1998, " color="terracotta" size="sm" eyebrow="" />
                </div>
              </div>
            }
          >
            <Heading
              id="keepsakes"
              eyebrow="Physical keepsakes"
              title={
                <>
                  From a screen <em>to something you can hold.</em>
                </>
              }
              lead="Two optional add-ons for any capsule. Nothing physical is ever required to use the digital one."
            >
              <dl className="mt-8 divide-y divide-line border-y border-line">
                <div className="flex items-baseline justify-between gap-6 py-5">
                  <dt>
                    <span className="block font-medium">Physical memory capsule</span>
                    <span className="mt-1 block text-[0.9375rem] text-ink-3">A gift-ready archival kit: keepsake box, prompt cards, photo sleeves and letter envelopes.</span>
                  </dt>
                  <dd className="shrink-0 font-sans text-[1.5rem] tracking-[-0.03em]">{price("keepsake_box")}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-5">
                  <dt>
                    <span className="block font-medium">Printed Legacy Book</span>
                    <span className="mt-1 block text-[0.9375rem] text-ink-3">Designed from the stories you choose, printed only after you approve a proof.</span>
                  </dt>
                  <dd className="shrink-0 font-sans text-[1.5rem] tracking-[-0.03em]">from {price("book")}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                <ArrowLink href="/physical-capsules">See the keepsakes</ArrowLink>
              </div>
              <PreviewNote className="mt-6">Test prices. Payments, printing and shipping aren&rsquo;t connected in this preview, you can design both, and nothing is charged.</PreviewNote>
            </Heading>
          </Split>
        </Container>
      </Section>

      {/* I, Gifting */}
      <Section tone="night" labelledBy="gifts">
        <Container size="wide">
          <Split
            reverse
            media={
              <div className="grid place-items-center py-6">
                <SealedLetter to="Mum" openOn="Mother's Day" tone="night" />
              </div>
            }
          >
            <Heading
              id="gifts"
              eyebrow="Gifts"
              title={
                <>
                  Give someone <em>the beginning of their story.</em>
                </>
              }
              lead="A year of their own capsule, a physical kit to open together, or both, with a note from you. They choose when to begin; you can help, or simply listen."
            >
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <ButtonLink href="/gifts/build" variant="light" size="lg">
                  Give a memory capsule
                </ButtonLink>
                <ArrowLink href="/gifts">How gifting works</ArrowLink>
              </div>
            </Heading>
          </Split>
        </Container>
      </Section>

      {/* Collaboration & future messages */}
      <Section labelledBy="together">
        <Container size="wide">
          <Heading
            id="together"
            eyebrow="Together, and for later"
            title={
              <>
                Everyone remembers something. <em>Some things are meant for later.</em>
              </>
            }
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:items-start">
            <InvitationPreview />
            <FutureMessagePreview />
          </div>
        </Container>
      </Section>

      {/* J, Pricing */}
      <Section tone="ivory" labelledBy="pricing">
        <Container size="wide">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading
              id="pricing"
              eyebrow="Pricing"
              title={
                <>
                  One owner pays monthly. <em>Family joins free.</em>
                </>
              }
              lead="Try everything free in this browser demo. Paid checkout is a test only and charges nothing. Invited contributors will join free on a membership; in this preview they use local links."
            />
            <ArrowLink href="/pricing">Compare plans in detail</ArrowLink>
          </div>
          <PlanPricing className="mt-12" />
        </Container>
      </Section>

      {/* K, Trust */}
      <Section labelledBy="trust">
        <Container size="wide">
          <Heading
            id="trust"
            eyebrow="Privacy and trust"
            title={
              <>
                Private by default. <em>Honest about the rest.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={4}
            items={[
              { title: "Private by default", body: "Capsules are never public or listed anywhere. Nobody sees one until you invite them." },
              { title: "Your call, memory by memory", body: "Keep any story to yourself, share it with the capsule's editors, or with everyone you've invited." },
              { title: "Always yours to take", body: "Download everything, stories as readable files, your photographs and recordings, whenever you like." },
              { title: "No promises we can't keep", body: "No invented dates or transcripts, no false security claims. In this preview, everything stays in your browser, and we say so." },
            ]}
          />
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href="/privacy">How we handle your memories</ArrowLink>
            <ArrowLink href="/preservation">Our approach to keeping them</ArrowLink>
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="questions">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <Heading
              id="questions"
              eyebrow="Questions"
              title={
                <>
                  Good questions, <em>straight answers.</em>
                </>
              }
            >
              <div className="mt-8">
                <ArrowLink href="/faq">All questions and answers</ArrowLink>
              </div>
            </Heading>
            <FaqList items={faqs} />
          </div>
        </Container>
      </Section>

      <EditorialSpread />

      <FinalCta
        title={
          <>
            Start with one story. <em>The rest will follow.</em>
          </>
        }
        lead="For yourself, for the two of you, or for someone you love."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create a capsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/gifts/build">Or give one as a gift</ArrowLink>}
      />
      <MobileStickyCta label="Create a capsule" />
    </>
  );
}

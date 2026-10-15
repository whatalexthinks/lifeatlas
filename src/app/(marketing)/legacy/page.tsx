import type { Metadata } from "next";
import { Armchair, Link2, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { ArrowLink, CheckList, Container, FinalCta, Heading, Numbered, PageIntro, PreviewNote, PullQuote, Section, Split, SampleTag } from "@/components/site/kit";
import { PlateStrip, VoicePreview } from "@/components/site/previews";
import { libraryQuestions, sampleCapsule, sampleMemory } from "@/components/site/samples";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "For a parent or grandparent",
  description: `Record a parent's or grandparent's life story in their own voice with ${brand.name}: simple for older storytellers, shared with the family, and kept for the generations after.`,
  alternates: { canonical: "/legacy" },
};

export default function LegacyPage() {
  const margaret = sampleCapsule("cap_margaret");
  const light = sampleMemory("mem_fam_light");
  const columns = [
    { title: "The house they grew up in", qs: libraryQuestions("Childhood", 3) },
    { title: "Their own parents", qs: libraryQuestions("Parents", 3) },
    { title: "The work of a life", qs: libraryQuestions("Work", 3) },
  ];
  return (
    <>
      <PageIntro
        eyebrow="For a parent or grandparent"
        title={
          <>
            In their own words, <em>before the details fade.</em>
          </>
        }
        lead="The ferry their father worked on. The recipe they never wrote down. The year everything changed. Give them a gentle way to tell it — and give the family a place to keep it, in their own voice."
        actions={
          <>
            <ButtonLink href="/app/capsules/new?kind=parent" size="xl">
              Start their capsule
            </ButtonLink>
            <ArrowLink href="#begin">Three ways to begin</ArrowLink>
          </>
        }
        media={
          <div className="grid gap-5 sm:grid-cols-[0.8fr_1fr] sm:items-end">
            <figure>
              <CapsuleCover capsule={margaret} size="md" className="aspect-[4/5] rounded-[18px] shadow-[var(--shadow-object)]" />
              <figcaption className="mt-3">
                <SampleTag />
              </figcaption>
            </figure>
            <VoicePreview audioId="aud_letter" title="A letter for Emma" />
          </div>
        }
      />

      <Section id="begin" tone="ivory" labelledBy="begin-title">
        <Container size="wide">
          <Heading
            id="begin-title"
            eyebrow="Three ways to begin"
            title={
              <>
                Whatever suits them. <em>At their pace.</em>
              </>
            }
          />
          <ul className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              { Icon: Armchair, title: "Sit together", body: "Bring a phone or a tablet, read them a question, press record. You hold the device; they just talk. Often the easiest way to start." },
              { Icon: Link2, title: "Send them a link", body: "They answer from their own armchair on a large, simple page: one question, one big button, no password to remember." },
              { Icon: Users, title: "Gather the family", body: "At a holiday or a birthday, pass one device round the table. Everyone asks a question; everyone hears the answers." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="rounded-[22px] bg-surface p-7">
                <Icon className="size-6 text-oxblood" aria-hidden />
                <h3 className="display-3 mt-5 !text-[1.4rem]">{title}</h3>
                <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
          <PreviewNote className="mt-10">In this preview, a link opens in this browser only; sending it by email or text isn&rsquo;t connected, and we&rsquo;ll never tell you a message was sent when it wasn&rsquo;t.</PreviewNote>
        </Container>
      </Section>

      <Section labelledBy="designed">
        <Container size="wide">
          <Split
            media={
              <div className="rounded-[24px] border border-line bg-surface p-7 sm:p-9">
                <p className="catalog">What a storyteller sees</p>
                <p className="mt-5 font-serif text-[clamp(1.8rem,1.5rem+1.2vw,2.6rem)] leading-[1.12]">What was the kitchen like in the house where you grew up?</p>
                <div className="mt-8 flex flex-col items-start gap-4">
                  <span className="inline-flex min-h-16 items-center gap-3 rounded-full bg-ink px-8 text-[1.15rem] font-medium text-paper">
                    <span className="size-3 rounded-full bg-oxblood-soft" aria-hidden /> Tap to answer out loud
                  </span>
                  <span className="text-[1.05rem] text-ink-2">or type instead · skip this question</span>
                </div>
              </div>
            }
          >
            <Heading
              id="designed"
              eyebrow="Made for older storytellers"
              title={
                <>
                  Large, calm and clear. <em>Nothing to learn.</em>
                </>
              }
              lead="We design for people who didn't grow up with screens — and test with them in mind."
            >
              <CheckList
                className="mt-8"
                items={["Large text, strong contrast, and a setting for even larger text", "One question and one obvious button per screen", "Works on tablets and older phones, in landscape or portrait", "No passwords on a contribution link", "Reduced motion respected everywhere"]}
              />
              <p className="mt-6 text-[0.875rem] text-ink-3">We work to WCAG 2.2 AA and test with keyboards and screen readers. It isn&rsquo;t a certification, and we keep improving.</p>
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="ask">
        <Container size="wide">
          <Heading
            id="ask"
            eyebrow="Questions they'll enjoy"
            title={
              <>
                Most people love being asked. <em>Almost nobody asks.</em>
              </>
            }
          />
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title} className="border-t border-line-strong pt-6">
                <h3 className="display-3 !text-[1.3rem]">{c.title}</h3>
                <ul className="mt-5 space-y-4">
                  {c.qs.map((q) => (
                    <li key={q.id} className="font-serif text-[1.15rem] leading-snug">
                      {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="night" labelledBy="remember">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Heading
              id="remember"
              eyebrow="When someone has already gone"
              title={
                <>
                  It isn&rsquo;t too late <em>to gather what&rsquo;s left.</em>
                </>
              }
              lead="Start a capsule for someone you miss and invite the people who knew them. Each person remembers something different; together it becomes a portrait. Days of remembrance can sit among your key dates, quietly."
            >
              <div className="mt-8">
                <ButtonLink href="/app/capsules/new?kind=someone" variant="light" size="lg">
                  Start a remembrance capsule
                </ButtonLink>
              </div>
            </Heading>
            <PullQuote cite={`From “${light.title}” — fictional sample`}>&ldquo;{light.quote ?? light.narrative.split("\n\n")[0]}&rdquo;</PullQuote>
          </div>
        </Container>
      </Section>

      <Section labelledBy="pass-on">
        <Container size="wide">
          <Heading
            id="pass-on"
            eyebrow="Passing it on"
            title={
              <>
                Made to be <em>handed down.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={3}
            items={[
              { title: "A printed book", body: "Their stories and photographs, designed by you and printed only after you approve a proof.", aside: <ArrowLink href="/physical-capsules#book">The Legacy Book</ArrowLink> },
              { title: "A copy for everyone", body: "Download the whole capsule — readable stories, photographs and recordings — and give each grandchild their own copy.", aside: <ArrowLink href="/preservation">How we think about keeping</ArrowLink> },
              { title: "Someone to look after it", body: "Name a successor you trust to care for the capsule in future. The verified handover arrives with hosted accounts.", aside: <ArrowLink href="/faq#keeping">About successors</ArrowLink> },
            ]}
          />
          <PlateStrip className="mt-16" memoryIds={["mem_fam_ferry", "mem_fam_colette", "mem_fam_recipe", "mem_fam_canoe"]} />
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Ask them <em>this weekend.</em>
          </>
        }
        lead="One question is enough to begin. You'll be surprised what comes next."
        primary={
          <ButtonLink href="/app/capsules/new?kind=parent" size="xl">
            Start their capsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/gifts">Or give it to them as a gift</ArrowLink>}
      />
    </>
  );
}

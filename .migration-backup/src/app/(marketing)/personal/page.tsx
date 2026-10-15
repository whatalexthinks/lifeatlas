import type { Metadata } from "next";
import { Lock, Mic, PenLine, Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { ArrowLink, Container, FinalCta, Heading, PageIntro, Section, Split, SampleTag } from "@/components/site/kit";
import { FutureMessagePreview, QuestionTry } from "@/components/site/previews";
import { libraryQuestions, sampleCapsule } from "@/components/site/samples";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Your own story",
  description: `Keep your own life story in ${brand.name}: a private capsule for the places, people and lessons that shaped you — written or spoken a few minutes at a time.`,
  alternates: { canonical: "/personal" },
};

export default function PersonalPage() {
  const capsule = sampleCapsule("cap_sarah");
  const pick = libraryQuestions;
  const columns = [
    { title: "Where you come from", qs: [...pick("Childhood", 2), ...pick("Places", 1)] },
    { title: "What you've learned", qs: [...pick("Values", 1), ...pick("Wisdom", 1), ...pick("Advice", 1)] },
    { title: "What you still hope for", qs: [...pick("Hopes & Dreams", 2), ...pick("Messages to Descendants", 1)] },
  ].filter((c) => c.qs.length);
  return (
    <>
      <PageIntro
        eyebrow="Your own story"
        title={
          <>
            Your life, <em>in your own words.</em>
          </>
        }
        lead="Not a memoir. A place to put things down as they come back to you — the street you grew up on, the job that changed you, the advice you'd give your younger self. For you now, and for whoever comes after."
        actions={
          <>
            <ButtonLink href="/app/capsules/new?kind=personal" size="xl">
              Start your own capsule
            </ButtonLink>
            <ArrowLink href="#try">Try a question</ArrowLink>
          </>
        }
        media={
          <figure className="relative mx-auto max-w-[420px]">
            <CapsuleCover capsule={capsule} size="lg" className="aspect-[4/5] rounded-[20px] shadow-[var(--shadow-object)]" />
            <div className="absolute -bottom-6 -left-4 flex max-w-[260px] items-start gap-3 rounded-[16px] border border-line bg-surface p-4 shadow-[0_24px_50px_-30px_rgb(37_36_33/0.5)] sm:-left-10">
              <Lock className="mt-0.5 size-4 shrink-0 text-oxblood" aria-hidden />
              <p className="text-[0.875rem] leading-snug">Private by default. Nothing is shared until you decide it should be.</p>
            </div>
            <figcaption className="mt-12 flex justify-end">
              <SampleTag>Fictional sample capsule</SampleTag>
            </figcaption>
          </figure>
        }
      />

      <Section tone="ivory" labelledBy="ways">
        <Container size="wide">
          <Heading
            id="ways"
            eyebrow="A few minutes at a time"
            title={
              <>
                Write when it comes to you. <em>Or just say it.</em>
              </>
            }
          />
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { Icon: Mic, title: "Speak it on a walk", body: "Answer out loud on your phone. Your voice is kept as you said it — no invented transcript." },
              { Icon: PenLine, title: "Write it at night", body: "A few lines or a few pages. Drafts save as you type, so an interruption costs you nothing." },
              { Icon: Clock, title: "Come back next week", body: "A question waits on your home page. Skip it, save it, or answer an old favourite again." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="rounded-[20px] bg-surface p-7">
                <Icon className="size-5 text-oxblood" aria-hidden />
                <h3 className="display-3 mt-5 !text-[1.35rem]">{title}</h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section labelledBy="prompts">
        <Container size="wide">
          <Heading
            id="prompts"
            eyebrow="Questions worth answering"
            title={
              <>
                Start anywhere. <em>Your life isn&rsquo;t in order either.</em>
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

      <Section id="try" tone="surface" labelledBy="try-title">
        <Container size="wide">
          <Split reverse media={<QuestionTry initialKind="personal" />}>
            <Heading
              id="try-title"
              eyebrow="Try one now"
              title={
                <>
                  One question. <em>Five minutes.</em>
                </>
              }
              lead="Press Surprise me until one makes you smile. That's the one to answer first."
            />
          </Split>
        </Container>
      </Section>

      <Section labelledBy="after">
        <Container size="wide">
          <Split media={<FutureMessagePreview />}>
            <Heading
              id="after"
              eyebrow="For the people who come after"
              title={
                <>
                  Leave them more than <em>a box of photographs.</em>
                </>
              }
              lead="Share chosen stories with your family now, seal letters for later, and name someone you trust to look after your capsules if you can't."
            >
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                <ArrowLink href="/legacy">Legacy and successors</ArrowLink>
                <ArrowLink href="/physical-capsules#book">Print it as a book</ArrowLink>
              </div>
            </Heading>
          </Split>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            You&rsquo;re the only one <em>who can tell it.</em>
          </>
        }
        lead="Start with the house you grew up in."
        primary={
          <ButtonLink href="/app/capsules/new?kind=personal" size="xl">
            Start your own capsule
          </ButtonLink>
        }
      />
    </>
  );
}

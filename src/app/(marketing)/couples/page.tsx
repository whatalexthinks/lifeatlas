import type { Metadata } from "next";
import { Eye, Lock, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, Container, FinalCta, Heading, PageIntro, PreviewNote, Section, Split } from "@/components/site/kit";
import { FutureMessagePreview, PlateStrip, TimelinePreview, TwoAnswers } from "@/components/site/previews";
import { libraryQuestions, sampleCapsule } from "@/components/site/samples";
import { formatMoney } from "@/lib/utils";
import { defaultCatalog } from "@/data/product-catalog";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "For couples",
  description: `A private capsule for the two of you: how you met, your firsts, letters to each other and the small moments only you know — told by both of you, in ${brand.name}.`,
  alternates: { canonical: "/couples" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CouplesPage() {
  const groups = (["Our Story", "Us, Now", "Our Future"] as const).map((category) => ({ category, questions: libraryQuestions(category, 5) }));
  const us = sampleCapsule("cap_us");
  const digital = defaultCatalog.find((p) => p.id === "digital")!;
  return (
    <>
      <PageIntro
        eyebrow="For couples"
        title={
          <>
            Your story, <em>told by both of you.</em>
          </>
        }
        lead="How you met — in each of your words. The firsts, the adventures, the hard winters and the ordinary Sundays. A private capsule for the two of you, to keep, add to, and one day hand down."
        actions={
          <>
            <ButtonLink href="/app/capsules/new?kind=couple" size="xl">
              Start your story together
            </ButtonLink>
            <ArrowLink href="#questions">Questions for each other</ArrowLink>
          </>
        }
        media={<TwoAnswers />}
      />

      <Section tone="night" labelledBy="why-both">
        <Container size="narrow" className="text-center">
          <h2 id="why-both" className="display-2">
            Two people never tell it <em>the same way.</em>
          </h2>
          <p className="lead mx-auto mt-6 max-w-2xl">That&rsquo;s the point. Answer the same question separately and keep both answers, side by side — the umbrella, and the laugh. Most couples find the differences are the best part.</p>
        </Container>
      </Section>

      <Section id="questions" labelledBy="questions-title">
        <Container size="wide">
          <Heading
            id="questions-title"
            eyebrow="Questions for each other"
            title={
              <>
                Questions you&rsquo;ve <em>never thought to ask.</em>
              </>
            }
            lead="A few from the library. Skip any, save some for an anniversary, or press Surprise Me in the app."
          />
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {groups.map((g) => (
              <div key={g.category} className="border-t border-line-strong pt-6">
                <h3 className="display-3 !text-[1.35rem]">{g.category}</h3>
                <ul className="mt-5 space-y-4">
                  {g.questions.map((q) => (
                    <li key={q.id} className="font-serif text-[1.15rem] leading-snug text-ink">
                      {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ivory" labelledBy="firsts">
        <Container size="wide">
          <Heading
            id="firsts"
            eyebrow="Firsts and adventures"
            title={
              <>
                The first date, the first flat, <em>the wrong turn.</em>
              </>
            }
          />
          <PlateStrip className="mt-12" memoryIds={["mem_us_bookshop", "mem_us_wedding", "mem_us_florence", "mem_us_road"]} />
        </Container>
      </Section>

      <Section labelledBy="timeline">
        <Container size="wide">
          <Split
            media={<TimelinePreview capsuleId="cap_us" limit={7} />}
            align="start"
          >
            <Heading
              id="timeline"
              eyebrow="Your anniversary timeline"
              title={
                <>
                  Every year you&rsquo;ve had, <em>in order.</em>
                </>
              }
              lead="Memories fall into place on a timeline as you add them — even the ones you can only date as “that summer in Florence”. Add the dates that matter and they'll appear on your home page as they come round."
            >
              <dl className="mt-8 divide-y divide-line border-y border-line">
                {(us.keyDates ?? []).map((k) => (
                  <div key={k.id} className="flex items-baseline justify-between gap-6 py-4">
                    <dt className="font-medium">{k.label}</dt>
                    <dd className="text-[0.9375rem] text-ink-3">
                      {MONTHS[k.month - 1]} {k.day}
                      {k.year ? `, ${k.year}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[0.8125rem] text-ink-3">Key dates from the fictional sample capsule.</p>
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="private">
        <Container size="wide">
          <Heading
            id="private"
            eyebrow="Private and shared"
            title={
              <>
                Some memories are <em>just for the two of you.</em>
              </>
            }
            lead="Others you'll want your children to read one day. Every entry has its own setting, and you can change it whenever you like."
          />
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { Icon: Lock, title: "Only me", body: "A private note you're not ready to share — even with each other." },
              { Icon: Eye, title: "The two of us", body: "Shared between you as the capsule's editors, and no one else." },
              { Icon: Users, title: "Everyone we've invited", body: "For children, parents and friends you've asked to read along." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="rounded-[20px] border border-line bg-paper p-6">
                <Icon className="size-5 text-oxblood" aria-hidden />
                <h3 className="mt-4 text-[1.1rem] font-medium">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section labelledBy="letters">
        <Container size="wide">
          <Split reverse media={<FutureMessagePreview />}>
            <Heading
              id="letters"
              eyebrow="Letters to each other"
              title={
                <>
                  Write to the couple <em>you&rsquo;ll be in ten years.</em>
                </>
              }
              lead="A letter for your tenth anniversary. A voice note for the day the kids leave home. Prepare it now, seal it, and decide when it should be opened."
            >
              <PreviewNote className="mt-8">In this preview, messages are prepared and kept on this device. Delivery on a future date isn&rsquo;t connected yet, and we won&rsquo;t say a message is scheduled until it truly is.</PreviewNote>
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section tone="ivory" space="tight" labelledBy="one-plan">
        <Container size="narrow" className="text-center">
          <h2 id="one-plan" className="display-3">
            One plan for the two of you.
          </h2>
          <p className="lead mx-auto mt-4 max-w-2xl">
            A Digital LifeCapsule is {formatMoney(digital.price.amount)} a year — test price, nothing is charged in the preview. Your partner joins as an editor, free. So does anyone else you invite.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3">
            <ArrowLink href="/pricing">See pricing</ArrowLink>
            <ArrowLink href="/gifts">Give it as an anniversary gift</ArrowLink>
          </div>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Begin with <em>how you met.</em>
          </>
        }
        lead="It takes a couple of minutes. Each of you can answer in your own words."
        primary={
          <ButtonLink href="/app/capsules/new?kind=couple" size="xl">
            Start your story together
          </ButtonLink>
        }
        secondary={<ArrowLink href="/examples#couple">See Sarah &amp; Jonah&rsquo;s sample capsule</ArrowLink>}
      />
    </>
  );
}

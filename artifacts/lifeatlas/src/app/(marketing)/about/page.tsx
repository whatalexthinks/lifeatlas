import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, Container, FinalCta, Heading, Numbered, PageIntro, PreviewNote, PullQuote, Section } from "@/components/site/kit";
import { PlateStrip } from "@/components/site/previews";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${brand.name} exists, what we believe about family memories, and where the product honestly stands today.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow={`About ${brand.name}`}
        title={
          <>
            Every life is a story <em>worth keeping.</em>
          </>
        }
        lead="The details that make someone themselves are the easiest to lose: a phrase they always used, a ritual in the kitchen, the way they told the story of how they met. We're building a place to keep them — privately, honestly, and for a long time."
      />

      <Section tone="night" labelledBy="belief">
        <Container size="narrow">
          <PullQuote cite="Why we started">The question we keep coming back to is simple: what would you give to hear them tell it one more time?</PullQuote>
          <h2 id="belief" className="sr-only">
            Why we started
          </h2>
        </Container>
      </Section>

      <Section labelledBy="principles">
        <Container size="wide">
          <Heading
            id="principles"
            eyebrow="What we believe"
            title={
              <>
                A few things we <em>won&rsquo;t compromise on.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={3}
            items={[
              { title: "Listening is the gift", body: "The product is built around asking a good question and leaving room for the answer — not around filling a timeline." },
              { title: "The small things matter most", body: "Recipes, sayings, a voice on a recording. We design for the ordinary moments that families miss most." },
              { title: "Your memories are yours", body: "Private by default. Always downloadable. Never sold, never used to train AI." },
              { title: "Honesty over polish", body: "We never invent a date, a place, a transcript, a review or a statistic. If something isn't connected yet, the product says so." },
              { title: "Made for every age", body: "Large text, calm screens, one obvious button. A great-grandmother should be able to answer a question without help." },
              { title: "Free for everyone you invite", body: "One person pays for a capsule. The family they invite never does." },
            ]}
          />
        </Container>
      </Section>

      <Section tone="ivory" labelledBy="where">
        <Container size="narrow">
          <Heading
            id="where"
            eyebrow="Where we are"
            title={
              <>
                A working product, <em>still being built.</em>
              </>
            }
            lead={`${brand.name} is a product preview. Nearly everything works on your own device — creating capsules, recording, inviting, designing keepsakes — using a fictional sample family to show what's possible. Accounts, cloud storage, payments, printing and delivery come next, and we won't pretend they exist before they do.`}
          >
            <PreviewNote className="mt-8">{brand.name} is a working name; branding and trademark are pending. The domain is ourlifecapsule.com.</PreviewNote>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              <ArrowLink href="/how-it-works">How it works today</ArrowLink>
              <ArrowLink href="/privacy">How we treat your data</ArrowLink>
            </div>
          </Heading>
        </Container>
      </Section>

      <Section labelledBy="moments">
        <Container size="wide">
          <Heading
            id="moments"
            eyebrow="The kind of thing we mean"
            title={
              <>
                Small moments, <em>kept on purpose.</em>
              </>
            }
          />
          <PlateStrip className="mt-12" memoryIds={["mem_us_pancakes", "mem_fam_pie", "mem_us_porch", "mem_fam_recipe"]} />
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Start with someone <em>you love.</em>
          </>
        }
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create Your LifeCapsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/contact">Get in touch</ArrowLink>}
      />
    </>
  );
}

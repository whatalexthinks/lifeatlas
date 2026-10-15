import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/blocks";
import { ArrowLink, Container, FinalCta, JsonLd, PageIntro, Section } from "@/components/site/kit";
import { faqGroups } from "@/data/site-faq";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: `Straight answers about ${brand.name}: getting started, privacy, inviting family, voice and photos, plans and payments, physical keepsakes, future messages and keeping your memories safe.`,
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))),
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <PageIntro
        eyebrow="Questions"
        title={
          <>
            Good questions, <em>straight answers.</em>
          </>
        }
        lead="What works today, what doesn't yet, and how we think about your family's memories. If something isn't here, the support page has more."
      />
      <Section space="none" className="pb-24 sm:pb-32">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
            <nav aria-label="Topics" className="lg:sticky lg:top-28 lg:self-start">
              <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {faqGroups.map((g) => (
                  <li key={g.id}>
                    <a href={`#${g.id}`} className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-[0.9375rem] text-ink-2 hover:border-ink-3 hover:text-ink lg:rounded-[10px] lg:border-0 lg:px-3">
                      {g.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-16">
              {faqGroups.map((g) => (
                <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-28">
                  <h2 id={`${g.id}-title`} className="display-3 mb-4">
                    {g.title}
                  </h2>
                  <FaqList items={g.items.map((i) => [i.q, i.a] as [string, string])} />
                </section>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <FinalCta
        title={
          <>
            Still wondering? <em>Try it.</em>
          </>
        }
        lead="It's free to start on this device, and you can erase everything in one click."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create Your LifeCapsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/support">Support and help</ArrowLink>}
      />
    </>
  );
}

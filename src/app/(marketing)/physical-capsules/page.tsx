import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { BookObject, KeepsakeBox } from "@/components/marketing/objects";
import { ArrowLink, CheckList, Container, Eyebrow, FinalCta, Heading, PageIntro, PreviewNote, Section, Split } from "@/components/site/kit";
import { defaultCatalog } from "@/data/product-catalog";
import { plans } from "@/domain/commerce/plans";
import { formatMoney } from "@/lib/utils";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Physical capsules and legacy books",
  description: `The Premium Physical ${brand.product} — an archival keepsake kit — and the Printed Legacy Book, made to order from your stories. Optional add-ons to any ${brand.name} capsule.`,
  alternates: { canonical: "/physical-capsules" },
};

const p = (id: string) => defaultCatalog.find((x) => x.id === id)!;

export default function PhysicalCapsulesPage() {
  const box = p("keepsake_box");
  const book = p("book");
  return (
    <>
      <PageIntro
        eyebrow="Physical keepsakes"
        title={
          <>
            Something to hold, <em>open and fill together.</em>
          </>
        }
        lead="Two optional add-ons for any capsule: an archival keepsake kit for the photographs, letters and objects that belong with the stories — and a printed book made from the stories themselves."
        actions={
          <>
            <ButtonLink href="/app/heirlooms/capsule-builder" size="xl">
              Design your physical capsule
            </ButtonLink>
            <ArrowLink href="#book">The Legacy Book</ArrowLink>
          </>
        }
        media={
          <div className="grid min-h-[380px] place-items-center rounded-[28px] bg-ivory p-10 sm:min-h-[480px]">
            <div className="w-[70%] max-w-[360px]">
              <KeepsakeBox finish="walnut" engraving="The Ellis Family · 1934 —" open />
            </div>
          </div>
        }
      />

      <Section tone="surface" labelledBy="box">
        <Container size="wide">
          <Split
            media={
              <div className="rounded-[24px] border border-line bg-paper p-7 sm:p-9">
                <Eyebrow plain>What&rsquo;s inside</Eyebrow>
                <CheckList className="mt-6" items={box.inclusions} />
                <div className="mt-8 border-t border-line pt-6">
                  <p className="flex items-baseline gap-2">
                    <span className="text-[0.9375rem] text-ink-3">From</span>
                    <span className="font-sans text-[2.4rem] font-[450] leading-none tracking-[-0.05em]">{formatMoney(box.price.amount)}</span>
                  </p>
                  <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-4">Test price · add-on · nothing is charged</p>
                </div>
              </div>
            }
          >
            <Heading
              id="box"
              eyebrow={box.name}
              title={
                <>
                  A home for the things <em>a screen can&rsquo;t hold.</em>
                </>
              }
              lead={box.description}
            >
              <p className="mt-6 text-[0.9375rem] text-ink-2">
                Available in linen-wrapped board or wood finishes, with an optional engraved lid. The Family Plan takes {plans.family.keepsakeDiscountPct}% off.
              </p>
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section labelledBy="how-made">
        <Container size="wide">
          <Heading
            id="how-made"
            eyebrow="How each one is made"
            title={
              <>
                Some things ship ready. <em>Some are made just for you.</em>
              </>
            }
            lead="We're clear about which is which, so you always know what happens after you order."
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {[
              {
                tag: "Ready-made",
                title: "The keepsake kit",
                body: "The box, prompt cards, sleeves and envelopes are made in advance and need nothing from you.",
                steps: ["You order", "Payment is confirmed", "The kit ships", "You fill it, in your own time"],
              },
              {
                tag: "Made to order",
                title: "Personal printed pieces",
                body: "The Legacy Book and any personalised inserts are made only from your stories, and only after you approve them.",
                steps: ["You design it in the studio", "We prepare a page-by-page proof", "You approve — or change it", "Then it's printed and shipped"],
              },
            ].map((c) => (
              <div key={c.title} className="rounded-[24px] border border-line bg-surface p-7 sm:p-9">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-oxblood">{c.tag}</p>
                <h3 className="display-3 mt-3">{c.title}</h3>
                <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">{c.body}</p>
                <ol className="mt-7 space-y-3">
                  {c.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-4 text-[0.9375rem]">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[0.75rem]">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <PreviewNote className="mt-10">In this preview, payments, printing and shipping aren&rsquo;t connected. You can design both and place a demonstration order — nothing is charged, made or sent, and the order says so.</PreviewNote>
        </Container>
      </Section>

      <Section id="book" tone="ivory" labelledBy="book-title">
        <Container size="wide">
          <Split
            reverse
            media={
              <div className="grid place-items-center py-6">
                <BookObject title="Margaret Ellis" subtitle="In Her Own Words" years="1940 —" color="evergreen" size="lg" />
              </div>
            }
          >
            <Heading
              id="book-title"
              eyebrow={book.name}
              title={
                <>
                  Their stories, <em>bound to be handed down.</em>
                </>
              }
              lead={book.description}
            >
              <CheckList className="mt-8" items={book.inclusions} />
              <p className="mt-8 flex items-baseline gap-2">
                <span className="text-[0.9375rem] text-ink-3">From</span>
                <span className="font-sans text-[2.4rem] font-[450] leading-none tracking-[-0.05em]">{formatMoney(book.price.amount)}</span>
                <span className="ml-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-4">Test price</span>
              </p>
              <div className="mt-8">
                <ButtonLink href="/app/heirlooms/book-builder" variant="secondary" size="lg">
                  Design a book
                </ButtonLink>
              </div>
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section labelledBy="care">
        <Container size="narrow">
          <Heading
            id="care"
            eyebrow="An honest note on materials"
            title={
              <>
                Made to be kept on a shelf, <em>not under the ground.</em>
              </>
            }
            lead="The physical capsule is a display keepsake. It isn't designed or rated for burial or long-term underground storage, and we won't make durability claims we haven't tested. Photo sleeves and envelopes are acid-free; keep originals somewhere cool, dry and dark — and keep a digital copy too."
          />
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Begin with the stories. <em>The keepsake can wait.</em>
          </>
        }
        lead="Every keepsake starts with a capsule — and the capsule is free to start."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create Your LifeCapsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/pricing">See pricing</ArrowLink>}
      />
    </>
  );
}

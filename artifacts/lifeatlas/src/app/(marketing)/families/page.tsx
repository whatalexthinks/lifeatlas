import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, CheckList, Container, FinalCta, Heading, Numbered, PageIntro, PreviewNote, Section, Split } from "@/components/site/kit";
import { CapsuleFan, GenerationsPreview, PlateStrip } from "@/components/site/previews";
import { RolesTable } from "@/components/site/roles";
import { libraryQuestions, sampleMemory } from "@/components/site/samples";
import { capsuleKinds } from "@/domain/capsule-kinds";
import { plans } from "@/domain/commerce/plans";
import { defaultCatalog } from "@/data/product-catalog";
import { formatMoney } from "@/lib/utils";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "For families",
  description: `Keep your family's stories in ${brand.name}: generations of memories, traditions and recipes, interviews with grandparents, and everyone's side of the story, for every kind of family.`,
  alternates: { canonical: "/families" },
};

export default function FamiliesPage() {
  const history = libraryQuestions("Family History", 4);
  const growing = libraryQuestions("Growing Up", 4);
  const correction = sampleMemory("mem_fam_bowl_pending");
  const family = defaultCatalog.find((p) => p.id === "family")!;
  return (
    <>
      <PageIntro
        eyebrow="For families"
        title={
          <>
            Every family has a story. <em>Everyone holds a piece.</em>
          </>
        }
        lead="Grandparents hold the beginning. Parents hold the middle. Children hold the questions nobody thought to ask. A family capsule brings all of it to one table, traditions, recipes, interviews and everyone's side of the story."
        actions={
          <>
            <ButtonLink href="/app/capsules/new?kind=family" size="xl">
              Start your family&rsquo;s capsule
            </ButtonLink>
            <ArrowLink href="#children">Keeping a child&rsquo;s story</ArrowLink>
          </>
        }
        media={<GenerationsPreview />}
      />

      <Section tone="ivory" labelledBy="people-capsules">
        <Container size="wide">
          <Split media={<CapsuleFan ids={["cap_margaret", "cap_family", "cap_us"]} />}>
            <Heading
              id="people-capsules"
              eyebrow="People and capsules"
              title={
                <>
                  A person isn&rsquo;t a capsule. <em>They can live in many.</em>
                </>
              }
              lead="Margaret has a capsule of her own, in her own words. She also appears in the family's capsule, and in her daughter's love story. Add someone once, and they can be part of every story they belong to."
            >
              <CheckList className="mt-8" items={["One record per person, name, dates, how you're related", "Tag them in any memory, in any capsule", `A shared family directory across capsules on the Family Plan`]} />
            </Heading>
          </Split>
        </Container>
      </Section>

      <Section labelledBy="every-family">
        <Container size="wide">
          <Heading
            id="every-family"
            eyebrow="Every kind of family"
            title={
              <>
                Blended, chosen, adopted, <em>complicated, yours.</em>
              </>
            }
            lead="Relationships are written in your words, stepmother, foster brother, Nana, “my oldest friend”. Nobody is forced into a tree that doesn't fit, and you never have to list someone you'd rather leave out."
          />
          <Numbered
            className="mt-14"
            columns={3}
            items={[
              { title: "Your words for each other", body: "Describe every relationship the way your family does. There's no form that insists on “mother” or “father”." },
              { title: "Gaps are allowed", body: "Unknown birth years, missing names, a branch nobody talks about. Leave it blank, we never fill it in for you." },
              { title: "Friends belong too", body: "A godparent, a neighbour of forty years, the friend who's been at every Thanksgiving. Add the people who matter." },
            ]}
          />
        </Container>
      </Section>

      <Section tone="surface" labelledBy="traditions">
        <Container size="wide">
          <Heading
            id="traditions"
            eyebrow="Traditions and recipes"
            title={
              <>
                The pie has to be lopsided. <em>Write down why.</em>
              </>
            }
            lead="The recipes nobody measured, the songs in the car, the words only your family uses. Traditions get a chapter of their own."
          />
          <PlateStrip className="mt-12" memoryIds={["mem_fam_recipe", "mem_fam_pie", "mem_fam_canoe", "mem_fam_table"]} />
        </Container>
      </Section>

      <Section labelledBy="interviews">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Heading
              id="interviews"
              eyebrow="Interviews across generations"
              title={
                <>
                  Ask your grandmother <em>while you still can.</em>
                </>
              }
              lead="Sit beside them with a phone and press record, or send a link they can answer from their own armchair, large text, one big button, no password. Holiday gatherings work too: pass one device round the table."
            >
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                <ArrowLink href="/legacy">Recording a parent&rsquo;s story</ArrowLink>
                <ArrowLink href="/gifts/holiday">A holiday gathering</ArrowLink>
              </div>
            </Heading>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                { title: "Family history", qs: history },
                { title: "Growing up", qs: growing },
              ].map((g) => (
                <div key={g.title} className="border-t border-line-strong pt-6">
                  <h3 className="display-3 !text-[1.3rem]">{g.title}</h3>
                  <ul className="mt-4 space-y-3.5">
                    {g.qs.map((q) => (
                      <li key={q.id} className="font-serif text-[1.1rem] leading-snug">
                        {q.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="night" labelledBy="sides">
        <Container size="wide">
          <Split
            media={
              <figure className="rounded-[22px] border border-night-line bg-white/[0.04] p-6 sm:p-7">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-night-accent">Waiting for review · fictional sample</p>
                <p className="mt-4 font-serif text-[1.6rem] leading-tight">&ldquo;{correction.title}&rdquo;</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-night-ink-2">{correction.narrative.split("\n\n")[0]}</p>
                <p className="mt-5 text-[0.8125rem] text-night-ink-3">
                  From {correction.attribution.displayName} · {correction.attribution.relationship}
                </p>
              </figure>
            }
          >
            <Heading
              id="sides"
              eyebrow="Everyone's side"
              title={
                <>
                  Memories disagree. <em>Keep both.</em>
                </>
              }
              lead="When a son-in-law insists the canoe was green, his version arrives as a contribution. You read it, keep it alongside the original, or ask him a question first. Nothing joins the capsule without your say."
            />
          </Split>
        </Container>
      </Section>

      <Section id="children" labelledBy="children-title">
        <Container size="wide">
          <Heading
            id="children-title"
            eyebrow="For a child"
            title={
              <>
                Things they&rsquo;ll want to know <em>when they&rsquo;re older.</em>
              </>
            }
            lead="The first word, the funny sayings, the night they came home. A child's capsule is written for them to open later, with letters you seal now for a birthday years away."
          />
          <Numbered
            className="mt-14"
            columns={4}
            items={(["childhood", "everyday", "work", "wisdom"] as const).map((k) => ({
              title: capsuleKinds.child.chapterTitles[k] ?? k,
              body: { childhood: "Milestones, firsts and the stories of the day they arrived.", everyday: "Funny sayings, favourite songs, the bedtime routine.", work: "First days at school, first friends, first heartbreaks.", wisdom: "Letters to be opened at 18, at graduation, someday." }[k],
            }))}
          />
          <div className="mt-12">
            <ButtonLink href="/app/capsules/new?kind=child" variant="secondary" size="lg">
              Start a capsule for a child
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="ivory" labelledBy="roles-title">
        <Container size="wide">
          <Heading
            id="roles-title"
            eyebrow="Who can do what"
            title={
              <>
                Everyone can add. <em>You decide what stays.</em>
              </>
            }
            lead="Contributors and viewers join free, however many you invite."
          />
          <RolesTable className="mt-12" />
        </Container>
      </Section>

      <Section space="tight" labelledBy="family-plan">
        <Container size="narrow" className="text-center">
          <h2 id="family-plan" className="display-3">
            The Family Plan keeps up to {plans.family.capsules} capsules together.
          </h2>
          <p className="lead mx-auto mt-4 max-w-2xl">
            Your parents&rsquo; stories, your own, your children&rsquo;s, with a shared family directory, {plans.family.storageGb} GB of planned storage and {plans.family.keepsakeDiscountPct}% off keepsakes. {formatMoney(family.price.amount)} a year.
          </p>
          <PreviewNote className="mx-auto mt-6 text-left">Test price. Nothing is charged in the preview, and hosted storage arrives with accounts.</PreviewNote>
          <div className="mt-8 flex justify-center">
            <ArrowLink href="/pricing">Compare plans</ArrowLink>
          </div>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Start with the oldest story <em>you know.</em>
          </>
        }
        lead="Then invite the people who know the rest."
        primary={
          <ButtonLink href="/app/capsules/new?kind=family" size="xl">
            Start your family&rsquo;s capsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/examples#family">See the Ellis family sample</ArrowLink>}
      />
    </>
  );
}

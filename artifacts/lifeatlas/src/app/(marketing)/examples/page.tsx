import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { CapsuleCover } from "@/components/capsule/capsule-cover";
import { LifeExplorer } from "@/components/marketing/home/life-explorer";
import { ArrowLink, Container, FinalCta, Heading, PageIntro, PreviewNote, SampleTag, Section } from "@/components/site/kit";
import { sampleCapsule, sampleStories } from "@/components/site/samples";
import { capsuleKind, capsuleKinds } from "@/domain/capsule-kinds";
import { formatFuzzyDate } from "@/lib/dates";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Example capsules",
  description: `Explore fictional sample capsules in ${brand.name}: a couple's love story, four generations of one family, a mother in her own words, and a father remembered by the people who loved him.`,
  alternates: { canonical: "/examples" },
};

const examples = [
  { anchor: "couple", id: "cap_us", what: "Both partners answer the same questions, each in their own words. Key dates for the day they met and their wedding; a letter sealed for their thirtieth anniversary." },
  { anchor: "family", id: "cap_family", what: "Four generations, from a ferry in 1934 to a first fish in 2018. Traditions and recipes, and a correction from a son-in-law waiting for review." },
  { anchor: "parent", id: "cap_margaret", what: "A mother's life in her own voice: recordings, photographs, places on a map, and stories her children and grandchildren added." },
  { anchor: "remembrance", id: "cap_thomas", what: "A father who has died, remembered by the people who knew him, each adding the piece only they hold." },
];

export default function ExamplesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Example capsules"
        title={
          <>
            See what a capsule <em>can become.</em>
          </>
        }
        lead="Four capsules from the fictional Ellis family, made to show what's possible. Open any of them in the same viewer your family would use."
        note="The Ellis family isn't real. Illustrations were made for this preview, sample voices are synthesized, and the one photograph is AI-generated."
      />

      {examples.map((e, i) => {
        const c = sampleCapsule(e.id);
        const kind = capsuleKind(c);
        const stories = sampleStories(e.id)
          .filter((m, idx, arr) => arr.findIndex((x) => x.title === m.title) === idx)
          .slice(0, 4);
        return (
          <Section key={e.id} id={e.anchor} tone={i % 2 ? "ivory" : "paper"} labelledBy={`${e.anchor}-title`}>
            <Container size="wide">
              <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center lg:gap-20">
                <figure className={i % 2 ? "lg:order-2" : undefined}>
                  <CapsuleCover capsule={c} size="lg" className="mx-auto aspect-[4/5] max-w-[420px] rounded-[20px] shadow-[var(--shadow-object)]" />
                  <figcaption className="mt-4 flex justify-center">
                    <SampleTag />
                  </figcaption>
                </figure>
                <div>
                  <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-oxblood">{capsuleKinds[kind].label}</p>
                  <h2 id={`${e.anchor}-title`} className="display-2 mt-4">
                    {c.title}
                  </h2>
                  <p className="mt-2 font-serif text-[1.35rem] italic text-ink-2">{c.subjectName}</p>
                  <p className="lead mt-6 max-w-2xl">{c.description ?? c.dedication}</p>
                  <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink-2">{e.what}</p>
                  <ul className="mt-8 divide-y divide-line border-y border-line">
                    {stories.map((m) => (
                      <li key={m.id} className="flex items-baseline justify-between gap-6 py-3.5">
                        <span className="font-serif text-[1.1rem] leading-snug">{m.title}</span>
                        <span className="shrink-0 font-mono text-[0.75rem] uppercase tracking-[0.06em] text-ink-3">{formatFuzzyDate(m.date, "short")}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
                    <ButtonLink href={`/view/${c.id}`} variant="secondary" size="lg">
                      Open in the viewer
                    </ButtonLink>
                    <ArrowLink href={`/app/capsules/new?kind=${kind === "parent" && e.anchor === "remembrance" ? "someone" : kind}`}>Start one like it</ArrowLink>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        );
      })}

      <Section tone="surface" labelledBy="map">
        <Container size="wide">
          <Heading
            id="map"
            eyebrow="A life on a map"
            title={
              <>
                Margaret&rsquo;s eighty years, <em>place by place.</em>
              </>
            }
            lead="Memories with a place appear on a map, in the order they happened. Places are kept to the town or city, never a street address."
          />
          <div className="la-explorer on-dark mt-12 !rounded-[24px]">
            <LifeExplorer />
          </div>
          <PreviewNote className="mt-6">If you&rsquo;ve removed the sample capsules from your studio, the viewer links above will tell you so, erasing demo data in Settings brings them back.</PreviewNote>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Yours will look <em>nothing like these.</em>
          </>
        }
        lead="That's rather the point. Start with one question."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create Your LifeCapsule
          </ButtonLink>
        }
      />
    </>
  );
}

import type { Metadata } from "@/lib/router/metadata";
import { Check, Circle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, CheckList, Container, FinalCta, Heading, PageIntro, Section } from "@/components/site/kit";
import { CapsuleFan, FutureMessagePreview, InvitationPreview, QuestionTry, StoryPreview, TimelinePreview } from "@/components/site/previews";
import { RolesTable } from "@/components/site/roles";
import { capsuleKinds, kindOrder } from "@/domain/capsule-kinds";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "How it works",
  description: `From one question to a life kept: how ${brand.name} capsules are created, filled with stories, voices and photographs, shared with family, and kept.`,
  alternates: { canonical: "/how-it-works" },
};

const steps: { id: string; n: string; title: React.ReactNode; body: React.ReactNode; visual: React.ReactNode }[] = [
  {
    id: "choose",
    n: "01",
    title: (
      <>
        Choose <em>whose story.</em>
      </>
    ),
    body: (
      <>
        <p>Start with the person or the relationship. A name is all we ask, dates, places and photographs can come later, or never.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {kindOrder.map((k) => (
            <li key={k} className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[0.875rem]">
              {capsuleKinds[k].option}
            </li>
          ))}
        </ul>
      </>
    ),
    visual: <CapsuleFan />,
  },
  {
    id: "ask",
    n: "02",
    title: (
      <>
        Answer <em>one question.</em>
      </>
    ),
    body: (
      <>
        <p>A library of questions, written for each kind of story: how you met, the kitchen you grew up in, what you hope your child remembers. Skip any. Save some for later. Answer a favourite twice.</p>
        <p className="mt-4">Not sure? Press <strong className="font-medium text-ink">Surprise me</strong>.</p>
      </>
    ),
    visual: <QuestionTry />,
  },
  {
    id: "add",
    n: "03",
    title: (
      <>
        Speak it, write it, <em>or show it.</em>
      </>
    ),
    body: (
      <>
        <p>Each memory can hold words, a voice recording, photographs and short video clips, with a date, a place and the people in it.</p>
        <CheckList
          className="mt-6"
          items={[
            "Record on a phone or laptop, or upload a file, or type",
            "Dates can be exact, “Summer 1998”, “Around age 12” or simply unknown",
            "Photo dates from your camera are offered to confirm, never assumed",
            "Drafts save as you go, so nothing is lost if you're interrupted",
          ]}
        />
      </>
    ),
    visual: <StoryPreview compact />,
  },
  {
    id: "invite",
    n: "04",
    title: (
      <>
        Invite the people <em>who were there.</em>
      </>
    ),
    body: (
      <>
        <p>Siblings, partners, grandchildren, old friends. They join free and add what only they remember. You decide what joins the capsule, and who sees each memory.</p>
      </>
    ),
    visual: <InvitationPreview />,
  },
  {
    id: "keep",
    n: "05",
    title: (
      <>
        Explore it, <em>and keep it.</em>
      </>
    ),
    body: (
      <>
        <p>Read it as a timeline or in chapters, listen to the voices, print a book, and download a complete copy whenever you like.</p>
      </>
    ),
    visual: <TimelinePreview />,
  },
  {
    id: "later",
    n: "06",
    title: (
      <>
        Leave something <em>for later.</em>
      </>
    ),
    body: (
      <>
        <p>Letters, voice messages and photographs for a birthday, an anniversary or someday. We show exactly where each message stands, and never call one “scheduled” before a real delivery service has accepted it.</p>
      </>
    ),
    visual: <FutureMessagePreview />,
  },
];

const today: [string, boolean][] = [
  ["Create capsules of every kind, with covers and key dates", true],
  ["Answer questions by voice, text or photograph; drafts autosave", true],
  ["Invite people with a link (works in this browser)", true],
  ["Review contributions and set who sees each memory", true],
  ["Timeline, chapters, map and a family viewer", true],
  ["Design a book or physical capsule; prepare future messages", true],
  ["Download a complete copy", true],
  ["Accounts and sign-in across devices", false],
  ["Cloud storage and backups", false],
  ["Sending invitations by email or text", false],
  ["Payments, printing and shipping", false],
  ["Scheduled delivery of future messages", false],
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title={
          <>
            From one question to a life, <em>kept.</em>
          </>
        }
        lead="Six steps, taken at your own pace. Most people finish the first one in a couple of minutes, the rest unfolds over months and years, one memory at a time."
        actions={
          <>
            <ButtonLink href="/app/capsules/new" size="xl">
              Create a capsule
            </ButtonLink>
            <ArrowLink href="#choose">Walk through it</ArrowLink>
          </>
        }
      />

      <nav aria-label="Steps" className="sticky top-[64px] z-30 hidden border-y border-line bg-paper/92 backdrop-blur md:block">
        <Container size="wide">
          <ol className="flex gap-1 overflow-x-auto py-2 text-[0.875rem]">
            {steps.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-ink-2 hover:bg-ivory hover:text-ink">
                  <span className="font-mono text-[0.75rem] text-oxblood">{s.n}</span>
                  {stepLabel(s.id)}
                </a>
              </li>
            ))}
          </ol>
        </Container>
      </nav>

      {steps.map((s, i) => (
        <Section key={s.id} id={s.id} tone={i % 2 ? "ivory" : "paper"} labelledBy={`${s.id}-title`}>
          <Container size="wide">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
              <div>
                <p className="font-mono text-[0.875rem] tracking-[0.14em] text-oxblood">{s.n} / 06</p>
                <h2 id={`${s.id}-title`} className="display-2 mt-5">
                  {s.title}
                </h2>
                <div className="lead mt-6">{s.body}</div>
              </div>
              <div className="min-w-0">{s.visual}</div>
            </div>
          </Container>
        </Section>
      ))}

      <Section labelledBy="roles">
        <Container size="wide">
          <Heading
            id="roles"
            eyebrow="Roles"
            title={
              <>
                Everyone has a place. <em>You keep the keys.</em>
              </>
            }
            lead="Give each person the role that fits. Change it, or remove someone, at any time."
          />
          <RolesTable className="mt-12" />
        </Container>
      </Section>

      <Section tone="surface" labelledBy="today">
        <Container size="narrow">
          <Heading
            id="today"
            eyebrow="In this preview"
            title={
              <>
                What works today, <em>and what doesn&rsquo;t yet.</em>
              </>
            }
            lead="We'd rather you knew. Everything you make in the preview stays in this browser on this device."
          />
          <ul className="mt-10 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {today.map(([label, works]) => (
              <li key={label} className="flex items-start gap-3 border-b border-line py-3 text-[0.9375rem]">
                {works ? <Check className="mt-0.5 size-4 shrink-0 text-evergreen" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-ink-4" aria-hidden />}
                <span className={works ? "" : "text-ink-3"}>
                  {label}
                  <span className="sr-only">{works ? ", works today" : ", not connected yet"}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            The first step takes <em>two minutes.</em>
          </>
        }
        lead="Choose whose story, add a name, and answer one question."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create a capsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/examples">See example capsules</ArrowLink>}
      />
    </>
  );
}

function stepLabel(id: string) {
  return { choose: "Choose", ask: "Ask", add: "Add", invite: "Invite", keep: "Keep", later: "For later" }[id];
}

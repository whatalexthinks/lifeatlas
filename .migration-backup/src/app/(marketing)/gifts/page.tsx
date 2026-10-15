import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/blocks";
import { KeepsakeBox, SealedLetter } from "@/components/marketing/objects";
import { ArrowLink, Container, FinalCta, Heading, Numbered, PageIntro, PreviewNote, Section } from "@/components/site/kit";
import { Plate } from "@/components/media/media-image";
import { defaultCatalog } from "@/data/product-catalog";
import { formatMoney } from "@/lib/utils";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Gifts",
  description: `Give a ${brand.product}: a year of their own private memory capsule, a physical keepsake kit to open together, and a note from you. They never pay to add stories or invite family.`,
  alternates: { canonical: "/gifts" },
};

const p = (id: string) => defaultCatalog.find((x) => x.id === id)!;

const occasions = [
  { href: "/gifts/parents", plate: "kitchen-1950", title: "For a parent", body: "Before they were your parents, they were themselves." },
  { href: "/gifts/grandparents", plate: "rocker-1985", title: "For a grandparent", body: "There's so much more you haven't asked." },
  { href: "/couples", plate: "orchard-2001", title: "For an anniversary", body: "Your story, told by both of you." },
  { href: "/gifts/holiday", plate: "table-2019", title: "For the holidays", body: "A seat at the table, a story worth keeping." },
];

const giftFaq: [string, React.ReactNode][] = [
  ["Will they ever have to pay?", "Not for the period you've given — and never to add stories, record, or invite their own family. If they'd like to continue after a gifted year, that's their choice, and they can always download everything first."],
  ["What if they're not ready to start?", "That's fine. The gift waits for them, and your note is the first thing they see when they open it. You can also sit with them and begin together."],
  ["Can I add memories to a capsule I gave?", "Yes, if they invite you — most people do. You'll join free, as a contributor or an editor."],
  ["How do they receive it?", "You get a gift link to send however you like, or a printable card to hand over. In this preview the link opens in this browser only, and no email is sent by us."],
];

export default function GiftsPage() {
  const options = [
    { id: "digital", visual: <Plate id="letter-1952" alt="" className="aspect-[4/3] rounded-[16px]" />, line: "A year of their own capsule, with unlimited family contributors.", price: `${formatMoney(p("digital").price.amount)} for a year` },
    { id: "family", visual: <Plate id="table-2019" alt="" className="aspect-[4/3] rounded-[16px]" />, line: "Up to five capsules — for a parent who'd like one for each grandchild.", price: `${formatMoney(p("family").price.amount)} for a year` },
    {
      id: "keepsake_box",
      visual: (
        <div className="grid aspect-[4/3] place-items-center rounded-[16px] bg-ivory">
          <div className="w-[62%]">
            <KeepsakeBox finish="white_oak" engraving="For Mum · with love" />
          </div>
        </div>
      ),
      line: "A keepsake kit to open together: prompt cards, photo sleeves, letter envelopes.",
      price: `${formatMoney(p("keepsake_box").price.amount)} add-on`,
    },
  ];
  return (
    <>
      <PageIntro
        eyebrow="Gifts"
        title={
          <>
            Give someone <em>the beginning of their story.</em>
          </>
        }
        lead="For the person who has a thousand stories and nowhere to put them. Give them their own capsule — and a little of your time to listen."
        actions={
          <>
            <ButtonLink href="/gifts/build" size="xl">
              Give a LifeCapsule
            </ButtonLink>
            <ArrowLink href="#arrives">How the gift arrives</ArrowLink>
          </>
        }
        media={
          <div className="grid place-items-center rounded-[28px] bg-night px-6 py-14 sm:py-20">
            <SealedLetter to="Grandpa Joe" openOn="Your 80th birthday" tone="night" />
          </div>
        }
      />

      <Section tone="ivory" labelledBy="what">
        <Container size="wide">
          <Heading
            id="what"
            eyebrow="What you can give"
            title={
              <>
                A year of their story, <em>or something to hold.</em>
              </>
            }
            lead="Or both. Every gift includes a personal note from you, shown when they open it."
          />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {options.map((o) => (
              <li key={o.id} className="flex flex-col rounded-[22px] bg-surface p-5">
                {o.visual}
                <h3 className="display-3 mt-5 !text-[1.35rem]">{p(o.id).name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{o.line}</p>
                <p className="mt-4 font-sans text-[1.25rem] tracking-[-0.02em]">{o.price}</p>
                <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-4">Test price · nothing is charged</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="arrives" labelledBy="arrives-title">
        <Container size="wide">
          <Heading
            id="arrives-title"
            eyebrow="How it arrives"
            title={
              <>
                Opened like a letter. <em>Nothing to pay, nothing to set up.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={4}
            items={[
              { title: "You write a note", body: "Choose the gift, add a few words, and pick when it should be opened — today, or on the day itself." },
              { title: "You hand it over", body: "Send the gift link yourself, or print a card to put in their hand. We don't email anyone on your behalf in the preview." },
              { title: "They open it", body: "Your note appears first. They see what the gift includes and that it's already paid for — no card asked for." },
              { title: "They begin, or you begin together", body: "Their capsule is created the moment they accept. The first question is waiting, and they can invite you in." },
            ]}
          />
          <PreviewNote className="mt-12">In this preview, gift checkout is a demonstration: nothing is charged, and the gift link opens in this browser only.</PreviewNote>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="occasions">
        <Container size="wide">
          <Heading
            id="occasions"
            eyebrow="Occasions"
            title={
              <>
                For the days <em>that call for something more.</em>
              </>
            }
          />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {occasions.map((o) => (
              <li key={o.href}>
                <Link href={o.href} className="group block">
                  <Plate id={o.plate} alt="" className="aspect-[4/5] rounded-[16px]" />
                  <h3 className="display-3 mt-4 !text-[1.25rem]">{o.title}</h3>
                  <p className="mt-1 text-[0.9375rem] text-ink-2">{o.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section labelledBy="gift-faq">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <Heading
              id="gift-faq"
              eyebrow="About gifting"
              title={
                <>
                  A gift should be <em>simple to receive.</em>
                </>
              }
            />
            <FaqList items={giftFaq} />
          </div>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            The best gifts <em>come back to you.</em>
          </>
        }
        lead="Usually as a story you'd never heard before."
        primary={
          <ButtonLink href="/gifts/build" size="xl">
            Give a LifeCapsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/physical-capsules">About the physical kit</ArrowLink>}
      />
    </>
  );
}

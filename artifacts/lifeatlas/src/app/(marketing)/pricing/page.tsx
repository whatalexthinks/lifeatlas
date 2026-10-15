import type { Metadata } from "@/lib/router/metadata";
import { ButtonLink } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/blocks";
import { ArrowLink, Container, FinalCta, Heading, Numbered, PageIntro, PreviewNote, Section } from "@/components/site/kit";
import { KeepsakePricing, PlanComparison, PlanPricing } from "@/components/site/pricing";
import { defaultPromotions } from "@/data/promotions";
import { referralProgram } from "@/domain/commerce/referrals";
import { faqGroups } from "@/data/site-faq";
import { formatMoney } from "@/lib/utils";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${brand.name} pricing: start free on your device, then a Digital ${brand.product} or the Family Plan, yearly or monthly. Everyone you invite joins free. Optional physical keepsakes.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const founders = defaultPromotions.find((p) => p.id === "promo_founders")!;
  const planFaq = faqGroups.find((g) => g.id === "plans")!.items.map((i) => [i.q, i.a] as [string, string]);
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title={
          <>
            Pay for what you keep. <em>Invite everyone free.</em>
          </>
        }
        lead="One owner chooses a plan. Partners, parents, cousins and grandchildren join free, to add their stories or simply to read them. Start on this device without paying anything at all."
        note="All prices are test prices. Nothing is charged in this preview, checkout creates a clearly labelled demonstration order."
      />

      <Section space="none" className="pb-20 sm:pb-28" labelledBy="plans">
        <Container size="wide">
          <h2 id="plans" className="sr-only">
            Plans
          </h2>
          <PlanPricing />
        </Container>
      </Section>

      <Section tone="surface" labelledBy="compare">
        <Container size="wide">
          <Heading
            id="compare"
            eyebrow="Compare"
            title={
              <>
                What each plan <em>includes.</em>
              </>
            }
          />
          <PlanComparison className="mt-12" />
          <p className="mt-4 text-[0.875rem] text-ink-3">Storage allowances are planned for hosted accounts. In the preview, everything is kept in your browser.</p>
        </Container>
      </Section>

      <Section labelledBy="addons">
        <Container size="wide">
          <Heading
            id="addons"
            eyebrow="Optional keepsakes"
            title={
              <>
                For when you want <em>something to hold.</em>
              </>
            }
            lead="Add either one to any plan, now or later. Nothing physical is ever needed to use your capsule."
          />
          <KeepsakePricing className="mt-12" />
        </Container>
      </Section>

      <Section tone="ivory" labelledBy="model">
        <Container size="wide">
          <Heading
            id="model"
            eyebrow="How it works"
            title={
              <>
                Simple, and <em>fair to everyone involved.</em>
              </>
            }
          />
          <Numbered
            className="mt-14"
            columns={4}
            items={[
              { title: "Owners pay", body: "Whoever starts a capsule chooses its plan. Pay yearly and save, or monthly if you'd rather." },
              { title: "Everyone else is free", body: "Contributors and viewers never need a plan, a card or a trial, however many you invite." },
              { title: "Leave whenever you like", body: "Cancel at any time. Your capsules stay yours to download, completely, on every plan." },
              { title: "Gifts work the same way", body: "Give someone a year of their own capsule. They never pay to add stories or invite their family." },
            ]}
          />
        </Container>
      </Section>

      <Section labelledBy="offers">
        <Container size="wide">
          <Heading
            id="offers"
            eyebrow="Offers"
            title={
              <>
                Founding members <em>and friends.</em>
              </>
            }
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[22px] border border-line bg-surface p-7">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-oxblood">Code {founders.code}</p>
              <h3 className="display-3 mt-3">
                {founders.percentOff}% off your first year
              </h3>
              <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">
                For our first {founders.limits.maxRedemptions} members, on an annual plan. One use per person{founders.endsAt ? `, until ${new Date(founders.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}` : ""}.
              </p>
            </div>
            <div className="rounded-[22px] border border-line bg-surface p-7">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-oxblood">Refer a friend</p>
              <h3 className="display-3 mt-3">They save, you earn credit</h3>
              <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">
                Friends who arrive through your link get {referralProgram.friendOffer}. When they subscribe, you get {formatMoney(referralProgram.referrerCredit)} of credit toward {referralProgram.creditUses}, up to {referralProgram.maxRewardsPerYear} times a year.
              </p>
            </div>
          </div>
          <PreviewNote className="mt-8">Offers apply at the demonstration checkout, where nothing is charged. One offer per order. Any giveaway will run only under published rules after legal review, none is running today.</PreviewNote>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="pricing-faq">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <Heading
              id="pricing-faq"
              eyebrow="Questions"
              title={
                <>
                  About plans <em>and payments.</em>
                </>
              }
            >
              <div className="mt-8">
                <ArrowLink href="/faq">All questions</ArrowLink>
              </div>
            </Heading>
            <FaqList items={planFaq} />
          </div>
        </Container>
      </Section>

      <FinalCta
        title={
          <>
            Start free. <em>Decide later.</em>
          </>
        }
        lead="Everything you make in the preview can be downloaded, whatever you choose."
        primary={
          <ButtonLink href="/app/capsules/new" size="xl">
            Create Your LifeCapsule
          </ButtonLink>
        }
        secondary={<ArrowLink href="/gifts">Give one as a gift</ArrowLink>}
      />
    </>
  );
}

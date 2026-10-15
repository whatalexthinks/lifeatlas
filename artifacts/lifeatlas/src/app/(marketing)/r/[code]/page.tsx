import type { Metadata } from "@/lib/router/metadata";
import { useParams } from "@/lib/router/navigation";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, Container, PageIntro, PreviewNote, Section } from "@/components/site/kit";
import { HeroComposition } from "@/components/site/previews";
import { AudienceGrid } from "@/components/site/audiences";
import { ReferralKeeper } from "@/components/site/referral-keeper";
import { defaultPromotions } from "@/data/promotions";
import { isReferralCodeShape, normalizeReferral } from "@/domain/commerce/referrals";
import { brand } from "@/config/brand";


export const metadata: Metadata = {
  title: "You've been invited",
  description: `A friend invited you to ${brand.name}, private capsules for the stories, voices and photographs of the people you love.`,
  robots: { index: false, follow: true },
};

export default function ReferralPage() {
  const params = useParams<{ code: string }>();
  const code = normalizeReferral(decodeURIComponent(params.code ?? ""));
  const valid = isReferralCodeShape(code);
  const offer = defaultPromotions.find((p) => p.id === "promo_referral");
  return (
    <>
      <PageIntro
        eyebrow={valid ? "A friend's invitation" : "Invitation link"}
        title={
          valid ? (
            <>
              A friend thought <em>you&rsquo;d want this.</em>
            </>
          ) : (
            <>
              This link doesn&rsquo;t look <em>quite right.</em>
            </>
          )
        }
        lead={
          valid
            ? `${brand.name} keeps the stories, voices and photographs of the people you love in one private capsule. Your friend's link gives you ${offer?.percentOff ?? 20}% off your first year of an annual plan.`
            : "The code may have been cut short when it was copied. You're very welcome to look around, and if you have the code, you can type it at checkout."
        }
        actions={
          <>
            <ButtonLink href="/app/capsules/new" size="xl">
              Create Your LifeCapsule
            </ButtonLink>
            <ArrowLink href="/pricing">See pricing</ArrowLink>
          </>
        }
        note={valid ? <ReferralKeeper code={code} /> : undefined}
        media={<HeroComposition />}
      />
      <Section tone="ivory" labelledBy="whose">
        <Container size="wide">
          <h2 id="whose" className="display-2">
            Whose story <em>will you keep first?</em>
          </h2>
          <AudienceGrid className="mt-12" />
          <PreviewNote className="mt-12">The offer applies at the demonstration checkout, where nothing is charged. One offer per order; your friend&rsquo;s reward is account credit, never cash.</PreviewNote>
        </Container>
      </Section>
    </>
  );
}

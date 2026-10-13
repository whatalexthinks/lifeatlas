import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { marketingPages } from "@/data/marketing-pages";
import { Container, FaqList, PricingCards } from "@/components/marketing/blocks";
import { ButtonLink } from "@/components/ui/button";
import { BookObject, KeepsakeBox, SealedLetter } from "@/components/marketing/objects";
import { HeroVignette } from "@/components/marketing/home/hero-vignette";
import { LifeExplorer } from "@/components/marketing/home/life-explorer";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(marketingPages).map((key) => ({ slug: key.split("/") })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const page = marketingPages[key];
  if (!page) return {};
  return { title: `${page.title} ${page.accent}`, description: page.intro, alternates: { canonical: `/${key}` } };
}
export default async function MarketingPage({ params }: Props) {
  const key = (await params).slug.join("/");
  const page = marketingPages[key];
  if (!page) notFound();
  const cta = page.cta ?? ["Start their story", "/app/capsules/new"];
  return <div className="la-page">
    <section className="la-page-hero"><Container>
      <p className="la-kicker">{page.eyebrow}</p>
      <h1>{page.title}<br /><em>{page.accent}</em></h1>
      <p className="la-page-intro">{page.intro}</p>
      <div className="la-actions"><ButtonLink href={cta[1]} size="lg" trailing={<ArrowUpRight size={17} />}>{cta[0]}</ButtonLink><Link href="/demo" className="la-link">Explore a sample archive <ArrowRight size={16} /></Link></div>
    </Container></section>
    <Container>
      {page.chapters.length > 0 && <div className="la-page-chapters">{page.chapters.map(([title, body], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>}
      {key === "pricing" && <div className="mb-16"><PricingCards /><p className="la-preview-note mt-6" id="renewal">Living Archive is a proposed optional renewal at $29/year. There is no active subscription, billing, cloud storage, or backup service in this preview. Try the studio freely; nothing is charged.</p></div>}
    </Container>
    {page.visual && <section className="la-page-feature"><Container>
      {page.visual === "map" ? <div className="la-explorer"><LifeExplorer /></div> : <div className="la-two-column">
        <div><p className="la-kicker">Made for the memories that matter</p><h2>{page.visual === "letter" ? <>A few words.<br /><em>A lasting connection.</em></> : page.visual === "book" || page.visual === "box" ? <>A personal edition.<br /><em>Made by you.</em></> : <>See what a beginning<br /><em>can become.</em></>}</h2><p>{page.visual === "letter" ? "Try the design experience and make something personal. Letters and gift invitations are local previews; nothing is automatically sent." : page.visual === "book" || page.visual === "box" ? "Open the designer, explore the details, and save a preview. Physical production, payments, and shipping are not yet available." : "Margaret’s fictional archive connects stories, voices, photographs, and places. Explore it at your own pace, then begin a collection of your own."}</p><Link href={cta[1]} className="la-link">{cta[0]} <ArrowUpRight size={16} /></Link>{key.startsWith("heirlooms") && <div className="mt-5"><Link href={page.visual === "box" ? "/heirlooms/book" : "/heirlooms/time-capsule"} className="la-link">{page.visual === "box" ? "Explore the life book" : "Explore the keepsake box"} <ArrowRight size={16} /></Link></div>}</div>
        {page.visual === "archive" ? <HeroVignette /> : page.visual === "letter" ? <div className="la-envelope-stage"><SealedLetter to="Someone you love" openOn="A new beginning" /></div> : page.visual === "box" ? <KeepsakeBox /> : <div className="la-book-display"><BookObject title="Margaret Ellis" subtitle="The little things. The whole life." size="lg" color="evergreen" className="la-hero-book" /></div>}
      </div>}
    </Container></section>}
    {page.questions && <Container><section className="la-page-faq"><h2>A few things to know.</h2><FaqList items={page.questions} /></section></Container>}
    <section className="la-final"><Container><p className="la-kicker">There’s so much left to ask.</p><h2>Start with someone<br /><em>you love.</em></h2><p>One question. One memory. A meaningful beginning.</p><ButtonLink href="/app/capsules/new" size="lg" trailing={<ArrowUpRight size={17} />}>Create a memory capsule</ButtonLink></Container></section>
  </div>;
}

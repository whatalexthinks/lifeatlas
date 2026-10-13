import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, Download, Heart, ImagePlus, LockKeyhole, Mic, MoveUpRight, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, FaqList, PricingCards } from "@/components/marketing/blocks";
import { HeroVignette } from "@/components/marketing/home/hero-vignette";
import { LifeExplorer } from "@/components/marketing/home/life-explorer";
import { BookObject, SealedLetter } from "@/components/marketing/objects";
import { MobileStickyCta } from "@/components/marketing/site-header";
import { AudioPlayer } from "@/components/audio/audio-player";

export const metadata: Metadata = {
  title: { absolute: "LifeAtlas — A whole life. In their words." },
  description: "Turn the stories, voices, photographs, and places of someone you love into a family archive. Start with a question. Create a keepsake together.",
  alternates: { canonical: "/" },
};

const faqs: [string, React.ReactNode][] = [
  ["What exactly is a memory capsule?", "A personal digital collection for one person’s life: recorded answers, written memories, photographs, and meaningful places. Explore it as a timeline or chapters, invite family to contribute, and prepare a printed edition."],
  ["Where do I start if I’ve never done this before?", "Choose someone you want to know better, then pick a question from the prompt library. You can sit together and record, type an answer, or add a photograph. One memory is enough to begin."],
  ["Does everyone need an account?", "The intended storyteller experience is one invitation, one question, and a simple record button. This demo lets you explore the different roles on one device. Secure accounts and cross-device invitation delivery are not connected yet."],
  ["Are my memories backed up?", "Not in this preview. Anything you add is stored in this browser, on this device. Clearing browser data can remove it. Export a portable copy of the memories and media you want to keep. Cloud storage and independent backups are Part Two work."],
  ["Can I buy a book or schedule a future letter today?", "You can design a book, preview a gift, and prepare a future letter. Payments, printing, shipping, and future delivery are not connected. All orders are clearly marked demonstrations and nothing is charged."],
];

export default function HomePage() {
  return (
    <div className="la-home">
      <section className="la-hero">
        <Container size="wide" className="la-hero-grid">
          <div className="la-hero-copy">
            <p className="la-kicker"><span /> A home for your family’s story</p>
            <h1>A whole life.<br /><em>In their words.</em></h1>
            <p className="la-hero-lead">Turn the stories, voices, and photographs of someone you love into a beautiful family archive.</p>
            <p className="la-hero-detail">Ask a question. Gather the family. Keep a little more of what makes them, them.</p>
            <div className="la-actions">
              <ButtonLink href="/app/capsules/new" size="xl" trailing={<ArrowUpRight className="size-4" />}>Start their story</ButtonLink>
              <Link href="/demo" className="la-link">Explore a sample archive <ArrowRight className="size-4" /></Link>
            </div>
            <div className="la-reassurance"><span><Check className="size-3.5" /> Free to explore</span><span><LockKeyhole className="size-3.5" /> Yours to download</span></div>
          </div>
          <HeroVignette />
        </Container>
        <Container size="wide" className="la-hero-bottom"><span>FOR THE STORIES THAT MAKE US, US.</span><a href="#how-it-works">A small beginning. Something meaningful. <ArrowDown className="size-4" /></a></Container>
      </section>

      <section id="how-it-works" className="la-section la-begin">
        <Container size="wide">
          <div className="la-section-head"><p className="la-kicker">01 / A simple place to start</p><h2>You don’t need a life story.<br /><em>Just one good question.</em></h2><p>No blank-page pressure. No perfect words.<br />Build a meaningful collection, one memory at a time.</p></div>
          <div className="la-steps">
            {[
              { n: "01", Icon: Heart, title: "Choose your person", text: "A parent, a grandparent, your partner, yourself. Give their story a place of its own." },
              { n: "02", Icon: Mic, title: "Let the memories come", text: "Use thoughtful prompts to record a voice, write a story, or add a photograph. Invite family to join in." },
              { n: "03", Icon: BookOpen, title: "Make something to keep", text: "Explore a living archive. Download your files. Design a book to open together." },
            ].map(({ n, Icon, title, text }) => <article key={n}><div className="la-step-top"><Icon size={23} strokeWidth={1.4} /><span>{n}</span></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <Link href="/how-it-works" className="la-link">See how it all comes together <ArrowRight className="size-4" /></Link>
        </Container>
      </section>

      <section className="la-voice-section">
        <Container size="wide" className="la-voice-grid">
          <div className="la-question-object"><p>FROM THE QUESTION LIBRARY</p><span className="la-quote-mark">“</span><h3>What’s an ordinary day<br />you wish you could<br /><em>live again?</em></h3><div><span>Childhood & everyday wonders</span><span>01 — 68+</span></div></div>
          <div className="la-voice-copy"><p className="la-kicker">02 / More than the words</p><h2>The laugh.<br />The little pause.<br /><em>The way they tell it.</em></h2><p>A recording keeps the things a photograph can’t. Give someone you love the space to remember, and let their voice do the rest.</p><AudioPlayer mediaId="aud_bread" title="The kitchen always smelled of bread" tone="light" /><p className="la-caption">Try the player · Fictional story with synthesized sample narration.</p><Link href="/storytelling" className="la-link">A closer look at storytelling <ArrowUpRight className="size-4" /></Link></div>
        </Container>
      </section>

      <section className="la-section la-explore-section">
        <Container size="wide"><div className="la-section-head la-split-head"><div><p className="la-kicker">03 / See the bigger story</p><h2>A lifetime.<br /><em>Beautifully connected.</em></h2></div><div><p>The first home. The unexpected journey. The people met along the way. Move through the years and discover the places that shaped a life.</p><Link href="/view/cap_margaret" className="la-link">Step inside Margaret’s archive <ArrowUpRight className="size-4" /></Link></div></div><div className="la-explorer"><LifeExplorer /></div><div className="la-view-types"><span><BookOpen size={17} /> Story chapters</span><span><AudioLines size={17} /> Original voices</span><span><ImagePlus size={17} /> Family photographs</span><span><Users size={17} /> Everyone’s perspective</span></div></Container>
      </section>

      <section className="la-section la-together">
        <Container size="wide" className="la-two-column"><div><p className="la-kicker">04 / A little from everyone</p><h2>You share a family.<br /><em>Make a story together.</em></h2><p>A sister with a box of slides. A cousin who remembers the details. A grandchild with a question nobody thought to ask.</p><p>Bring their memories into one place. Review each contribution, choose who can see it, and let the story grow.</p><Link href="/family-collaboration" className="la-link">Meet the family experience <ArrowRight className="size-4" /></Link></div><div className="la-family-object"><div className="la-family-note"><div className="la-note-byline"><span className="la-avatar">E</span><div>Emma added a memory<small>Margaret’s family archive</small></div><span className="la-note-dot" /></div><h3>“Grandma, tell me about<br />the blue bowl.”</h3><p>It was always there on the windowsill. I never knew where it came from.</p><div className="la-note-action"><span>One question. A new connection.</span><Link href="/contribute/emma-blue-bowl" aria-label="Open Emma’s sample invitation"><ArrowUpRight size={20} /></Link></div></div><div className="la-family-footer"><div className="la-avatar-group"><span>M</span><span>S</span><span>E</span></div><p>Different generations.<br /><strong>One shared collection.</strong></p></div></div></Container>
      </section>

      <section className="la-heirlooms">
        <Container size="wide" className="la-two-column"><div className="la-book-display"><span className="la-object-tag">THE HEIRLOOM EDITION / 01</span><BookObject title="Margaret Ellis" subtitle="The little things. The whole life." years="1940 — TODAY" size="lg" color="evergreen" className="la-hero-book" /><span className="la-book-footnote">A personal edition. Made from your memories.</span></div><div className="la-heirloom-copy"><p className="la-kicker">05 / Made to hold</p><h2>From a story on a screen<br /><em>to a place on the shelf.</em></h2><p>Turn favorite chapters and photographs into a life book. Choose the cover, add a dedication, and make an edition that could only belong to your family.</p><div className="la-product-specs"><span>Linen-inspired covers</span><span>Your words & photographs</span><span>Editable page previews</span></div><ButtonLink href="/heirlooms" variant="secondary" size="lg" trailing={<MoveUpRight className="size-4" />}>Explore the heirlooms</ButtonLink><p className="la-caption">Design preview · printing, payments, and shipping are not connected.</p></div></Container>
      </section>

      <section className="la-section la-future"><Container size="wide" className="la-two-column"><div><p className="la-kicker">A little of today, for tomorrow</p><h2>Some words are meant<br /><em>for a future beginning.</em></h2><p>A letter for a milestone. A story for someone not yet old enough to understand. Prepare something personal for a day you’re imagining.</p><Link href="/letters-through-time" className="la-link">Discover Letters Through Time <ArrowRight className="size-4" /></Link><p className="la-caption">Local drafts only. Nothing is scheduled for delivery.</p></div><div className="la-envelope-stage"><SealedLetter to="Emma" openOn="Your next great adventure" /></div></Container></section>

      <section className="la-trust-section"><Container size="wide"><div className="la-trust-heading"><LockKeyhole size={26} strokeWidth={1.3} /><h2>Deeply personal.<br /><em>Always your decisions.</em></h2></div><div className="la-trust-grid"><article><h3>Your circle</h3><p>Choose who a memory is for, and whether it belongs in a printed or shared edition. Secure family access is planned for launch.</p></article><article><h3>Your copy</h3><p>Export stories and available media as ordinary files. Keep a copy outside LifeAtlas, in a place you trust.</p></article><article><h3>A clear picture</h3><p>This demo stores new content on your device. No cloud backup is active. Preservation should begin with honesty.</p></article></div><Link href="/preservation" className="la-link">Our approach to keeping memories <ArrowRight className="size-4" /></Link></Container></section>

      <section className="la-section la-pricing"><Container size="wide"><div className="la-section-head"><p className="la-kicker">A meaningful beginning</p><h2>One person. A whole family.<br /><em>Room for every story.</em></h2><p>Explore the product freely. These are proposed prices for the future service—nothing is charged in this preview.</p></div><PricingCards /><div className="la-pricing-note"><Download size={16} /><span>Portable copies are part of the experience.</span><Link href="/pricing">Compare the details <ArrowRight size={15} /></Link></div></Container></section>

      <section className="la-section la-faq"><Container size="wide" className="la-two-column"><div><p className="la-kicker">A few things to know</p><h2>Good questions.<br /><em>Straight answers.</em></h2><Link href="/faq" className="la-link">More questions & answers <ArrowUpRight size={16} /></Link></div><FaqList items={faqs} /></Container></section>
      <section className="la-final"><Container><p className="la-kicker">There’s so much left to ask.</p><h2>Start with someone<br /><em>you love.</em></h2><p>You don’t have to capture everything.<br />Just something you’ll be glad you asked.</p><ButtonLink href="/app/capsules/new" size="xl" trailing={<ArrowUpRight size={18} />}>Create a memory capsule</ButtonLink><Link href="/gifts/build" className="la-link">Or make it a gift <ArrowRight size={16} /></Link></Container></section>
      <MobileStickyCta label="Start their story" />
    </div>
  );
}

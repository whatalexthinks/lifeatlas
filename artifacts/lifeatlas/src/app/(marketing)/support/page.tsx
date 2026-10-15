import type { Metadata } from "@/lib/router/metadata";
import Link from "@/lib/router/link";
import { BookOpen, HardDriveDownload, Mail, Mic, Package, Type } from "lucide-react";
import { FaqList } from "@/components/marketing/blocks";
import { ArrowLink, Container, Heading, PageIntro, Section } from "@/components/site/kit";
import { faqGroups } from "@/data/site-faq";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Support",
  description: `Help with ${brand.name}: getting started, recording, saving and downloading, inviting family, keepsakes and accessibility settings.`,
  alternates: { canonical: "/support" },
};

const topics = [
  { Icon: BookOpen, title: "Getting started", body: "Create your first capsule and answer one question.", href: "/how-it-works" },
  { Icon: Mic, title: "Recording", body: "Microphone permission, quiet rooms and what to do if recording won't start.", href: "#fixes" },
  { Icon: HardDriveDownload, title: "Saving and downloading", body: "Where your work is kept in the preview, and how to take a copy.", href: "/preservation" },
  { Icon: Mail, title: "Inviting family", body: "Invitation links, roles, and reviewing what people add.", href: "/faq#together" },
  { Icon: Package, title: "Books and physical capsules", body: "Designing keepsakes, proofs and demonstration orders.", href: "/physical-capsules" },
  { Icon: Type, title: "Larger text and easier reading", body: "Text size, contrast and reduced motion settings.", href: "/accessibility" },
];

const fixes: [string, React.ReactNode][] = [
  ["The microphone won't start", "Your browser needs permission: click the lock or site-settings icon beside the address, allow the microphone, and try again. Recording also needs a secure (https) page. If it still won't work, upload a recording from your phone's voice memo app, or type the answer instead."],
  ["My work has disappeared", "Signed-in capsule content syncs to the account that created it. Make sure you are using the same sign-in. Demo-only content stays in the browser where it was created. Download an independent copy from a capsule's Export page."],
  ["An invitation link doesn't open on someone else's phone", "Family invitations and shared access are not connected yet. At this stage, a signed-in account owner can access their own capsules, but cannot invite other accounts."],
  ["The text is too small", <>Open <Link href="/app/settings" className="underline underline-offset-4">Settings</Link> and choose larger text, or use your browser&rsquo;s zoom (Ctrl or ⌘ and +). Every page is designed to work at 200% zoom.</>],
  ["I placed an order, when will it arrive?", "Orders in the preview are demonstrations: nothing is charged, printed or shipped, and each order says so. You can still review a proof and see how fulfilment would work."],
];

export default function SupportPage() {
  const starting = faqGroups.find((g) => g.id === "starting")!.items.slice(0, 3).map((i) => [i.q, i.a] as [string, string]);
  return (
    <>
      <PageIntro
        eyebrow="Support"
        title={
          <>
            How can we <em>help?</em>
          </>
        }
        lead="Most answers are a click away. If you're already in the studio, the Help page there can search every answer as you type."
        actions={<ArrowLink href="/app/help">Open Help in the studio</ArrowLink>}
      />

      <Section space="none" className="pb-20 sm:pb-28" labelledBy="topics">
        <Container size="wide">
          <h2 id="topics" className="sr-only">
            Help topics
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map(({ Icon, title, body, href }) => (
              <li key={title}>
                <Link href={href} className="group flex h-full flex-col rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-line-strong">
                  <Icon className="size-5 text-oxblood" aria-hidden />
                  <span className="mt-4 text-[1.1rem] font-medium">{title}</span>
                  <span className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="fixes" tone="surface" labelledBy="fixes-title">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <Heading
              id="fixes-title"
              eyebrow="Common fixes"
              title={
                <>
                  When something <em>isn&rsquo;t working.</em>
                </>
              }
            />
            <FaqList items={fixes} />
          </div>
        </Container>
      </Section>

      <Section labelledBy="starting-title">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <Heading
              id="starting-title"
              eyebrow="Before you begin"
              title={
                <>
                  The questions <em>most people ask first.</em>
                </>
              }
            >
              <div className="mt-8 flex flex-col items-start gap-2">
                <ArrowLink href="/faq">All questions</ArrowLink>
                <ArrowLink href="/contact">Write to us</ArrowLink>
              </div>
            </Heading>
            <FaqList items={starting} />
          </div>
        </Container>
      </Section>
    </>
  );
}

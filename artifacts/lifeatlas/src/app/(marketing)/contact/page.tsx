import type { Metadata } from "@/lib/router/metadata";
import { ArrowLink, Container, PageIntro, PreviewNote, Section } from "@/components/site/kit";
import { ContactForm } from "@/components/site/contact-form";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${brand.name}. During the preview, messages are kept on your device and we're clear about what is and isn't connected.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            We&rsquo;d love to <em>hear from you.</em>
          </>
        }
        lead="Questions, ideas, something that didn't work, a story about why this matters to you."
        note="Honest note: there's no monitored inbox during the preview. The form below keeps your message on this device, it isn't sent to anyone, and we won't pretend it was."
      />
      <Section space="none" className="pb-24 sm:pb-32">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-20">
            <ContactForm />
            <aside className="space-y-8">
              <div>
                <h2 className="display-3 !text-[1.35rem]">Looking for an answer?</h2>
                <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">Most questions about recording, saving, inviting and keepsakes are answered already.</p>
                <div className="mt-4 flex flex-col items-start gap-1">
                  <ArrowLink href="/support">Support</ArrowLink>
                  <ArrowLink href="/faq">Questions and answers</ArrowLink>
                </div>
              </div>
              <div>
                <h2 className="display-3 !text-[1.35rem]">Found a problem in the preview?</h2>
                <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">Describe the page, your device, what you expected and what happened. Please leave out private family stories and anyone&rsquo;s contact details.</p>
                <div className="mt-4">
                  <ArrowLink href="https://github.com/whatalexthinks/lifeatlas/issues" external>
                    Report it on GitHub
                  </ArrowLink>
                </div>
              </div>
              <PreviewNote>Orders, gifts and future messages in the preview are demonstrations, there&rsquo;s nothing to chase, and nothing has been charged.</PreviewNote>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

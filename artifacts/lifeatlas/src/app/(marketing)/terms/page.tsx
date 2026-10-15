import type { Metadata } from "@/lib/router/metadata";
import Link from "@/lib/router/link";
import { LegalDocument } from "@/components/site/kit";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Terms (draft)",
  description: `The boundaries of the ${brand.name} preview: what it is, what it isn't, and the terms a launched service will need. A draft, not finalised terms.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Terms · draft"
      title={
        <>
          Plain terms for <em>a product preview.</em>
        </>
      }
      status={
        <>
          <strong className="font-medium text-ink">These notes describe the preview&rsquo;s boundaries; they are not finalised terms of service.</strong> Before {brand.name} accepts payments or makes any preservation or delivery commitment, the operating company, contractual terms, billing and refund rules and customer support will be established and published.
        </>
      }
      updated="October 2026"
      sections={[
        {
          id: "what",
          title: "What this is",
          body: <p>{brand.name} is a working product preview. You can create capsules, record and write memories, invite people with a link, design keepsakes and prepare future messages — all stored in your own browser. Accounts, cloud storage, payments, printing, shipping and message delivery are not connected.</p>,
        },
        {
          id: "money",
          title: "No real purchases",
          body: (
            <>
              <p>Prices shown are test prices. Checkout, gifts, promotions, referral credit and orders are demonstrations: no payment is taken, nothing is printed or shipped, and no subscription renews. Every demonstration order says so. Please don&rsquo;t enter real card details anywhere in the preview.</p>
              <p>Promotions shown are examples. Any giveaway will only ever run under published official rules after legal review.</p>
            </>
          ),
        },
        {
          id: "content",
          title: "Your content",
          body: (
            <ul>
              <li>You keep all rights to what you create. We don&rsquo;t receive a copy in the preview.</li>
              <li>Only add material you have the right to use, and ask people before recording or sharing their stories.</li>
              <li>Keep your own copies of anything irreplaceable. The preview is not a backup service.</li>
            </ul>
          ),
        },
        {
          id: "future",
          title: "Future messages and keepsakes",
          body: <p>Future messages can be prepared and previewed, but nothing is scheduled for delivery, and no delivery will be promised until storage continuity, recipient verification and legal review are in place. Physical keepsakes are display items; the physical capsule is not designed or rated for burial.</p>,
        },
        {
          id: "availability",
          title: "Availability and changes",
          body: <p>The preview may change, break or be reset as it develops. Sample data can be reset from Settings. We&rsquo;ll describe material changes on this page.</p>,
        },
        {
          id: "questions",
          title: "Questions",
          body: (
            <p>
              See the <Link href="/faq" className="underline underline-offset-4">questions page</Link>, or leave a message on the <Link href="/contact" className="underline underline-offset-4">contact page</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}

import type { Metadata } from "@/lib/router/metadata";
import Link from "@/lib/router/link";
import { LegalDocument } from "@/components/site/kit";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy (draft)",
  description: `How the ${brand.name} preview handles your memories today, and the commitments a launched service will be held to. A draft, not a finalised policy.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy · draft"
      title={
        <>
          Your memories are yours. <em>Here&rsquo;s how we treat them.</em>
        </>
      }
      status={
        <>
          <strong className="font-medium text-ink">This is a draft for a product preview, not a finalised privacy policy.</strong> It describes what this preview actually does today. Before {brand.name} accepts real accounts or payments, a complete policy will name the company operating the service, its hosting and processors, retention periods and a monitored privacy contact.
        </>
      }
      updated="October 2026"
      sections={[
        {
          id: "today",
          title: "What the preview stores, and where",
          body: (
            <>
              <p>Everything you create — capsules, stories, recordings, photographs, drafts, invitations and demonstration orders — is stored in your own browser, on your own device, using the browser&rsquo;s IndexedDB storage. A few small preferences (such as text size, or a friend&rsquo;s referral code) are kept in the browser&rsquo;s local storage.</p>
              <p>None of it is uploaded to us. We have no copy, cannot read it, and cannot recover it if it&rsquo;s lost.</p>
            </>
          ),
        },
        {
          id: "third-parties",
          title: "What leaves your device",
          body: (
            <>
              <p>The pages, fonts, illustrations and map are served with the site itself; the preview makes no requests to advertising, analytics or other third-party services. The server that hosts the site may keep ordinary request logs (such as IP addresses and pages requested); those arrangements will be described in full before launch.</p>
              <p>Usage events used to improve the product (for example “a capsule was created”) are recorded in your browser only, and are erased with everything else.</p>
            </>
          ),
        },
        {
          id: "who-sees",
          title: "Who can see a capsule",
          body: (
            <>
              <p>Capsules are private by default and are never public or listed. In the preview, the people you invite open a link in the same browser, and the visibility settings on each memory decide what each role can see.</p>
              <p>
                <strong>An honest limit:</strong> because there are no accounts yet, these settings are not a security boundary — anyone using the same browser profile could open the studio. Real access control arrives with accounts. Please use sample or non-sensitive material until then.
              </p>
            </>
          ),
        },
        {
          id: "never",
          title: "What we will never do",
          body: (
            <ul>
              <li>Sell your personal information or your family&rsquo;s stories.</li>
              <li>Use your memories, recordings or photographs to train AI models.</li>
              <li>Make a capsule public without your explicit, per-item choice.</li>
              <li>Invent transcripts, dates, places or relationships and present them as yours.</li>
              <li>Claim security protections, such as encryption, before they are actually in place.</li>
            </ul>
          ),
        },
        {
          id: "control",
          title: "Your control",
          body: (
            <>
              <p>
                You can download a complete copy of any capsule at any time, delete individual memories or whole capsules, and erase everything on this device from <Link href="/app/settings" className="underline underline-offset-4">Settings</Link>. Clearing your browser&rsquo;s site data also removes it.
              </p>
            </>
          ),
        },
        {
          id: "others",
          title: "Other people's stories",
          body: (
            <p>Capsules are often about people other than you. Please ask before recording someone, respect a person&rsquo;s wish to leave something out, and think carefully before sharing stories about people who can&rsquo;t be asked. Contributors keep credit for what they add and can ask for it to be removed.</p>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: <p>Capsules can be about children, kept by their parents or guardians. The preview isn&rsquo;t intended for children to use on their own, and a launched service will set out how it handles accounts for minors.</p>,
        },
        {
          id: "contact",
          title: "Questions",
          body: (
            <p>
              There&rsquo;s no monitored privacy inbox during the preview. You can leave a message on the <Link href="/contact" className="underline underline-offset-4">contact page</Link> — it stays on your device and we say so — or raise a public issue on the project&rsquo;s repository, without personal details.
            </p>
          ),
        },
      ]}
    />
  );
}

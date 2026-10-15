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
          title: "What your account stores, and where",
          body: (
            <>
              <p>When you sign in, capsule content is saved to your account workspace. Photos and recordings you upload are stored in private object storage. Demo-mode content and a few local preferences remain in this browser.</p>
              <p>At this stage, account capsules are accessible only to the signed-in owner. Family sharing, account-wide deletion, managed backups and recovery are not connected. Keep your originals and an independent copy of important material.</p>
            </>
          ),
        },
        {
          id: "third-parties",
          title: "Services that operate your account",
          body: (
            <>
              <p>Sign-in is provided by Clerk, and uploaded media uses private object storage. These providers process the requests needed to authenticate you and save or retrieve your capsule files. This build has no advertising integration.</p>
              <p>Account changes are sent to the app so your capsule workspace can sync across sessions. Hosting providers may retain ordinary service logs. Product analytics integrations are not connected in this build.</p>
            </>
          ),
        },
        {
          id: "who-sees",
          title: "Who can see a capsule",
          body: (
            <>
              <p>Signed-in capsules are private and accessible only to their account owner. Capsules are never public or listed. Family invitations and per-person visibility controls are not active yet.</p>
              <p>
                <strong>An honest limit:</strong> demo roles and visibility settings simulate how sharing could work, but do not grant server access to other people. Only the signed-in owner can access account capsules today.
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
              There&rsquo;s no monitored privacy inbox during the preview. You can leave a message on the <Link href="/contact" className="underline underline-offset-4">contact page</Link>, it stays on your device and we say so, or raise a public issue on the project&rsquo;s repository, without personal details.
            </p>
          ),
        },
      ]}
    />
  );
}

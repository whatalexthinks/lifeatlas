"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, Eye, Share2 } from "lucide-react";
import type { ReferralEvent } from "@/domain/models";
import { referralProgram, referralSummary } from "@/domain/commerce/referrals";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, toast } from "@/components/ui/feedback";
import { useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { formatMoney, relativeTime } from "@/lib/utils";
import { brand } from "@/config/brand";

const statusLabel: Record<ReferralEvent["status"], { label: string; tone: "neutral" | "info" | "success" | "brand" }> = {
  link_shared: { label: "Link opened", tone: "neutral" },
  started_preview: { label: "Started a capsule", tone: "info" },
  subscribed: { label: "Subscribed", tone: "success" },
  rewarded: { label: "Credit earned", tone: "brand" },
  expired: { label: "Expired", tone: "neutral" },
};

/**
 * The referral center. Sharing is always something you do — copy a link or use your
 * device's share sheet. We never read your contacts or message anyone for you.
 */
export default function ReferralsPage() {
  const referrals = useDb((d) => d.referrals);
  const credits = useDb((d) => d.credits);
  const track = useDemoStore((s) => s.track);
  const [copied, setCopied] = React.useState(false);
  const link = `${window.location.origin}/r/${referrals.code}`;
  const summary = referralSummary(referrals.events, credits);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track("referral_link_copied");
      toast.success("Link copied", "Paste it wherever you like.");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.warning("Couldn't copy automatically", "Select the link and copy it yourself.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: brand.name, text: `I'm keeping our family's stories in ${brand.name}. Here's ${referralProgram.friendOffer.replace("their", "your")}:`, url: link });
      track("referral_link_shared");
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  };

  return (
    <div className="mx-auto max-w-[1040px]">
      <PageHeader
        eyebrow="Account"
        title="Refer a friend"
        description={`Friends who start with your link get ${referralProgram.friendOffer}. When they subscribe, you get ${formatMoney(referralProgram.referrerCredit)} of credit.`}
        back={{ href: "/app/billing", label: "Billing" }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Your link">
          <label htmlFor="ref-link" className="text-[0.9375rem] font-medium">
            Share this link
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input id="ref-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-h-11 min-w-0 flex-1 rounded-[12px] border border-line-strong bg-surface px-3.5 font-mono text-[0.875rem]" />
            <Button onClick={() => void copy()} leading={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
              {copied ? "Copied" : "Copy"}
            </Button>
            {canShare ? (
              <Button variant="secondary" onClick={() => void share()} leading={<Share2 className="size-4" />}>
                Share…
              </Button>
            ) : null}
          </div>
          <p className="mt-3 text-[0.9375rem] text-ink-2">
            Or tell them your code: <span className="font-mono font-medium text-ink">{referrals.code}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href={`/r/${referrals.code}`} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium underline underline-offset-4">
              <Eye className="size-4" aria-hidden /> See what your friend sees
            </Link>
          </div>
          <p className="mt-5 text-[0.875rem] text-ink-3">Sharing is always your choice. We never look at your contacts or send messages on your behalf.</p>
        </Panel>

        <Panel title="Your credit">
          <p className="font-sans text-[2.6rem] font-[450] leading-none tracking-[-0.05em]">{formatMoney(Math.max(0, summary.balance))}</p>
          <p className="mt-2 text-[0.9375rem] text-ink-3">Used automatically toward {referralProgram.creditUses}.</p>
          <ul className="mt-5 divide-y divide-line border-y border-line text-[0.9375rem]">
            {credits.length ? (
              credits.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span>
                    {c.reason}
                    <span className="block text-[0.8125rem] text-ink-3">{relativeTime(c.at)}</span>
                  </span>
                  <span className={c.amount < 0 ? "text-ink-3" : "font-medium"}>
                    {c.amount < 0 ? "−" : "+"}
                    {formatMoney(Math.abs(c.amount))}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-3 text-ink-3">No credit yet.</li>
            )}
          </ul>
          <p className="mt-3 text-[0.8125rem] text-ink-3">Demo credit: it has no cash value and can&rsquo;t be withdrawn.</p>
        </Panel>
      </div>

      <Panel title="Activity" className="mt-6" description="Fictional sample activity in this preview — a real program would only show what your friends agreed to share.">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Opened your link", summary.shared],
            ["Started a capsule", summary.started],
            ["Subscribed", summary.subscribed],
            ["Rewards earned", summary.rewarded],
          ].map(([label, n]) => (
            <div key={label as string} className="rounded-[14px] bg-ivory p-4">
              <dt className="text-[0.8125rem] text-ink-3">{label}</dt>
              <dd className="mt-1 font-sans text-[1.8rem] tracking-[-0.03em]">{n}</dd>
            </div>
          ))}
        </dl>
        {referrals.events.length ? (
          <ul className="mt-6 divide-y divide-line">
            {referrals.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-medium">{e.friendName}</span>
                  <span className="ml-2 text-[0.8125rem] text-ink-3">{relativeTime(e.at)}</span>
                </span>
                <span className="flex items-center gap-2">
                  {e.rewardCredit ? <span className="text-[0.875rem] text-ink-2">+{formatMoney(e.rewardCredit)}</span> : null}
                  <Badge tone={statusLabel[e.status].tone}>{statusLabel[e.status].label}</Badge>
                  {e.isSample ? <Badge tone="demo">Sample</Badge> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-[0.9375rem] text-ink-3">Nothing yet. When friends open your link, you&rsquo;ll see it here.</p>
        )}
      </Panel>

      <Panel title="The fine print" className="mt-6">
        <ul className="list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-ink-2">
          {referralProgram.terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <DemoNotice className="mt-5">In this preview, referrals and credit are simulated. No real accounts exist, and nothing is charged or paid out.</DemoNotice>
      </Panel>
    </div>
  );
}

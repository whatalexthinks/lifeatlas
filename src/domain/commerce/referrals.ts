import type { CreditEntry, ReferralEvent } from "@/domain/models";

/**
 * Referrals: a way to share something valuable, not a sales scheme. The terms live here and
 * are shown verbatim in the referral center.
 */
export const referralProgram = {
  /** What the friend gets: the "A friend's invitation" promotion. */
  friendPromotionId: "promo_referral",
  friendOffer: "20% off their first year",
  /** What you get when a friend subscribes, in cents of account credit. */
  referrerCredit: 2000,
  maxRewardsPerYear: 10,
  creditUses: "your renewal, a printed book or a physical capsule",
  terms: [
    "Your friend gets 20% off their first year of an annual plan when they arrive with your link or code.",
    "You get $20 of account credit when they subscribe — up to 10 rewards a year.",
    "Credit has no cash value, can't be transferred, and is used automatically at checkout or renewal.",
    "Friends who only contribute to a capsule never need to pay, so inviting family is never a referral.",
    "Your own link can't be used on your own account. We may withhold rewards for duplicate or self-made accounts.",
  ],
} as const;

/** A short, readable personal code: SARAH-7KQ2. */
export function makeReferralCode(givenName: string, seed: string) {
  const letters = givenName.normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "FRIEND";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[h % alphabet.length];
    h = Math.floor(h / alphabet.length) + 7919 * (i + 1);
  }
  return `${letters}-${suffix}`;
}

export const isReferralCodeShape = (code: string) => /^[A-Z]{2,8}-[A-Z2-9]{4}$/.test(code.trim().toUpperCase());

export function referralSummary(events: ReferralEvent[], credits: CreditEntry[]) {
  const by = (s: ReferralEvent["status"]) => events.filter((e) => e.status === s).length;
  const earned = credits.filter((c) => c.source === "referral").reduce((s, c) => s + c.amount, 0);
  const balance = credits.reduce((s, c) => s + c.amount, 0);
  return { shared: events.length, started: by("started_preview") + by("subscribed") + by("rewarded"), subscribed: by("subscribed") + by("rewarded"), rewarded: by("rewarded"), earned, balance };
}

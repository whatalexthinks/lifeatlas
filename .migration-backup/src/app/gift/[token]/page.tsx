"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Gift as GiftIcon, Mic, PenLine, Users } from "lucide-react";
import type { Gift } from "@/domain/models";
import { BrandMark, Wordmark } from "@/components/brand/logo";
import { GiftEnvelope } from "@/components/gifting/envelope";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoNotice, Skeleton } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

const occasionText: Record<Gift["occasion"], string> = {
  christmas: "Merry Christmas",
  hanukkah: "Happy Hanukkah",
  birthday: "Happy birthday",
  mothers_day: "Happy Mother's Day",
  fathers_day: "Happy Father's Day",
  anniversary: "Happy anniversary",
  retirement: "Happy retirement",
  new_baby: "Welcome, little one",
  just_because: "Just because",
  other: "A gift for you",
};

export default function GiftOpening() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const reduced = usePrefersReducedMotion();
  const [gift, setGift] = React.useState<Gift | null>(null);
  const catalog = useDb((d) => d.catalog);
  const product = gift ? catalog.find((p) => p.id === gift.productId) : undefined;
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    services()
      .gifts.resolveToken(token)
      .then((r) => (r.status === "ok" ? setGift(r.data) : setError(r.status === "error" ? r.message : "Unavailable")));
  }, [hydrated, token]);

  const openEnvelope = async () => {
    setOpen(true);
    await services().gifts.markOpened(token);
    setTimeout(() => setRevealed(true), reduced ? 0 : 1100);
  };

  const begin = async () => {
    if (!gift) return;
    setBusy(true);
    router.push(`/gift/${token}/begin`);
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(120%_80%_at_50%_0%,#efe6d4,#f8f6f1_60%)]">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5 text-evergreen">
          <BrandMark className="size-8 text-oxblood" title="" />
          <Wordmark className="text-ink" />
        </span>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        {!hydrated || (!gift && !error) ? (
          <div className="space-y-6 pt-10">
            <Skeleton className="mx-auto aspect-[1.55] max-w-md" />
          </div>
        ) : error || !gift ? (
          <div className="pt-20 text-center">
            <h1 className="font-serif text-[2.6rem] leading-tight">We couldn&rsquo;t find this gift.</h1>
            <p className="mx-auto mt-4 max-w-md text-[1.1rem] text-ink-2">{error} Gift links in this preview open only in the browser where the gift was made.</p>
            <ButtonLink href="/gifts" variant="secondary" size="lg" className="mt-8">
              About {brand.name} gifts
            </ButtonLink>
          </div>
        ) : (
          <div className="pt-6 text-center">
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-brass-ink">{gift.occasion === "other" && gift.occasionLabel ? gift.occasionLabel : occasionText[gift.occasion]}</p>
            <h1 className="mx-auto mt-4 max-w-2xl font-serif text-[clamp(2.6rem,1.9rem+3vw,4.4rem)] leading-[1.02]">
              {gift.recipient.name}, <em>something for you.</em>
            </h1>
            <div className="mt-16 sm:mt-20">
              <GiftEnvelope recipient={gift.recipient.name} giver={gift.giverName} dedication={gift.dedication} reveal={gift.reveal} occasion={gift.occasion === "other" ? gift.occasionLabel : occasionText[gift.occasion]} open={open} />
            </div>
            {!open ? (
              <Button size="xl" className="mt-12" onClick={() => void openEnvelope()} leading={<GiftIcon className="size-5" />}>
                Open your gift
              </Button>
            ) : null}

            <div className={cn("transition-[opacity,transform] duration-700", revealed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} inert={!revealed}>
              <div className="mx-auto mt-14 max-w-xl rounded-[28px] bg-surface p-7 text-left shadow-md sm:p-9">
                <p className="eyebrow">Your memory capsule</p>
                <h2 className="mt-4 font-serif text-[2.2rem] leading-tight">A place for your stories, in your own words.</h2>
                <p className="mt-3 text-[1.1rem] leading-relaxed text-ink-2">{gift.giverName} would love to hear the stories only you can tell. Here&rsquo;s how it works:</p>
                <div className="mt-5 rounded-[16px] bg-ivory px-5 py-4 text-[1rem]">
                  <p className="font-medium">What&rsquo;s included</p>
                  <p className="mt-1 text-ink-2">
                    {gift.status === "draft"
                      ? `${product?.name ?? "A capsule plan"} — once ${gift.giverName.split(" ")[0]} completes the gift.`
                      : `One year of the ${product?.name ?? "capsule plan"}, prepaid by ${gift.giverName}. No card needed, and it won't renew on its own.`}{" "}
                    Your family joins free.
                  </p>
                </div>
                <ul className="mt-6 space-y-4 text-[1.05rem]">
                  <li className="flex gap-3">
                    <Mic className="mt-1 size-5 shrink-0 text-evergreen" /> One gentle question at a time. Tap once to answer out loud.
                  </li>
                  <li className="flex gap-3">
                    <PenLine className="mt-1 size-5 shrink-0 text-evergreen" /> Prefer writing? Type instead, or add an old photograph.
                  </li>
                  <li className="flex gap-3">
                    <Users className="mt-1 size-5 shrink-0 text-evergreen" /> Your family can listen, read and add their own memories — privately.
                  </li>
                </ul>
                <Button size="xl" block className="mt-8" onClick={() => void begin()} loading={busy} trailing={<ArrowRight className="size-5" />}>
                  Begin with one question
                </Button>
                <p className="mt-3 text-center text-[0.875rem] text-ink-3">No password. Skip anything. Stop whenever you like.</p>
              </div>
              {gift.status === "draft" ? (
                <DemoNotice className="mx-auto mt-6 max-w-xl text-left">This is a preview of a gift that hasn&rsquo;t been through the demo checkout yet.</DemoNotice>
              ) : (
                <DemoNotice className="mx-auto mt-6 max-w-xl text-left">Gift preview from a demo purchase — nothing was charged, and no email was sent. It opens only in this browser.</DemoNotice>
              )}
            </div>
            <p className="mt-16 text-[0.875rem] text-ink-3">
              <Link href="/" className="text-link">
                What is {brand.name}?
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

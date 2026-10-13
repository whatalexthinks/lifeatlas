"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import type { FutureMessage } from "@/domain/models";
import { BrandMark } from "@/components/brand/logo";
import { LetterOpening } from "@/components/future/letter-opening";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { describeInterval, todayIso } from "@/lib/dates";
import { formatDate } from "@/lib/utils";

export default function FutureOpenPage() {
  const { token } = useParams<{ token: string }>();
  const hydrated = useHydrated();
  const [message, setMessage] = React.useState<FutureMessage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [previewing, setPreviewing] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    services()
      .futureDelivery.resolveToken(token)
      .then((r) => (r.status === "ok" ? setMessage(r.data) : setError(r.status === "error" ? r.message : "Unavailable")));
  }, [hydrated, token]);

  const due = message ? message.isExample || message.release.date <= todayIso() : false;

  return (
    <div className="theme-evening min-h-dvh bg-night">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-[#c4ad86]">
          <BrandMark className="size-8" />
          <span className="font-serif text-[1.4rem] text-night-ink">
            Life<em>Atlas</em>
          </span>
        </Link>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[0.8125rem] text-night-ink-2">Simulated opening · no letter was delivered</span>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-5 pb-24 pt-6 sm:px-8">
        {!hydrated || (!message && !error) ? (
          <Skeleton className="mx-auto mt-10 aspect-[1.55] max-w-md opacity-20" />
        ) : error || !message ? (
          <div className="pt-20 text-center">
            <h1 className="font-serif text-[2.6rem] text-night-ink">We couldn&rsquo;t find this letter.</h1>
            <p className="mt-3 text-night-ink-2">{error}</p>
          </div>
        ) : due || previewing ? (
          <LetterOpening message={message} mode={message.isExample ? "example" : "preview"} />
        ) : (
          <div className="pt-16 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/10 text-[#c4ad86]">
              <Lock className="size-7" />
            </span>
            <h1 className="mt-6 font-serif text-[clamp(2.4rem,1.8rem+2.5vw,3.6rem)] leading-tight text-night-ink">This letter is sealed until {formatDate(message.release.date, "long")}.</h1>
            <p className="mx-auto mt-4 max-w-lg text-[1.1rem] text-night-ink-2">
              That&rsquo;s {describeInterval(message.release.date)}. In the real service, {message.recipient.name.split(" ")[0]} would be able to open it then — and not before.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="light" onClick={() => setPreviewing(true)}>
                Preview it anyway (demo only)
              </Button>
              <ButtonLink href="/app/future-messages" variant="outlineLight">
                Back to letters
              </ButtonLink>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

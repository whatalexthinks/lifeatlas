"use client";

import { useEffect } from "react";
import Link from "@/lib/router/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Route-level error boundary. Local data lives in IndexedDB and is untouched by a render error. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-24 sm:px-8">
        <p className="la-kicker">
          <span aria-hidden /> Something went wrong
        </p>
        <h1 className="mt-6 max-w-3xl font-sans text-[clamp(2.6rem,2rem+3.4vw,4.6rem)] font-medium leading-[1.03] tracking-[-0.06em]">
          This page stumbled. <em className="font-serif font-normal tracking-[-0.04em]">Your stories are fine.</em>
        </h1>
        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
          Everything you&rsquo;ve saved is still stored on this device. Try again, or head back to the studio.
          {error.digest ? <span className="mt-2 block font-mono text-[0.8125rem] text-ink-3">Reference {error.digest}</span> : null}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
          <Link href="/app" className="la-link">
            Go to the studio
          </Link>
        </div>
      </main>
    </div>
  );
}

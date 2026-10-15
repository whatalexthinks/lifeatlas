import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { brand } from "@/config/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-24 sm:px-8">
        <p className="la-kicker">
          <span aria-hidden /> Page not found · 404
        </p>
        <h1 className="mt-6 max-w-3xl font-sans text-[clamp(2.8rem,2rem+4vw,5.2rem)] font-medium leading-[1.02] tracking-[-0.06em]">
          This page has wandered off. <em className="font-serif font-normal tracking-[-0.04em]">The stories haven&rsquo;t.</em>
        </h1>
        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">The link may be mistyped, or it was a private link that only opens in the browser where it was made.</p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <ButtonLink href="/" size="lg">
            Back to {brand.name}
          </ButtonLink>
          <Link href="/demo" className="la-link">
            Explore a sample archive <ArrowRight className="size-4" />
          </Link>
          <Link href="/app" className="la-link">
            Open the studio <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

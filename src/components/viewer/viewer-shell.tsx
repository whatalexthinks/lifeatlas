"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowUpRight, Lock, Moon, Sun } from "lucide-react";
import type { Capsule, Memory } from "@/domain/models";
import { BrandMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { PersonaSwitcher } from "@/components/studio/persona-switcher";
import { PreviewBanner, useBackToSelf, useOwnPersona } from "@/components/studio/preview-banner";
import { useCapsule, useHydrated, usePersona, useRole } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

interface ViewerCtx {
  capsule: Capsule;
  tone: "paper" | "night";
  hrefFor: (m: Memory) => string;
  base: string;
}

const Ctx = React.createContext<ViewerCtx | null>(null);

export function useViewer() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useViewer outside ViewerShell");
  return c;
}

const TONE_KEY = "lifeatlas.viewer.tone";
const TONE_EVENT = "lifeatlas:viewer-tone";

/** The viewer's paper/night preference lives in localStorage; read it as an external store. */
function readTone(): "paper" | "night" {
  try {
    return localStorage.getItem(TONE_KEY) === "paper" ? "paper" : "night";
  } catch {
    return "night";
  }
}
function subscribeTone(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(TONE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(TONE_EVENT, cb);
  };
}

export function ViewerShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ capsuleId: string }>();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const capsule = useCapsule(params.capsuleId);
  const persona = usePersona();
  const role = useRole(params.capsuleId);
  const tone = React.useSyncExternalStore(subscribeTone, readTone, () => "night" as const);
  const toggleTone = () => {
    const next = tone === "night" ? "paper" : "night";
    try {
      localStorage.setItem(TONE_KEY, next);
      window.dispatchEvent(new Event(TONE_EVENT));
    } catch {
      /* ignore */
    }
  };

  const base = `/view/${params.capsuleId}`;
  const night = tone === "night";

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-night px-6 py-24">
        <Skeleton className="mx-auto h-[60vh] max-w-5xl opacity-10" />
      </div>
    );
  }

  if (!capsule) {
    return (
      <Shell night>
        <div className="mx-auto max-w-xl py-32 text-center">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[#c4ad86]">Not found</p>
          <h1 className="mt-5 font-serif text-[3rem] leading-tight text-night-ink">We couldn&rsquo;t find this archive.</h1>
          <p className="mt-4 text-night-ink-2">It may have been removed, or it was created in a different browser. Archives in this preview live only on the device where they were made.</p>
          <ButtonLink href="/demo" variant="light" className="mt-8">
            Explore the sample archive
          </ButtonLink>
        </div>
      </Shell>
    );
  }

  const canManage = role === "owner" || role === "organizer";
  // The sample archive is open to demo visitors; a family member still needs a role on it.
  const allowed = canManage || (capsule.viewerEnabled && (role !== null || (capsule.isSample && !persona.personId)));
  if (!allowed) {
    return (
      <Shell night>
        <div className="mx-auto max-w-xl py-32 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10 text-[#c4ad86]">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-6 font-serif text-[2.8rem] leading-tight text-night-ink">This archive isn&rsquo;t shared with {persona.name.split(" ")[0]} yet.</h1>
          <p className="mt-4 text-night-ink-2">
            {capsule.viewerEnabled ? "Only people the organizer invites can open it." : "The organizer hasn't turned on the family viewer."} In this preview the check is simulated for the selected demo identity — real access control arrives with accounts.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BackToSelfButton />
            <div className="rounded-full bg-white/10 px-1">
              <PersonaSwitcher tone="night" />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const tabs = [
    { href: base, label: "Cover" },
    { href: `${base}/timeline`, label: "Timeline" },
    { href: `${base}/map`, label: "Map" },
    { href: `${base}/stories`, label: "Chapters" },
    { href: `${base}/photos`, label: "Photographs" },
    { href: `${base}/voices`, label: "Voices" },
    { href: `${base}/letters`, label: "Letters" },
  ];

  return (
    <Ctx.Provider value={{ capsule, tone, hrefFor: (m) => `${base}/stories/${m.id}`, base }}>
      <div className={cn("min-h-dvh", night ? "theme-evening bg-night text-night-ink" : "bg-paper text-ink")}>
        <header className={cn("sticky top-0 z-50 border-b backdrop-blur-xl", night ? "border-white/[0.07] bg-night/80" : "border-line bg-paper/85")}>
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-8">
            <Link href={base} className={cn("flex min-w-0 items-center gap-2.5", night ? "text-[#c4ad86]" : "text-evergreen")} aria-label={`${capsule.subjectName} — archive cover`}>
              <BrandMark className="size-7 shrink-0" />
              <span className={cn("truncate font-serif text-[1.3rem]", night ? "text-night-ink" : "text-ink")}>{capsule.subjectName}</span>
            </Link>
            <nav aria-label="Archive" className="scrollbar-none ml-auto hidden items-center gap-0.5 overflow-x-auto md:flex">
              {tabs.map((t) => {
                const on = t.href === base ? pathname === base : pathname.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-[0.875rem] transition-colors",
                      on ? (night ? "bg-white/10 text-night-ink" : "bg-surface text-ink shadow-sm") : night ? "text-night-ink-3 hover:text-night-ink" : "text-ink-3 hover:text-ink",
                    )}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-1 md:ml-2">
              <button onClick={toggleTone} className={cn("grid size-10 place-items-center rounded-full", night ? "text-night-ink-2 hover:bg-white/10" : "text-ink-2 hover:bg-ivory")} aria-label={night ? "Switch to daylight reading" : "Switch to evening reading"} title={night ? "Daylight" : "Evening"}>
                {night ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </button>
              {canManage ? (
                <Link href={`/app/capsules/${capsule.id}`} className={cn("hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.875rem] sm:inline-flex", night ? "text-night-ink-2 hover:bg-white/10" : "text-ink-2 hover:bg-ivory")}>
                  Studio <ArrowUpRight className="size-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
          <nav aria-label="Archive (mobile)" className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {tabs.map((t) => {
              const on = t.href === base ? pathname === base : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.8125rem]", on ? (night ? "bg-white/10 text-night-ink" : "bg-surface text-ink shadow-sm") : night ? "text-night-ink-3" : "text-ink-3")}>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <PreviewBanner capsuleId={capsule.id} tone={night ? "night" : "paper"} />
        <main id="main">{children}</main>
        <footer className={cn("border-t px-4 py-10 text-center text-[0.8125rem] sm:px-8", night ? "border-white/[0.07] text-night-ink-3" : "border-line text-ink-3")}>
          A private LifeAtlas archive{capsule.isSample ? " · Fictional sample family" : ""} · Never publicly listed ·{" "}
          <Link href="/" className="underline underline-offset-2">
            LifeAtlas
          </Link>
        </footer>
      </div>
    </Ctx.Provider>
  );
}

function Shell({ children, night }: { children: React.ReactNode; night?: boolean }) {
  return (
    <div className={cn("min-h-dvh px-6", night ? "bg-night" : "bg-paper")}>
      <div className="pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-[#c4ad86]" aria-label="LifeAtlas home">
          <BrandMark className="size-7" />
        </Link>
      </div>
      {children}
    </div>
  );
}

export function ViewerPage({ title, eyebrow, lead, children, wide }: { title: React.ReactNode; eyebrow?: string; lead?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  const { tone } = useViewer();
  const night = tone === "night";
  return (
    <div className={cn("mx-auto px-4 pb-24 pt-12 sm:px-8 sm:pt-16", wide ? "max-w-[1440px]" : "max-w-[1180px]")}>
      <header className="mb-10 max-w-3xl">
        {eyebrow ? <p className={cn("eyebrow", night && "text-[#c4ad86]")}>{eyebrow}</p> : null}
        <h1 className={cn("mt-4 font-serif text-[clamp(2.6rem,2rem+2.4vw,4.2rem)] leading-[1] tracking-[-0.025em]", night ? "text-night-ink" : "text-ink")}>{title}</h1>
        {lead ? <div className={cn("mt-4 text-lead", night ? "text-night-ink-2" : "text-ink-2")}>{lead}</div> : null}
      </header>
      {children}
    </div>
  );
}

function BackToSelfButton() {
  const persona = usePersona();
  const own = useOwnPersona();
  const back = useBackToSelf();
  if (persona.id === own.id) return null;
  return (
    <Button variant="light" onClick={() => void back()}>
      Back to {own.name.split(" ")[0]}
    </Button>
  );
}

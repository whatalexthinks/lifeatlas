"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarX2, Link2Off, ShieldOff, Type } from "lucide-react";
import type { Capsule, Invitation } from "@/domain/models";
import { BrandMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { StorageAlert } from "@/components/ui/storage-alert";
import { useDb, useHydrated } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

interface Ctx {
  invitation: Invitation;
  capsule: Capsule;
  organizerName: string;
}
const ContributeCtx = React.createContext<Ctx | null>(null);
export function useInvitation() {
  const c = React.useContext(ContributeCtx);
  if (!c) throw new Error("useInvitation outside ContributeShell");
  return c;
}

type State = { kind: "loading" } | { kind: "ok"; invitation: Invitation } | { kind: "error"; code: string; message: string };

/** Minimal, senior-friendly frame for invitation links. */
export function ContributeShell({ children }: { children: React.ReactNode }) {
  const { token } = useParams<{ token: string }>();
  const hydrated = useHydrated();
  const capsules = useDb((d) => d.capsules);
  const invitations = useDb((d) => d.invitations);
  const profile = useDb((d) => d.account.profile);
  const textSize = useDb((d) => d.account.preferences.textSize);
  const mutate = useDemoStore((s) => s.mutate);
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    services()
      .communications.resolveToken(token)
      .then((r) => {
        if (!alive) return;
        if (r.status === "ok") setState({ kind: "ok", invitation: r.data });
        else setState({ kind: "error", code: r.status === "error" ? r.code : "unknown", message: r.status === "error" ? r.message : "Unavailable" });
      });
    return () => {
      alive = false;
    };
  }, [hydrated, token]);

  // keep invitation fresh as status changes
  const fresh = state.kind === "ok" ? invitations.find((i) => i.id === state.invitation.id) ?? state.invitation : null;
  const capsule = fresh ? capsules.find((c) => c.id === fresh.capsuleId) : undefined;

  const toggleText = () =>
    mutate((d) => {
      d.account.preferences.textSize = d.account.preferences.textSize === "large" ? "standard" : "large";
    });

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-20 max-w-3xl items-center justify-between px-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5 text-evergreen">
          <BrandMark className="size-8" />
          <span className="font-serif text-[1.4rem] text-ink">
            Life<em>Atlas</em>
          </span>
        </span>
        <button onClick={toggleText} className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[0.9375rem] font-medium" aria-pressed={textSize === "large"}>
          <Type className="size-4" /> {textSize === "large" ? "Standard text" : "Larger text"}
        </button>
      </header>
      <main id="main" className={cn("mx-auto max-w-3xl px-5 pb-24 sm:px-8", textSize === "large" && "text-[1.1rem]")}>
        {state.kind === "loading" || !hydrated ? (
          <div className="space-y-5 pt-10">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32" />
            <Skeleton className="h-16 w-48 rounded-full" />
          </div>
        ) : state.kind === "error" || !fresh || !capsule ? (
          <TokenProblem code={state.kind === "error" ? state.code : "not_found"} message={state.kind === "error" ? state.message : "We couldn't find this invitation."} />
        ) : (
          <ContributeCtx.Provider value={{ invitation: fresh, capsule, organizerName: profile.displayName }}>
            <StorageAlert audience="guest" className="mt-6" />
            {children}
          </ContributeCtx.Provider>
        )}
      </main>
    </div>
  );
}

function TokenProblem({ code, message }: { code: string; message: string }) {
  const icon = code === "forbidden" ? <ShieldOff className="size-7" /> : code === "conflict" ? <CalendarX2 className="size-7" /> : <Link2Off className="size-7" />;
  const body =
    code === "forbidden"
      ? "The person who sent it has withdrawn this link. If you think that's a mistake, ask them for a new one."
      : code === "conflict"
        ? "Invitation links last 30 days. Ask the person who invited you to send a fresh link — your answers are never lost when a link expires."
        : "Check that the whole link was copied. In this preview, invitations only open in the browser where they were created.";
  return (
    <div className="pt-16 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-ivory text-ink-2">{icon}</span>
      <h1 className="mt-6 font-serif text-[2.6rem] leading-tight">{message}</h1>
      <p className="mx-auto mt-4 max-w-md text-[1.1rem] leading-relaxed text-ink-2">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="secondary" size="lg">
          About LifeAtlas
        </ButtonLink>
        <ButtonLink href="/app/invitations" variant="ghost" size="lg">
          Organizer? Manage invitations
        </ButtonLink>
      </div>
      <p className="mt-10 text-[0.875rem] text-ink-3">
        Try the sample links: <Link className="text-link" href="/contribute/margaret-stories">Margaret</Link> · <Link className="text-link" href="/contribute/emma-blue-bowl">Emma</Link>
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as RD } from "radix-ui";
import {
  BookOpen,
  CreditCard,
  Gift,
  HardDrive,
  HelpCircle,
  Home,
  Hourglass,
  LayoutGrid,
  Library,
  MailOpen,
  MoreHorizontal,
  Package,
  Plus,
  Settings,
  Users,
  X,
  ArrowUpRight,
} from "lucide-react";
import { BrandMark, Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { useBackToSelf, useOwnPersona } from "./preview-banner";
import { Skeleton } from "@/components/ui/feedback";
import { StorageAlert } from "@/components/ui/storage-alert";
import { useDb, useHydrated, usePendingReviewCount, usePersistence, usePersona } from "@/hooks/use-data";
import { cn, relativeTime } from "@/lib/utils";
import { NotificationsButton } from "./notifications";
import { PersonaSwitcher } from "./persona-switcher";
import { brand } from "@/config/brand";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; match?: (p: string) => boolean };

function useNav(): { primary: NavItem[]; secondary: NavItem[] } {
  const pending = usePendingReviewCount();
  return {
    primary: [
      { href: "/app", label: "Home", icon: Home, match: (p) => p === "/app" },
      { href: "/app/capsules", label: "Capsules", icon: Library, match: (p) => p.startsWith("/app/capsules") },
      { href: "/app/invitations", label: "Invitations & review", icon: MailOpen, badge: pending },
      { href: "/app/family", label: "Family", icon: Users },
      { href: "/app/future-messages", label: "Letters Through Time", icon: Hourglass },
      { href: "/app/heirlooms", label: "Heirlooms", icon: BookOpen },
      { href: "/app/together", label: "Holiday session", icon: Gift },
    ],
    secondary: [
      { href: "/app/preservation", label: "Preservation", icon: HardDrive },
      { href: "/app/orders", label: "Orders", icon: Package },
      { href: "/app/billing", label: "Billing", icon: CreditCard },
      { href: "/app/settings", label: "Settings", icon: Settings },
      { href: "/app/help", label: "Help", icon: HelpCircle },
    ],
  };
}

function isActive(item: NavItem, pathname: string) {
  return item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function RailLink({ item, pathname, compact }: { item: NavItem; pathname: string; compact?: boolean }) {
  const active = isActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={compact ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[12px] text-[0.9375rem] transition-colors",
        compact ? "size-11 justify-center" : "h-10 px-3",
        active ? "bg-surface font-medium text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:bg-surface/70 hover:text-ink",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-evergreen" : "text-ink-3 group-hover:text-ink-2")} />
      {!compact ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
      {item.badge ? (
        <span className={cn("grid min-w-5 place-items-center rounded-full bg-terracotta px-1.5 text-[0.6875rem] font-semibold text-white", compact ? "absolute -right-0.5 -top-0.5 h-[18px]" : "ml-auto h-5")}>{item.badge}</span>
      ) : null}
    </Link>
  );
}

export function SaveStatus({ compact }: { compact?: boolean }) {
  const { mode, lastSavedAt, error } = usePersistence();
  const label =
    mode === "memory"
      ? "This browser can't save — changes vanish on reload"
      : error
        ? error
        : mode === "pending"
          ? "Opening your archive…"
          : `Saved on this device${lastSavedAt ? ` · ${relativeTime(lastSavedAt)}` : ""}`;
  const tone = mode === "memory" || error ? "bg-danger" : mode === "pending" ? "bg-warning" : "bg-success";
  if (compact) return <span className={cn("block size-2 rounded-full", tone)} title={label} aria-label={label} />;
  return (
    <div className="rounded-[14px] border border-brass/30 bg-brass-soft/60 p-3.5">
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
        <span className={cn("size-2 rounded-full", tone)} aria-hidden />
        Demo · this device only
      </p>
      <p className="mt-1 text-[0.75rem] leading-snug text-ink-3" role="status">
        {label.replace(/\.$/, "")}. Not backed up.{" "}
        <Link href="/app/preservation" className="underline underline-offset-2">
          Download a copy
        </Link>
      </p>
    </div>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const persona = usePersona();
  const { primary, secondary } = useNav();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const pending = usePendingReviewCount();
  const nonOrganizer = hydrated && persona.kind !== "organizer" && persona.kind !== "operations";

  return (
    <div data-studio className="min-h-dvh bg-paper lg:grid lg:grid-cols-[272px_1fr] md:max-lg:grid md:max-lg:grid-cols-[76px_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-ivory/50 px-4 pb-4 pt-5 lg:flex" aria-label="Studio navigation">
        <div className="flex items-center justify-between px-2">
          <Logo href="/app" />
        </div>
        <div className="mt-6">
          <PersonaSwitcher />
        </div>
        <ButtonLink href="/app/gather" className="mt-5" block leading={<Plus className="size-4" />}>
          Gather a memory
        </ButtonLink>
        <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto" aria-label="Primary">
          {primary.map((i) => (
            <RailLink key={i.href} item={i} pathname={pathname} />
          ))}
          <p className="px-3 pb-1.5 pt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-4">Account</p>
          {secondary.map((i) => (
            <RailLink key={i.href} item={i} pathname={pathname} />
          ))}
        </nav>
        <SaveStatus />
      </aside>

      {/* Tablet compressed rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col items-center gap-1 border-r border-line bg-ivory/50 py-4 md:flex lg:hidden" aria-label="Studio navigation">
        <Link href="/app" aria-label={`${brand.name} studio home`} className="mb-3 text-evergreen">
          <BrandMark className="size-8" />
        </Link>
        <PersonaSwitcher compact side="right" />
        <Link href="/app/gather" aria-label="Gather a memory" title="Gather a memory" className="my-3 grid size-11 place-items-center rounded-full bg-evergreen text-on-evergreen shadow-md">
          <Plus className="size-5" />
        </Link>
        {[...primary, ...secondary].map((i) => (
          <RailLink key={i.href} item={i} pathname={pathname} compact />
        ))}
        <div className="mt-auto pt-3">
          <SaveStatus compact />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10" data-site-header>
          <div className="flex items-center gap-3 md:hidden">
            <Logo href="/app" />
          </div>
          <div className="hidden min-w-0 items-center gap-2 text-[0.8125rem] text-ink-3 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brass-soft px-2.5 py-1 font-medium text-brass-ink">
              <span className="size-1.5 rounded-full bg-brass" aria-hidden /> Demo mode
            </span>
            <span className="truncate">Sample family &amp; local data only — nothing is sent, charged or backed up.</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/view/cap_margaret" className="hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.875rem] text-ink-2 hover:bg-ivory hover:text-ink sm:inline-flex">
              Open viewer <ArrowUpRight className="size-3.5" />
            </Link>
            <NotificationsButton />
            <div className="md:hidden">
              <PersonaSwitcher compact align="end" />
            </div>
          </div>
        </header>

        <main id="main" className="px-4 pb-32 pt-6 sm:px-6 md:pb-16 lg:px-10 lg:pt-10">
          {!hydrated ? (
            <div className="space-y-6" aria-busy="true" aria-label="Opening your archive">
              <Skeleton className="h-10 w-72" />
              <div className="grid gap-5 lg:grid-cols-3">
                <Skeleton className="h-64 lg:col-span-2" />
                <Skeleton className="h-64" />
              </div>
              <Skeleton className="h-40" />
            </div>
          ) : nonOrganizer ? (
            <NotOrganizer />
          ) : (
            <>
              <StorageAlert className="mx-auto mb-6 max-w-[1240px]" />
              {children}
            </>
          )}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/92 backdrop-blur-xl safe-bottom md:hidden" aria-label="Studio">
        <div className="mx-auto grid h-[68px] max-w-md grid-cols-5 items-center px-2">
          <TabLink href="/app" label="Home" icon={Home} active={pathname === "/app"} />
          <TabLink href="/app/capsules" label="Capsules" icon={LayoutGrid} active={pathname.startsWith("/app/capsules")} />
          <Link href="/app/gather" aria-label="Gather a memory" className="mx-auto -mt-7 grid size-14 place-items-center rounded-full bg-evergreen text-on-evergreen shadow-[0_12px_28px_-10px_rgb(30_50_40/0.7)] ring-4 ring-paper">
            <Plus className="size-6" />
          </Link>
          <TabLink href="/app/invitations" label="Review" icon={MailOpen} active={pathname.startsWith("/app/invitations")} badge={pending} />
          <RD.Root open={moreOpen} onOpenChange={setMoreOpen}>
            <RD.Trigger asChild>
              <button className="flex flex-col items-center gap-1 text-[0.6875rem] font-medium text-ink-3">
                <MoreHorizontal className="size-5" />
                More
              </button>
            </RD.Trigger>
            <RD.Portal>
              <RD.Overlay className="fixed inset-0 z-[80] bg-black/30" />
              <RD.Content className="fixed inset-x-0 bottom-0 z-[81] rounded-t-[24px] bg-surface p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-lg data-[state=open]:animate-[sheet-up_300ms_var(--ease-out)]">
                <div className="flex items-center justify-between">
                  <RD.Title className="font-serif text-[1.5rem]">Studio</RD.Title>
                  <RD.Description className="sr-only">More studio sections</RD.Description>
                  <RD.Close asChild>
                    <button className="grid size-10 place-items-center rounded-full hover:bg-ivory" aria-label="Close">
                      <X className="size-5" />
                    </button>
                  </RD.Close>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[...primary.slice(3), ...secondary].map((i) => {
                    const Icon = i.icon;
                    return (
                      <Link key={i.href} href={i.href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-2 rounded-[16px] bg-ivory/70 px-2 py-4 text-center text-[0.8125rem] font-medium">
                        <Icon className="size-5 text-evergreen" />
                        {i.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <SaveStatus />
                </div>
              </RD.Content>
            </RD.Portal>
          </RD.Root>
        </div>
      </nav>
    </div>
  );
}

function TabLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean; badge?: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 text-[0.6875rem] font-medium", active ? "text-evergreen" : "text-ink-3")}>
      <Icon className="size-5" />
      {label}
      {badge ? <span className="absolute -top-1 right-[22%] grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-semibold text-white">{badge}</span> : null}
    </Link>
  );
}

function NotOrganizer() {
  const persona = usePersona();
  const own = useOwnPersona();
  const back = useBackToSelf();
  const invitation = useDb((d) => d.invitations.find((i) => i.personId && i.personId === persona.personId && i.role !== "viewer" && !["revoked_demo", "expired_demo", "revoked", "expired"].includes(i.status)));
  const capsuleId = useDb((d) => d.memberships.find((m) => m.personId === persona.personId && m.status === "active" && m.role !== "successor")?.capsuleId) ?? "cap_margaret";
  const first = persona.name.split(" ")[0];
  const target = invitation ? { href: `/contribute/${invitation.token}`, label: `Open ${first}'s invitation` } : { href: `/view/${capsuleId}`, label: "Open the family archive" };
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="eyebrow justify-center">Viewing as {persona.name}</p>
      <h1 className="mt-5 font-serif text-heading">The studio is for organizers.</h1>
      <p className="mt-4 text-lead text-ink-2">
        {persona.name} is a {persona.kind} in this demo, so they wouldn&rsquo;t see organizer tools. Switch back to Sarah, or continue as {persona.name.split(" ")[0]}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={target.href} size="lg">
          {target.label}
        </ButtonLink>
        <Button size="lg" variant="secondary" onClick={() => void back()}>
          Back to {own.name.split(" ")[0]}
        </Button>
        <PersonaSwitcherInline />
      </div>
      <p className="mt-6 text-[0.8125rem] text-ink-3">This gating is a simulation of permissions. Real access control is enforced on the server in a later release.</p>
    </div>
  );
}

function PersonaSwitcherInline() {
  return (
    <div className="rounded-full border border-line-strong px-1">
      <PersonaSwitcher />
    </div>
  );
}

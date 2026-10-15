"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { KeyRound, Laptop, Monitor, Moon, Smartphone, Sun, Trash2 } from "lucide-react";
import type { AccountPreferences } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton, toast } from "@/components/ui/feedback";
import { Field, Input, Segmented, Switch } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useDb, useHydrated } from "@/hooks/use-data";
import { useMediaQuery } from "@/hooks/use-reveal";
import { services } from "@/services/factory";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";
import { removeSampleData } from "@/store/migrate";

export default function SettingsPage() {
  const hydrated = useHydrated();
  return hydrated ? <Settings /> : <Skeleton className="mx-auto h-[70vh] max-w-[980px]" />;
}

function Settings() {
  const account = useDb((d) => d.account);
  const reset = useDemoStore((s) => s.reset);
  const mutate = useDemoStore((s) => s.mutate);
  const sampleCount = useDb((d) => d.capsules.filter((c) => c.isSample).length);
  const [samplesOpen, setSamplesOpen] = React.useState(false);
  const [profile, setProfile] = React.useState({ displayName: account.profile.displayName, givenName: account.profile.givenName, pronouns: account.profile.pronouns ?? "" });
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [eraseOpen, setEraseOpen] = React.useState(false);
  const prefs = account.preferences;
  const profileDirty = profile.displayName !== account.profile.displayName || profile.givenName !== account.profile.givenName || profile.pronouns !== (account.profile.pronouns ?? "");

  const setPref = async (patch: Partial<AccountPreferences>) => {
    await services().account.updatePreferences(patch);
  };

  return (
    <div className="mx-auto max-w-[980px]">
      <PageHeader eyebrow="Account" title="Settings" description={`How ${brand.name} looks and feels for you, and what's kept on this device.`} />

      <div className="space-y-6">
        <Panel title="Profile" description="How you appear on stories you add and invitations you prepare.">
          <form
            className="grid gap-5 sm:grid-cols-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!profile.displayName.trim() || !profile.givenName.trim()) return toast.warning("Your name can't be empty");
              setSavingProfile(true);
              const r = await services().account.updateProfile({ displayName: profile.displayName.trim(), givenName: profile.givenName.trim(), pronouns: profile.pronouns.trim() || undefined });
              setSavingProfile(false);
              if (r.status === "ok") toast.success("Profile saved");
            }}
          >
            <Field label="Full name" htmlFor="p-name">
              <Input id="p-name" value={profile.displayName} maxLength={80} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} autoComplete="name" />
            </Field>
            <Field label="What family calls you" htmlFor="p-given">
              <Input id="p-given" value={profile.givenName} maxLength={40} onChange={(e) => setProfile({ ...profile, givenName: e.target.value })} />
            </Field>
            <Field label="Pronouns" htmlFor="p-pron" optional>
              <Input id="p-pron" value={profile.pronouns} maxLength={30} onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })} placeholder="she/her, they/them…" />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
              <p className="text-[0.875rem] text-ink-3">
                Email <span className="font-mono text-ink-2">{account.user.email}</span> · a fictional address for the demo
              </p>
              <Button type="submit" variant="secondary" loading={savingProfile} disabled={!profileDirty}>
                Save profile
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Appearance" description="Applied instantly and remembered on this device.">
          <div className="space-y-7">
            <fieldset>
              <legend className="text-[0.9375rem] font-medium">Theme</legend>
              <div className="mt-3 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
                {(
                  [
                    { value: "light", label: "Daylight", icon: Sun, swatch: "bg-[#f8f6f1] border-[#dfe2d6]", ink: "bg-[#252421]" },
                    { value: "evening", label: "Evening", icon: Moon, swatch: "bg-[#141a17] border-[#2c3631]", ink: "bg-[#e8e6dc]" },
                    { value: "system", label: "Match device", icon: Monitor, swatch: "bg-[linear-gradient(135deg,#f8f6f1_50%,#141a17_50%)] border-[#cfd3c6]", ink: "bg-[#7a8278]" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={prefs.theme === t.value}
                    onClick={() => void setPref({ theme: t.value })}
                    className={cn("rounded-[14px] border p-3 text-left transition", prefs.theme === t.value ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/30")}
                  >
                    <span className={cn("flex h-16 flex-col justify-end gap-1.5 rounded-[8px] border p-2.5", t.swatch)} aria-hidden>
                      <span className={cn("h-1.5 w-2/3 rounded-full", t.ink)} />
                      <span className={cn("h-1.5 w-1/3 rounded-full opacity-50", t.ink)} />
                    </span>
                    <span className="mt-2.5 flex items-center gap-2 text-[0.9375rem]">
                      <t.icon className="size-4 text-ink-3" /> {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-7 sm:grid-cols-2">
              <div>
                <p className="text-[0.9375rem] font-medium" id="ts-label">
                  Text size
                </p>
                <Segmented
                  label="Text size"
                  className="mt-3"
                  value={prefs.textSize}
                  onChange={(v) => void setPref({ textSize: v })}
                  options={[
                    { value: "standard", label: "Standard" },
                    { value: "large", label: "Larger" },
                  ]}
                />
                <p className="mt-2 text-[0.8125rem] text-ink-3">Larger text suits storytellers reading on a tablet.</p>
              </div>
              <div>
                <p className="text-[0.9375rem] font-medium">Motion</p>
                <Segmented
                  label="Motion"
                  className="mt-3"
                  value={prefs.reducedMotion}
                  onChange={(v) => void setPref({ reducedMotion: v })}
                  options={[
                    { value: "system", label: "Device" },
                    { value: "reduced", label: "Reduced" },
                    { value: "full", label: "Full" },
                  ]}
                />
                <p className="mt-2 text-[0.8125rem] text-ink-3">Reduced turns off page turns, reveals and envelope animations.</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Notifications" description="Your choices are saved, but no email is sent in this preview.">
          <div className="space-y-5">
            <Switch id="n-digest" checked={prefs.weeklyDigestIntent} onCheckedChange={(v) => void setPref({ weeklyDigestIntent: v })} label="A weekly note of new memories" description="One short email on Sundays, never more." />
            <Switch id="n-contrib" checked={prefs.contributionAlertsIntent} onCheckedChange={(v) => void setPref({ contributionAlertsIntent: v })} label="When someone adds a story for review" description="So nothing waits too long for a reply." />
          </div>
        </Panel>

        <Panel title="Sign-in & security">
          <ul className="divide-y divide-line">
            <li className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <span className="flex items-center gap-3">
                <KeyRound className="size-5 text-ink-3" />
                <span>
                  <span className="block font-medium">Two-step verification</span>
                  <span className="text-[0.875rem] text-ink-3">Arrives with real accounts. Passkeys will be the default.</span>
                </span>
              </span>
              <Badge>Not available yet</Badge>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <span className="flex items-center gap-3">
                <DeviceIcon />
                <span>
                  <span className="block font-medium">This browser</span>
                  <span className="text-[0.875rem] text-ink-3">The only place this demo exists. There are no other sessions.</span>
                </span>
              </span>
              <Badge tone="success" dot>
                Current
              </Badge>
            </li>
          </ul>
        </Panel>

        <Panel title="Your data" description="Take it with you, or clear it away.">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <p className="max-w-lg text-[0.9375rem] text-ink-2">Download an open archive of any capsule, stories, photos, recordings and a manifest.</p>
            <Link href="/app/preservation" className="text-[0.9375rem] text-link">
              Export from Preservation
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
            <div className="max-w-lg">
              <p className="font-medium">Remove the sample capsules</p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">
                {sampleCount
                  ? `Hides the ${sampleCount} example capsules about the fictional Ellis family, with their stories and pictures. Your own capsules stay exactly as they are.`
                  : "The sample capsules have been removed. Erasing demo data below brings them back."}
              </p>
            </div>
            <Button variant="secondary" disabled={!sampleCount} onClick={() => setSamplesOpen(true)}>
              Remove samples
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
            <div className="max-w-lg">
              <p className="font-medium">Erase demo data on this device</p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">Removes everything you&rsquo;ve added, stories, recordings, letters, orders, and restores the fictional Ellis family.</p>
            </div>
            <Button variant="destructive" leading={<Trash2 className="size-4" />} onClick={() => setEraseOpen(true)}>
              Erase and start over
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div className="max-w-lg">
              <p className="font-medium">Delete my account</p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">With real accounts, this will schedule deletion with a 30-day window to change your mind, after your archive is offered for download.</p>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await services().account.requestAccountDeletion();
                if (r.status === "not_configured") toast.info("No account to delete yet", r.message);
              }}
            >
              Request deletion
            </Button>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={samplesOpen}
        onOpenChange={setSamplesOpen}
        title="Remove the sample capsules?"
        confirmLabel="Remove samples"
        body="The example capsules and everything in them will be removed from this browser. Anything you created stays. You can bring the samples back by erasing demo data."
        onConfirm={() => {
          let removed = 0;
          mutate(
            (d) => {
              removed = removeSampleData(d).capsules;
            },
            { actor: account.profile.displayName, action: "demo.samples_removed" },
          );
          setSamplesOpen(false);
          toast.success(removed === 1 ? "Removed 1 sample capsule" : `Removed ${removed} sample capsules`, "Your own capsules are untouched.");
        }}
      />
      <ConfirmDialog
        open={eraseOpen}
        onOpenChange={setEraseOpen}
        tone="danger"
        title="Erase everything on this device?"
        confirmLabel="Erase demo data"
        body="Everything you've recorded, written or designed here will be permanently removed from this browser. Download an archive first if you want to keep anything. The sample family will be restored."
        onConfirm={async () => {
          await reset();
          try {
            for (const k of Object.keys(localStorage)) if (k.startsWith("lifeatlas.")) localStorage.removeItem(k);
          } catch {
            // Storage may be blocked; the main data is already cleared.
          }
          setEraseOpen(false);
          toast.success("This device is clean", "The sample family has been restored.");
        }}
      />
    </div>
  );
}

function DeviceIcon() {
  const coarse = useMediaQuery("(pointer: coarse)");
  return coarse ? <Smartphone className="size-5 text-ink-3" /> : <Laptop className="size-5 text-ink-3" />;
}

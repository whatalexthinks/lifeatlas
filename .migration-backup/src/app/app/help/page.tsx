"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Headphones, Lightbulb, Mic, Search, ShieldCheck, Users } from "lucide-react";
import type { SupportRequest } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { DemoNotice, toast } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";

type Article = { q: string; a: React.ReactNode; tags: string };
const sections: { id: string; title: string; icon: React.ComponentType<{ className?: string }>; articles: Article[] }[] = [
  {
    id: "start",
    title: "Getting started",
    icon: Lightbulb,
    articles: [
      { q: "What's the quickest way to begin?", a: <>Open <Link className="text-link" href="/app/gather">Gather a memory</Link>, pick one question, and record or type an answer. One memory is a real beginning.</>, tags: "start begin first memory question" },
      { q: "Does the storyteller need an account?", a: "No. Storytellers answer from a private link or on your device. Only the owner and editors manage the archive.", tags: "account storyteller login password" },
      { q: "Do dates have to be exact?", a: "Not at all. “Around 1965”, “the 1970s” or “the summer we moved” all work, and the timeline handles them gracefully.", tags: "date approximate fuzzy year decade" },
    ],
  },
  {
    id: "record",
    title: "Recording",
    icon: Mic,
    articles: [
      { q: "The microphone won't start", a: "Your browser needs permission. Click the lock or site-settings icon by the address, allow the microphone, then try again. Recording also needs a secure (https) page.", tags: "microphone permission denied record audio not working" },
      { q: "How long can a recording be?", a: "Up to 20 minutes each. Shorter is often better — a story per recording makes the archive easier to explore.", tags: "length long minutes limit" },
      { q: "Can I add an old recording?", a: "Yes — when adding a memory, choose to upload an audio file instead of recording.", tags: "upload audio file existing tape" },
    ],
  },
  {
    id: "family",
    title: "Family & privacy",
    icon: Users,
    articles: [
      { q: "Who can see a memory?", a: <>Each memory is for the family, for people you choose, for the owner and editors, or only for you. Roles decide the rest — see <Link className="text-link" href="/app/family">Family</Link> for the full table.</>, tags: "privacy who see visible private family editors selected people share" },
      { q: "What happens when a relative contributes?", a: <>Their story waits in <Link className="text-link" href="/app/invitations?tab=review">review</Link>. You can approve it, return it with a note, or decline it kindly.</>, tags: "contribute review approve invitation relative" },
      { q: "Are invitations emailed?", a: "Not in this preview. You copy the link and share it however you like.", tags: "invite email send link" },
    ],
  },
  {
    id: "safe",
    title: "Keeping it safe",
    icon: ShieldCheck,
    articles: [
      { q: "Is my archive backed up?", a: <>Not in this preview — it lives in this browser only. Download a copy from <Link className="text-link" href="/app/preservation">Preservation</Link> and keep your original files.</>, tags: "backup safe lost cloud storage" },
      { q: "What's inside an export?", a: "Stories as text and a readable offline page, photos and recordings as they were added, and a manifest listing every file with its fingerprint.", tags: "export download zip archive manifest" },
    ],
  },
  {
    id: "heirlooms",
    title: "Heirlooms & orders",
    icon: BookOpen,
    articles: [
      { q: "Can I order a printed book?", a: <>You can design one, open a page-by-page proof and walk through a demo order. Printing isn&rsquo;t connected, so nothing is made or charged.</>, tags: "book print order heirloom proof" },
      { q: "Why can't I include some stories?", a: "Books only include approved stories whose contributors agreed to printing. Drafts and stories in review appear greyed out.", tags: "book stories missing greyed consent" },
    ],
  },
];

const topics: { value: SupportRequest["topic"]; label: string }[] = [
  { value: "other", label: "Something else" },
  { value: "access", label: "Recording or access" },
  { value: "export", label: "Exports & backups" },
  { value: "privacy", label: "Privacy" },
  { value: "print", label: "Books & heirlooms" },
  { value: "billing", label: "Plans & billing" },
];

export default function HelpPage() {
  const profile = useDb((d) => d.account.profile);
  const user = useDb((d) => d.account.user);
  const [query, setQuery] = React.useState("");
  const [form, setForm] = React.useState({ topic: "other" as SupportRequest["topic"], message: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const term = query.trim().toLowerCase();
  const filtered = sections
    .map((s) => ({ ...s, articles: s.articles.filter((a) => !term || `${a.q} ${a.tags}`.toLowerCase().includes(term)) }))
    .filter((s) => s.articles.length);

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader eyebrow="Help" title="How can we help?" description="Short answers to the questions families ask most." />

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search — “microphone”, “backup”, “book”…" aria-label="Search help" className="h-14 pl-12 text-[1.0625rem]" />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[14px] bg-ivory/60 px-6 py-8 text-center text-ink-2">Nothing matches “{query}”. Try another word, or send us a note below.</p>
      ) : (
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {filtered.map((s) => (
            <section key={s.id} aria-labelledby={`h-${s.id}`}>
              <h2 id={`h-${s.id}`} className="flex items-center gap-2.5 text-[1.0625rem] font-medium">
                <s.icon className="size-5 text-evergreen" /> {s.title}
              </h2>
              <div className="mt-3 divide-y divide-line border-y border-line">
                {s.articles.map((a) => (
                  <details key={a.q} className="group" open={!!term}>
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.9375rem] [&::-webkit-details-marker]:hidden">
                      {a.q}
                      <span className="text-ink-4 transition group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <p className="pb-4 text-[0.9375rem] leading-relaxed text-ink-2">{a.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="Recording tips for storytellers" actions={<Headphones className="size-5 text-ink-3" />}>
          <ul className="space-y-3 text-[0.9375rem] text-ink-2">
            <li>Sit somewhere soft — a sofa or a room with curtains sounds warmer than a kitchen.</li>
            <li>Hold the phone about a hand&rsquo;s width away, a little below the chin.</li>
            <li>Ask one question, then wait. The best part usually comes after a pause.</li>
            <li>Mistakes are welcome. You can always record the story again later.</li>
          </ul>
        </Panel>

        <Panel title="Write to us">
          {sent ? (
            <div aria-live="polite">
              <p className="font-medium">Saved on this device.</p>
              <p className="mt-2 text-[0.9375rem] text-ink-2">
                In the real service, a person would reply to {user.email} within two working days. In this preview nothing is sent — your note appears in the <Link href="/demo/operations#support" className="text-link">operations demo inbox</Link>.
              </p>
              <Button variant="ghost" className="mt-4" onClick={() => setSent(false)}>
                Write another
              </Button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await services().support.create({ name: profile.displayName, email: user.email, topic: form.topic, message: form.message });
                if (r.status === "ok") {
                  setError(null);
                  setForm({ topic: "other", message: "" });
                  setSent(true);
                  toast.success("Message saved · not sent");
                } else setError(r.status === "error" ? r.message : "Couldn't save your message");
              }}
              className="space-y-4"
            >
              <Field label="About" htmlFor="h-topic">
                <Select id="h-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value as SupportRequest["topic"] })}>
                  {topics.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="What's happening?" htmlFor="h-msg" error={error ?? undefined} hint="Please don't include private family stories.">
                <Textarea id="h-msg" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} invalid={!!error} />
              </Field>
              <DemoNotice>Support isn&rsquo;t connected. Your message stays on this device.</DemoNotice>
              <Button type="submit" disabled={form.message.trim().length < 10}>
                Save message
              </Button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { CornerDownRight, Pencil, Send } from "lucide-react";
import type { Invitation, Memory, MemoryStatus } from "@/domain/models";
import type { StatusTone } from "@/components/ui/feedback";
import { Badge, toast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { relativeTime } from "@/lib/utils";

/** The same states the organizer sees, in words written for the person who sent the story. */
function statusFor(status: MemoryStatus, organizer: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "approved":
      return { label: "In the archive", tone: "success" };
    case "under_review":
      return { label: `${organizer} is reading it`, tone: "info" };
    case "returned":
      return { label: "Sent back with a note", tone: "warning" };
    case "declined":
      return { label: "Not added", tone: "neutral" };
    case "draft":
      return { label: "Not sent yet", tone: "neutral" };
    default:
      return { label: `Waiting for ${organizer}`, tone: "warning" };
  }
}

/**
 * Everything this invitation has sent, with where each story stands. A story sent back
 * shows the organizer's note and can be changed and sent again.
 */
export function YourStories({ invitation, organizerName, className }: { invitation: Invitation; organizerName: string; className?: string }) {
  const all = useDb((d) => d.memories);
  const stories = React.useMemo(() => all.filter((m) => m.attribution.invitationId === invitation.id && !m.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [all, invitation.id]);
  const organizer = organizerName.split(" ")[0];
  if (!stories.length) return null;
  const returned = stories.filter((m) => m.status === "returned").length;

  return (
    <section className={className} aria-labelledby="your-stories">
      <h2 id="your-stories" className="font-serif text-[1.9rem] leading-tight">
        Your stories
      </h2>
      <p className="mt-2 text-[1.05rem] text-ink-2">
        {returned ? `${organizer} sent ${returned === 1 ? "one back" : `${returned} back`} with a note. Change what you like and send it again.` : `Here's where each one stands.`}
      </p>
      <ul className="mt-6 space-y-3">
        {stories.map((m) => (
          <Story key={m.id} memory={m} organizer={organizer} />
        ))}
      </ul>
    </section>
  );
}

function Story({ memory: m, organizer }: { memory: Memory; organizer: string }) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(m.title);
  const [narrative, setNarrative] = React.useState(m.narrative);
  const [sending, setSending] = React.useState(false);
  const s = statusFor(m.status, organizer);
  const id = `story-${m.id}`;

  const sendAgain = async () => {
    if (!title.trim()) return toast.error("Give it a title first");
    setSending(true);
    const svc = services().capsules;
    const who = m.attribution.displayName;
    const u = await svc.updateMemory(m.id, { title: title.trim(), narrative: narrative.trim() }, who);
    const t = u.status === "ok" ? await svc.transitionMemory(m.id, "submitted", undefined, who) : u;
    setSending(false);
    if (t.status !== "ok") return toast.error("Couldn't send it again", t.status === "error" ? t.message : undefined);
    setEditing(false);
    toast.success("Sent again", `${organizer} will see your changes next.`);
  };

  return (
    <li className="rounded-[18px] border border-line bg-surface p-5 sm:p-6" aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p id={id} className="font-serif text-[1.3rem] leading-snug">
            {m.title}
          </p>
          <p className="mt-1 text-[0.9375rem] text-ink-3">
            {m.audioId ? "Recording" : "Written"}
            {m.photoIds.length ? ` · ${m.photoIds.length === 1 ? "a photo" : `${m.photoIds.length} photos`}` : ""} · {relativeTime(m.updatedAt)}
          </p>
        </div>
        <Badge tone={s.tone} dot>
          {s.label}
        </Badge>
      </div>
      {m.reviewNote && (m.status === "returned" || m.status === "declined") ? (
        <figure className="mt-4 flex gap-3 rounded-[14px] bg-ivory px-4 py-3">
          <CornerDownRight className="mt-1 size-4 shrink-0 text-brass-ink" aria-hidden />
          <div>
            <blockquote className="font-serif text-[1.1rem] italic leading-snug">&ldquo;{m.reviewNote}&rdquo;</blockquote>
            <figcaption className="mt-1 text-[0.875rem] text-ink-3">, {organizer}</figcaption>
          </div>
        </figure>
      ) : null}
      {m.status === "returned" && !editing ? (
        <Button className="mt-4" variant="secondary" leading={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
          Change and send again
        </Button>
      ) : null}
      {editing ? (
        <form
          className="mt-5 space-y-4 border-t border-line pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendAgain();
          }}
        >
          <Field label="Title" htmlFor={`${id}-title`}>
            <Input id={`${id}-title`} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Your words" htmlFor={`${id}-words`} hint={m.audioId ? "Your recording stays as it is." : undefined}>
            <Textarea id={`${id}-words`} rows={6} value={narrative} onChange={(e) => setNarrative(e.target.value)} className="text-[1.05rem]" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={sending} leading={<Send className="size-4" />}>
              Send it again
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setTitle(m.title);
                setNarrative(m.narrative);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

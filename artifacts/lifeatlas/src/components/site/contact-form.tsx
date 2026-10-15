"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { Check } from "lucide-react";
import type { SupportRequest } from "@/domain/models";
import { contactSchema } from "@/domain/schemas";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { services } from "@/services/factory";

const topics: { value: SupportRequest["topic"]; label: string }[] = [
  { value: "other", label: "Something else" },
  { value: "access", label: "Recording or access" },
  { value: "export", label: "Downloads and keeping things safe" },
  { value: "privacy", label: "Privacy" },
  { value: "print", label: "Books and physical capsules" },
  { value: "billing", label: "Plans and billing" },
];

/**
 * A real form with an honest ending: no support inbox is connected in the preview, so the
 * message is kept on this device and we say exactly that. Nothing claims it was sent.
 */
export function ContactForm() {
  const [form, setForm] = React.useState({ name: "", email: "", topic: "other" as SupportRequest["topic"], message: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const rest = { ...e };
      for (const k of Object.keys(patch)) delete rest[k];
      return rest;
    });
  };

  if (saved)
    return (
      <div className="rounded-[22px] border border-line bg-surface p-7" role="status">
        <Check className="size-6 text-evergreen" aria-hidden />
        <p className="display-3 mt-4 !text-[1.5rem]">Saved on this device, not sent.</p>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">No support inbox is connected in this preview, so nobody will read this yet. In the real service, a person would reply to the address you gave. You can see the message in the operations demo inbox.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSaved(false)}>
            Write another
          </Button>
          <Link href="/demo/operations#support" className="inline-flex min-h-11 items-center px-2 text-[0.9375rem] font-medium underline underline-offset-4">
            Open the demo inbox
          </Link>
        </div>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-5 rounded-[22px] border border-line bg-surface p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = contactSchema.safeParse(form);
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
          setErrors(next);
          document.getElementById(`c-${Object.keys(next)[0]}`)?.focus();
          return;
        }
        setBusy(true);
        const r = await services().support.create(parsed.data);
        setBusy(false);
        if (r.status === "ok") setSaved(true);
        else setErrors({ message: r.status === "error" ? r.message : "Couldn't save your message on this device." });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" error={errors.name}>
          <Input id="c-name" autoComplete="name" value={form.name} onChange={(e) => set({ name: e.target.value })} invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email} hint="Only to reply to you.">
          <Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} invalid={!!errors.email} />
        </Field>
      </div>
      <Field label="About" htmlFor="c-topic">
        <Select id="c-topic" value={form.topic} onChange={(e) => set({ topic: e.target.value as SupportRequest["topic"] })}>
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Your message" htmlFor="c-message" error={errors.message} hint="Please don't include private family stories or anyone else's personal details.">
        <Textarea id="c-message" rows={6} value={form.message} onChange={(e) => set({ message: e.target.value })} invalid={!!errors.message} />
      </Field>
      <p className="text-[0.875rem] text-ink-3">In this preview your message is kept on this device only. It isn&rsquo;t sent to anyone.</p>
      <Button type="submit" size="lg" loading={busy}>
        Save message
      </Button>
    </form>
  );
}

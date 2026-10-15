"use client";

import * as React from "react";
import { Trash2, UserCheck } from "lucide-react";
import type { SuccessorDesignation } from "@/domain/models";
import { Panel } from "@/components/studio/primitives";
import { Button } from "@/components/ui/button";
import { Badge, toast } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";

const scopeLabel: Record<SuccessorDesignation["scope"], string> = {
  both: "Letters and capsule stewardship",
  future_messages: "Letters",
  capsule_stewardship: "Capsule stewardship",
};

type Draft = { name: string; relationship: string; contact: string; scope: SuccessorDesignation["scope"] };
const empty: Draft = { name: "", relationship: "", contact: "", scope: "both" };

/** Designate a trusted person. Nothing is granted, sent or verified in the preview. */
export function SuccessorPanel({ className, defaultScope = "both" }: { className?: string; defaultScope?: SuccessorDesignation["scope"] }) {
  const successors = useDb((d) => d.successors);
  const [draft, setDraft] = React.useState<Draft>({ ...empty, scope: defaultScope });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <Panel title="Your successor" description="A trusted person who could look after these stories if you can't. In this preview, nothing is granted, sent or verified." className={className}>
      {successors.length ? (
        <ul className="mb-6 space-y-2">
          {successors.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-ivory/60 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <UserCheck className="size-5 shrink-0 text-evergreen" />
                <span className="min-w-0">
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-[0.8125rem] text-ink-3">
                    {s.relationship} · {scopeLabel[s.scope]}
                    {s.contact ? ` · ${s.contact}` : ""}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Badge tone="demo">{s.status === "acknowledged_demo" ? "Acknowledged · demo" : "Saved · not contacted"}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${s.name}`}
                  onClick={async () => {
                    const r = await services().preservation.removeSuccessor(s.id);
                    if (r.status === "ok") toast.success(`${s.name} removed`);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_1fr_auto] xl:items-end"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await services().preservation.saveSuccessor({ name: draft.name, relationship: draft.relationship, contact: draft.contact || undefined, scope: draft.scope });
          setBusy(false);
          if (r.status === "ok") {
            setError(null);
            setDraft({ ...empty, scope: defaultScope });
            toast.success("Successor saved on this device", "No message was sent to them.");
          } else setError(r.status === "error" ? r.message : "Couldn't save");
        }}
      >
        <Field label="Name" htmlFor="succ-name">
          <Input id="succ-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Relationship" htmlFor="succ-rel">
          <Input id="succ-rel" value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} placeholder="Brother, friend…" />
        </Field>
        <Field label="Email" htmlFor="succ-contact" optional>
          <Input id="succ-contact" type="email" value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} placeholder="Not contacted in the preview" />
        </Field>
        <Field label="Responsible for" htmlFor="succ-scope">
          <Select id="succ-scope" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value as Draft["scope"] })}>
            <option value="both">Letters and capsules</option>
            <option value="future_messages">Letters only</option>
            <option value="capsule_stewardship">Capsules only</option>
          </Select>
        </Field>
        <Button type="submit" loading={busy} disabled={!draft.name.trim() || !draft.relationship.trim()}>
          Save
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-[0.875rem] text-danger">
          {error}
        </p>
      ) : null}
    </Panel>
  );
}

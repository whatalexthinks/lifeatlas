"use client";

import * as React from "react";
import { CalendarHeart, Plus, Trash2 } from "lucide-react";
import type { KeyDate } from "@/domain/models";
import { keyDateSchema } from "@/domain/schemas";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { uid } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KINDS: { value: KeyDate["kind"]; label: string }[] = [
  { value: "anniversary", label: "Anniversary" },
  { value: "birthday", label: "Birthday" },
  { value: "remembrance", label: "Remembrance" },
  { value: "milestone", label: "One-time milestone" },
];

/** Problems with each date, keyed by its id then field. Empty when everything is valid. */
export function keyDateErrors(dates: KeyDate[]) {
  const out: Record<string, Record<string, string>> = {};
  for (const d of dates) {
    const r = keyDateSchema.safeParse(d);
    if (r.success) continue;
    out[d.id] = {};
    for (const i of r.error.issues) out[d.id][String(i.path[0])] ??= i.message;
  }
  return out;
}

/**
 * Anniversaries, birthdays and days of remembrance. The year can stay empty: it's better to
 * leave it out than to guess, and without it we simply don't count the years.
 */
export function KeyDatesEditor({ value, onChange, errors = {} }: { value: KeyDate[]; onChange: (next: KeyDate[]) => void; errors?: Record<string, Record<string, string>> }) {
  const update = (id: string, patch: Partial<KeyDate>) => onChange(value.map((d) => (d.id === id ? { ...d, ...patch, recurring: (patch.kind ?? d.kind) !== "milestone" } : d)));
  const add = () => onChange([...value, { id: uid("kd"), label: "", kind: "anniversary", month: 0 as unknown as number, day: 0 as unknown as number, recurring: true }]);
  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <p className="flex items-center gap-3 rounded-[14px] bg-ivory px-4 py-3 text-[0.9375rem] text-ink-2">
          <CalendarHeart className="size-5 shrink-0 text-ink-3" aria-hidden />
          No dates yet. Add an anniversary or a birthday and it will appear on your home page as it comes round.
        </p>
      ) : null}
      {value.map((d, i) => {
        const e = errors[d.id] ?? {};
        const n = i + 1;
        return (
          <fieldset key={d.id} className="rounded-[16px] border border-line bg-surface/70 p-4">
            <legend className="sr-only">Date {n}</legend>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <label htmlFor={`kd-label-${d.id}`} className="text-[0.875rem] font-medium">
                  Name
                </label>
                <Input id={`kd-label-${d.id}`} value={d.label} onChange={(ev) => update(d.id, { label: ev.target.value })} placeholder="e.g. Our wedding anniversary" invalid={!!e.label} className="mt-1" />
                {e.label ? <p className="mt-1 text-[0.875rem] font-medium text-danger">{e.label}</p> : null}
              </div>
              <div>
                <label htmlFor={`kd-kind-${d.id}`} className="text-[0.875rem] font-medium">
                  Kind
                </label>
                <Select id={`kd-kind-${d.id}`} value={d.kind} onChange={(ev) => update(d.id, { kind: ev.target.value as KeyDate["kind"] })} className="mt-1">
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] items-end gap-3">
              <div>
                <label htmlFor={`kd-month-${d.id}`} className="text-[0.875rem] font-medium">
                  Month
                </label>
                <Select id={`kd-month-${d.id}`} value={d.month || ""} onChange={(ev) => update(d.id, { month: Number(ev.target.value) })} invalid={!!e.month} className="mt-1">
                  <option value="">Choose…</option>
                  {MONTHS.map((m, mi) => (
                    <option key={m} value={mi + 1}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor={`kd-day-${d.id}`} className="text-[0.875rem] font-medium">
                  Day
                </label>
                <Input id={`kd-day-${d.id}`} type="number" inputMode="numeric" min={1} max={31} value={d.day || ""} onChange={(ev) => update(d.id, { day: Number(ev.target.value) })} invalid={!!e.day} className="mt-1" />
              </div>
              <div>
                <label htmlFor={`kd-year-${d.id}`} className="text-[0.875rem] font-medium">
                  Year <span className="font-normal text-ink-3">{d.kind === "milestone" ? "" : "(if known)"}</span>
                </label>
                <Input id={`kd-year-${d.id}`} type="number" inputMode="numeric" value={d.year ?? ""} onChange={(ev) => update(d.id, { year: ev.target.value ? Number(ev.target.value) : undefined })} invalid={!!e.year} className="mt-1" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((x) => x.id !== d.id))} aria-label={`Remove ${d.label || `date ${n}`}`} className="mb-0.5">
                <Trash2 className="size-4" />
              </Button>
            </div>
            {e.month || e.day || e.year ? <p className="mt-2 text-[0.875rem] font-medium text-danger">{e.month ?? e.day ?? e.year}</p> : null}
          </fieldset>
        );
      })}
      <Button variant="secondary" size="sm" onClick={add} leading={<Plus className="size-4" />}>
        Add a date
      </Button>
    </div>
  );
}

"use client";

import * as React from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import type { DatePrecision, FuzzyDate, LifeStage, Place } from "@/domain/models";
import { Input, Select } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { formatFuzzyDate, lifeStageLabels, MONTHS } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { services } from "@/services/factory";
import type { GeocodeResult } from "@/services/contracts";

const precisionOptions: { value: DatePrecision; label: string }[] = [
  { value: "unknown", label: "Not sure" },
  { value: "life_stage", label: "A time of life" },
  { value: "decade", label: "A decade" },
  { value: "circa", label: "Around a year" },
  { value: "year", label: "A year" },
  { value: "season", label: "A season" },
  { value: "month", label: "A month" },
  { value: "day", label: "An exact day" },
];

const CURRENT = new Date().getFullYear();

/** Date input that welcomes uncertainty. */
export function FuzzyDateInput({ id, value, onChange }: { id: string; value: FuzzyDate; onChange: (v: FuzzyDate) => void }) {
  const set = (patch: Partial<FuzzyDate>) => onChange({ ...value, ...patch });
  const needsYear = ["circa", "year", "season", "month", "day"].includes(value.precision);
  const decades = React.useMemo(() => {
    const out: number[] = [];
    for (let d = Math.floor(CURRENT / 10) * 10; d >= 1900; d -= 10) out.push(d);
    return out;
  }, []);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="How sure are you about when this happened?">
        {precisionOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value.precision === o.value}
            onClick={() => set({ precision: o.value })}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[0.8125rem] font-medium transition-colors",
              value.precision === o.value ? "border-evergreen bg-evergreen text-[#f8f6f1]" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {value.precision === "decade" ? (
          <Select id={`${id}-decade`} aria-label="Decade" value={value.decade ?? ""} onChange={(e) => set({ decade: e.target.value ? Number(e.target.value) : undefined })} className="w-40">
            <option value="">Choose…</option>
            {decades.map((d) => (
              <option key={d} value={d}>
                The {d}s
              </option>
            ))}
          </Select>
        ) : null}
        {value.precision === "life_stage" ? (
          <Select id={`${id}-stage`} aria-label="Time of life" value={value.lifeStage ?? ""} onChange={(e) => set({ lifeStage: (e.target.value || undefined) as LifeStage | undefined })} className="w-60">
            <option value="">Choose…</option>
            {Object.entries(lifeStageLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        ) : null}
        {value.precision === "season" ? (
          <Select id={`${id}-season`} aria-label="Season" value={value.season ?? ""} onChange={(e) => set({ season: (e.target.value || undefined) as FuzzyDate["season"] })} className="w-36">
            <option value="">Season…</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="autumn">Autumn</option>
            <option value="winter">Winter</option>
          </Select>
        ) : null}
        {value.precision === "day" || value.precision === "month" ? (
          <Select id={`${id}-month`} aria-label="Month" value={value.month ?? ""} onChange={(e) => set({ month: e.target.value ? Number(e.target.value) : undefined })} className="w-40">
            <option value="">Month…</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        ) : null}
        {value.precision === "day" ? (
          <Input id={`${id}-day`} aria-label="Day" type="number" inputMode="numeric" min={1} max={31} placeholder="Day" value={value.day ?? ""} onChange={(e) => set({ day: e.target.value ? Number(e.target.value) : undefined })} className="w-24" />
        ) : null}
        {needsYear ? (
          <Input
            id={`${id}-year`}
            aria-label="Year"
            type="number"
            inputMode="numeric"
            min={1850}
            max={CURRENT}
            placeholder="Year"
            value={value.year ?? ""}
            onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined })}
            className="w-28"
          />
        ) : null}
      </div>
      <p className="text-[0.8125rem] text-ink-3" aria-live="polite">
        Will appear as: <span className="font-medium text-ink-2">{formatFuzzyDate(value)}</span>
      </p>
    </div>
  );
}

/** City-level place picker. Uses existing capsule places + a built-in city list. */
export function PlacePicker({ id, value, onChange, capsuleId }: { id: string; value?: string; onChange: (placeId: string | undefined) => void; capsuleId?: string }) {
  const places = useDb((d) => d.places);
  const memories = useDb((d) => d.memories);
  const selected = places.find((p) => p.id === value);
  const [q, setQ] = React.useState("");
  // Results remember the query they answer, so stale and loading states are derived, not synced.
  const [found, setFound] = React.useState<{ q: string; results: GeocodeResult[] }>({ q: "", results: [] });
  const term = q.trim();
  const searching = term.length >= 2;
  const results = searching && found.q === term ? found.results : [];
  const loading = searching && found.q !== term;
  const used = React.useMemo(() => {
    const ids = new Set(memories.filter((m) => !capsuleId || m.capsuleId === capsuleId).map((m) => m.placeId).filter(Boolean));
    return places.filter((p) => ids.has(p.id));
  }, [places, memories, capsuleId]);

  React.useEffect(() => {
    if (term.length < 2) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await services().geocoding.search(term);
      if (alive) setFound({ q: term, results: r.status === "ok" ? r.data.results : [] });
    }, 160);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [term]);

  const choose = async (g: GeocodeResult) => {
    const r = await services().capsules.addPlace({
      name: g.name,
      locality: g.locality,
      region: g.region,
      country: g.country,
      countryCode: g.countryCode,
      point: { lat: g.lat, lng: g.lng },
      precision: "city",
      visibility: "family",
      source: "manual",
    });
    if (r.status === "ok") onChange(r.data.id);
    setQ("");
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line-strong bg-surface px-4 py-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <MapPin className="size-4 shrink-0 text-terracotta" />
          <span className="truncate font-medium">{selected.name}</span>
          <span className="hidden text-[0.8125rem] text-ink-3 sm:inline">· {selected.precision === "landmark" ? "Landmark" : "City-level"}</span>
        </span>
        <button type="button" onClick={() => onChange(undefined)} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-ivory hover:text-ink" aria-label="Remove place">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const localMatches = q.trim().length >= 1 ? places.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4) : used.slice(0, 6);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
        <Input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="A town or city — e.g. Portland" className="pl-10" autoComplete="off" />
        {loading ? <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-4" /> : null}
      </div>
      {localMatches.length ? (
        <div>
          <p className="mb-1.5 text-[0.75rem] font-medium uppercase tracking-[0.1em] text-ink-4">{q ? "In this archive" : "Places already in this archive"}</p>
          <div className="flex flex-wrap gap-1.5">
            {localMatches.map((p: Place) => (
              <button key={p.id} type="button" onClick={() => onChange(p.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] hover:border-evergreen">
                <MapPin className="size-3.5 text-terracotta" /> {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {results.length ? (
        <ul className="overflow-hidden rounded-[12px] border border-line bg-surface" role="listbox" aria-label="Matching cities">
          {results.map((g) => (
            <li key={`${g.name}-${g.lat}`}>
              <button type="button" onClick={() => void choose(g)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-ivory">
                <span>{g.name}</span>
                <span className="text-[0.8125rem] text-ink-3">{g.country}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : q.trim().length >= 2 && !loading ? (
        <p className="text-[0.8125rem] text-ink-3">No match in the built-in list. Try a nearby larger city — you can add a nickname later.</p>
      ) : null}
      <p className="text-[0.75rem] text-ink-4">Searching a small built-in list of cities in this preview — not a live map search. Only city-level locations are stored; never a street address.</p>
    </div>
  );
}

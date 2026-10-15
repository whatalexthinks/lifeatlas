"use client";

import * as React from "react";
import { Globe2, Minus, Plus, Route } from "lucide-react";
import { geoGraticule10 } from "d3-geo";
import { cn } from "@/lib/utils";
import { clusterPoints, inView, loadGeoLayers, makeProjection, pathFor, type GeoLayers, type MapView } from "./geo";

export interface MapPoint {
  id: string; // place id
  label: string;
  lat: number;
  lng: number;
  count: number;
  firstYear?: number | null;
}

/**
 * The OurLifeCapsule memory map. Offline vector cartography (Natural Earth / US
 * Census boundaries bundled with the app), no API key, no remote tiles.
 * Markers are real buttons layered over the SVG for accessibility.
 */
export function MemoryMap({
  points,
  activeId,
  onSelect,
  view: viewProp,
  onViewChange,
  journey,
  showJourney = false,
  tone = "paper",
  className,
  aspect = 1.45,
  controls = true,
  label = "Map of meaningful places",
}: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  view?: MapView;
  onViewChange?: (v: MapView) => void;
  /** Ordered place ids for "journey through a life". */
  journey?: string[];
  showJourney?: boolean;
  tone?: "paper" | "night";
  className?: string;
  aspect?: number;
  controls?: boolean;
  label?: string;
}) {
  const [layers, setLayers] = React.useState<GeoLayers | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [innerView, setInnerView] = React.useState<MapView>(viewProp ?? "northeast");
  const view = viewProp ?? innerView;
  const setView = (v: MapView) => {
    setInnerView(v);
    onViewChange?.(v);
  };
  const W = 1000;
  const H = Math.round(W / aspect);

  React.useEffect(() => {
    let alive = true;
    loadGeoLayers()
      .then((l) => alive && setLayers(l))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const projection = React.useMemo(() => makeProjection(view, W, H, view === "world" ? 10 : 30), [view, H]);
  const path = React.useMemo(() => pathFor(projection), [projection]);
  const graticule = React.useMemo(() => path(geoGraticule10()) ?? "", [path]);

  const projected = React.useMemo(
    () =>
      points
        .filter((p) => inView(view, p.lat, p.lng))
        .map((p) => {
          const xy = projection([p.lng, p.lat]) ?? [0, 0];
          return { ...p, x: xy[0], y: xy[1], weight: Math.max(1, p.count) };
        }),
    [points, projection, view],
  );
  // Markers are ~28–36px on screen whatever the map's size, so cluster anything closer than
  // ~40px as rendered, otherwise neighbours overlap and become hard to tap.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [renderedWidth, setRenderedWidth] = React.useState(W);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setRenderedWidth(Math.max(1, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const minRadius = (40 * W) / renderedWidth;
  const clusters = React.useMemo(() => clusterPoints(projected, Math.max(view === "world" ? 34 : 26, minRadius)), [projected, view, minRadius]);
  const offscreen = points.filter((p) => !inView(view, p.lat, p.lng));

  const journeyPath = React.useMemo(() => {
    if (!journey?.length) return "";
    const pts = journey
      .map((id) => points.find((p) => p.id === id))
      .filter((p): p is MapPoint => !!p && inView(view, p.lat, p.lng))
      .map((p) => projection([p.lng, p.lat]) ?? [0, 0]);
    if (pts.length < 2) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.18;
      d += ` Q${mx},${my} ${x1},${y1}`;
    }
    return d;
  }, [journey, points, projection, view]);

  const night = tone === "night";
  const colors = night
    ? { sea: "#121815", land: "#2a342f", landFocus: "#34403a", border: "#4d5a52", grat: "#1c2420", ink: "#f1ede6" }
    : { sea: "var(--mat)", land: "var(--linen)", landFocus: "color-mix(in srgb, var(--linen) 70%, var(--sage))", border: "var(--line-strong)", grat: "color-mix(in srgb, var(--line) 70%, transparent)", ink: "var(--ink)" };

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden rounded-[inherit]", className)} style={{ aspectRatio: `${aspect}` }} role="group" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        <rect width={W} height={H} fill={colors.sea} />
        <path d={graticule} fill="none" stroke={colors.grat} strokeWidth={0.8} />
        {layers ? (
          <g>
            {layers.countries.features.map((f, i) => (
              <path key={i} d={path(f) ?? ""} fill={colors.land} />
            ))}
            {view !== "world" ? layers.states.features.map((f, i) => <path key={`s${i}`} d={path(f) ?? ""} fill={colors.landFocus} />) : null}
            <path d={path(layers.countryBorders) ?? ""} fill="none" stroke={colors.border} strokeWidth={0.7} />
            {view !== "world" ? <path d={path(layers.stateBorders) ?? ""} fill="none" stroke={colors.border} strokeWidth={0.7} strokeDasharray="3 3" /> : null}
          </g>
        ) : null}
        {showJourney && journeyPath ? (
          <path d={journeyPath} fill="none" stroke={night ? "#d7bc92" : "var(--brass)"} strokeWidth={2} strokeDasharray="6 6" strokeLinecap="round" opacity={0.9} />
        ) : null}
      </svg>

      {!layers && !failed ? <div className="absolute inset-x-0 bottom-3 text-center catalog">Drawing the map…</div> : null}

      {clusters.map((c) => {
        const single = c.members.length === 1;
        const p = c.members[0];
        const total = c.members.reduce((s, m) => s + m.count, 0);
        const active = c.members.some((m) => m.id === activeId);
        const name = single ? p.label : `${c.members.length} places near ${p.label}`;
        return (
          <button
            key={c.members.map((m) => m.id).join("+")}
            type="button"
            onClick={() => {
              if (!single && view === "world" && c.members.every((m) => inView("northeast", m.lat, m.lng))) setView("northeast");
              else onSelect?.(p.id);
            }}
            aria-pressed={active}
            aria-label={`${name}: ${total} ${total === 1 ? "memory" : "memories"}`}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-[marker-pop_420ms_var(--ease-out)_both] rounded-full"
            style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%` }}
          >
            {active ? <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-terracotta/25" aria-hidden /> : null}
            <span
              className={cn(
                "relative grid place-items-center rounded-full border-2 font-mono text-[11px] font-medium tabular-nums shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-[transform,background-color] duration-200 group-hover:scale-110",
                active ? "size-9 border-[#fbf7ee] bg-terracotta text-white" : single ? "size-7 border-[#fbf7ee] bg-evergreen text-on-evergreen" : "size-9 border-[#fbf7ee] bg-ink text-[#f8f6f1]",
                night && !active && "bg-[#d7bc92] text-[#1b1a18] border-[#1b1a18]",
              )}
            >
              {single ? p.count : c.members.length}
            </span>
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm transition-opacity",
                night ? "bg-black/60 text-[#f1ede6]" : "bg-surface/95 text-ink",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              {single ? p.label.split(",")[0] : `${c.members.length} places`}
            </span>
          </button>
        );
      })}

      {controls ? (
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
          <MapControl label="Zoom to the Northeast" onClick={() => setView("northeast")} active={view === "northeast"}>
            <Plus className="size-4" />
          </MapControl>
          <MapControl label="Show the whole world" onClick={() => setView("world")} active={view === "world"}>
            {view === "world" ? <Globe2 className="size-4" /> : <Minus className="size-4" />}
          </MapControl>
        </div>
      ) : null}

      {offscreen.length && view !== "world" ? (
        <button
          type="button"
          onClick={() => setView("world")}
          className={cn("absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium shadow-sm", night ? "bg-black/50 text-[#f1ede6]" : "bg-surface/95 text-ink-2 hover:text-ink")}
        >
          <Route className="size-3.5" />
          {offscreen.length} more {offscreen.length === 1 ? "place" : "places"} further away
        </button>
      ) : null}
      <span className={cn("pointer-events-none absolute bottom-2 right-3 z-20 text-[10px]", night ? "text-[#c4bdb1]" : "text-ink-4")}>
        {failed ? "Map outlines unavailable, places still listed" : "Natural Earth · US Census"}
      </span>
    </div>
  );
}

function MapControl({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("grid size-9 place-items-center rounded-full bg-surface/95 text-ink-2 shadow-sm ring-1 ring-line transition-colors hover:text-ink", active && "bg-evergreen text-on-evergreen ring-evergreen")}
    >
      {children}
    </button>
  );
}

import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

export type MapView = "world" | "northeast";

/** Bounding boxes for preset regional views [west, south, east, north]. */
export const VIEW_BOUNDS: Record<Exclude<MapView, "world">, [number, number, number, number]> = {
  northeast: [-75.6, 40.2, -66.4, 47.6],
};

export function makeProjection(view: MapView, width: number, height: number, pad = 24): GeoProjection {
  if (view === "world") {
    return geoNaturalEarth1().fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      { type: "Sphere" },
    );
  }
  const [w, s, e, n] = VIEW_BOUNDS[view];
  return geoMercator().fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    {
      type: "Feature",
      properties: {},
      geometry: { type: "MultiPoint", coordinates: [[w, s], [e, n], [w, n], [e, s]] },
    },
  );
}

export function inView(view: MapView, lat: number, lng: number) {
  if (view === "world") return true;
  const [w, s, e, n] = VIEW_BOUNDS[view];
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

/** Choose the most useful default view for a set of points. */
export function bestView(points: { lat: number; lng: number }[]): MapView {
  if (!points.length) return "northeast";
  const inside = points.filter((p) => inView("northeast", p.lat, p.lng)).length;
  return inside === points.length ? "northeast" : "world";
}

export interface ClusterInput {
  id: string;
  x: number;
  y: number;
  weight: number;
}

/** Greedy screen-space clustering so markers never pile up. */
export function clusterPoints<T extends ClusterInput>(points: T[], radius: number) {
  const sorted = [...points].sort((a, b) => b.weight - a.weight);
  const clusters: { x: number; y: number; members: T[] }[] = [];
  for (const p of sorted) {
    const c = clusters.find((k) => Math.hypot(k.x - p.x, k.y - p.y) < radius);
    if (c) {
      c.members.push(p);
      const total = c.members.reduce((s, m) => s + m.weight, 0);
      c.x = c.members.reduce((s, m) => s + m.x * m.weight, 0) / total;
      c.y = c.members.reduce((s, m) => s + m.y * m.weight, 0) / total;
    } else clusters.push({ x: p.x, y: p.y, members: [p] });
  }
  return clusters;
}

export interface GeoLayers {
  countries: FeatureCollection<Geometry>;
  countryBorders: Geometry;
  states: FeatureCollection<Geometry>;
  stateBorders: Geometry;
}

let layersPromise: Promise<GeoLayers> | null = null;

/** Lazy-load public-domain Natural Earth / US Census boundaries (bundled, no network API). */
export function loadGeoLayers(): Promise<GeoLayers> {
  layersPromise ??= Promise.all([import("world-atlas/countries-110m.json"), import("us-atlas/states-10m.json")]).then(([w, u]) => {
    const world = (w.default ?? w) as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>;
    const us = (u.default ?? u) as unknown as Topology<{ states: GeometryCollection; nation: GeometryCollection }>;
    return {
      countries: feature(world, world.objects.countries) as unknown as FeatureCollection<Geometry>,
      countryBorders: mesh(world, world.objects.countries, (a, b) => a !== b) as unknown as Geometry,
      states: feature(us, us.objects.states) as unknown as FeatureCollection<Geometry>,
      stateBorders: mesh(us, us.objects.states, (a, b) => a !== b) as unknown as Geometry,
    };
  });
  return layersPromise;
}

export function pathFor(projection: GeoProjection) {
  return geoPath(projection);
}

/** Round coordinates for display according to location precision, never exact addresses. */
export function displayCoords(lat: number, lng: number, precision: "landmark" | "city" | "region" | "country") {
  const digits = precision === "landmark" ? 2 : precision === "city" ? 1 : 0;
  const f = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(digits)}°${v >= 0 ? pos : neg}`;
  return `${f(lat, "N", "S")} ${f(lng, "E", "W")}`;
}

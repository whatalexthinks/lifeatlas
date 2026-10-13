import { makePalette, toneFinish, type Tone } from "./palette";
import { scenes, type Ctx } from "./scenes";

/**
 * Illustrated sample plates — original artworks generated deterministically
 * from a scene, a film tone and a seed. They are never presented as photographs.
 */

export interface PlateSpec {
  scene: keyof typeof scenes;
  tone: Tone;
  seed: number;
  aspect: "landscape" | "portrait";
  /** Optional ground colour override for portraits. */
  ground?: string;
}

export const plates: Record<string, PlateSpec> = {
  "kitchen-1947": { scene: "kitchen", tone: "silver", seed: 11, aspect: "landscape" },
  "breadboard-1947": { scene: "breadboard", tone: "silver", seed: 12, aspect: "portrait" },
  "harbor-1952": { scene: "harbor", tone: "silver", seed: 21, aspect: "landscape" },
  "lighthouse-1950s": { scene: "lighthouse", tone: "silver", seed: 31, aspect: "portrait" },
  "station-1958": { scene: "station", tone: "sepia", seed: 41, aspect: "landscape" },
  "letter-1958": { scene: "letter", tone: "sepia", seed: 42, aspect: "portrait" },
  "window-1961": { scene: "window", tone: "kodachrome", seed: 51, aspect: "portrait" },
  "cafe-1963": { scene: "cafe", tone: "kodachrome", seed: 61, aspect: "landscape" },
  "umbrella-1965": { scene: "umbrella", tone: "kodachrome", seed: 71, aspect: "portrait" },
  "nursery-1968": { scene: "nursery", tone: "kodachrome", seed: 81, aspect: "portrait" },
  "shells-1972": { scene: "shells", tone: "kodachrome", seed: 91, aspect: "landscape" },
  "gallery-1976": { scene: "gallery", tone: "kodachrome", seed: 101, aspect: "portrait" },
  "house-1979": { scene: "house", tone: "kodachrome", seed: 111, aspect: "landscape" },
  "road-1983": { scene: "road", tone: "faded", seed: 121, aspect: "landscape" },
  "cliffs-1983": { scene: "cliffs", tone: "faded", seed: 122, aspect: "landscape" },
  "kiln-1986": { scene: "kiln", tone: "faded", seed: 131, aspect: "landscape" },
  "bookshop-1989": { scene: "bookshop", tone: "faded", seed: 141, aspect: "portrait" },
  "garden-1992": { scene: "garden", tone: "faded", seed: 151, aspect: "landscape" },
  "lemons-1998": { scene: "lemons", tone: "modern", seed: 161, aspect: "portrait" },
  "rooftops-1998": { scene: "rooftops", tone: "modern", seed: 162, aspect: "landscape" },
  "blanket-2005": { scene: "blanket", tone: "modern", seed: 171, aspect: "landscape" },
  "workshop-2013": { scene: "workshop", tone: "modern", seed: 181, aspect: "landscape" },
  "pancakes-2016": { scene: "pancakes", tone: "modern", seed: 191, aspect: "portrait" },
  "bluebowl-2022": { scene: "bluebowl", tone: "modern", seed: 201, aspect: "portrait" },
  "porch-2024": { scene: "porch", tone: "modern", seed: 211, aspect: "landscape" },
  "radio-1949": { scene: "radio", tone: "silver", seed: 221, aspect: "landscape" },
  "classroom-1966": { scene: "classroom", tone: "kodachrome", seed: 231, aspect: "landscape" },
  "canoe-1979": { scene: "canoe", tone: "kodachrome", seed: 241, aspect: "landscape" },
  "rocker-1985": { scene: "rocker", tone: "faded", seed: 251, aspect: "portrait" },
  "backyard-2010": { scene: "backyard", tone: "modern", seed: 261, aspect: "landscape" },
  "dock-2012": { scene: "dock", tone: "modern", seed: 271, aspect: "landscape" },
  "nightlight-2005": { scene: "nightlight", tone: "modern", seed: 281, aspect: "portrait" },
  "portrait-margaret": { scene: "portrait", tone: "modern", seed: 3005, aspect: "portrait" },
  "portrait-thomas": { scene: "portrait", tone: "modern", seed: 3000, aspect: "portrait" },
  "portrait-sarah": { scene: "portrait", tone: "modern", seed: 3002, aspect: "portrait" },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string>();

export function plateSize(spec: PlateSpec) {
  return spec.aspect === "portrait" ? { W: 900, H: 1125 } : { W: 1200, H: 900 };
}

export function renderPlateSvg(id: string): string | null {
  const cached = cache.get(id);
  if (cached) return cached;
  const spec = plates[id];
  if (!spec) return null;
  const { W, H } = plateSize(spec);
  const P = makePalette(spec.tone);
  const ctx: Ctx = { P, r: mulberry32(spec.seed), W, H, defs: [], n: 0 };
  // Portrait plates choose their silhouette variant from the seed.
  const body = scenes[spec.scene](ctx);
  const fin = toneFinish[spec.tone];
  const soften = fin.soften > 0 ? `<filter id="soft"><feGaussianBlur stdDeviation="${fin.soften}"/></filter>` : "";
  const leak = fin.leak > 0 ? `<radialGradient id="leak" cx="0.95" cy="0.05" r="0.7"><stop offset="0" stop-color="#ff9a52" stop-opacity="${fin.leak}"/><stop offset="1" stop-color="#ff9a52" stop-opacity="0"/></radialGradient>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><defs>${ctx.defs.join("")}${soften}${leak}<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${spec.seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.5"/></filter><radialGradient id="vig" cx="0.5" cy="0.48" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${fin.vignette}"/></radialGradient><clipPath id="frame"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#frame)"><g${fin.soften > 0 ? ' filter="url(#soft)"' : ""}>${body}</g>${fin.leak > 0 ? `<rect width="${W}" height="${H}" fill="url(#leak)"/>` : ""}<rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity="${fin.grain}" style="mix-blend-mode:overlay"/></g></svg>`;
  cache.set(id, svg);
  return svg;
}

export function plateDataUri(id: string): string | null {
  const svg = renderPlateSvg(id);
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null;
}

export function plateAspect(id: string): number {
  const spec = plates[id];
  if (!spec) return 4 / 3;
  const { W, H } = plateSize(spec);
  return W / H;
}

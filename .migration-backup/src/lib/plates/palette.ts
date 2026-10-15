/**
 * Film-tone colour science for illustrated plates.
 * Every scene paints with a semantic palette; the tone transform then renders it
 * as silver gelatin, sepia, Kodachrome, faded 80s colour or modern muted colour.
 */

export type Tone = "silver" | "sepia" | "kodachrome" | "faded" | "modern";

type RGB = [number, number, number];

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB) {
  return `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("")}`;
}

function saturate([r, g, b]: RGB, amount: number): RGB {
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  return [l + (r - l) * amount, l + (g - l) * amount, l + (b - l) * amount];
}

function lift([r, g, b]: RGB, black: number, white: number): RGB {
  const k = (white - black) / 255;
  return [black + r * k, black + g * k, black + b * k];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const SEPIA_DARK: RGB = [44, 32, 24];
const SEPIA_LIGHT: RGB = [240, 226, 200];
const SILVER_DARK: RGB = [26, 27, 28];
const SILVER_LIGHT: RGB = [236, 234, 228];

export function toneColor(hex: string, tone: Tone): string {
  const c = hexToRgb(hex);
  const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  switch (tone) {
    case "silver": {
      const t = Math.pow(lum, 0.92);
      return rgbToHex(mix(SILVER_DARK, SILVER_LIGHT, t));
    }
    case "sepia": {
      const t = Math.pow(lum, 0.9);
      return rgbToHex(mix(SEPIA_DARK, SEPIA_LIGHT, t));
    }
    case "kodachrome": {
      let v = saturate(c, 1.08);
      v = [v[0] * 1.05 + 4, v[1] * 0.99, v[2] * 0.88];
      v = lift(v, 20, 246);
      return rgbToHex(v);
    }
    case "faded": {
      let v = saturate(c, 0.66);
      v = [v[0] + 8, v[1] + 3, v[2] - 4];
      v = lift(v, 42, 238);
      return rgbToHex(v);
    }
    case "modern":
    default: {
      let v = saturate(c, 0.86);
      v = lift(v, 16, 248);
      return rgbToHex(v);
    }
  }
}

/** Semantic palette painted by every scene. */
export const basePalette = {
  sky: "#a9c6d6",
  skyHigh: "#7fa3bd",
  skyWarm: "#f2c79a",
  dusk: "#e48f6a",
  night: "#1d2a3c",
  sea: "#5e8aa0",
  seaDeep: "#2f5770",
  sand: "#e3cfa6",
  land: "#7d8f63",
  landDark: "#4b5a3c",
  green: "#6f8a55",
  greenDark: "#3b4f33",
  stone: "#9a968c",
  rock: "#5b5852",
  wall: "#efe6d2",
  wallShade: "#d6cab0",
  plaster: "#f6f1e6",
  wood: "#a8744a",
  woodLight: "#c9986a",
  woodDark: "#6e4a2f",
  brick: "#a65a43",
  terracotta: "#c46a45",
  red: "#c0392b",
  blue: "#2f6fa3",
  glaze: "#3d7fb0",
  yellow: "#e8c547",
  cream: "#f6eedd",
  paper: "#fbf7ee",
  ink: "#24282b",
  shadow: "#2c2a28",
  metal: "#7b8288",
  light: "#fff3d6",
  fog: "#e9ecea",
} as const;

export type PaletteKey = keyof typeof basePalette;
export type Palette = Record<PaletteKey, string> & { c: (hex: string) => string };

export function makePalette(tone: Tone): Palette {
  const out = {} as Record<PaletteKey, string>;
  for (const k of Object.keys(basePalette) as PaletteKey[]) out[k] = toneColor(basePalette[k], tone);
  return Object.assign(out, { c: (hex: string) => toneColor(hex, tone) });
}

export const toneFinish: Record<Tone, { grain: number; vignette: number; leak: number; soften: number }> = {
  silver: { grain: 0.26, vignette: 0.42, leak: 0, soften: 0.55 },
  sepia: { grain: 0.24, vignette: 0.45, leak: 0, soften: 0.5 },
  kodachrome: { grain: 0.17, vignette: 0.32, leak: 0.2, soften: 0.3 },
  faded: { grain: 0.15, vignette: 0.26, leak: 0.16, soften: 0.25 },
  modern: { grain: 0.09, vignette: 0.18, leak: 0, soften: 0 },
};

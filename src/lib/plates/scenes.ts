import type { Palette } from "./palette";

/**
 * Hand-composed scene illustrations. Each scene paints with the semantic palette
 * and a seeded random source, so plates are deterministic and distinct.
 */

export interface Ctx {
  P: Palette;
  r: () => number;
  W: number;
  H: number;
  defs: string[];
  n: number;
}

const f = (v: number) => Math.round(v * 10) / 10;
const between = (ctx: Ctx, a: number, b: number) => a + (b - a) * ctx.r();

function gid(ctx: Ctx, p: string) {
  ctx.n += 1;
  return `${p}${ctx.n}`;
}

export function lin(ctx: Ctx, stops: [number, string, number?][], x2 = 0, y2 = 1, x1 = 0, y1 = 0) {
  const id = gid(ctx, "g");
  ctx.defs.push(
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
      .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ""}/>`)
      .join("")}</linearGradient>`,
  );
  return `url(#${id})`;
}

export function rad(ctx: Ctx, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5) {
  const id = gid(ctx, "r");
  ctx.defs.push(
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
      .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ""}/>`)
      .join("")}</radialGradient>`,
  );
  return `url(#${id})`;
}

function blur(ctx: Ctx, sd: number) {
  const id = gid(ctx, "b");
  ctx.defs.push(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
  return `filter="url(#${id})"`;
}

const rect = (x: number, y: number, w: number, h: number, fill: string, a = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${a}/>`;
const circle = (cx: number, cy: number, r: number, fill: string, a = "") => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${a}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, a = "") =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${a}/>`;
const poly = (pts: [number, number][], fill: string, a = "") => `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" fill="${fill}" ${a}/>`;
const path = (d: string, fill: string, a = "") => `<path d="${d}" fill="${fill}" ${a}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, w = 1, a = "") =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${a}/>`;

/** Smooth undulating ridge filled to the bottom of the frame. */
function ridge(ctx: Ctx, y: number, amp: number, seg: number, fill: string, a = "", x0 = 0, x1 = ctx.W, bottom = ctx.H) {
  const step = (x1 - x0) / seg;
  let d = `M${f(x0)},${f(bottom)} L${f(x0)},${f(y + (ctx.r() - 0.5) * amp)}`;
  for (let i = 1; i <= seg; i++) {
    const x = x0 + i * step;
    const yy = y + (ctx.r() - 0.5) * amp;
    const cx = x - step / 2;
    const cy = y + (ctx.r() - 0.5) * amp * 1.4;
    d += ` Q${f(cx)},${f(cy)} ${f(x)},${f(yy)}`;
  }
  d += ` L${f(x1)},${f(bottom)} Z`;
  return path(d, fill, a);
}

function sky(ctx: Ctx, top: string, bottom: string, h = ctx.H) {
  return rect(0, 0, ctx.W, h, lin(ctx, [[0, top], [1, bottom]]));
}

function waterLines(ctx: Ctx, y0: number, y1: number, color: string, count = 40, op = 0.35) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const y = y0 + (y1 - y0) * Math.pow(ctx.r(), 1.4);
    const w = between(ctx, 20, 140) * (0.4 + (y - y0) / (y1 - y0));
    const x = between(ctx, -40, ctx.W);
    s += rect(x, y, w, between(ctx, 1, 2.6), color, `opacity="${f(op * between(ctx, 0.4, 1))}"`);
  }
  return s;
}

function rain(ctx: Ctx, color: string, count = 140) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = between(ctx, -100, ctx.W);
    const y = between(ctx, -50, ctx.H);
    const len = between(ctx, 28, 70);
    s += line(x, y, x + len * 0.28, y + len, color, between(ctx, 0.8, 1.6), `opacity="${f(between(ctx, 0.15, 0.4))}" stroke-linecap="round"`);
  }
  return s;
}

function pine(x: number, base: number, h: number, w: number, fill: string) {
  const tiers = 4;
  let s = "";
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const yTop = base - h + t * h * 0.55;
    const yBot = base - h * 0.15 - (1 - t) * 0 + t * h * 0.0 - (tiers - 1 - i) * h * 0.16;
    const ww = w * (0.45 + t * 0.55);
    s += poly([[x, yTop], [x + ww / 2, yBot], [x - ww / 2, yBot]], fill);
  }
  s += rect(x - w * 0.04, base - h * 0.18, w * 0.08, h * 0.18, fill);
  return s;
}

function clouds(ctx: Ctx, y: number, color: string, count = 4, op = 0.7) {
  let s = "";
  const b = blur(ctx, 14);
  for (let i = 0; i < count; i++) {
    const cx = between(ctx, 0, ctx.W);
    const cy = y + between(ctx, -40, 40);
    const w = between(ctx, 160, 320);
    s += `<g ${b} opacity="${op}">${ellipse(cx, cy, w / 2, w / 7, color)}${ellipse(cx - w * 0.2, cy - w * 0.06, w / 4, w / 8, color)}${ellipse(cx + w * 0.18, cy - w * 0.05, w / 5, w / 9, color)}</g>`;
  }
  return s;
}

function lightBeam(ctx: Ctx, pts: [number, number][], color: string, op = 0.28) {
  return poly(pts, lin(ctx, [[0, color, op], [1, color, 0]], 0.4, 1), `${blur(ctx, 6)}`);
}

function windowFrame(x: number, y: number, w: number, h: number, frame: string, panes = 2, bar = 10) {
  let s = rect(x - bar, y - bar, w + bar * 2, bar, frame) + rect(x - bar, y + h, w + bar * 2, bar * 1.6, frame);
  s += rect(x - bar, y, bar, h, frame) + rect(x + w, y, bar, h, frame);
  for (let i = 1; i < panes; i++) s += rect(x + (w / panes) * i - bar / 4, y, bar / 2, h, frame);
  s += rect(x, y + h / 2 - bar / 4, w, bar / 2, frame);
  return s;
}

function figure(cx: number, base: number, h: number, body: string, skin: string, dress = false) {
  const head = h * 0.11;
  const shoulders = h * 0.26;
  let s = circle(cx, base - h + head, head, skin);
  if (dress) {
    s += path(`M${f(cx - shoulders * 0.4)},${f(base - h + head * 2.1)} Q${f(cx)},${f(base - h + head * 1.8)} ${f(cx + shoulders * 0.4)},${f(base - h + head * 2.1)} L${f(cx + shoulders * 1.05)},${f(base)} L${f(cx - shoulders * 1.05)},${f(base)} Z`, body);
  } else {
    s += path(`M${f(cx - shoulders / 2)},${f(base - h + head * 2.2)} Q${f(cx)},${f(base - h + head * 1.9)} ${f(cx + shoulders / 2)},${f(base - h + head * 2.2)} L${f(cx + shoulders * 0.46)},${f(base - h * 0.45)} L${f(cx + shoulders * 0.3)},${f(base)} L${f(cx + 2)},${f(base)} L${f(cx)},${f(base - h * 0.4)} L${f(cx - 2)},${f(base)} L${f(cx - shoulders * 0.3)},${f(base)} L${f(cx - shoulders * 0.46)},${f(base - h * 0.45)} Z`, body);
  }
  return s;
}

/* ================================================================== */
/* Scenes                                                              */
/* ================================================================== */

export type SceneFn = (ctx: Ctx) => string;

export const scenes: Record<string, SceneFn> = {
  kitchen(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.wall);
    // tiles
    for (let y = H * 0.48; y < H * 0.72; y += 34) for (let x = 0; x < W; x += 34) s += rect(x + 1, y + 1, 32, 32, P.plaster, `opacity="0.55"`);
    // window
    const wx = W * 0.52, wy = H * 0.12, ww = W * 0.34, wh = H * 0.36;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.skyHigh], [1, P.light]]));
    s += ridge(ctx, wy + wh * 0.78, 18, 5, P.green, `opacity="0.8"`, wx, wx + ww, wy + wh);
    s += rect(wx, wy + wh * 0.8, ww, wh * 0.2, P.green, `opacity="0.7"`);
    s += windowFrame(wx, wy, ww, wh, P.plaster, 2, 12);
    // gingham curtains
    const cur = (x: number, dir: number) => {
      let c = path(`M${f(x)},${f(wy - 20)} L${f(x + dir * ww * 0.26)},${f(wy - 20)} Q${f(x + dir * ww * 0.1)},${f(wy + wh * 0.4)} ${f(x + dir * ww * 0.03)},${f(wy + wh * 0.9)} L${f(x)},${f(wy + wh * 0.9)} Z`, P.red, `opacity="0.85"`);
      for (let i = 0; i < 6; i++) c += rect(x + dir * (i * 14) - (dir < 0 ? 7 : 0), wy - 20, 7, wh * 0.5, P.paper, `opacity="0.35"`);
      return c;
    };
    s += cur(wx - 8, 1) + cur(wx + ww + 8, -1);
    s += lightBeam(ctx, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww * 0.6, H], [wx - ww * 0.6, H]], P.light, 0.35);
    // shelf + radio
    s += rect(W * 0.08, H * 0.3, W * 0.3, 10, P.woodDark);
    s += rect(W * 0.12, H * 0.2, W * 0.13, H * 0.1, P.woodDark, `rx="10"`) + circle(W * 0.155, H * 0.25, 18, P.cream, `opacity="0.85"`) + rect(W * 0.19, H * 0.225, W * 0.045, 6, P.cream);
    s += ellipse(W * 0.3, H * 0.28, 24, 22, P.c("#d8d2c4"));
    // table
    s += poly([[0, H * 0.7], [W, H * 0.66], [W, H], [0, H]], P.wood);
    for (let i = 0; i < 6; i++) s += line(0, H * (0.74 + i * 0.05), W, H * (0.7 + i * 0.055), P.woodDark, 2, `opacity="0.35"`);
    // cloth + loaf
    s += poly([[W * 0.22, H * 0.72], [W * 0.62, H * 0.7], [W * 0.68, H * 0.9], [W * 0.18, H * 0.93]], P.paper, `opacity="0.95"`);
    s += ellipse(W * 0.42, H * 0.79, W * 0.16, H * 0.085, P.c("#9c6233"));
    s += ellipse(W * 0.42, H * 0.765, W * 0.14, H * 0.06, P.c("#c08049"));
    for (let i = 0; i < 4; i++) s += path(`M${f(W * (0.34 + i * 0.05))},${f(H * 0.745)} q12,10 28,2`, "none", `stroke="${P.c("#e9c79b")}" stroke-width="5" stroke-linecap="round"`);
    s += ellipse(W * 0.78, H * 0.78, W * 0.07, H * 0.03, P.blue);
    s += path(`M${f(W * 0.71)},${f(H * 0.78)} q${f(W * 0.07)},${f(H * 0.09)} ${f(W * 0.14)},0`, P.glaze);
    return s;
  },

  breadboard(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.woodDark);
    for (let x = 0; x < W; x += W / 6) s += rect(x, 0, W / 6 - 3, H, P.wood, `opacity="${f(between(ctx, 0.75, 1))}"`);
    for (let i = 0; i < 40; i++) s += line(between(ctx, 0, W), 0, between(ctx, 0, W), H, P.woodDark, 1, `opacity="0.18"`);
    s += circle(W * 0.48, H * 0.52, W * 0.38, P.woodLight);
    s += circle(W * 0.48, H * 0.52, W * 0.36, P.c("#d9ae80"));
    const b = blur(ctx, 3);
    let dust = "";
    for (let i = 0; i < 260; i++) {
      const a = ctx.r() * Math.PI * 2;
      const rr = Math.pow(ctx.r(), 0.7) * W * 0.34;
      dust += circle(W * 0.48 + Math.cos(a) * rr, H * 0.52 + Math.sin(a) * rr, between(ctx, 1.5, 6), P.paper, `opacity="${f(between(ctx, 0.25, 0.75))}"`);
    }
    s += `<g ${b}>${dust}</g>`;
    s += ellipse(W * 0.44, H * 0.46, W * 0.17, W * 0.13, P.c("#eeddba"));
    s += ellipse(W * 0.42, H * 0.44, W * 0.1, W * 0.06, P.paper, `opacity="0.55"`);
    s += `<g transform="rotate(-28 ${f(W * 0.62)} ${f(H * 0.78)})">${rect(W * 0.3, H * 0.76, W * 0.6, W * 0.07, P.woodLight, `rx="${f(W * 0.035)}"`)}${rect(W * 0.18, H * 0.775, W * 0.14, W * 0.04, P.woodDark, `rx="12"`)}${rect(W * 0.88, H * 0.775, W * 0.14, W * 0.04, P.woodDark, `rx="12"`)}</g>`;
    return s;
  },

  harbor(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.fog, P.c("#c9cfd0"), H * 0.55);
    s += circle(W * 0.72, H * 0.24, 46, P.light, `opacity="0.55" ${blur(ctx, 10)}`);
    s += ridge(ctx, H * 0.47, 26, 7, P.c("#8e9a9c"), `opacity="0.75"`);
    s += rect(0, H * 0.52, W, H * 0.48, lin(ctx, [[0, P.c("#8fa6ae")], [1, P.seaDeep]]));
    s += waterLines(ctx, H * 0.53, H, P.fog, 60, 0.4);
    const boat = (x: number, y: number, w: number, hull: string, cabin: string, mast: number) => {
      let b = path(`M${f(x)},${f(y)} L${f(x + w)},${f(y)} L${f(x + w * 0.88)},${f(y + w * 0.16)} L${f(x + w * 0.08)},${f(y + w * 0.16)} Z`, hull);
      b += rect(x + w * 0.45, y - w * 0.16, w * 0.28, w * 0.16, cabin);
      b += rect(x + w * 0.5, y - w * 0.12, w * 0.05, w * 0.05, P.ink, `opacity="0.5"`);
      b += line(x + w * 0.3, y, x + w * 0.3, y - mast, P.ink, 3);
      b += line(x + w * 0.3, y - mast, x + w * 0.85, y - w * 0.16, P.ink, 1, `opacity="0.6"`);
      b += path(`M${f(x + w * 0.1)},${f(y + w * 0.2)} L${f(x + w * 0.86)},${f(y + w * 0.2)}`, "none", `stroke="${hull}" stroke-width="${f(w * 0.06)}" opacity="0.25"`);
      return b;
    };
    s += boat(W * 0.52, H * 0.62, W * 0.28, P.c("#7d3a2e"), P.cream, H * 0.26);
    s += boat(W * 0.18, H * 0.57, W * 0.16, P.c("#4b5b63"), P.wall, H * 0.18);
    s += boat(W * 0.82, H * 0.56, W * 0.1, P.c("#9aa3a1"), P.wall, H * 0.12);
    // pier + pilings with snow caps
    s += poly([[0, H * 0.74], [W * 0.38, H * 0.7], [W * 0.38, H * 0.73], [0, H * 0.79]], P.woodDark);
    s += poly([[0, H * 0.735], [W * 0.38, H * 0.698], [W * 0.38, H * 0.705], [0, H * 0.745]], P.fog);
    for (let i = 0; i < 7; i++) {
      const x = i * W * 0.055 + 10;
      const top = H * 0.7 + i * -2 + (7 - i) * 8;
      s += rect(x, top, 18, H - top, P.shadow) + ellipse(x + 9, top, 11, 5, P.fog);
    }
    return s;
  },

  lighthouse(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#cfd6d6"), P.fog);
    s += rect(0, H * 0.55, W, H * 0.45, lin(ctx, [[0, P.c("#aab6b6")], [1, P.c("#6b7f84")]]));
    s += waterLines(ctx, H * 0.56, H, P.fog, 40, 0.35);
    // beam
    s += poly([[W * 0.6, H * 0.23], [W * 1.2, H * 0.08], [W * 1.2, H * 0.3]], P.light, `opacity="0.35" ${blur(ctx, 12)}`);
    // headland
    s += path(`M0,${f(H * 0.62)} C${f(W * 0.25)},${f(H * 0.5)} ${f(W * 0.45)},${f(H * 0.53)} ${f(W * 0.75)},${f(H * 0.6)} L${f(W * 0.95)},${f(H * 0.68)} L${f(W)},${f(H * 0.76)} L${f(W)},${f(H)} L0,${f(H)} Z`, P.rock);
    s += path(`M0,${f(H * 0.72)} C${f(W * 0.3)},${f(H * 0.64)} ${f(W * 0.6)},${f(H * 0.7)} ${f(W)},${f(H * 0.82)} L${f(W)},${f(H)} L0,${f(H)} Z`, P.shadow, `opacity="0.7"`);
    // keeper's house
    s += rect(W * 0.18, H * 0.47, W * 0.22, H * 0.08, P.plaster) + poly([[W * 0.16, H * 0.47], [W * 0.29, H * 0.415], [W * 0.42, H * 0.47]], P.red);
    for (let i = 0; i < 3; i++) s += rect(W * (0.21 + i * 0.06), H * 0.495, W * 0.03, H * 0.03, P.ink, `opacity="0.55"`);
    // tower
    s += poly([[W * 0.5, H * 0.5], [W * 0.66, H * 0.5], [W * 0.63, H * 0.24], [W * 0.53, H * 0.24]], P.plaster);
    s += poly([[W * 0.6, H * 0.5], [W * 0.66, H * 0.5], [W * 0.63, H * 0.24], [W * 0.6, H * 0.24]], P.wallShade, `opacity="0.7"`);
    s += rect(W * 0.515, H * 0.2, W * 0.13, H * 0.045, P.ink) + rect(W * 0.53, H * 0.205, W * 0.1, H * 0.03, P.light, `opacity="0.8"`);
    s += poly([[W * 0.51, H * 0.2], [W * 0.58, H * 0.165], [W * 0.65, H * 0.2]], P.ink);
    s += circle(W * 0.58, H * 0.22, 40, P.light, `opacity="0.6" ${blur(ctx, 14)}`);
    // fog veils
    const fb = blur(ctx, 30);
    for (let i = 0; i < 5; i++) s += ellipse(between(ctx, 0, W), between(ctx, H * 0.3, H * 0.7), between(ctx, 200, 400), between(ctx, 30, 70), P.fog, `opacity="${f(between(ctx, 0.35, 0.6))}" ${fb}`);
    return s;
  },

  station(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.skyHigh, P.light, H * 0.6);
    // canopy
    s += poly([[0, 0], [W, 0], [W, H * 0.16], [W * 0.62, H * 0.36], [0, H * 0.24]], P.shadow);
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const x = W * (0.08 + t * 0.5);
      const top = H * (0.24 + t * 0.12);
      const hh = H * (0.66 - t * 0.28);
      s += rect(x, top, W * (0.025 - t * 0.012), hh, P.ink, `opacity="${f(0.95 - t * 0.4)}"`);
    }
    // platform
    s += poly([[0, H * 0.92], [W * 0.62, H * 0.56], [W * 0.66, H * 0.56], [W * 0.5, H], [0, H]], P.stone);
    s += poly([[0, H * 0.9], [W * 0.62, H * 0.555], [W * 0.64, H * 0.555], [W * 0.03, H * 0.92]], P.yellow, `opacity="0.8"`);
    // tracks
    s += poly([[W * 0.5, H], [W * 0.66, H * 0.56], [W * 0.75, H * 0.56], [W, H * 0.86], [W, H]], P.rock);
    // train
    const tx = W * 0.66, ty = H * 0.3;
    s += rect(tx, ty, W * 0.22, H * 0.3, P.c("#2f3b35"), `rx="40"`);
    s += rect(tx + W * 0.03, ty + H * 0.05, W * 0.16, H * 0.08, P.light, `opacity="0.55" rx="10"`);
    s += circle(tx + W * 0.11, ty + H * 0.2, 22, P.light) + circle(tx + W * 0.11, ty + H * 0.2, 60, P.light, `opacity="0.35" ${blur(ctx, 16)}`);
    s += rect(tx - W * 0.01, ty + H * 0.27, W * 0.24, H * 0.03, P.ink);
    // steam
    const sb = blur(ctx, 18);
    for (let i = 0; i < 6; i++) s += circle(tx + W * 0.1 + between(ctx, -60, 80), ty - between(ctx, 10, 120), between(ctx, 30, 70), P.fog, `opacity="${f(between(ctx, 0.35, 0.7))}" ${sb}`);
    // clock
    s += line(W * 0.36, H * 0.29, W * 0.36, H * 0.33, P.ink, 3) + circle(W * 0.36, H * 0.37, 30, P.paper) + circle(W * 0.36, H * 0.37, 30, "none", `stroke="${P.ink}" stroke-width="4"`);
    s += line(W * 0.36, H * 0.37, W * 0.36, H * 0.35, P.ink, 3) + line(W * 0.36, H * 0.37, W * 0.373, H * 0.375, P.ink, 3);
    // a small figure with suitcase
    s += figure(W * 0.24, H * 0.83, H * 0.3, P.c("#3d4a5c"), P.c("#e2c4a8"), true);
    s += rect(W * 0.265, H * 0.76, W * 0.05, H * 0.06, P.blue, `rx="4"`);
    return s;
  },

  letter(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#5b5446"));
    for (let y = 0; y < H; y += 18) for (let x = 0; x < W; x += 36) s += path(`M${x},${y} l18,9 l18,-9`, "none", `stroke="${P.c("#6d6554")}" stroke-width="5" opacity="0.7"`);
    s += `<g transform="rotate(-6 ${W / 2} ${H / 2})">`;
    s += rect(W * 0.2, H * 0.28, W * 0.62, H * 0.32, P.c("#e7dcc4"), `opacity="0.95"`);
    s += poly([[W * 0.2, H * 0.28], [W * 0.51, H * 0.45], [W * 0.82, H * 0.28]], P.c("#d8cbaf"));
    s += rect(W * 0.7, H * 0.3, W * 0.08, W * 0.1, P.red, `opacity="0.85"`);
    s += `</g><g transform="rotate(4 ${W / 2} ${H / 2})">`;
    s += rect(W * 0.14, H * 0.38, W * 0.66, H * 0.5, P.paper) + rect(W * 0.14, H * 0.63, W * 0.66, 2, P.wallShade);
    for (let i = 0; i < 9; i++) {
      const y = H * 0.44 + i * H * 0.042;
      if (i === 4 || i === 5) continue;
      let d = `M${f(W * 0.2)},${f(y)}`;
      const len = W * between(ctx, 0.36, 0.52);
      for (let x = 0; x < len; x += 16) d += ` q4,${f(between(ctx, -9, 3))} 8,0 t8,0`;
      s += path(d, "none", `stroke="${P.c("#2b3a55")}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"`);
    }
    s += `</g>`;
    return s;
  },

  window(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#4a4038"));
    const wx = W * 0.14, wy = H * 0.1, ww = W * 0.72, wh = H * 0.56;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.c("#f4c99a")], [0.6, P.skyWarm], [1, P.light]]));
    // rooftops
    for (let i = 0; i < 6; i++) {
      const x = wx + between(ctx, -40, ww - 60);
      const h = between(ctx, wh * 0.18, wh * 0.45);
      s += rect(x, wy + wh - h, between(ctx, 90, 180), h, i % 2 ? P.brick : P.c("#8f4b38"));
      s += rect(x + 20, wy + wh - h - 30, 22, 30, P.brick);
    }
    s += rect(wx + ww * 0.62, wy + wh * 0.3, ww * 0.09, wh * 0.14, P.woodDark, `rx="4"`);
    s += line(wx + ww * 0.63, wy + wh * 0.44, wx + ww * 0.6, wy + wh * 0.62, P.woodDark, 4) + line(wx + ww * 0.7, wy + wh * 0.44, wx + ww * 0.73, wy + wh * 0.62, P.woodDark, 4);
    s += windowFrame(wx, wy, ww, wh, P.plaster, 2, 16);
    // sill
    s += rect(wx - 40, wy + wh + 20, ww + 80, 24, P.plaster);
    s += rect(wx + ww * 0.08, wy + wh - 10, ww * 0.42, wh * 0.18, P.blue, `rx="10"`);
    s += rect(wx + ww * 0.08, wy + wh + 2, ww * 0.42, 6, P.c("#204c73"));
    s += rect(wx + ww * 0.24, wy + wh - 30, ww * 0.1, 22, "none", `stroke="${P.c("#204c73")}" stroke-width="6" rx="8"`);
    s += rect(wx + ww * 0.7, wy + wh - 50, ww * 0.12, 70, P.terracotta);
    for (let i = 0; i < 6; i++) s += ellipse(wx + ww * 0.76 + between(ctx, -40, 40), wy + wh - 70 - between(ctx, 0, 60), 16, 34, P.green, `transform="rotate(${f(between(ctx, -40, 40))} ${f(wx + ww * 0.76)} ${f(wy + wh - 60)})"`);
    s += lightBeam(ctx, [[wx, wy + wh + 44], [wx + ww, wy + wh + 44], [W, H], [0, H]], P.light, 0.22);
    return s;
  },

  cafe(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#3c3a35"));
    s += ellipse(W * 0.5, H * 0.56, W * 0.5, H * 0.46, P.c("#e9e4da"));
    for (let i = 0; i < 9; i++) s += path(`M${f(between(ctx, W * 0.1, W * 0.9))},${f(between(ctx, H * 0.2, H * 0.9))} q${f(between(ctx, 40, 120))},${f(between(ctx, -30, 30))} ${f(between(ctx, 80, 220))},${f(between(ctx, -10, 40))}`, "none", `stroke="${P.stone}" stroke-width="1.5" opacity="0.4"`);
    // blind light bars
    for (let i = 0; i < 7; i++) s += poly([[0, H * (0.05 + i * 0.12)], [W, H * (0.0 + i * 0.12)], [W, H * (0.05 + i * 0.12)], [0, H * (0.1 + i * 0.12)]], P.light, `opacity="0.14"`);
    const cup = (x: number, y: number) =>
      ellipse(x, y, 92, 56, P.paper) + ellipse(x, y, 92, 56, "none", `stroke="${P.wallShade}" stroke-width="3"`) + ellipse(x, y - 6, 52, 34, P.plaster) + ellipse(x, y - 6, 42, 26, P.c("#5a3a22")) + ellipse(x - 10, y - 10, 12, 5, P.c("#8c6040"), `opacity="0.7"`) + path(`M${f(x + 50)},${f(y - 10)} q30,4 22,22`, "none", `stroke="${P.plaster}" stroke-width="9"`);
    s += cup(W * 0.3, H * 0.42) + cup(W * 0.72, H * 0.6);
    // napkin with diagram
    s += `<g transform="rotate(-8 ${f(W * 0.5)} ${f(H * 0.72)})">${rect(W * 0.36, H * 0.6, W * 0.26, W * 0.2, P.paper)}`;
    s += circle(W * 0.42, H * 0.7, 22, "none", `stroke="${P.ink}" stroke-width="2.5"`);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      s += line(W * 0.42 + Math.cos(a) * 30, H * 0.7 + Math.sin(a) * 30, W * 0.42 + Math.cos(a) * 42, H * 0.7 + Math.sin(a) * 42, P.ink, 2);
    }
    s += path(`M${f(W * 0.46)},${f(H * 0.7)} L${f(W * 0.57)},${f(H * 0.66)} M${f(W * 0.53)},${f(H * 0.65)} L${f(W * 0.57)},${f(H * 0.66)} L${f(W * 0.545)},${f(H * 0.69)}`, "none", `stroke="${P.blue}" stroke-width="3"`);
    s += circle(W * 0.58, H * 0.75, 16, "none", `stroke="${P.ink}" stroke-width="2"`) + `</g>`;
    s += `<g transform="rotate(32 ${f(W * 0.66)} ${f(H * 0.36)})">${rect(W * 0.6, H * 0.35, W * 0.18, 9, P.metal, `rx="4"`)}${ellipse(W * 0.6, H * 0.355, 18, 11, P.metal)}</g>`;
    return s;
  },

  umbrella(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#8f8c83"));
    // church facade + door arch
    s += rect(W * 0.1, 0, W * 0.8, H * 0.62, P.c("#b3ab9b"));
    for (let y = 0; y < H * 0.62; y += 46) for (let x = W * 0.1 + ((y / 46) % 2) * 40; x < W * 0.9; x += 80) s += rect(x, y, 78, 44, P.c("#a8a091"), `opacity="0.6"`);
    s += path(`M${f(W * 0.32)},${f(H * 0.62)} L${f(W * 0.32)},${f(H * 0.26)} A${f(W * 0.18)},${f(W * 0.18)} 0 0 1 ${f(W * 0.68)},${f(H * 0.26)} L${f(W * 0.68)},${f(H * 0.62)} Z`, P.c("#3a3530"));
    s += line(W * 0.5, H * 0.18, W * 0.5, H * 0.62, P.c("#26221e"), 4);
    // steps
    for (let i = 0; i < 6; i++) s += rect(0, H * (0.62 + i * 0.063), W, H * 0.063, i % 2 ? P.c("#9c978c") : P.c("#a8a397"));
    for (let i = 0; i < 6; i++) s += rect(0, H * (0.62 + i * 0.063), W, 3, P.c("#cfcabc"), `opacity="0.6"`);
    // puddle reflection
    s += ellipse(W * 0.5, H * 0.95, W * 0.35, H * 0.03, P.c("#c9c4b6"), `opacity="0.55"`);
    // figures
    s += figure(W * 0.42, H * 0.86, H * 0.38, P.paper, P.c("#6d5a4c"), true);
    s += figure(W * 0.6, H * 0.86, H * 0.42, P.c("#2c2e33"), P.c("#4a3b31"));
    s += ellipse(W * 0.51, H * 0.5, W * 0.26, H * 0.05, P.shadow, `opacity="0.35" ${blur(ctx, 10)}`);
    s += path(`M${f(W * 0.36)},${f(H * 0.64)} q-10,40 6,90`, "none", `stroke="${P.c("#e7e1d3")}" stroke-width="6" opacity="0.8"`);
    // umbrella
    const ux = W * 0.51, uy = H * 0.4, ur = W * 0.3;
    s += line(ux, uy, ux + 6, uy + H * 0.2, P.ink, 5);
    s += path(`M${f(ux - ur)},${f(uy + 26)} Q${f(ux - ur * 0.75)},${f(uy - ur * 0.62)} ${f(ux)},${f(uy - ur * 0.68)} Q${f(ux + ur * 0.75)},${f(uy - ur * 0.62)} ${f(ux + ur)},${f(uy + 26)} q${f(-ur * 0.25)},-22 ${f(-ur * 0.5)},0 q${f(-ur * 0.25)},-22 ${f(-ur * 0.5)},0 q${f(-ur * 0.25)},-22 ${f(-ur * 0.5)},0 q${f(-ur * 0.25)},-22 ${f(-ur * 0.5)},0 Z`, P.red);
    for (const k of [-0.5, 0, 0.5]) s += path(`M${f(ux)},${f(uy - ur * 0.68)} Q${f(ux + ur * k * 0.8)},${f(uy - ur * 0.4)} ${f(ux + ur * k)},${f(uy + 16)}`, "none", `stroke="${P.c("#8e2318")}" stroke-width="2.5" opacity="0.7"`);
    s += path(`M${f(ux - ur * 0.6)},${f(uy - ur * 0.32)} Q${f(ux - ur * 0.3)},${f(uy - ur * 0.62)} ${f(ux)},${f(uy - ur * 0.64)}`, "none", `stroke="${P.c("#e57a6c")}" stroke-width="8" opacity="0.5" stroke-linecap="round"`);
    s += rain(ctx, P.fog, 180);
    return s;
  },

  nursery(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#dfe3dc"));
    const wx = W * 0.2, wy = H * 0.14, ww = W * 0.6, wh = H * 0.42;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.c("#bcd3e3")], [1, P.light]]));
    s += ridge(ctx, wy + wh * 0.85, 20, 4, P.c("#9fb0a6"), "", wx, wx + ww, wy + wh);
    s += windowFrame(wx, wy, ww, wh, P.plaster, 2, 14);
    s += path(`M${f(wx - 30)},${f(wy - 30)} Q${f(wx + 30)},${f(wy + wh * 0.5)} ${f(wx - 10)},${f(wy + wh + 20)} L${f(wx - 60)},${f(wy + wh + 20)} L${f(wx - 60)},${f(wy - 30)} Z`, P.c("#efe3c8"));
    s += path(`M${f(wx + ww + 30)},${f(wy - 30)} Q${f(wx + ww - 30)},${f(wy + wh * 0.5)} ${f(wx + ww + 10)},${f(wy + wh + 20)} L${f(wx + ww + 60)},${f(wy + wh + 20)} L${f(wx + ww + 60)},${f(wy - 30)} Z`, P.c("#efe3c8"));
    // mobile
    const mx = W * 0.5, my = H * 0.08;
    s += line(mx, 0, mx, my, P.ink, 2) + line(mx - W * 0.22, my + 20, mx + W * 0.22, my + 12, P.woodDark, 4);
    const boat = (x: number, y: number, sz: number, sail: string) =>
      line(x, y - sz * 2.4, x, y - sz * 1.2, P.ink, 1, `opacity="0.6"`) +
      path(`M${f(x - sz)},${f(y)} L${f(x + sz)},${f(y)} L${f(x + sz * 0.7)},${f(y + sz * 0.4)} L${f(x - sz * 0.7)},${f(y + sz * 0.4)} Z`, P.woodLight) +
      poly([[x, y - sz * 1.2], [x, y - 2], [x + sz * 0.8, y - 2]], sail);
    s += line(mx - W * 0.2, my + 20, mx - W * 0.2, H * 0.24, P.ink, 1) + boat(mx - W * 0.2, H * 0.3, 26, P.paper);
    s += line(mx, my + 16, mx, H * 0.32, P.ink, 1) + boat(mx, H * 0.38, 30, P.red);
    s += line(mx + W * 0.2, my + 12, mx + W * 0.2, H * 0.21, P.ink, 1) + boat(mx + W * 0.2, H * 0.27, 24, P.blue);
    // crib rail
    s += rect(0, H * 0.7, W, H * 0.3, P.c("#cfd4cc"));
    s += rect(0, H * 0.66, W, 22, P.plaster);
    for (let x = 20; x < W; x += 54) s += rect(x, H * 0.66, 16, H * 0.34, P.plaster) + rect(x + 12, H * 0.66, 4, H * 0.34, P.wallShade);
    s += ellipse(W * 0.5, H * 0.94, W * 0.4, H * 0.06, P.c("#f0d8c8"));
    return s;
  },

  shells(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#f0c48f"), P.light, H * 0.4);
    s += circle(W * 0.18, H * 0.3, 60, P.light, `opacity="0.9" ${blur(ctx, 18)}`);
    s += rect(0, H * 0.36, W, H * 0.14, lin(ctx, [[0, P.c("#6f98a6")], [1, P.c("#9fb7b6")]]));
    s += waterLines(ctx, H * 0.37, H * 0.49, P.light, 50, 0.7);
    s += path(`M0,${f(H * 0.5)} Q${f(W * 0.3)},${f(H * 0.47)} ${f(W * 0.6)},${f(H * 0.52)} T${W},${f(H * 0.5)} L${W},${H} L0,${H} Z`, lin(ctx, [[0, P.c("#c9b391")], [0.25, P.sand], [1, P.c("#ead9b6")]]));
    s += path(`M0,${f(H * 0.52)} Q${f(W * 0.3)},${f(H * 0.49)} ${f(W * 0.6)},${f(H * 0.545)} T${W},${f(H * 0.52)}`, "none", `stroke="${P.light}" stroke-width="5" opacity="0.6"`);
    for (let i = 0; i < 7; i++) {
      const x = W * (0.1 + i * 0.09), y = H * (0.88 - i * 0.045);
      s += ellipse(x, y, 13, 22, P.c("#bfa47d"), `transform="rotate(${-30 + i * 3} ${f(x)} ${f(y)})" opacity="0.7"`);
    }
    // bucket
    const bx = W * 0.68, by = H * 0.66;
    s += ellipse(bx + 30, by + H * 0.21, W * 0.12, 22, P.c("#9d8662"), `opacity="0.5"`);
    s += poly([[bx - W * 0.075, by], [bx + W * 0.075, by], [bx + W * 0.06, by + H * 0.2], [bx - W * 0.06, by + H * 0.2]], P.red);
    s += ellipse(bx, by, W * 0.075, 16, P.c("#8e2318")) + path(`M${f(bx - W * 0.07)},${f(by)} Q${f(bx)},${f(by - H * 0.16)} ${f(bx + W * 0.07)},${f(by)}`, "none", `stroke="${P.ink}" stroke-width="4"`);
    s += rect(bx - W * 0.06, by + H * 0.06, W * 0.04, H * 0.11, P.c("#e05a46"), `opacity="0.5"`);
    // shells
    const shell = (x: number, y: number, sz: number, rot: number, c: string) => {
      let g = `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${path(`M${f(x)},${f(y + sz * 0.5)} L${f(x - sz)},${f(y - sz * 0.4)} Q${f(x)},${f(y - sz * 1.15)} ${f(x + sz)},${f(y - sz * 0.4)} Z`, c)}`;
      for (let k = -2; k <= 2; k++) g += line(x, y + sz * 0.45, x + k * sz * 0.4, y - sz * 0.7, P.c("#a8907a"), 1.5, `opacity="0.7"`);
      return g + `</g>`;
    };
    s += shell(W * 0.36, H * 0.8, 34, -12, P.c("#f1dfcc")) + shell(W * 0.48, H * 0.9, 24, 18, P.c("#e8c7b0")) + shell(W * 0.25, H * 0.68, 20, 40, P.c("#f6e8d8"));
    s += circle(W * 0.56, H * 0.74, 14, P.c("#dbc8b4")) + circle(W * 0.56, H * 0.74, 6, P.c("#bba48c"));
    return s;
  },

  gallery(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.plaster);
    s += poly([[0, H * 0.7], [W, H * 0.7], [W, H], [0, H]], P.woodLight);
    for (let i = 0; i < 10; i++) s += line(W * (i / 10) - 40, H, W * 0.5 + (W * (i / 10) - W * 0.5) * 0.5, H * 0.7, P.wood, 2, `opacity="0.5"`);
    s += poly([[W * 0.05, 0], [W * 0.32, 0], [W * 0.5, H * 0.7], [W * 0.1, H * 0.95]], P.light, `opacity="0.45" ${blur(ctx, 18)}`);
    s += rect(W * 0.78, H * 0.38, W * 0.1, H * 0.05, P.paper) + rect(W * 0.79, H * 0.395, W * 0.06, 3, P.ink, `opacity="0.4"`) + rect(W * 0.79, H * 0.41, W * 0.04, 3, P.ink, `opacity="0.3"`);
    // plinth
    s += ellipse(W * 0.52, H * 0.93, W * 0.24, H * 0.03, P.shadow, `opacity="0.25" ${blur(ctx, 10)}`);
    s += poly([[W * 0.33, H * 0.52], [W * 0.66, H * 0.52], [W * 0.66, H * 0.92], [W * 0.33, H * 0.92]], P.paper);
    s += poly([[W * 0.66, H * 0.52], [W * 0.72, H * 0.5], [W * 0.72, H * 0.9], [W * 0.66, H * 0.92]], P.wallShade);
    s += poly([[W * 0.33, H * 0.52], [W * 0.39, H * 0.5], [W * 0.72, H * 0.5], [W * 0.66, H * 0.52]], P.c("#ffffff"));
    // bowl
    const bx = W * 0.525, by = H * 0.45;
    s += path(`M${f(bx - W * 0.17)},${f(by)} Q${f(bx - W * 0.15)},${f(by + H * 0.08)} ${f(bx)},${f(by + H * 0.085)} Q${f(bx + W * 0.15)},${f(by + H * 0.08)} ${f(bx + W * 0.17)},${f(by)} Z`, P.glaze);
    s += ellipse(bx, by, W * 0.17, H * 0.022, P.c("#1f4d75"));
    s += path(`M${f(bx - W * 0.12)},${f(by + H * 0.02)} Q${f(bx - W * 0.09)},${f(by + H * 0.06)} ${f(bx - W * 0.02)},${f(by + H * 0.07)}`, "none", `stroke="${P.c("#9cc6e4")}" stroke-width="6" opacity="0.6" stroke-linecap="round"`);
    s += ellipse(bx, by + H * 0.09, W * 0.05, 6, P.c("#d8cdb6"));
    return s;
  },

  house(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.sky, P.light, H * 0.72);
    s += clouds(ctx, H * 0.16, P.paper, 3, 0.75);
    s += rect(0, H * 0.7, W, H * 0.3, lin(ctx, [[0, P.green], [1, P.greenDark]]));
    // house
    const hx = W * 0.36, hy = H * 0.3, hw = W * 0.42, hh = H * 0.42;
    s += rect(hx, hy, hw, hh, P.c("#e8dfc8"));
    for (let y = hy + 14; y < hy + hh; y += 16) s += line(hx, y, hx + hw, y, P.c("#cbbf9f"), 2, `opacity="0.6"`);
    s += poly([[hx - 24, hy + 4], [hx + hw / 2, hy - H * 0.17], [hx + hw + 24, hy + 4]], P.c("#5a5751"));
    s += rect(hx + hw * 0.7, hy - H * 0.16, 30, H * 0.1, P.brick);
    const win = (x: number, y: number) => rect(x, y, hw * 0.13, hh * 0.22, P.c("#3e4a4a")) + rect(x, y, hw * 0.13, hh * 0.22, "none", `stroke="${P.paper}" stroke-width="6"`) + line(x + hw * 0.065, y, x + hw * 0.065, y + hh * 0.22, P.paper, 3) + rect(x - 12, y, 10, hh * 0.22, P.c("#2e4a3f")) + rect(x + hw * 0.13 + 2, y, 10, hh * 0.22, P.c("#2e4a3f"));
    s += win(hx + hw * 0.12, hy + hh * 0.12) + win(hx + hw * 0.44, hy + hh * 0.12) + win(hx + hw * 0.75, hy + hh * 0.12) + win(hx + hw * 0.12, hy + hh * 0.56);
    s += rect(hx + hw * 0.47, hy + hh * 0.56, hw * 0.12, hh * 0.44, P.c("#7b2f25"));
    // crooked porch
    s += `<g transform="rotate(-2.2 ${f(hx + hw * 0.6)} ${f(hy + hh)})">`;
    s += poly([[hx + hw * 0.3, hy + hh * 0.48], [hx + hw + 30, hy + hh * 0.48], [hx + hw + 46, hy + hh * 0.56], [hx + hw * 0.27, hy + hh * 0.56]], P.c("#4f4c46"));
    for (let i = 0; i < 4; i++) s += rect(hx + hw * (0.3 + i * 0.24), hy + hh * 0.56, 10, hh * 0.44, P.paper);
    s += rect(hx + hw * 0.28, hy + hh * 0.98, hw * 0.78, 12, P.wood);
    for (let x = hx + hw * 0.3; x < hx + hw + 30; x += 18) s += rect(x, hy + hh * 0.82, 5, hh * 0.16, P.paper, `opacity="0.9"`);
    s += rect(hx + hw * 0.3, hy + hh * 0.81, hw * 0.75, 6, P.paper) + `</g>`;
    // maple
    s += rect(W * 0.16, H * 0.42, 22, H * 0.32, P.woodDark);
    for (let i = 0; i < 9; i++) s += circle(W * 0.17 + between(ctx, -110, 110), H * 0.3 + between(ctx, -80, 90), between(ctx, 60, 100), i % 3 ? P.c("#c4673a") : P.c("#d98c43"), `opacity="0.92"`);
    for (let i = 0; i < 20; i++) s += circle(between(ctx, 0, W * 0.4), between(ctx, H * 0.73, H * 0.95), between(ctx, 4, 8), P.c("#cf7a3e"), `opacity="0.8"`);
    s += poly([[hx + hw * 0.47, H], [hx + hw * 0.59, H], [hx + hw * 0.56, hy + hh], [hx + hw * 0.5, hy + hh]], P.stone);
    return s;
  },

  road(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.skyHigh, P.c("#f1dcb4"), H * 0.6);
    s += clouds(ctx, H * 0.18, P.paper, 4, 0.8);
    s += ridge(ctx, H * 0.56, 12, 9, P.c("#a59a7b"), `opacity="0.8"`);
    s += rect(0, H * 0.58, W, H * 0.42, lin(ctx, [[0, P.c("#c9b37d")], [1, P.c("#a88f55")]]));
    for (let i = 0; i < 40; i++) s += line(between(ctx, 0, W), between(ctx, H * 0.6, H), between(ctx, 0, W), between(ctx, H * 0.6, H), P.c("#8b7845"), 1.5, `opacity="0.25"`);
    s += poly([[W * 0.49, H * 0.58], [W * 0.51, H * 0.58], [W * 0.82, H], [W * 0.18, H]], P.c("#59564f"));
    for (let i = 0; i < 9; i++) {
      const t = i / 9, t2 = (i + 0.5) / 9;
      const y1 = H * 0.58 + H * 0.42 * t * t, y2 = H * 0.58 + H * 0.42 * t2 * t2;
      s += poly([[W * 0.5 - 1 - t * 4, y1], [W * 0.5 + 1 + t * 4, y1], [W * 0.5 + 1 + t2 * 4, y2], [W * 0.5 - 1 - t2 * 4, y2]], P.yellow, `opacity="0.85"`);
    }
    // telephone poles
    for (let i = 0; i < 7; i++) {
      const t = Math.pow(i / 7, 1.8);
      const x = W * (0.6 + t * 0.4), y = H * (0.58 + t * 0.35), h = H * (0.05 + t * 0.4);
      s += line(x, y, x, y - h, P.woodDark, 2 + t * 6) + line(x - h * 0.15, y - h * 0.92, x + h * 0.15, y - h * 0.92, P.woodDark, 1 + t * 4);
    }
    // station wagon
    const cx = W * 0.44, cy = H * 0.82, cw = W * 0.2;
    s += ellipse(cx, cy + 14, cw * 0.62, 12, P.shadow, `opacity="0.3"`);
    s += rect(cx - cw / 2, cy - cw * 0.22, cw, cw * 0.22, P.c("#7f3a26"), `rx="12"`);
    s += path(`M${f(cx - cw * 0.42)},${f(cy - cw * 0.22)} L${f(cx - cw * 0.34)},${f(cy - cw * 0.38)} L${f(cx + cw * 0.4)},${f(cy - cw * 0.38)} L${f(cx + cw * 0.46)},${f(cy - cw * 0.22)} Z`, P.c("#6c3020"));
    s += rect(cx - cw * 0.32, cy - cw * 0.35, cw * 0.72, cw * 0.11, P.c("#b9d0d8"), `opacity="0.85"`);
    s += rect(cx - cw / 2 + 8, cy - cw * 0.17, cw - 16, cw * 0.09, P.woodLight, `opacity="0.95"`);
    s += circle(cx - cw * 0.3, cy, cw * 0.09, P.ink) + circle(cx + cw * 0.3, cy, cw * 0.09, P.ink);
    s += rect(cx - cw * 0.3, cy - cw * 0.46, cw * 0.6, 8, P.ink, `opacity="0.7"`);
    return s;
  },

  cliffs(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#6f6a8e"), P.c("#f0a679"), H * 0.62);
    s += rect(0, H * 0.35, W, H * 0.27, lin(ctx, [[0, P.c("#f0a679"), 0], [1, P.c("#f7c58d")]]));
    s += circle(W * 0.38, H * 0.56, 70, P.c("#fbe2a8"));
    s += circle(W * 0.38, H * 0.56, 160, P.c("#fbe2a8"), `opacity="0.4" ${blur(ctx, 40)}`);
    s += rect(0, H * 0.6, W, H * 0.4, lin(ctx, [[0, P.c("#7a6a7a")], [1, P.c("#2a2d3e")]]));
    s += rect(W * 0.34, H * 0.6, W * 0.08, H * 0.4, lin(ctx, [[0, P.c("#fbe2a8"), 0.8], [1, P.c("#fbe2a8"), 0]]), `${blur(ctx, 8)}`);
    s += waterLines(ctx, H * 0.61, H, P.c("#f3c08c"), 50, 0.5);
    s += path(`M${f(W * 0.62)},${H} L${f(W * 0.64)},${f(H * 0.66)} L${f(W * 0.7)},${f(H * 0.6)} L${f(W * 0.76)},${f(H * 0.5)} L${f(W * 0.86)},${f(H * 0.46)} L${W},${f(H * 0.44)} L${W},${H} Z`, P.c("#2c2630"));
    s += path(`M${f(W * 0.5)},${H} L${f(W * 0.56)},${f(H * 0.8)} L${f(W * 0.62)},${f(H * 0.76)} L${f(W * 0.66)},${H} Z`, P.c("#3a3138"));
    // cypress
    const tx = W * 0.85, ty = H * 0.46;
    s += path(`M${f(tx)},${f(ty)} q-8,-60 -30,-90 M${f(tx)},${f(ty)} q14,-50 40,-80`, "none", `stroke="${P.c("#24202a")}" stroke-width="10"`);
    s += ellipse(tx - 70, ty - 110, 110, 34, P.c("#24202a")) + ellipse(tx + 60, ty - 100, 90, 28, P.c("#24202a")) + ellipse(tx - 10, ty - 140, 70, 24, P.c("#24202a"));
    return s;
  },

  bookshop(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#3d2f26"));
    const cols = [P.c("#7a3b2e"), P.c("#2f4f4a"), P.c("#b58a4a"), P.c("#5a5a7a"), P.c("#8a6d4b"), P.c("#a85f45"), P.c("#e2d4b6"), P.c("#3b4a5e")];
    for (let row = 0; row < 6; row++) {
      const y = H * 0.08 + row * H * 0.14;
      s += rect(0, y + H * 0.12, W, H * 0.02, P.woodDark);
      let x = 8;
      while (x < W - 10) {
        const w = between(ctx, 14, 34);
        const h = between(ctx, H * 0.08, H * 0.115);
        const lean = ctx.r() > 0.93;
        const c = cols[Math.floor(ctx.r() * cols.length)];
        s += lean ? `<g transform="rotate(14 ${f(x)} ${f(y + H * 0.12)})">${rect(x, y + H * 0.12 - h, w, h, c)}</g>` : rect(x, y + H * 0.12 - h, w, h, c);
        if (ctx.r() > 0.5) s += rect(x + 2, y + H * 0.12 - h * 0.8, w - 4, 3, P.c("#d7b76a"), `opacity="0.7"`);
        x += w + (lean ? 18 : 1.5);
      }
    }
    s += rect(W * 0.62, 0, 8, H, P.woodDark, `transform="rotate(-12 ${f(W * 0.62)} ${f(H)})"`) + rect(W * 0.78, 0, 8, H, P.woodDark, `transform="rotate(-12 ${f(W * 0.78)} ${f(H)})"`);
    for (let i = 0; i < 12; i++) s += line(W * 0.5, H - i * H * 0.08, W * 0.7, H - i * H * 0.08, P.woodDark, 6, `transform="rotate(-12 ${f(W * 0.62)} ${f(H)})"`);
    s += circle(W * 0.2, H * 0.05, 30, P.light) + circle(W * 0.2, H * 0.15, 240, P.light, `opacity="0.28" ${blur(ctx, 50)}`);
    return s;
  },

  garden(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.sky, P.c("#e9eef0"), H * 0.5);
    s += poly([[W * 0.72, H * 0.08], [W * 0.75, H * 0.3], [W * 0.69, H * 0.3]], P.c("#8e8a80")) + rect(W * 0.69, H * 0.3, W * 0.06, H * 0.12, P.c("#a6a093"));
    s += rect(0, H * 0.38, W, H * 0.18, P.c("#c9bea6"));
    for (let x = 0; x < W; x += 60) s += rect(x, H * 0.38, 58, 6, P.c("#d9cfb8"));
    s += poly([[W * 0.42, H * 0.56], [W * 0.58, H * 0.56], [W * 0.95, H], [W * 0.05, H]], P.c("#dccfb0"));
    for (let i = 0; i < 80; i++) s += circle(between(ctx, W * 0.1, W * 0.9), between(ctx, H * 0.6, H), between(ctx, 1, 3), P.c("#bfae8b"), `opacity="0.6"`);
    s += rect(0, H * 0.54, W * 0.43, H * 0.46, P.green) + rect(W * 0.57, H * 0.54, W * 0.43, H * 0.46, P.green);
    s += poly([[W * 0.43, H * 0.56], [W * 0.05, H], [0, H], [0, H * 0.56]], P.green);
    s += poly([[W * 0.57, H * 0.56], [W * 0.95, H], [W, H], [W, H * 0.56]], P.green);
    const topiary = (x: number, y: number, sz: number) => rect(x - 4, y, 8, sz * 0.9, P.woodDark) + circle(x, y, sz, P.greenDark) + circle(x - sz * 0.3, y - sz * 0.3, sz * 0.45, P.green, `opacity="0.6"`);
    s += topiary(W * 0.1, H * 0.4, 70) + topiary(W * 0.28, H * 0.44, 52) + topiary(W * 0.72, H * 0.44, 52) + topiary(W * 0.9, H * 0.4, 70);
    // bench
    const bx = W * 0.62, by = H * 0.74;
    s += rect(bx, by, W * 0.22, 14, P.c("#2f5a45")) + rect(bx, by - 52, W * 0.22, 12, P.c("#2f5a45")) + rect(bx, by - 30, W * 0.22, 12, P.c("#2f5a45"));
    s += rect(bx + 10, by, 8, 56, P.c("#1f3c2e")) + rect(bx + W * 0.22 - 18, by, 8, 56, P.c("#1f3c2e"));
    for (let i = 0; i < 46; i++) s += circle(W * 0.1 + between(ctx, -60, 90), H * 0.86 + between(ctx, -40, 50), between(ctx, 5, 10), [P.c("#d98ba0"), P.c("#f1e4c4"), P.c("#c96a7a")][i % 3], `opacity="0.9"`);
    return s;
  },

  lemons(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#d9d0bd"));
    s += poly([[W * 0.55, 0], [W, 0], [W, H * 0.55], [W * 0.2, H * 0.62]], P.light, `opacity="0.45" ${blur(ctx, 20)}`);
    s += rect(0, H * 0.58, W, H * 0.42, P.c("#efe7d6"));
    for (let i = 0; i < 5; i++) s += path(`M0,${f(H * (0.62 + i * 0.08))} Q${f(W * 0.5)},${f(H * (0.6 + i * 0.08) + between(ctx, -20, 20))} ${W},${f(H * (0.63 + i * 0.08))}`, "none", `stroke="${P.wallShade}" stroke-width="3" opacity="0.6"`);
    s += ellipse(W * 0.5, H * 0.79, W * 0.36, H * 0.03, P.shadow, `opacity="0.25" ${blur(ctx, 10)}`);
    s += `<g transform="rotate(-9 ${f(W * 0.5)} ${f(H * 0.7)})">`;
    const bx = W * 0.5, by = H * 0.58;
    // lemons behind rim
    const lemon = (x: number, y: number, rx: number, rot: number) =>
      `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${ellipse(x, y, rx, rx * 0.72, P.yellow)}${ellipse(x + rx * 0.98, y, rx * 0.12, rx * 0.1, P.c("#d2ad2b"))}${ellipse(x - rx * 0.3, y - rx * 0.3, rx * 0.35, rx * 0.14, P.c("#fdf0a4"), `opacity="0.7"`)}</g>`;
    s += lemon(bx - W * 0.12, by - H * 0.03, W * 0.1, -20) + lemon(bx + W * 0.1, by - H * 0.04, W * 0.1, 15) + lemon(bx, by - H * 0.075, W * 0.095, 4);
    s += path(`M${f(bx + W * 0.08)},${f(by - H * 0.11)} q40,-40 90,-30 q-40,30 -90,30`, P.green);
    s += path(`M${f(bx - W * 0.3)},${f(by)} Q${f(bx - W * 0.28)},${f(by + H * 0.17)} ${f(bx)},${f(by + H * 0.18)} Q${f(bx + W * 0.28)},${f(by + H * 0.17)} ${f(bx + W * 0.3)},${f(by)} Z`, P.c("#c9a678"));
    s += path(`M${f(bx - W * 0.3)},${f(by)} Q${f(bx - W * 0.28)},${f(by + H * 0.08)} ${f(bx)},${f(by + H * 0.09)} Q${f(bx + W * 0.28)},${f(by + H * 0.08)} ${f(bx + W * 0.3)},${f(by)} Z`, P.c("#5a8a7a"), `opacity="0.85"`);
    s += ellipse(bx, by, W * 0.3, H * 0.025, P.c("#4e7a6c"), `opacity="0.0"`);
    s += path(`M${f(bx - W * 0.22)},${f(by + H * 0.05)} Q${f(bx - W * 0.15)},${f(by + H * 0.13)} ${f(bx - W * 0.02)},${f(by + H * 0.15)}`, "none", `stroke="${P.paper}" stroke-width="7" opacity="0.4" stroke-linecap="round"`);
    s += `</g>`;
    return s;
  },

  rooftops(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#9eb3c4"), P.c("#f2c79a"), H * 0.6);
    s += ridge(ctx, H * 0.36, 40, 6, P.c("#8a9479"), `opacity="0.8"`);
    s += ridge(ctx, H * 0.42, 30, 8, P.c("#6f7d61"), `opacity="0.85"`);
    // dome
    const dx = W * 0.56, dy = H * 0.38;
    s += rect(dx - W * 0.11, dy, W * 0.22, H * 0.12, P.c("#d8cbb1"));
    s += path(`M${f(dx - W * 0.1)},${f(dy)} Q${f(dx - W * 0.1)},${f(dy - H * 0.2)} ${f(dx)},${f(dy - H * 0.22)} Q${f(dx + W * 0.1)},${f(dy - H * 0.2)} ${f(dx + W * 0.1)},${f(dy)} Z`, P.terracotta);
    for (const k of [-0.6, -0.2, 0.2, 0.6]) s += path(`M${f(dx)},${f(dy - H * 0.22)} Q${f(dx + W * 0.1 * k)},${f(dy - H * 0.16)} ${f(dx + W * 0.1 * k * 1.05)},${f(dy)}`, "none", `stroke="${P.paper}" stroke-width="4" opacity="0.85"`);
    s += rect(dx - 12, dy - H * 0.27, 24, H * 0.05, P.paper) + circle(dx, dy - H * 0.28, 8, P.c("#c9a25a"));
    // campanile
    s += rect(W * 0.38, H * 0.16, W * 0.05, H * 0.34, P.c("#e3d7c0")) + rect(W * 0.38, H * 0.16, W * 0.05, H * 0.04, P.c("#b9a98a")) + rect(W * 0.39, H * 0.21, W * 0.03, H * 0.04, P.c("#7a6d5a"));
    // roofs
    for (let row = 0; row < 5; row++) {
      const y = H * (0.5 + row * 0.11);
      let x = -40 + ctx.r() * 60;
      while (x < W) {
        const w = between(ctx, 110, 210);
        const h = between(ctx, 40, 80);
        const c = [P.terracotta, P.c("#b85a3a"), P.c("#d07e55"), P.c("#a9553a")][Math.floor(ctx.r() * 4)];
        s += rect(x, y, w, H * 0.2, P.c("#e9dcc2"));
        s += poly([[x - 8, y], [x + w * between(ctx, 0.3, 0.7), y - h], [x + w + 8, y]], c);
        for (let k = 0; k < 3; k++) s += rect(x + w * (0.15 + k * 0.28), y + 24, 14, 22, P.c("#5c4a3b"), `opacity="0.6"`);
        x += w + between(ctx, -20, 10);
      }
    }
    return s;
  },

  blanket(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#e9e0cf"));
    for (let y = 0; y < H; y += 26) {
      for (let x = (y / 26) % 2 ? 0 : 13; x < W; x += 26) s += path(`M${x},${y} q6,12 13,13 q7,-1 13,-13`, "none", `stroke="${P.c("#d6c9b0")}" stroke-width="4" opacity="0.75"`);
    }
    s += poly([[W * 0.25, 0], [W * 0.75, 0], [W * 0.95, H], [W * 0.3, H]], P.light, `opacity="0.5" ${blur(ctx, 34)}`);
    // a spring branch across the top
    s += path(`M${f(-20)},${f(H * 0.12)} C${f(W * 0.25)},${f(H * 0.05)} ${f(W * 0.45)},${f(H * 0.2)} ${f(W * 0.62)},${f(H * 0.1)}`, "none", `stroke="${P.woodDark}" stroke-width="7" stroke-linecap="round"`);
    for (let i = 0; i < 9; i++) {
      const x = between(ctx, W * 0.05, W * 0.6), y = H * 0.1 + between(ctx, -30, 40);
      s += circle(x, y, between(ctx, 9, 15), P.c("#f2d4d4")) + circle(x, y, 4, P.c("#d99a9a"));
    }
    // two knitted booties
    const bootie = (x: number, y: number, rot: number, c: string, cuff: string) => {
      let g = `<g transform="rotate(${rot} ${f(x)} ${f(y)})">`;
      g += ellipse(x + W * 0.05, y + H * 0.13, W * 0.13, H * 0.03, P.shadow, `opacity="0.18" ${blur(ctx, 10)}`);
      g += path(`M${f(x - W * 0.06)},${f(y - H * 0.02)} L${f(x - W * 0.06)},${f(y + H * 0.08)} Q${f(x - W * 0.06)},${f(y + H * 0.13)} ${f(x + W * 0.02)},${f(y + H * 0.13)} L${f(x + W * 0.15)},${f(y + H * 0.13)} Q${f(x + W * 0.2)},${f(y + H * 0.13)} ${f(x + W * 0.19)},${f(y + H * 0.08)} Q${f(x + W * 0.17)},${f(y + H * 0.04)} ${f(x + W * 0.06)},${f(y + H * 0.04)} L${f(x + W * 0.06)},${f(y - H * 0.02)} Z`, c);
      g += rect(x - W * 0.075, y - H * 0.07, W * 0.15, H * 0.07, cuff, `rx="10"`);
      for (let k = 0; k < 7; k++) g += line(x - W * 0.065 + k * W * 0.022, y - H * 0.065, x - W * 0.065 + k * W * 0.022, y - H * 0.005, P.c("#ffffff"), 2, `opacity="0.35"`);
      g += path(`M${f(x - W * 0.06)},${f(y + H * 0.03)} q${f(W * 0.06)},12 ${f(W * 0.12)},0`, "none", `stroke="${cuff}" stroke-width="5" stroke-linecap="round"`);
      g += circle(x + W * 0.065, y + H * 0.035, 9, cuff);
      return g + `</g>`;
    };
    s += `<g transform="translate(${f(-W * 0.17)} ${f(-H * 0.2)}) scale(1.36)">`;
    s += bootie(W * 0.36, H * 0.52, -8, P.c("#f3ece0"), P.c("#b9cbbf"));
    s += bootie(W * 0.6, H * 0.6, 10, P.c("#f3ece0"), P.c("#b9cbbf"));
    s += `</g>`;
    return s;
  },

  workshop(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#c4b393"));
    for (let y = 30; y < H * 0.62; y += 34) for (let x = 30; x < W; x += 34) s += circle(x, y, 3, P.c("#8f7d5c"), `opacity="0.6"`);
    // tools
    s += `<g fill="${P.c("#3c3a36")}">${rect(W * 0.1, H * 0.12, 12, H * 0.2, P.c("#3c3a36"))}${rect(W * 0.08, H * 0.1, 44, 22, P.c("#3c3a36"), `rx="4"`)}`;
    s += path(`M${f(W * 0.22)},${f(H * 0.1)} L${f(W * 0.34)},${f(H * 0.1)} L${f(W * 0.34)},${f(H * 0.38)} L${f(W * 0.22)},${f(H * 0.32)} Z`, P.metal) + rect(W * 0.31, H * 0.08, 50, 40, P.woodDark, `rx="8"`);
    for (let i = 0; i < 5; i++) s += rect(W * (0.42 + i * 0.035), H * 0.12, 8, H * (0.12 + i * 0.015), P.metal) + rect(W * (0.42 + i * 0.035) - 3, H * 0.08, 14, H * 0.05, P.woodLight);
    s += circle(W * 0.72, H * 0.22, 54, "none", `stroke="${P.c("#3c3a36")}" stroke-width="10"`) + `</g>`;
    // window light
    s += poly([[W * 0.8, 0], [W, 0], [W, H * 0.7], [W * 0.55, H * 0.7]], P.light, `opacity="0.35" ${blur(ctx, 16)}`);
    // bench
    s += rect(0, H * 0.62, W, H * 0.06, P.wood) + rect(0, H * 0.68, W, H * 0.32, P.woodDark);
    s += rect(W * 0.05, H * 0.68, 26, H * 0.32, P.c("#4a3220")) + rect(W * 0.9, H * 0.68, 26, H * 0.32, P.c("#4a3220"));
    // bandsaw
    s += rect(W * 0.62, H * 0.3, W * 0.12, H * 0.32, P.c("#4d5b57"), `rx="18"`) + rect(W * 0.645, H * 0.36, W * 0.07, H * 0.18, P.c("#c4b393"), `rx="8"`) + rect(W * 0.6, H * 0.55, W * 0.16, 12, P.metal);
    // pencil
    s += `<g transform="rotate(-14 ${f(W * 0.58)} ${f(H * 0.6)})">${rect(W * 0.5, H * 0.6, W * 0.1, 10, P.yellow)}${poly([[W * 0.6, H * 0.6], [W * 0.62, H * 0.6 + 5], [W * 0.6, H * 0.6 + 10]], P.c("#e8c9a0"))}</g>`;
    // shavings + motes
    for (let i = 0; i < 14; i++) s += path(`M${f(between(ctx, W * 0.1, W * 0.5))},${f(between(ctx, H * 0.6, H * 0.63))} q10,-10 20,0 q-8,8 -16,2`, "none", `stroke="${P.woodLight}" stroke-width="3"`);
    for (let i = 0; i < 40; i++) s += circle(between(ctx, W * 0.55, W), between(ctx, 0, H * 0.6), between(ctx, 1, 2.5), P.light, `opacity="${f(between(ctx, 0.3, 0.8))}"`);
    return s;
  },

  pancakes(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#e9e3d6"));
    for (let i = 0; i < 6; i++) s += poly([[0, H * (i * 0.18)], [W, H * (i * 0.18 - 0.08)], [W, H * (i * 0.18 - 0.03)], [0, H * (i * 0.18 + 0.05)]], P.light, `opacity="0.4"`);
    s += circle(W * 0.82, H * 0.2, W * 0.12, P.paper) + circle(W * 0.82, H * 0.2, W * 0.085, P.c("#4b2e1d"));
    s += ellipse(W * 0.5, H * 0.66, W * 0.42, H * 0.22, P.c("#2f6fa3"));
    s += ellipse(W * 0.5, H * 0.66, W * 0.34, H * 0.17, P.paper);
    for (let i = 0; i < 6; i++) {
      const y = H * (0.66 - i * 0.04);
      s += ellipse(W * 0.5 + (i === 5 ? 6 : 0), y + 8, W * 0.26, H * 0.075, P.c("#a86a35"));
      s += ellipse(W * 0.5 + (i === 5 ? 6 : 0), y, W * 0.26, H * 0.07, i === 5 ? P.c("#d29a5a") : P.c("#c7894c"));
    }
    s += rect(W * 0.44, H * 0.405, W * 0.12, H * 0.035, P.c("#f6e6a3"), `rx="6"`);
    s += path(`M${f(W * 0.36)},${f(H * 0.45)} q-6,40 4,${f(H * 0.17)} q8,-30 8,-70`, P.c("#8a4a1e"), `opacity="0.75"`);
    s += `<g transform="rotate(10 ${f(W * 0.9)} ${f(H * 0.75)})">${rect(W * 0.88, H * 0.5, 14, H * 0.42, P.metal, `rx="6"`)}</g>`;
    return s;
  },

  porch(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#b7cbd5"), P.c("#f1e6cf"), H * 0.55);
    s += rect(0, H * 0.42, W, H * 0.16, lin(ctx, [[0, P.c("#6a8e9d")], [1, P.c("#9eb6bb")]]));
    s += waterLines(ctx, H * 0.43, H * 0.57, P.light, 40, 0.5);
    s += ridge(ctx, H * 0.43, 16, 4, P.c("#7d8c7e"), "", W * 0.7, W, H * 0.58);
    // porch
    s += poly([[0, H * 0.58], [W, H * 0.58], [W, H], [0, H]], P.c("#b49a77"));
    for (let i = 0; i < 12; i++) s += line(0, H * 0.58 + i * i * 2.6, W, H * 0.58 + i * i * 2.6, P.c("#8a7254"), 2, `opacity="0.6"`);
    s += rect(0, H * 0.5, W, 10, P.plaster);
    for (let x = 10; x < W; x += 70) s += rect(x, H * 0.5, 9, H * 0.08, P.plaster, `opacity="0.92"`);
    s += rect(W * 0.04, 0, 22, H * 0.6, P.plaster) + rect(W * 0.94, 0, 22, H * 0.6, P.plaster);
    // chair from behind
    const cx = W * 0.55, cy = H * 0.86;
    s += ellipse(cx, cy + 10, W * 0.15, 16, P.shadow, `opacity="0.25"`);
    s += rect(cx - W * 0.11, cy - H * 0.36, W * 0.22, H * 0.32, P.c("#e9e3d4"), `rx="6"`);
    for (let i = 0; i < 5; i++) s += rect(cx - W * 0.1 + i * W * 0.044, cy - H * 0.38, W * 0.035, H * 0.34, P.paper, `rx="5"`);
    s += rect(cx - W * 0.15, cy - H * 0.16, W * 0.06, H * 0.02, P.paper) + rect(cx + W * 0.09, cy - H * 0.16, W * 0.06, H * 0.02, P.paper);
    s += rect(cx - W * 0.14, cy - H * 0.14, 10, H * 0.16, P.c("#d9d2c2")) + rect(cx + W * 0.13, cy - H * 0.14, 10, H * 0.16, P.c("#d9d2c2"));
    s += path(`M${f(cx - W * 0.06)},${f(cy - H * 0.36)} q${f(W * 0.05)},${f(H * 0.1)} ${f(W * 0.02)},${f(H * 0.28)} l${f(W * 0.06)},0 q${f(-W * 0.02)},${f(-H * 0.18)} ${f(W * 0.03)},${f(-H * 0.28)} Z`, P.c("#8c4a3a"), `opacity="0.85"`);
    return s;
  },

  bluebowl(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.wall);
    const wx = W * 0.1, wy = H * 0.08, ww = W * 0.8, wh = H * 0.5;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.c("#c5d8e2")], [0.62, P.c("#e7eef0")], [0.63, P.c("#6f9aab")], [1, P.c("#8db0ba")]]));
    s += waterLines(ctx, wy + wh * 0.64, wy + wh, P.light, 30, 0.5);
    s += windowFrame(wx, wy, ww, wh, P.plaster, 3, 14);
    s += rect(0, wy + wh + 20, W, 34, P.plaster) + rect(0, wy + wh + 54, W, 10, P.wallShade);
    const bx = W * 0.46, by = wy + wh + 20;
    // contents
    const glass = [P.c("#9fd1c4"), P.c("#cfe6e2"), P.c("#7fb8a6"), P.c("#e9f0ea"), P.c("#9cc0d6")];
    for (let i = 0; i < 9; i++) s += poly([[bx + between(ctx, -110, 110), by - 52 + between(ctx, -14, 8)], [bx + between(ctx, -110, 110), by - 42], [bx + between(ctx, -110, 110), by - 30]], glass[i % 5], `opacity="0.9"`);
    s += `<g transform="rotate(-12 ${f(bx + 40)} ${f(by - 60)})">${rect(bx + 20, by - 80, 46, 30, P.paper)}${line(bx + 26, by - 70, bx + 58, by - 70, P.ink, 1.5, `opacity="0.5"`)}</g>`;
    s += `<g transform="rotate(8 ${f(bx - 60)} ${f(by - 60)})">${rect(bx - 80, by - 74, 40, 26, P.c("#f3e9cf"))}</g>`;
    s += path(`M${f(bx - 150)},${f(by - 40)} Q${f(bx - 140)},${f(by + 6)} ${f(bx)},${f(by + 8)} Q${f(bx + 140)},${f(by + 6)} ${f(bx + 150)},${f(by - 40)} Z`, P.glaze);
    s += ellipse(bx, by - 40, 150, 12, P.c("#1f4d75"), `opacity="0.6"`);
    s += path(`M${f(bx - 120)},${f(by - 30)} Q${f(bx - 100)},${f(by - 6)} ${f(bx - 40)},${f(by)}`, "none", `stroke="${P.c("#9cc6e4")}" stroke-width="6" opacity="0.6" stroke-linecap="round"`);
    // plant
    s += rect(W * 0.8, by - 70, 60, 70, P.terracotta);
    for (let i = 0; i < 5; i++) s += ellipse(W * 0.83 + between(ctx, -30, 30), by - 100 - between(ctx, 0, 50), 12, 30, P.green, `transform="rotate(${f(between(ctx, -40, 40))} ${f(W * 0.83)} ${f(by - 80)})"`);
    s += rect(0, H * 0.66, W, H * 0.34, P.c("#e8dfcb"));
    return s;
  },

  kiln(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.night, P.c("#2c3550"));
    for (let i = 0; i < 60; i++) s += circle(between(ctx, 0, W), between(ctx, 0, H * 0.45), between(ctx, 0.6, 1.8), P.paper, `opacity="${f(between(ctx, 0.3, 0.9))}"`);
    s += rect(0, H * 0.78, W, H * 0.22, P.c("#1b2028"));
    s += rect(W * 0.08, H * 0.3, W * 0.28, H * 0.48, P.c("#232934")) + poly([[W * 0.05, H * 0.3], [W * 0.22, H * 0.16], [W * 0.39, H * 0.3]], P.c("#1c212b"));
    s += rect(W * 0.14, H * 0.42, W * 0.06, H * 0.08, P.c("#e5b96a"), `opacity="0.8"`);
    // garage
    s += rect(W * 0.42, H * 0.36, W * 0.5, H * 0.42, P.c("#262b36")) + poly([[W * 0.4, H * 0.36], [W * 0.67, H * 0.24], [W * 0.94, H * 0.36]], P.c("#1f232c"));
    s += rect(W * 0.48, H * 0.44, W * 0.38, H * 0.34, P.c("#f08a3c"));
    s += rect(W * 0.48, H * 0.44, W * 0.38, H * 0.34, rad(ctx, [[0, P.c("#ffd27a")], [1, P.c("#c2502a")]], 0.5, 0.65, 0.7));
    s += rect(W * 0.58, H * 0.52, W * 0.18, H * 0.24, P.c("#5a3a2a"), `rx="6"`) + rect(W * 0.6, H * 0.56, W * 0.14, H * 0.08, P.c("#ffcf6e"), `rx="4"`);
    s += circle(W * 0.67, H * 0.6, 220, P.c("#ff9a4a"), `opacity="0.35" ${blur(ctx, 50)}`);
    s += poly([[W * 0.48, H * 0.78], [W * 0.86, H * 0.78], [W, H], [W * 0.3, H]], P.c("#f08a3c"), `opacity="0.25" ${blur(ctx, 10)}`);
    const sm = blur(ctx, 20);
    for (let i = 0; i < 5; i++) s += circle(W * 0.72 + between(ctx, -40, 60), H * 0.2 - i * 30, between(ctx, 30, 60), P.c("#8c8c96"), `opacity="${f(0.3 - i * 0.04)}" ${sm}`);
    return s;
  },

  radio(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#cfc6b4"));
    s += circle(W * 0.18, H * 0.12, 260, P.light, `opacity="0.5" ${blur(ctx, 50)}`);
    s += path(`M${f(W * 0.1)},0 L${f(W * 0.16)},${f(H * 0.16)} L${f(W * 0.26)},${f(H * 0.16)} L${f(W * 0.32)},0`, P.c("#4a4a46"));
    s += rect(0, H * 0.66, W, H * 0.34, P.wood);
    for (let i = 0; i < 5; i++) s += line(0, H * (0.7 + i * 0.06), W, H * (0.69 + i * 0.065), P.woodDark, 2, `opacity="0.4"`);
    const rx = W * 0.3, ry = H * 0.3, rw = W * 0.4, rh = H * 0.38;
    s += rect(rx, ry, rw, rh, P.c("#6a4a32"), `rx="40"`) + rect(rx + 18, ry + 18, rw - 36, rh - 36, P.c("#7d5a3e"), `rx="28"`);
    s += circle(rx + rw * 0.33, ry + rh * 0.48, rh * 0.28, P.c("#d9c9a3"));
    for (let i = -4; i <= 4; i++) s += line(rx + rw * 0.33 + i * 10, ry + rh * 0.24, rx + rw * 0.33 + i * 10, ry + rh * 0.72, P.c("#7d5a3e"), 3, `opacity="0.6"`);
    s += rect(rx + rw * 0.6, ry + rh * 0.3, rw * 0.28, rh * 0.18, P.c("#efe3c2"), `rx="6"`) + line(rx + rw * 0.66, ry + rh * 0.3, rx + rw * 0.66, ry + rh * 0.48, P.red, 2);
    s += circle(rx + rw * 0.66, ry + rh * 0.7, 18, P.c("#3a2a1e")) + circle(rx + rw * 0.82, ry + rh * 0.7, 18, P.c("#3a2a1e"));
    s += path(`M${f(rx + rw)},${f(ry + rh * 0.8)} C${f(W * 0.85)},${f(H * 0.75)} ${f(W * 0.8)},${f(H * 0.9)} ${f(W * 0.95)},${f(H * 0.86)}`, "none", `stroke="${P.red}" stroke-width="4"`);
    s += path(`M${f(rx)},${f(ry + rh * 0.85)} C${f(W * 0.18)},${f(H * 0.8)} ${f(W * 0.15)},${f(H * 0.92)} ${f(W * 0.05)},${f(H * 0.88)}`, "none", `stroke="${P.c("#2a2a2a")}" stroke-width="4"`);
    s += `<g transform="rotate(-20 ${f(W * 0.8)} ${f(H * 0.75)})">${rect(W * 0.72, H * 0.74, W * 0.16, 12, P.metal, `rx="5"`)}${rect(W * 0.86, H * 0.735, W * 0.08, 18, P.c("#3a2a1e"), `rx="6"`)}</g>`;
    return s;
  },

  classroom(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#e3dcc8"));
    s += rect(W * 0.06, H * 0.12, W * 0.56, H * 0.4, P.c("#2f4a3c")) + rect(W * 0.05, H * 0.52, W * 0.58, 12, P.woodDark);
    const chalk = `stroke="${P.c("#e9efe6")}" stroke-width="3" fill="none" opacity="0.85"`;
    s += `<circle cx="${f(W * 0.2)}" cy="${f(H * 0.3)}" r="18" ${chalk}/><ellipse cx="${f(W * 0.2)}" cy="${f(H * 0.3)}" rx="80" ry="34" ${chalk}/><ellipse cx="${f(W * 0.2)}" cy="${f(H * 0.3)}" rx="120" ry="58" ${chalk}/>`;
    s += circle(W * 0.2 + 80, H * 0.3, 7, P.c("#e9efe6"));
    s += `<path d="M${f(W * 0.38)},${f(H * 0.22)} l120,0 m-12,-8 l12,8 l-12,8 M${f(W * 0.38)},${f(H * 0.32)} q30,-30 60,0 t60,0 M${f(W * 0.38)},${f(H * 0.42)} l40,0 m10,0 l12,0 m10,-10 l0,20" ${chalk}/>`;
    // windows
    for (let i = 0; i < 2; i++) {
      const x = W * (0.68 + i * 0.16), y = H * 0.08;
      s += rect(x, y, W * 0.12, H * 0.5, lin(ctx, [[0, P.sky], [1, P.light]])) + windowFrame(x, y, W * 0.12, H * 0.5, P.plaster, 1, 10);
      s += path(`M${f(x - 6)},${f(y)} q${f(W * 0.06)},${f(H * 0.2)} ${f(-W * 0.02)},${f(H * 0.45)} l-14,0 l0,${f(-H * 0.45)} Z`, P.c("#efe4c4"), `opacity="0.9"`);
    }
    s += poly([[W * 0.66, H * 0.58], [W, H * 0.58], [W, H], [W * 0.3, H]], P.light, `opacity="0.25" ${blur(ctx, 14)}`);
    // desks
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const sc = 0.7 + r * 0.25;
        const x = W * (0.12 + c * 0.28) - r * 30, y = H * (0.66 + r * 0.11);
        s += rect(x, y, W * 0.18 * sc, H * 0.04 * sc, P.woodLight) + rect(x + 8, y + H * 0.04 * sc, 8 * sc, H * 0.08 * sc, P.metal) + rect(x + W * 0.18 * sc - 16, y + H * 0.04 * sc, 8 * sc, H * 0.08 * sc, P.metal);
      }
    return s;
  },

  canoe(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#c9d6dc"), P.c("#f3eadb"), H * 0.5);
    s += ridge(ctx, H * 0.3, 70, 4, P.c("#8c9da1"), `opacity="0.7"`);
    s += rect(0, H * 0.48, W, H * 0.52, lin(ctx, [[0, P.c("#a7bcc0")], [1, P.c("#4f6f74")]]));
    // shore pines + reflections
    let pines = "", refl = "";
    for (let i = 0; i < 26; i++) {
      const x = i * (W / 25) + between(ctx, -14, 14);
      const h = between(ctx, 70, 150);
      pines += pine(x, H * 0.5, h, h * 0.42, P.greenDark);
      refl += pine(x, H * 0.5, h, h * 0.42, P.greenDark);
    }
    s += pines + `<g transform="translate(0 ${f(H)}) scale(1 -1)" opacity="0.32">${refl}</g>`;
    s += rect(0, H * 0.48, W, 6, P.greenDark);
    const mb = blur(ctx, 18);
    for (let i = 0; i < 4; i++) s += ellipse(between(ctx, 0, W), H * 0.5 + between(ctx, -10, 10), between(ctx, 160, 300), 18, P.fog, `opacity="0.55" ${mb}`);
    s += waterLines(ctx, H * 0.55, H, P.light, 50, 0.3);
    // canoe
    const cx = W * 0.55, cy = H * 0.72, cw = W * 0.34;
    s += path(`M${f(cx - cw / 2)},${f(cy)} Q${f(cx)},${f(cy + 42)} ${f(cx + cw / 2)},${f(cy)} Q${f(cx)},${f(cy + 14)} ${f(cx - cw / 2)},${f(cy)} Z`, P.red);
    s += path(`M${f(cx - cw / 2)},${f(cy)} Q${f(cx)},${f(cy + 14)} ${f(cx + cw / 2)},${f(cy)}`, "none", `stroke="${P.c("#7a2418")}" stroke-width="4"`);
    s += path(`M${f(cx - cw / 2)},${f(cy + 4)} Q${f(cx)},${f(cy + 50)} ${f(cx + cw / 2)},${f(cy + 4)}`, "none", `stroke="${P.red}" stroke-width="10" opacity="0.2"`);
    s += figure(cx - cw * 0.22, cy + 10, H * 0.14, P.c("#3a4a5a"), P.c("#e2c4a8"));
    s += figure(cx + cw * 0.22, cy + 10, H * 0.17, P.c("#4a3a2e"), P.c("#e2c4a8"));
    s += line(cx + cw * 0.22 + 20, cy - 60, cx + cw * 0.4, cy + 40, P.woodDark, 5);
    return s;
  },

  rocker(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#cdbb98"));
    s += rect(W * 0.6, H * 0.08, W * 0.3, H * 0.34, lin(ctx, [[0, P.sky], [1, P.light]])) + windowFrame(W * 0.6, H * 0.08, W * 0.3, H * 0.34, P.c("#a58f6a"), 2, 12);
    s += poly([[W * 0.6, H * 0.42], [W * 0.9, H * 0.42], [W * 0.7, H], [0, H]], P.light, `opacity="0.35" ${blur(ctx, 18)}`);
    s += rect(0, H * 0.72, W, H * 0.28, P.c("#a88d66"));
    for (let i = 0; i < 18; i++) s += path(`M${f(between(ctx, 0, W))},${f(between(ctx, H * 0.78, H))} q10,-12 22,0 q-10,10 -18,2`, "none", `stroke="${P.woodLight}" stroke-width="3"`);
    const c = P.c("#8f3f22"), d = P.c("#6e2d17");
    const x = W * 0.28, y = H * 0.82;
    s += path(`M${f(x - 40)},${f(y + 20)} Q${f(x + W * 0.2)},${f(y + 60)} ${f(x + W * 0.5)},${f(y + 10)}`, "none", `stroke="${d}" stroke-width="16" stroke-linecap="round"`);
    s += rect(x, y - H * 0.18, 16, H * 0.2, c) + rect(x + W * 0.32, y - H * 0.18, 16, H * 0.22, c);
    s += rect(x - 6, y - H * 0.2, W * 0.36, 26, c, `rx="6"`);
    s += rect(x + W * 0.3, y - H * 0.62, 18, H * 0.44, d, `transform="rotate(-8 ${f(x + W * 0.3)} ${f(y - H * 0.2)})"`);
    s += rect(x + W * 0.02, y - H * 0.6, 18, H * 0.42, c, `transform="rotate(-8 ${f(x)} ${f(y - H * 0.2)})"`);
    for (let i = 0; i < 4; i++) s += rect(x + W * (0.06 + i * 0.065), y - H * 0.56, 12, H * 0.34, c, `transform="rotate(-8 ${f(x + W * 0.15)} ${f(y - H * 0.2)})"`);
    s += rect(x - 10, y - H * 0.6, W * 0.38, 22, d, `rx="10" transform="rotate(-8 ${f(x + W * 0.15)} ${f(y - H * 0.2)})"`);
    return s;
  },

  backyard(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#b5d0dd"), P.c("#f6efd9"), H * 0.7);
    s += circle(W * 0.8, H * 0.18, 70, P.light, `opacity="0.85" ${blur(ctx, 20)}`);
    s += rect(0, H * 0.52, W, H * 0.12, P.c("#c4b090"));
    for (let x = 0; x < W; x += 30) s += rect(x, H * 0.46, 22, H * 0.18, P.c("#d8c8a6")) + poly([[x, H * 0.46], [x + 11, H * 0.43], [x + 22, H * 0.46]], P.c("#d8c8a6"));
    s += rect(0, H * 0.62, W, H * 0.38, lin(ctx, [[0, P.green], [1, P.c("#58733f")]]));
    for (let i = 0; i < 180; i++) {
      const x = between(ctx, 0, W), y = between(ctx, H * 0.64, H);
      s += line(x, y, x + between(ctx, -8, 8), y - between(ctx, 14, 40), P.c("#9db06c"), 2, `opacity="0.6"`);
    }
    // tree + swing
    s += path(`M${f(W * 0.24)},${H} L${f(W * 0.26)},${f(H * 0.3)} L${f(W * 0.31)},${f(H * 0.3)} L${f(W * 0.32)},${H} Z`, P.woodDark);
    s += line(W * 0.28, H * 0.34, W * 0.62, H * 0.24, P.woodDark, 18);
    for (let i = 0; i < 10; i++) s += circle(W * 0.32 + between(ctx, -200, 260), H * 0.15 + between(ctx, -60, 60), between(ctx, 70, 120), i % 2 ? P.green : P.greenDark, `opacity="0.94"`);
    s += line(W * 0.48, H * 0.29, W * 0.47, H * 0.68, P.c("#e3d4b0"), 3) + line(W * 0.56, H * 0.26, W * 0.56, H * 0.67, P.c("#e3d4b0"), 3);
    s += rect(W * 0.455, H * 0.67, W * 0.12, 14, P.woodLight, `rx="4"`);
    s += line(W * 0.7, H * 0.36, W, H * 0.33, P.paper, 2) + rect(W * 0.78, H * 0.355, 50, 70, P.c("#e9c9c0")) + rect(W * 0.86, H * 0.345, 40, 56, P.paper);
    return s;
  },

  dock(ctx) {
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#8a8fb0"), P.c("#f4b98a"), H * 0.55);
    s += circle(W * 0.5, H * 0.5, 54, P.c("#fde3b0")) + circle(W * 0.5, H * 0.5, 160, P.c("#fde3b0"), `opacity="0.35" ${blur(ctx, 40)}`);
    s += ridge(ctx, H * 0.53, 14, 6, P.c("#5b5868"), `opacity="0.9"`);
    s += rect(0, H * 0.55, W, H * 0.45, lin(ctx, [[0, P.c("#c79a86")], [1, P.c("#3e4157")]]));
    s += rect(W * 0.46, H * 0.55, W * 0.08, H * 0.45, lin(ctx, [[0, P.c("#fde3b0"), 0.85], [1, P.c("#fde3b0"), 0]]), blur(ctx, 6));
    s += waterLines(ctx, H * 0.56, H, P.c("#fbd3a0"), 50, 0.45);
    // dock perspective
    s += poly([[W * 0.47, H * 0.6], [W * 0.53, H * 0.6], [W * 0.78, H], [W * 0.22, H]], P.c("#5e4634"));
    for (let i = 0; i < 16; i++) {
      const t = Math.pow(i / 16, 1.7);
      const y = H * 0.6 + H * 0.4 * t;
      const half = W * 0.03 + W * 0.25 * t;
      s += line(W * 0.5 - half, y, W * 0.5 + half, y, P.c("#3d2c20"), 1 + t * 4);
    }
    for (let i = 0; i < 5; i++) {
      const t = Math.pow(i / 5, 1.6);
      const y = H * 0.6 + H * 0.4 * t;
      const half = W * 0.03 + W * 0.25 * t;
      s += rect(W * 0.5 - half - 4 - t * 10, y - 30 * (0.3 + t), 6 + t * 16, 50 * (0.3 + t) + 20, P.c("#2f241b"));
      s += rect(W * 0.5 + half - 2, y - 30 * (0.3 + t), 6 + t * 16, 50 * (0.3 + t) + 20, P.c("#2f241b"));
    }
    s += rect(W * 0.485, H * 0.585, 16, 14, P.c("#2f241b")) + rect(W * 0.488, H * 0.565, 4, 20, P.c("#2f241b"));
    return s;
  },

  nightlight(ctx) {
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#2a2f3a"));
    const wx = W * 0.18, wy = H * 0.1, ww = W * 0.64, wh = H * 0.5;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.c("#0f1830")], [1, P.c("#2c3c62")]]));
    for (let i = 0; i < 40; i++) s += circle(wx + between(ctx, 0, ww), wy + between(ctx, 0, wh * 0.8), between(ctx, 0.7, 2), P.paper, `opacity="${f(between(ctx, 0.4, 1))}"`);
    s += circle(wx + ww * 0.72, wy + wh * 0.25, 30, P.c("#f3ecd3")) + circle(wx + ww * 0.72 + 12, wy + wh * 0.25 - 6, 26, P.c("#1a2440"));
    s += ridge(ctx, wy + wh * 0.84, 16, 5, P.c("#151b2b"), "", wx, wx + ww, wy + wh);
    for (let i = 0; i < 6; i++) s += rect(wx + between(ctx, 0, ww - 20), wy + wh * 0.88, 8, 10, P.c("#f0c672"), `opacity="0.85"`);
    s += windowFrame(wx, wy, ww, wh, P.c("#3c4352"), 2, 14);
    s += rect(0, wy + wh + 20, W, 26, P.c("#3c4352"));
    // lamp
    const lx = W * 0.3, ly = wy + wh + 20;
    s += circle(lx, ly - 60, 200, P.c("#f6c983"), `opacity="0.3" ${blur(ctx, 50)}`);
    s += rect(lx - 6, ly - 70, 12, 70, P.c("#7a6a52")) + poly([[lx - 50, ly - 70], [lx + 50, ly - 70], [lx + 34, ly - 130], [lx - 34, ly - 130]], P.c("#f5d9a4"));
    s += rect(lx - 26, ly - 10, 52, 10, P.c("#5a4c3a"));
    s += rect(0, H * 0.66, W, H * 0.34, P.c("#30353f"));
    s += path(`M${f(W * 0.62)},${H} Q${f(W * 0.9)},${f(H * 0.88)} ${f(W * 1.1)},${H}`, "none", `stroke="${P.c("#5a4c3a")}" stroke-width="16"`);
    return s;
  },

  portrait(ctx) {
    // Abstract editorial portrait: a profile silhouette over a contour ground.
    // Never a likeness of a real person.
    const { P, W, H } = ctx;
    const variant = Math.floor(ctx.r() * 1000) % 3;
    const grounds = [P.c("#4f6b5f"), P.c("#9a6a45"), P.c("#56697c")];
    const halos = [P.c("#f1e3c8"), P.c("#f3dfc0"), P.c("#e6e1d6")];
    let s = rect(0, 0, W, H, grounds[variant]);
    s += circle(W * 0.56, H * 0.42, W * 0.36, halos[variant], `opacity="0.94"`);
    for (let i = 0; i < 14; i++) s += ellipse(W * 0.5, H * 0.92, W * (0.2 + i * 0.07), H * (0.06 + i * 0.03), "none", `stroke="${halos[variant]}" stroke-width="1.2" opacity="0.3"`);
    const sil = P.c("#26302b");
    // hair behind the head
    if (variant === 0) s += circle(W * 0.365, H * 0.29, W * 0.072, sil) + circle(W * 0.355, H * 0.29, W * 0.03, halos[0], `opacity="0.08"`);
    if (variant === 2) s += path(`M${f(W * 0.58)},${f(H * 0.18)} C${f(W * 0.42)},${f(H * 0.16)} ${f(W * 0.33)},${f(H * 0.3)} ${f(W * 0.36)},${f(H * 0.6)} Q${f(W * 0.42)},${f(H * 0.63)} ${f(W * 0.5)},${f(H * 0.58)} Z`, sil);
    // neck & shoulders
    s += path(`M${f(W * 0.18)},${H} Q${f(W * 0.22)},${f(H * 0.72)} ${f(W * 0.46)},${f(H * 0.68)} L${f(W * 0.47)},${f(H * 0.56)} L${f(W * 0.6)},${f(H * 0.56)} L${f(W * 0.62)},${f(H * 0.68)} Q${f(W * 0.86)},${f(H * 0.72)} ${f(W * 0.92)},${H} Z`, sil);
    // head profile facing right
    s += path(
      `M${f(W * 0.42)},${f(H * 0.4)} C${f(W * 0.4)},${f(H * 0.24)} ${f(W * 0.52)},${f(H * 0.17)} ${f(W * 0.6)},${f(H * 0.19)} C${f(W * 0.68)},${f(H * 0.21)} ${f(W * 0.7)},${f(H * 0.29)} ${f(W * 0.7)},${f(H * 0.33)} L${f(W * 0.73)},${f(H * 0.38)} L${f(W * 0.7)},${f(H * 0.395)} C${f(W * 0.705)},${f(H * 0.42)} ${f(W * 0.69)},${f(H * 0.44)} ${f(W * 0.7)},${f(H * 0.45)} C${f(W * 0.69)},${f(H * 0.47)} ${f(W * 0.66)},${f(H * 0.5)} ${f(W * 0.6)},${f(H * 0.5)} L${f(W * 0.6)},${f(H * 0.58)} L${f(W * 0.47)},${f(H * 0.58)} C${f(W * 0.47)},${f(H * 0.52)} ${f(W * 0.43)},${f(H * 0.47)} ${f(W * 0.42)},${f(H * 0.4)} Z`,
      sil,
    );
    if (variant === 1) s += path(`M${f(W * 0.41)},${f(H * 0.36)} C${f(W * 0.4)},${f(H * 0.22)} ${f(W * 0.52)},${f(H * 0.15)} ${f(W * 0.63)},${f(H * 0.19)} L${f(W * 0.6)},${f(H * 0.23)} C${f(W * 0.52)},${f(H * 0.22)} ${f(W * 0.46)},${f(H * 0.27)} ${f(W * 0.45)},${f(H * 0.36)} Z`, P.c("#3a3530"));
    // collar line
    s += path(`M${f(W * 0.44)},${f(H * 0.69)} Q${f(W * 0.53)},${f(H * 0.75)} ${f(W * 0.64)},${f(H * 0.69)}`, "none", `stroke="${halos[variant]}" stroke-width="2" opacity="0.25"`);
    return s;
  },

  orchard(ctx) {
    // A wedding supper under fruit trees: string lights, a long table, two figures.
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#e9b98a"), P.c("#f6dfc0"), H * 0.6);
    s += rect(0, H * 0.58, W, H * 0.42, lin(ctx, [[0, P.c("#8c9a64")], [1, P.c("#5d6b40")]]));
    for (let i = 0; i < 7; i++) {
      const x = W * (0.04 + i * 0.16) + between(ctx, -12, 12);
      const base = H * (0.6 + between(ctx, -0.01, 0.02));
      s += rect(x - 5, base - H * 0.16, 10, H * 0.16, P.woodDark);
      s += ellipse(x, base - H * 0.22, W * 0.085, H * 0.1, P.c("#5f7a43"));
      s += ellipse(x - W * 0.03, base - H * 0.25, W * 0.05, H * 0.06, P.c("#78934f"), `opacity="0.8"`);
      for (let k = 0; k < 6; k++) s += circle(x + between(ctx, -W * 0.06, W * 0.06), base - H * between(ctx, 0.17, 0.29), 3.2, P.c("#e3b34a"));
    }
    // string lights in two swags
    for (const [y0, y1] of [[0.3, 0.34], [0.36, 0.41]]) {
      s += path(`M0,${f(H * y0)} Q${f(W * 0.5)},${f(H * (y1 + 0.08))} ${W},${f(H * y0)}`, "none", `stroke="${P.c("#3a3530")}" stroke-width="1.5" opacity="0.6"`);
      for (let i = 1; i < 18; i++) {
        const t = i / 18;
        const x = W * t;
        const y = (1 - t) * (1 - t) * H * y0 + 2 * (1 - t) * t * H * (y1 + 0.08) + t * t * H * y0;
        s += circle(x, y + 5, 4, P.light) + circle(x, y + 5, 11, P.light, `opacity="0.18"`);
      }
    }
    // long table with linen and candles
    s += rect(W * 0.08, H * 0.72, W * 0.84, H * 0.05, P.cream);
    s += rect(W * 0.08, H * 0.77, W * 0.84, H * 0.03, P.wallShade);
    for (let i = 0; i < 9; i++) {
      const x = W * (0.12 + i * 0.095);
      s += rect(x, H * 0.68, 4, H * 0.04, P.paper) + ellipse(x + 2, H * 0.675, 3, 6, P.light);
      s += ellipse(x + W * 0.03, H * 0.722, 14, 4, P.c("#e9e4d8"));
    }
    s += figure(W * 0.45, H * 0.9, H * 0.36, P.paper, P.c("#8b6a55"), true);
    s += figure(W * 0.56, H * 0.9, H * 0.39, P.c("#2f3439"), P.c("#5a4536"));
    return s;
  },

  roadtrip(ctx) {
    // Through a windscreen: coast road, sea to one side, a folded map on the dash.
    const { P, W, H } = ctx;
    let s = sky(ctx, P.skyHigh, P.sky, H * 0.5);
    s += clouds(ctx, H * 0.18, P.fog, 3, 0.75);
    s += rect(0, H * 0.42, W, H * 0.12, P.sea) + waterLines(ctx, H * 0.43, H * 0.53, P.fog, 26, 0.3);
    s += ridge(ctx, H * 0.4, 30, 5, P.c("#7d8c6a"), "", W * 0.55, W, H * 0.62);
    s += poly([[W * 0.38, H * 0.95], [W * 0.62, H * 0.95], [W * 0.53, H * 0.5], [W * 0.5, H * 0.5]], P.c("#5c5b57"));
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const y = H * (0.52 + t * 0.4);
      s += rect(W * 0.515 - t * 6, y, 3 + t * 6, H * 0.03 * (0.4 + t), P.c("#ece6d4"));
    }
    s += poly([[0, H * 0.55], [W * 0.38, H * 0.95], [0, H]], P.c("#a3b07f"));
    // car interior frame
    s += path(`M0,0 L${W},0 L${W},${f(H * 0.12)} Q${f(W * 0.5)},${f(H * 0.06)} 0,${f(H * 0.12)} Z`, P.shadow);
    s += poly([[0, 0], [W * 0.07, 0], [W * 0.14, H * 0.66], [0, H * 0.72]], P.shadow);
    s += poly([[W, 0], [W * 0.93, 0], [W * 0.86, H * 0.66], [W, H * 0.72]], P.shadow);
    s += path(`M0,${f(H * 0.66)} Q${f(W * 0.5)},${f(H * 0.6)} ${W},${f(H * 0.66)} L${W},${H} L0,${H} Z`, P.c("#3b3632"));
    // map and coffee cup on the dash
    s += poly([[W * 0.18, H * 0.66], [W * 0.38, H * 0.63], [W * 0.4, H * 0.7], [W * 0.2, H * 0.73]], P.paper);
    for (let i = 0; i < 4; i++) s += line(W * (0.21 + i * 0.045), H * 0.655, W * (0.225 + i * 0.045), H * 0.72, P.c("#c7bfa9"), 1.2);
    s += path(`M${f(W * 0.22)},${f(H * 0.69)} q${f(W * 0.05)},-${f(H * 0.03)} ${f(W * 0.1)},${f(H * 0.005)} t${f(W * 0.06)},-${f(H * 0.02)}`, "none", `stroke="${P.red}" stroke-width="2" opacity="0.8"`);
    s += rect(W * 0.72, H * 0.6, W * 0.05, H * 0.07, P.cream) + rect(W * 0.72, H * 0.6, W * 0.05, H * 0.012, P.c("#7a5b44"));
    s += line(W * 0.5, H * 0.12, W * 0.5, H * 0.2, P.shadow, 4) + rect(W * 0.45, H * 0.2, W * 0.1, H * 0.035, P.c("#2a2724"));
    return s;
  },

  ferry(ctx) {
    // A coastal ferry leaving the slip, smoke from the stack. Painted for silver tone.
    const { P, W, H } = ctx;
    let s = sky(ctx, P.c("#b9c3c7"), P.fog, H * 0.55);
    s += clouds(ctx, H * 0.2, P.paper, 4, 0.6);
    s += ridge(ctx, H * 0.5, 22, 6, P.c("#8e958f"), `opacity="0.7"`, 0, W, H * 0.56);
    s += rect(0, H * 0.55, W, H * 0.45, lin(ctx, [[0, P.sea], [1, P.seaDeep]]));
    s += waterLines(ctx, H * 0.56, H, P.fog, 60, 0.35);
    // hull, decks, wheelhouse
    const x = W * 0.18, y = H * 0.5, w = W * 0.6;
    s += path(`M${f(x)},${f(y)} L${f(x + w)},${f(y)} L${f(x + w - w * 0.06)},${f(y + H * 0.1)} L${f(x + w * 0.05)},${f(y + H * 0.1)} Z`, P.c("#2e3135"));
    s += rect(x + w * 0.06, y - H * 0.08, w * 0.82, H * 0.08, P.paper);
    for (let i = 0; i < 10; i++) s += rect(x + w * (0.09 + i * 0.077), y - H * 0.065, w * 0.045, H * 0.035, P.c("#55595d"));
    s += rect(x + w * 0.2, y - H * 0.15, w * 0.32, H * 0.07, P.cream);
    s += rect(x + w * 0.58, y - H * 0.24, w * 0.07, H * 0.16, P.c("#2e3135"));
    s += rect(x + w * 0.58, y - H * 0.24, w * 0.07, H * 0.03, P.red);
    s += `<g ${blur(ctx, 9)} opacity="0.55">${ellipse(x + w * 0.66, y - H * 0.3, W * 0.05, H * 0.035, P.fog)}${ellipse(x + w * 0.76, y - H * 0.34, W * 0.07, H * 0.04, P.fog)}${ellipse(x + w * 0.9, y - H * 0.36, W * 0.09, H * 0.045, P.fog)}</g>`;
    s += ellipse(x + w * 0.5, y + H * 0.12, w * 0.55, H * 0.012, P.fog, `opacity="0.5"`);
    // pilings of the slip
    for (let i = 0; i < 5; i++) s += rect(W * (0.84 + i * 0.035), H * (0.46 + i * 0.01), 8, H * 0.2, P.woodDark);
    return s;
  },

  pie(ctx) {
    // A lattice pie cooling on an open sill, garden beyond.
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.wall);
    const wx = W * 0.12, wy = H * 0.08, ww = W * 0.76, wh = H * 0.5;
    s += rect(wx, wy, ww, wh, lin(ctx, [[0, P.sky], [1, P.c("#e8edd9")]]));
    s += ridge(ctx, wy + wh * 0.6, 26, 5, P.c("#88a160"), "", wx, wx + ww, wy + wh);
    for (let i = 0; i < 5; i++) s += circle(wx + ww * (0.15 + i * 0.18), wy + wh * 0.62, ww * 0.06, P.c("#6f8a4a"), `opacity="0.85"`);
    s += windowFrame(wx, wy, ww, wh, P.plaster, 2, 12);
    s += rect(wx - 30, wy + wh + 14, ww + 60, H * 0.06, P.woodLight);
    s += rect(0, wy + wh + 14 + H * 0.06, W, H, P.wallShade);
    // pie
    const cx = W * 0.5, cy = wy + wh + 6;
    s += ellipse(cx, cy + 4, W * 0.22, H * 0.05, P.shadow, `opacity="0.25" ${blur(ctx, 6)}`);
    s += ellipse(cx, cy, W * 0.2, H * 0.045, P.c("#c98b4b"));
    s += ellipse(cx, cy - 4, W * 0.18, H * 0.036, P.c("#e3b36f"));
    for (let i = -3; i <= 3; i++) {
      s += line(cx + i * W * 0.045 - W * 0.02, cy - H * 0.03, cx + i * W * 0.045 + W * 0.02, cy + H * 0.02, P.c("#f0cd8b"), 6, `stroke-linecap="round"`);
      s += line(cx - W * 0.16, cy - 4 + i * 4, cx + W * 0.16, cy - 4 + i * 4, P.c("#efc887"), 4, `opacity="0.75"`);
    }
    for (let i = 0; i < 5; i++) s += path(`M${f(cx - W * 0.06 + i * W * 0.03)},${f(cy - H * 0.06)} q8,-${f(H * 0.04)} 0,-${f(H * 0.08)}`, "none", `stroke="${P.paper}" stroke-width="3" opacity="0.4" stroke-linecap="round"`);
    // a folded tea towel
    s += poly([[W * 0.72, cy + 4], [W * 0.86, cy + 2], [W * 0.88, cy + 18], [W * 0.74, cy + 20]], P.c("#d9e2ea"));
    for (let i = 0; i < 4; i++) s += line(W * (0.74 + i * 0.035), cy + 3, W * (0.75 + i * 0.035), cy + 19, P.blue, 2, `opacity="0.6"`);
    return s;
  },

  table(ctx) {
    // A long family table from the end: many places, a window of evening light.
    const { P, W, H } = ctx;
    let s = rect(0, 0, W, H, P.c("#e7dcc6"));
    s += rect(W * 0.3, H * 0.06, W * 0.4, H * 0.32, lin(ctx, [[0, P.dusk], [1, P.skyWarm]]));
    s += windowFrame(W * 0.3, H * 0.06, W * 0.4, H * 0.32, P.plaster, 3, 10);
    s += path(`M${f(W * 0.5)},0 L${f(W * 0.5)},${f(H * 0.12)}`, "none", `stroke="${P.ink}" stroke-width="2"`);
    s += ellipse(W * 0.5, H * 0.14, W * 0.07, H * 0.02, P.c("#c9a46a"));
    s += circle(W * 0.5, H * 0.16, 9, P.light) + circle(W * 0.5, H * 0.16, 40, P.light, `opacity="0.15"`);
    // table in perspective
    s += poly([[W * 0.36, H * 0.42], [W * 0.64, H * 0.42], [W * 0.98, H * 0.98], [W * 0.02, H * 0.98]], P.cream);
    s += poly([[W * 0.36, H * 0.42], [W * 0.64, H * 0.42], [W * 0.62, H * 0.44], [W * 0.38, H * 0.44]], P.wallShade);
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const y = H * (0.46 + t * 0.44);
      const half = W * (0.15 + t * 0.32);
      for (const side of [-1, 1]) {
        const x = W * 0.5 + side * half * 0.78;
        s += ellipse(x, y, W * (0.025 + t * 0.03), H * (0.008 + t * 0.012), P.paper, `stroke="${P.wallShade}" stroke-width="2"`);
        s += figure(W * 0.5 + side * (half + W * (0.02 + t * 0.03)), y + H * (0.1 + t * 0.08), H * (0.16 + t * 0.26), [P.c("#5d6b7a"), P.c("#9a5a43"), P.c("#6f7a52"), P.c("#3d3a36")][(i + (side > 0 ? 1 : 0)) % 4], P.c("#7a5c48"));
      }
    }
    // dishes down the middle
    s += ellipse(W * 0.5, H * 0.58, W * 0.07, H * 0.025, P.c("#c27b45"));
    s += ellipse(W * 0.5, H * 0.75, W * 0.1, H * 0.035, P.glaze);
    s += ellipse(W * 0.5, H * 0.74, W * 0.08, H * 0.022, P.c("#e6d7b2"));
    for (const y of [0.5, 0.66, 0.85]) s += rect(W * 0.49, H * y - 22, 6, 22, P.paper) + ellipse(W * 0.493, H * y - 26, 3, 6, P.light);
    return s;
  },
};

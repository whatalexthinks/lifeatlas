import * as React from "react";
import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const bookColors = {
  evergreen: { cloth: "#4b5647", edge: "#3a4337", foil: "#dcc6a0" },
  oat: { cloth: "#d9cdb3", edge: "#c3b494", foil: "#6f5a36" },
  terracotta: { cloth: "#6e3a3e", edge: "#542b2f", foil: "#e8c9a6" },
  slate: { cloth: "#4b5d6e", edge: "#394856", foil: "#e6d3a8" },
  ink: { cloth: "#252421", edge: "#171614", foil: "#d7bc92" },
} as const;

export type BookColor = keyof typeof bookColors;

/** A cloth-bound book rendered in CSS — believable depth without WebGL. */
export function BookObject({
  title = "Margaret Ellis",
  subtitle = "In Her Own Words",
  years = "1940 —",
  color = "evergreen",
  material = "linen",
  foil = "brass",
  className,
  size = "md",
  eyebrow = "The Life & Stories of",
}: {
  title?: string;
  subtitle?: string;
  years?: string;
  color?: BookColor;
  material?: "linen" | "cloth" | "soft_touch";
  foil?: "brass" | "none" | "blind_deboss";
  className?: string;
  size?: "sm" | "md" | "lg";
  /** The small line above the title. Empty for books that aren't about one person. */
  eyebrow?: string;
}) {
  const c = bookColors[color];
  const texture =
    material === "linen"
      ? "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(0 0 0 / 0.05) 0 1px, transparent 1px 3px)"
      : material === "cloth"
        ? "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.03) 0 2px, transparent 2px 5px)"
        : "radial-gradient(120% 90% at 30% 20%, rgb(255 255 255 / 0.08), transparent 60%)";
  const foilColor = foil === "none" ? "rgb(255 255 255 / 0.85)" : foil === "blind_deboss" ? "rgb(0 0 0 / 0.28)" : c.foil;
  const textShadow = foil === "blind_deboss" ? "0 1px 0 rgb(255 255 255 / 0.12), 0 -1px 0 rgb(0 0 0 / 0.25)" : foil === "brass" ? "0 1px 0 rgb(0 0 0 / 0.25)" : "none";
  const w = size === "sm" ? 180 : size === "lg" ? 340 : 260;
  return (
    <div className={cn("relative", className)} style={{ width: w, aspectRatio: "0.78", perspective: "1600px" }} aria-hidden>
      <div className="absolute inset-0" style={{ transform: "rotateY(-14deg) rotateX(2deg)", transformStyle: "preserve-3d" }}>
        {/* pages */}
        <div className="absolute inset-y-[1.5%] right-[-3.5%] w-[6%] rounded-r-[3px]" style={{ background: "repeating-linear-gradient(90deg, #f3eee3 0 1px, #e3dccc 1px 2px)", transform: "translateZ(-6px)" }} />
        {/* cover */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[4px_8px_8px_4px]"
          style={{ backgroundColor: c.cloth, backgroundImage: texture, boxShadow: `inset 10px 0 18px -10px ${c.edge}, inset -1px 0 0 rgb(255 255 255 / 0.08), var(--shadow-object)` }}
        >
          <div className="absolute inset-y-0 left-[6%] w-px bg-black/25" />
          <div className="absolute inset-y-0 left-[6.6%] w-px bg-white/10" />
          <div className="absolute inset-0 flex flex-col items-center px-[12%] py-[14%] text-center" style={{ color: foilColor, textShadow }}>
            <span className="min-h-[1em] text-[0.55em] font-semibold uppercase tracking-[0.28em]" style={{ fontSize: w * 0.034 }}>
              {eyebrow}
            </span>
            <span className="mt-[10%] font-serif leading-[0.95]" style={{ fontSize: w * 0.14 }}>
              {title}
            </span>
            <span className="mt-[6%] font-serif italic" style={{ fontSize: w * 0.06 }}>
              {subtitle}
            </span>
            <span className="mt-auto" style={{ color: foilColor }}>
              <BrandMark className="mx-auto" />
            </span>
            <span className="mt-[5%] font-mono tracking-[0.2em]" style={{ fontSize: w * 0.032 }}>
              {years}
            </span>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-black/20" />
        </div>
      </div>
      <div className="absolute -bottom-5 left-[8%] right-[2%] h-6 rounded-[50%] bg-black/25 blur-xl" />
    </div>
  );
}

/** Sealed letter with wax seal — for Letters Through Time. */
export function SealedLetter({ to, openOn, className, tone = "paper" }: { to: string; openOn: string; className?: string; tone?: "paper" | "night" }) {
  return (
    <div className={cn("relative aspect-[1.55] w-full max-w-md", className)} aria-hidden>
      <div className={cn("absolute inset-0 rounded-[6px] shadow-[var(--shadow-object)]", tone === "night" ? "bg-[#e9e0cc]" : "bg-[#efe6d3]")}>
        <div className="absolute inset-0 rounded-[6px]" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgb(0 0 0 / 0.018) 0 1px, transparent 1px 4px)" }} />
        <svg viewBox="0 0 310 200" className="absolute inset-0 size-full" preserveAspectRatio="none">
          <path d="M0 0 L155 112 L310 0" fill="none" stroke="#cdbf9f" strokeWidth="1.2" />
          <path d="M0 200 L120 92 M310 200 L190 92" fill="none" stroke="#d8cbaf" strokeWidth="1" />
        </svg>
        <div className="absolute left-[8%] top-[60%] text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a6a52]">To be opened</p>
          <p className="font-serif text-[clamp(1rem,2.2vw,1.35rem)] italic text-[#3b3226]">{openOn}</p>
        </div>
        <div className="absolute right-[8%] top-[64%] text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a6a52]">For</p>
          <p className="font-serif text-[clamp(1rem,2.2vw,1.35rem)] text-[#3b3226]">{to}</p>
        </div>
        <div className="absolute left-1/2 top-[47%] grid aspect-square w-[15%] min-w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#b5513c,#7a2a1c_70%)] text-[#f1cdb7] shadow-[0_6px_14px_-4px_rgb(90_20_10/0.6),inset_0_-2px_6px_rgb(0_0_0/0.3)]">
          <BrandMark className="size-[55%]" />
        </div>
      </div>
    </div>
  );
}

export const boxFinishes = {
  walnut: { top: "#5a3b26", side: "#47301f", grain: "rgb(255 220 180 / 0.07)", label: "Walnut" },
  white_oak: { top: "#c7a77c", side: "#b08f66", grain: "rgb(90 60 30 / 0.08)", label: "White oak" },
  ebonised_ash: { top: "#2a2826", side: "#1c1b1a", grain: "rgb(255 255 255 / 0.05)", label: "Ebonised ash" },
  linen_wrapped: { top: "#d8cfbd", side: "#c4baa5", grain: "rgb(0 0 0 / 0.04)", label: "Linen-wrapped" },
} as const;

export type BoxFinish = keyof typeof boxFinishes;

/** Keepsake box — a true six-face CSS cube with a hinged lid. */
export function KeepsakeBox({ finish = "walnut", engraving = "Margaret Ellis · 1940 —", open = false, className }: { finish?: BoxFinish; engraving?: string; open?: boolean; className?: string }) {
  const f = boxFinishes[finish];
  const grain = `repeating-linear-gradient(92deg, ${f.grain} 0 2px, transparent 2px 9px), repeating-linear-gradient(88deg, ${f.grain} 0 1px, transparent 1px 13px)`;
  const W = 300;
  const D = 200;
  const Hh = 96;
  const lid = 22;
  const light = finish === "white_oak" || finish === "linen_wrapped";
  const face = (extra: React.CSSProperties, shade = 1): React.CSSProperties => ({
    position: "absolute",
    backgroundColor: f.side,
    backgroundImage: grain,
    filter: `brightness(${shade})`,
    boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.05)",
    ...extra,
  });
  return (
    <div className={cn("relative mx-auto grid aspect-[1.25] w-full max-w-[440px] place-items-center", className)} aria-hidden>
      <div className="absolute bottom-[12%] left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-2xl" />
      <div style={{ perspective: "1200px" }}>
        <div style={{ width: W, height: Hh, position: "relative", transformStyle: "preserve-3d", transform: "rotateX(-24deg) rotateY(-34deg)" }}>
          {/* body */}
          <div style={face({ width: W, height: Hh, transform: `translateZ(${D / 2}px)` }, 0.95)} />
          <div style={face({ width: W, height: Hh, transform: `rotateY(180deg) translateZ(${D / 2}px)` }, 0.7)} />
          <div style={face({ width: D, height: Hh, left: (W - D) / 2, transform: `rotateY(90deg) translateZ(${W / 2}px)` }, 0.78)} />
          <div style={face({ width: D, height: Hh, left: (W - D) / 2, transform: `rotateY(-90deg) translateZ(${W / 2}px)` }, 0.8)} />
          <div style={face({ width: W, height: D, top: (Hh - D) / 2, transform: `rotateX(-90deg) translateZ(${Hh / 2}px)`, backgroundColor: "#1a1410" }, 1)} />
          {/* interior glimpse */}
          <div style={{ position: "absolute", width: W - 16, height: D - 16, left: 8, top: (Hh - D) / 2 + 8, transform: `rotateX(90deg) translateZ(${Hh / 2 - 6}px)`, background: "linear-gradient(#efe6d3,#d9ccb1)" }} />
          {/* lid: outer = placement on the top face, inner = hinge at the back edge */}
          <div style={{ position: "absolute", width: W, height: D, top: (Hh - D) / 2, transformStyle: "preserve-3d", transform: `rotateX(90deg) translateZ(${Hh / 2}px)` }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                transformOrigin: "50% 0%",
                transform: open ? "rotateX(72deg)" : "rotateX(0deg)",
                transition: "transform 900ms var(--ease-out)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: f.top,
                  backgroundImage: grain,
                  transform: `translateZ(${lid}px)`,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 0 40px rgb(0 0 0 / 0.15)",
                }}
              >
                <span className="font-serif text-[1.15rem] italic" style={{ color: light ? "rgb(60 40 20 / 0.65)" : "rgb(230 205 165 / 0.8)", textShadow: light ? "0 1px 0 rgb(255 255 255 / 0.4)" : "0 -1px 0 rgb(0 0 0 / 0.5)" }}>
                  {engraving}
                </span>
              </div>
              <div style={face({ width: W, height: lid, top: D - lid, transformOrigin: "50% 100%", transform: "rotateX(-90deg)" }, 1)} />
              <div style={face({ width: lid, height: D, left: W - lid, transformOrigin: "100% 50%", transform: "rotateY(90deg)" }, 0.82)} />
              <div style={face({ width: lid, height: D, left: 0, transformOrigin: "0% 50%", transform: "rotateY(-90deg)" }, 0.82)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneFrame({ children, className, tone = "light" }: { children: React.ReactNode; className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={cn("relative mx-auto w-[280px] rounded-[44px] p-[10px] shadow-[var(--shadow-object)]", tone === "dark" ? "bg-[#0e1210]" : "bg-[#1b1f1d]", className)}>
      <div className="relative overflow-hidden rounded-[34px] bg-paper" style={{ aspectRatio: "9 / 19.2" }}>
        <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0e1210]" />
        {children}
      </div>
    </div>
  );
}

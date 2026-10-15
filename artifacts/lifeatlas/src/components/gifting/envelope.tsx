"use client";

import * as React from "react";
import type { EnvelopeArtwork, GiftReveal } from "@/domain/models";
import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const envelopeColors: Record<GiftReveal["color"], { paper: string; liner: string; seal: string; ink: string }> = {
  evergreen: { paper: "#2f4339", liner: "#d7bc92", seal: "#b5513c", ink: "#f3efe7" },
  terracotta: { paper: "#a85f45", liner: "#f3e3c8", seal: "#2f4339", ink: "#fbf1e6" },
  slate: { paper: "#4b5d6e", liner: "#e6d3a8", seal: "#a85f45", ink: "#eef1f3" },
  brass: { paper: "#c8b089", liner: "#2f4339", seal: "#7a2a1c", ink: "#2b2418" },
  ink: { paper: "#1f2422", liner: "#d7bc92", seal: "#a85f45", ink: "#f1ede6" },
};

export const artworkLabels: Record<EnvelopeArtwork, string> = {
  linen: "Linen",
  botanical: "Botanical",
  night_sky: "Night sky",
  harbor: "Harbor",
  winter: "Winter",
};

function Liner({ art, color }: { art: EnvelopeArtwork; color: string }) {
  const id = React.useId().replace(/:/g, "");
  if (art === "botanical")
    return (
      <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={i} transform={`translate(${(i % 7) * 32 + (i > 6 ? 16 : 0)} ${i > 6 ? 70 : 18}) rotate(${i * 23})`} fill="none" stroke={color} strokeWidth="1.2" opacity="0.55">
            <path d="M0 0 C 6 -14, 18 -14, 22 0 C 18 14, 6 14, 0 0 Z" />
            <path d="M0 0 L 22 0" />
          </g>
        ))}
      </svg>
    );
  if (art === "night_sky")
    return (
      <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={(i * 47) % 200} cy={(i * 29) % 120} r={i % 5 === 0 ? 1.6 : 0.8} fill={color} opacity={0.7} />
        ))}
        <circle cx="160" cy="30" r="10" fill={color} opacity="0.8" />
      </svg>
    );
  if (art === "harbor")
    return (
      <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M0 ${20 + i * 12} q 25 -8 50 0 t 50 0 t 50 0 t 50 0`} fill="none" stroke={color} strokeWidth="1.1" opacity="0.5" />
        ))}
      </svg>
    );
  if (art === "winter")
    return (
      <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <g key={i} transform={`translate(${(i * 37) % 200} ${(i * 23) % 120})`} stroke={color} strokeWidth="1" opacity="0.6">
            <path d="M-5 0 H5 M0 -5 V5 M-3.5 -3.5 L3.5 3.5 M-3.5 3.5 L3.5 -3.5" />
          </g>
        ))}
      </svg>
    );
  return (
    <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0 H4 M0 2 H4" stroke={color} strokeWidth="0.4" opacity="0.35" />
          <path d="M0 0 V4 M2 0 V4" stroke={color} strokeWidth="0.3" opacity="0.25" />
        </pattern>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />
    </svg>
  );
}

/** A gift envelope that opens to reveal the dedication card. Reduced-motion friendly. */
export function GiftEnvelope({
  recipient,
  giver,
  dedication,
  reveal,
  occasion,
  open,
  className,
}: {
  recipient: string;
  giver: string;
  dedication: string;
  reveal: Pick<GiftReveal, "envelope" | "color">;
  occasion?: string;
  open: boolean;
  className?: string;
}) {
  const c = envelopeColors[reveal.color];
  return (
    <div className={cn("relative mx-auto w-full max-w-[460px] pt-[18%]", className)} style={{ perspective: "1600px" }}>
      <div className="relative aspect-[1.55]">
        {/* back */}
        <div className="absolute inset-0 overflow-hidden rounded-[8px]" style={{ background: c.paper }}>
          <div className="absolute inset-0 opacity-90">
            <Liner art={reveal.envelope} color={c.liner} />
          </div>
        </div>
        {/* card */}
        <div
          className="absolute inset-x-[6%] z-10 rounded-[6px] bg-[#fbf8f1] px-[7%] py-[6%] text-center shadow-lg transition-transform duration-[1100ms] ease-[var(--ease-out)]"
          style={{ bottom: "6%", height: "88%", transform: open ? "translate3d(0,-58%,0)" : "translate3d(0,0,0)" }}
        >
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[#8a6d43]">{occasion ?? "A gift for you"}</p>
          <p className="mt-2 font-serif text-[clamp(1.4rem,4vw,2rem)] leading-tight text-[#242824]">For {recipient || "someone dear"}</p>
          <p className="mx-auto mt-2 line-clamp-4 max-w-[30ch] font-serif text-[clamp(0.85rem,2.2vw,1rem)] italic leading-snug text-[#474b45]">{dedication || "Your dedication will appear here."}</p>
          <p className="mt-2 text-[0.75rem] text-[#62655d]">, {giver || "Your name"}</p>
        </div>
        {/* front pocket */}
        <svg viewBox="0 0 310 200" className="absolute inset-0 z-20 size-full drop-shadow-[0_10px_16px_rgb(0_0_0/0.18)]" preserveAspectRatio="none" aria-hidden>
          <path d="M0 200 L0 60 L155 140 L310 60 L310 200 Z" fill={c.paper} />
          <path d="M0 60 L155 140 L310 60" fill="none" stroke="rgb(0 0 0 / 0.12)" strokeWidth="1" />
        </svg>
        {/* flap */}
        <div className="absolute inset-x-0 top-0 z-30 h-[62%] origin-top transition-transform duration-[900ms] ease-[var(--ease-out)]" style={{ transform: open ? "rotateX(178deg)" : "rotateX(0deg)", transformStyle: "preserve-3d", zIndex: open ? 5 : 30 }}>
          <svg viewBox="0 0 310 124" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
            <path d="M0 0 L310 0 L155 124 Z" fill={c.paper} style={{ filter: "brightness(1.06)" }} />
          </svg>
          <div className={cn("absolute left-1/2 top-[78%] grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[0_6px_14px_-4px_rgb(0_0_0/0.5),inset_0_-2px_6px_rgb(0_0_0/0.3)] transition-opacity duration-300", open && "opacity-0")} style={{ background: `radial-gradient(circle at 35% 30%, ${c.seal}, color-mix(in srgb, ${c.seal} 60%, black))`, color: "#f1d9c4" }}>
            <BrandMark className="size-7" />
          </div>
        </div>
      </div>
    </div>
  );
}

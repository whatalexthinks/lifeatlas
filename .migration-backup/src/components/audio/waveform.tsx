"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Resample peaks to a target bar count. */
export function resamplePeaks(peaks: number[], bars: number) {
  if (!peaks.length) return Array.from({ length: bars }, () => 0.08);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const a = Math.floor((i / bars) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / bars) * peaks.length));
    let m = 0;
    for (let j = a; j < b; j++) m = Math.max(m, peaks[j] ?? 0);
    out.push(m);
  }
  return out;
}

/**
 * Static waveform with a played-progress overlay. Purely visual; the parent
 * exposes the accessible slider.
 */
export function Waveform({
  peaks,
  progress,
  bars = 64,
  className,
  tone = "ink",
  height = 44,
}: {
  peaks: number[];
  progress: number;
  bars?: number;
  className?: string;
  tone?: "ink" | "light" | "brand";
  height?: number;
}) {
  const data = React.useMemo(() => resamplePeaks(peaks, bars), [peaks, bars]);
  const w = bars * 4;
  const colors = {
    ink: { base: "var(--line-strong)", played: "var(--evergreen)" },
    brand: { base: "color-mix(in srgb, var(--evergreen) 25%, transparent)", played: "var(--evergreen)" },
    light: { base: "rgb(255 255 255 / 0.25)", played: "#e9dcc2" },
  }[tone];
  const shape = (
    <>
      {data.map((v, i) => {
        const h = Math.round(Math.max(2.5, Math.pow(v, 0.8) * (height - 4)) * 100) / 100;
        return <rect key={i} x={i * 4 + 0.75} y={Math.round(((height - h) / 2) * 100) / 100} width={2.5} height={h} rx={1.25} />;
      })}
    </>
  );
  return (
    <div className={cn("relative", className)} style={{ height }} aria-hidden>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full" fill={colors.base}>
        {shape}
      </svg>
      <div className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-150 ease-linear" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}>
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full" style={{ width: `${100 / Math.max(progress, 0.0001)}%` }} fill={colors.played}>
          {shape}
        </svg>
      </div>
    </div>
  );
}

/** Live level meter for recording (driven by an AnalyserNode). */
export function LevelBars({ levels, className, tone = "ink" }: { levels: number[]; className?: string; tone?: "ink" | "light" }) {
  return (
    <div className={cn("flex h-16 items-center justify-center gap-[3px]", className)} aria-hidden>
      {levels.map((v, i) => (
        <span
          key={i}
          className={cn("w-[4px] rounded-full transition-[height] duration-75", tone === "light" ? "bg-[#e9dcc2]" : "bg-evergreen")}
          style={{ height: `${Math.max(6, v * 100)}%`, opacity: 0.35 + v * 0.65 }}
        />
      ))}
    </div>
  );
}

/** Decode an audio blob in the browser and compute real RMS peaks (0–1). */
export async function computePeaksFromBlob(blob: Blob, n = 96): Promise<{ peaks: number[]; duration: number } | null> {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0);
    const size = Math.floor(data.length / n) || 1;
    const raw: number[] = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const start = i * size;
      for (let j = start; j < start + size && j < data.length; j++) sum += data[j] * data[j];
      raw.push(Math.sqrt(sum / size));
    }
    const top = Math.max(...raw, 0.0001);
    return { peaks: raw.map((v) => Math.round((v / top) * 1000) / 1000), duration: buf.duration };
  } catch {
    return null;
  } finally {
    void ctx.close();
  }
}

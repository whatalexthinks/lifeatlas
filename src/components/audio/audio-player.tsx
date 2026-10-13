"use client";

import * as React from "react";
import { FileText, Pause, Play, RotateCcw } from "lucide-react";
import type { MediaAsset } from "@/domain/models";
import { useDb, useMediaAsset, useMediaUrl } from "@/hooks/use-data";
import { cn, formatDuration } from "@/lib/utils";
import { services } from "@/services/factory";
import { Waveform } from "./waveform";

/** Only one recording plays at a time across the whole app. */
let activeAudio: HTMLAudioElement | null = null;
let firstPlayTracked = false;

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export function AudioPlayer({
  mediaId,
  asset: assetProp,
  title,
  variant = "card",
  tone = "ink",
  showTranscript = true,
  showNotice = true,
  className,
}: {
  mediaId?: string;
  asset?: MediaAsset;
  title?: string;
  variant?: "card" | "inline" | "mini";
  tone?: "ink" | "light";
  showTranscript?: boolean;
  showNotice?: boolean;
  className?: string;
}) {
  const fromStore = useMediaAsset(assetProp ? undefined : mediaId);
  const asset = assetProp ?? fromStore;
  const { url, error } = useMediaUrl(asset);
  const transcripts = useDb((d) => d.transcripts);
  const transcript = asset?.transcriptId ? transcripts.find((t) => t.id === asset.transcriptId) : undefined;
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(asset?.durationSec ?? 0);
  const [speed, setSpeed] = React.useState<(typeof SPEEDS)[number]>(1);
  const [openTranscript, setOpenTranscript] = React.useState(false);
  const [failed, setFailed] = React.useState<string | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const light = tone === "light";
  const id = React.useId();

  React.useEffect(() => {
    const a = audioRef.current;
    return () => {
      if (a && activeAudio === a) activeAudio = null;
      a?.pause();
    };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !url) return;
    if (a.paused) {
      if (activeAudio && activeAudio !== a) activeAudio.pause();
      activeAudio = a;
      try {
        a.playbackRate = speed;
        await a.play();
        if (!firstPlayTracked) {
          firstPlayTracked = true;
          services().analytics.track("first_audio_played", { mediaId: asset?.id ?? "" });
        }
      } catch {
        setFailed("This browser couldn't play the recording.");
      }
    } else a.pause();
  };

  const seekTo = (fraction: number) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = Math.max(0, Math.min(duration, fraction * duration));
    setTime(a.currentTime);
  };

  const onPointer = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const a = audioRef.current;
    if (!a) return;
    if (e.key === "ArrowRight") {
      a.currentTime = Math.min(duration, a.currentTime + 5);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      a.currentTime = Math.max(0, a.currentTime - 5);
      e.preventDefault();
    } else if (e.key === "Home") {
      a.currentTime = 0;
      e.preventDefault();
    } else if (e.key === "End") {
      a.currentTime = duration;
      e.preventDefault();
    } else if (e.key === " " || e.key === "Enter") {
      void toggle();
      e.preventDefault();
    }
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration ? time / duration : 0;
  const unavailable = error || failed;
  const peaks = asset?.peaks ?? [];

  if (!asset) return null;

  const playButton = (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={!url || !!unavailable}
      aria-label={playing ? `Pause ${title ?? "recording"}` : `Play ${title ?? "recording"}`}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-200 hover:scale-[1.04] active:scale-95 disabled:opacity-40",
        variant === "mini" ? "size-10" : "size-14",
        light ? "bg-[#f2ebdc] text-[#1b221e]" : "bg-evergreen text-on-evergreen",
      )}
    >
      {playing ? <Pause className={variant === "mini" ? "size-4" : "size-5"} fill="currentColor" /> : <Play className={cn(variant === "mini" ? "size-4" : "size-5", "translate-x-[1px]")} fill="currentColor" />}
    </button>
  );

  const audioEl = url ? (
    <audio
      ref={audioRef}
      src={url}
      preload="metadata"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => {
        setPlaying(false);
        setTime(0);
      }}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      onError={() => setFailed("This recording couldn't be loaded.")}
    />
  ) : null;

  if (variant === "mini") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {audioEl}
        {playButton}
        <div className="min-w-0 flex-1">
          <Waveform peaks={peaks} progress={progress} bars={36} height={28} tone={light ? "light" : "brand"} />
        </div>
        <span className={cn("catalog tabular shrink-0", light && "text-[#bdb7aa]")}>{formatDuration(playing || time ? time : duration)}</span>
      </div>
    );
  }

  return (
    <div className={cn(variant === "card" && (light ? "rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10" : "card-paper p-5"), className)}>
      {audioEl}
      <div className="flex items-center gap-4">
        {playButton}
        <div className="min-w-0 flex-1">
          {title ? <p className={cn("mb-1.5 truncate text-[0.9375rem] font-medium", light ? "text-[#eee9de]" : "text-ink")}>{title}</p> : null}
          <div
            ref={trackRef}
            role="slider"
            tabIndex={url ? 0 : -1}
            aria-label={`Seek ${title ?? "recording"}`}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              onPointer(e);
            }}
            onPointerMove={(e) => e.buttons === 1 && onPointer(e)}
            onKeyDown={onKey}
            className="cursor-pointer touch-none rounded-md py-1"
          >
            <Waveform peaks={peaks} progress={progress} tone={light ? "light" : "ink"} />
          </div>
          <div className={cn("mt-1 flex items-center justify-between gap-3 catalog tabular", light && "text-[#bdb7aa]")}>
            <span>
              {formatDuration(time)} / {formatDuration(duration)}
            </span>
            <span className="flex items-center gap-1">
              {time > 0 ? (
                <button type="button" onClick={() => seekTo(0)} className="grid size-8 place-items-center rounded-full hover:bg-black/5" aria-label="Restart">
                  <RotateCcw className="size-3.5" />
                </button>
              ) : null}
              <button type="button" onClick={cycleSpeed} className="h-8 rounded-full px-2.5 font-mono hover:bg-black/5" aria-label={`Playback speed ${speed}×. Change speed`}>
                {speed}×
              </button>
              {showTranscript && transcript ? (
                <button
                  type="button"
                  onClick={() => setOpenTranscript((v) => !v)}
                  aria-expanded={openTranscript}
                  aria-controls={`${id}-tr`}
                  className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 hover:bg-black/5"
                >
                  <FileText className="size-3.5" /> Transcript
                </button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
      {unavailable ? <p className={cn("mt-3 text-[0.875rem]", light ? "text-[#e59a8f]" : "text-danger")}>{unavailable}</p> : null}
      {openTranscript && transcript ? (
        <div id={`${id}-tr`} className={cn("mt-4 rounded-[12px] p-4 text-[0.9375rem] leading-relaxed", light ? "bg-black/20 text-[#cfc9bc]" : "bg-ivory/70 text-ink-2")}>
          <p className="catalog mb-2">{transcript.origin === "manual" ? "Transcript · typed by family" : "Transcript · the story text this sample reads"}</p>
          <p className="whitespace-pre-line">{transcript.text}</p>
        </div>
      ) : null}
      {showNotice && asset.sampleNotice ? <p className={cn("mt-3 text-[0.75rem] leading-snug", light ? "text-[#bdb7aa]" : "text-ink-3")}>{asset.sampleNotice}</p> : null}
      {showNotice && asset.storage === "this_device" ? <p className={cn("mt-3 text-[0.75rem] leading-snug", light ? "text-[#bdb7aa]" : "text-ink-3")}>Recorded on this device · stored only in this browser · not backed up</p> : null}
    </div>
  );
}

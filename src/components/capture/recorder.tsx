"use client";

import * as React from "react";
import { Mic, Pause, Play, RotateCcw, Square, Upload, AlertCircle } from "lucide-react";
import { useRecorder, recorderErrorCopy, type Recording } from "@/hooks/use-recorder";
import { computePeaksFromBlob, LevelBars, Waveform } from "@/components/audio/waveform";
import { Button } from "@/components/ui/button";
import { validateFileDeep } from "@/domain/media/validation";
import { cn, formatDuration } from "@/lib/utils";

export interface RecordedAudio {
  blob: Blob;
  durationSec: number;
  peaks: number[];
  source: "microphone" | "upload";
}

/**
 * The large, senior-friendly recorder. One obvious action at every step.
 */
export function Recorder({
  onChange,
  size = "senior",
  onTypeInstead,
}: {
  onChange: (audio: RecordedAudio | null) => void;
  size?: "senior" | "standard";
  onTypeInstead?: () => void;
}) {
  const r = useRecorder();
  const [upload, setUpload] = React.useState<{ url: string; audio: RecordedAudio } | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const big = size === "senior";
  // Always calls the latest onChange without re-running when the parent re-renders.
  const emit = React.useEffectEvent(onChange);

  React.useEffect(() => {
    if (r.recording) emit({ blob: r.recording.blob, durationSec: r.recording.durationSec, peaks: r.recording.peaks, source: "microphone" });
  }, [r.recording]);

  React.useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url);
    },
    [upload],
  );

  const clip: (Recording & { source?: string }) | { url: string; durationSec: number; peaks: number[]; likelySilent?: boolean } | null = r.recording ?? (upload ? { url: upload.url, durationSec: upload.audio.durationSec, peaks: upload.audio.peaks } : null);

  const reRecord = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setTime(0);
    r.reset();
    if (upload) {
      URL.revokeObjectURL(upload.url);
      setUpload(null);
    }
    onChange(null);
  };

  const onUpload = async (file: File | undefined) => {
    setUploadError(null);
    if (!file) return;
    const v = await validateFileDeep(file, "audio");
    if (!v.ok) {
      setUploadError(v.reason);
      return;
    }
    const url = URL.createObjectURL(file);
    const duration = await new Promise<number>((resolve) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 0);
      a.onerror = () => resolve(0);
      a.src = url;
    });
    const decoded = await computePeaksFromBlob(file);
    const audio: RecordedAudio = { blob: file, durationSec: Math.round((decoded?.duration || duration) * 10) / 10, peaks: decoded?.peaks ?? [], source: "upload" };
    r.reset();
    setUpload({ url, audio });
    onChange(audio);
  };

  /* ---------------- review state ---------------- */
  if (clip) {
    const progress = clip.durationSec ? time / clip.durationSec : 0;
    return (
      <div className={cn("rounded-[24px] border border-line bg-surface p-5 sm:p-6", big && "sm:p-7")}>
        <audio
          ref={audioRef}
          src={clip.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setTime(0);
          }}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        />
        <p className={cn("font-medium", big ? "text-[1.15rem]" : "text-[1rem]")}>{upload ? "Your recording is attached" : "Listen back before you keep it"}</p>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (audioRef.current?.paused ? void audioRef.current.play() : audioRef.current?.pause())}
            className={cn("grid shrink-0 place-items-center rounded-full bg-evergreen text-on-evergreen", big ? "size-16" : "size-12")}
            aria-label={playing ? "Pause your recording" : "Play your recording"}
          >
            {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" />}
          </button>
          <div className="min-w-0 flex-1">
            {clip.peaks.length ? <Waveform peaks={clip.peaks} progress={progress} height={big ? 52 : 40} /> : <div className="h-10 rounded-full bg-ivory" />}
            <p className="catalog mt-1 tabular">
              {formatDuration(time)} / {formatDuration(clip.durationSec)}
            </p>
          </div>
        </div>
        {"likelySilent" in clip && clip.likelySilent ? (
          <p className="mt-4 flex items-start gap-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-[0.9375rem] text-ink-2" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            We barely heard anything. Play it back — if it&rsquo;s silent, check the microphone and record again.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button variant="secondary" size={big ? "lg" : "md"} onClick={reRecord} leading={<RotateCcw className="size-4" />}>
            Record again
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- error state ---------------- */
  if (r.status === "error" && r.error) {
    const c = recorderErrorCopy[r.error];
    return (
      <div className="rounded-[24px] border border-warning/30 bg-warning-soft/60 p-5 sm:p-6" role="alert">
        <p className={cn("font-medium text-ink", big ? "text-[1.2rem]" : "text-[1.05rem]")}>{c.title}</p>
        <p className={cn("mt-2 leading-relaxed text-ink-2", big ? "text-[1.05rem]" : "text-[0.9375rem]")}>{c.body}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {r.error !== "unsupported" && r.error !== "insecure" ? (
            <Button size={big ? "lg" : "md"} onClick={() => void r.start()} leading={<Mic className="size-4" />}>
              Try again
            </Button>
          ) : null}
          {onTypeInstead ? (
            <Button variant="secondary" size={big ? "lg" : "md"} onClick={onTypeInstead}>
              Type instead
            </Button>
          ) : null}
          <Button variant="ghost" size={big ? "lg" : "md"} onClick={() => fileRef.current?.click()} leading={<Upload className="size-4" />}>
            Upload a recording
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="audio/*" className="sr-only" tabIndex={-1} onChange={(e) => void onUpload(e.target.files?.[0])} />
        {uploadError ? <p className="mt-3 text-[0.9rem] font-medium text-danger">{uploadError}</p> : null}
      </div>
    );
  }

  /* ---------------- idle / recording ---------------- */
  const recording = r.status === "recording" || r.status === "paused";
  return (
    <div className="flex flex-col items-center text-center">
      {recording ? (
        <>
          <p className={cn("font-mono tabular-nums text-ink", big ? "text-[2.2rem]" : "text-[1.8rem]")} aria-live="off">
            {formatDuration(r.elapsed)}
          </p>
          <p className="mt-1 text-[0.9375rem] text-ink-3" role="status">
            {r.status === "paused" ? "Paused — take your time" : "Recording… speak as you would to family"}
          </p>
          <LevelBars levels={r.levels} className="mt-5 w-full max-w-sm" />
          <div className="mt-6 flex items-center gap-4">
            {r.canPause ? (
              <button
                type="button"
                onClick={() => (r.status === "paused" ? r.resume() : r.pause())}
                className={cn("grid place-items-center rounded-full border border-line-strong bg-surface text-ink", big ? "size-16" : "size-12")}
                aria-label={r.status === "paused" ? "Resume recording" : "Pause recording"}
              >
                {r.status === "paused" ? <Mic className="size-6" /> : <Pause className="size-6" />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={r.stop}
              className={cn("grid place-items-center rounded-full bg-ink text-paper shadow-lg", big ? "size-24" : "size-20")}
              aria-label="Stop recording"
            >
              <Square className="size-7" fill="currentColor" />
            </button>
          </div>
          <p className="mt-4 text-[0.9375rem] font-medium">Tap the square when you&rsquo;re finished</p>
          <p className="mt-1 text-[0.8125rem] text-ink-3">Recordings stop automatically after {Math.round(r.maxSeconds / 60)} minutes.</p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void r.start()}
            disabled={r.status === "requesting"}
            className={cn(
              "group relative grid place-items-center rounded-full bg-terracotta text-white shadow-[0_22px_50px_-18px_rgb(168_95_69/0.85)] transition-transform duration-200 hover:scale-[1.03] active:scale-95 disabled:opacity-60",
              big ? "size-32" : "size-24",
            )}
            aria-describedby="record-help"
          >
            <span className="breathe absolute inset-0 rounded-full text-terracotta" aria-hidden />
            <Mic className={big ? "size-12" : "size-9"} />
            <span className="sr-only">Record answer</span>
          </button>
          <p className={cn("mt-5 font-medium", big ? "text-[1.4rem]" : "text-[1.1rem]")}>{r.status === "requesting" ? "Waiting for the microphone…" : "Record answer"}</p>
          <p id="record-help" className={cn("mx-auto mt-2 max-w-sm leading-snug text-ink-3", big ? "text-[1rem]" : "text-[0.875rem]")}>
            {r.status === "requesting"
              ? "Your browser is asking to use the microphone. Choose “Allow”."
              : "When you tap, your browser will ask to use the microphone. Your recording stays on this device in this demo."}
          </p>
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            <Upload className="size-4" /> or upload a recording
          </button>
          <input ref={fileRef} type="file" accept="audio/*" className="sr-only" tabIndex={-1} onChange={(e) => void onUpload(e.target.files?.[0])} />
          {uploadError ? <p className="mt-3 text-[0.9rem] font-medium text-danger">{uploadError}</p> : null}
        </>
      )}
    </div>
  );
}

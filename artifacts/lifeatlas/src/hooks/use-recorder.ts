"use client";

import * as React from "react";
import { appConfig } from "@/lib/config";
import { pickRecorderMime } from "@/services/mock/media";

export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";
export type RecorderError = "denied" | "unsupported" | "no_device" | "insecure" | "failed" | "empty";

export interface Recording {
  blob: Blob;
  url: string;
  durationSec: number;
  mimeType: string;
  peaks: number[];
  /** True when the input level never rose above a whisper. */
  likelySilent: boolean;
}

export const recorderErrorCopy: Record<RecorderError, { title: string; body: string }> = {
  denied: {
    title: "Microphone access is turned off",
    body: "Your browser blocked the microphone. You can allow it from the lock icon in the address bar and try again, or type your answer instead.",
  },
  unsupported: {
    title: "This browser can't record here",
    body: "Recording isn't supported in this browser. You can type your answer, or upload a recording made on your phone.",
  },
  no_device: {
    title: "We couldn't find a microphone",
    body: "Check that a microphone is connected and not in use by another app, then try again. Typing works too.",
  },
  insecure: {
    title: "Recording needs a secure connection",
    body: "Browsers only allow the microphone on secure (https) pages. Type your answer, or open this page securely.",
  },
  failed: {
    title: "Something interrupted the recording",
    body: "Nothing was lost from your archive. Please try again, or type your answer instead.",
  },
  empty: {
    title: "That recording came out empty",
    body: "The browser didn't capture any audio. Try again a little closer to the microphone, or type instead.",
  },
};

const LEVEL_BARS = 28;

/**
 * MediaRecorder state machine with honest error handling.
 * - Permission is requested only after a user gesture (start()).
 * - Tracks and audio contexts are always released.
 * - Peaks come from the measured input level, never invented.
 */
export function useRecorder({ maxSeconds = appConfig.limits.recordingSeconds }: { maxSeconds?: number } = {}) {
  const [status, setStatus] = React.useState<RecorderStatus>("idle");
  const [error, setError] = React.useState<RecorderError | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [levels, setLevels] = React.useState<number[]>(() => Array(LEVEL_BARS).fill(0));
  const [recording, setRecording] = React.useState<Recording | null>(null);

  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const historyRef = React.useRef<number[]>([]);
  const maxLevelRef = React.useRef(0);
  const startedAtRef = React.useRef(0);
  const accumulatedRef = React.useRef(0);
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const supported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const cleanupStream = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  React.useEffect(
    () => () => {
      cleanupStream();
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    },
    [cleanupStream],
  );

  React.useEffect(() => {
    return () => {
      if (recording) URL.revokeObjectURL(recording.url);
    };
  }, [recording]);

  const currentElapsed = () => accumulatedRef.current + (startedAtRef.current ? (performance.now() - startedAtRef.current) / 1000 : 0);

  const stop = React.useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    accumulatedRef.current = currentElapsed();
    startedAtRef.current = 0;
    rec.stop();
  }, []);

  const start = React.useCallback(async () => {
    setError(null);
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("insecure");
      setStatus("error");
      return;
    }
    if (!supported) {
      setError("unsupported");
      setStatus("error");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      historyRef.current = [];
      maxLevelRef.current = 0;
      accumulatedRef.current = 0;

      // Level metering
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let frame = 0;
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const level = Math.min(1, rms * 4.2);
        if (recorderRef.current?.state === "recording") {
          maxLevelRef.current = Math.max(maxLevelRef.current, rms);
          if (frame++ % 3 === 0) {
            historyRef.current.push(level);
            setLevels((prev) => [...prev.slice(1), level]);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onerror = () => {
        setError("failed");
        setStatus("error");
        cleanupStream();
      };
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: type.split(";")[0] });
        cleanupStream();
        if (blob.size < 800) {
          setError("empty");
          setStatus("error");
          return;
        }
        const hist = historyRef.current;
        const n = 96;
        const peaks: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = Math.floor((i / n) * hist.length);
          const b = Math.max(a + 1, Math.floor(((i + 1) / n) * hist.length));
          let m = 0;
          for (let j = a; j < b && j < hist.length; j++) m = Math.max(m, hist[j]);
          peaks.push(Math.round(m * 1000) / 1000);
        }
        const top = Math.max(...peaks, 0.001);
        setRecording({
          blob,
          url: URL.createObjectURL(blob),
          durationSec: Math.max(0.5, Math.round(accumulatedRef.current * 10) / 10),
          mimeType: blob.type,
          peaks: peaks.map((p) => Math.round((p / top) * 1000) / 1000),
          likelySilent: maxLevelRef.current < 0.012,
        });
        setStatus("stopped");
      };

      rec.start(1000);
      startedAtRef.current = performance.now();
      setElapsed(0);
      setStatus("recording");
      tickRef.current = setInterval(() => {
        const t = currentElapsed();
        setElapsed(t);
        if (t >= maxSeconds) stop();
      }, 250);
    } catch (e) {
      cleanupStream();
      const name = e instanceof DOMException ? e.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "no_device" : name === "NotReadableError" ? "no_device" : "failed");
      setStatus("error");
    }
  }, [cleanupStream, maxSeconds, stop, supported]);

  const canPause = typeof MediaRecorder !== "undefined" && typeof MediaRecorder.prototype?.pause === "function";

  const pause = React.useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording" || !canPause) return;
    rec.pause();
    accumulatedRef.current = currentElapsed();
    startedAtRef.current = 0;
    setStatus("paused");
  }, [canPause]);

  const resume = React.useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    startedAtRef.current = performance.now();
    setStatus("recording");
  }, []);

  const reset = React.useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    cleanupStream();
    setRecording(null);
    setError(null);
    setElapsed(0);
    setLevels(Array(LEVEL_BARS).fill(0));
    setStatus("idle");
  }, [cleanupStream]);

  // Warn before leaving with an unsaved or in-progress recording.
  React.useEffect(() => {
    if (status !== "recording" && status !== "paused" && status !== "stopped") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  return { status, error, elapsed, levels, recording, supported, canPause, maxSeconds, start, stop, pause, resume, reset };
}

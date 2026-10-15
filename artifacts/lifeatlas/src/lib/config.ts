/**
 * Runtime configuration. Part One always runs in demo mode; the flag exists so
 * the service factory has a single switch to flip in Part Two.
 */
import { brand } from "@/config/brand";

export type AppMode = "demo" | "production";

export const appConfig = {
  mode: ((import.meta.env.VITE_APP_MODE ?? import.meta.env.VITE_LIFEATLAS_MODE) === "production" ? "production" : "demo") as AppMode,
  /** Optional canonical origin; otherwise use the actual running app's origin. */
  siteUrl: import.meta.env.VITE_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:80"),
  brandName: brand.name,
  /** Media limits enforced on this device. */
  limits: {
    imageBytes: 15 * 1024 * 1024,
    audioBytes: 60 * 1024 * 1024,
    recordingSeconds: 20 * 60,
    narrativeChars: 20_000,
    titleChars: 160,
  },
} as const;

export const isDemoMode = () => appConfig.mode === "demo";

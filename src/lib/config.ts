/**
 * Runtime configuration. Part One always runs in demo mode; the flag exists so
 * the service factory has a single switch to flip in Part Two.
 */
import { brand } from "@/config/brand";

export type AppMode = "demo" | "production";

export const appConfig = {
  // NEXT_PUBLIC_LIFEATLAS_MODE is the original name, kept so existing deployments don't break.
  mode: ((process.env.NEXT_PUBLIC_APP_MODE ?? process.env.NEXT_PUBLIC_LIFEATLAS_MODE) === "production" ? "production" : "demo") as AppMode,
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL=https://ourlifecapsule.com once DNS and hosting exist. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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

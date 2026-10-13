import localFont from "next/font/local";

/** Instrument Serif (OFL) — editorial display. Self-hosted, no network at build. */
export const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif.ttf", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
});

/** DM Sans (OFL) — interface sans, variable 400–700. */
export const dmSans = localFont({
  src: [{ path: "./fonts/dm-sans.ttf", weight: "100 1000", style: "normal" }],
  variable: "--font-dm-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

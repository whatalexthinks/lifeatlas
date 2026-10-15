import localFont from "next/font/local";

/** Newsreader, SIL Open Font License. Local variable files; no runtime font requests. */
export const editorial = localFont({
  src: [
    { path: "./fonts/newsreader.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-editorial",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

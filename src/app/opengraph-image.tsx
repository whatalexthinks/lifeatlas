import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "LifeAtlas — A whole life. In their words. A private family archive of voices, photographs, places and letters.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card for every page. Typographic on purpose: no family photo is ever
 * placed in a link preview. Fonts are static TTF instances (the renderer can't read
 * WOFF2) — see src/app/og-fonts for their OFL licences.
 */
export default async function OpengraphImage() {
  const dir = join(process.cwd(), "src/app/og-fonts");
  const [geist, newsreader] = await Promise.all([readFile(join(dir, "Geist-Medium.ttf")), readFile(join(dir, "Newsreader-Italic.ttf"))]);

  const ink = "#202d27";
  const green = "#294f3e";
  const muted = "#5c6659";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8f8f3", fontFamily: "Geist", color: ink, position: "relative" }}>
        {/* left: the line */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 84px", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, letterSpacing: "0.14em", color: "#476049" }}>
            <div style={{ width: 9, height: 9, borderRadius: 9, background: "#567458" }} />
            {/* Non-breaking spaces: the renderer widens the last space of tracked text otherwise. */}
            <span>{"A HOME FOR YOUR FAMILY’S STORY".replace(/ /g, "\u00a0")}</span>
          </div>
          <div style={{ fontSize: 108, lineHeight: 1, letterSpacing: "-0.06em", marginTop: 34 }}>A whole life.</div>
          <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: 112, lineHeight: 1.02, letterSpacing: "-0.035em", marginTop: 6 }}>In their words.</div>
          <div style={{ fontSize: 27, lineHeight: 1.45, color: muted, marginTop: 34, maxWidth: 600 }}>Voices, photographs, places and letters, kept for the people who come next.</div>
        </div>

        {/* right: an archive card, like the one on the landing page */}
        <div style={{ position: "absolute", right: 80, top: 92, width: 360, height: 446, display: "flex" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 360, height: 446, background: "#e9e9df", border: "1px solid #dadfd2", borderRadius: 6, transform: "rotate(5deg)" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 360,
              height: 446,
              display: "flex",
              flexDirection: "column",
              background: "#fffef9",
              border: "1px solid #ddded2",
              borderRadius: 6,
              padding: 30,
              transform: "rotate(1deg)",
              boxShadow: "0 30px 50px -30px rgba(33,51,35,0.45)",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: "0.16em", color: "#5b6656" }}>THE LIFE &amp; STORIES OF</div>
            <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: 40, lineHeight: 1, letterSpacing: "-0.04em", marginTop: 14 }}>Someone you love</div>
            <div style={{ display: "flex", width: 298, height: 246, marginTop: 24, borderRadius: 3, background: "linear-gradient(160deg, #c9d2c0 0%, #9fae98 55%, #6f8270 100%)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 14, letterSpacing: "0.12em", color: "#5b6656" }}>
              <span>1940 — TODAY</span>
              <span>VOL. 01</span>
            </div>
          </div>
        </div>

        {/* wordmark */}
        <div style={{ position: "absolute", right: 84, bottom: 34, display: "flex", alignItems: "center", gap: 14, fontSize: 30, letterSpacing: "-0.06em", color: green }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke={green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3c-4.4 0-8 3.4-8 7.8 0 5.6 8 12.2 8 12.2s8-6.6 8-12.2C24 6.4 20.4 3 16 3Z" />
            <circle cx="16" cy="11" r="2.6" />
            <path d="M5 21.5 16 27l11-5.5" />
          </svg>
          LifeAtlas
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: geist, style: "normal", weight: 500 },
        { name: "Newsreader", data: newsreader, style: "italic", weight: 400 },
      ],
    },
  );
}

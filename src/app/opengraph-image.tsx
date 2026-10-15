import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const alt = `${brand.name} — A life is made of moments. Keep them close. Stories, voices, photographs and memories, kept together for the people who matter.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card for every page. Typographic on purpose: no family photo is ever placed
 * in a link preview, so nothing private can leak through one. Fonts are static TTF
 * instances (the renderer can't read WOFF2) — see src/app/og-fonts for their OFL licences.
 */
export default async function OpengraphImage() {
  const dir = join(process.cwd(), "src/app/og-fonts");
  const [geist, serif, serifItalic] = await Promise.all([
    readFile(join(dir, "Geist-Medium.ttf")),
    readFile(join(dir, "Newsreader-Regular.ttf")),
    readFile(join(dir, "Newsreader-Italic.ttf")),
  ]);

  const ink = "#252421";
  const oxblood = "#763f43";
  const muted = "#5c5850";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8f6f1", fontFamily: "Geist", color: ink, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 84px", width: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 18, letterSpacing: "0.16em", color: oxblood }}>
            <div style={{ width: 28, height: 1, background: oxblood }} />
            {/* Non-breaking spaces: the renderer widens the last space of tracked text otherwise. */}
            <span>{"EVERY LIFE IS A STORY WORTH KEEPING".replace(/ /g, " ")}</span>
          </div>
          <div style={{ fontFamily: "Newsreader", fontSize: 100, lineHeight: 1, letterSpacing: "-0.03em", marginTop: 34 }}>A life is made</div>
          <div style={{ fontFamily: "Newsreader", fontSize: 100, lineHeight: 1.02, letterSpacing: "-0.03em" }}>of moments.</div>
          <div style={{ fontFamily: "NewsreaderItalic", fontStyle: "italic", fontSize: 100, lineHeight: 1.04, letterSpacing: "-0.03em", color: oxblood }}>Keep them close.</div>
          <div style={{ fontSize: 25, lineHeight: 1.45, color: muted, marginTop: 30, maxWidth: 600 }}>Stories, voices, photographs and memories — kept together for the people who matter.</div>
        </div>

        {/* A capsule card, the way the product presents one */}
        <div style={{ position: "absolute", right: 86, top: 96, width: 330, height: 420, display: "flex" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 330, height: 420, background: "#f0ece4", border: "1px solid #e2dcd1", borderRadius: 8, transform: "rotate(5deg)" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 330,
              height: 420,
              display: "flex",
              flexDirection: "column",
              background: "#fcfbf8",
              border: "1px solid #e2dcd1",
              borderRadius: 8,
              padding: 28,
              transform: "rotate(1deg)",
              boxShadow: "0 30px 50px -30px rgba(48,40,30,0.45)",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: "0.16em", color: muted }}>OUR STORY</div>
            <div style={{ fontFamily: "NewsreaderItalic", fontStyle: "italic", fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 12 }}>The people we love</div>
            <div style={{ display: "flex", width: 272, height: 210, marginTop: 22, borderRadius: 4, background: "linear-gradient(160deg, #d9cfbf 0%, #a99b89 55%, #586354 100%)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 14, letterSpacing: "0.12em", color: muted }}>
              <span>SINCE 2001</span>
              <span>42 MOMENTS</span>
            </div>
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ position: "absolute", right: 86, bottom: 34, display: "flex", alignItems: "center", gap: 12, fontSize: 30, color: ink }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke={oxblood} strokeWidth="1.8" strokeLinecap="round">
            <rect x="9.25" y="2.75" width="13.5" height="26.5" rx="6.75" />
            <path d="M9.4 14.6c4.3 2.2 8.9 2.2 13.2 0" />
            <circle cx="16" cy="21.6" r="1.6" fill={oxblood} />
          </svg>
          <span style={{ fontFamily: "Newsreader", letterSpacing: "-0.02em" }}>Our</span>
          <span style={{ fontFamily: "NewsreaderItalic", fontStyle: "italic", letterSpacing: "-0.02em", marginLeft: -12 }}>Life</span>
          <span style={{ fontFamily: "Newsreader", letterSpacing: "-0.02em", marginLeft: -12 }}>Capsule</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: geist, style: "normal", weight: 500 },
        { name: "Newsreader", data: serif, style: "normal", weight: 400 },
        { name: "NewsreaderItalic", data: serifItalic, style: "italic", weight: 400 },
      ],
    },
  );
}

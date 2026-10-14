"use client";

/** Last-resort boundary: replaces the root layout, so it carries its own document and styles. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f8f8f3", color: "#202d27", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#506450" }}>LifeAtlas</p>
          <h1 style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 500, margin: "16px 0" }}>Something went wrong.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4f5c53" }}>Your saved stories are still on this device. Please try again.</p>
          {error.digest ? <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#6b7569" }}>Reference {error.digest}</p> : null}
          <button onClick={() => retry()} style={{ marginTop: 16, height: 48, padding: "0 24px", border: 0, borderRadius: 10, background: "#294f3e", color: "#f8f8f3", fontSize: 16, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

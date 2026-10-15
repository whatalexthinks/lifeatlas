"use client";

/** Last-resort boundary: replaces the whole app shell, so it carries its own inline styles. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f8f6f1", color: "#252421", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#763f43" }}>OurLifeCapsule</p>
          <h1 style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 500, margin: "16px 0" }}>Something went wrong.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4a4741" }}>Your saved stories are still on this device. Please try again.</p>
          {error.digest ? <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#5c5850" }}>Reference {error.digest}</p> : null}
          <button onClick={() => retry()} style={{ marginTop: 16, height: 48, padding: "0 24px", border: 0, borderRadius: 10, background: "#252421", color: "#f8f6f1", fontSize: 16, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </div>
  );
}

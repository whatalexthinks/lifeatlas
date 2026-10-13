import { describe, expect, it } from "vitest";
import { sniffMime, validateFileDeep, validateMediaFile } from "./validation";

const bytes = (...v: (number | string)[]) => {
  const out: number[] = [];
  for (const x of v) typeof x === "string" ? out.push(...[...x].map((c) => c.charCodeAt(0))) : out.push(x);
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
};

describe("sniffMime", () => {
  it.each([
    [bytes(0xff, 0xd8, 0xff, 0xe0), "image/jpeg"],
    [bytes(0x89, "PNG"), "image/png"],
    [bytes("RIFF", 0, 0, 0, 0, "WEBP"), "image/webp"],
    [bytes("RIFF", 0, 0, 0, 0, "WAVE"), "audio/wav"],
    [bytes("OggS"), "audio/ogg"],
    [bytes(0x1a, 0x45, 0xdf, 0xa3), "audio/webm"],
    [bytes("ID3"), "audio/mpeg"],
    [bytes(0, 0, 0, 0x20, "ftypM4A "), "audio/mp4"],
    [bytes("hello world"), null],
  ])("recognises %#", (b, mime) => {
    expect(sniffMime(b)).toBe(mime);
  });
});

describe("validateMediaFile", () => {
  it("accepts a normal JPEG and rejects an empty file", () => {
    expect(validateMediaFile({ type: "image/jpeg", size: 1000, name: "a.jpg" }, "image")).toEqual({ ok: true, kind: "image", mime: "image/jpeg" });
    expect(validateMediaFile({ type: "image/jpeg", size: 0, name: "a.jpg" }, "image").ok).toBe(false);
  });
  it("explains HEIC instead of failing silently", () => {
    const r = validateMediaFile({ type: "", size: 1000, name: "IMG_0001.HEIC" }, "image");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/HEIC/);
  });
  it("rejects oversized recordings", () => {
    expect(validateMediaFile({ type: "audio/mpeg", size: 10 ** 10, name: "a.mp3" }, "audio").ok).toBe(false);
  });
});

describe("validateFileDeep", () => {
  it("catches a text file renamed to .jpg", async () => {
    const f = new File(["just some text pretending"], "photo.jpg", { type: "image/jpeg" });
    const r = await validateFileDeep(f, "image");
    expect(r.ok).toBe(false);
  });
  it("catches audio sent where a photo was expected", async () => {
    const f = new File([bytes("ID3")], "photo.jpg", { type: "image/jpeg" });
    const r = await validateFileDeep(f, "image");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/audio/);
  });
  it("accepts a real PNG signature", async () => {
    const f = new File([bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a)], "p.png", { type: "image/png" });
    expect((await validateFileDeep(f, "image")).ok).toBe(true);
  });
});

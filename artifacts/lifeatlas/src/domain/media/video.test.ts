import { describe, expect, it } from "vitest";
import { sniffVideo, validateVideoFile, VIDEO_MAX_BYTES } from "./video";

const bytes = (s: string, prefix: number[] = [0, 0, 0, 0x18]) => new Uint8Array([...prefix, ...[...s].map((c) => c.charCodeAt(0)), 0, 0, 0, 0]);

describe("video clips", () => {
  it("accepts MP4, MOV and WebM within the preview's limit", () => {
    expect(validateVideoFile({ type: "video/mp4", size: 1000, name: "a.mp4" })).toEqual({ ok: true, mime: "video/mp4" });
    expect(validateVideoFile({ type: "", size: 1000, name: "IMG_0001.MOV" })).toEqual({ ok: true, mime: "video/quicktime" });
    expect(validateVideoFile({ type: "video/webm;codecs=vp9", size: 1000, name: "a.webm" })).toEqual({ ok: true, mime: "video/webm" });
  });

  it("explains refusals in plain words", () => {
    expect(validateVideoFile({ type: "video/x-msvideo", size: 1000, name: "a.avi" })).toMatchObject({ ok: false, reason: expect.stringMatching(/MP4, MOV or WebM/) });
    expect(validateVideoFile({ type: "video/mp4", size: VIDEO_MAX_BYTES + 1, name: "big.mp4" })).toMatchObject({ ok: false, reason: expect.stringMatching(/kept in this browser/) });
    expect(validateVideoFile({ type: "video/mp4", size: 0, name: "empty.mp4" })).toMatchObject({ ok: false });
  });

  it("recognises real video by its first bytes", () => {
    expect(sniffVideo(bytes("ftypisom"))).toBe("video/mp4");
    expect(sniffVideo(bytes("ftypqt  "))).toBe("video/quicktime");
    expect(sniffVideo(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0]))).toBe("video/webm");
    expect(sniffVideo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
  });
});

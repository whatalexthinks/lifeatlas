import { describe, expect, it } from "vitest";
import { parseExifDate, readTakenDate } from "./exif";

/** Build a minimal JPEG whose EXIF block holds the given date tags. */
function jpegWith(tags: { original?: string; modified?: string }, little = true) {
  const bytes: number[] = [];
  const u16 = (n: number) => (little ? [n & 0xff, (n >> 8) & 0xff] : [(n >> 8) & 0xff, n & 0xff]);
  const u32 = (n: number) => (little ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff] : [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
  const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);

  // TIFF: header (8) + IFD0 + Exif IFD + strings, offsets relative to TIFF start.
  const ifd0Entries = (tags.modified ? 1 : 0) + (tags.original ? 1 : 0);
  const ifd0Size = 2 + ifd0Entries * 12 + 4;
  const exifOffset = 8 + ifd0Size;
  const exifSize = tags.original ? 2 + 12 + 4 : 0;
  let dataOffset = exifOffset + exifSize;
  const tiff: number[] = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8)];
  const data: number[] = [];
  tiff.push(...u16(ifd0Entries));
  if (tags.modified) {
    tiff.push(...u16(0x0132), ...u16(2), ...u32(20), ...u32(dataOffset));
    data.push(...ascii(tags.modified));
    dataOffset += 20;
  }
  if (tags.original) tiff.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(exifOffset));
  tiff.push(...u32(0));
  if (tags.original) {
    tiff.push(...u16(1), ...u16(0x9003), ...u16(2), ...u32(20), ...u32(dataOffset), ...u32(0));
    data.push(...ascii(tags.original));
  }
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff, ...data];
  bytes.push(0xff, 0xd8, 0xff, 0xe1, ((app1.length + 2) >> 8) & 0xff, (app1.length + 2) & 0xff, ...app1, 0xff, 0xda, 0, 2);
  return new Uint8Array(bytes).buffer;
}

const now = new Date("2026-10-14T12:00:00Z");

describe("photo dates from EXIF", () => {
  it("reads the shutter date in either byte order", () => {
    expect(readTakenDate(jpegWith({ original: "1998:10:17 14:03:00" }), now)).toEqual({ year: 1998, month: 10, day: 17, source: "original" });
    expect(readTakenDate(jpegWith({ original: "2001:06:16 18:30:00" }, false), now)).toEqual({ year: 2001, month: 6, day: 16, source: "original" });
  });

  it("prefers the shutter date, and labels a fallback as possibly an edit date", () => {
    expect(readTakenDate(jpegWith({ original: "1998:10:17 14:03:00", modified: "2024:01:02 09:00:00" }), now)?.source).toBe("original");
    expect(readTakenDate(jpegWith({ modified: "2024:01:02 09:00:00" }), now)).toMatchObject({ year: 2024, source: "modified" });
  });

  it("returns nothing rather than guessing", () => {
    expect(readTakenDate(jpegWith({ original: "0000:00:00 00:00:00" }), now)).toBeNull();
    expect(readTakenDate(jpegWith({}), now)).toBeNull();
    expect(readTakenDate(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer, now)).toBeNull();
    expect(readTakenDate(new ArrayBuffer(0), now)).toBeNull();
    // A truncated file never throws.
    expect(readTakenDate(jpegWith({ original: "1998:10:17 14:03:00" }).slice(0, 30), now)).toBeNull();
  });

  it("rejects impossible or future dates", () => {
    expect(parseExifDate("1998:02:30 10:00:00", now)).toBeNull();
    expect(parseExifDate("2030:01:01 00:00:00", now)).toBeNull();
    expect(parseExifDate("2024:02:29 08:00:00", now)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseExifDate("not a date", now)).toBeNull();
  });
});

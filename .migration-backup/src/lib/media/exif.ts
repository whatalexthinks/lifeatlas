/**
 * Reads the date a photo says it was taken, from a JPEG's EXIF block. Nothing else is read,
 * and nothing is applied automatically: the date is offered to the person to confirm, and
 * cameras with wrong clocks are common. Pure and dependency-free; unit-tested.
 */

export interface TakenDate {
  year: number;
  month: number;
  day: number;
  /** Which tag it came from. DateTimeOriginal is the shutter time; DateTime may be an edit time. */
  source: "original" | "digitized" | "modified";
}

const TAG_EXIF_IFD = 0x8769;
const TAG_DATETIME = 0x0132;
const TAG_ORIGINAL = 0x9003;
const TAG_DIGITIZED = 0x9004;

/** Parse "YYYY:MM:DD HH:MM:SS". Rejects zeroed and impossible dates. */
export function parseExifDate(text: string, now = new Date()): Omit<TakenDate, "source"> | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(text.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (year < 1826 || year > now.getFullYear() + 1 || month < 1 || month > 12 || day < 1) return null;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > last) return null;
  return { year, month, day };
}

/** Find the photo's taken date in the first bytes of a JPEG. Returns null when there isn't one. */
export function readTakenDate(buffer: ArrayBuffer, now = new Date()): TakenDate | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) return null; // image data began; no EXIF
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1 && size >= 8 && offset + 4 + 6 <= view.byteLength) {
      const isExif = view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0; // "Exif\0\0"
      if (isExif) return readTiff(view, offset + 10, Math.min(view.byteLength, offset + 2 + size), now);
    }
    offset += 2 + size;
  }
  return null;
}

function readTiff(view: DataView, start: number, end: number, now: Date): TakenDate | null {
  if (start + 8 > end) return null;
  const order = view.getUint16(start);
  const little = order === 0x4949; // "II"
  if (!little && order !== 0x4d4d) return null; // "MM"
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);
  if (u16(start + 2) !== 42) return null;

  const readAscii = (entry: number) => {
    const count = u32(entry + 4);
    const at = count > 4 ? start + u32(entry + 8) : entry + 8;
    if (at < start || at + count > end) return null;
    let s = "";
    for (let i = 0; i < count; i++) {
      const c = view.getUint8(at + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  };

  const scan = (ifd: number) => {
    const found = new Map<number, number>();
    if (ifd < start || ifd + 2 > end) return found;
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > end) break;
      found.set(u16(entry), entry);
    }
    return found;
  };

  const ifd0 = scan(start + u32(start + 4));
  const exifPointer = ifd0.get(TAG_EXIF_IFD);
  const exif = exifPointer !== undefined ? scan(start + u32(exifPointer + 8)) : new Map<number, number>();

  const tries: [Map<number, number>, number, TakenDate["source"]][] = [
    [exif, TAG_ORIGINAL, "original"],
    [exif, TAG_DIGITIZED, "digitized"],
    [ifd0, TAG_DATETIME, "modified"],
  ];
  for (const [table, tag, source] of tries) {
    const entry = table.get(tag);
    if (entry === undefined) continue;
    const text = readAscii(entry);
    const date = text ? parseExifDate(text, now) : null;
    if (date) return { ...date, source };
  }
  return null;
}

/** Read just enough of a file to find its EXIF date. */
export async function takenDateOf(file: Blob): Promise<TakenDate | null> {
  if (!/jpe?g/i.test(file.type)) return null;
  try {
    return readTakenDate(await file.slice(0, 256 * 1024).arrayBuffer());
  } catch {
    return null;
  }
}

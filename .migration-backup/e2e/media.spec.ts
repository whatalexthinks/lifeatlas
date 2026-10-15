import { test, expect } from "@playwright/test";

/**
 * Photos and video in a real browser: the camera's date is offered (never assumed), photos
 * can be reordered without a mouse, and a short clip is stored with the memory.
 */

/** A minimal JPEG whose EXIF block says it was taken on the given date. */
function jpegTakenOn(date: string) {
  const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
  const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
  const text = [...`${date} 12:00:00`].map((c) => c.charCodeAt(0)).concat(0);
  const exifOffset = 8 + 2 + 12 + 4;
  const dataOffset = exifOffset + 2 + 12 + 4;
  const tiff = [0x49, 0x49, ...u16(42), ...u32(8), ...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(exifOffset), ...u32(0), ...u16(1), ...u16(0x9003), ...u16(2), ...u32(text.length), ...u32(dataOffset), ...u32(0), ...text];
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  return Buffer.from([0xff, 0xd8, 0xff, 0xe1, ((app1.length + 2) >> 8) & 0xff, (app1.length + 2) & 0xff, ...app1, 0xff, 0xd9]);
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const mp4 = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 2, 0, 0x69, 0x73, 0x6f, 0x6d]);

test("a photo's date is offered, photos reorder by keyboard, and a clip is kept with the memory", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app/gather?capsule=cap_us&question=q_ourstory_2");
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByLabel("Your answer").fill("The night the power went out and we played cards by candlelight.");

  await page.getByRole("button", { name: "Add a photo" }).click();
  await page.locator('input[type=file][accept^="image/"]').setInputFiles([
    { name: "candles.jpg", mimeType: "image/jpeg", buffer: jpegTakenOn("1999:01:09") },
    { name: "cards.png", mimeType: "image/png", buffer: png },
  ]);
  // The camera date is suggested, not applied.
  const suggestion = page.getByRole("status").filter({ hasText: "Your photo says it was taken on" });
  await expect(suggestion).toContainText("January 9, 1999");
  await suggestion.getByRole("button", { name: "Use this date" }).click();
  await expect(suggestion).toHaveCount(0);

  // Reorder without dragging: the second photo becomes the first.
  await page.getByRole("button", { name: "Move photo 2 earlier" }).click();
  await expect(page.getByText("Photo moved to position 1 of 2.")).toBeAttached();

  await page.getByRole("button", { name: /Add a short video/ }).click();
  await page.getByLabel("Choose a video").setInputFiles({ name: "candles.mp4", mimeType: "video/mp4", buffer: mp4 });
  await expect(page.getByRole("button", { name: "Remove video 1" })).toBeVisible();

  await page.getByRole("button", { name: "Keep this memory" }).click();
  // The saved memory carries its clip and the date that was confirmed.
  await expect(page.locator("article video").first()).toBeAttached();
  await page.goto("/app/capsules/cap_us/timeline");
  // Counts are icons with spoken labels, so check what a screen reader hears.
  await expect(page.getByRole("button", { name: /^January 9, 1999 .*candlelight.* 2 photos 1 video/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a file that only pretends to be a video is refused, in plain words", async ({ page }) => {
  await page.goto("/app/gather?capsule=cap_us&question=q_ourstory_2");
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByRole("button", { name: /Add a short video/ }).click();
  await page.getByLabel("Choose a video").setInputFiles({ name: "notes.mp4", mimeType: "video/mp4", buffer: Buffer.from("this is not a video at all") });
  await expect(page.getByRole("alert").filter({ hasText: "notes.mp4" })).toContainText("couldn't recognise this video");
});

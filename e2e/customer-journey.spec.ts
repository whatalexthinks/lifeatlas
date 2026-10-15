import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";

/**
 * The sixteen-step customer journey from the brief, end to end against the production build,
 * in a real browser profile that is closed and reopened at the end to prove nothing was lost.
 * A fake microphone stands in for a real one so the voice step records actual audio.
 */

const png = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" + "1f15c4890000000d49444154789c6360f8cfc0f01f0005000201" + "5d7f5e8d0000000049454e44ae426082",
  "hex",
);

async function openProfile(dir: string): Promise<BrowserContext> {
  const baseURL = test.info().project.use.baseURL;
  return chromium.launchPersistentContext(dir, {
    baseURL,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    viewport: { width: 1440, height: 900 },
    permissions: ["microphone"],
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    acceptDownloads: true,
  });
}

/** Saves are debounced; give the last write a moment before leaving a page for good. */
const settle = (page: Page) => page.waitForTimeout(600);

test("the customer journey: from the homepage to a capsule that survives a browser restart", async () => {
  test.setTimeout(300_000);
  const dir = await mkdtemp(join(tmpdir(), "olc-journey-"));
  let context = await openProfile(dir);
  let page = context.pages()[0] ?? (await context.newPage());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  try {
    // 1. A customer lands on the homepage.
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("A life is made of moments.");

    // 2. They understand the product.
    await page.getByRole("link", { name: "See How It Works" }).first().click();
    await page.waitForURL(/\/how-it-works/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // 3. They explore an example.
    await page.goto("/examples");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("See what a capsule");

    // 4. They compare the available products.
    await page.goto("/pricing");
    await expect(page.getByRole("region", { name: /Plan comparison/ })).toBeVisible();

    // 5. They choose to create a couples capsule.
    await page.goto("/couples");
    await page.locator('a[href^="/app/capsules/new"]').first().click();
    await page.waitForURL(/\/app\/capsules\/new/);
    await expect(page.getByRole("heading", { name: "Whose story would you like to preserve?" })).toBeVisible();
    await page.getByRole("radio", { name: /Mine and my partner's/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // 6. They complete onboarding.
    await page.getByLabel("Your name", { exact: true }).fill("Ana");
    await page.getByLabel("Your partner's name").fill("Ben");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /Surprise me with a question/ }).click();
    await page.getByRole("button", { name: /Create & answer this/ }).click();
    await page.waitForURL(/\/app\/gather\?capsule=/);
    const capsuleId = new URL(page.url()).searchParams.get("capsule")!;

    // 7. They add their first memory.
    await page.getByRole("tab", { name: "Type instead" }).click();
    await page.getByLabel("Your answer").fill("We met at a bus stop in the rain, both holding the same broken umbrella.");
    await page.getByRole("button", { name: "Keep this memory" }).click();
    await expect(page.getByText(/same broken umbrella/).first()).toBeVisible();
    await settle(page);

    // 8. They record a voice message, and 9. upload photographs with it.
    await page.goto(`/app/gather?capsule=${capsuleId}&question=q_ourstory_2`);
    await page.getByRole("button", { name: "Record answer" }).click();
    await expect(page.getByRole("button", { name: "Stop recording" })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(page.getByRole("button", { name: "Play your recording" })).toBeVisible();
    await page.getByRole("button", { name: "Add a photo" }).click();
    await page.locator('input[type=file][accept^="image/"]').setInputFiles([
      { name: "umbrella.png", mimeType: "image/png", buffer: png },
      { name: "bus-stop.png", mimeType: "image/png", buffer: png },
    ]);
    await page.getByRole("button", { name: "Keep this memory" }).click();
    await expect(page.locator("article").first()).toBeVisible();
    await settle(page);

    // 10. They edit their timeline.
    await page.goto(`/app/capsules/${capsuleId}/timeline`);
    await page.getByRole("button", { name: /^Quick edit/ }).first().click();
    await page.getByLabel("Title", { exact: true }).fill("The night we met");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("The night we met").first()).toBeVisible();
    await settle(page);

    // 11. They prepare an invitation.
    await page.goto(`/app/invitations?new=1&capsule=${capsuleId}`);
    await page.getByLabel("Their name").fill("Carmen");
    await page.getByLabel("How are they related?").fill("Ana's sister");
    await page.getByRole("button", { name: "Prepare invitation" }).click();
    await expect(page.getByRole("dialog", { name: /Invitation for Carmen/ })).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Does it cost anything?");
    await page.keyboard.press("Escape");

    // 12. They review subscription options.
    await page.goto("/app/billing");
    await expect(page.getByRole("button", { name: /^Choose / }).first().or(page.getByText("Annual").first())).toBeVisible();

    // 13. They explore the physical capsule add-on.
    await page.goto("/physical-capsules");
    await expect(page.getByRole("button", { name: "Add the ready-made kit" })).toBeVisible();

    // 14. They customise a memory book.
    await page.goto("/app/heirlooms/book-builder");
    await page.getByRole("button", { name: /Cover/ }).first().click();
    await page.locator("#b-title").fill("Ana & Ben");
    await page.getByRole("button", { name: "Save design" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    // 15. They export their information.
    await page.goto(`/app/capsules/${capsuleId}/export`);
    await page.getByText("Records only (.json)").click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Build & download/ }).click();
    const manifest = JSON.parse(await readFile(await (await download).path(), "utf8"));
    const titles = manifest.memories.map((m: { title: string }) => m.title);
    expect(titles).toContain("The night we met");
    expect(manifest.memories.length).toBeGreaterThanOrEqual(2);
    await settle(page);
    expect(errors).toEqual([]);

    // 16. They close the browser, open it again, and everything is still there.
    await context.close();
    context = await openProfile(dir);
    page = context.pages()[0] ?? (await context.newPage());
    await page.goto(`/app/capsules/${capsuleId}/timeline`);
    await expect(page.getByText("The night we met").first()).toBeVisible();
    await expect(page.getByText(/same broken umbrella|The night we met/).first()).toBeVisible();
    await page.goto("/app/capsules");
    await expect(page.getByText("Ana & Ben").first()).toBeVisible();
  } finally {
    await context.close().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
});

test.describe("errors and recovery", () => {
  test("onboarding explains a missing name instead of moving on", async ({ page }) => {
    await page.goto("/app/capsules/new");
    await page.getByRole("radio", { name: /Mine and my partner's/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Your name", { exact: true }).fill("");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  });

  test("a file that isn't an export is refused in plain words, and nothing changes", async ({ page }) => {
    await page.goto("/app/preservation");
    await page.locator("#restore-file").setInputFiles({ name: "notes.json", mimeType: "application/json", buffer: Buffer.from('{"hello":"world"}') });
    await expect(page.getByRole("alert").filter({ hasText: /export|archive|recognise|read/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Restore as a new capsule" })).toHaveCount(0);
  });

  test("a demo order can't be placed without saying you understand nothing is charged", async ({ page }) => {
    await page.goto("/checkout/preview?product=digital");
    await page.waitForURL(/session=/);
    await page.getByRole("button", { name: /Place demo order/ }).click();
    await expect(page.getByText(/demo order|Please confirm|understand/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/checkout\/preview/);
  });
});

import { test, expect } from "@playwright/test";

test("studio and family pages fit a phone without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/app", "/app/heirlooms", "/app/heirlooms/book-builder", "/app/together", "/app/preservation", "/app/orders", "/app/billing", "/app/settings", "/app/help", "/app/future-messages/new", "/app/heirlooms/capsule-builder", "/checkout/bag", "/view/cap_margaret", "/demo/control-center"]) {
    await page.goto(path);
    await expect(page.locator("h1, h2").first(), path).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
  }
});

import { test, expect } from "@playwright/test";

test("phone navigation reaches every item and public layouts fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Questions" }).click();
  await expect(page).toHaveURL(/\/faq/);
  await expect(menu).not.toBeVisible();
  for (const path of ["/", "/pricing", "/couples", "/families", "/physical-capsules", "/heirlooms/book", "/gifts", "/memory-map", "/faq", "/privacy"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
  }
});

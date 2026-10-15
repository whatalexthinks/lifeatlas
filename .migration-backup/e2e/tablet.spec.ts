import { test, expect } from "@playwright/test";

/** Tablet portrait and landscape: the in-between widths where layouts most often break. */
const routes = [
  "/",
  "/pricing",
  "/app",
  "/app/capsules",
  "/app/capsules/cap_margaret",
  "/app/capsules/cap_margaret/memories",
  "/app/capsules/cap_margaret/timeline",
  "/app/capsules/new",
  "/app/gather",
  "/app/invitations",
  "/app/family",
  "/app/future-messages",
  "/app/future-messages/new",
  "/app/heirlooms",
  "/app/heirlooms/book-builder",
  "/app/heirlooms/capsule-builder",
  "/app/together",
  "/app/preservation",
  "/app/orders",
  "/app/billing",
  "/app/settings",
  "/app/help",
  "/view/cap_margaret",
  "/view/cap_margaret/stories",
  "/view/cap_margaret/map",
  "/view/cap_margaret/photos",
  "/contribute/emma-blue-bowl",
  "/demo/control-center",
  "/demo/operations",
];

for (const [label, viewport] of [
  ["portrait", { width: 768, height: 1024 }],
  ["landscape", { width: 1024, height: 768 }],
] as const) {
  test(`every main page fits a tablet in ${label} without sideways scrolling`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize(viewport);
    const overflowing: string[] = [];
    for (const path of routes) {
      await page.goto(path);
      await expect(page.locator("h1, h2").first(), path).toBeVisible();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 0) overflowing.push(`${path} (+${over}px)`);
    }
    expect(overflowing).toEqual([]);
  });
}

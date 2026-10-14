import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("phone layouts meet WCAG 2.2 AA automated checks", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems: string[] = [];
  for (const path of ["/", "/pricing", "/app", "/app/family", "/app/billing", "/app/orders", "/app/heirlooms/book-builder", "/app/together", "/view/cap_margaret", "/contribute/emma-blue-bowl"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    for (const v of violations) problems.push(`${path} — ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  }
  expect(problems).toEqual([]);
});

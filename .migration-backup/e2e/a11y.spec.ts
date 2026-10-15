import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { untilAnimationsSettle } from "./support/settle";

/**
 * Automated WCAG 2.2 AA checks (axe-core). Automated rules catch roughly a third of
 * accessibility issues — keyboard, screen-reader and "incomplete" results still need
 * human review — but contrast, names, roles and target sizes must never regress.
 */
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const publicRoutes = ["/", "/pricing", "/how-it-works", "/couples", "/families", "/personal", "/legacy", "/gifts", "/physical-capsules", "/examples", "/about", "/support", "/contact", "/privacy", "/r/SARAH-K7PQ", "/heirlooms/book", "/faq", "/gifts/build", "/no-such-page"];
const appRoutes = [
  "/app",
  "/app/capsules/cap_margaret",
  "/app/capsules/cap_margaret/memories",
  "/app/capsules/cap_margaret/map",
  "/app/capsules/new",
  "/app/invitations",
  "/app/family",
  "/app/future-messages",
  "/app/heirlooms/book-builder",
  "/app/heirlooms/capsule-builder",
  "/app/together",
  "/app/future-messages/new",
  "/app/preservation",
  "/app/orders",
  "/app/billing",
  "/app/settings",
  "/app/help",
  "/view/cap_margaret",
  "/view/cap_margaret/stories",
  "/view/cap_margaret/stories?q=bread",
  "/view/cap_margaret/stories?saved=1",
  "/view/cap_margaret/map",
  "/contribute/emma-blue-bowl",
  "/gift/for-grandpa-walt",
  "/future/open/example-opening",
  "/checkout/preview?product=digital",
  "/checkout/bag",
  "/app/referrals",
  "/demo/control-center",
  "/demo/operations",
  "/demo/style-guide",
];

async function audit(page: Page, routes: string[]) {
  const problems: string[] = [];
  for (const path of routes) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await untilAnimationsSettle(page);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    for (const v of violations) problems.push(`${path} — ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")})`);
  }
  return problems;
}

test("public pages meet WCAG 2.2 AA automated checks", async ({ page }) => {
  test.setTimeout(180_000); // ~20 pages, each audited after its entrance animations settle
  expect(await audit(page, publicRoutes)).toEqual([]);
});

test("studio, family and demo pages meet WCAG 2.2 AA automated checks", async ({ page }) => {
  test.setTimeout(240_000); // ~30 pages, each audited after its entrance animations settle
  expect(await audit(page, appRoutes)).toEqual([]);
});

test("pages added for drafts, sessions, restore and proofs pass too", async ({ page }) => {
  // Make the states exist first: a saved box design, a paused holiday session, a draft answer.
  await page.goto("/app/heirlooms/capsule-builder");
  await page.getByRole("button", { name: "Save design" }).click();
  const proof = await page.getByRole("link", { name: "Proof" }).getAttribute("href");
  await page.goto("/app/together");
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForURL(/session=/);
  const session = new URL(page.url()).search;
  await page.goto("/app/family");
  // A viewer-only person: their preview opens the family viewer.
  await page.getByRole("button", { name: "Preview as Leo Ellis" }).click();
  await page.waitForURL(/\/view\//);
  const preview = await audit(page, ["/view/cap_family", "/view/cap_family/stories?q=ferry"]);
  await page.getByRole("button", { name: "Back to Sarah" }).click();
  await page.waitForTimeout(300);
  expect([...preview, ...(await audit(page, [proof!, `/app/together${session}`, "/app/together", "/contribute/emma-blue-bowl"]))]).toEqual([]);
});

test("the evening theme keeps its contrast", async ({ page }) => {
  await page.goto("/app/settings");
  await page.getByRole("radio", { name: /Evening/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "evening");
  await page.waitForTimeout(500); // let the preference save before navigating
  expect(await audit(page, ["/app", "/app/heirlooms", "/app/heirlooms/book-builder", "/app/billing", "/app/settings", "/app/family", "/app/orders"])).toEqual([]);
});

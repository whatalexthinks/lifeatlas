import { test, expect } from "@playwright/test";
import { marketingPages } from "../src/data/marketing-pages";

/** Pages with their own route (each built differently, not from the shared template). */
const dedicated = ["how-it-works", "couples", "families", "personal", "legacy", "gifts", "physical-capsules", "pricing", "examples", "faq", "about", "support", "contact", "privacy", "terms"];

test("every public page renders and unknown routes stay 404", async ({ request }) => {
  for (const slug of Object.keys(marketingPages)) {
    const response = await request.get(`/${slug}`);
    expect(response.status(), `/${slug}`).toBe(200);
    expect(await response.text()).toContain(marketingPages[slug].title);
  }
  for (const slug of dedicated) {
    const response = await request.get(`/${slug}`);
    expect(response.status(), `/${slug}`).toBe(200);
  }
  expect((await request.get("/not-a-real-ourlifecapsule-page")).status()).toBe(404);
  const demo = await request.get("/demo");
  expect(demo.url()).toContain("/view/cap_margaret");
  expect(demo.status()).toBe(200);
});

test("homepage: a recording plays, Surprise Me offers a new question, FAQs open, and the main action starts a capsule", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "A life is made of moments. Keep them close." })).toBeVisible();

  await page.getByRole("button", { name: "Play The kitchen always smelled of bread" }).click();
  await expect(page.getByRole("button", { name: "Pause The kitchen always smelled of bread" })).toBeVisible();
  await page.getByRole("button", { name: "Pause The kitchen always smelled of bread" }).click();

  const question = page.getByRole("status", { name: "Suggested question" });
  const before = await question.innerText();
  await page.getByRole("button", { name: "Surprise me with a question" }).click();
  await expect(question).not.toHaveText(before);

  const faq = page.locator("details").filter({ hasText: "Are my memories backed up?" });
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq).toContainText("Not in this preview");

  // Prices shown come from the catalog, and nothing claims to charge.
  await expect(page.getByText("$99").first()).toBeVisible();
  await expect(page.getByText(/Test price · nothing is charged/).first()).toBeVisible();

  await page.getByRole("link", { name: "Create Your LifeCapsule" }).first().click();
  await expect(page).toHaveURL(/\/app\/capsules\/new/);
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});

test("audience pages lead to onboarding with the right kind chosen", async ({ page }) => {
  await page.goto("/couples");
  await page.getByRole("link", { name: "Start your story together" }).first().click();
  await expect(page).toHaveURL(/kind=couple/);
  await expect(page.getByRole("radio", { name: /Mine and my partner/ })).toBeChecked();
});

test("a friend's referral link is remembered for checkout, and can be forgotten", async ({ page }) => {
  await page.goto("/r/sarah-k7pq");
  await expect(page.getByText("Code SARAH-K7PQ is remembered on this device")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("lifeatlas.referral"))).toBe("SARAH-K7PQ");
  await page.getByRole("button", { name: "Forget it" }).click();
  await expect(page.getByText(/forgotten on this device/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("lifeatlas.referral"))).toBeNull();
  await page.goto("/r/%3Cscript%3E");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn’t look");
});

test("the contact form is honest: saved on this device, not sent", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Save message" }).click();
  await expect(page.getByLabel("Your name")).toBeFocused();
  await page.getByLabel("Your name").fill("Ana");
  await page.getByLabel("Email").fill("ana@example.com");
  await page.getByLabel("Your message").fill("Can I add my grandmother's recipes as photographs?");
  await page.getByRole("button", { name: "Save message" }).click();
  await expect(page.getByText("Saved on this device — not sent.")).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { marketingPages } from "../src/data/marketing-pages";

test("all public navigation destinations render and unknown routes stay 404", async ({ request }) => {
  for (const slug of Object.keys(marketingPages)) {
    const response = await request.get(`/${slug}`);
    expect(response.status(), `/${slug}`).toBe(200);
    expect(await response.text()).toContain(marketingPages[slug].title);
  }
  expect((await request.get("/not-a-real-lifeatlas-page")).status()).toBe(404);
  const demo = await request.get("/demo");
  expect(demo.url()).toContain("/view/cap_margaret");
  expect(demo.status()).toBe(200);
});

test("landing archive plays narration, FAQs expand, and the primary action opens the studio", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A whole life. In their words." })).toBeVisible();
  const listen = page.getByRole("button", { name: "Listen to sample narration" });
  await listen.click();
  await expect(listen).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Play The summer we forgot the time" }).click();
  await expect(page.getByRole("button", { name: "Pause The summer we forgot the time" })).toBeVisible();
  await page.getByRole("button", { name: "Pause The summer we forgot the time" }).click();
  const faq = page.locator("details").filter({ hasText: "Are my memories backed up?" });
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq).toContainText("Not in this preview");
  await page.locator(".la-hero-copy").getByRole("link", { name: "Start their story" }).click();
  await expect(page).toHaveURL(/\/app\/capsules\/new/);
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});

import { test, expect } from "@playwright/test";

/**
 * Who sees what, what an invitation promises, and how honestly a letter for the future
 * describes where it is.
 */

test("a story shared with selected people reaches exactly them", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app/capsules/cap_margaret/memories?open=mem_summer");
  await page.getByRole("radio", { name: /Selected people/ }).click();
  // Choosing nobody isn't a choice: it says so instead of saving something unclear.
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Choose at least one person" })).toBeVisible();
  await page.getByRole("checkbox", { name: /Emma Ellis/ }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved on this device", { exact: true })).toBeVisible();

  // Emma was chosen: she can open it.
  await page.goto("/app/family");
  await page.getByRole("button", { name: "Preview as Emma Ellis" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/app/family"));
  await page.goto("/view/cap_margaret/stories/mem_summer");
  await expect(page.getByRole("heading", { name: "The summer we forgot the time" })).toBeVisible();

  // Jonah wasn't: the story isn't there for him.
  await page.getByRole("button", { name: "Back to Sarah" }).click();
  await page.goto("/app/family");
  await page.getByRole("button", { name: "Preview as Jonah Reed" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/app/family"));
  await page.goto("/view/cap_margaret/stories/mem_summer");
  await expect(page.getByText("It may be private")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The summer we forgot the time" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a letter for a particular year, with a story given, never claims to be scheduled", async ({ page }) => {
  await page.goto("/app/future-messages/new");
  await page.getByLabel("Connected capsule").selectOption({ label: "Margaret Ellis" });
  await page.getByLabel("Their name").fill("Leo Ellis");
  await page.getByLabel("They are your…").fill("Grandson");
  await page.getByLabel("Title").fill("For Leo, in 2040");
  await page.getByLabel("The letter").fill("Dear Leo, by now you will have your own stories. Here is one of hers.");
  await page.getByRole("radio", { name: "In a particular year" }).click();
  await page.getByLabel("Year", { exact: true }).selectOption("2040");
  const showAll = page.getByRole("button", { name: /Show all \d+ stories/ });
  if (await showAll.count()) await showAll.click();
  await page.getByRole("checkbox", { name: /The summer we forgot the time/ }).check();
  await expect(page.getByText("1 story chosen.")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();

  await page.waitForURL(/\/app\/future-messages$/);
  const card = page.locator("article").filter({ hasText: "For Leo, in 2040" });
  await expect(card).toContainText("In 2040");
  await expect(card).toContainText("Step 2 of 6 · Saved on this device. Not uploaded, not scheduled.");
  await card.locator("summary").click();
  await expect(card.getByRole("list", { name: "Where this letter is" })).toContainText("Scheduled with a delivery service — Not available yet.");
  // Nowhere does a letter on this device read as "Scheduled".
  await expect(page.getByText("Scheduled", { exact: true })).toHaveCount(0);

  await card.getByRole("button", { name: "Preview opening" }).click();
  await page.getByRole("button", { name: "Break the seal" }).click();
  await expect(page.getByRole("region", { name: "Stories given with this letter" })).toContainText("The summer we forgot the time");
});

test("an invitation says who is asking, what it is, the ask, the cost and the use", async ({ page }) => {
  await page.goto("/contribute/emma-blue-bowl");
  for (const title of ["Who invited you", "What this is", "What you're asked to do", "Does it cost anything?", "How what you share is used"]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(/^No\. It's free for you/)).toBeVisible();
});

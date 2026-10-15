import { test, expect } from "@playwright/test";
import { untilAnimationsSettle as settle } from "./support/settle";

/**
 * The bag and the ready-made kit: priced openly (the Family plan's keepsake discount included),
 * never charged, and never described as proofed when there was nothing to proof.
 */
test("the ready-made kit goes through the bag to an honest, uncharged order", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/physical-capsules");
  await page.getByRole("button", { name: "Add the ready-made kit" }).click();
  await page.waitForURL(/\/checkout\/bag/);

  await expect(page.getByText("Ready-made kit, would ship after payment.")).toBeVisible();
  await expect(page.getByText("Family plan · 10% off keepsakes")).toBeVisible();
  await page.getByRole("button", { name: /One more/ }).click();
  await expect(page.getByLabel("Quantity 2")).toBeVisible();
  await page.getByRole("button", { name: /One fewer/ }).click();
  await expect(page.getByLabel("Quantity 1")).toBeVisible();
  // The header knows what's in the bag.
  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: /Bag, 1 item/ })).toBeVisible();
  await page.getByRole("link", { name: /Bag, 1 item/ }).click();

  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.waitForURL(/\/checkout\/preview\?session=/);
  await expect(page.getByText("Family plan · 10% off keepsakes")).toBeVisible();
  await page.locator("#s-line1").fill("12 Sample Street");
  await page.locator("#s-city").fill("Portland");
  await page.locator("#s-region").fill("ME");
  await page.locator("#s-postalCode").fill("04101");
  await page.getByText("I understand this is a demo order and no payment is taken").click();
  await page.getByRole("button", { name: /Place demo order/ }).click();
  await page.waitForURL(/\/checkout\/complete/);
  await expect(page.getByText("No payment was charged.")).toBeVisible();
  await settle(page);

  await page.goto("/app/orders");
  await expect(page.getByText("Ready to pack · demo").first()).toBeVisible();
  await expect(page.getByText("Proof approved")).toHaveCount(0);
  // The bag empties once the order is placed.
  await page.goto("/checkout/bag");
  await expect(page.getByText("Your bag is empty")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a box can't be ordered before what goes inside it exists", async ({ page }) => {
  await page.goto("/app/heirlooms/capsule-builder");
  await expect(page.getByText("Made to order.", { exact: false })).toBeVisible();
  await page.getByRole("radio", { name: "Your words" }).click();
  await page.getByLabel("Text", { exact: true }).fill("");
  await expect(page.getByRole("list", { name: "Before this box can be ordered" })).toContainText("Write the words for the lid");
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
  await page.getByLabel("Text", { exact: true }).fill("For the Ellis family");
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeEnabled();
});

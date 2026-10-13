import { test, expect, type Page } from "@playwright/test";

/** Saves are debounced (~220 ms). Before a full reload, give the last edit time to reach IndexedDB. */
const settle = (page: Page) => page.waitForTimeout(500);

/** Collect uncaught page errors so every test can assert a clean run. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

const studioRoutes = [
  "/app",
  "/app/capsules",
  "/app/capsules/cap_margaret",
  "/app/capsules/cap_margaret/memories",
  "/app/capsules/cap_margaret/map",
  "/app/invitations",
  "/app/family",
  "/app/future-messages",
  "/app/future-messages/new",
  "/app/heirlooms",
  "/app/heirlooms/book-builder",
  "/app/heirlooms/capsule-builder",
  "/app/together",
  "/app/preservation",
  "/app/preservation/successor",
  "/app/orders",
  "/app/billing",
  "/app/settings",
  "/app/help",
  "/demo/control-center",
  "/demo/operations",
  "/view/cap_margaret",
  "/view/cap_margaret/map",
  "/future/open/example-opening",
  "/gift/for-grandpa-walt",
];

test("every studio, viewer and operations page renders cleanly", async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of studioRoutes) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1, h2").first(), path).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("private routes are never indexed", async ({ request }) => {
  for (const path of ["/app", "/view/cap_margaret", "/contribute/emma-blue-bowl", "/checkout/preview", "/proof/book/x"]) {
    const res = await request.get(path);
    expect(res.headers()["x-robots-tag"], path).toContain("noindex");
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /app");
});

test("every page shares a working preview image", async ({ request }) => {
  for (const path of ["/", "/pricing", "/app"]) {
    const html = await (await request.get(path)).text();
    const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
    expect(og, path).toBeTruthy();
    const image = await request.get(new URL(og!).pathname + new URL(og!).search);
    expect(image.status(), path).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
  }
});

test("a relative's story travels from invitation to review to the family viewer", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/app/invitations?new=1");
  await page.getByLabel("Their name").fill("Ruth Comeau");
  await page.getByLabel("How are they related?").fill("Cousin");
  await page.getByLabel("A personal note").fill("You were there for the lighthouse summers.");
  await page.getByRole("button", { name: "Prepare invitation" }).click();
  await expect(page.getByRole("dialog", { name: /Invitation for Ruth Comeau/ })).toBeVisible();
  await expect(page.getByText(/no email sent/i).first()).toBeVisible();

  await page.getByRole("button", { name: /Open as Ruth/ }).click();
  await page.waitForURL(/\/contribute\//);
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByLabel("Your answer").fill("Aunt Margaret let us stay up for the foghorn. She said it was the coast saying hello.");
  await page.getByRole("button", { name: /Send this memory/ }).click();
  await expect(page.getByText("Thank you. It's on its way.")).toBeVisible();

  await page.goto("/app/invitations?tab=review");
  const card = page.locator("article", { hasText: "From Ruth Comeau" }).first();
  await card.getByRole("button", { name: "Approve" }).click();
  await settle(page);

  await page.goto("/view/cap_margaret/timeline");
  await expect(page.getByText(/coast saying hello/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("a printed book goes from design to an uncharged demo order with a proof", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/app/heirlooms/book-builder");
  await page.getByRole("button", { name: /Cover/ }).first().click();
  await page.locator("#b-title").fill("Grandma Margaret");
  await page.getByRole("radio", { name: "terracotta" }).click();
  await page.getByRole("button", { name: /Review a demo order/ }).click();

  await page.waitForURL(/\/checkout\/preview\?session=/);
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
  await page.getByLabel("Name", { exact: true }).fill("Sarah Ellis");
  await page.getByLabel("Email for the demo receipt").fill("sarah@example.com");
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
  await expect(page.getByText("Grandma Margaret — printed book").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve proof" })).toBeVisible();

  await page.goto("/app/heirlooms");
  const proofHref = await page.getByRole("link", { name: "Proof" }).first().getAttribute("href");
  await page.goto(proofHref!);
  await expect(page.getByRole("button", { name: /Print or save as PDF/ })).toBeVisible();
  await expect(page.getByText("Demo proof").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("a holiday session keeps answers and prints a booklet", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/app/together");
  await page.getByLabel("Add a guest").fill("Aunt Ruth");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByRole("radio", { name: /Type/ }).click();
  await page.getByRole("textbox").first().fill("We always burned the first batch of rolls.");
  await page.getByRole("button", { name: "Keep this answer" }).click();
  await expect(page.getByText(/Pass it to/)).toBeVisible();
  await page.getByRole("button", { name: /ready/ }).click();
  await page.getByRole("button", { name: "End & see booklet" }).click();
  await expect(page.getByText("We always burned the first batch of rolls.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Print the booklet" })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("a future letter seals with a fingerprint and is never scheduled", async ({ page }) => {
  await page.goto("/app/future-messages");
  await page.getByRole("button", { name: "Seal (demo)" }).first().click();
  await expect(page.getByText(/Fingerprint [0-9a-f]{10}/)).toBeVisible();
  await page.getByRole("radio", { name: /Waiting for the service/ }).click();
  await page.getByRole("button", { name: "Try scheduling delivery" }).click();
  await expect(page.getByText("Long-term delivery coming later")).toBeVisible();
});

test("operations edits flow into checkout and simulations land in review", async ({ page }) => {
  await page.goto("/demo/operations#catalog");
  const row = page.locator("li", { hasText: "Personal Capsule" }).first();
  await row.locator("input").fill("44.00");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/Personal Capsule updated/)).toBeVisible();
  await settle(page);
  await page.goto("/checkout/preview?product=personal");
  await expect(page.getByText("$44").first()).toBeVisible();

  await page.goto("/demo/control-center");
  await page.getByRole("button", { name: /A relative sends a story/ }).click();
  await expect(page.getByText("Daniel's story is waiting in review.")).toBeVisible();
  await settle(page);
  await page.goto("/app/invitations?tab=review");
  await expect(page.getByText("The radio in the workshop").first()).toBeVisible();
});

test("preservation is honest and the archive downloads", async ({ page }) => {
  await page.goto("/app/preservation");
  await expect(page.getByText("These stories are not backed up.")).toBeVisible();
  await expect(page.getByText("Not connected").first()).toBeVisible();
  await page.getByText("Single offline page (.html)").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Build & download/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^lifeatlas-.*\.html$/);
});

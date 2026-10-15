import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";

/**
 * The journeys that matter most, end to end, against the production build: a new archive
 * from first question to a portable file, and the safety nets around unfinished work.
 */

/** Saves are debounced (~220 ms). Before a full reload, give the last edit time to land. */
const settle = (page: Page) => page.waitForTimeout(500);

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test("create → contribute → approve → explore → export → restore", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = trackErrors(page);

  // 1. Create a capsule with the wizard and answer its first question.
  await page.goto("/app/capsules/new");
  await page.getByRole("radio", { name: /Someone special/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Their name").fill("Rosa Delgado");
  await page.getByLabel(/Who are they to you/).fill("Neighbour");
  await page.getByLabel(/Year born/).fill("1938");
  await expect(page.getByLabel("Capsule name")).toHaveValue("The Stories of Rosa");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Surprise me with a question/ }).click();
  await page.getByRole("button", { name: /Create & answer this/ }).click();
  await page.waitForURL(/\/app\/gather\?capsule=/);
  const capsuleId = new URL(page.url()).searchParams.get("capsule")!;
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByLabel("Your answer").fill("Rosa kept a lemon tree on the fire escape for forty years.");
  await page.getByRole("button", { name: "Keep this memory" }).click();
  await expect(page.getByText(/lemon tree on the fire escape/).first()).toBeVisible();
  await settle(page);

  // 2. Invite a relative; they open the link and send a story.
  await page.goto(`/app/invitations?new=1&capsule=${capsuleId}`);
  await page.getByLabel("Their name").fill("Theo Delgado");
  await page.getByLabel("How are they related?").fill("Grandson");
  await page.getByRole("button", { name: "Prepare invitation" }).click();
  await page.getByRole("button", { name: /Open as Theo/ }).click();
  await page.waitForURL(/\/contribute\//);
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByLabel("Your answer").fill("Grandma Rosa taught me to graft a lemon branch onto the old tree.");
  await page.getByRole("button", { name: /Send this memory/ }).click();
  await expect(page.getByText("Thank you. It's on its way.")).toBeVisible();
  await settle(page);

  // 3. The organizer approves it. Theo is now part of the family.
  await page.goto("/app/invitations?tab=review");
  await page.locator("article", { hasText: "From Theo Delgado" }).first().getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved — now in the archive")).toBeVisible();
  await page.goto("/app/family");
  await expect(page.getByRole("rowheader", { name: /Theo Delgado/ })).toBeVisible();
  await settle(page);

  // 4. Explore: find it in the family archive and save it.
  await page.goto(`/view/${capsuleId}/stories?q=graft`);
  const results = page.locator("section[aria-labelledby=find-results]");
  await expect(results.getByText(/1 story matching “graft”/)).toBeVisible();
  await expect(results.locator("mark", { hasText: "graft" }).first()).toBeVisible();
  await results.getByRole("button", { name: /^Bookmark / }).click();
  await settle(page);
  await page.goto(`/view/${capsuleId}/stories?saved=1`);
  await expect(page.locator("section[aria-labelledby=find-results]").getByText(/Theo Delgado/).first()).toBeVisible();
  await page.goto(`/view/${capsuleId}/timeline`);
  await expect(page.getByText(/lemon tree on the fire escape/).first()).toBeVisible();

  // 5. Export a portable file that contains both stories.
  await page.goto(`/app/capsules/${capsuleId}/export`);
  await page.getByText("Records only (.json)").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Build & download/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^ourlifecapsule-rosa-delgado-.*\.json$/);
  const path = await file.path();
  const manifest = JSON.parse(await readFile(path, "utf8"));
  expect(manifest.schema).toBe("lifeatlas.archive");
  const narratives = manifest.memories.map((m: { narrative: string }) => m.narrative).join("\n");
  expect(narratives).toContain("lemon tree on the fire escape");
  expect(narratives).toContain("graft a lemon branch");

  // 6. And the file brings the archive back.
  await page.goto("/app/preservation");
  await page.locator("#restore-file").setInputFiles(path);
  await expect(page.getByText(/records-only export/)).toBeVisible();
  await page.getByRole("button", { name: "Restore as a new capsule" }).click();
  await expect(page.getByText("Rosa Delgado’s archive is back.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("unfinished work comes back: answers, letters and holiday sessions", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = trackErrors(page);

  // An answer in progress survives a reload.
  await page.goto("/contribute/emma-blue-bowl/record");
  await page.getByRole("tab", { name: "Type instead" }).click();
  await page.getByLabel("Your answer").fill("The bowl caught the light every summer");
  await expect(page.getByText(/Draft saved/)).toBeVisible();
  await settle(page);
  await page.reload();
  await expect(page.getByText("You were in the middle of an answer.")).toBeVisible();
  await page.getByRole("button", { name: "Pick up where I left off" }).click();
  await expect(page.getByLabel("Your answer")).toHaveValue("The bowl caught the light every summer");

  // A letter that isn't finished — or valid — yet.
  await page.goto("/app/future-messages/new");
  await page.getByLabel("Title").fill("For Leo, when he graduates");
  await page.getByLabel("The letter").fill("Dear Leo, I remember the day you");
  await expect(page.getByText(/Writing kept on this device/)).toBeVisible();
  await settle(page);
  await page.goto("/app/future-messages");
  await page.getByRole("link", { name: "Continue writing For Leo, when he graduates" }).click();
  await page.getByRole("button", { name: "Pick up where I left off" }).click();
  await expect(page.getByLabel("The letter")).toHaveValue("Dear Leo, I remember the day you");

  // A holiday session resumes at the same question and the same person's turn.
  await page.goto("/app/together");
  await page.getByLabel("The occasion").fill("Sunday supper");
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForURL(/session=/);
  await page.getByRole("radio", { name: "Type" }).click();
  await page.getByLabel("Margaret's answer").fill("Soup on Sundays, always.");
  await page.getByRole("button", { name: "Keep this answer" }).click();
  await page.getByRole("button", { name: /I’m Sarah — ready/ }).click();
  const question = await page.getByRole("heading", { level: 1 }).innerText();
  await settle(page);
  await page.goto("/app");
  await expect(page.getByText("Sunday supper is waiting")).toBeVisible();
  await page.getByRole("link", { name: "Resume the session" }).click();
  await expect(page.getByText("Sarah’s turn")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(question);
  await expect(page.getByText("1 answer kept")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a returned story is fixed and resent; previews show each person's view", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/app/invitations?tab=review");
  const card = page.locator("article", { hasText: "The blue bowl on the windowsill" }).first();
  await card.getByLabel("Note for the contributor").fill("Roughly what year was this?");
  await card.getByRole("button", { name: "Return with note" }).click();
  await expect(page.getByText("Returned with your note").first()).toBeVisible();
  await settle(page);

  await page.goto("/contribute/emma-blue-bowl");
  await expect(page.getByText("Roughly what year was this?")).toBeVisible();
  await page.getByRole("button", { name: "Change and send again" }).click();
  await page.getByLabel("Your words").fill("The blue bowl sat on the windowsill. It was the summer of 2009.");
  await page.getByRole("button", { name: "Send it again" }).click();
  await expect(page.getByText("Waiting for Sarah")).toBeVisible();
  await settle(page);

  await page.goto("/app/family");
  // Leo is a viewer only, so his preview opens the family viewer (editors land in the studio).
  await page.getByRole("button", { name: "Preview as Leo Ellis" }).click();
  await page.waitForURL(/\/view\//);
  await expect(page.getByText("Previewing as Leo Ellis")).toBeVisible();
  await page.getByRole("button", { name: "Back to Sarah" }).click();
  await expect(page.getByText("Previewing as Leo Ellis")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a keepsake box has a proof with pre-flight checks", async ({ page }) => {
  await page.goto("/app/heirlooms/capsule-builder");
  await page.getByRole("button", { name: "Save design" }).click();
  const href = await page.getByRole("link", { name: "Proof" }).getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "The lid" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inside the box" })).toBeVisible();
  await expect(page.getByText(/Engraving fits the lid/)).toBeVisible();
  await expect(page.getByText(/still a draft and would print as written today/)).toBeVisible();
});

test.describe("when this browser can't save", () => {
  test.use({ storageState: undefined });
  test("people are told plainly, in the studio and on invitations", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true }));
    await page.goto("/app");
    await expect(page.getByRole("alert").filter({ hasText: "This browser isn't saving anything." })).toBeVisible();
    await page.goto("/contribute/emma-blue-bowl");
    await expect(page.getByRole("alert").filter({ hasText: "regular (not private) browser window" })).toBeVisible();
  });
});

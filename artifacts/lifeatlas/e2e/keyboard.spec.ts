import { test, expect, type Page } from "@playwright/test";

/**
 * Keyboard-only use. Automated checks can't judge everything a person using a keyboard or
 * switch device needs, but these paths must always work: skipping navigation, seeing where
 * focus is, opening and leaving dialogs, and the main reading and gathering controls.
 */

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { name: "", tag: "", outline: "none", inMain: false, inDialog: false };
    const s = getComputedStyle(el);
    return {
      name: (el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || "").trim().slice(0, 60),
      tag: el.tagName.toLowerCase(),
      outline: s.outlineStyle !== "none" && s.outlineWidth !== "0px" ? "visible" : s.boxShadow !== "none" ? "ring" : "none",
      inMain: !!el.closest("main"),
      inDialog: !!el.closest("[role=dialog]"),
    };
  });

test("skip link jumps past navigation to the page content", async ({ page }) => {
  await page.goto("/app");
  await page.keyboard.press("Tab");
  expect((await focused(page)).name).toBe("Skip to content");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect((await focused(page)).inMain).toBe(true);
});

test("studio navigation is reachable in order and focus is always visible", async ({ page }) => {
  await page.goto("/app");
  const seen: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const f = await focused(page);
    expect(f.outline, `focus ring on “${f.name}”`).not.toBe("none");
    seen.push(f.name);
  }
  const order = ["Home", "Capsules", "Invitations", "Family", "Letters Through Time", "Heirlooms", "Holiday session"].map((n) => seen.findIndex((s) => s.startsWith(n)));
  expect(order.every((i) => i >= 0), `reached: ${seen.join(" | ")}`).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("dialogs trap focus, close with Escape and hand focus back", async ({ page }) => {
  await page.goto("/app/invitations");
  const trigger = page.getByRole("button", { name: "New invitation" }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    expect((await focused(page)).inDialog).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("the archive can be searched and stories saved without a mouse", async ({ page }) => {
  await page.goto("/view/cap_margaret/stories");
  await page.getByRole("searchbox", { name: "Search stories" }).focus();
  await page.keyboard.type("harbor");
  await expect(page.getByText(/stor(y|ies) matching “harbor”/)).toBeVisible();
  // The first result's save button (its name flips between "Bookmark …" and "Remove bookmark from …").
  const save = page.locator("section[aria-labelledby=find-results] li").first().getByRole("button");
  await save.focus();
  const before = await save.getAttribute("aria-pressed");
  await page.keyboard.press("Space");
  await expect(save).not.toHaveAttribute("aria-pressed", before!);
  await page.keyboard.press("Space"); // and undo it
  await expect(save).toHaveAttribute("aria-pressed", before!);
});

test("a holiday session runs from the keyboard", async ({ page }) => {
  await page.goto("/app/together");
  await page.getByRole("button", { name: "Begin" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/session=/);
  await page.getByRole("radio", { name: "Type" }).focus();
  await page.keyboard.press("Space");
  await page.getByLabel("Margaret's answer").focus();
  await page.keyboard.type("We kept the good plates for Tuesdays.");
  await page.getByRole("button", { name: "Keep this answer" }).focus();
  await page.keyboard.press("Enter");
  // The hand-off button takes focus so the next person can just press Enter.
  await expect(page.getByRole("button", { name: /I’m Sarah, ready/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Sarah’s turn")).toBeVisible();
});

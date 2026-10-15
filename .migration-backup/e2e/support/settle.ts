import type { Page } from "@playwright/test";

/**
 * Wait until entrance animations have finished, so accessibility checks judge the page people
 * actually read — not a button caught half-way through fading in. Endless animations (loading
 * shimmers, spinners) are ignored, and the wait is capped so it can never hang a test.
 */
export async function untilAnimationsSettle(page: Page, timeout = 2500) {
  await page
    .waitForFunction(
      () =>
        document.getAnimations().every((a) => {
          const end = a.effect?.getComputedTiming().endTime;
          return a.playState !== "running" || end === Infinity || end === undefined;
        }),
      undefined,
      { timeout },
    )
    .catch(() => undefined);
}

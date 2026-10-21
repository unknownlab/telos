// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that the playground can be used with the keyboard alone, that every control in it has an accessible name, and that the focused control shows a visible focus ring (NFR-004).
//   SCOPE: The keyboard suite over the static build: scenarios A, D and E operated with Tab, Enter and Space through page.keyboard only, the accessible names of the controls, and the focus indicator. Out: pointer interaction, covered by playground.e2e.ts.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PLAYGROUND_CONTROLS - the selector of every button, textarea and input inside a playground
//   MAX_TAB_PRESSES - the bound on Tab presses before a focus target is reported as unreachable
//   openScenario - opens one scenario and waits until its playground is hydrated
//   tabTo - presses Tab until the focused element matches a selector, and fails when it never does
//   focusRingShown - true when the focused element shows an outline or a box shadow
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

const PLAYGROUND_CONTROLS =
  '[data-slot="playground"] button, [data-slot="playground"] textarea, [data-slot="playground"] input';
const MAX_TAB_PRESSES = 300;

// START_CONTRACT: openScenario
//   PURPOSE: Open one scenario and wait for its playground to hydrate, so that the keyboard is used only after the controls exist.
//   INPUTS: { page: Page - the page to use, id: string - the scenario letter }
//   OUTPUTS: { Promise<void> - resolves when data-ready is true on the playground }
//   SIDE_EFFECTS: navigates the page
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: openScenario
async function openScenario(page: Page, id: string): Promise<void> {
  await page.goto(`/playground/${id}`);
  await expect(page.locator('[data-slot="playground"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
}

// START_CONTRACT: tabTo
//   PURPOSE: Move the keyboard focus forward with Tab until the focused element matches a selector, so that a control is reached the way a keyboard user reaches it.
//   INPUTS: { page: Page - the page, selector: string - the CSS selector of the wanted element }
//   OUTPUTS: { Promise<void> - resolves when the element has focus; throws after MAX_TAB_PRESSES presses without reaching it }
//   SIDE_EFFECTS: presses Tab; reads the focused element
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: tabTo
async function tabTo(page: Page, selector: string): Promise<void> {
  for (let press = 0; press <= MAX_TAB_PRESSES; press += 1) {
    const focused = await page.evaluate(
      (wanted) => document.activeElement?.matches(wanted) === true,
      selector,
    );
    if (focused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(
    `focus did not reach ${selector} after ${MAX_TAB_PRESSES} Tab presses`,
  );
}

// START_CONTRACT: focusRingShown
//   PURPOSE: Decide whether the focused element shows a visible focus indicator, through its outline or its box shadow.
//   INPUTS: { page: Page - the page whose focused element is read }
//   OUTPUTS: { Promise<boolean> - true when the focused element has an outline style or a box shadow }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: focusRingShown
async function focusRingShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (element === null) return false;
    const style = getComputedStyle(element);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
}

test.describe("keyboard only", () => {
  test("scenario A: Tab to the input, type a change, Tab to Validate, press Enter", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "a");
    await tabTo(page, "#fabric-input");
    await page.keyboard.type(" ");
    await tabTo(page, '[data-action="run"]');
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-valid="true"]')).toBeVisible();
    await expect(
      page.locator('[data-result][data-provenance="browser"]'),
    ).toHaveCount(2);
    check();
  });

  test("scenario D: append A, append B, use the head and append B again, with Tab, Enter and Space", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await tabTo(page, '[data-action="run"]');
    await page.keyboard.press("Enter");
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();

    await tabTo(page, '[data-action="append-a"]');
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );

    await tabTo(page, '[data-action="append-b"]');
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-history-step="1"]')).toHaveAttribute(
      "data-history-outcome",
      "stale",
    );

    await tabTo(page, '[data-action="use-head"]');
    await page.keyboard.press("Space");
    await tabTo(page, '[data-action="append-b"]');
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-history-step="2"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    check();
  });

  test("scenario E: Tab to Run all and press Enter", async ({ page }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "e");
    await tabTo(page, '[data-action="run"]');
    await page.keyboard.press("Enter");
    await expect(
      page
        .locator('[data-result="spec-report"][data-provenance="browser"]')
        .first(),
    ).toBeVisible();
    await expect(page.locator('[data-golden-match="true"]')).toHaveCount(8);
    check();
  });

  test("every control in a playground has a non-empty accessible name", async ({
    page,
  }) => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      await openScenario(page, id);
      const controls = page.locator(PLAYGROUND_CONTROLS);
      const count = await controls.count();
      expect(count, `controls in scenario ${id}`).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const snapshot = await controls.nth(index).ariaSnapshot();
        const firstLine = snapshot.split("\n")[0] ?? "";
        expect(
          firstLine,
          `control ${index} in scenario ${id}: ${firstLine}`,
        ).toMatch(/"[^"]+"/);
      }
    }
  });

  test("the focused control shows a visible focus indicator", async ({
    page,
  }) => {
    await openScenario(page, "a");
    await tabTo(page, "#fabric-input");
    expect(await focusRingShown(page), "textarea focus indicator").toBe(true);
    await tabTo(page, '[data-action="run"]');
    expect(await focusRingShown(page), "Validate focus indicator").toBe(true);
  });
});

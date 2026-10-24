// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that the calculator page submits each derived form through the real calculator and shows the same outcomes as the command line and the agent tools (FR-026).
//   SCOPE: The /calculator page of the static build: a valid add, a division by zero and a non-numeric operand. Out: the static markup (calculator.test.tsx) and the accessibility scan (a11y.e2e.ts).
//   DEPENDS: M-DOCS-CALCULATOR
//   LINKS: V-M-DOCS-CALCULATOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   openCalculator - opens the calculator page and waits until it is hydrated
//   submitForm - fills the fields of one form, submits it and returns its outcome locator
// END_MODULE_MAP

import { expect, type Locator, type Page, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

// START_CONTRACT: openCalculator
//   PURPOSE: Open the calculator page and wait for it to hydrate, so that no submit runs before React handles it.
//   INPUTS: { page: Page - the page to use }
//   OUTPUTS: { Promise<void> - resolves when data-ready is true on the calculator }
//   SIDE_EFFECTS: navigates the page
//   LINKS: V-M-DOCS-CALCULATOR
// END_CONTRACT: openCalculator
async function openCalculator(page: Page): Promise<void> {
  await page.goto("/calculator");
  await expect(page.locator('[data-slot="calculator"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
}

// START_CONTRACT: submitForm
//   PURPOSE: Fill the operands of one capability form and submit it, so that its outcome panel appears.
//   INPUTS: { page: Page - the calculator page, form: string - the capability name, a: string - the first operand, b: string - the second operand }
//   OUTPUTS: { Promise<Locator> - the outcome text of that form }
//   SIDE_EFFECTS: types into the form and clicks its Submit button
//   LINKS: V-M-DOCS-CALCULATOR
// END_CONTRACT: submitForm
async function submitForm(
  page: Page,
  form: string,
  a: string,
  b: string,
): Promise<Locator> {
  await page.fill(`#${form}-a`, a);
  await page.fill(`#${form}-b`, b);
  await page.locator(`[data-form="${form}"] [data-action="submit"]`).click();
  return page.locator(
    `[data-result="calculator"][data-form="${form}"] [data-slot="outcome"]`,
  );
}

test.describe("the calculator page invokes the real calculator in the browser", () => {
  test("add of 2 and 3 shows result 5", async ({ page }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "add", "2", "3");
    await expect(outcome).toContainText('"result":5');
    check();
  });

  test("divide of 1 by 0 shows DivisionByZero", async ({ page }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "divide", "1", "0");
    await expect(outcome).toContainText("DivisionByZero");
    check();
  });

  test("add with a non-numeric operand shows InvalidInput", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "add", "x", "1");
    await expect(outcome).toContainText("InvalidInput");
    check();
  });
});

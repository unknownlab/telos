// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that the playground runs the real kernel on every example and on a typed syntax error, so that each example shows its expected diagnostic or decode issue in the browser (FR-026, NFR-001).
//   SCOPE: The playground suite over the static build: every PLAYGROUND_EXAMPLES entry run from the picker, and a typed syntax error. Out: the keyboard (keyboard.e2e.ts) and the provenance labels (provenance.e2e.ts).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DIAGNOSTIC_CODES - the expected diagnostic code of each invalid example, by example name
//   openPlayground - opens the playground and waits until it is hydrated
//   runExample - selects one example in the picker and runs it
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { PLAYGROUND_EXAMPLES } from "../src/playground/examples";
import { caretToEnd, trackPageErrors } from "./helpers";

const DIAGNOSTIC_CODES: Readonly<Record<string, string>> = {
  "property-conflict": "composition.property-conflict",
  "invalid-property": "property.invalid",
  "missing-target": "relation.target-missing",
  cycle: "relation.cycle",
  "malformed-id": "identity.malformed",
};

// START_CONTRACT: openPlayground
//   PURPOSE: Open the playground and wait for it to hydrate, so that no interaction runs before the page is ready.
//   INPUTS: { page: Page - the page to use }
//   OUTPUTS: { Promise<void> - resolves when data-ready is true on the playground }
//   SIDE_EFFECTS: navigates the page
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: openPlayground
async function openPlayground(page: Page): Promise<void> {
  await page.goto("/playground");
  await expect(page.locator('[data-slot="playground"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
}

// START_CONTRACT: runExample
//   PURPOSE: Pick one example in the picker and run it, so that its result is on the page.
//   INPUTS: { page: Page - the playground page, name: string - the example name }
//   OUTPUTS: { Promise<void> - resolves when the result section is visible }
//   SIDE_EFFECTS: selects the example and presses Run
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: runExample
async function runExample(page: Page, name: string): Promise<void> {
  await page.selectOption("#playground-example", name);
  await page.locator('[data-action="run"]').click();
  await expect(page.locator('[data-result="playground"]')).toBeVisible();
}

test.describe("the playground runs every example in the browser", () => {
  for (const example of PLAYGROUND_EXAMPLES) {
    test(`${example.title}: the run shows the expected outcome`, async ({
      page,
    }) => {
      const check = trackPageErrors(page);
      await openPlayground(page);
      await runExample(page, example.name);
      const code = DIAGNOSTIC_CODES[example.name];
      if (example.name === "unknown-extension") {
        await expect(page.locator("[data-decode-issue]")).toContainText(
          "Unknown extension demo.unknown.",
        );
      } else if (code !== undefined) {
        await expect(
          page.locator(`[data-diagnostic-code="${code}"]`),
        ).toBeVisible();
        await expect(
          page.locator('[data-result="playground"]'),
        ).toHaveAttribute("data-valid", "false");
      } else {
        await expect(page.locator('[data-slot="no-diagnostics"]')).toHaveText(
          "No diagnostics",
        );
        await expect(
          page.locator('[data-result="playground"]'),
        ).toHaveAttribute("data-valid", "true");
      }
      check();
    });
  }
});

test.describe("the playground refuses input it cannot decode", () => {
  test("a syntax error in the typed text shows a decode issue", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openPlayground(page);
    const input = page.locator("#playground-input");
    await input.fill('{"id":');
    await page.locator('[data-action="run"]').click();
    await expect(page.locator("[data-decode-issue]").first()).toBeVisible();
    await expect(page.locator('[data-result="playground"]')).toHaveAttribute(
      "data-valid",
      "false",
    );
    check();
  });

  test("an edit after a run marks the result historical", async ({ page }) => {
    const check = trackPageErrors(page);
    await openPlayground(page);
    await page.locator('[data-action="run"]').click();
    await expect(page.locator('[data-result="playground"]')).toHaveAttribute(
      "data-provenance",
      "browser",
    );
    await caretToEnd(page.locator("#playground-input"));
    await page.keyboard.type(" ");
    await expect(page.locator('[data-result="playground"]')).toHaveAttribute(
      "data-provenance",
      "historical",
    );
    check();
  });
});

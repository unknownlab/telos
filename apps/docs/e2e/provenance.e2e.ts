// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that every result the site shows names its origin, that no result appears outside a result panel, that the labels say where and when each result was produced, and that nothing is shown as a result before a run (FR-021, INV-013, NS-018).
//   SCOPE: The provenance suite over the static build: the data-provenance values and labels after a playground run and on /verification, the containment of every result element in a panel, and the empty state before any run. Out: the label text rules (provenance.test.ts, Bun).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ORIGINS - the provenance values a result may carry
//   RESULT_ELEMENTS - the elements that show a result and must sit inside a result panel
//   openPlayground - opens the playground and waits until it is hydrated
//   expectEveryPanelLabelled - asserts that each result panel has a valid origin and a visible, non-empty label
//   countResultsOutsidePanels - the number of result elements that have no result panel as an ancestor
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { caretToEnd, trackPageErrors } from "./helpers";

const ORIGINS: ReadonlyArray<string> = [
  "browser",
  "bun-build",
  "historical",
  "none",
];
const RESULT_ELEMENTS =
  "[data-diagnostic-code], [data-decode-issue], [data-finding-outcome], [data-closure-code]";

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

// START_CONTRACT: expectEveryPanelLabelled
//   PURPOSE: Check that every result panel on the page names a valid origin and shows a non-empty provenance label.
//   INPUTS: { page: Page - the page to check }
//   OUTPUTS: { Promise<number> - the number of result panels checked }
//   SIDE_EFFECTS: none beyond the assertions
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: expectEveryPanelLabelled
async function expectEveryPanelLabelled(page: Page): Promise<number> {
  const panels = page.locator("[data-result]");
  const count = await panels.count();
  for (let index = 0; index < count; index += 1) {
    const panel = panels.nth(index);
    const origin = await panel.getAttribute("data-provenance");
    expect(ORIGINS, `panel ${index} origin`).toContain(origin);
    const label = panel.locator('[data-slot="provenance-label"]');
    await expect(label, `panel ${index} label`).toHaveCount(1);
    expect(
      (await label.innerText()).trim(),
      `panel ${index} label text`,
    ).not.toBe("");
  }
  return count;
}

// START_CONTRACT: countResultsOutsidePanels
//   PURPOSE: Count the result elements on the page that have no result panel as an ancestor.
//   INPUTS: { page: Page - the page to check }
//   OUTPUTS: { Promise<number> - the number of result elements outside a panel, which must be zero }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: countResultsOutsidePanels
async function countResultsOutsidePanels(page: Page): Promise<number> {
  return page
    .locator(RESULT_ELEMENTS)
    .evaluateAll(
      (elements) =>
        elements.filter((element) => element.closest("[data-result]") === null)
          .length,
    );
}

test.describe("results name their origin", () => {
  test("the playground: the result panel after a run has an origin and a visible label", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openPlayground(page);
    await page.locator('[data-action="run"]').click();
    await expect(page.locator("[data-result]").first()).toBeVisible();
    const panels = await expectEveryPanelLabelled(page);
    expect(panels).toBeGreaterThan(0);
    expect(await countResultsOutsidePanels(page)).toBe(0);
    check();
  });

  test("the verification page: every panel has an origin and a label, and nothing sits outside a panel", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/verification");
    const panels = await expectEveryPanelLabelled(page);
    expect(panels).toBeGreaterThan(0);
    expect(await countResultsOutsidePanels(page)).toBe(0);
    check();
  });

  test("browser labels say where and when the result was made, with @telos/kernel", async ({
    page,
  }) => {
    await openPlayground(page);
    await page.locator('[data-action="run"]').click();
    const label = page.locator(
      '[data-result="playground"] [data-slot="provenance-label"]',
    );
    await expect(label).toContainText("Run in this browser at");
    await expect(label).toContainText("@telos/kernel");
  });

  test("the verification label says the build ran the report", async ({
    page,
  }) => {
    await page.goto("/verification");
    const build = page.locator(
      '[data-result="semantic-report"][data-provenance="bun-build"] [data-slot="provenance-label"]',
    );
    await expect(build).toContainText("at build time");
    await expect(build).toContainText("commit");
  });

  test("before any run, the playground shows what to press and no result panel", async ({
    page,
  }) => {
    await openPlayground(page);
    await expect(page.locator('[data-slot="results"]')).toContainText("Press");
    await expect(page.locator("[data-result]")).toHaveCount(0);
  });

  test("an edited result carries the historical origin and its label says so", async ({
    page,
  }) => {
    await openPlayground(page);
    await page.locator('[data-action="run"]').click();
    await caretToEnd(page.locator("#playground-input"));
    await page.keyboard.type(" ");
    const label = page.locator(
      '[data-result="playground"] [data-slot="provenance-label"]',
    );
    await expect(label).toContainText("Historical: run in this browser at");
    await expect(
      page.locator('[data-result][data-provenance="historical"]'),
    ).toHaveCount(1);
  });
});

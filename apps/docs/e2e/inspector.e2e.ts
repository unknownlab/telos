// START_MODULE_CONTRACT
//   PURPOSE: Prove in the served site that the inspector lists the real repository model, that every Locus of the semantic report has a prerendered page, that a capability shows its schemas and the interface that exposes it, and that an unknown slug is the not-found page (FR-012, FR-025).
//   SCOPE: The inspector suite over the static build: the index links, the calculator capability page, the served semantic-report.json and the page of every Locus, and the 404 of an unknown slug.
//   DEPENDS: M-DOCS-INSPECTOR, M-DOCS-SEMANTIC-REPORT
//   LINKS: V-M-DOCS-INSPECTOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   slugOf - the URL segment of a Locus id, as the site builds it
// END_MODULE_MAP

import { expect, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

// START_CONTRACT: slugOf
//   PURPOSE: Give the URL segment of a Locus id the way the site builds it.
//   INPUTS: { id: string - a Locus id }
//   OUTPUTS: { string - the id with its colon replaced by a double dash }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-INSPECTOR
// END_CONTRACT: slugOf
function slugOf(id: string): string {
  return id.replace(":", "--");
}

test.describe("inspector", () => {
  test("the index lists telos:kernel and links to its page", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/inspector");
    const link = page.locator(
      '[data-locus-id="telos:kernel"] a[href="/inspector/telos--kernel"]',
    );
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page.locator("h1")).toHaveText("telos:kernel");
    check();
  });

  test("the calculator capability page shows the add capability and its exposing interface", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/inspector/calculator--arithmetic");
    const add = page.locator('[data-capability="add"]');
    await expect(add).toBeVisible();
    await expect(add.locator('[data-exposed-by="calculator:cli"]')).toHaveCount(
      1,
    );
    await expect(add.locator('[data-slot="contract-digest"]')).toHaveText(
      /^sha256:[0-9a-f]{64}$/,
    );
    check();
  });

  test("the served semantic report is version 1, and every Locus of it has a page", async ({
    request,
  }) => {
    const response = await request.get("/semantic-report.json");
    expect(response.status()).toBe(200);
    const report = (await response.json()) as {
      version: number;
      model: { loci: Array<{ id: string }> };
    };
    expect(report.version).toBe(1);
    expect(report.model.loci.length).toBeGreaterThan(0);
    for (const locus of report.model.loci) {
      const page = await request.get(`/inspector/${slugOf(locus.id)}`);
      expect(page.status(), locus.id).toBe(200);
      expect(await page.text(), locus.id).not.toContain(
        'data-page="not-found"',
      );
    }
  });

  test("an unknown slug is the not-found page with status 404", async ({
    request,
  }) => {
    const response = await request.get("/inspector/nope--nope");
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('data-page="not-found"');
  });
});

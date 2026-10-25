// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that search opens from the slash key, Ctrl or Meta with K and the button, finds the built content, navigates to the first hit, closes with Escape and returns focus, never takes a key typed into a playground field, and loads its index only on the first open (FR-016).
//   SCOPE: The search suite over the static build: the dialog, the shortcuts, the results for "archetype" and an empty result, and the lazy index request.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SEARCH_CHUNK - the path of a search chunk, which must not be fetched before the dialog opens
//   SEARCH_INPUT_NAME - the accessible name of the search input
//   openSearch - opens the dialog with the slash key from the page body
//   resultLinks - the result links of the open dialog
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { caretToEnd, trackPageErrors } from "./helpers";

const SEARCH_CHUNK = /\/search[^/]*\.js$/;
const SEARCH_INPUT_NAME = "Search the documentation";

// START_CONTRACT: openSearch
//   PURPOSE: Open the search dialog with the slash key pressed on the page body, and wait until its input has focus.
//   INPUTS: { page: Page - a page on the home route }
//   OUTPUTS: { Promise<void> - resolves when the dialog input is focused }
//   SIDE_EFFECTS: presses the slash key
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: openSearch
async function openSearch(page: Page): Promise<void> {
  await page.keyboard.press("/");
  await expect(page.getByLabel(SEARCH_INPUT_NAME)).toBeFocused();
}

// START_CONTRACT: resultLinks
//   PURPOSE: Locate the result links inside the search results list.
//   INPUTS: { page: Page - a page with the search dialog open }
//   OUTPUTS: { Locator - every result link, in result order }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: resultLinks
function resultLinks(page: Page) {
  return page.locator('[data-slot="search-results"] a[data-search-result]');
}

test.describe("search", () => {
  test("slash opens the dialog, and a search for archetype finds the Archetype term and P06", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await openSearch(page);
    await page.keyboard.type("archetype");
    await expect(resultLinks(page).first()).toBeVisible();
    await expect(
      page.locator('a[data-search-result="/terminology/archetype"]'),
    ).toBeVisible();
    await expect(
      page.locator(
        'a[data-search-result="/principles/P06-archetypes-specialize-verification"]',
      ),
    ).toBeVisible();
    check();
  });

  test("Enter opens the first result, and its heading is in view", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await openSearch(page);
    await page.keyboard.type("baseline");
    const first = resultLinks(page).first();
    await expect(first).toBeVisible();
    const href = await first.getAttribute("href");
    expect(href).toMatch(/^\//);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname + url.hash === href);
    await expect(page.locator("main h1").first()).toBeInViewport();
    check();
  });

  test("Control+K and Meta+K each open the dialog, and Escape closes it and returns focus to the trigger", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    const trigger = page.locator('[data-slot="search-trigger"]');
    for (const shortcut of ["Control+k", "Meta+k"]) {
      await page.keyboard.press(shortcut);
      await expect(page.getByLabel(SEARCH_INPUT_NAME)).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    check();
  });

  test("the trigger button opens the dialog and a query with no match says so", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await page.locator('[data-slot="search-trigger"]').click();
    await expect(page.getByLabel(SEARCH_INPUT_NAME)).toBeFocused();
    await page.keyboard.type("zzqxvwq");
    await expect(page.getByText("No results for")).toBeVisible();
    check();
  });

  test("a slash typed inside a playground field is typed, not taken by search", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/playground");
    await expect(page.locator('[data-slot="playground"]')).toHaveAttribute(
      "data-ready",
      "true",
    );
    const input = page.getByLabel("Locus JSON");
    await caretToEnd(input);
    await page.keyboard.press("/");
    await expect(input).toHaveValue(/\}\/$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    check();
  });

  test("the search index is requested only when the dialog first opens", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    const requested: string[] = [];
    page.on("request", (request) => {
      if (SEARCH_CHUNK.test(new URL(request.url()).pathname))
        requested.push(request.url());
    });
    await page.goto("/");
    await expect(page.locator('[data-slot="search-trigger"]')).toBeVisible();
    expect(requested).toEqual([]);
    await openSearch(page);
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    check();
  });
});

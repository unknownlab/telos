// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that every navigation section is reachable, every document and app route is prerendered and loads, the pages read without JavaScript, the diagrams render, and an unknown path gives the not-found page with status 404 and the full navigation (FR-013, NFR-005).
//   SCOPE: The navigation suite over the static build: section links, document pages grouped by section, app routes via request, the no-JavaScript context, the diagram page and the 404 page.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SECTION_COUNT - the number of navigation sections the site must show
//   documentsBySection - the build documents grouped by the navigation section of their route
//   expectDocumentPage - asserts the main element, the h1 and the summary of a document page
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import {
  APP_ROUTES,
  NAV_SECTIONS,
  type NavSectionId,
} from "../src/lib/content-types";
import { sectionForPath } from "../src/lib/site";
import { type IndexDocument, readIndex, trackPageErrors } from "./helpers";

const SECTION_COUNT = 12;

// START_CONTRACT: documentsBySection
//   PURPOSE: Group the documents of the build by the navigation section of their route, so each section is one test.
//   INPUTS: none
//   OUTPUTS: { Map<NavSectionId, IndexDocument[]> - the documents of each section, in index order }
//   SIDE_EFFECTS: reads dist/client/index.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: documentsBySection
function documentsBySection(): Map<NavSectionId, IndexDocument[]> {
  const groups = new Map<NavSectionId, IndexDocument[]>();
  for (const doc of readIndex()) {
    const section = sectionForPath(doc.url);
    if (section === null) {
      throw new Error(`${doc.id} (${doc.url}) is in no navigation section`);
    }
    groups.set(section, [...(groups.get(section) ?? []), doc]);
  }
  return groups;
}

// START_CONTRACT: expectDocumentPage
//   PURPOSE: Assert that a document page is the page of its document: its main element, its h1 and its summary.
//   INPUTS: { page: Page - the page after navigation, doc: IndexDocument - the document it must show }
//   OUTPUTS: { Promise<void> - resolves when the assertions hold }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: expectDocumentPage
async function expectDocumentPage(
  page: Page,
  doc: IndexDocument,
): Promise<void> {
  const main = page.locator(`main[data-doc-id="${doc.id}"]`);
  await expect(main).toBeVisible();
  // The body heading may carry the code in front ("P01 — Everything Is Code"), so the title is contained.
  await expect(main.locator("h1").first()).toContainText(doc.title);
  await expect(main.locator('[data-slot="summary"]')).toHaveText(doc.summary);
}

test.describe("navigation", () => {
  test("the home page lists every section in navigation order", async ({
    page,
  }) => {
    await page.goto("/");
    const links = page.locator('nav[aria-label="Sections"] [data-nav-section]');
    await expect(links).toHaveCount(SECTION_COUNT);
    const ids = await links.evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-nav-section")),
    );
    expect(ids).toEqual(NAV_SECTIONS.map((section) => section.id));
  });

  for (const section of NAV_SECTIONS) {
    test(`section "${section.title}" is reachable from the navigation`, async ({
      page,
    }) => {
      const check = trackPageErrors(page);
      await page.goto("/");
      const link = page.locator(
        `nav[aria-label="Sections"] [data-nav-section="${section.id}"]`,
      );
      await link.click();
      await expect(page).toHaveURL((url) => url.pathname === section.route);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(link).toHaveAttribute("aria-current", "page");
      await expect(link).toHaveAttribute("data-active", "true");
      check();
    });
  }

  for (const [section, docs] of documentsBySection()) {
    const title =
      NAV_SECTIONS.find((item) => item.id === section)?.title ?? section;
    test(`every document of "${title}" loads with its title and no errors`, async ({
      page,
    }) => {
      const check = trackPageErrors(page);
      for (const doc of docs) {
        const response = await page.goto(doc.url);
        expect(response?.status(), doc.url).toBe(200);
        await expectDocumentPage(page, doc);
      }
      check();
    });
  }

  test("every app route is prerendered and is not the not-found page", async ({
    request,
  }) => {
    for (const route of APP_ROUTES) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
      const html = await response.text();
      expect(html, route).not.toContain('data-page="not-found"');
    }
  });

  test("the not-found page is served with status 404 for an unknown path", async ({
    request,
  }) => {
    const response = await request.get("/no-such-page");
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('data-page="not-found"');
  });

  test("an unknown path shows the not-found page with the full navigation", async ({
    page,
  }) => {
    const check = trackPageErrors(page, {
      unknownDocument: "/no-such-page",
    });
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    const main = page.locator('main[data-page="not-found"]');
    await expect(main).toBeVisible();
    await expect(main.locator("h1")).toHaveText("Page not found");
    await expect(main.locator('a[href="/"]')).toBeVisible();
    await expect(
      page.locator('nav[aria-label="Sections"] [data-nav-section]'),
    ).toHaveCount(SECTION_COUNT);
    check();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("one page per kind shows its heading, summary and body", async ({
    page,
  }) => {
    const byId = new Map(readIndex().map((doc) => [doc.id, doc]));
    const kinds = [
      "introduction",
      "P01-one-fundamental-entity",
      "semantic-extension",
      "ADR-0005",
    ];
    for (const id of kinds) {
      const doc = byId.get(id);
      if (doc === undefined) throw new Error(`no document ${id} in the build`);
      await page.goto(doc.url);
      await expectDocumentPage(page, doc);
      await expect(
        page.locator(`main[data-doc-id="${doc.id}"] .prose`),
      ).not.toBeEmpty();
    }
  });

  test("the architecture page lists its documents", async ({ page }) => {
    await page.goto("/architecture");
    await expect(page.locator('main[data-page="architecture"] h1')).toHaveText(
      "Architecture",
    );
    await expect(
      page
        .locator('main[data-page="architecture"] a[href^="/architecture/"]')
        .first(),
    ).toBeVisible();
  });

  test("the verification report shows its 44 specification rows", async ({
    page,
  }) => {
    await page.goto("/verification");
    await expect(page.locator("[data-spec-id]")).toHaveCount(44);
  });

  test("the playground shows its example input and the notice without JavaScript", async ({
    page,
  }) => {
    await page.goto("/playground");
    await expect(page.locator('[data-slot="no-js"]')).toBeVisible();
    await expect(page.locator('[data-slot="example-input"]')).toContainText(
      '"demo:hello"',
    );
    await expect(page.locator("main")).toContainText(
      "The playground needs JavaScript",
    );
    await expect(page.locator('[data-slot="playground"]')).toHaveCount(0);
  });

  test("the conceptual model shows its diagram source as a code block", async ({
    page,
  }) => {
    const doc = readIndex().find(
      (item) => item.source === "docs/foundation/conceptual-model/README.md",
    );
    if (doc === undefined)
      throw new Error("the conceptual model is not in the build");
    await page.goto(doc.url);
    await expect(
      page.locator("pre > code.language-mermaid").first(),
    ).toBeVisible();
  });
});

test.describe("diagrams", () => {
  test("the conceptual model renders its Mermaid diagrams with the source kept in a disclosure", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    const doc = readIndex().find(
      (item) => item.source === "docs/foundation/conceptual-model/README.md",
    );
    if (doc === undefined)
      throw new Error("the conceptual model is not in the build");
    await page.goto(doc.url);
    const figure = page.locator('figure[data-mermaid="rendered"]').first();
    await expect(figure.locator("svg")).toBeVisible();
    const disclosure = page
      .locator("details", { hasText: "Diagram source" })
      .first();
    await expect(disclosure.locator("code.language-mermaid")).toHaveCount(1);
    await expect(page.locator('[data-mermaid="error"]')).toHaveCount(0);
    check();
  });
});

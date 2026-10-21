// START_MODULE_CONTRACT
//   PURPOSE: Prove in the served site that llms.txt and index.json describe every document with the fields, types and links the contract requires, and that the footer links both files (FR-017).
//   SCOPE: The machine-readable suite over the static build: the llms.txt structure and order, the index.json shape, sort order, related ids and served URLs, and the footer links.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   KINDS - the closed set of document kinds in index.json
//   STATUSES - the closed set of status values in index.json
//   MATURITIES - the closed set of maturity values in index.json
//   REQUIRED_STRING_FIELDS - the string fields every index.json document has
//   headingsOf - the level-two headings of an llms.txt body, in order
// END_MODULE_MAP

import { expect, test } from "@playwright/test";
import { NAV_SECTIONS } from "../src/lib/content-types";
import { type IndexFile, readIndexFile, trackPageErrors } from "./helpers";

const KINDS: ReadonlyArray<string> = [
  "index",
  "doctrine",
  "principle",
  "term",
  "model",
  "capability-map",
  "direction",
  "roadmap",
  "questions",
  "decision",
  "research",
  "guide",
];
const STATUSES: ReadonlyArray<string> = [
  "provisional",
  "proposed",
  "accepted",
  "open",
  "superseded",
  "deprecated",
];
const MATURITIES: ReadonlyArray<string> = ["vision", "proposed", "implemented"];
const REQUIRED_STRING_FIELDS = [
  "id",
  "title",
  "kind",
  "status",
  "maturity",
  "summary",
  "url",
  "source",
] as const;

// START_CONTRACT: headingsOf
//   PURPOSE: List the level-two headings of an llms.txt body, so the order of the sections can be compared with the navigation.
//   INPUTS: { text: string - the body of llms.txt }
//   OUTPUTS: { string[] - the text of each line that starts with a level-two heading marker, in order }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: headingsOf
function headingsOf(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3));
}

test.describe("llms.txt", () => {
  test("is plain text, opens with the site heading and a summary, and lists every document", async ({
    request,
  }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();
    const lines = text.split("\n");
    expect(lines[0]).toBe("# Telos by UnknownLab");
    expect(lines[2]?.startsWith("> ")).toBe(true);

    for (const doc of readIndexFile().documents) {
      expect(text, doc.id).toContain(`](${doc.url})`);
    }
  });

  test("its level-two headings are the navigation sections, in navigation order", async ({
    request,
  }) => {
    const text = await (await request.get("/llms.txt")).text();
    const headings = headingsOf(text);
    const titles = NAV_SECTIONS.map((section) => section.title);
    for (const heading of headings) {
      expect(titles, heading).toContain(heading);
    }
    expect(headings).toEqual(
      titles.filter((title) => headings.includes(title)),
    );
    expect(headings.length).toBeGreaterThan(0);
  });
});

test.describe("index.json", () => {
  test("is JSON at version 1 with the build commit and the dirty flag", async ({
    request,
  }) => {
    const response = await request.get("/index.json");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    const file = (await response.json()) as {
      version: unknown;
      generatedFrom: { commit: unknown; dirty: unknown };
    };
    expect(file.version).toBe(1);
    expect(typeof file.generatedFrom.commit).toBe("string");
    expect(typeof file.generatedFrom.dirty).toBe("boolean");
  });

  test("lists every document sorted by id, with every field of the right type", async ({
    request,
  }) => {
    const served = (await (
      await request.get("/index.json")
    ).json()) as IndexFile;
    const documents = served.documents;
    const ids = documents.map((doc) => doc.id);
    expect(ids).toEqual([...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    const known = new Set(ids);
    for (const doc of documents) {
      for (const field of REQUIRED_STRING_FIELDS) {
        expect(typeof doc[field], `${doc.id}.${field}`).toBe("string");
      }
      expect(KINDS, doc.id).toContain(doc.kind);
      expect(STATUSES, doc.id).toContain(doc.status);
      expect(MATURITIES, doc.id).toContain(doc.maturity);
      expect(Array.isArray(doc.related), `${doc.id}.related`).toBe(true);
      for (const related of doc.related) {
        expect(known.has(related), `${doc.id} relates to ${related}`).toBe(
          true,
        );
      }
    }
  });

  test("every document URL is served with status 200", async ({ request }) => {
    for (const doc of readIndexFile().documents) {
      const response = await request.get(doc.url);
      expect(response.status(), doc.url).toBe(200);
    }
  });
});

test.describe("footer", () => {
  test("links llms.txt and index.json", async ({ page }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await expect(page.locator('footer a[href="/llms.txt"]')).toBeVisible();
    await expect(page.locator('footer a[href="/index.json"]')).toBeVisible();
    check();
  });
});

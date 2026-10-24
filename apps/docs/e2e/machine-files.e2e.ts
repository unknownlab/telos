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
//   APP_PAGE_LINES - the three llms.txt bullets that name app pages rather than documents
//   readContentFile - reads the compiled content file the build wrote, the source the served files must match
//   compareIds - orders two documents by id, by code unit, the way index.json sorts them
//   expectedIndexDocuments - the index.json entries that the content file implies, sorted by id
//   documentLine - the llms.txt bullet that one document must have
// END_MODULE_MAP

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  type ContentDocument,
  type ContentFile,
  NAV_SECTIONS,
} from "../src/lib/content-types";
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

// The two llms.txt bullets that name app pages. content.ts writes them, not a document.
const APP_PAGE_LINES: ReadonlyArray<string> = [
  "- [Inspector](/inspector): The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json.",
  "- [Playground](/playground): Type a Locus definition as JSON; the real /kernel decodes, builds and verifies it in your browser.",
  "- [Verification](/verification): The Archetype verification and Semantic Closure report from the build-time run, with its provenance.",
];

// START_CONTRACT: readContentFile
//   PURPOSE: Read the compiled content file that the build wrote, which is the source the served index.json and llms.txt must match.
//   INPUTS: none
//   OUTPUTS: { ContentFile - the parsed apps/docs/src/generated/content.json }
//   SIDE_EFFECTS: reads apps/docs/src/generated/content.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: readContentFile
function readContentFile(): ContentFile {
  const path = fileURLToPath(
    new URL("../src/generated/content.json", import.meta.url),
  );
  return JSON.parse(readFileSync(path, "utf8")) as ContentFile;
}

// START_CONTRACT: compareIds
//   PURPOSE: Order two documents by id with code-unit comparison, the same order index.json uses.
//   INPUTS: { a: { id: string }, b: { id: string } - two documents }
//   OUTPUTS: { number - negative, zero or positive }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: compareIds
function compareIds(
  a: { readonly id: string },
  b: { readonly id: string },
): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// START_CONTRACT: expectedIndexDocuments
//   PURPOSE: Derive the index.json entries that a content file implies, so that the served index can be compared with them field by field.
//   INPUTS: { content: ContentFile - the compiled content }
//   OUTPUTS: { Array<{ id, title, kind, status, maturity, summary, related, url, source }> - one entry per document, sorted by id }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: expectedIndexDocuments
function expectedIndexDocuments(content: ContentFile) {
  return content.documents
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      status: doc.status,
      maturity: doc.maturity,
      summary: doc.summary,
      related: [...doc.related],
      url: doc.route,
      source: doc.source,
    }))
    .sort(compareIds);
}

// START_CONTRACT: documentLine
//   PURPOSE: Give the llms.txt bullet that one document must have, in the format of the llms.txt contract.
//   INPUTS: { doc: ContentDocument - one compiled document }
//   OUTPUTS: { string - the bullet "- [title](route): summary" }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: documentLine
function documentLine(doc: ContentDocument): string {
  return `- [${doc.title}](${doc.route}): ${doc.summary}`;
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

  test("lists each document once with its exact bullet, and no other document bullet", async ({
    request,
  }) => {
    const text = await (await request.get("/llms.txt")).text();
    const bullets = text.split("\n").filter((line) => line.startsWith("- ["));
    const expected = readContentFile().documents.map(documentLine);
    for (const line of expected) {
      expect(
        bullets.filter((bullet) => bullet === line),
        line,
      ).toHaveLength(1);
    }
    expect(bullets.filter((bullet) => !expected.includes(bullet))).toEqual(
      APP_PAGE_LINES,
    );
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
  test("semantic-report.json is served with version 1 and the repository root", async ({
    request,
  }) => {
    const response = await request.get("/semantic-report.json");
    expect(response.status()).toBe(200);
    const report = (await response.json()) as {
      version: unknown;
      model: { root: unknown };
    };
    expect(report.version).toBe(1);
    expect(report.model.root).toBe("telos:repository");
  });

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

  test("matches the content file document by document, with no extra and no missing document", async ({
    request,
  }) => {
    const served = (await (
      await request.get("/index.json")
    ).json()) as IndexFile;
    expect(served.documents).toEqual(expectedIndexDocuments(readContentFile()));
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

// START_MODULE_CONTRACT
//   PURPOSE: Prove the pure site helpers and the prerender path list on fixtures, and on the real docs compiled from the repository.
//   SCOPE: pageTitle, sourceUrl, document and section lookups in navigation order, relatedDocuments, sectionForPath (table-driven), splitTitle, prerenderPaths with its duplicate check, the APP_PAGES seam, and the real content.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   PRINCIPLE_NUMBERS - the numbers 1 to 16 in the order the principles section lists them
//   SECTION_CASES - table of paths and the navigation section each one belongs to
//   makeDoc - a full ContentDocument with neutral defaults and the given overrides
//   contentOf - a ContentFile holding the given documents
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { compileContent } from "../scripts/content";
import {
  APP_ROUTES,
  type ContentDocument,
  type ContentFile,
  type NavSectionId,
} from "../src/lib/content-types";
import { APP_PAGES, prerenderPaths } from "../src/lib/prerender";
import {
  childDocuments,
  documentByRoute,
  documentsInSection,
  pageTitle,
  relatedDocuments,
  sectionForPath,
  sourceUrl,
  splitTitle,
} from "../src/lib/site";

const REPO_ROOT = resolve(import.meta.dir, "../../..");

const PRINCIPLE_NUMBERS = Array.from({ length: 16 }, (_, index) => index + 1);

const SECTION_CASES: ReadonlyArray<readonly [string, NavSectionId | null]> = [
  ["/", "introduction"],
  ["/principles", "principles"],
  ["/principles/", "principles"],
  ["/principles/P01-everything-is-code", "principles"],
  ["/architecture/foundation", "architecture"],
  ["/playground/a", "playground"],
  ["/not-found", null],
  ["/philosophyx", null],
];

function makeDoc(
  overrides: Partial<ContentDocument> & { readonly id: string },
): ContentDocument {
  return {
    title: `Title of ${overrides.id}`,
    kind: "guide",
    status: "accepted",
    maturity: "implemented",
    summary: `Summary of ${overrides.id}.`,
    related: [],
    route: `/${overrides.id}`,
    navSection: "introduction",
    source: `docs/guides/${overrides.id}.md`,
    html: "<p>Body</p>",
    outline: [],
    ...overrides,
  };
}

function contentOf(documents: ReadonlyArray<ContentDocument>): ContentFile {
  return { version: 1, documents };
}

describe("pageTitle", () => {
  test("appends the site title to a page title", () => {
    expect(pageTitle("Principles")).toBe("Principles · Telos by UnknownLab");
  });

  test("is the site title alone without a page title", () => {
    expect(pageTitle()).toBe("Telos by UnknownLab");
  });
});

describe("sourceUrl", () => {
  test("links the source path on the main branch of the repository", () => {
    const doc = makeDoc({
      id: "P01-everything-is-code",
      source: "docs/foundation/principles/P01-everything-is-code.md",
    });
    expect(sourceUrl(doc)).toBe(
      "https://github.com/unknownlab/telos/blob/main/docs/foundation/principles/P01-everything-is-code.md",
    );
  });
});

describe("document lookups", () => {
  const terminology = makeDoc({
    id: "terminology",
    kind: "index",
    navSection: "terminology",
    route: "/terminology",
  });
  const act = makeDoc({
    id: "act",
    kind: "term",
    order: 2,
    navSection: "terminology",
    route: "/terminology/act",
  });
  const witness = makeDoc({
    id: "witness",
    kind: "term",
    order: 1,
    navSection: "terminology",
    route: "/terminology/witness",
  });
  const content = contentOf([act, witness, terminology]);

  test("documentByRoute finds the document with that route", () => {
    expect(documentByRoute(content, "/terminology/act")?.id).toBe("act");
    expect(documentByRoute(content, "/terminology/missing")).toBeUndefined();
  });

  test("documentsInSection puts the index first and then sorts by order, not by id", () => {
    expect(documentsInSection(content, "terminology").map((d) => d.id)).toEqual(
      ["terminology", "witness", "act"],
    );
  });

  test("childDocuments leaves out the index document", () => {
    expect(childDocuments(content, "terminology").map((d) => d.id)).toEqual([
      "witness",
      "act",
    ]);
  });

  test("relatedDocuments keeps the order of related and skips unknown ids", () => {
    const a = makeDoc({ id: "a" });
    const b = makeDoc({ id: "b" });
    const subject = makeDoc({ id: "subject", related: ["b", "missing", "a"] });
    expect(
      relatedDocuments(contentOf([a, b, subject]), subject).map((d) => d.id),
    ).toEqual(["b", "a"]);
  });
});

describe("sectionForPath", () => {
  test.each(SECTION_CASES)("%s belongs to %s", (path, section) => {
    expect(sectionForPath(path)).toBe(section);
  });
});

describe("splitTitle", () => {
  test("splits a leading h1 off the body", () => {
    expect(splitTitle('<h1 id="a">A</h1>\n<p>x</p>')).toEqual({
      title: '<h1 id="a">A</h1>',
      body: "\n<p>x</p>",
    });
  });

  test("leaves html without a leading h1 unchanged", () => {
    expect(splitTitle("<p>x</p>")).toEqual({ title: null, body: "<p>x</p>" });
  });
});

describe("prerenderPaths", () => {
  const content = contentOf([
    makeDoc({
      id: "principles",
      kind: "index",
      navSection: "principles",
      route: "/principles",
    }),
    makeDoc({ id: "introduction", route: "/", navSection: "introduction" }),
    makeDoc({
      id: "P01-fixture",
      kind: "principle",
      number: 1,
      code: "P01",
      navSection: "principles",
      route: "/principles/P01",
    }),
  ]);

  test("lists the content routes and the given app pages, sorted by code unit", () => {
    expect(prerenderPaths(content, ["/architecture", "/not-found"])).toEqual([
      "/",
      "/architecture",
      "/not-found",
      "/principles",
      "/principles/P01",
    ]);
  });

  test("throws when a path is listed twice", () => {
    expect(() => prerenderPaths(content, ["/principles"])).toThrow(
      'prerender path "/principles" is listed twice',
    );
  });

  test("the default app pages are prerendered with the content", () => {
    const paths = prerenderPaths(content);
    expect(paths).toContain("/architecture");
    expect(paths).toContain("/not-found");
  });

  test("every app page except not-found is an app route", () => {
    expect(
      APP_PAGES.filter(
        (path) => path !== "/not-found" && !APP_ROUTES.includes(path),
      ),
    ).toEqual([]);
  });
});

describe("real content", () => {
  test("prerenders one page per document plus the two app pages", async () => {
    const result = await compileContent({
      root: REPO_ROOT,
      git: () => ({ commit: "test", dirty: false }),
    });
    if (!result.ok) {
      throw new Error(
        result.problems.map((p) => `${p.file}: ${p.message}`).join("\n"),
      );
    }
    const { content } = result.output;
    const paths = prerenderPaths(content);

    expect(paths.length).toBe(content.documents.length + 2);
    for (const route of [
      "/",
      "/philosophy",
      "/principles/P08-preserve-the-baseline",
      "/terminology/revision",
      "/architecture/foundation",
      "/decisions/ADR-0012",
    ]) {
      expect(paths).toContain(route);
    }

    const principles = documentsInSection(content, "principles");
    expect(principles.length).toBe(17);
    expect(principles[0]?.kind).toBe("index");
    expect(principles.slice(1).map((d) => d.number)).toEqual(PRINCIPLE_NUMBERS);
  });
});

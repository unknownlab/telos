// START_MODULE_CONTRACT
//   PURPOSE: Prove the shell and document components render the required markup, badges and navigation, and never claim a result is verified (FR-018).
//   SCOPE: MaturityBadge and StatusBadge, DocumentPage (H1 once, outline without the H1, related links, source link), the FR-018 status and maturity sweep, SiteNav (section order, active section, current page), DocumentList, NotFound, and the real route tree rendered at an unknown path, the not-found route and a document route (one site layout each).
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   STATUSES - the six status values of the content schema
//   MATURITIES - the three maturity values of the content schema
//   makeDoc - a full ContentDocument with neutral defaults and the given overrides
//   contentOf - a ContentFile holding the given documents
//   openingTag - the first anchor opening tag in html that contains the fragment
//   countH1 - the number of h1 elements in html
//   currentMarks - the number of aria-current="page" marks in html
//   countOf - the number of matches of a global pattern in html
//   bodyMarkup - the body of a rendered page with its scripts left out
// END_MODULE_MAP

import { beforeAll, describe, expect, mock, test } from "bun:test";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { MaturityBadge, StatusBadge } from "@/components/badges";
import { DocumentList } from "@/components/document-list";
import { DocumentPage } from "@/components/document-page";
import { NotFound } from "@/components/not-found";
import { SiteNav } from "@/components/site-nav";
import {
  type ContentDocument,
  type ContentFile,
  type Maturity,
  NAV_SECTIONS,
  type Status,
} from "@/lib/content-types";

const STATUSES: ReadonlyArray<Status> = [
  "provisional",
  "proposed",
  "accepted",
  "open",
  "superseded",
  "deprecated",
];

const MATURITIES: ReadonlyArray<Maturity> = [
  "vision",
  "proposed",
  "implemented",
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

function openingTag(html: string, fragment: string): string {
  const tag = [...html.matchAll(/<a\b[^>]*>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(fragment));
  if (tag === undefined) throw new Error(`no link with ${fragment}`);
  return tag;
}

function countH1(html: string): number {
  return [...html.matchAll(/<h1[\s>]/g)].length;
}

function currentMarks(html: string): number {
  return [...html.matchAll(/aria-current="page"/g)].length;
}

function countOf(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

// The body without its scripts: the head and the scripts differ by design (titles, scroll restoration, stream data).
function bodyMarkup(html: string): string {
  const body = html.slice(html.indexOf("<body"));
  return body.replace(/<script\b[\s\S]*?<\/script>/g, "");
}

describe("badges", () => {
  test.each(MATURITIES)("MaturityBadge shows %s", (maturity) => {
    const html = renderToStaticMarkup(<MaturityBadge maturity={maturity} />);
    expect(html).toContain(`data-maturity="${maturity}"`);
    expect(html).toContain(`Maturity: ${maturity}`);
  });

  test("StatusBadge shows the status", () => {
    const html = renderToStaticMarkup(<StatusBadge status="accepted" />);
    expect(html).toContain('data-status="accepted"');
    expect(html).toContain("Status: accepted");
  });
});

describe("DocumentPage", () => {
  const related = makeDoc({
    id: "related-doc",
    title: "Related title",
    navSection: "terminology",
    route: "/terminology/related-doc",
    source: "docs/foundation/terminology/related-doc.md",
  });

  test("shows the badges, summary, body, outline, related link and source link", () => {
    const doc = makeDoc({
      id: "subject",
      summary: "The subject summary.",
      source: "docs/foundation/principles/P01.md",
      related: ["related-doc"],
      html: '<h1 id="t">T</h1><p>Body</p><h2 id="s">S</h2>',
      outline: [
        { level: 1, id: "t", text: "T" },
        { level: 2, id: "s", text: "S" },
      ],
    });
    const html = renderToStaticMarkup(
      <DocumentPage doc={doc} related={[related]} />,
    );

    expect(html).toContain('data-doc-id="subject"');
    expect(html).toContain("Status: ");
    expect(html).toContain("Maturity: ");
    expect(html).toContain("The subject summary.");
    expect(html).toContain("<p>Body</p>");
    expect(html).toContain('href="#s"');
    expect(html).toContain('href="/terminology/related-doc"');
    expect(html).toContain("Related title");
    expect(html).toContain(
      'href="https://github.com/unknownlab/telos/blob/main/docs/foundation/principles/P01.md"',
    );
    expect(countH1(html)).toBe(1);
    expect(html).not.toContain('href="#t"');
  });

  test("renders the document title as the h1 when the body has none", () => {
    const doc = makeDoc({
      id: "no-heading",
      title: "Plain title",
      html: "<p>Only body</p>",
    });
    const html = renderToStaticMarkup(<DocumentPage doc={doc} related={[]} />);
    expect(countH1(html)).toBe(1);
    expect(html).toContain("<h1>Plain title</h1>");
  });

  test("no combination of status and maturity claims a result is verified (FR-018)", () => {
    let rendered = 0;
    for (const status of STATUSES) {
      for (const maturity of MATURITIES) {
        const doc = makeDoc({
          id: `${status}-${maturity}`,
          title: "Neutral title",
          summary: "Neutral summary.",
          status,
          maturity,
          html: "<p>Neutral body.</p>",
        });
        const html = renderToStaticMarkup(
          <DocumentPage doc={doc} related={[]} />,
        );
        expect(html).not.toMatch(/\bverified\b/i);
        rendered += 1;
      }
    }
    expect(rendered).toBe(STATUSES.length * MATURITIES.length);
  });
});

describe("SiteNav", () => {
  const principlesIndex = makeDoc({
    id: "principles",
    kind: "index",
    title: "Principles",
    navSection: "principles",
    route: "/principles",
  });
  const p01 = makeDoc({
    id: "P01-first",
    kind: "principle",
    number: 1,
    code: "P01",
    navSection: "principles",
    route: "/principles/P01-first",
  });
  const p02 = makeDoc({
    id: "P02-x",
    kind: "principle",
    number: 2,
    code: "P02",
    navSection: "principles",
    route: "/principles/P02-x",
  });
  const content = contentOf([p02, principlesIndex, p01]);

  test("renders the twelve sections in navigation order", () => {
    const html = renderToStaticMarkup(
      <SiteNav content={content} currentPath="/principles/P02-x" />,
    );
    const sections = [...html.matchAll(/data-nav-section="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(sections).toEqual(NAV_SECTIONS.map((section) => section.id));
  });

  test("marks the active section and its current child page only", () => {
    const html = renderToStaticMarkup(
      <SiteNav content={content} currentPath="/principles/P02-x" />,
    );
    const principlesLink = openingTag(html, 'data-nav-section="principles"');
    expect(principlesLink).toContain('data-active="true"');
    expect(principlesLink).not.toContain("aria-current");

    expect(html).toContain('href="/principles/P01-first"');
    expect(openingTag(html, 'href="/principles/P01-first"')).not.toContain(
      "aria-current",
    );
    expect(openingTag(html, 'href="/principles/P02-x"')).toContain(
      'aria-current="page"',
    );
  });

  test("a section whose only document is its page marks that page once", () => {
    const philosophy = makeDoc({
      id: "evolution-of-determinism",
      kind: "doctrine",
      title: "Evolution of determinism",
      navSection: "philosophy",
      route: "/philosophy",
    });
    const html = renderToStaticMarkup(
      <SiteNav content={contentOf([philosophy])} currentPath="/philosophy" />,
    );
    expect(html.match(/aria-current="page"/g)?.length).toBe(1);
    expect(openingTag(html, 'data-nav-section="philosophy"')).toContain(
      'aria-current="page"',
    );
  });

  test("an index page of a section is listed and marked only while it is the current page", () => {
    const foundation = makeDoc({
      id: "foundation",
      kind: "index",
      title: "Foundation",
      navSection: "architecture",
      route: "/architecture/foundation",
    });
    const capabilities = makeDoc({
      id: "capabilities",
      kind: "capability-map",
      title: "Capabilities",
      navSection: "architecture",
      route: "/architecture/capabilities",
    });
    const content = contentOf([capabilities, foundation]);

    const onFoundation = renderToStaticMarkup(
      <SiteNav content={content} currentPath="/architecture/foundation" />,
    );
    expect(currentMarks(onFoundation)).toBe(1);
    expect(
      openingTag(onFoundation, 'href="/architecture/foundation"'),
    ).toContain('aria-current="page"');

    const onCapabilities = renderToStaticMarkup(
      <SiteNav content={content} currentPath="/architecture/capabilities" />,
    );
    expect(currentMarks(onCapabilities)).toBe(1);
    expect(onCapabilities).not.toContain('href="/architecture/foundation"');
  });

  test("marks the section link as current on its own page", () => {
    const html = renderToStaticMarkup(
      <SiteNav content={content} currentPath="/principles" />,
    );
    expect(openingTag(html, 'data-nav-section="principles"')).toContain(
      'aria-current="page"',
    );
  });
});

describe("DocumentList", () => {
  test("lists each document with its link, summary, badges and date", () => {
    const decision = makeDoc({
      id: "ADR-0012",
      kind: "decision",
      title: "ADR-0012 — Locus",
      summary: "Decision summary.",
      status: "accepted",
      maturity: "implemented",
      navSection: "decisions",
      route: "/decisions/ADR-0012",
      date: "2026-10-21",
    });
    const html = renderToStaticMarkup(
      <DocumentList heading="All decisions" docs={[decision]} />,
    );

    expect(html).toContain("All decisions");
    expect(html).toContain('href="/decisions/ADR-0012"');
    expect(html).toContain("ADR-0012 — Locus");
    expect(html).toContain("Decision summary.");
    expect(html).toContain('data-status="accepted"');
    expect(html).toContain('data-maturity="implemented"');
    expect(html).toContain('<time dateTime="2026-10-21"');
  });
});

describe("NotFound", () => {
  test("renders the not-found page with a link to the introduction", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('data-page="not-found"');
    expect(html).toContain("Page not found");
    expect(html).toContain('href="/"');
  });
});

describe("the route tree", () => {
  beforeAll(() => {
    // Vite resolves the stylesheet URL import and the generated content, which bun test does not
    // provide, so the route tree is loaded with a plain URL and this fixture: one term at a known route.
    mock.module("../src/styles.css?url", () => ({ default: "/styles.css" }));
    mock.module("@/lib/generated", () => ({
      content: contentOf([
        makeDoc({
          id: "example-term",
          kind: "term",
          title: "Example term",
          navSection: "terminology",
          route: "/terminology/example-term",
        }),
      ]),
      specReportJson: null,
      buildInfoJson: null,
    }));
  });

  // Renders the real route tree at a path, through the root route's layout and outlet. renderToString
  // keeps the Suspense boundary comments that the streamed server HTML has and hydration matches.
  async function renderPath(path: string): Promise<string> {
    const { routeTree } = await import("@/routeTree.gen");
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    await router.load();
    return renderToString(<RouterProvider router={router} />);
  }

  // The skip link belongs to the site layout, so one skip link means one layout.
  function expectOneSiteLayout(html: string): void {
    expect(countOf(html, /href="#content"/g)).toBe(1);
    expect(countOf(html, /<header[\s>]/g)).toBe(1);
    expect(countOf(html, /aria-label="Sections"/g)).toBe(1);
    expect(countOf(html, /data-nav-section="/g)).toBe(NAV_SECTIONS.length);
    expect(countOf(html, /<main[\s>]/g)).toBe(1);
  }

  test.each([
    ["an unknown path", "/no-such-page"],
    ["an unknown document in a section", "/terminology/no-such-term"],
  ])(
    "%s renders one site layout around the not-found page",
    async (_label, path) => {
      const html = await renderPath(path);
      expectOneSiteLayout(html);
      expect(html).toContain('data-page="not-found"');
    },
  );

  test("the prerendered not-found page renders one site layout", async () => {
    const html = await renderPath("/not-found");
    expectOneSiteLayout(html);
    expect(html).toContain('data-page="not-found"');
  });

  // The server sends the prerendered not-found page for every unknown path, so the client must
  // render the same markup for an unknown path or hydration fails (React error #418).
  test("an unknown path renders the same markup as the prerendered not-found page", async () => {
    const unknown = await renderPath("/no-such-page");
    const prerendered = await renderPath("/not-found");
    expect(bodyMarkup(unknown)).toBe(bodyMarkup(prerendered));
  });

  test("a document page renders one site layout around its document", async () => {
    const html = await renderPath("/terminology/example-term");
    expectOneSiteLayout(html);
    expect(html).toContain('data-doc-id="example-term"');
    expect(html).not.toContain('data-page="not-found"');
  });
});

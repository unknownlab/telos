// START_MODULE_CONTRACT
//   PURPOSE: Prove that the Verification page shows the build-time semantic report or "Not run", keeps every finding and closure finding visible with its knowledge, and labels every result with its provenance (FR-021, FR-022, INV-013).
//   SCOPE: SemanticReportView with no report and with a report built by the real kernel, the ResultPanel and ProvenanceLabel texts for null and bun-build provenance.
//   DEPENDS: M-DOCS-SITE, M-DOCS-SEMANTIC-REPORT
//   LINKS: V-M-DOCS-SEMANTIC-REPORT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ENTITIES - the character references that React writes into text
//   textOf - the visible text of a markup string, tags removed and entities decoded
//   labelTexts - the text of every provenance label, in document order
//   openingTags - every opening tag in a markup string
//   renderIn - render an element inside a memory router, so that Link has its context
// END_MODULE_MAP

import { beforeAll, describe, expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { ProvenanceLabel } from "@/components/provenance-label";
import { ResultPanel } from "@/components/result-panel";
import { SemanticReportView } from "@/components/semantic-report-view";
import type { SemanticReport } from "@/lib/build-data";
import { buildProvenanceOf, provenanceText } from "@/lib/provenance";
import { semanticReportFixture } from "../test/semantic-report-fixture";

const ENTITIES: Readonly<Record<string, string>> = {
  "&quot;": '"',
  "&amp;": "&",
  "&#x27;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

// Link needs a router, so every element is rendered inside a memory router.
async function renderIn(element: ReactElement): Promise<string> {
  const rootRoute = createRootRoute({ component: () => element });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

function textOf(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replace(
      /&(quot|amp|#x27|lt|gt);/g,
      (entity) => ENTITIES[entity] ?? entity,
    );
}

function openingTags(markup: string): string[] {
  return [...markup.matchAll(/<[a-zA-Z][^>]*>/g)].map((match) => match[0]);
}

function labelTexts(markup: string): string[] {
  return [
    ...markup.matchAll(/<p data-slot="provenance-label"[^>]*>([\s\S]*?)<\/p>/g),
  ].map((match) => textOf(match[1] ?? ""));
}

describe("SemanticReportView with no report", () => {
  let markup = "";
  beforeAll(async () => {
    markup = await renderIn(
      <SemanticReportView report={null} provenance={null} />,
    );
  });

  test("says Not run and renders no result panel", () => {
    expect(markup).toContain('data-slot="no-report"');
    expect(markup).not.toContain("data-result=");
  });
});

describe("SemanticReportView with the fixture report", () => {
  let report: SemanticReport;
  let markup = "";
  beforeAll(async () => {
    report = await semanticReportFixture();
    const provenance = buildProvenanceOf(report, { dirty: false });
    markup = await renderIn(
      <SemanticReportView report={report} provenance={provenance} />,
    );
  });

  test("the panel is a semantic-report result with bun-build provenance and the label text", () => {
    const tag = openingTags(markup).find((candidate) =>
      candidate.includes('data-result="semantic-report"'),
    );
    expect(tag).toContain('data-provenance="bun-build"');
    expect(labelTexts(markup)[0]).toBe(
      provenanceText(buildProvenanceOf(report, { dirty: false })),
    );
  });

  test("the ok flag is reported as false", () => {
    expect(markup).toContain('data-ok="false"');
  });

  test("one row per verification finding", () => {
    const rows = markup.match(/data-finding-outcome="/g) ?? [];
    expect(rows.length).toBe(report.verification.findings.length);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("the closure finding row carries its code and a derived knowledge badge", () => {
    expect(markup).toContain('data-closure-code="closure.unowned"');
    const row = markup.slice(
      markup.indexOf('data-closure-code="closure.unowned"'),
    );
    expect(row.slice(0, row.indexOf("</tr>"))).toContain(
      'data-knowledge="derived"',
    );
  });

  test("the closure limits are listed", () => {
    expect(markup.match(/data-closure-limit/g)?.length).toBe(
      report.closure.limits.length,
    );
  });

  test("the page points to the playground", () => {
    expect(markup).toContain('href="/playground"');
  });
});

describe("SemanticReportView with a clean report", () => {
  test("ok true and no closure findings say so", async () => {
    const base = await semanticReportFixture();
    const report: SemanticReport = {
      ...base,
      ok: true,
      closure: { ...base.closure, findings: [] },
    };
    const markup = await renderIn(
      <SemanticReportView
        report={report}
        provenance={buildProvenanceOf(report, null)}
      />,
    );
    expect(markup).toContain('data-ok="true"');
    expect(textOf(markup)).toContain("No closure findings.");
    expect(markup).toContain('data-slot="no-closure-findings"');
  });
});

describe("ResultPanel and ProvenanceLabel", () => {
  test("a null provenance is origin none with the text Not run", () => {
    const markup = renderToStaticMarkup(
      <ResultPanel kind="semantic-report" provenance={null} title="x">
        <p>body</p>
      </ResultPanel>,
    );
    expect(markup).toContain('data-provenance="none"');
    expect(labelTexts(markup)[0]).toBe("Not run");
  });

  test("the origin icon is hidden from assistive technology", () => {
    const markup = renderToStaticMarkup(<ProvenanceLabel provenance={null} />);
    expect(markup).toContain('aria-hidden="true"');
  });
});

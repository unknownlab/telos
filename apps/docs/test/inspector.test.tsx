// START_MODULE_CONTRACT
//   PURPOSE: Prove that the inspector renders the real repository model: one prerendered page per Locus, capability schemas, errors, contract digest and exposing interfaces, knowledge badges, and the not-found behaviour of the slugs.
//   SCOPE: locusSlug and locusIdOf, inspectorPages, KnowledgeBadge, LocusView of calculator:arithmetic and calculator:app, and InspectorTree without a report, all over the real kernel fixture.
//   DEPENDS: M-DOCS-INSPECTOR, M-DOCS-SEMANTIC-REPORT
//   LINKS: V-M-DOCS-INSPECTOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   renderIn - render an element inside a memory router, so that Link has its context
//   fixtureLocus - the fixture Locus with the given id
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { InspectorTree } from "@/components/inspector-tree";
import { KnowledgeBadge } from "@/components/knowledge-badge";
import { LocusView } from "@/components/locus-view";
import type { SemanticReport } from "@/lib/build-data";
import { inspectorPages } from "@/lib/prerender";
import { locusIdOf, locusSlug } from "@/lib/locus-slug";
import { semanticReportFixture } from "../test/semantic-report-fixture";

async function renderIn(element: ReactElement): Promise<string> {
  const rootRoute = createRootRoute({ component: () => element });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

function fixtureLocus(report: SemanticReport, id: string) {
  const locus = report.model.loci.find((candidate) => candidate.id === id);
  if (locus === undefined) throw new Error(`no fixture Locus ${id}`);
  return locus;
}

describe("the slugs", () => {
  test("locusSlug and locusIdOf round-trip every Locus of the fixture", async () => {
    const report = await semanticReportFixture();
    for (const locus of report.model.loci) {
      expect(locusIdOf(locusSlug(locus.id))).toBe(locus.id);
    }
  });

  test("telos:kernel maps to telos--kernel and back", () => {
    expect(locusSlug("telos:kernel")).toBe("telos--kernel");
    expect(locusIdOf("telos--kernel")).toBe("telos:kernel");
  });

  test("inspectorPages lists one page per Locus in report order", async () => {
    const report = await semanticReportFixture();
    expect(inspectorPages(report)).toEqual(
      report.model.loci.map((locus) => `/inspector/${locusSlug(locus.id)}`),
    );
  });
});

describe("KnowledgeBadge", () => {
  test.each([
    ["declared", "declared"],
    ["derived", "derived"],
    ["verified", "verified"],
    ["failed", "failed"],
    ["not-run", "not run"],
    ["unknown", "unknown"],
  ] as const)(
    "%s renders its knowledge and its label %s",
    (knowledge, label) => {
      const markup = renderToString(<KnowledgeBadge knowledge={knowledge} />);
      expect(markup).toContain(`data-knowledge="${knowledge}"`);
      expect(markup).toContain(label);
    },
  );
});

describe("LocusView of calculator:arithmetic", () => {
  test("shows the add capability with its exposing interface and contract digest", async () => {
    const report = await semanticReportFixture();
    const markup = await renderIn(
      <LocusView
        locus={fixtureLocus(report, "calculator:arithmetic")}
        verifications={report.verifications["calculator:arithmetic"] ?? []}
      />,
    );
    expect(markup).toContain('data-capability="add"');
    expect(markup).toContain('data-capability="divide"');
    expect(markup).toContain('data-exposed-by="calculator:cli"');
    expect(markup).toContain('data-error-tag="DivisionByZero"');
    expect(markup).toMatch(
      /data-slot="contract-digest"[^>]*>sha256:[0-9a-f]{64}</,
    );
  });

  test("the input schema of a capability is JSON Schema", async () => {
    const report = await semanticReportFixture();
    const markup = await renderIn(
      <LocusView
        locus={fixtureLocus(report, "calculator:arithmetic")}
        verifications={report.verifications["calculator:arithmetic"] ?? []}
      />,
    );
    expect(markup).toContain('data-slot="input-schema"');
    expect(markup).toContain("&quot;properties&quot;");
  });

  test("its verification is verified, with the verified knowledge badge", async () => {
    const report = await semanticReportFixture();
    const markup = await renderIn(
      <LocusView
        locus={fixtureLocus(report, "calculator:arithmetic")}
        verifications={report.verifications["calculator:arithmetic"] ?? []}
      />,
    );
    expect(markup).toContain('data-knowledge="verified"');
  });
});

describe("LocusView of calculator:app", () => {
  test("its verification rows are not run", async () => {
    const report = await semanticReportFixture();
    const markup = await renderIn(
      <LocusView
        locus={fixtureLocus(report, "calculator:app")}
        verifications={report.verifications["calculator:app"] ?? []}
      />,
    );
    expect(markup).toContain('data-verification-outcome="not-run"');
    expect(markup).toContain('data-knowledge="not-run"');
  });
});

describe("InspectorTree without a report", () => {
  test("says Not run and lists no Locus", async () => {
    const markup = await renderIn(
      <InspectorTree report={null} provenance={null} />,
    );
    expect(markup).toContain('data-slot="no-report"');
    expect(markup).not.toContain("data-locus-id=");
  });
});

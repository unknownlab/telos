// START_MODULE_CONTRACT
//   PURPOSE: Prove that the Verification page shows the build-time report or "Not run", keeps failing rows visible, and labels every result with its provenance (FR-021, FR-022, NS-018, INV-013).
//   SCOPE: VerificationView with no report and with a one-pass, one-fail report, an unknown id row, the coverage rule over the rendered markup, the historical ResultPanel and the ProvenanceLabel text.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   HEX40 - a 40-character lower-case hex commit used by the built report
//   PACKAGES - the package versions used by the built report
//   ENTITIES - the character references that React writes into text
//   builtFile - a bun-build spec report file holding the given results
//   passing - a passing result for a catalogue record
//   failing - a failing result for a catalogue record
//   openingTags - every opening tag in a markup string
//   textOf - the visible text of a markup string, tags removed and entities decoded
//   labelTexts - the text of every provenance label, in document order
//   assertCoverage - the INV-013 coverage rule over one markup string
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { type SpecResult, catalogue } from "@telos/locus-specs";
import { ProvenanceLabel } from "@/components/provenance-label";
import { ResultPanel } from "@/components/result-panel";
import { VerificationView } from "@/components/verification-view";
import type { SpecReportFile } from "@/lib/build-data";
import {
  type BunBuildProvenance,
  PACKAGE_VERSIONS,
  provenanceText,
  toHistorical,
} from "@/lib/provenance";

const HEX40 = "0123456789abcdef0123456789abcdef01234567";
const PACKAGES = PACKAGE_VERSIONS;
const ENTITIES: Readonly<Record<string, string>> = {
  "&quot;": '"',
  "&amp;": "&",
  "&#x27;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function passing(id: string): SpecResult {
  return {
    id: id as SpecResult["id"],
    status: "pass",
    expected: { valid: true, diagnostics: [] },
    observed: { valid: true, diagnostics: [] },
    durationMs: 1,
  };
}

function failing(id: string): SpecResult {
  return {
    id: id as SpecResult["id"],
    status: "fail",
    expected: { valid: false, diagnostics: [] },
    observed: { valid: true, diagnostics: [] },
    durationMs: 2,
  };
}

function builtFile(results: ReadonlyArray<SpecResult>): SpecReportFile {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const errored = results.filter((r) => r.status === "error").length;
  return {
    report: {
      results,
      summary: { total: results.length, passed, failed, errored },
    },
    provenance: {
      origin: "bun-build",
      at: "2026-10-21T10:18:46.123Z",
      runtime: "Bun 1.4.4",
      packages: PACKAGES,
      commit: HEX40,
      dirty: false,
    } satisfies BunBuildProvenance,
  };
}

function openingTags(markup: string): string[] {
  return [...markup.matchAll(/<[a-zA-Z][^>]*>/g)].map((match) => match[0]);
}

function textOf(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replace(
      /&(quot|amp|#x27|lt|gt);/g,
      (entity) => ENTITIES[entity] ?? entity,
    );
}

function labelTexts(markup: string): string[] {
  return [
    ...markup.matchAll(/<p data-slot="provenance-label"[^>]*>([\s\S]*?)<\/p>/g),
  ].map((match) => textOf(match[1] ?? ""));
}

function assertCoverage(markup: string): void {
  const withResult = openingTags(markup).filter((tag) =>
    tag.includes("data-result="),
  );
  for (const tag of withResult) {
    expect(tag).toContain("data-provenance=");
  }
  const labels = markup.split('data-slot="provenance-label"').length - 1;
  expect(labels).toBeGreaterThanOrEqual(withResult.length);
}

describe("Verification with no report (NS-018)", () => {
  const markup = renderToStaticMarkup(
    <VerificationView file={null} specs={catalogue} />,
  );

  test("the build panel is a result with origin none and reads Not run", () => {
    const tag = openingTags(markup).find(
      (candidate) =>
        candidate.includes('data-result="spec-report"') &&
        candidate.includes('data-provenance="none"'),
    );
    expect(tag).toBeDefined();
    expect(labelTexts(markup)[0]).toBe("Not run");
    expect(textOf(markup)).toContain("Not run.");
  });

  test("no result row is shown and nothing is counted as passed", () => {
    expect(markup).not.toContain("data-spec-id");
    expect(textOf(markup)).not.toMatch(/\bpassed\b/);
  });

  test("the CI panel reads CI: not available with origin ci", () => {
    const ciTags = openingTags(markup).filter((tag) =>
      tag.includes('data-provenance="ci"'),
    );
    expect(ciTags).toHaveLength(1);
    expect(labelTexts(markup)[1]).toBe("CI: not available");
  });

  test("every result element names its provenance", () => {
    assertCoverage(markup);
  });
});

describe("Verification with a one-pass, one-fail report", () => {
  const file = builtFile([
    passing(catalogue[0]?.id ?? "LOC-001"),
    failing(catalogue[1]?.id ?? "LOC-002"),
  ]);
  const markup = renderToStaticMarkup(
    <VerificationView file={file} specs={catalogue} />,
  );

  test("each result is a row with its id and status", () => {
    expect(markup).toContain(`data-spec-id="${catalogue[0]?.id}"`);
    expect(markup).toContain(
      `data-spec-id="${catalogue[1]?.id}" data-spec-status="fail"`,
    );
    expect(markup).toContain('data-spec-status="pass"');
  });

  test("the summary counts the rows", () => {
    expect(textOf(markup)).toContain(
      "2 specifications: 1 passed, 1 failed, 0 errored.",
    );
  });

  test("the build panel carries bun-build provenance and its label is the provenance text", () => {
    const tag = openingTags(markup).find((candidate) =>
      candidate.includes('data-result="spec-report"'),
    );
    expect(tag).toContain('data-provenance="bun-build"');
    expect(labelTexts(markup)[0]).toBe(provenanceText(file.provenance));
  });

  test("the failing row shows its expected and observed values", () => {
    const text = textOf(markup);
    expect(text).toContain(
      JSON.stringify(failing("LOC-002").expected, null, 2),
    );
    expect(text).toContain(
      JSON.stringify({ valid: true, diagnostics: [] }, null, 2),
    );
  });

  test("every result element names its provenance", () => {
    assertCoverage(markup);
  });
});

describe("a result for an id that is not in the catalogue", () => {
  test("the row is kept and says so", () => {
    const markup = renderToStaticMarkup(
      <VerificationView
        file={builtFile([passing("LOC-999")])}
        specs={catalogue}
      />,
    );
    expect(markup).toContain('data-spec-id="LOC-999"');
    expect(textOf(markup)).toContain("(not in this catalogue)");
  });
});

describe("ResultPanel and ProvenanceLabel", () => {
  test("a historical result is marked stale and labelled as historical", () => {
    const historical = toHistorical({
      origin: "browser",
      at: "2026-10-21T10:18:46.123Z",
      packages: PACKAGES,
      siteCommit: HEX40,
    });
    const markup = renderToStaticMarkup(
      <ResultPanel kind="spec-result" provenance={historical} title="Stale run">
        <p>Body</p>
      </ResultPanel>,
    );
    expect(markup).toContain('data-stale="true"');
    expect(markup).toContain('data-provenance="historical"');
    expect(labelTexts(markup)[0]?.startsWith("Historical:")).toBe(true);
  });

  test("a fresh result is not marked stale", () => {
    const markup = renderToStaticMarkup(
      <ResultPanel kind="spec-result" provenance={null} title="No run">
        <p>Body</p>
      </ResultPanel>,
    );
    expect(markup).not.toContain("data-stale");
  });

  test("the label renders the provenance text next to an icon hidden from assistive technology", () => {
    const markup = renderToStaticMarkup(<ProvenanceLabel provenance={null} />);
    expect(markup).toContain('data-slot="provenance-label"');
    expect(markup).toContain('data-origin="none"');
    expect(markup).toContain('aria-hidden="true"');
    expect(textOf(markup)).toBe("Not run");
  });
});

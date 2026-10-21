// START_MODULE_CONTRACT
//   PURPOSE: Prove that the playground markup is correct before any script runs: the no-JavaScript fallback, the escaping of user text, the result views with their provenance and the scenario index (FR-019, FR-021, C-002).
//   SCOPE: ScenarioShell, ValidationReportView, RevisionIdsView, DecodeErrorView, RelationTableView and PlaygroundIndex, rendered with renderToStaticMarkup so that no effect runs.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   INSTANT - the fixed instant of the browser provenance in every case
//   SITE_COMMIT - the site commit of the browser provenance in every case
//   CHECKOUT_ID - a Revision id in the shape the package produces
//   VALID_REPORT - a validation report with no diagnostics
//   INVALID_REPORT - a validation report with two diagnostics on shop:checkout
//   BROWSER - the browser provenance of a run at INSTANT
//   HISTORICAL - the historical provenance of the same run
//   ENTITIES - the entities that React writes for text, by their names
//   escapeHtml - the entities React writes for text, so that expected text can be compared with markup
//   unescapeHtml - the text of an HTML fragment, with the entities React writes undone
//   preText - the text of the first pre element with the given data-slot, or null when there is none
//   countOf - the number of occurrences of a substring
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ValidationReport } from "@telos/locus";
import { ScenarioShell } from "@/playground/components/scenario-shell";
import {
  DecodeErrorView,
  RelationTableView,
  RevisionIdsView,
  ValidationReportView,
} from "@/playground/components/fabric-results";
import { PlaygroundIndex } from "@/playground/components/playground-index";
import { SCENARIOS, scenarioById } from "@/playground/registry";
import { browserProvenance, toHistorical } from "@/lib/provenance";
import type { FabricOutcome } from "@/playground/run-fabric";

const INSTANT = new Date("2026-10-21T10:18:46.123Z");
const SITE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const CHECKOUT_ID =
  "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6";
const BROWSER = browserProvenance(INSTANT, SITE_COMMIT, {
  "@telos/locus": "0.1.0",
  "@telos/locus-specs": "0.1.0",
});
const HISTORICAL = toHistorical(BROWSER);

const VALID_REPORT: ValidationReport = { valid: true, diagnostics: [] };
const INVALID_REPORT: ValidationReport = {
  valid: false,
  diagnostics: [
    {
      code: "charter.purpose-blank",
      scope: "locus",
      subject: "shop:checkout",
      path: "charter.purpose",
      message: "The purpose is blank.",
    },
    {
      code: "charter.entry-duplicate",
      scope: "locus",
      subject: "shop:checkout",
      path: "charter.responsibilities",
      detail: "Collect payment details",
      message: "A responsibility is repeated.",
    },
  ],
};

const ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function unescapeHtml(text: string): string {
  return text.replace(
    /&(amp|lt|gt|quot|#x27);/g,
    (entity) => ENTITIES[entity] ?? entity,
  );
}

function preText(markup: string, slot: string): string | null {
  const match = new RegExp(
    `<pre[^>]*data-slot="${slot}"[^>]*>([\\s\\S]*?)</pre>`,
  ).exec(markup);
  return match?.[1] === undefined ? null : unescapeHtml(match[1]);
}

function countOf(markup: string, needle: string): number {
  return markup.split(needle).length - 1;
}

describe("ScenarioShell without JavaScript", () => {
  for (const id of ["a", "b", "c"] as const) {
    test(`scenario ${id} shows its heading, description, fallback and example input`, () => {
      const scenario = scenarioById(id);
      if (scenario === undefined) throw new Error(`no scenario ${id}`);
      const markup = renderToStaticMarkup(
        <ScenarioShell
          scenario={scenario}
          siteCommit={SITE_COMMIT}
          buildReport={null}
        />,
      );
      expect(markup).toMatch(
        new RegExp(
          `<h1[^>]*>${escapeHtml(`Scenario ${scenario.letter}: ${scenario.title}`)}</h1>`,
        ),
      );
      for (const paragraph of scenario.description) {
        expect(markup).toContain(`<p>${escapeHtml(paragraph)}</p>`);
      }
      expect(markup).toContain('data-slot="no-js"');
      expect(markup).toContain("The playground needs JavaScript");
      expect(preText(markup, "example-input")).toBe(scenario.exampleText);
      expect(markup).not.toContain('data-slot="playground"');
    });
  }

  test("an example that holds a script element as a purpose is written escaped, never raw", () => {
    const scenario = scenarioById("a");
    if (scenario === undefined) throw new Error("no scenario a");
    const hostile = {
      ...scenario,
      exampleText: JSON.stringify(
        {
          id: "shop:system",
          loci: [
            { id: "shop:a", charter: { purpose: "<script>alert(1)</script>" } },
          ],
        },
        null,
        2,
      ),
    };
    const markup = renderToStaticMarkup(
      <ScenarioShell
        scenario={hostile}
        siteCommit={SITE_COMMIT}
        buildReport={null}
      />,
    );
    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(markup).not.toContain("<script>");
    expect(preText(markup, "example-input")).toBe(hostile.exampleText);
  });
});

describe("result views", () => {
  test("a valid report shows Valid with its browser provenance", () => {
    const markup = renderToStaticMarkup(
      <ValidationReportView report={VALID_REPORT} provenance={BROWSER} />,
    );
    expect(markup).toContain('data-result="validation-report"');
    expect(markup).toContain('data-provenance="browser"');
    expect(markup).toContain('data-valid="true"');
    expect(markup).toContain("Valid: no diagnostics.");
    expect(markup).toContain("Run in this browser at 2026-10-21 10:18:46 UTC");
    expect(markup).not.toContain('data-stale="true"');
  });

  test("an invalid report lists each diagnostic with its code and never says it is valid", () => {
    const markup = renderToStaticMarkup(
      <ValidationReportView report={INVALID_REPORT} provenance={BROWSER} />,
    );
    expect(countOf(markup, "data-diagnostic-code=")).toBe(2);
    expect(markup).toContain("Invalid: 2 diagnostic(s).");
    expect(markup).toContain('data-valid="false"');
    expect(markup).not.toContain("Valid: no diagnostics.");
  });

  test("a diagnostic message is escaped, never raw", () => {
    const report: ValidationReport = {
      valid: false,
      diagnostics: [
        {
          code: "identity.malformed",
          scope: "fabric",
          subject: "<script>alert(1)</script>",
          path: "id",
          message:
            'Fabric identity "<script>alert(1)</script>" does not match namespace:name.',
        },
      ],
    };
    const markup = renderToStaticMarkup(
      <ValidationReportView report={report} provenance={BROWSER} />,
    );
    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(markup).not.toContain("<script>");
  });

  test("Revision ids give one row per Locus, and a historical result is marked stale", () => {
    const revisions: Extract<
      FabricOutcome,
      { kind: "validated" }
    >["revisions"] = {
      ok: true,
      rows: [
        { locus: "shop:checkout", id: CHECKOUT_ID as `sha256:${string}` },
        { locus: "shop:payment", id: CHECKOUT_ID as `sha256:${string}` },
      ],
    };
    const markup = renderToStaticMarkup(
      <RevisionIdsView revisions={revisions} provenance={HISTORICAL} />,
    );
    expect(countOf(markup, "data-revision-id=")).toBe(2);
    expect(countOf(markup, "data-locus=")).toBe(2);
    expect(markup).toContain(`data-revision-id="${CHECKOUT_ID}"`);
    expect(markup).toContain('data-stale="true"');
    expect(markup).toContain('data-provenance="historical"');
    expect(markup).toContain("Historical:");
  });

  test("a decode error at the whole input shows (whole input) and the issue count", () => {
    const markup = renderToStaticMarkup(
      <DecodeErrorView
        issues={[{ path: "", message: "Expected a JSON value." }]}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain("(whole input)");
    expect(markup).toContain(
      "The input is not a Fabric: 1 decode issue(s). Nothing was validated.",
    );
    expect(markup).toContain('data-issue-path=""');
    expect(markup).toContain('data-result="decode-error"');
  });

  test("a relation row carries its endpoints and its problem as data attributes", () => {
    const markup = renderToStaticMarkup(
      <RelationTableView
        rows={[
          {
            from: "shop:checkout",
            kind: "refines",
            target: "shop:payment",
            problems: ["refines-cycle"],
          },
        ]}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain(
      'data-relation="shop:checkout refines shop:payment"',
    );
    expect(markup).toContain('data-relation-status="refines-cycle"');
    expect(markup).toContain("In a refines cycle");
  });

  test("an empty relation table says so", () => {
    const markup = renderToStaticMarkup(
      <RelationTableView rows={[]} provenance={BROWSER} />,
    );
    expect(markup).toContain("No Relations.");
  });
});

describe("PlaygroundIndex", () => {
  test("links to scenarios a to c in order", () => {
    const markup = renderToStaticMarkup(
      <PlaygroundIndex scenarios={SCENARIOS} />,
    );
    const hrefs = [...markup.matchAll(/href="(\/playground\/[a-z])"/g)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual(["/playground/a", "/playground/b", "/playground/c"]);
    expect(markup).toContain('data-page="playground"');
  });
});

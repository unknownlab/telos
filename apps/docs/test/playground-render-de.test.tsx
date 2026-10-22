// START_MODULE_CONTRACT
//   PURPOSE: Prove that the scenario D and E markup is correct before any script runs: the registry order, the no-JavaScript fallbacks, the change set and Revision views, the build-report and comparison views and the golden table (FR-019, FR-021, C-002).
//   SCOPE: SCENARIOS, ScenarioShell for D and E, SideView, ChangeSetView, BuildReportView, ComparisonView and GoldenView, rendered with renderToStaticMarkup so that no effect runs.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   INSTANT - the fixed instant of the provenance in every case
//   SITE_COMMIT - the site commit of the browser provenance in every case
//   PACKAGES - the package versions of the provenance in every case
//   BROWSER - the browser provenance of a run at INSTANT
//   countOf - the number of occurrences of a substring
//   tagsWith - the opening tags of one name that carry a given attribute, in document order
//   buildFile - a SpecReportFile built from a real run of the catalogue
//   history - the outcome of running the history example's A and B
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { catalogue, examples, revisionGoldens } from "@telos/locus/specs";
import { browserProvenance } from "@/lib/provenance";
import type { SpecReportFile } from "@/lib/build-data";
import { ScenarioShell } from "@/playground/components/scenario-shell";
import {
  SideView,
  ChangeSetView,
} from "@/playground/components/revision-results";
import {
  BrowserReportView,
  BuildReportView,
  ComparisonView,
  GoldenView,
} from "@/playground/components/specs-results";
import { SCENARIOS, scenarioById } from "@/playground/registry";
import { runAllSpecs } from "@/playground/run-specs";
import {
  runRevisions,
  type RevisionsOutcome,
} from "@/playground/run-revisions";

const INSTANT = new Date("2026-10-21T10:18:46.123Z");
const SITE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const PACKAGES = {
  "@telos/locus": "0.1.0",
};
const BROWSER = browserProvenance(INSTANT, SITE_COMMIT, PACKAGES);

function countOf(markup: string, needle: string): number {
  return markup.split(needle).length - 1;
}

function tagsWith(markup: string, tag: string, attribute: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\b${attribute}[^>]*>`, "g");
  return markup.match(pattern) ?? [];
}

async function buildFile(): Promise<SpecReportFile> {
  const outcome = await runAllSpecs();
  return {
    report: outcome.report,
    provenance: {
      origin: "bun-build",
      at: "2026-10-21T10:00:00.000Z",
      runtime: "bun 1.4.4-canary.1",
      packages: PACKAGES,
      commit: SITE_COMMIT,
      dirty: false,
    },
  };
}

async function history(): Promise<RevisionsOutcome> {
  return runRevisions(
    JSON.stringify(examples.history.a),
    JSON.stringify(examples.history.b),
  );
}

describe("the scenario registry", () => {
  test("lists the scenarios A to E in letter order", () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  test("scenario E has no example input, and scenario D starts from the history example", () => {
    expect(scenarioById("e")?.exampleText).toBeNull();
    expect(scenarioById("d")?.exampleText).toBe(
      JSON.stringify(examples.history, null, 2),
    );
  });
});

describe("ScenarioShell for D and E without JavaScript", () => {
  test("scenario D says that Revisions are computed for invalid Loci too and that a Revision id is not a validity claim", () => {
    const scenario = scenarioById("d");
    if (scenario === undefined) throw new Error("no scenario d");
    const sentence =
      "Revisions are computed for any Locus that decodes, even one that is invalid. A Revision id does not mean that the Locus is valid.";
    expect(scenario.description).toContain(sentence);
    const markup = renderToStaticMarkup(
      <ScenarioShell
        scenario={scenario}
        siteCommit={SITE_COMMIT}
        buildReport={null}
      />,
    );
    expect(markup).toContain(`<p>${sentence}</p>`);
  });

  test("scenario D shows its heading, the fallback and the example input", () => {
    const scenario = scenarioById("d");
    if (scenario === undefined) throw new Error("no scenario d");
    const markup = renderToStaticMarkup(
      <ScenarioShell
        scenario={scenario}
        siteCommit={SITE_COMMIT}
        buildReport={null}
      />,
    );
    expect(markup).toContain("Scenario D: Revise a Locus");
    expect(markup).toContain('data-slot="no-js"');
    expect(markup).toContain('data-slot="example-input"');
    expect(markup).not.toContain('data-slot="playground"');
  });

  test("scenario E shows the fallback and no example input", () => {
    const scenario = scenarioById("e");
    if (scenario === undefined) throw new Error("no scenario e");
    const markup = renderToStaticMarkup(
      <ScenarioShell
        scenario={scenario}
        siteCommit={SITE_COMMIT}
        buildReport={null}
      />,
    );
    expect(markup).toContain("Scenario E: Run the specifications");
    expect(markup).toContain('data-slot="no-js"');
    expect(markup).not.toContain('data-slot="example-input"');
  });
});

describe("SideView", () => {
  test("a side that computed shows its identity and one Revision id, with its side and kind", async () => {
    const outcome = await history();
    const markup = renderToStaticMarkup(
      <SideView side="a" outcome={outcome.a} provenance={BROWSER} />,
    );
    expect(markup).toContain('data-side="a"');
    expect(markup).toContain('data-result="revision-id"');
    expect(countOf(markup, "data-revision-id")).toBe(1);
    expect(markup).toContain(
      'data-revision-id="sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6"',
    );
    expect(markup).toContain('data-locus="shop:checkout"');
    expect(markup).toContain('data-provenance="browser"');
    expect(markup).not.toContain('data-revision-id="true"');
  });

  test("a Revision result says plainly that its id does not mean the Locus is valid", async () => {
    const outcome = await history();
    const markup = renderToStaticMarkup(
      <SideView side="a" outcome={outcome.a} provenance={BROWSER} />,
    );
    expect(markup).toContain(
      "A Revision id does not mean that the Locus is valid.",
    );
  });

  test("a side that does not decode says so with its issue count, and has no Revision id", () => {
    const markup = renderToStaticMarkup(
      <SideView
        side="b"
        outcome={{
          ok: false,
          issues: [{ path: "", message: "Not valid JSON: Unexpected end" }],
        }}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain('data-side="b"');
    expect(markup).toContain('data-result="decode-error"');
    expect(markup).toContain("Locus B is not a Locus: 1 decode issue(s).");
    expect(countOf(markup, "data-revision-id")).toBe(0);
  });

  test("a digest failure says that the Revision id is unavailable", () => {
    const markup = renderToStaticMarkup(
      <SideView
        side="a"
        outcome={{ ok: false, digestFailed: true }}
        provenance={null}
      />,
    );
    expect(markup).toContain("Revision id unavailable: Web Crypto failed.");
    expect(markup).toContain('data-provenance="none"');
  });
});

describe("ChangeSetView", () => {
  test("the example change set has the removed responsibility, then the added one", async () => {
    const outcome = await history();
    const markup = renderToStaticMarkup(
      <ChangeSetView diff={outcome.diff} provenance={BROWSER} />,
    );
    expect(markup).toContain('data-result="change-set"');
    expect(markup).toContain("2 change(s) from A to B.");
    const kinds = tagsWith(markup, "tr", "data-change-kind").map(
      (tag) => /data-change-kind="([a-z]+)"/.exec(tag)?.[1],
    );
    expect(kinds).toEqual(["removed", "added"]);
    expect(markup).toContain("Collect payment details");
    expect(markup).toContain("Collect payment and delivery details");
  });

  test("a locus mismatch explains that the two sides are different Loci", () => {
    const markup = renderToStaticMarkup(
      <ChangeSetView
        diff={{
          kind: "locus-mismatch",
          from: "shop:checkout",
          to: "shop:other",
        }}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain(
      "A and B are different Loci (shop:checkout, shop:other).",
    );
  });

  test("an unavailable diff says to fix the input first", () => {
    const markup = renderToStaticMarkup(
      <ChangeSetView diff={{ kind: "unavailable" }} provenance={null} />,
    );
    expect(markup).toContain("No change set: fix the input above first.");
  });
});

describe("BuildReportView", () => {
  test("with no build report it says Not run and has no provenance", () => {
    const markup = renderToStaticMarkup(
      <BuildReportView file={null} specs={catalogue} />,
    );
    expect(markup).toContain("Not run: there is no build-time report");
    expect(markup).toContain('data-provenance="none"');
    expect(markup).toContain('data-result="spec-report"');
  });

  test("with a build report it shows the build provenance with its commit and time, and its rows", async () => {
    const file = await buildFile();
    const markup = renderToStaticMarkup(
      <BuildReportView file={file} specs={catalogue} />,
    );
    expect(markup).toContain('data-provenance="bun-build"');
    expect(markup).toContain("commit 0123456");
    expect(markup).toContain("2026-10-21 10:00:00 UTC");
    expect(countOf(markup, "data-spec-id=")).toBe(44);
  });
});

describe("BrowserReportView", () => {
  test("shows the browser run with its rows and its browser provenance", async () => {
    const outcome = await runAllSpecs();
    const markup = renderToStaticMarkup(
      <BrowserReportView
        report={outcome.report}
        specs={catalogue}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain("In this browser");
    expect(markup).toContain('data-provenance="browser"');
    expect(countOf(markup, "data-spec-id=")).toBe(44);
  });
});

describe("ComparisonView", () => {
  test("with no differences it says the results are the same", () => {
    const markup = renderToStaticMarkup(
      <ComparisonView
        differences={[]}
        buildAvailable
        total={44}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain('data-compare="same"');
    expect(markup).toContain(
      "Same results as the build report for all 44 specifications.",
    );
    expect(countOf(markup, "data-compare-id")).toBe(0);
  });

  test("with one difference it names the id and both statuses", () => {
    const markup = renderToStaticMarkup(
      <ComparisonView
        differences={[{ id: "LOC-002", browser: "fail", build: "pass" }]}
        buildAvailable
        total={44}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain('data-compare="different"');
    expect(markup).toContain(
      "1 specification(s) differ from the build report.",
    );
    expect(tagsWith(markup, "tr", "data-compare-id").length).toBe(1);
    expect(markup).toContain('data-compare-id="LOC-002"');
  });

  test("with no build report it says there is nothing to compare", () => {
    const markup = renderToStaticMarkup(
      <ComparisonView
        differences={[]}
        buildAvailable={false}
        total={44}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain(
      "Nothing to compare: there is no build-time report.",
    );
  });
});

describe("GoldenView", () => {
  test("with one mismatch it has one row with data-golden-match false", () => {
    const markup = renderToStaticMarkup(
      <GoldenView
        rows={[
          {
            key: "LOC-008.a",
            expected: revisionGoldens["LOC-008.a"] ?? "",
            observed: revisionGoldens["LOC-008.a"] ?? "",
            match: true,
          },
          {
            key: "LOC-008.b",
            expected: revisionGoldens["LOC-008.b"] ?? "",
            observed: `sha256:${"0".repeat(64)}`,
            match: false,
          },
        ]}
        provenance={BROWSER}
      />,
    );
    expect(markup).toContain("1 of 2 match.");
    expect(tagsWith(markup, "tr", "data-golden-match").length).toBe(2);
    expect(countOf(markup, 'data-golden-match="false"')).toBe(1);
    expect(countOf(markup, 'data-golden-match="true"')).toBe(1);
    expect(markup).toContain(
      `data-revision-id="${revisionGoldens["LOC-008.a"]}"`,
    );
    expect(markup).toContain(`data-revision-id="sha256:${"0".repeat(64)}"`);
    expect(markup).not.toContain('data-revision-id="true"');
    expect(markup).toContain("Revision ids of the revision fixtures");
  });
});

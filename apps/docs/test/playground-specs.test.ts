// START_MODULE_CONTRACT
//   PURPOSE: Prove that scenario E runs the real catalogue with the real runner in the browser, recomputes the golden Revision ids with @telos/locus, and compares statuses with a build report (FR-019, FR-021).
//   SCOPE: runAllSpecs, goldenRows and compareReports on the catalogue, on a changed golden and on a broken fixture. Bun only; no DOM.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FIXTURE_KEY - the golden key of the first revision-compare fixture, LOC-008.a
//   revisionCompareOf - the check of a revision-compare record, failing the test for any other kind
//   reportOf - a report with the given statuses, in the given order
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  catalogue,
  revisionGoldens,
  type SpecReport,
  type Specification,
} from "@telos/locus-specs";
import {
  compareReports,
  goldenRows,
  runAllSpecs,
} from "@/playground/run-specs";

const FIXTURE_KEY = "LOC-008.a";

function revisionCompareOf(spec: Specification) {
  if (spec.check.kind !== "revision-compare") {
    throw new Error(`${spec.id} is not a revision-compare record`);
  }
  return spec.check;
}

function reportOf(
  statuses: ReadonlyArray<readonly [string, "pass" | "fail" | "error"]>,
): SpecReport {
  const results = statuses.map(([id, status]) => ({
    id: id as Specification["id"],
    status,
    expected: null,
    observed: null,
    durationMs: 0,
  }));
  const count = (status: string) =>
    results.filter((r) => r.status === status).length;
  return {
    results,
    summary: {
      total: results.length,
      passed: count("pass"),
      failed: count("fail"),
      errored: count("error"),
    },
  };
}

describe("runAllSpecs on the catalogue", () => {
  test("runs all 44 specifications and they all pass in this browser", async () => {
    const outcome = await runAllSpecs();
    expect(outcome.report.summary).toEqual({
      total: 44,
      passed: 44,
      failed: 0,
      errored: 0,
    });
  });

  test("the browser report rows are the catalogue ids, in catalogue order", async () => {
    const outcome = await runAllSpecs();
    expect(outcome.report.results.map((result) => result.id)).toEqual(
      catalogue.map((spec) => spec.id),
    );
  });

  test("the golden check has eight rows, one per side of each revision-compare fixture, and all match", async () => {
    const outcome = await runAllSpecs();
    expect(outcome.goldens.length).toBe(8);
    expect(outcome.goldens.map((row) => row.key)).toEqual(
      Object.keys(revisionGoldens),
    );
    for (const row of outcome.goldens) {
      expect(row.match).toBe(true);
      expect(row.observed).toBe(row.expected);
    }
  });
});

describe("goldenRows", () => {
  test("its keys are exactly the keys of revisionGoldens, in catalogue order", async () => {
    const rows = await goldenRows(catalogue, revisionGoldens);
    expect(rows.map((row) => row.key)).toEqual(Object.keys(revisionGoldens));
  });

  test("a changed golden value gives exactly that row a mismatch", async () => {
    const changed = {
      ...revisionGoldens,
      [FIXTURE_KEY]: `sha256:${"0".repeat(64)}`,
    };
    const rows = await goldenRows(catalogue, changed);
    const mismatches = rows.filter((row) => !row.match);
    expect(mismatches.map((row) => row.key)).toEqual([FIXTURE_KEY]);
    expect(mismatches[0]?.expected).toBe(`sha256:${"0".repeat(64)}`);
    expect(mismatches[0]?.observed).toBe(revisionGoldens[FIXTURE_KEY]);
  });

  test("a fixture side that does not decode has no observed value and does not match", async () => {
    const spec = catalogue.find((record) => record.id === "LOC-008");
    if (spec === undefined) throw new Error("LOC-008 is missing");
    const check = revisionCompareOf(spec);
    const broken: Specification = {
      ...spec,
      check: { ...check, a: { id: "bad id" } as typeof check.a },
    };
    const rows = await goldenRows([broken], revisionGoldens);
    const failedRow = rows.find((row) => row.key === FIXTURE_KEY);
    expect(failedRow?.observed).toBeNull();
    expect(failedRow?.match).toBe(false);
    const sideB = rows.find((row) => row.key === "LOC-008.b");
    expect(sideB?.match).toBe(true);
  });

  test("a fixture with no golden value says so and does not match", async () => {
    const rows = await goldenRows(
      catalogue.filter((record) => record.id === "LOC-008"),
      {},
    );
    expect(rows.map((row) => row.expected)).toEqual([
      "(no golden value)",
      "(no golden value)",
    ]);
    expect(rows.every((row) => !row.match)).toBe(true);
  });

  test("a golden with no fixture is a mismatch, because nothing confirmed it", async () => {
    const rows = await goldenRows([], revisionGoldens);
    expect(rows.length).toBe(8);
    expect(rows.every((row) => row.observed === null && !row.match)).toBe(true);
  });
});

describe("compareReports", () => {
  test("equal reports give no differences", () => {
    const report = reportOf([
      ["LOC-001", "pass"],
      ["LOC-002", "fail"],
    ]);
    expect(compareReports(report, report)).toEqual([]);
  });

  test("one status flipped gives that id with both statuses", () => {
    const browser = reportOf([
      ["LOC-001", "pass"],
      ["LOC-002", "fail"],
    ]);
    const build = reportOf([
      ["LOC-001", "pass"],
      ["LOC-002", "pass"],
    ]);
    expect(compareReports(browser, build)).toEqual([
      { id: "LOC-002", browser: "fail", build: "pass" },
    ]);
  });

  test("an id only in the build report gives browser missing", () => {
    const browser = reportOf([["LOC-001", "pass"]]);
    const build = reportOf([
      ["LOC-001", "pass"],
      ["LOC-002", "pass"],
    ]);
    expect(compareReports(browser, build)).toEqual([
      { id: "LOC-002", browser: "missing", build: "pass" },
    ]);
  });

  test("differences are sorted by id", () => {
    const browser = reportOf([
      ["LOC-003", "pass"],
      ["LOC-001", "pass"],
    ]);
    const build = reportOf([
      ["LOC-001", "fail"],
      ["LOC-003", "error"],
    ]);
    expect(compareReports(browser, build).map((d) => d.id)).toEqual([
      "LOC-001",
      "LOC-003",
    ]);
  });
});

// START_MODULE_CONTRACT
//   PURPOSE: Run the whole catalogue in the browser with the real runner, recompute the golden Revision ids of the revision-compare fixtures, and compare the browser statuses with the build report (FR-019, FR-021, C-002).
//   SCOPE: GoldenRow, StatusDifference, SpecsOutcome, runAllSpecs, goldenRows and compareReports. Out: the views (specs-results.tsx) and the run state (run-state.ts). The build report is never read here; it is compared, not used as a source of results.
//   DEPENDS: M-DOCS-PLAYGROUND, M-LOCUS-REVISION, M-LOCUS-DECODE, M-LOCUS-SPECS
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   GoldenRow - one golden Revision id compared with the id the browser computed
//   StatusDifference - one specification whose status differs between the browser run and the build report
//   SpecsOutcome - the browser run of the catalogue and its golden rows
//   runAllSpecs - run the specifications with the real runner, then the golden check
//   goldenRows - recompute the Revision id of each side of each revision-compare record and compare it with its golden value
//   compareReports - the specifications whose status differs between two reports, sorted by id
// END_MODULE_MAP

import {
  catalogue,
  revisionGoldens,
  runSpecifications,
  type SpecReport,
  type SpecResult,
  type Specification,
} from "@telos/locus/specs";
import { createRevision, decodeLocus } from "@telos/locus";
import { Effect, Result } from "effect";

// START_CONTRACT: GoldenRow
//   PURPOSE: Name one golden Revision id, the id this browser computed, and whether they match.
//   INPUTS: none (type)
//   OUTPUTS: { GoldenRow - key, expected, observed (or null) and match }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: GoldenRow
/** One golden Revision id, the id the browser computed, and whether they match. */
export interface GoldenRow {
  readonly key: string;
  readonly expected: string;
  readonly observed: string | null;
  readonly match: boolean;
}

// START_CONTRACT: StatusDifference
//   PURPOSE: Name one specification whose status differs between the browser run and the build report.
//   INPUTS: none (type)
//   OUTPUTS: { StatusDifference - id, browser status or missing, build status or missing }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: StatusDifference
/** One specification whose status differs between the two reports. */
export interface StatusDifference {
  readonly id: string;
  readonly browser: SpecResult["status"] | "missing";
  readonly build: SpecResult["status"] | "missing";
}

// START_CONTRACT: SpecsOutcome
//   PURPOSE: Hold the browser run of the specifications and its golden rows.
//   INPUTS: none (type)
//   OUTPUTS: { SpecsOutcome - report and goldens }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: SpecsOutcome
/** The browser run of the catalogue and its golden rows. */
export interface SpecsOutcome {
  readonly report: SpecReport;
  readonly goldens: ReadonlyArray<GoldenRow>;
}

const NO_GOLDEN = "(no golden value)";

// START_CONTRACT: observedRevisionId
//   PURPOSE: Compute the Revision id of one Locus JSON with the package, or null when it does not decode or cannot be digested.
//   INPUTS: { json: unknown - the Locus JSON of one side of a fixture }
//   OUTPUTS: { Promise<string | null> - the Revision id, or null; never rejects }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle through createRevision.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: observedRevisionId
async function observedRevisionId(json: unknown): Promise<string | null> {
  const definition = await Effect.runPromise(Effect.result(decodeLocus(json)));
  if (Result.isFailure(definition)) return null;
  const revision = await Effect.runPromise(
    Effect.result(createRevision(definition.success)),
  );
  return Result.isFailure(revision) ? null : revision.success.id;
}

// START_CONTRACT: runAllSpecs
//   PURPOSE: Run the catalogue, or the given records, with the real runner and then the golden check, so that scenario E shows what this browser computes.
//   INPUTS: { specs: ReadonlyArray<Specification> - the records to run, the catalogue by default }
//   OUTPUTS: { Promise<SpecsOutcome> - the report of the runner and the golden rows; never rejects }
//   SIDE_EFFECTS: Runs the public package in the browser. Reads the clock inside the runner for durations.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: runAllSpecs
/** Runs the specifications in this browser, then recomputes the golden Revision ids. */
export async function runAllSpecs(
  specs: ReadonlyArray<Specification> = catalogue,
): Promise<SpecsOutcome> {
  const report = await Effect.runPromise(runSpecifications(specs));
  const goldens = await goldenRows(specs, revisionGoldens);
  return { report, goldens };
}

// START_CONTRACT: goldenRows
//   PURPOSE: Recompute the Revision id of each side of each revision-compare record and compare it with its golden value, so that a fixture that changed is a mismatch.
//   INPUTS: { specs: ReadonlyArray<Specification> - the records, goldens: Readonly<Record<string, string>> - the golden values by "<id>.a" and "<id>.b" }
//   OUTPUTS: { Promise<GoldenRow[]> - one row per fixture side in record order, then one row for each golden key with no fixture; a row with no computed id or no golden value never matches }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle through createRevision.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: goldenRows
/** The golden check of every revision-compare fixture side, in record order. */
export async function goldenRows(
  specs: ReadonlyArray<Specification>,
  goldens: Readonly<Record<string, string>>,
): Promise<GoldenRow[]> {
  const rows: GoldenRow[] = [];
  const fixtureKeys = new Set<string>();
  for (const spec of specs) {
    if (spec.check.kind !== "revision-compare") continue;
    for (const side of ["a", "b"] as const) {
      const key = `${spec.id}.${side}`;
      fixtureKeys.add(key);
      const expected = goldens[key];
      const observed = await observedRevisionId(spec.check[side]);
      rows.push({
        key,
        expected: expected ?? NO_GOLDEN,
        observed,
        match: expected !== undefined && observed === expected,
      });
    }
  }
  for (const key of Object.keys(goldens)) {
    if (fixtureKeys.has(key)) continue;
    rows.push({
      key,
      expected: goldens[key] ?? NO_GOLDEN,
      observed: null,
      match: false,
    });
  }
  return rows;
}

// START_CONTRACT: compareReports
//   PURPOSE: List each specification whose status differs between the browser run and the build report, or that only one of them has, so that scenario E says where they disagree.
//   INPUTS: { browser: SpecReport - the browser run, build: SpecReport - the build-time report }
//   OUTPUTS: { StatusDifference[] - one row per differing id, sorted by id; empty when every id has the same status }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: compareReports
/** The ids whose status differs between the two reports, sorted by id. */
export function compareReports(
  browser: SpecReport,
  build: SpecReport,
): StatusDifference[] {
  const browserById = new Map(
    browser.results.map((result) => [result.id as string, result.status]),
  );
  const buildById = new Map(
    build.results.map((result) => [result.id as string, result.status]),
  );
  const ids = [...new Set([...browserById.keys(), ...buildById.keys()])].sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  );
  const differences: StatusDifference[] = [];
  for (const id of ids) {
    const browserStatus = browserById.get(id) ?? "missing";
    const buildStatus = buildById.get(id) ?? "missing";
    if (browserStatus !== buildStatus) {
      differences.push({ id, browser: browserStatus, build: buildStatus });
    }
  }
  return differences;
}

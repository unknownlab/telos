// START_MODULE_CONTRACT
//   PURPOSE: Give scenario E its Run all action and its results, with the build-time report always shown beside the browser run, so that the reader compares what this browser computes with what the build recorded (FR-019, FR-021).
//   SCOPE: SpecsScenario. Out: the run (run-specs.ts), the views (specs-results.tsx), the run state (run-state.ts) and the registry (registry.ts). Scenario E has no input, so its result is never stale.
//   DEPENDS: M-DOCS-PLAYGROUND, M-DOCS-SITE, M-LOCUS-SPECS
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SpecsScenario - the Run all action, the build report and the results of scenario E
// END_MODULE_MAP

import { catalogue } from "@telos/locus/specs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SpecReportFile } from "@/lib/build-data";
import {
  BrowserReportView,
  BuildReportView,
  ComparisonView,
  GoldenView,
} from "@/playground/components/specs-results";
import {
  compareReports,
  runAllSpecs,
  type SpecsOutcome,
} from "@/playground/run-specs";
import { provenanceFor } from "@/playground/run-state";
import { useRun } from "@/playground/use-run";

// The input of scenario E. It has no input, so every run is made from the same empty text.
const NO_INPUT = "";

// START_CONTRACT: SpecsScenario
//   PURPOSE: Run the catalogue in the browser on an explicit press, and show the build-time report next to the run, with the comparison and the golden check.
//   INPUTS: { siteCommit: string - the commit the site was built from, buildReport: SpecReportFile | null - the build-time report or null }
//   OUTPUTS: { JSX.Element - a Run all action labelled with the catalogue size, the build-time report, and a results region with aria-live polite }
//   SIDE_EFFECTS: Runs the specifications in the browser on a Run all press only.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: SpecsScenario
/** Scenario E: the browser run of the catalogue, the build report and the golden check. */
export function SpecsScenario({
  siteCommit,
  buildReport,
}: {
  readonly siteCommit: string;
  readonly buildReport: SpecReportFile | null;
}) {
  const { state, start } = useRun<SpecsOutcome>(siteCommit, () =>
    runAllSpecs(),
  );
  const provenance = provenanceFor(state, NO_INPUT);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          data-action="run"
          disabled={state.status === "running"}
          onClick={() => start(NO_INPUT)}
        >
          {`Run all ${catalogue.length} specifications`}
        </Button>
      </div>
      <BuildReportView file={buildReport} specs={catalogue} />
      <div
        data-slot="results"
        aria-live="polite"
        className="flex flex-col gap-4"
      >
        {state.status === "idle" ? (
          <p>
            Press Run all to run the specifications in this browser, with the
            same runner the build uses.
          </p>
        ) : null}
        {state.status === "running" ? <p>Running…</p> : null}
        {state.status === "crashed" ? (
          <Alert variant="destructive">
            <AlertDescription>The run failed: {state.message}</AlertDescription>
          </Alert>
        ) : null}
        {state.status === "done" ? (
          <>
            <BrowserReportView
              report={state.result.report}
              specs={catalogue}
              provenance={provenance}
            />
            <ComparisonView
              differences={
                buildReport === null
                  ? []
                  : compareReports(state.result.report, buildReport.report)
              }
              buildAvailable={buildReport !== null}
              total={state.result.report.summary.total}
              provenance={provenance}
            />
            <GoldenView rows={state.result.goldens} provenance={provenance} />
          </>
        ) : null}
      </div>
    </div>
  );
}

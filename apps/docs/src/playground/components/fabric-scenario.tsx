// START_MODULE_CONTRACT
//   PURPOSE: Give one Fabric scenario its editor, its Validate and Reset actions and its results, with provenance that turns historical when the input changes (FR-019, FR-021, INV-013).
//   SCOPE: FabricScenarioConfig and FabricScenario. Out: the views (fabric-results.tsx), the run hook (use-run.ts) and the scenario registry (registry.ts).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FabricScenarioConfig - the example input and the result panels a Fabric scenario shows
//   FabricScenario - the editor, the actions and the results of one Fabric scenario
// END_MODULE_MAP

import type { FabricJson } from "@telos/locus";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Provenance } from "@/lib/provenance";
import {
  DecodeErrorView,
  RelationTableView,
  RevisionIdsView,
  ValidationReportView,
} from "@/playground/components/fabric-results";
import { JsonEditor } from "@/playground/components/json-editor";
import { type FabricOutcome, runFabric } from "@/playground/run-fabric";
import { isStale, provenanceFor } from "@/playground/run-state";
import { useRun } from "@/playground/use-run";

// START_CONTRACT: FabricScenarioConfig
//   PURPOSE: Name what a Fabric scenario starts from and which result panels it shows, in order.
//   INPUTS: none (type)
//   OUTPUTS: { FabricScenarioConfig - example: FabricJson, the starting input; panels: the panels to show, validation, revisions or relations }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: FabricScenarioConfig
export interface FabricScenarioConfig {
  readonly example: FabricJson;
  readonly panels: ReadonlyArray<"validation" | "revisions" | "relations">;
}

// START_CONTRACT: FabricScenario
//   PURPOSE: Let the reader edit a Fabric and run it on an explicit Validate press, and show the results with their provenance, marked historical once the input has changed.
//   INPUTS: { config: FabricScenarioConfig - the example and the panels, siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - the JSON editor, the Validate and Reset actions, and a results region with aria-live polite }
//   SIDE_EFFECTS: Runs the package on a Validate press only. Reset restores the example text and does not run.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: FabricScenario
/** One Fabric scenario: the editor, its actions and its results. */
export function FabricScenario({
  config,
  siteCommit,
}: {
  readonly config: FabricScenarioConfig;
  readonly siteCommit: string;
}) {
  const initial = JSON.stringify(config.example, null, 2);
  const [text, setText] = useState(initial);
  const { state, start } = useRun<FabricOutcome>(siteCommit, runFabric);

  return (
    <div className="flex flex-col gap-6">
      <JsonEditor
        id="fabric-input"
        label="Fabric JSON"
        value={text}
        onChange={setText}
      />
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          data-action="run"
          disabled={state.status === "running"}
          onClick={() => start(text)}
        >
          Validate
        </Button>
        <Button
          type="button"
          variant="outline"
          data-action="reset"
          onClick={() => setText(initial)}
        >
          Reset to example
        </Button>
      </div>
      <div
        data-slot="results"
        aria-live="polite"
        className="flex flex-col gap-4"
      >
        {state.status === "idle" ? (
          <p>Press Validate to run the package on this input.</p>
        ) : null}
        {state.status === "running" ? <p>Running…</p> : null}
        {state.status === "crashed" ? (
          <Alert variant="destructive">
            <AlertDescription>The run failed: {state.message}</AlertDescription>
          </Alert>
        ) : null}
        {state.status === "done" ? (
          <>
            {isStale(state, text) ? (
              <p>
                The input has changed since this run. These results are
                historical. Press Validate to run again.
              </p>
            ) : null}
            <Results
              outcome={state.result}
              provenance={provenanceFor(state, text)}
              panels={config.panels}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function Results({
  outcome,
  provenance,
  panels,
}: {
  readonly outcome: FabricOutcome;
  readonly provenance: Provenance | null;
  readonly panels: FabricScenarioConfig["panels"];
}) {
  if (outcome.kind === "decode-error") {
    return <DecodeErrorView issues={outcome.issues} provenance={provenance} />;
  }
  return (
    <>
      {panels.map((panel) => {
        if (panel === "validation") {
          return (
            <ValidationReportView
              key={panel}
              report={outcome.report}
              provenance={provenance}
            />
          );
        }
        if (panel === "revisions") {
          return (
            <RevisionIdsView
              key={panel}
              revisions={outcome.revisions}
              provenance={provenance}
            />
          );
        }
        return (
          <RelationTableView
            key={panel}
            rows={outcome.relations}
            provenance={provenance}
          />
        );
      })}
    </>
  );
}

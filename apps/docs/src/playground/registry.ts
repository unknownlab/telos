// START_MODULE_CONTRACT
//   PURPOSE: List the playground scenarios in letter order, with their text, their example input and the component that runs each one (FR-019).
//   SCOPE: ScenarioProps, Scenario, SCENARIOS, scenarioById, PLAYGROUND_SUMMARY and the scenario components ScenarioA to ScenarioE.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ScenarioProps - the props every scenario component receives
//   Scenario - one scenario: its id, letter, title, summary, description, example text and component
//   SCENARIOS - the scenarios in letter order
//   scenarioById - the scenario with an id, or undefined
//   PLAYGROUND_SUMMARY - the one sentence that introduces the playground on its index page
// END_MODULE_MAP

import { type ComponentType, createElement } from "react";
import { examples } from "@telos/locus-specs";
import type { SpecReportFile } from "@/lib/build-data";
import { FabricScenario } from "@/playground/components/fabric-scenario";
import { RevisionsScenario } from "@/playground/components/revisions-scenario";
import { SpecsScenario } from "@/playground/components/specs-scenario";

export interface ScenarioProps {
  readonly siteCommit: string;
  /** The build-time report (WP13), for scenario E. */
  readonly buildReport: SpecReportFile | null;
}

export interface Scenario {
  readonly id: string;
  readonly letter: string;
  readonly title: string;
  readonly summary: string;
  readonly description: ReadonlyArray<string>;
  readonly exampleText: string | null;
  readonly Component: ComponentType<ScenarioProps>;
}

// START_CONTRACT: PLAYGROUND_SUMMARY
//   PURPOSE: Introduce the playground on its index page, and say that nothing typed is executed and that every result says where and when it was produced (C-002, FR-021).
//   INPUTS: none (constant)
//   OUTPUTS: { string - the introduction, also the description of the index page }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PLAYGROUND_SUMMARY
export const PLAYGROUND_SUMMARY =
  "Each scenario runs the real @telos/locus package in your browser on JSON you can edit. Nothing you type is executed as code; every result says where and when it was produced.";

// START_CONTRACT: ScenarioA
//   PURPOSE: Run scenario A, which validates the valid example and shows the Revision id of each Locus.
//   INPUTS: { siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - a FabricScenario with examples.valid and the validation and revision panels }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioA
function ScenarioA({ siteCommit }: ScenarioProps) {
  return createElement(FabricScenario, {
    config: { example: examples.valid, panels: ["validation", "revisions"] },
    siteCommit,
  });
}

// START_CONTRACT: ScenarioB
//   PURPOSE: Run scenario B, which validates the invalid example and shows only the diagnostics, so that no result reads as a success.
//   INPUTS: { siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - a FabricScenario with examples.invalid and the validation panel only }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioB
function ScenarioB({ siteCommit }: ScenarioProps) {
  return createElement(FabricScenario, {
    config: { example: examples.invalid, panels: ["validation"] },
    siteCommit,
  });
}

// START_CONTRACT: ScenarioC
//   PURPOSE: Run scenario C, which validates the relations example and shows the report with the Relation table.
//   INPUTS: { siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - a FabricScenario with examples.relations and the validation and relation panels }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioC
function ScenarioC({ siteCommit }: ScenarioProps) {
  return createElement(FabricScenario, {
    config: {
      example: examples.relations,
      panels: ["validation", "relations"],
    },
    siteCommit,
  });
}

// START_CONTRACT: ScenarioD
//   PURPOSE: Run scenario D, which compares two Revisions of one Locus, shows the change set and appends them to a compare-and-set history.
//   INPUTS: { siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - a RevisionsScenario with the two editors, the Revision and change-set results and the history panel }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioD
function ScenarioD({ siteCommit }: ScenarioProps) {
  return createElement(RevisionsScenario, { siteCommit });
}

// START_CONTRACT: ScenarioE
//   PURPOSE: Run scenario E, which runs the catalogue in the browser and compares the results with the build report and the golden Revision ids.
//   INPUTS: { siteCommit: string - the commit the site was built from, buildReport: SpecReportFile | null - the build-time report }
//   OUTPUTS: { JSX.Element - a SpecsScenario with the build report, the Run all action and the results }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioE
function ScenarioE({ siteCommit, buildReport }: ScenarioProps) {
  return createElement(SpecsScenario, { siteCommit, buildReport });
}

// START_CONTRACT: SCENARIOS
//   PURPOSE: Give the scenarios in letter order, so that the index and the routes read one list.
//   INPUTS: none (constant)
//   OUTPUTS: { ReadonlyArray<Scenario> - scenarios A to E, each with its example text rendered as JSON, or null for E }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: SCENARIOS
export const SCENARIOS: ReadonlyArray<Scenario> = [
  {
    id: "a",
    letter: "A",
    title: "Define a Fabric",
    summary: "Validate a valid Fabric and see the Revision id of each Locus.",
    description: [
      "This Fabric has three Loci: a storefront that owns a checkout and a payment Locus. Validate it to see that it is valid and to see the Revision id of each Locus.",
      "Change the purpose of one Locus and validate again. Only that Locus gets a new Revision id.",
    ],
    exampleText: JSON.stringify(examples.valid, null, 2),
    Component: ScenarioA,
  },
  {
    id: "b",
    letter: "B",
    title: "Find what is invalid",
    summary:
      "See diagnostics for a Charter with a blank purpose and a duplicated responsibility.",
    description: [
      "The checkout Locus has a blank purpose and the same responsibility twice. Validate to see both diagnostics with their codes.",
      "Break the JSON, for example by deleting a closing bracket. Malformed input gives a decode error with its location, not diagnostics.",
    ],
    exampleText: JSON.stringify(examples.invalid, null, 2),
    Component: ScenarioB,
  },
  {
    id: "c",
    letter: "C",
    title: "Check Relations",
    summary: "See a missing Relation target and a cycle of refines Relations.",
    description: [
      "The storefront depends on a Locus that does not exist, and checkout and payment refine each other. Validate to see both diagnostics and the relation table with the cycle marked.",
    ],
    exampleText: JSON.stringify(examples.relations, null, 2),
    Component: ScenarioC,
  },
  {
    id: "d",
    letter: "D",
    title: "Revise a Locus",
    summary:
      "Compare two Revisions of one Locus, see the change set, and append them to a compare-and-set history.",
    description: [
      "Locus A and Locus B are two versions of the checkout Locus; B rewords one responsibility. Compute both Revisions to see their ids and the change set from A to B.",
      "Then append them to a history. Each append names the head it expects. If that is not the current head, the history refuses with a stale-baseline error instead of overwriting.",
      "Revisions are computed for any Locus that decodes, even one that is invalid. A Revision id does not mean that the Locus is valid.",
    ],
    exampleText: JSON.stringify(examples.history, null, 2),
    Component: ScenarioD,
  },
  {
    id: "e",
    letter: "E",
    title: "Run the specifications",
    summary:
      "Run all executable specifications in your browser and compare them with the build report.",
    description: [
      "The specifications are data. This page runs them with the same runner the build uses, in your browser, and shows the results next to the report recorded at build time.",
      "It also recomputes the Revision ids of the revision fixtures and checks them against the golden values the Bun tests use.",
    ],
    exampleText: null,
    Component: ScenarioE,
  },
];

// START_CONTRACT: scenarioById
//   PURPOSE: Find the scenario of a route parameter, so that an unknown route can be a not-found page.
//   INPUTS: { id: string - the route parameter, such as "a" }
//   OUTPUTS: { Scenario | undefined - the scenario with that id, or undefined }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: scenarioById
export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

// START_MODULE_CONTRACT
//   PURPOSE: List the playground scenarios on the index page, each with its letter, title and summary, so that a reader can choose one (FR-019).
//   SCOPE: PlaygroundIndex, a presentational component that takes the scenarios as props.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PlaygroundIndex - the playground index page with one link per scenario
// END_MODULE_MAP

import { PLAYGROUND_SUMMARY, type Scenario } from "@/playground/registry";

// START_CONTRACT: PlaygroundIndex
//   PURPOSE: Show what the playground is and link to each scenario in the given order.
//   INPUTS: { scenarios: ReadonlyArray<Scenario> - the scenarios in letter order }
//   OUTPUTS: { JSX.Element - a main element with data-page="playground", its h1, the summary and a list with one link per scenario to /playground/<id> }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PlaygroundIndex
/** The playground index: the summary and the list of scenarios. */
export function PlaygroundIndex({
  scenarios,
}: {
  readonly scenarios: ReadonlyArray<Scenario>;
}) {
  return (
    <main
      id="content"
      data-page="playground"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Playground</h1>
      <p>{PLAYGROUND_SUMMARY}</p>
      <ul className="flex flex-col gap-6">
        {scenarios.map((scenario) => (
          <li key={scenario.id} className="flex flex-col gap-1">
            <a
              href={`/playground/${scenario.id}`}
              className="text-lg font-semibold underline underline-offset-4"
            >
              {`Scenario ${scenario.letter}: ${scenario.title}`}
            </a>
            <p className="text-muted-foreground">{scenario.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

// START_MODULE_CONTRACT
//   PURPOSE: Give every playground scenario its page, with the description, a link back to the index, a no-JavaScript fallback that shows the example input, and the interactive part after hydration (FR-019, NFR-004).
//   SCOPE: ScenarioShell, a presentational component with one mount effect that switches from the fallback to the playground. Out: the scenarios themselves (registry.ts) and the views.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ScenarioShell - the page of one scenario: its text, the fallback before hydration and the playground after it
// END_MODULE_MAP

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ScenarioProps, Scenario } from "@/playground/registry";

// START_CONTRACT: ScenarioShell
//   PURPOSE: Show the scenario text on every page, the example input as read-only text until JavaScript runs, and then the playground, so that a page without JavaScript still shows what the scenario does.
//   INPUTS: { scenario: Scenario - the scenario, siteCommit: string - the commit the site was built from, buildReport: SpecReportFile | null - the build-time report }
//   OUTPUTS: { JSX.Element - a main element with data-page="playground-scenario" and data-scenario; before hydration a div data-slot="no-js" holding the notice and the example pre; after hydration a div data-slot="playground" with data-ready="true" holding the scenario }
//   SIDE_EFFECTS: One mount effect sets hydrated; it runs in the browser only, so the server and the first client render are the same.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ScenarioShell
/** The page of one playground scenario, with the no-JavaScript fallback before hydration. */
export function ScenarioShell({
  scenario,
  siteCommit,
  buildReport,
}: { readonly scenario: Scenario } & ScenarioProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <main
      id="content"
      data-page="playground-scenario"
      data-scenario={scenario.id}
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">
        {`Scenario ${scenario.letter}: ${scenario.title}`}
      </h1>
      <div className="flex flex-col gap-3">
        {scenario.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p>
        <a href="/playground" className="underline underline-offset-4">
          All scenarios
        </a>
      </p>
      {hydrated ? (
        <div
          data-slot="playground"
          data-ready="true"
          className="flex flex-col gap-6"
        >
          <scenario.Component
            siteCommit={siteCommit}
            buildReport={buildReport}
          />
        </div>
      ) : (
        <div data-slot="no-js" className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              The playground needs JavaScript. Without it you can read the
              example input below; the results appear only when the package runs
              in your browser.
            </AlertDescription>
          </Alert>
          {scenario.exampleText !== null ? (
            <>
              <h2 className="text-xl font-semibold">Example input</h2>
              <pre
                data-slot="example-input"
                tabIndex={0}
                className="overflow-x-auto rounded-md border p-4 font-mono text-sm whitespace-pre"
              >
                {scenario.exampleText}
              </pre>
            </>
          ) : null}
        </div>
      )}
    </main>
  );
}

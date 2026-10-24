// START_MODULE_CONTRACT
//   PURPOSE: Give the reader one playground page: pick or type a JSON Locus definition, press Run, and see what the real kernel makes of it in the browser (FR-026, NFR-001).
//   SCOPE: PlaygroundPage, the page with a no-JavaScript fallback before hydration, the example picker, the editor, Run and Reset, and the run state. Out: the decoding and checks (run.ts) and the result panel (playground-results.tsx).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND, V-M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PlaygroundPage - the playground page with its fallback, controls, run state and results
// END_MODULE_MAP

import { Effect } from "effect";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JsonEditor } from "@/playground/components/json-editor";
import {
  PlaygroundResults,
  type PlaygroundRun,
} from "@/playground/components/playground-results";
import { PLAYGROUND_EXAMPLES } from "@/playground/examples";
import { PLAYGROUND_INTRO } from "@/playground/registry";
import { runDefinition } from "@/playground/run";

const FIRST_EXAMPLE = PLAYGROUND_EXAMPLES[0];

// START_CONTRACT: PlaygroundPage
//   PURPOSE: Show the playground, so that a reader can run any example or typed definition with the real kernel, and so that a page without JavaScript still shows the minimal example input.
//   INPUTS: none (the examples are constants)
//   OUTPUTS: { JSX.Element - a main element with data-page="playground"; before hydration a div data-slot="no-js"; after hydration a div data-slot="playground" with data-ready="true", the controls and the results region }
//   SIDE_EFFECTS: One mount effect sets hydrated, in the browser only. Run calls runDefinition in the browser; nothing is stored or sent.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PlaygroundPage
export function PlaygroundPage() {
  const [hydrated, setHydrated] = useState(false);
  const [exampleName, setExampleName] = useState(
    FIRST_EXAMPLE?.name ?? "minimal",
  );
  const [text, setText] = useState(FIRST_EXAMPLE?.json ?? "");
  const [run, setRun] = useState<PlaygroundRun | null>(null);
  const [running, setRunning] = useState(false);
  const [crash, setCrash] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const example = PLAYGROUND_EXAMPLES.find((item) => item.name === exampleName);

  const onExample = (name: string) => {
    const chosen = PLAYGROUND_EXAMPLES.find((item) => item.name === name);
    if (chosen === undefined) return;
    setExampleName(chosen.name);
    setText(chosen.json);
  };

  const onRun = () => {
    const snapshot = text;
    setRunning(true);
    setCrash(null);
    Effect.runPromise(runDefinition(snapshot))
      .then((result) => {
        setRun({
          text: snapshot,
          result,
          ranAt: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        setCrash(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setRunning(false);
      });
  };

  return (
    <main
      id="content"
      data-page="playground"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Playground</h1>
      <p>{PLAYGROUND_INTRO}</p>
      {hydrated ? (
        <div
          data-slot="playground"
          data-ready="true"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="playground-example" className="text-sm font-medium">
              Example
            </label>
            <select
              id="playground-example"
              data-action="example"
              className="max-w-md rounded-md border bg-background p-2 text-sm"
              value={exampleName}
              onChange={(event) => onExample(event.currentTarget.value)}
            >
              {PLAYGROUND_EXAMPLES.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <JsonEditor
            id="playground-input"
            label="Locus JSON"
            value={text}
            onChange={setText}
          />
          <div className="flex flex-wrap gap-3">
            <Button data-action="run" disabled={running} onClick={onRun}>
              Run
            </Button>
            <Button
              variant="outline"
              data-action="reset"
              onClick={() => {
                if (example !== undefined) setText(example.json);
              }}
            >
              Reset to example
            </Button>
          </div>
          <div
            data-slot="results"
            aria-live="polite"
            className="flex flex-col gap-6"
          >
            {running ? <p>Running…</p> : null}
            {crash !== null ? (
              <Alert variant="destructive">
                <AlertDescription>{`The run failed: ${crash}`}</AlertDescription>
              </Alert>
            ) : null}
            {!running && crash === null && run === null ? (
              <p>
                Press Run to decode, build and verify this definition in your
                browser.
              </p>
            ) : null}
            {run !== null ? (
              <PlaygroundResults run={run} currentText={text} />
            ) : null}
          </div>
        </div>
      ) : (
        <div data-slot="no-js" className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              The playground needs JavaScript. Without it you can read the
              example input below; the results appear only when the kernel runs
              in your browser.
            </AlertDescription>
          </Alert>
          <pre
            data-slot="example-input"
            tabIndex={0}
            className="overflow-x-auto rounded-md border p-4 font-mono text-sm whitespace-pre"
          >
            {PLAYGROUND_EXAMPLES[0]?.json ?? ""}
          </pre>
        </div>
      )}
    </main>
  );
}

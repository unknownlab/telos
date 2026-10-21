// START_MODULE_CONTRACT
//   PURPOSE: Give scenario D its two Locus editors, its Compute and Reset actions, its Revision and change-set results and its history panel, so that the reader sees the Revision ids, the change set and the compare-and-set outcome of each append (FR-019, FR-021, INV-013).
//   SCOPE: RevisionsScenario and HistoryPanel. Out: the Revision step (run-revisions.ts), the views (revision-results.tsx), the editor (json-editor.tsx) and the run state (run-state.ts). The history is replayed on each append, never kept in a long-lived runtime.
//   DEPENDS: M-DOCS-PLAYGROUND, M-DOCS-SITE, M-LOCUS-REVISION, M-LOCUS-HISTORY
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RevisionsScenario - the two editors, the actions, the Revision and change-set results and the history panel of scenario D
// END_MODULE_MAP

import type { Revision, RevisionId } from "@telos/locus";
import { examples } from "@telos/locus-specs";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResultPanel } from "@/components/result-panel";
import {
  type BrowserProvenance,
  browserProvenance,
  toHistorical,
} from "@/lib/provenance";
import {
  ChangeSetView,
  SideView,
} from "@/playground/components/revision-results";
import { JsonEditor } from "@/playground/components/json-editor";
import {
  type AppendStep,
  type HistoryReplay,
  isRevisionId,
  replayHistory,
  type RevisionsOutcome,
  revisionsKey,
  runRevisions,
} from "@/playground/run-revisions";
import { isStale, provenanceFor } from "@/playground/run-state";
import { useRun } from "@/playground/use-run";

// START_CONTRACT: RevisionsScenario
//   PURPOSE: Let the reader edit two Locus texts and compute their Revisions and change set on an explicit press, and append them to a history whose expected head the reader sets.
//   INPUTS: { siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - the two editors, the Compute and Reset actions, a results region with aria-live polite and, when the run is done, the history panel }
//   SIDE_EFFECTS: Runs the package on a Compute press only. Reset restores both example texts and does not run. Each history append replays the steps.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: RevisionsScenario
/** Scenario D: two Locus editors, the Revision and change-set results, and the history. */
export function RevisionsScenario({
  siteCommit,
}: {
  readonly siteCommit: string;
}) {
  const initialA = JSON.stringify(examples.history.a, null, 2);
  const initialB = JSON.stringify(examples.history.b, null, 2);
  const [textA, setTextA] = useState(initialA);
  const [textB, setTextB] = useState(initialB);
  const [runNumber, setRunNumber] = useState(0);
  const { state, start } = useRun<RevisionsOutcome>(
    siteCommit,
    (key: string) => {
      // The key is made by revisionsKey from our own state, never typed by the reader.
      const [a, b] = JSON.parse(key) as [string, string];
      return runRevisions(a, b);
    },
  );

  const currentKey = revisionsKey(textA, textB);
  const provenance = provenanceFor(state, currentKey);
  const stale = isStale(state, currentKey);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div data-side="a">
          <JsonEditor
            id="locus-a-input"
            label="Locus A"
            value={textA}
            onChange={setTextA}
          />
        </div>
        <div data-side="b">
          <JsonEditor
            id="locus-b-input"
            label="Locus B"
            value={textB}
            onChange={setTextB}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          data-action="run"
          disabled={state.status === "running"}
          onClick={() => {
            setRunNumber((n) => n + 1);
            start(currentKey);
          }}
        >
          Compute Revisions
        </Button>
        <Button
          type="button"
          variant="outline"
          data-action="reset"
          onClick={() => {
            setTextA(initialA);
            setTextB(initialB);
          }}
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
          <p>
            Press Compute Revisions to decode both Loci and compute their
            Revision ids in this browser.
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
            {stale ? (
              <p>
                The input has changed since this run. These results are
                historical. Press Compute Revisions to run again.
              </p>
            ) : null}
            <SideView
              side="a"
              outcome={state.result.a}
              provenance={provenance}
            />
            <SideView
              side="b"
              outcome={state.result.b}
              provenance={provenance}
            />
            <ChangeSetView diff={state.result.diff} provenance={provenance} />
            <HistoryPanel
              key={runNumber}
              a={"revision" in state.result.a ? state.result.a.revision : null}
              b={"revision" in state.result.b ? state.result.b.revision : null}
              stale={stale}
              siteCommit={siteCommit}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

// A step of the log, with the side it appended from.
interface LabelledStep extends AppendStep {
  readonly side: "a" | "b";
}

// The steps and the replay that the panel shows, with the browser provenance of the replay.
interface HistoryView {
  readonly steps: ReadonlyArray<LabelledStep>;
  readonly replay: HistoryReplay;
  readonly provenance: BrowserProvenance;
}

// START_CONTRACT: HistoryPanel
//   PURPOSE: Append the Revisions of the current run to a history one step at a time, with the expected head the reader sets, and show every outcome, so that a stale baseline is refused and the history is left unchanged.
//   INPUTS: { a: Revision | null - the Revision of A, b: Revision | null - the Revision of B, stale: boolean - whether the run's input has changed, siteCommit: string - the commit the site was built from }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind history-state with the expected head field, the append, head and reset actions, the append log and the head and entries of each Locus }
//   SIDE_EFFECTS: Each append replays the steps against a fresh history and reads the clock once for its provenance. Nothing runs on an edit of the expected head.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: HistoryPanel
/** The history of one run: the appends, their outcomes, and the head of each Locus. */
function HistoryPanel({
  a,
  b,
  stale,
  siteCommit,
}: {
  readonly a: Revision | null;
  readonly b: Revision | null;
  readonly stale: boolean;
  readonly siteCommit: string;
}) {
  const [view, setView] = useState<HistoryView | null>(null);
  const [expectedText, setExpectedText] = useState("");
  // The steps asked for so far, kept in a ref so that a second press before the first replay ends is not lost.
  const pending = useRef<ReadonlyArray<LabelledStep>>([]);

  const trimmed = expectedText.trim();
  const expectedInvalid = trimmed !== "" && !isRevisionId(trimmed);
  const primaryLocus = (a ?? b)?.locus;
  const currentHead =
    view?.replay.loci.find((locus) => locus.locus === primaryLocus)?.head ??
    null;

  function append(side: "a" | "b") {
    const revision = side === "a" ? a : b;
    if (revision === null || stale || expectedInvalid) return;
    const expectedHead = trimmed === "" ? null : (trimmed as RevisionId);
    const next: ReadonlyArray<LabelledStep> = [
      ...pending.current,
      { side, revision, expectedHead },
    ];
    pending.current = next;
    void replayHistory(next).then((replay) => {
      // A newer press or a reset has superseded this replay; its result is not shown.
      if (pending.current !== next) return;
      setView({
        steps: next,
        replay,
        provenance: browserProvenance(new Date(), siteCommit),
      });
    });
  }

  function reset() {
    pending.current = [];
    setView(null);
  }

  const provenance =
    view === null
      ? null
      : stale
        ? toHistorical(view.provenance)
        : view.provenance;
  const expecting = (step: AppendStep) => step.expectedHead ?? "none";

  return (
    <ResultPanel kind="history-state" provenance={provenance} title="History">
      <h2 className="text-lg font-semibold">History</h2>
      <p>
        The history starts empty for each Compute. Each append names the head it
        expects. When that is not the current head, the history refuses the
        append and does not change.
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="expected-head" className="text-sm font-medium">
          Expected head
        </label>
        <p id="expected-head-hint" className="text-sm text-muted-foreground">
          {expectedInvalid
            ? "Expected head must be empty or a sha256: id."
            : "Leave empty for no head."}
        </p>
        <Input
          id="expected-head"
          data-slot="expected-head"
          className="font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
          aria-describedby="expected-head-hint"
          aria-invalid={expectedInvalid || undefined}
          value={expectedText}
          onChange={(event) => setExpectedText(event.currentTarget.value)}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          data-action="use-head"
          disabled={primaryLocus === undefined}
          onClick={() => setExpectedText(currentHead ?? "")}
        >
          Use current head
        </Button>
        <Button
          type="button"
          data-action="append-a"
          disabled={a === null || stale}
          onClick={() => append("a")}
        >
          Append A
        </Button>
        <Button
          type="button"
          data-action="append-b"
          disabled={b === null || stale}
          onClick={() => append("b")}
        >
          Append B
        </Button>
        <Button
          type="button"
          variant="outline"
          data-action="reset-history"
          onClick={reset}
        >
          Reset history
        </Button>
      </div>
      {stale ? <p>Compute again to append the edited input.</p> : null}
      {view === null ? (
        <p>The history is empty. Append A or B to start it.</p>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {view.steps.map((step, index) => {
              const outcome = view.replay.outcomes[index];
              if (outcome === undefined) return null;
              const prefix = `Append ${step.side === "a" ? "A" : "B"} expecting ${expecting(step)}`;
              const text =
                outcome.outcome === "appended"
                  ? `${prefix}: appended. Head is now ${outcome.head}.`
                  : outcome.outcome === "no-op"
                    ? `${prefix}: no change, it is already the head.`
                    : `${prefix}: refused, stale baseline. Expected ${outcome.expected ?? "none"}, the head is ${outcome.actual ?? "none"}.`;
              return (
                <li
                  key={`${index}-${step.side}`}
                  data-history-step={index}
                  data-history-outcome={outcome.outcome}
                >
                  {text}
                </li>
              );
            })}
          </ol>
          {view.replay.loci.map((locus) => (
            <div key={locus.locus} className="flex flex-col gap-2">
              <p>
                <code>{locus.locus}</code>
              </p>
              <p>
                Head:{" "}
                <code data-history-head={locus.head ?? "none"}>
                  {locus.head ?? "none"}
                </code>
              </p>
              <ol className="flex flex-col gap-1">
                {locus.entries.map((id, index) => (
                  <li key={`${id}-${index}`} data-history-entry={id}>
                    <code className="break-all">{id}</code>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </>
      )}
    </ResultPanel>
  );
}

// START_MODULE_CONTRACT
//   PURPOSE: Hold the state of one playground run, and derive from it, never store, whether the run's result is current or historical (FR-021, INV-013).
//   SCOPE: RunState, IDLE, running, done, crashed, provenanceFor and isStale. Pure TypeScript: no React and no DOM, so the model is tested under Bun.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RunState - idle, running, done with its result and provenance, or crashed with its message
//   IDLE - the state before any run
//   running - the state while the input is being run
//   done - the state of a finished run
//   crashed - the state of a run that threw an unexpected error
//   provenanceFor - the provenance of a done run for the current input, or its historical form
//   isStale - true when a done run was made from an input that is no longer the current input
// END_MODULE_MAP

import type { BrowserProvenance, HistoricalProvenance } from "@/lib/provenance";
import { toHistorical } from "@/lib/provenance";

export type RunState<T> =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly input: string }
  | {
      readonly status: "done";
      readonly input: string;
      readonly result: T;
      readonly provenance: BrowserProvenance;
    }
  | {
      readonly status: "crashed";
      readonly input: string;
      readonly message: string;
    };

// START_CONTRACT: IDLE
//   PURPOSE: Name the state before any run, so that a page without a run shows no result.
//   INPUTS: none (constant)
//   OUTPUTS: { RunState<never> - the idle state }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: IDLE
/** The state before any run. */
export const IDLE: RunState<never> = { status: "idle" };

// START_CONTRACT: running
//   PURPOSE: Name the state of a run in progress for one input.
//   INPUTS: { input: string - the text being run }
//   OUTPUTS: { RunState<never> - the running state for input }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: running
/** The state while an input is being run. */
export function running(input: string): RunState<never> {
  return { status: "running", input };
}

// START_CONTRACT: done
//   PURPOSE: Record a finished run with the input it ran on, its result and the browser provenance of the run.
//   INPUTS: { input: string - the text that was run, result: T - the package result, provenance: BrowserProvenance - where and when it ran }
//   OUTPUTS: { RunState<T> - the done state holding these values }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: done
/** The state of a finished run. */
export function done<T>(
  input: string,
  result: T,
  provenance: BrowserProvenance,
): RunState<T> {
  return { status: "done", input, result, provenance };
}

// START_CONTRACT: crashed
//   PURPOSE: Record an unexpected throw of a run. Package errors are results, so only a throw that is not a result comes here.
//   INPUTS: { input: string - the text that was run, error: unknown - the thrown value }
//   OUTPUTS: { RunState<never> - the crashed state, whose message is the Error message or the string form of the value }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: crashed
/** The state of a run that threw. */
export function crashed(input: string, error: unknown): RunState<never> {
  const message = error instanceof Error ? error.message : String(error);
  return { status: "crashed", input, message };
}

// START_CONTRACT: provenanceFor
//   PURPOSE: Give the provenance that a result carries for the current input: its browser provenance while the input is unchanged, its historical form once it differs (INV-013).
//   INPUTS: { state: RunState<T> - the run, currentInput: string - the text now in the editor }
//   OUTPUTS: { BrowserProvenance | HistoricalProvenance | null - null unless the run is done }
//   SIDE_EFFECTS: none. The result is derived on every call and never stored.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: provenanceFor
/** The provenance of a done run for the current input, or null when there is no result. */
export function provenanceFor<T>(
  state: RunState<T>,
  currentInput: string,
): BrowserProvenance | HistoricalProvenance | null {
  if (state.status !== "done") return null;
  return state.input === currentInput
    ? state.provenance
    : toHistorical(state.provenance);
}

// START_CONTRACT: isStale
//   PURPOSE: Tell whether a result was made from an input that the editor no longer holds, so that the page can say it is historical.
//   INPUTS: { state: RunState<T> - the run, currentInput: string - the text now in the editor }
//   OUTPUTS: { boolean - true only for a done run whose input differs from currentInput }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: isStale
/** True only for a finished run whose input has since changed. */
export function isStale<T>(state: RunState<T>, currentInput: string): boolean {
  return state.status === "done" && state.input !== currentInput;
}

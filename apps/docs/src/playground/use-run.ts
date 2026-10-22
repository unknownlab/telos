// START_MODULE_CONTRACT
//   PURPOSE: Run one playground input on an explicit press and keep its state, so that computation never runs on a keystroke and every result carries the instant and commit of its run (FR-021).
//   SCOPE: useRun, a React hook that owns the RunState of one scenario. Out: the run model (run-state.ts) and the package call (run-fabric.ts).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   useRun - the state of a scenario's run, and start, which runs an input once
// END_MODULE_MAP

import { useCallback, useEffect, useRef, useState } from "react";
import { browserProvenance } from "@/lib/provenance";
import {
  crashed,
  done,
  IDLE,
  type RunState,
  running,
} from "@/playground/run-state";

// START_CONTRACT: useRun
//   PURPOSE: Hold the run state of a scenario, and run an input when start is called, ignoring a second start while a run is in progress.
//   INPUTS: { siteCommit: string - the commit the site was built from, run: (input: string) => Promise<T> - the run of one input }
//   OUTPUTS: { { state: RunState<T> - the current run, start: (input: string) => void - runs the input; the browser provenance is taken when the run completes } }
//   SIDE_EFFECTS: Calls run when start is called. State updates stop after the component unmounts. The clock is read only when a run completes, never during render.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: useRun
/** The run state of a scenario and the start action that runs an input once per press. */
export function useRun<T>(
  siteCommit: string,
  run: (input: string) => Promise<T>,
): { readonly state: RunState<T>; readonly start: (input: string) => void } {
  const [state, setState] = useState<RunState<T>>(IDLE);
  const busy = useRef(false);
  const mounted = useRef(false);
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const start = useCallback(
    (input: string) => {
      if (busy.current) return;
      busy.current = true;
      setState(running(input));
      runRef
        .current(input)
        .then(
          (result) => {
            if (!mounted.current) return;
            setState(
              done(input, result, browserProvenance(new Date(), siteCommit)),
            );
          },
          (error: unknown) => {
            if (!mounted.current) return;
            setState(crashed(input, error));
          },
        )
        .finally(() => {
          busy.current = false;
        });
    },
    [siteCommit],
  );

  return { state, start };
}

// START_MODULE_CONTRACT
//   PURPOSE: Run a CLI Locus from a Bun process by writing the result of one command line to the process streams and setting the exit code.
//   SCOPE: runMain, the only module of the CLI Pack that touches process. Out: the in-memory run (run.ts) and the browser-safe main entry, which never exports this module.
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   runMain - runs one command line of a CLI Locus and writes its output to the process
// END_MODULE_MAP

import { Effect } from "effect";
import type { SemanticModel } from "@telos/kernel";
import { runCli } from "./run";

// START_CONTRACT: runMain
//   PURPOSE: Run a command line of the process arguments, write stdout and stderr and set process.exitCode.
//   INPUTS: { model: SemanticModel - the model; cliLocusId: string - the CLI Locus; options: { version?: string; argv?: ReadonlyArray<string> - defaults to process.argv.slice(2) } }
//   OUTPUTS: { Promise<void> - resolves after the streams are written and the exit code is set }
//   SIDE_EFFECTS: writes to process.stdout and process.stderr and sets process.exitCode
//   LINKS: M-PACK-CLI
// END_CONTRACT: runMain
export const runMain = async (
  model: SemanticModel,
  cliLocusId: string,
  options: {
    readonly version?: string;
    readonly argv?: ReadonlyArray<string>;
  } = {},
): Promise<void> => {
  const argv = options.argv ?? process.argv.slice(2);
  const result = await Effect.runPromise(
    runCli(model, cliLocusId, argv, {
      ...(options.version === undefined ? {} : { version: options.version }),
    }),
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
};

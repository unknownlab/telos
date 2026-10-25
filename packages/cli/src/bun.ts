import { Effect } from "effect";
import type { SemanticModel } from "@telos/kernel";
import { runCli } from "./run";

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

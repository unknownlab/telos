// START_MODULE_CONTRACT
//   PURPOSE: Run one command line of a CLI Locus through kernel invoke and report its stdout, stderr and exit code without a real process.
//   SCOPE: CliResult, EXIT_CODE and runCli, which build the effect/cli program from the derived commands and capture its output. Out: the process entry (bun.ts), derivation (derive.ts) and the Archetype (archetype.ts).
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CliResult - the outcome of one command line: exit code, stdout and stderr
//   EXIT_CODE - the exit code of a kernel invocation error
//   runCli - runs one command line of a CLI Locus and returns its result
// END_MODULE_MAP

import { Effect, Exit, Option } from "effect";
import { Command, Flag } from "effect/cli";
import {
  coerceInput,
  invoke,
  type InvocationError,
  type SemanticModel,
} from "@telos/kernel";
import { CLI_EXTENSION_ID, deriveCommands } from "./derive";
import { memoryEnvironment, type Captured } from "./environment";

const DEFAULT_VERSION = "0.0.0";

// START_CONTRACT: CliResult
//   PURPOSE: Carry the outcome of one command line.
//   INPUTS: { exitCode: 0 | 1 | 2 - the exit code; stdout: string - the captured stdout; stderr: string - the captured stderr }
//   OUTPUTS: { CliResult - the outcome record }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: CliResult
export interface CliResult {
  readonly exitCode: 0 | 1 | 2;
  readonly stdout: string;
  readonly stderr: string;
}

// START_CONTRACT: EXIT_CODE
//   PURPOSE: Map a kernel invocation error to the exit code of the command line.
//   INPUTS: { error: InvocationError - the error of a failed invocation }
//   OUTPUTS: { 1 | 2 - 2 for usage and input problems, 1 for declared errors, defects and invalid output }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: EXIT_CODE
export const EXIT_CODE = (error: InvocationError): 1 | 2 => {
  switch (error.tag) {
    case "InvalidInput":
    case "NotGranted":
    case "NotImplemented":
    case "LocusNotFound":
    case "CapabilityNotFound":
    case "UsageError":
      return 2;
    default:
      return 1;
  }
};

// START_CONTRACT: runCli
//   PURPOSE: Run one command line of a CLI Locus in memory: derive the commands, invoke the chosen capability through the CLI Locus and write one JSON line.
//   INPUTS: { model: SemanticModel - the model; cliLocusId: string - the CLI Locus; argv: ReadonlyArray<string> - the arguments; options: { version?: string - the program version, default "0.0.0" } }
//   OUTPUTS: { Effect<CliResult> - the captured stdout, stderr and exit code; never fails }
//   SIDE_EFFECTS: none; output is captured in memory, never written to a real stream
//   LINKS: M-PACK-CLI
// END_CONTRACT: runCli
export const runCli = (
  model: SemanticModel,
  cliLocusId: string,
  argv: ReadonlyArray<string>,
  options: { readonly version?: string } = {},
): Effect.Effect<CliResult> =>
  Effect.gen(function* () {
    const locus = model.loci.get(cliLocusId);
    if (
      locus === undefined ||
      !locus.definition.kind.extensions.some((e) => e.id === CLI_EXTENSION_ID)
    ) {
      const error: InvocationError = {
        tag: "LocusNotFound",
        message: `No CLI Locus ${cliLocusId} in the model.`,
        issues: [],
      };
      return {
        exitCode: 2,
        stdout: "",
        stderr: `${JSON.stringify(error)}\n`,
      } satisfies CliResult;
    }

    const program = String(locus.definition.properties["program"]);
    const commands = yield* deriveCommands(model, cliLocusId);
    const captured: Captured = { stdout: [], stderr: [] };
    let exitCode: 0 | 1 | 2 = 0;
    let wrote = false;

    const subcommands = commands.map((command) => {
      const flags: Record<string, Flag.Flag<Option.Option<string>>> = {};
      for (const field of command.fields)
        flags[field.name] = Flag.String(field.name).pipe(Flag.optional);
      return Command.make(command.name, flags, (values) =>
        Effect.gen(function* () {
          const raw: Record<string, string | undefined> = {};
          for (const [key, value] of Object.entries(
            values as Record<string, Option.Option<string>>,
          ))
            raw[key] = Option.getOrUndefined(value);
          const outcome = yield* invoke(
            model,
            command.ref,
            coerceInput(command.fields, raw),
            { via: cliLocusId },
          );
          wrote = true;
          if (outcome.ok) {
            captured.stdout.push(`${JSON.stringify(outcome.output)}\n`);
            exitCode = 0;
          } else {
            captured.stderr.push(`${JSON.stringify(outcome.error)}\n`);
            exitCode = EXIT_CODE(outcome.error);
          }
        }),
      );
    });

    const root = Command.make(program).pipe(
      Command.withSubcommands(subcommands),
    );
    const exit = yield* Effect.exit(
      Command.runWith(root, {
        version: options.version ?? DEFAULT_VERSION,
      })(argv).pipe(Effect.provide(memoryEnvironment(argv, captured))),
    );
    if (Exit.isFailure(exit) && !wrote) {
      const error: InvocationError = {
        tag: "UsageError",
        message: `Invalid command line: ${argv.join(" ")}.`,
        issues: [],
      };
      exitCode = 2;
      captured.stderr.push(`${JSON.stringify(error)}\n`);
    }

    return {
      exitCode,
      stdout: captured.stdout.join(""),
      stderr: captured.stderr.join(""),
    } satisfies CliResult;
  });

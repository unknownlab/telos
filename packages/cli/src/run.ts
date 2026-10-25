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

export interface CliResult {
  readonly exitCode: 0 | 1 | 2;
  readonly stdout: string;
  readonly stderr: string;
}

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

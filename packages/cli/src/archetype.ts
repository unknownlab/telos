// START_MODULE_CONTRACT
//   PURPOSE: Define the CliInterface Archetype whose four rules check that a command-line interface Locus exposes derivable, unique commands that reject invalid input.
//   SCOPE: The CliInterface value and its four rules with their exact violation messages. Out: the relation type and Extension values (semantics.ts), derivation (derive.ts) and running commands (run.ts).
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CliInterface - the archetype of command-line interface Loci with its four rules
// END_MODULE_MAP

import { Effect } from "effect";
import {
  Archetype,
  Rule,
  describeCapability,
  inputFields,
  outgoing,
  violation,
} from "@telos/kernel";
import { CLI_COMMAND_TYPE, CLI_EXTENSION_ID, deriveCommands } from "./derive";
import { runCli } from "./run";

// START_CONTRACT: CliInterface
//   PURPOSE: Check the commands of a command-line interface Locus: at least one, unique names, derivable flags, and exit 2 with InvalidInput for missing required input.
//   INPUTS: none
//   OUTPUTS: { Archetype - id "telos.cli.interface" applying to telos.cli with four rules }
//   SIDE_EFFECTS: none; the execution rule runs the CLI in memory
//   LINKS: M-PACK-CLI
// END_CONTRACT: CliInterface
export const CliInterface = Archetype.make({
  id: "telos.cli.interface",
  description:
    "Checks that a command-line interface Locus exposes derivable, unique commands that reject invalid input.",
  appliesTo: [CLI_EXTENSION_ID],
  rules: [
    Rule.make({
      id: "cli.commands-exist",
      description: "The interface exposes at least one command.",
      method: "static",
      check: (ctx) =>
        Effect.gen(function* () {
          const commands = outgoing(ctx.model, ctx.locus.id).filter(
            (relation) =>
              relation.valid && relation.type.id === CLI_COMMAND_TYPE,
          );
          if (commands.length === 0)
            return yield* violation(
              `CLI Locus ${ctx.locus.id} exposes no command.`,
            );
        }),
    }),
    Rule.make({
      id: "cli.unique-commands",
      description: "No two exposed capabilities share a command name.",
      method: "static",
      check: (ctx) =>
        Effect.gen(function* () {
          const names = new Set<string>();
          for (const relation of outgoing(ctx.model, ctx.locus.id)) {
            if (
              !relation.valid ||
              relation.type.id !== CLI_COMMAND_TYPE ||
              relation.target.capability === null
            )
              continue;
            const name = relation.target.capability;
            if (names.has(name))
              return yield* violation(
                `Command ${name} is exposed more than once.`,
              );
            names.add(name);
          }
        }),
    }),
    Rule.make({
      id: "cli.flags-derivable",
      description:
        "Every exposed capability has input flags that can be derived.",
      method: "static",
      check: (ctx) =>
        Effect.gen(function* () {
          for (const relation of outgoing(ctx.model, ctx.locus.id)) {
            if (
              !relation.valid ||
              relation.type.id !== CLI_COMMAND_TYPE ||
              relation.target.capability === null
            )
              continue;
            const { locus, capability } = relation.target;
            const description = yield* describeCapability(
              ctx.model,
              locus,
              capability,
            );
            const ref = `${locus}#${capability}`;
            const fields = inputFields(description);
            const unsupported = fields.find(
              (field) => field.type === "unsupported",
            );
            if (unsupported !== undefined)
              return yield* violation(
                `Capability ${ref} has an unsupported field ${unsupported.name}.`,
              );
            if (
              fields.length === 0 &&
              !isEmptyObjectSchema(description.input.schema)
            )
              return yield* violation(
                `Capability ${ref} has no derivable flags.`,
              );
          }
        }),
    }),
    Rule.make({
      id: "cli.invalid-input-exit",
      description:
        "Every command with a required field exits with code 2 and InvalidInput when the input is missing.",
      method: "execution",
      check: (ctx) =>
        Effect.gen(function* () {
          const commands = yield* deriveCommands(ctx.model, ctx.locus.id);
          for (const command of commands) {
            if (!command.fields.some((field) => field.required)) continue;
            const result = yield* runCli(ctx.model, ctx.locus.id, [
              command.name,
            ]);
            if (!rejectsMissingInput(result.exitCode, result.stderr))
              return yield* violation(
                `Command ${command.name} does not exit with code 2 and InvalidInput for missing input.`,
              );
          }
        }),
    }),
  ],
});

// True when a schema is an object schema with no properties, so a command with no flags is still derivable.
function isEmptyObjectSchema(schema: unknown): boolean {
  if (typeof schema !== "object" || schema === null) return false;
  const record = schema as Record<string, unknown>;
  if (record["type"] !== "object") return false;
  const properties = record["properties"];
  return (
    properties === undefined ||
    (typeof properties === "object" &&
      properties !== null &&
      Object.keys(properties).length === 0)
  );
}

// True when the run exited 2 and its stderr is one JSON line whose tag is InvalidInput.
function rejectsMissingInput(exitCode: number, stderr: string): boolean {
  if (exitCode !== 2) return false;
  try {
    const parsed = JSON.parse(stderr) as { readonly tag?: unknown };
    return parsed.tag === "InvalidInput";
  } catch {
    return false;
  }
}

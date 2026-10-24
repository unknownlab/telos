// START_MODULE_CONTRACT
//   PURPOSE: Derive the command-line commands that a CLI Locus exposes, one per exposed capability, sorted and de-duplicated by name, and hold the identities that the CLI Pack shares.
//   SCOPE: CLI_EXTENSION_ID, CLI_COMMAND_TYPE, DerivedCommand and deriveCommands. Out: building the effect/cli program (run.ts), the Archetype rules (archetype.ts) and the Extension and relation type values (semantics.ts).
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CLI_EXTENSION_ID - the extension id that marks a Locus as a command-line interface
//   CLI_COMMAND_TYPE - the relation type id of a command exposed by a CLI Locus
//   DerivedCommand - one command derived from one exposed capability
//   deriveCommands - the commands a CLI Locus exposes, sorted by name and first per name
// END_MODULE_MAP

import { Effect } from "effect";
import {
  CapabilityRef,
  describeCapability,
  inputFields,
  outgoing,
  type CapabilityDescription,
  type InputField,
  type SemanticModel,
} from "@telos/kernel";

// START_CONTRACT: CLI_EXTENSION_ID
//   PURPOSE: Name the extension that marks a Locus as a command-line interface; the single source of this id for the CLI Pack.
//   INPUTS: none
//   OUTPUTS: { "telos.cli" - the extension id, kept as a literal type }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: CLI_EXTENSION_ID
export const CLI_EXTENSION_ID = "telos.cli";

// START_CONTRACT: CLI_COMMAND_TYPE
//   PURPOSE: Name the relation type that exposes a capability as a command.
//   INPUTS: none
//   OUTPUTS: { string - the relation type id "cli.command" }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: CLI_COMMAND_TYPE
export const CLI_COMMAND_TYPE = "cli.command";

// START_CONTRACT: DerivedCommand
//   PURPOSE: Describe one command with its name, capability reference, description and input fields.
//   INPUTS: { name: string - the capability name; ref: CapabilityRef - the capability; description: string; fields: ReadonlyArray<InputField> }
//   OUTPUTS: { DerivedCommand - the command record }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: DerivedCommand
export interface DerivedCommand {
  readonly name: string;
  readonly ref: CapabilityRef;
  readonly description: string;
  readonly fields: ReadonlyArray<InputField>;
}

// Orders strings by UTF-16 code unit, never by locale.
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// START_CONTRACT: deriveCommands
//   PURPOSE: List the commands of a CLI Locus: one per valid cli.command relation, sorted by capability name then Locus id, first per name.
//   INPUTS: { model: SemanticModel - the model; cliLocusId: string - the id of the CLI Locus }
//   OUTPUTS: { Effect<ReadonlyArray<DerivedCommand>> - the commands; empty for an unknown id or a Locus without the telos.cli extension }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: deriveCommands
export const deriveCommands = (
  model: SemanticModel,
  cliLocusId: string,
): Effect.Effect<ReadonlyArray<DerivedCommand>> =>
  Effect.gen(function* () {
    const locus = model.loci.get(cliLocusId);
    if (
      locus === undefined ||
      !locus.definition.kind.extensions.some((e) => e.id === CLI_EXTENSION_ID)
    )
      return [];
    const exposed = outgoing(model, cliLocusId)
      .filter(
        (relation) =>
          relation.valid &&
          relation.type.id === CLI_COMMAND_TYPE &&
          relation.target.capability !== null,
      )
      .map((relation) => ({
        locus: relation.target.locus,
        capability: relation.target.capability as string,
      }))
      .sort(
        (a, b) =>
          byCodeUnit(a.capability, b.capability) ||
          byCodeUnit(a.locus, b.locus),
      );
    const seen = new Set<string>();
    const commands: DerivedCommand[] = [];
    for (const target of exposed) {
      if (seen.has(target.capability)) continue;
      seen.add(target.capability);
      const description: CapabilityDescription = yield* describeCapability(
        model,
        target.locus,
        target.capability,
      );
      commands.push({
        name: target.capability,
        ref: CapabilityRef.make(target.locus, target.capability),
        description: description.description,
        fields: inputFields(description),
      });
    }
    return commands;
  });

// START_MODULE_CONTRACT
//   PURPOSE: Define the cli.command relation type and the telos.cli extension that marks a Locus as a command-line interface.
//   SCOPE: CliCommand and CliSemantics, the only values that build a RelationType and an Extension. Out: the derivation of commands (derive.ts), the rules (archetype.ts) and running them (run.ts).
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CliCommand - the relation type that exposes a capability as a command
//   CliSemantics - the extension that marks a Locus as a command-line interface with a program name
// END_MODULE_MAP

import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { CLI_COMMAND_TYPE, CLI_EXTENSION_ID } from "./derive";
import { CliInterface } from "./archetype";

// START_CONTRACT: CliCommand
//   PURPOSE: Declare the relation type from a CLI Locus to a capability, which grants the CLI Locus invocation of that capability.
//   INPUTS: none
//   OUTPUTS: { RelationType - the cli.command relation type with target capability and grantsInvocation true }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: CliCommand
export const CliCommand = RelationType.make(CLI_COMMAND_TYPE, {
  description:
    "Exposes the target capability as a command-line subcommand named after the capability.",
  target: "capability",
  grantsInvocation: true,
});

// START_CONTRACT: CliSemantics
//   PURPOSE: Declare the telos.cli extension with its program property, its cli.command relation type and the CliInterface archetype.
//   INPUTS: none
//   OUTPUTS: { Extension - the telos.cli extension with the program string property }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: CliSemantics
export const CliSemantics = Extension.make(CLI_EXTENSION_ID, {
  description:
    "Marks a Locus as a command-line interface. Its `program` is the executable name.",
  properties: { program: Schema.String },
  relationTypes: [CliCommand],
  archetypes: [CliInterface],
});

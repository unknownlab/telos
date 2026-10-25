import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { CLI_COMMAND_TYPE, CLI_EXTENSION_ID } from "./derive";
import { CliInterface } from "./archetype";

export const CliCommand = RelationType.make(CLI_COMMAND_TYPE, {
  description:
    "Exposes the target capability as a command-line subcommand named after the capability.",
  target: "capability",
  grantsInvocation: true,
});

export const CliSemantics = Extension.make(CLI_EXTENSION_ID, {
  description:
    "Marks a Locus as a command-line interface. Its `program` is the executable name.",
  properties: { program: Schema.String },
  relationTypes: [CliCommand],
  archetypes: [CliInterface],
});

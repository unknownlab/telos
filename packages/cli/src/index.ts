// START_MODULE_CONTRACT
//   PURPOSE: Be the browser-safe public entry of the CLI Pack and re-export exactly the names of the Pack contract.
//   SCOPE: Re-exports only. It never exports the Bun-only bun module, and it declares nothing.
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CLI_COMMAND_TYPE - the relation type id of a command
//   CliCommand - the cli.command relation type
//   CliSemantics - the telos.cli extension
//   CliInterface - the archetype of command-line interface Loci
//   deriveCommands - the commands a CLI Locus exposes
//   DerivedCommand - one derived command
//   runCli - runs one command line in memory
//   CliResult - the outcome of one command line
//   EXIT_CODE - the exit code of a kernel invocation error
//   memoryEnvironment - the in-memory effect/cli environment
//   Captured - the output captured during one run
// END_MODULE_MAP

export { CLI_COMMAND_TYPE, deriveCommands } from "./derive";
export type { DerivedCommand } from "./derive";
export { CliCommand, CliSemantics } from "./semantics";
export { CliInterface } from "./archetype";
export { EXIT_CODE, runCli } from "./run";
export type { CliResult } from "./run";
export { memoryEnvironment } from "./environment";
export type { Captured } from "./environment";

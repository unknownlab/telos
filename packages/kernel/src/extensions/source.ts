// START_MODULE_CONTRACT
//   PURPOSE: Define the built-in source and external extensions and the source dependency relation type.
//   SCOPE: SourceDependsOn, Source and External values only. Out: matching globs against files and checking imports.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SourceDependsOn - relation type from a Locus to the Locus whose code its source imports
//   Source - the built-in extension that claims source files by glob patterns
//   External - the built-in extension that declares third-party packages a Locus may import
// END_MODULE_MAP

import { Schema } from "effect";
import { Extension } from "../extension";
import { RelationType } from "../relation";

// START_CONTRACT: SourceDependsOn
//   PURPOSE: Declare the source.depends-on relation type, targeting a Locus, with no acyclic or invocation flags.
//   INPUTS: none
//   OUTPUTS: { RelationType - the source.depends-on relation type }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: SourceDependsOn
export const SourceDependsOn = RelationType.make("source.depends-on", {
  description:
    "The source files of this Locus import code owned by the target Locus.",
  target: "locus",
});

// START_CONTRACT: Source
//   PURPOSE: Declare the telos.source extension, which claims source files by repository-relative globs.
//   INPUTS: none
//   OUTPUTS: { Extension - the telos.source extension with its sources property and SourceDependsOn }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Source
export const Source = Extension.make("telos.source", {
  description:
    "Claims source files for a Locus by repository-relative glob patterns.",
  properties: { sources: Schema.Array(Schema.String) },
  relationTypes: [SourceDependsOn],
});

// START_CONTRACT: External
//   PURPOSE: Declare the telos.external extension, which lists third-party packages a Locus may import.
//   INPUTS: none
//   OUTPUTS: { Extension - the telos.external extension with its packages property }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: External
export const External = Extension.make("telos.external", {
  description:
    "Declares third-party packages this Locus may import, without modelling their internals.",
  properties: { packages: Schema.Array(Schema.String) },
});

// START_MODULE_CONTRACT
//   PURPOSE: Define extensions, the named bundles of properties, relation types and archetypes that Loci compose.
//   SCOPE: The Extension value and its make constructor. Out: composing extensions into a Locus kind (locus.ts).
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Extension - a named bundle of property schemas, relation types and archetypes
// END_MODULE_MAP

import type { Schema } from "effect";
import type { Archetype } from "./archetype";
import type { RelationType } from "./relation";

export interface Extension<
  Id extends string = string,
  F extends Schema.Struct.Fields = Schema.Struct.Fields,
> {
  readonly _tag: "Extension";
  readonly id: Id;
  readonly description: string;
  readonly properties: F;
  readonly relationTypes: ReadonlyArray<RelationType>;
  readonly archetypes: ReadonlyArray<Archetype>;
}

// START_CONTRACT: Extension
//   PURPOSE: Build a frozen extension, with empty properties, relation types and archetypes by default.
//   INPUTS: { id: string - extension id, options: { description, properties default {}, relationTypes default [], archetypes default [] } }
//   OUTPUTS: { Extension<Id, F> - frozen extension }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Extension
export const Extension = {
  make: <const Id extends string, const F extends Schema.Struct.Fields = {}>(
    id: Id,
    options: {
      readonly description: string;
      readonly properties?: F;
      readonly relationTypes?: ReadonlyArray<RelationType>;
      readonly archetypes?: ReadonlyArray<Archetype>;
    },
  ): Extension<Id, F> =>
    Object.freeze({
      _tag: "Extension",
      id,
      description: options.description,
      properties: options.properties ?? ({} as F),
      relationTypes: options.relationTypes ?? [],
      archetypes: options.archetypes ?? [],
    }),
};

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

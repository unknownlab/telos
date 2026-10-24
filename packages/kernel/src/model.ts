import type { Archetype } from "./archetype";
import type { Diagnostic } from "./diagnostic";
import type { Extension } from "./extension";
import type { LocusDefinition } from "./locus";
import type { RelationTarget, RelationType } from "./relation";

export interface ModelLocus {
  readonly definition: LocusDefinition;
  readonly container: string | null;
  readonly contains: ReadonlyArray<string>;
  readonly depth: number;
}
export interface ModelRelation {
  readonly from: string;
  readonly type: RelationType;
  readonly target: RelationTarget;
  readonly index: number;
  readonly valid: boolean;
}
export interface SemanticModel {
  readonly root: string;
  readonly ids: ReadonlyArray<string>;
  readonly loci: ReadonlyMap<string, ModelLocus>;
  readonly relations: ReadonlyArray<ModelRelation>;
  readonly extensions: ReadonlyMap<string, Extension>;
  readonly archetypes: ReadonlyMap<string, Archetype>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

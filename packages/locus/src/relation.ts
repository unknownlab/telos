// START_MODULE_CONTRACT
//   PURPOSE: Define the four Stage 0 Relation kinds and the Relation value type.
//   SCOPE: RelationKind, RELATION_KINDS and Relation. Out: reference and cycle validation (WP03).
//   DEPENDS: identity
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RelationKind - closed set of the four Relation kinds
//   RELATION_KINDS - the four kinds in fixed order, frozen
//   Relation - a typed, directed link from one Locus to a target Identity
// END_MODULE_MAP

import type { Identity } from "./identity";

// START_CONTRACT: RelationKind
//   PURPOSE: Name the kind of a Relation.
//   INPUTS: none
//   OUTPUTS: { "depends-on" | "refines" | "satisfies" | "verifies" - closed set }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: RelationKind
/** The four Stage 0 Relation kinds. */
export type RelationKind = "depends-on" | "refines" | "satisfies" | "verifies";

// START_CONTRACT: RELATION_KINDS
//   PURPOSE: Enumerate every Relation kind in a fixed order.
//   INPUTS: none
//   OUTPUTS: { ReadonlyArray<RelationKind> - ["depends-on", "refines", "satisfies", "verifies"], frozen }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: RELATION_KINDS
/** All Relation kinds, in this fixed order. */
export const RELATION_KINDS: ReadonlyArray<RelationKind> = Object.freeze([
  "depends-on",
  "refines",
  "satisfies",
  "verifies",
]);

// START_CONTRACT: Relation
//   PURPOSE: Describe a directed link from the owning Locus to a target Identity.
//   INPUTS: none
//   OUTPUTS: { Relation - readonly kind: RelationKind; target: Identity }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: Relation
/** A typed, directed link from one Locus to another. */
export interface Relation {
  readonly kind: RelationKind;
  readonly target: Identity;
}

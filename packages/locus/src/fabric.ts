// START_MODULE_CONTRACT
//   PURPOSE: Define the Fabric value type and the defineFabric constructor that copies and freezes a set of Loci.
//   SCOPE: Fabric and defineFabric. Out: validation of the Fabric (WP03), history, decoding.
//   DEPENDS: freeze, identity, locus
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Fabric - a named set of Loci validated together
//   defineFabric - copies every member through defineLocus and deeply freezes the Fabric
// END_MODULE_MAP

import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";
import { defineLocus, type LocusDefinition } from "./locus";

// START_CONTRACT: Fabric
//   PURPOSE: Group Loci under one identity as the scope of validation.
//   INPUTS: none
//   OUTPUTS: { Fabric - readonly id: Identity; loci: ReadonlyArray<LocusDefinition> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: Fabric
/** A named set of Loci validated together. Order of `loci` has no meaning. */
export interface Fabric {
  readonly id: Identity;
  readonly loci: ReadonlyArray<LocusDefinition>;
}

// START_CONTRACT: defineFabric
//   PURPOSE: Build a Fabric whose members are independent frozen copies.
//   INPUTS: { input: { id: Identity; loci: ReadonlyArray<LocusDefinition> } - the Fabric identity and its Loci }
//   OUTPUTS: { Fabric - deeply frozen; each locus is a copy made by defineLocus; loci order kept }
//   SIDE_EFFECTS: none. The input array and its members are not mutated or frozen. Never throws.
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: defineFabric
/** Copies every member through `defineLocus` and freezes the result. Never throws. */
export function defineFabric(input: {
  readonly id: Identity;
  readonly loci: ReadonlyArray<LocusDefinition>;
}): Fabric {
  return deepFreeze({
    id: input.id,
    loci: input.loci.map((l) => defineLocus(l)),
  });
}

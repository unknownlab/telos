// START_MODULE_CONTRACT
//   PURPOSE: Define the LocusDefinition and LocusInput value types and the defineLocus constructor that copies and freezes a Locus.
//   SCOPE: Types and defineLocus. Out: validation (WP03), revisions (WP04), history (WP05), decoding (WP06).
//   DEPENDS: charter, freeze, identity, relation
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   LocusDefinition - an immutable Locus definition
//   LocusInput - input to defineLocus; optional sets default to empty
//   defineLocus - copies an input into a deeply frozen LocusDefinition, keeping order and duplicates
// END_MODULE_MAP

import type { Charter } from "./charter";
import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";
import type { Relation } from "./relation";

// START_CONTRACT: LocusDefinition
//   PURPOSE: Describe one Locus as an immutable value.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - readonly id: Identity; charter: Charter; owner?: Identity; relations: ReadonlyArray<Relation>; metadata?: Readonly<Record<string, string>> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: LocusDefinition
/** An immutable Locus definition. Create it with `defineLocus`. */
export interface LocusDefinition {
  readonly id: Identity;
  readonly charter: Charter;
  readonly owner?: Identity;
  readonly relations: ReadonlyArray<Relation>;
  readonly metadata?: Readonly<Record<string, string>>;
}

// START_CONTRACT: LocusInput
//   PURPOSE: Describe the caller-supplied content of a Locus before it is copied.
//   INPUTS: none
//   OUTPUTS: { LocusInput - id and charter.purpose and charter.responsibilities required; excluded, successConditions, owner, relations, metadata optional }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: LocusInput
/** Input to `defineLocus`; the optional sets default to empty. */
export interface LocusInput {
  readonly id: Identity;
  readonly charter: {
    readonly purpose: string;
    readonly responsibilities: ReadonlyArray<string>;
    readonly excluded?: ReadonlyArray<string>;
    readonly successConditions?: ReadonlyArray<string>;
  };
  readonly owner?: Identity;
  readonly relations?: ReadonlyArray<Relation>;
  readonly metadata?: Readonly<Record<string, string>>;
}

// START_CONTRACT: defineLocus
//   PURPOSE: Build a LocusDefinition from caller input without sharing any array or object with the caller.
//   INPUTS: { input: LocusInput - the caller-supplied Locus content }
//   OUTPUTS: { LocusDefinition - deeply frozen copy; missing optional sets are []; order and duplicates kept; owner and metadata keys present only when given }
//   SIDE_EFFECTS: none. The input is not mutated or frozen. Never throws on invalid content; validation is WP03.
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: defineLocus
/** Copies the input into a deeply frozen definition. Keeps order and duplicates. Never throws. */
export function defineLocus(input: LocusInput): LocusDefinition {
  return deepFreeze({
    id: input.id,
    charter: {
      purpose: input.charter.purpose,
      responsibilities: [...input.charter.responsibilities],
      excluded: [...(input.charter.excluded ?? [])],
      successConditions: [...(input.charter.successConditions ?? [])],
    },
    ...(input.owner === undefined ? {} : { owner: input.owner }),
    relations: (input.relations ?? []).map((r) => ({
      kind: r.kind,
      target: r.target,
    })),
    ...(input.metadata === undefined
      ? {}
      : { metadata: { ...input.metadata } }),
  });
}

// START_MODULE_CONTRACT
//   PURPOSE: Public entry point of @telos/locus; re-exports the Stage 0 Locus model, validation, revisions, history and decoding.
//   SCOPE: Export statements only. No logic lives here.
//   DEPENDS: none
//   LINKS: M-LOCUS-MODEL, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-LOCUS-HISTORY, M-LOCUS-DECODE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Charter - purpose, responsibilities, exclusions and success conditions of a Locus
//   defineFabric - copies every member through defineLocus and deeply freezes the Fabric
//   Fabric - a named set of Loci validated together
//   Identity - a Locus or Fabric identity string, checked by validation rather than by the type
//   isIdentity - true when a string matches the Identity grammar and is at most 128 characters long
//   defineLocus - copies an input into a deeply frozen LocusDefinition, keeping order and duplicates
//   LocusDefinition - an immutable Locus definition
//   LocusInput - input to defineLocus; optional sets default to empty
//   RELATION_KINDS - the four Relation kinds in fixed order, frozen
//   Relation - a typed, directed link from one Locus to a target Identity
//   RelationKind - closed set of the four Relation kinds
//   Diagnostic - one reported rule violation, with a stable code, subject, path and optional detail and members
//   DiagnosticCode - stable machine codes for every rule violation; adding is allowed, renaming is breaking
//   ValidationReport - the result of validating a Fabric; valid is true exactly when there are no diagnostics
//   validateFabric - pure, total check of a Fabric against INV-001 to INV-008; reports every violation
// END_MODULE_MAP

export type { Charter } from "./charter";
export { defineFabric, type Fabric } from "./fabric";
export { isIdentity, type Identity } from "./identity";
export { defineLocus, type LocusDefinition, type LocusInput } from "./locus";
export { RELATION_KINDS, type Relation, type RelationKind } from "./relation";
export type {
  Diagnostic,
  DiagnosticCode,
  ValidationReport,
} from "./diagnostic";
export { validateFabric } from "./validate";

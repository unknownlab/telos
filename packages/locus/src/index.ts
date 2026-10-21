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
//   DigestError - Web Crypto is unavailable or the digest failed
//   LocusMismatchError - two Revisions of different Loci were compared
//   StaleBaselineError - an append stated an expected head that is not the current head
//   RevisionNotFoundError - no Revision with this id was recorded
//   DecodeError - external input could not be decoded; carries at least one located issue
//   canonicalForm - canonical JSON, version 1, of a definition
//   Revision - an immutable, content-addressed snapshot of one Locus definition
//   RevisionId - "sha256:" followed by 64 lowercase hex digits
//   createRevision - computes the Revision of a definition through Web Crypto
//   Change - one changed, added or removed part of a definition
//   ChangeSet - the ordered changes between two Revisions of one Locus
//   SetPart - the four set-valued parts of a definition that produce added and removed changes
//   diffRevisions - fails for different Loci; otherwise returns the ordered change set
//   RevisionHistory - Effect service: head, entries, get and compare-and-set append per Locus
//   RevisionHistoryInMemory - layer that builds fresh, empty in-memory state each time it is provided
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
export {
  DecodeError,
  DigestError,
  LocusMismatchError,
  RevisionNotFoundError,
  StaleBaselineError,
} from "./errors";
export { canonicalForm } from "./canonical";
export type { Revision, RevisionId } from "./revision";
export { createRevision } from "./revision";
export type { Change, ChangeSet, SetPart } from "./diff";
export { diffRevisions } from "./diff";
export { RevisionHistory, RevisionHistoryInMemory } from "./history";

// START_MODULE_CONTRACT
//   PURPOSE: Define the public tagged errors of @telos/locus so that every module raises the same named failures.
//   SCOPE: DigestError, LocusMismatchError, StaleBaselineError, RevisionNotFoundError and DecodeError. Out: the code that raises them.
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-REVISION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DigestError - Web Crypto is unavailable or the digest failed
//   LocusMismatchError - two Revisions of different Loci were compared
//   StaleBaselineError - an append stated an expected head that is not the current head
//   RevisionNotFoundError - no Revision with this id was recorded
//   DecodeError - external input could not be decoded; carries at least one located issue
// END_MODULE_MAP

import { Data } from "effect";
import type { Identity } from "./identity";
import type { RevisionId } from "./revision";

// START_CONTRACT: DigestError
//   PURPOSE: Report that a content digest could not be computed.
//   INPUTS: { cause: unknown - the underlying failure, or a description of the missing Web Crypto }
//   OUTPUTS: { DigestError - _tag "DigestError"; cause: unknown }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: DigestError
/** Web Crypto is unavailable or the digest failed. */
export class DigestError extends Data.TaggedError("DigestError")<{
  readonly cause: unknown;
}> {}

// START_CONTRACT: LocusMismatchError
//   PURPOSE: Report that two Revisions of different Loci were compared.
//   INPUTS: { from: Identity - locus of the first Revision; to: Identity - locus of the second }
//   OUTPUTS: { LocusMismatchError - _tag "LocusMismatchError"; from; to }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: LocusMismatchError
/** Two Revisions of different Loci were compared. */
export class LocusMismatchError extends Data.TaggedError("LocusMismatchError")<{
  readonly from: Identity;
  readonly to: Identity;
}> {}

// START_CONTRACT: StaleBaselineError
//   PURPOSE: Report that an append stated an expected head that is not the current head.
//   INPUTS: { locus: Identity; expected: RevisionId | null; actual: RevisionId | null }
//   OUTPUTS: { StaleBaselineError - _tag "StaleBaselineError"; locus; expected; actual }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: StaleBaselineError
/** An append stated an expected head that is not the current head. */
export class StaleBaselineError extends Data.TaggedError("StaleBaselineError")<{
  readonly locus: Identity;
  readonly expected: RevisionId | null;
  readonly actual: RevisionId | null;
}> {}

// START_CONTRACT: RevisionNotFoundError
//   PURPOSE: Report that no Revision with the given id was recorded.
//   INPUTS: { id: RevisionId - the requested id }
//   OUTPUTS: { RevisionNotFoundError - _tag "RevisionNotFoundError"; id }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: RevisionNotFoundError
/** No Revision with this id was recorded. */
export class RevisionNotFoundError extends Data.TaggedError(
  "RevisionNotFoundError",
)<{
  readonly id: RevisionId;
}> {}

// START_CONTRACT: DecodeError
//   PURPOSE: Report external input that could not be decoded, with a located issue for each problem.
//   INPUTS: { issues: ReadonlyArray<{ path: string; message: string }> - at least one issue }
//   OUTPUTS: { DecodeError - _tag "DecodeError"; issues }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: DecodeError
/** External input could not be decoded. Carries at least one located issue. */
export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly issues: ReadonlyArray<{
    readonly path: string;
    readonly message: string;
  }>;
}> {}

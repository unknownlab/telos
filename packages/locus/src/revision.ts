// START_MODULE_CONTRACT
//   PURPOSE: Create content-addressed Revisions: a SHA-256 id over the canonical form of a Locus definition, with the canonical definition frozen beside it.
//   SCOPE: RevisionId, Revision and createRevision. Out: change sets (diff.ts), history (WP05), persistence (out of scope for Stage 0).
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-REVISION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RevisionId - "sha256:" followed by 64 lowercase hex digits
//   Revision - an immutable, content-addressed snapshot of one Locus definition
//   createRevision - computes the Revision of a definition through Web Crypto
// END_MODULE_MAP

import { Effect } from "effect";
import { canonicalDefinition, canonicalForm } from "./canonical";
import { DigestError } from "./errors";
import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";
import type { LocusDefinition } from "./locus";

// START_CONTRACT: RevisionId
//   PURPOSE: Name a Revision by the digest of its canonical form.
//   INPUTS: none
//   OUTPUTS: { RevisionId - template type "sha256:${string}" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: RevisionId
/** A Revision id: `sha256:` followed by 64 lowercase hex digits. */
export type RevisionId = `sha256:${string}`;

// START_CONTRACT: Revision
//   PURPOSE: Hold one immutable snapshot of a Locus definition, addressed by its digest.
//   INPUTS: none
//   OUTPUTS: { Revision - readonly id: RevisionId; locus: Identity; definition: LocusDefinition (canonical, deeply frozen) }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: Revision
/** An immutable, content-addressed snapshot of one Locus definition. */
export interface Revision {
  readonly id: RevisionId;
  readonly locus: Identity;
  readonly definition: LocusDefinition;
}

// START_CONTRACT: createRevision
//   PURPOSE: Compute the content-addressed Revision of a definition.
//   INPUTS: { definition: LocusDefinition - any definition, including an invalid one }
//   OUTPUTS: { Effect<Revision, DigestError> - id is "sha256:" + lowercase hex of SHA-256 over the UTF-8 bytes of canonicalForm; definition is canonicalDefinition, deeply frozen }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle when run. Does not mutate the input.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: createRevision
/**
 * Computes the Revision of a definition. Equal meaning gives equal ids.
 * Fails with DigestError when Web Crypto is missing or the digest is rejected.
 */
export const createRevision = (
  definition: LocusDefinition,
): Effect.Effect<Revision, DigestError> =>
  Effect.gen(function* () {
    const canonical = canonicalDefinition(definition);
    const bytes = new TextEncoder().encode(canonicalForm(canonical));
    const digest = yield* Effect.tryPromise({
      try: () => {
        const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;
        if (subtle === undefined) {
          return Promise.reject(new Error("Web Crypto is unavailable"));
        }
        return subtle.digest("SHA-256", bytes);
      },
      catch: (cause) => new DigestError({ cause }),
    });
    const hex = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return deepFreeze({
      id: `sha256:${hex}` as RevisionId,
      locus: canonical.id,
      definition: canonical,
    });
  });

// START_MODULE_CONTRACT
//   PURPOSE: Give a value a stable SHA-256 digest computed over its canonical JSON.
//   SCOPE: The Digest type and digestOf. Out: canonical JSON rules (canonical.ts) and revisions of models.
//   DEPENDS: M-KERNEL-CANONICAL
//   LINKS: M-KERNEL-CANONICAL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Digest - a digest string of the form sha256 colon followed by lowercase hex
//   digestOf - SHA-256 digest of the canonical JSON of a value, as an Effect
// END_MODULE_MAP

import { Effect } from "effect";
import { canonicalJson } from "./canonical";

// START_CONTRACT: Digest
//   PURPOSE: Name a digest of canonical JSON.
//   INPUTS: none
//   OUTPUTS: { Digest - template type "sha256:${string}" }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-CANONICAL
// END_CONTRACT: Digest
/** A digest: `sha256:` followed by 64 lowercase hex digits. */
export type Digest = `sha256:${string}`;

// START_CONTRACT: digestOf
//   PURPOSE: Compute the SHA-256 digest of the canonical JSON of a value.
//   INPUTS: { value: unknown - any JSON-like value }
//   OUTPUTS: { Effect<Digest> - sha256 colon followed by lowercase hex of SHA-256 over the UTF-8 bytes of canonicalJson(value) }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle when run. A missing Web Crypto is a defect. Does not mutate the input.
//   LINKS: M-KERNEL-CANONICAL
// END_CONTRACT: digestOf
/** SHA-256 over the UTF-8 bytes of canonicalJson(value), as a lowercase hex digest. Dies when Web Crypto is missing. */
export const digestOf = (value: unknown): Effect.Effect<Digest> =>
  Effect.promise(async () => {
    const bytes = new TextEncoder().encode(canonicalJson(value));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    return `sha256:${hex}` as Digest;
  });

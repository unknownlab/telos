---
affected_files: []
cycle_number: 1
mission_slug: locus-foundation-01M5EWDR
reproduction_command:
reviewed_at: '2026-10-21T13:13:14Z'
reviewer_agent: claude
wp_id: WP06
---

# WP06 review feedback (cycle 1) — reviewer-renata

Verdict: REJECT. `bun run verify` passes (202 tests), but the sort requirement is not really tested.

## Required changes

1. **Sorting is untested.** Removing `.sort(byPathThenMessage)` in `packages/locus/src/decode.ts` (`toDecodeError`) leaves every test passing. The existing sort test and the NS-017 test put each problem in a different locus, so Effect's raw order is already sorted.
   - Add a test in `packages/locus/test/decode.test.ts` with ONE locus that has both an excess key and a non-string purpose, e.g. `{"id":"x","loci":[{"id":"a","extra":1,"charter":{"purpose":3,"responsibilities":[]}}]}`. Assert `loci[0].charter.purpose` comes before `loci[0].extra`.
   - Add a case that covers the message tiebreak (two issues with the same path and different messages), through a path that can really carry two messages, or through a unit-level seam if none exists. If no honest input produces it, say so in the commit body instead of faking one.
   - Re-run the drop-the-sort mutation and confirm it now fails; report the output.
2. **Decoders must never throw.** `decodeFabricJson(undefined)` / `decodeFabricJson(null)` throw `TypeError` at `decode.ts:176`. Add a guard (`typeof text !== "string"` → fail with one issue at path `""`) and a test. Do the same check for `decodeFabric` / `decodeLocus` if they can throw on any input.

## Not required
- The unreachable `issues.length > 0 ? … : fallback` branch is fine as defensive code.

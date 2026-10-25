# WP10 review cycle 1: changes requested

Verdict: rejected. One required fix; everything else meets the acceptance criteria.

## Required fix (single source of truth, directive section 5 and principle 12)

The extension id "telos.cli" is written as four independent literals:

- packages/cli/src/derive.ts: local `const CLI_EXTENSION_ID = "telos.cli"`
- packages/cli/src/run.ts: a second local `const CLI_EXTENSION_ID = "telos.cli"`
- packages/cli/src/semantics.ts: `Extension.make("telos.cli", ...)`
- packages/cli/src/archetype.ts: `appliesTo: ["telos.cli"]`

Nothing ties them together except test side effects. This is a manually synchronized duplicate of one identity. The contract already solves this for the relation type: a constant lives in derive.ts, and semantics.ts and archetype.ts import it, which avoids import cycles (archetype.ts already imports derive.ts). Apply the same mechanism to the extension id:

1. In derive.ts, `export const CLI_EXTENSION_ID = "telos.cli";` (keep the literal type) with a contract block and a MODULE_MAP line.
2. run.ts: delete the local constant and import it from "./derive".
3. semantics.ts: `Extension.make(CLI_EXTENSION_ID, ...)`; the result must still be typed `Extension<"telos.cli", ...>` (typecheck proves it). Import it together with CLI_COMMAND_TYPE.
4. archetype.ts: `appliesTo: [CLI_EXTENSION_ID]`.
5. Do not add it to index.ts exports (the contract lists the exact export set).
6. Keep the existing test assertion `CliInterface.appliesTo` equals `["telos.cli"]`, and add one assertion that `CliSemantics.id` equals "telos.cli" so the literal is pinned once in a test.

WP14 and WP15 (agent, web) should copy this pattern, which is why it is worth fixing now.

## Optional cleanup (not blocking, fix in the same commit if easy)

`hasCapability` in derive.ts and the equivalent inline check in the `cli.flags-derivable` rule re-implement a kernel check. The kernel already marks a relation with a missing capability as `valid: false` (model.ts, diagnostic relation.capability-missing), and both code paths only look at valid relations. The branch is unreachable and untested. Remove it, or keep it only if you add a test that reaches it.

## Judgment calls reviewed and accepted

- Dangling cli.command targets skipped: correct outcome (kernel marks them invalid), see optional cleanup about redundancy.
- cli.flags-derivable for zero-field inputs: matches the contract (empty object schema passes, other schemas without fields fail).
- cli.commands-exist counts valid cli.command relations: matches the contract.
- Program name from properties.program: matches the contract.
- --help and --version assert only exit 0: matches the contract.

## Checks

Run `bun run verify` again after the change; it passed on this review before the fix.

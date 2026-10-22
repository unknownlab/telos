---
work_package_id: WP06
title: Decoding
dependencies:
- WP05
requirement_refs:
- FR-008
- NFR-006
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T028
- T029
- T030
- T031
- T032
phase: Phase 2 - Core package
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/src/
create_intent:
- packages/locus/src/decode.ts
- packages/locus/test/decode.test.ts
- packages/locus/test/public-surface.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/src/decode.ts
- packages/locus/test/decode.test.ts
- packages/locus/test/public-surface.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP06 – Decoding

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. You must address all feedback before your work is complete.

---

## Objectives & Success Criteria

This WP implements the JSON wire format with Effect Schema. It provides three decoders that return `DecodeError` with located, sorted issues, and it enforces the 1 MB text limit. It also locks the package's public surface and the documentation coverage (NFR-006).

Done means:

1. `decodeFabric`, `decodeLocus` and `decodeFabricJson` match the contract.
   - Unknown keys, wrong types, missing keys and unknown Relation kinds are decode errors, each with a path in dot/bracket form.
   - Identity grammar, blank strings and duplicates are **not** decode errors.
2. Issues are sorted by `path`, then by `message`, comparing UTF-16 code units. Every `DecodeError` has at least one issue.
3. Text longer than 1,048,576 code units, or text that is not JSON, gives exactly one issue at path `""`.
4. A public-surface test pins the exact runtime export list of `@telos/locus`. A documentation test checks that every exported declaration in `src/` has TSDoc and a `START_CONTRACT` block.
5. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`: **Wire format (JSON)**, the decoder rows, and `DecodeError` (authoritative)
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: FR-008, NS-008, NS-017
- `packages/locus/src/{locus,fabric,errors}.ts`

The Effect 4.0.4 Schema behaviour below was **run against the installed package** on 2026-10-21. Do not use Effect 3 names such as `Schema.Literal(...)` with varargs, `optional`, `decodeUnknown` or `ParseResult`.

```ts
import { Effect, Schema, SchemaIssue } from "effect";

const RelationJson = Schema.Struct({
  kind: Schema.Literals(["depends-on", "refines", "satisfies", "verifies"]),
  target: Schema.String,
});
// optional key: Schema.optionalKey(Schema.Array(Schema.String))   string map: Schema.Record(Schema.String, Schema.String)

const formatter = SchemaIssue.makeFormatterStandardSchemaV1();
Schema.decodeUnknownEffect(FabricJson)(input, { onExcessProperty: "error", errors: "all" });
// fails with a SchemaError `e`; formatter(e.issue).issues is an array of { path, message }
// where path is an array of keys (strings / numbers; a segment may be an object { key }).
```

The issues actually produced by the installed version:

| Input | `formatter(e.issue).issues` |
| --- | --- |
| Relation `kind: "owns"` | `[{ path: ["loci", 0, "relations", 0, "kind"], message: 'Expected "depends-on" \| "refines" \| "satisfies" \| "verifies"' }]` |
| Locus without `charter` | `[{ path: ["loci", 0, "charter"], message: "Missing key" }]` |
| `purpose: 3` plus an extra key `extra` | `[{ path: ["loci", 0, "extra"], message: "Expected no excess property" }, { path: ["loci", 0, "charter", "purpose"], message: "Expected string" }]` |
| `"nope"`, `null`, `[]` | `[{ path: [], message: "Expected object" }]` |

`JSON.parse("{")` in Bun throws a `SyntaxError` with the message `JSON Parse error: Expected '}'`. Other engines word this differently, so tests check only the path, plus the fact that the message is not empty.

Path conversion (also run):

```ts
const segment = (p: unknown): PropertyKey => (typeof p === "object" && p !== null && "key" in p ? (p as { key: PropertyKey }).key : (p as PropertyKey));
const toPath = (path: ReadonlyArray<unknown>): string =>
  path
    .map(segment)
    .map((k, i) => (typeof k === "number" ? `[${k}]` : i === 0 ? String(k) : `.${String(k)}`))
    .join("");
// ["loci", 0, "relations", 0, "kind"] → "loci[0].relations[0].kind";  [] → ""
```

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP06 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append your export lines to `packages/locus/src/index.ts` and its `START_MODULE_MAP`. Name that edit in your commit body.
- No new dependencies. Portability: no `bun`, `node:*`, `process` or `Buffer` in `src/`. Tests may use `bun:test` and `node:fs`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Work test-first. No fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(locus): decode the JSON wire format with located errors`. No AI names, no `Co-Authored-By` line.
- GRACE file markup: `LINKS: M-LOCUS-DECODE`, `DEPENDS: M-LOCUS-MODEL`. Every export gets a `START_CONTRACT` block and TSDoc.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP06 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T028 – Failing decode tests

Write `packages/locus/test/decode.test.ts`. Use `Effect.runPromise` for successes and `Effect.runPromise(Effect.flip(...))` for errors.

1. The contract's example JSON (copy it from `locus-api.md`) decodes through `decodeFabricJson`. The result `toEqual`s the same Fabric built with `defineFabric`/`defineLocus`, and it is frozen.
2. Optional fields are absent when missing. For example, `"owner" in fabric.loci[0]` is `false`, and `relations`, `excluded` and `successConditions` default to `[]`.
3. **NS-008**: a Relation kind `"owns"` gives exactly one issue, at path `loci[0].relations[0].kind`.
4. **NS-017, wrong shape**: Locus 0 has no `charter`, Locus 1 has `purpose: 3`, and Locus 2 has an extra key `extra`. The issue paths are exactly `["loci[0].charter", "loci[1].charter.purpose", "loci[2].extra"]`, in that order.
5. **NS-017, not JSON**: `decodeFabricJson("{")` gives exactly one issue with path `""` and a non-empty message.
6. JSON that is not an object (`"[]"`, `"null"`, `"\"x\""`) gives one issue at path `""`.
7. **Size limit**: a string of 1,048,577 characters gives one issue at path `""`, and the message names the limit. The check runs before `JSON.parse`. A valid Fabric JSON padded with spaces to exactly 1,048,576 characters decodes.
8. **Not decode errors**: `id: "Bad Id"`, `purpose: " "`, duplicated responsibilities and a missing owner all decode successfully. `validateFabric` then reports them.
9. `decodeLocus` accepts one Locus object and rejects an unknown key at path `extra`.
10. `metadata: { "source": "a.ts" }` decodes. `metadata: { "n": 1 }` fails at path `loci[0].metadata.n` with "Expected string". This was confirmed against the installed version.
11. Issue order is sorted. Feed an input whose raw issues come out unsorted, like case 4 (excess-property issues come first). Assert the sorted order.

Run them and see them fail.

### Subtask T029 – Wire-format schemas

In `decode.ts`, add `CharterJson`, `LocusJsonSchema` and `FabricJsonSchema`:

- `charter`: `{ purpose: String, responsibilities: Array(String), excluded?: Array(String), successConditions?: Array(String) }`
- Locus: `{ id: String, charter, owner?: String, relations?: Array(RelationJson), metadata?: Record(String, String) }`
- Fabric: `{ id: String, loci: Array(Locus) }`

Export the TypeScript types, because the specifications and the docs use them:

```ts
/** JSON shape of one Locus; identical to LocusInput. */
export type LocusJson = LocusInput;
/** JSON shape of a Fabric. */
export interface FabricJson { readonly id: string; readonly loci: ReadonlyArray<LocusJson> }
```

Keep the schema values themselves internal.

### Subtask T030 – Issue formatting

```ts
const byPathThenMessage = (a: Issue, b: Issue) =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
const toDecodeError = (issue: SchemaIssue.Issue) =>
  new DecodeError({ issues: Object.freeze(formatter(issue).issues.map((i) => ({ path: toPath(i.path ?? []), message: i.message })).sort(byPathThenMessage)) });
```

Check the exact type name of `e.issue` in `node_modules/effect/dist/SchemaIssue.d.ts`. If an empty issue list is ever possible, fall back to `[{ path: "", message: "Invalid input" }]`. A `DecodeError` must never be empty.

### Subtask T031 – Decoders

```ts
export const MAX_INPUT_LENGTH = 1_048_576; // internal constant; not exported from index

export const decodeLocus = (input: unknown): Effect.Effect<LocusDefinition, DecodeError> =>
  Schema.decodeUnknownEffect(LocusJsonSchema)(input, { onExcessProperty: "error", errors: "all" }).pipe(
    Effect.mapError((e) => toDecodeError(e.issue)),
    Effect.map((json) => defineLocus(json)),
  );

export const decodeFabric = (input: unknown): Effect.Effect<Fabric, DecodeError> => /* same, then defineFabric({ id, loci: loci.map(defineLocus) }) */;

export const decodeFabricJson = (text: string): Effect.Effect<Fabric, DecodeError> =>
  text.length > MAX_INPUT_LENGTH
    ? Effect.fail(new DecodeError({ issues: [{ path: "", message: `Input is longer than ${MAX_INPUT_LENGTH} characters.` }] }))
    : Effect.try({ try: () => JSON.parse(text) as unknown, catch: (e) => new DecodeError({ issues: [{ path: "", message: e instanceof Error ? e.message : String(e) }] }) }).pipe(
        Effect.flatMap(decodeFabric),
      );
```

Where the decoded type and `LocusInput` differ only in `readonly` or mutability, convert them with a typed mapping. Do not use `as any`.

### Subtask T032 – Exports, public surface, documentation coverage

Append to `index.ts`:

```ts
export type { FabricJson, LocusJson } from "./decode";
export { decodeFabric, decodeFabricJson, decodeLocus } from "./decode";
```

Then write `packages/locus/test/public-surface.test.ts`:

```ts
import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as api from "../src/index";

test("runtime exports are exactly the contract list", () => {
  expect(Object.keys(api).sort()).toEqual([
    "DecodeError", "DigestError", "LocusMismatchError", "RELATION_KINDS", "RevisionHistory",
    "RevisionHistoryInMemory", "RevisionNotFoundError", "StaleBaselineError", "canonicalForm",
    "createRevision", "decodeFabric", "decodeFabricJson", "decodeLocus", "defineFabric",
    "defineLocus", "diffRevisions", "isIdentity", "validateFabric",
  ]);
});
```

Add a second test, **documentation coverage (NFR-006)**. For every `.ts` file in `packages/locus/src/` (use `import.meta.dir` to locate it), find each line that starts with `export ` but not with `export {`, `export type {` or `export *`. Assert two things for each such line:

- the nearest non-blank line above it ends a TSDoc comment (`*/`);
- the file contains a `START_CONTRACT:` line naming the exported identifier.

On failure, print the file and the identifier.

Run this test and fix any gaps in the earlier modules' documentation. Adding a missing TSDoc comment or contract block to a WP02–WP05 file is a **sanctioned edit**: documentation only, no behaviour change. Name it in your commit body.

Prove the tests catch problems. Temporarily remove one TSDoc comment and see the coverage test fail. Temporarily add `export const x = 1` to `index.ts` and see the surface test fail. Restore both. Then run `bun run verify`.

## Definition of Done

- [ ] `decode.ts` is complete, and the `LocusJson` and `FabricJson` types are exported.
- [ ] The 11 decode cases pass, and each was seen failing first.
- [ ] The public-surface and documentation-coverage tests pass, and both were seen failing on a deliberate break.
- [ ] `bun run verify` passes.

## Risks

- **Changes in the Effect 4 API**: read `node_modules/effect/dist/Schema.d.ts` and `SchemaIssue.d.ts` when something does not compile.
- **Order of issues**: the raw issue order depends on the schema. Always sort.
- **Mixing decoding and validation**: never add `isIdentity` or blank checks to the schema. NS-001 must show up as a diagnostic.

## Reviewer Guidance

- Check case 4's exact path list and case 8 (rule violations decode successfully).
- Check that the export list in the test matches the contract tables in `locus-api.md`.
- Run `bun test packages/locus` and `bun run verify`.

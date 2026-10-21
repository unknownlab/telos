---
work_package_id: WP04
title: Revisions and change sets
dependencies:
- WP03
requirement_refs:
- FR-009
- FR-011
- NFR-001
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T019
- T020
- T021
- T022
- T023
phase: Phase 2 - Core package
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/src/
create_intent:
- packages/locus/src/errors.ts
- packages/locus/src/canonical.ts
- packages/locus/src/revision.ts
- packages/locus/src/diff.ts
- packages/locus/test/errors.test.ts
- packages/locus/test/canonical.test.ts
- packages/locus/test/revision.test.ts
- packages/locus/test/diff.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/src/errors.ts
- packages/locus/src/canonical.ts
- packages/locus/src/revision.ts
- packages/locus/src/diff.ts
- packages/locus/test/errors.test.ts
- packages/locus/test/canonical.test.ts
- packages/locus/test/revision.test.ts
- packages/locus/test/diff.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – Revisions and change sets

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

This WP implements:

- the tagged errors;
- **canonical form version 1**;
- content-addressed `createRevision`, which computes SHA-256 through Web Crypto and returns an Effect;
- `diffRevisions`, which returns an ordered `ChangeSet`.

Done means:

1. `canonicalForm` gives exactly the strings shown below. Two golden digests, computed **independently** with `shasum -a 256`, match `createRevision` byte for byte.
2. Equal meaning gives equal ids, whatever the set order, duplicates or metadata. A change to any semantic part gives a different id (FR-009, INV-003, INV-012).
3. A Revision is deeply frozen, and its `definition` is the canonical definition (INV-010).
4. `diffRevisions` returns the ordered change list from `data-model.md`. The list is empty exactly when the ids are equal. Revisions of two different Loci fail with `LocusMismatchError` (FR-011, NS-016).
5. `createRevision` fails with `DigestError` when Web Crypto rejects or is missing.
6. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`: **Canonical form (version 1)**, **Errors**, `createRevision` and `diffRevisions` rows (**authoritative**)
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md`: Revision, ChangeSet
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: User Story 2, scenarios 1–3, NS-013 and NS-016
- `packages/locus/src/{locus,freeze}.ts` (WP02), which provides `defineLocus` and the internal `deepFreeze`

Effect 4.0.4 APIs to use. These were verified against the installed package; do not rely on memory of Effect 3:

```ts
import { Data, Effect } from "effect";

class DigestError extends Data.TaggedError("DigestError")<{ readonly cause: unknown }> {}

Effect.tryPromise({ try: () => somePromise, catch: (cause) => new DigestError({ cause }) });
Effect.gen(function* () { const x = yield* someEffect; return x; });
Effect.fail(new LocusMismatchError({ from, to }));
Effect.succeed(value);
// running, in tests:
await Effect.runPromise(effect);                            // throws on failure
await Effect.runPromise(Effect.flip(effect));               // gives the error as a value
await Effect.runPromise(Effect.result(effect));             // { _tag: "Success", success } | { _tag: "Failure", failure }
```

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP04 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append your export lines to `packages/locus/src/index.ts` and its `START_MODULE_MAP`. Name the edit in your commit body.
- Do not add dependencies. For portability, `src/` must not use `bun`, `node:*`, `process` or `Buffer`. To turn bytes into hex, use `Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Work test-first and write no fake tests. Under `exactOptionalPropertyTypes`, an optional field is absent, never `undefined`.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(locus): add content-addressed revisions and change sets`. No AI names and no `Co-Authored-By` line.
- Every new source file carries GRACE file markup: `LINKS: M-LOCUS-REVISION` and `DEPENDS: M-LOCUS-MODEL`. Each export gets a `START_CONTRACT` block and TSDoc.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP04 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T019 – `errors.ts`

Define all five public errors here. Later WPs import them, so they all live in one module:

```ts
import { Data } from "effect";
import type { Identity } from "./identity";
import type { RevisionId } from "./revision";

/** Web Crypto is unavailable or the digest failed. */
export class DigestError extends Data.TaggedError("DigestError")<{ readonly cause: unknown }> {}
/** Two Revisions of different Loci were compared. */
export class LocusMismatchError extends Data.TaggedError("LocusMismatchError")<{ readonly from: Identity; readonly to: Identity }> {}
/** An append stated an expected head that is not the current head. */
export class StaleBaselineError extends Data.TaggedError("StaleBaselineError")<{
  readonly locus: Identity;
  readonly expected: RevisionId | null;
  readonly actual: RevisionId | null;
}> {}
/** No Revision with this id was recorded. */
export class RevisionNotFoundError extends Data.TaggedError("RevisionNotFoundError")<{ readonly id: RevisionId }> {}
/** External input could not be decoded; at least one located issue. */
export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly issues: ReadonlyArray<{ readonly path: string; readonly message: string }>;
}> {}
```

`import type` from `./revision` is fine. It is a type-only cycle and is erased at runtime. If you prefer, declare `RevisionId` in `revision.ts` and import it from there everywhere.

`test/errors.test.ts`: for each class, `new X({...})._tag` equals the class name, the fields are readable, and `instanceof Error` is true.

### Subtask T020 – `canonical.ts` (test first)

```ts
/** The canonical semantic definition: sets sorted and de-duplicated, no metadata. Deeply frozen. */
export const canonicalDefinition: (definition: LocusDefinition) => LocusDefinition; // internal, not exported from index
/** Canonical JSON, version 1. Pure. */
export const canonicalForm: (definition: LocusDefinition) => string;
```

Rules (contract):

- **String sets** (`responsibilities`, `excluded`, `successConditions`): use `[...new Set(values)].sort()`. That is the default `sort()`, which compares UTF-16 code units. Do not trim, do not normalise, and do not use `localeCompare`.
- **Relations**: de-duplicate by `kind + " " + target`, then sort by `kind`, then by `target`, using code-unit comparison.
- **`canonicalDefinition`**: returns `{ id, charter: { purpose, responsibilities, excluded, successConditions }, relations }`, plus `owner` only when it is present. `metadata` is always dropped. The result is deeply frozen with `deepFreeze`.
- **`canonicalForm`**: `JSON.stringify({ v: 1, id, charter: { purpose, responsibilities, excluded, successConditions }, owner: owner ?? null, relations: relations.map(({ kind, target }) => ({ kind, target })) })`, with keys in exactly this order.

`test/canonical.test.ts` (exact expectations):

```ts
const checkout = defineLocus({
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: { purpose: "Turn a basket into an order.", responsibilities: ["Collect payment details"] },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
});
expect(canonicalForm(checkout)).toBe(
  '{"v":1,"id":"shop:checkout","charter":{"purpose":"Turn a basket into an order.","responsibilities":["Collect payment details"],"excluded":[],"successConditions":[]},"owner":"shop:storefront","relations":[{"kind":"depends-on","target":"shop:payment"}]}',
);
```

Also test the following:

- With no owner, the string contains `"owner":null`.
- Responsibilities `["b", "a", "b", "B"]` canonicalise to `["B","a","b"]`, in code-unit order.
- Relations `[{refines x:b}, {depends-on x:c}, {depends-on x:a}, {refines x:b}]` canonicalise to `depends-on x:a`, `depends-on x:c`, `refines x:b`.
- `metadata: { source: "a.ts" }` does not appear in the string.
- `" a"` and `"a"` stay distinct.
- The precomposed `"é"` and the decomposed `"é"` stay distinct.
- `canonicalDefinition` has no `metadata` key, and `Object.isFrozen` holds at every level.

### Subtask T021 – `revision.ts` (test first)

```ts
export type RevisionId = `sha256:${string}`;
export interface Revision {
  readonly id: RevisionId;
  readonly locus: Identity;
  readonly definition: LocusDefinition;
}
export const createRevision: (definition: LocusDefinition) => Effect.Effect<Revision, DigestError>;
```

Implementation outline:

```ts
export const createRevision = (definition: LocusDefinition): Effect.Effect<Revision, DigestError> =>
  Effect.gen(function* () {
    const canonical = canonicalDefinition(definition);
    const bytes = new TextEncoder().encode(canonicalForm(canonical));
    const digest = yield* Effect.tryPromise({
      try: () => {
        const subtle = globalThis.crypto?.subtle;
        if (subtle === undefined) return Promise.reject(new Error("Web Crypto is unavailable"));
        return subtle.digest("SHA-256", bytes);
      },
      catch: (cause) => new DigestError({ cause }),
    });
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    return deepFreeze({ id: `sha256:${hex}` as RevisionId, locus: canonical.id, definition: canonical });
  });
```

`test/revision.test.ts`. The golden ids below were computed **outside** this code with `printf '%s' '<canonical>' | shasum -a 256`. Never change them to match your output. If they differ, your canonical form or encoding is wrong.

| Definition | Expected id |
| --- | --- |
| `checkout` from T020 | `sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6` |
| `defineLocus({ id: "shop:cafe", charter: { purpose: "Café ☕ für alle", responsibilities: ["Brew"] } })` | `sha256:7dcb7751232a9bb0f92162e1a2c440da7c86aab588c39c99bf2e65806900b457` |

More cases:

1. Creating a Revision twice from the same definition gives the same id. **US2-1** in Bun; the browser half is WP16.
2. Two definitions that differ only in responsibility order and in `metadata` give equal ids. **US2-2**, LOC-039.
3. Duplicated set entries give the same id as the de-duplicated set.
4. Each of the following gives an id different from `checkout`:
   - a changed purpose;
   - an added responsibility;
   - an added exclusion;
   - an added success condition;
   - a changed or removed owner;
   - an added Relation;
   - a changed Relation kind.
5. The id matches `/^sha256:[0-9a-f]{64}$/`. `locus` equals `definition.id`.
6. `revision.definition` has no `metadata`. The definition, the charter and the arrays are all frozen. In strict mode (ES modules are strict), assigning to `revision.id` throws a `TypeError`.
7. Creating a Revision from `revision.definition` gives the same id (LOC-034).
8. An **invalid** definition (`id: "Bad"`, blank purpose) still gets a Revision.
9. **DigestError**:
   ```ts
   const spy = spyOn(globalThis.crypto.subtle, "digest").mockImplementation(() => Promise.reject(new Error("boom")));
   try {
     const error = await Effect.runPromise(Effect.flip(createRevision(checkout)));
     expect(error._tag).toBe("DigestError");
   } finally {
     spy.mockRestore();
   }
   ```
   This was confirmed to work in Bun 1.4.4. `spyOn` comes from `bun:test`.

### Subtask T022 – `diff.ts` (test first)

```ts
export type SetPart = "charter.responsibilities" | "charter.excluded" | "charter.successConditions" | "relations";
export type Change =
  | { readonly part: "charter.purpose"; readonly kind: "changed"; readonly from: string; readonly to: string }
  | { readonly part: "owner"; readonly kind: "changed"; readonly from: Identity | null; readonly to: Identity | null }
  | { readonly part: SetPart; readonly kind: "added" | "removed"; readonly value: string };
export interface ChangeSet {
  readonly locus: Identity;
  readonly from: RevisionId;
  readonly to: RevisionId;
  readonly changes: ReadonlyArray<Change>;
}
export const diffRevisions: (from: Revision, to: Revision) => Effect.Effect<ChangeSet, LocusMismatchError>;
```

Rules:

- If `from.locus !== to.locus`, fail with `new LocusMismatchError({ from: from.locus, to: to.locus })`.
- Compare the **canonical** definitions, which are already stored in the Revisions.
- Purpose: one `changed` change if the purposes differ.
- Owner: one `changed` change if `owner ?? null` differs.
- For each set part: `removed` for each value in `from` that is not in `to`, and `added` for each value in `to` that is not in `from`. A Relation's value is `"<kind> <target>"`.
- Order: parts in the fixed order `charter.purpose`, `owner`, `charter.responsibilities`, `charter.excluded`, `charter.successConditions`, `relations`. Within a part, `removed` comes before `added`, and values are in code-unit order.
- Key order inside each change object: `part, kind, from, to` or `part, kind, value`. This keeps `JSON.stringify` stable.
- The result is deeply frozen.

`test/diff.test.ts`:

1. **US2-3**: purpose `"Turn a basket into an order."` changed to `"Turn a basket into a paid order."` gives exactly `[{ part: "charter.purpose", kind: "changed", from: "Turn a basket into an order.", to: "Turn a basket into a paid order." }]`.
2. **US2-2**: reordered responsibilities plus changed metadata give `changes: []`, and `from === to`.
3. One change of every kind at once gives all of them, in the fixed order. Write the full expected array by hand from the rules.
4. Owner removed gives `{ part: "owner", kind: "changed", from: "shop:storefront", to: null }`.
5. **NS-016**: Revisions of `shop:a` and `shop:b` fail with `_tag` `LocusMismatchError`, `from` `"shop:a"` and `to` `"shop:b"`.
6. **Property**: for 50 generated pairs, `changes.length === 0` holds exactly when `from.id === to.id`. Generate the pairs deterministically from a fixed list of edits, with no `Math.random`.

### Subtask T023 – Exports, documentation, markup

Append these lines to `index.ts`:

```ts
export { DecodeError, DigestError, LocusMismatchError, RevisionNotFoundError, StaleBaselineError } from "./errors";
export { canonicalForm } from "./canonical";
export type { Revision, RevisionId } from "./revision";
export { createRevision } from "./revision";
export type { Change, ChangeSet, SetPart } from "./diff";
export { diffRevisions } from "./diff";
```

`canonicalDefinition` stays internal.

Then:

- `bun test packages/locus` passes.
- Prove that the golden test bites. Temporarily remove the `.sort()` on responsibilities, run, and see the T020 and T021 tests fail. Then restore it. Record this in your report.
- `bun run verify` passes.

## Definition of Done

- [ ] `errors.ts`, `canonical.ts`, `revision.ts` and `diff.ts` exist, with markup and TSDoc on every export.
- [ ] Both independent golden ids match, and no golden was edited.
- [ ] `DigestError` is tested with a spy on `crypto.subtle.digest`.
- [ ] The diff ordering is tested with a hand-written expected array.
- [ ] `bun run verify` passes.

## Risks

- **Encoding**: always use `TextEncoder` (UTF-8). Never hash a JavaScript string through any other path.
- **Hidden normalisation**: `String.prototype.normalize`, `trim` or `toLowerCase` anywhere in canonicalisation breaks the contract.
- **Key order**: building objects with spreads in the wrong order changes the JSON. Write the literal objects in contract order.

## Reviewer Guidance

- Recompute one golden yourself: `printf '%s' '<string from T020>' | shasum -a 256`.
- Check that `canonical.ts` has no `normalize`, `trim` or `localeCompare` (grep for them).
- Check the diff order against `data-model.md` ChangeSet.
- Run `bun test packages/locus` and `bun run verify`.

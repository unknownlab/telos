---
work_package_id: WP05
title: History service
dependencies:
- WP04
requirement_refs:
- FR-010
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T024
- T025
- T026
- T027
phase: Phase 2 - Core package
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/src/
create_intent:
- packages/locus/src/history.ts
- packages/locus/test/history.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/src/history.ts
- packages/locus/test/history.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP05 – History service

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and follow its guidance before you read the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. Address all of it before you treat the work as complete.

---

## Objectives & Success Criteria

Implement the `RevisionHistory` Effect service and its `RevisionHistoryInMemory` layer, with a compare-and-set append (FR-010, INV-011).

Done means:

1. `append` checks staleness **first**. If `expectedHead` is not the current head, the call fails with `StaleBaselineError { locus, expected, actual }`, whatever the Revision, and the history does not change.
2. After the stale check, appending the current head is a no-op: `{ appended: false, head }`.
3. Otherwise the Revision becomes the head: `{ appended: true, head: revision.id }`. A revert such as `A, B, A` is allowed.
4. One service instance holds the histories of many Loci, one per Locus, chosen by `revision.locus`. `get(id)` returns a stored Revision or fails with `RevisionNotFoundError`.
5. Each time the layer is built it starts with fresh, empty state. Twenty concurrent appends with the same expected head produce exactly one success.
6. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md` — **History service** (authoritative)
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md` — History state diagram and rules 1–5
- `kitty-specs/locus-foundation-01M5EWDR/spec.md` — User Story 2 scenarios 4–5, NS-014, NS-015
- `packages/locus/src/{errors,revision}.ts` (WP04)

The following Effect 4.0.4 code was **compiled and run** against the installed package (spike, 2026-10-21). Use it as the basis:

```ts
import { Context, Effect, Layer, Ref } from "effect";

export class RevisionHistory extends Context.Service<
  RevisionHistory,
  {
    readonly head: (locus: Identity) => Effect.Effect<RevisionId | null>;
    readonly entries: (locus: Identity) => Effect.Effect<ReadonlyArray<RevisionId>>;
    readonly get: (id: RevisionId) => Effect.Effect<Revision, RevisionNotFoundError>;
    readonly append: (
      revision: Revision,
      expectedHead: RevisionId | null,
    ) => Effect.Effect<{ readonly appended: boolean; readonly head: RevisionId }, StaleBaselineError>;
  }
>()("@telos/locus/RevisionHistory") {}

interface State {
  readonly entries: ReadonlyMap<Identity, ReadonlyArray<RevisionId>>;
  readonly revisions: ReadonlyMap<RevisionId, Revision>;
}
type Outcome = { readonly _tag: "stale"; readonly actual: RevisionId | null } | { readonly _tag: "ok"; readonly appended: boolean };

export const RevisionHistoryInMemory: Layer.Layer<RevisionHistory> = Layer.effect(
  RevisionHistory,
  Effect.gen(function* () {
    const ref = yield* Ref.make<State>({ entries: new Map(), revisions: new Map() });
    const headOf = (s: State, locus: Identity): RevisionId | null => {
      const e = s.entries.get(locus) ?? [];
      return e.length === 0 ? null : e[e.length - 1]!;
    };
    return {
      head: (locus) => Effect.map(Ref.get(ref), (s) => headOf(s, locus)),
      entries: (locus) => Effect.map(Ref.get(ref), (s) => Object.freeze([...(s.entries.get(locus) ?? [])])),
      get: (id) =>
        Effect.flatMap(Ref.get(ref), (s) => {
          const r = s.revisions.get(id);
          return r === undefined ? Effect.fail(new RevisionNotFoundError({ id })) : Effect.succeed(r);
        }),
      append: (revision, expectedHead) =>
        Effect.flatMap(
          Ref.modify(ref, (s): readonly [Outcome, State] => {
            const actual = headOf(s, revision.locus);
            if (actual !== expectedHead) return [{ _tag: "stale", actual }, s];
            if (actual === revision.id) return [{ _tag: "ok", appended: false }, s];
            const entries = new Map(s.entries);
            entries.set(revision.locus, [...(s.entries.get(revision.locus) ?? []), revision.id]);
            const revisions = new Map(s.revisions);
            revisions.set(revision.id, revision);
            return [{ _tag: "ok", appended: true }, { entries, revisions }];
          }),
          (o) =>
            o._tag === "stale"
              ? Effect.fail(new StaleBaselineError({ locus: revision.locus, expected: expectedHead, actual: o.actual }))
              : Effect.succeed({ appended: o.appended, head: revision.id }),
        ),
    };
  }),
);
```

`Ref.modify(ref, f)` runs `f` atomically and returns its first element. It is the only place where state changes, which makes append atomic within a runtime (rule 5).

Running a program in tests:

```ts
const run = <A, E>(program: Effect.Effect<A, E, RevisionHistory>) =>
  Effect.runPromise(Effect.provide(program, RevisionHistoryInMemory));
// error as a value: Effect.flip(effect); either: Effect.result(effect) → { _tag: "Success", success } | { _tag: "Failure", failure }
```

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP05 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append your export lines to `packages/locus/src/index.ts` and its `START_MODULE_MAP`. Name the edit in your commit body.
- Do not add dependencies. Keep the code portable: no `bun`, `node:*`, `process` or `Buffer` in `src/`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(locus): add revision history service with compare-and-set append`. No AI names and no `Co-Authored-By` line.
- Add GRACE file markup with `LINKS: M-LOCUS-HISTORY` and `DEPENDS: M-LOCUS-REVISION`. Give each export a `START_CONTRACT` block and TSDoc, and wrap the append body in a `START_BLOCK_APPEND` block.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP05 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T024 – Failing history tests

Create `packages/locus/test/history.test.ts`. Build Revisions with `createRevision(defineLocus(...))`: `A` and `B` are two definitions of `shop:checkout` (B has a different purpose), `C` is a third, and `X` is a Revision of `shop:other`.

Required cases:

1. On an empty history, `head("shop:checkout")` is `null` and `entries` is `[]`.
2. `append(A, null)` gives `{ appended: true, head: A.id }`. Now `head` is `A.id` and `entries` is `[A.id]`.
3. **US2-4**: then `append(B, A.id)` gives `{ appended: true, head: B.id }`, and `entries` is `[A.id, B.id]`.
4. **US2-5 / NS-014**: then `append(C, A.id)` fails with a `StaleBaselineError` whose `locus` is `"shop:checkout"`, `expected` is `A.id` and `actual` is `B.id`. Afterwards `head` is still `B.id` and `entries` is unchanged.
5. **NS-015**: on an empty history, `append(A, B.id)` fails with stale, `expected: B.id` and `actual: null`. `entries` stays `[]`.
6. **The stale check comes first**: with head `A`, `append(A, B.id)` fails with stale. It is not a no-op.
7. **No-op**: with head `A`, `append(A, A.id)` gives `{ appended: false, head: A.id }`, and `entries` stays `[A.id]`.
8. **Revert**: `A`, then `B`, then `A` again (expected `B.id`) gives entries `[A.id, B.id, A.id]`.
9. **Per-Locus histories**: `append(X, null)` succeeds while `shop:checkout` has a head. Each Locus has its own entries.
10. `get(A.id)` returns a Revision with the same id and definition. `get("sha256:" + "0".repeat(64))` fails with `RevisionNotFoundError` carrying that `id`.
11. **Fresh layer**: two separate `Effect.runPromise(Effect.provide(program, RevisionHistoryInMemory))` runs do not share state. The second run sees `head === null` again.
12. **Atomicity**: inside one provided program, run 20 appends of `A` with `null` expected through `Effect.all(..., { concurrency: "unbounded" })`, each wrapped in `Effect.result`. Exactly 1 is a `Success` and 19 are `Failure` with `_tag` `StaleBaselineError`. `entries` is `[A.id]`.
13. The returned `entries` array cannot be used to mutate the history: pushing to it throws, or changes nothing on the next read.

Run the tests and see them fail.

### Subtask T025 – Declare the service

Put the `RevisionHistory` class in `history.ts` exactly as above. The service key string must be `"@telos/locus/RevisionHistory"`. Document each method with TSDoc that states the rules from `data-model.md`.

### Subtask T026 – In-memory layer

Implement `RevisionHistoryInMemory` as above. Keep state immutable: copy the maps on write and never mutate the old state. `get` returns the stored Revision. It is already deeply frozen by `createRevision`.

### Subtask T027 – Export, document, mark up

Append to `index.ts`:

```ts
export { RevisionHistory, RevisionHistoryInMemory } from "./history";
```

Then run `bun test packages/locus`.

Prove that the order rule is enforced: temporarily swap the stale check and the no-op check, run the tests, and confirm that case 6 fails. Restore the code and record this in your report. Finally run `bun run verify`.

## Definition of Done

- [ ] `history.ts` contains the service, the layer, markup and TSDoc.
- [ ] All 13 cases pass, and they were seen failing first.
- [ ] Swapping the order makes case 6 fail (recorded in the report).
- [ ] `bun run verify` passes.

## Risks

- **Shared state**: building the `Ref` outside `Layer.effect`, for example at module top level, would leak state across runs. Case 11 catches this.
- **Reading, then writing**: computing the outcome from `Ref.get` and then calling `Ref.set` is not atomic. Use only `Ref.modify`.

## Reviewer Guidance

- Check that `Ref.modify` is the only write.
- Check that the stale comparison is `actual !== expectedHead` with `null` handled, and that it runs before the no-op check.
- Run `bun test packages/locus` and `bun run verify`.

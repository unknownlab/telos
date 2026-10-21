---
work_package_id: WP07
title: Specification model, runner and package checks
dependencies:
- WP06
requirement_refs:
- C-004
- FR-012
- NFR-003
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T033
- T034
- T035
- T036
- T037
- T038
phase: Phase 3 - Executable specifications
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus-specs/src/
create_intent:
- packages/locus-specs/src/model.ts
- packages/locus-specs/src/canonical-json.ts
- packages/locus-specs/src/runner.ts
- packages/locus-specs/test/canonical-json.test.ts
- packages/locus-specs/test/runner.meta.test.ts
- packages/locus-specs/test/scan.ts
- packages/locus-specs/test/scan.test.ts
- packages/locus-specs/test/core-independence.test.ts
- packages/locus-specs/test/portability.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus-specs/src/model.ts
- packages/locus-specs/src/canonical-json.ts
- packages/locus-specs/src/runner.ts
- packages/locus-specs/test/canonical-json.test.ts
- packages/locus-specs/test/runner.meta.test.ts
- packages/locus-specs/test/scan.ts
- packages/locus-specs/test/scan.test.ts
- packages/locus-specs/test/core-independence.test.ts
- packages/locus-specs/test/portability.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP07 – Specification model, runner and package checks

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

This WP builds the engine behind the executable specifications. It covers:

- the record model;
- a canonical-JSON comparison;
- a runner for all seven check kinds that uses only the public `@telos/locus` API;
- meta-tests proving that wrong expectations fail;
- the INV-014 core-independence check;
- the portability check (NFR-003, C-004).

The catalogue itself (LOC-001…LOC-044) arrives in WP08.

Done means:

1. `runSpecification(spec)` never fails. It returns `pass` exactly when the canonical JSON of the observed value equals that of `expect`. It returns `fail` otherwise. It returns `error` when a fixture does not decode, a step index is out of range, or a defect occurs.
2. Every one of the seven check kinds has an inline meta-test record. Each record passes with its correct expectation and fails with at least two different wrong ones. A fixture that does not decode reports `error`.
3. `core-independence.test.ts` fails if `packages/locus` imports or depends on `@telos/locus-specs`, `bun:test`, `@playwright/*` or a test runner. `portability.test.ts` fails if `packages/locus/src` or `packages/locus-specs/src` uses `bun`, `bun:*`, `node:*`, `process` or `Buffer`, or does not bundle for the browser.
4. Each scanner has its own tests on bad sample text, so the checks are shown to bite.
5. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/specifications.md`: record, **Check kinds**, **Runner**, **Adapters** and the INV-014 rule (authoritative)
- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`: the public API you may call
- `packages/locus/src/index.ts`: the real exports, which `public-surface.test.ts` pins

Import **only** from `"@telos/locus"`, never from `@telos/locus/src/...`. The workspace dependency was set up in WP01.

Effect 4.0.4 APIs, verified on 2026-10-21:

```ts
import { Cause, Effect } from "effect";
Effect.forEach(items, (item) => effect);                 // sequential, returns array
Effect.result(effect);                                   // never fails: { _tag: "Success", success } | { _tag: "Failure", failure }
Effect.catchCause(effect, (cause) => Effect.succeed(...)); // also catches defects (die)
Cause.pretty(cause);                                     // string
Effect.provide(program, RevisionHistoryInMemory);       // fresh layer per provide
Effect.sync(() => performance.now());
```

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP07 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append export lines to `packages/locus-specs/src/index.ts` and its `START_MODULE_MAP`. Name the edit in your commit body.
- Do not add dependencies. `src/` must be portable: it runs in the browser playground, so it may not use `bun`, `node:*`, `process` or `Buffer`. Tests may use `bun:test`, `node:fs` and `Bun.build`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Work test-first. No fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(locus-specs): add specification model and runner`. No AI names and no `Co-Authored-By` line.
- Add GRACE file markup to every `src` file: `LINKS: M-LOCUS-SPECS` and `DEPENDS: M-LOCUS-MODEL, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-LOCUS-HISTORY, M-LOCUS-DECODE`. Give each export a `START_CONTRACT` and TSDoc. In `runner.ts`, put a `START_BLOCK_<KIND>` around each check kind.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP07 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T033 – `model.ts`

Transcribe the contract exactly:

```ts
import type { Change, DiagnosticCode, FabricJson, LocusJson } from "@telos/locus";

export type InvariantId = `INV-${string}`;
export type ScenarioId = `NS-${string}`;
export interface ExpectedDiagnostic {
  readonly code: DiagnosticCode;
  readonly scope: "fabric" | "locus";
  readonly subject: string;
  readonly path: string;
  readonly detail?: string;
  readonly members?: ReadonlyArray<string>;
}
export type HistoryOutcome = "appended" | "no-op" | "stale";
export type SpecCheck =
  | { readonly kind: "validate"; readonly fabric: FabricJson; readonly expect: { readonly valid: boolean; readonly diagnostics: ReadonlyArray<ExpectedDiagnostic> } }
  | { readonly kind: "validate-stable"; readonly variants: ReadonlyArray<FabricJson>; readonly runs: number; readonly expect: "identical" }
  | { readonly kind: "decode"; readonly input: string; readonly expect: { readonly ok: true } | { readonly ok: false; readonly paths: ReadonlyArray<string> } }
  | { readonly kind: "revision-compare"; readonly a: LocusJson; readonly b: LocusJson; readonly expect: { readonly sameLocus: boolean; readonly sameId: boolean } }
  | { readonly kind: "revision-immutable"; readonly locus: LocusJson; readonly expect: "immutable" }
  | {
      readonly kind: "history";
      readonly revisions: ReadonlyArray<LocusJson>;
      readonly steps: ReadonlyArray<{ readonly append: number; readonly expectedHead: number | null }>;
      readonly expect: { readonly outcomes: ReadonlyArray<HistoryOutcome>; readonly entries: ReadonlyArray<number> };
    }
  | {
      readonly kind: "diff";
      readonly from: LocusJson;
      readonly to: LocusJson;
      readonly expect: { readonly ok: true; readonly changes: ReadonlyArray<Change> } | { readonly ok: false; readonly error: "LocusMismatchError" };
    };
export interface Specification {
  readonly id: `LOC-${string}`;
  readonly title: string;
  readonly invariants: ReadonlyArray<InvariantId>;
  readonly scenarios: ReadonlyArray<ScenarioId>;
  readonly polarity: "positive" | "negative";
  readonly check: SpecCheck;
}
export interface SpecResult { readonly id: Specification["id"]; readonly status: "pass" | "fail" | "error"; readonly expected: unknown; readonly observed: unknown; readonly durationMs: number }
export interface SpecReport {
  readonly results: ReadonlyArray<SpecResult>;
  readonly summary: { readonly total: number; readonly passed: number; readonly failed: number; readonly errored: number };
}
```

If `DiagnosticCode` or `Change` is not exported as a type from `@telos/locus`, stop and report it. Do not redeclare them. (WP03 and WP04 export both.)

### Subtask T034 – `canonical-json.ts`

```ts
/** JSON text with object keys sorted (code-unit order) at every level; arrays keep order; undefined members dropped. */
export const canonicalJson: (value: unknown) => string;
/** Deep equality through canonicalJson. */
export const jsonEqual: (a: unknown, b: unknown) => boolean;
```

Build a sorted copy and pass it to `JSON.stringify`. Use recursion here; the data is shallow. `test/canonical-json.test.ts`:

- key order does not matter: `{b:1,a:2}` equals `{a:2,b:1}`;
- array order does: `[1,2]` does not equal `[2,1]`;
- nested objects inside arrays are also sorted;
- `{a: undefined}` equals `{}`;
- `"1"` does not equal `1`;
- `null` does not equal `{}`.

### Subtask T035 – Runner: `validate`, `validate-stable`, `decode`

Signatures:

```ts
export const runSpecification: (spec: Specification) => Effect.Effect<SpecResult>;
export const runSpecifications: (specs: ReadonlyArray<Specification>) => Effect.Effect<SpecReport>;
```

Structure:

```ts
class FixtureError { constructor(readonly reason: string, readonly detail?: unknown) {} } // internal
const observe = (check: SpecCheck): Effect.Effect<unknown, FixtureError> => { switch (check.kind) { … } };

export const runSpecification = (spec: Specification) =>
  Effect.gen(function* () {
    const start = yield* Effect.sync(() => performance.now());
    const outcome = yield* observe(spec.check).pipe(
      Effect.map((observed) => ({ status: jsonEqual(observed, spec.check.expect) ? "pass" : "fail", observed }) as const),
      Effect.catch((e: FixtureError) => Effect.succeed({ status: "error", observed: { error: e.reason, detail: e.detail } } as const)),
      Effect.catchCause((cause) => Effect.succeed({ status: "error", observed: { error: "defect", detail: Cause.pretty(cause) } } as const)),
    );
    const end = yield* Effect.sync(() => performance.now());
    return { id: spec.id, status: outcome.status, expected: spec.check.expect, observed: outcome.observed, durationMs: end - start };
  });
```

Before you write this, check whether `Effect.catch` exists in `node_modules/effect/dist/Effect.d.ts`. It replaced Effect 3's `catchAll`. If the name differs, use the one the file declares.

The observed value for each kind:

- **validate**: decode `check.fabric` with `decodeFabric`. A `DecodeError` becomes a `FixtureError("fixture did not decode", issues)`. Then `const r = validateFabric(f)`. Observed is `{ valid: r.valid, diagnostics: r.diagnostics.map(reduce) }`, where `reduce` keeps `code, scope, subject, path` and keeps `detail`/`members` only when they are present. `message` is never kept.
- **validate-stable**: decode every variant, failing with a FixtureError as above. Run `validateFabric` `runs` times on each variant and collect each `JSON.stringify(report)`. If all of them are equal, observed is `"identical"`. Otherwise observed is `{ outcome: "different", first: <string 0>, differing: <first unequal string>, at: { variant, run } }`. If `runs < 1` or there are fewer than 2 variants, fail with a FixtureError.
- **decode**: `decodeFabricJson(check.input)`. On success, observed is `{ ok: true }`. On failure, observed is `{ ok: false, paths: error.issues.map((i) => i.path) }`. A decode failure here is the *result*, not an error.

`runSpecifications` runs `Effect.forEach(specs, runSpecification)` sequentially, in input order. It computes `summary` from the statuses.

### Subtask T036 – Runner: `revision-compare`, `revision-immutable`, `history`, `diff`

- **revision-compare**: `decodeLocus` a and b; a decode failure is a FixtureError. Then `createRevision` each; a `DigestError` is a FixtureError. Observed is `{ sameLocus: ra.locus === rb.locus, sameId: ra.id === rb.id }`.
- **revision-immutable**: decode, then create a Revision `r`. Snapshot `id`, `definition.charter.purpose` and `JSON.stringify(definition.relations)`. Then make three attempts, each in its own `try`/`catch`, and record which ones did **not** throw:
  ```ts
  (r as { id: string }).id = "sha256:0";
  (r.definition.charter as { purpose: string }).purpose = "changed";
  (r.definition.relations as Array<unknown>).push({ kind: "refines", target: "x:y" });
  ```
  Module code is strict, so assigning to a frozen object throws a `TypeError`. Next, check that the three snapshot values are unchanged, and recompute `createRevision(r.definition)`; its id must equal `r.id`. If every check holds, observed is `"immutable"`. Otherwise observed is the list of failed aspects, chosen from `"id-writable"`, `"purpose-writable"`, `"relations-writable"`, `"value-changed"` and `"id-mismatch"`, in that order.
- **history**: decode every revision and create every Revision. Build a fresh layer per check: wrap the whole step loop in `Effect.provide(…, RevisionHistoryInMemory)`. For each step:
  - If `step.append` or a non-null `step.expectedHead` falls outside `revisions`, fail with a FixtureError.
  - Otherwise compute `expected = step.expectedHead === null ? null : revs[step.expectedHead].id`, then run `Effect.result(history.append(revs[step.append], expected))`.
  - Map the result: Success with `appended` is `"appended"`, Success without `appended` is `"no-op"`, and Failure with `_tag === "StaleBaselineError"` is `"stale"`.

  After the loop, read `entries(revs[0].locus)` and map each id to `revs.findIndex((r) => r.id === id)`, which is the first index with that id. Observed is `{ outcomes, entries }`.
- **diff**: decode both and create both Revisions. Run `Effect.result(diffRevisions(rf, rt))`. On Success, observed is `{ ok: true, changes: [...set.changes] }`. On Failure with `LocusMismatchError`, observed is `{ ok: false, error: "LocusMismatchError" }`.

### Subtask T037 – Runner meta-tests

Write `packages/locus-specs/test/runner.meta.test.ts`. For **each of the seven kinds**, write one inline `Specification` with a hand-derived, correct expectation. Then:

1. `runSpecification(record)` gives `status: "pass"`.
2. At least two mutated copies give `status: "fail"`. Mutate by flipping a boolean, removing or adding a diagnostic, changing one path, swapping two outcomes, or changing one change value. Use `structuredClone` and edit the copy.
3. `expected` in the result is the record's `expect`, and `durationMs` is at least 0.

Also cover these cases:

- A `validate` record whose fabric has `relations: [{ kind: "owns" }]` reports `error`, not `pass` and not `fail`.
- A `history` record with `append: 5` and only 2 revisions reports `error`.
- `runSpecifications([pass, fail, error])` gives `summary` `{ total: 3, passed: 1, failed: 1, errored: 1 }`, with results in input order.
- A `revision-immutable` record passes. That shows the strict-mode assumption holds in Bun.

Suggested inline records. Derive each expectation from the contracts and `data-model.md`. Do **not** copy expectations from runner output.

- **validate**: Fabric `t:f` with one Locus `t:a` that has a blank purpose. Expect `{ valid: false, diagnostics: [{ code: "charter.purpose-blank", scope: "locus", subject: "t:a", path: "charter.purpose" }] }`.
- **history**: revisions A and B of `t:a`; steps `(0, null)`, `(1, 0)`, `(0, 0)`. Expect outcomes `["appended", "appended", "stale"]` and entries `[0, 1]`.
- **diff**: a purpose change `"x"` to `"y"`. Expect `{ ok: true, changes: [{ part: "charter.purpose", kind: "changed", from: "x", to: "y" }] }`.

### Subtask T038 – Core independence and portability

Write `packages/locus-specs/test/scan.ts`. It is a test helper made of pure functions over text:

```ts
export const forbiddenCoreImports = (source: string): string[];   // matches import/export-from/require/import() of
//   "@telos/locus-specs", "bun:test", "@playwright/…", "vitest", "jest", "mocha", "@jest/…"
export const forbiddenRuntimeUses = (source: string): string[];   // "bun", "bun:*", "node:*" module specifiers;
//   identifiers \bprocess\. and \bBuffer\b outside comments
export const forbiddenDependencies = (manifest: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string> }): string[];
```

Write `test/scan.test.ts`, which feeds bad and good sample strings to each function. Each forbidden form must be detected, and these must not be flagged: comments that mention `process`, and the word `Buffer` inside a string in a comment. Use a simple comment stripper that removes `//…` and `/*…*/`. Do not try to parse TypeScript fully.

`test/core-independence.test.ts` (INV-014, NS-019):

- Every `.ts` file under `packages/locus/src` (use `new Bun.Glob("**/*.ts").scanSync(...)`) gives `forbiddenCoreImports(...) === []`.
- `packages/locus/package.json` gives `forbiddenDependencies(...) === []`.
- Its `dependencies` keys are exactly `["effect"]`.

`test/portability.test.ts` (NFR-003, C-004):

- `forbiddenRuntimeUses` returns `[]` for every `.ts` file under `packages/locus/src` **and** `packages/locus-specs/src`.
- `await Bun.build({ entrypoints: [<repo>/packages/locus/src/index.ts], target: "browser" })` gives `success === true`, and no output text contains `node:` or `bun:`. Do the same for `packages/locus-specs/src/index.ts`.

Append to `packages/locus-specs/src/index.ts`:

```ts
export type { ExpectedDiagnostic, HistoryOutcome, InvariantId, ScenarioId, SpecCheck, Specification, SpecReport, SpecResult } from "./model";
export { runSpecification, runSpecifications } from "./runner";
export { canonicalJson, jsonEqual } from "./canonical-json";
```

To prove the scanners bite, temporarily add `import "bun:test";` to a file in `packages/locus/src`, run, and see both tests fail. Restore the file. Then run `bun run verify`.

## Definition of Done

- [ ] `model.ts`, `canonical-json.ts` and `runner.ts` exist, with markup and TSDoc.
- [ ] The meta-tests cover all seven kinds: pass, two failing mutations each, and the `error` cases.
- [ ] The scanner tests, core-independence and portability pass. A deliberate violation was seen failing.
- [ ] `bun run verify` passes.

## Risks

- **A runner that always passes.** Comparing `expect` with itself, or with an observed value derived from `expect`, is the classic bug. The observed value must come only from the public API's output.
- **Swallowed errors.** A fixture that does not decode must be `error`, never `fail` or `pass`.
- **Shared history.** Providing the layer once outside the loop shares state between checks. Provide it per check.

## Reviewer Guidance

- Read `observe` and make sure `check.expect` is never read inside it.
- Check that each meta-test mutation really changes the expectation.
- Run `bun test packages/locus-specs` and `bun run verify`.

---
work_package_id: WP22
title: Kernel hardening (empty appliesTo, unparsable closure files, read-only model maps)
dependencies:
- WP08
- WP09
requirement_refs:
- FR-008
- FR-009
- FR-012
- FR-015
- NFR-005
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T130
- T131
- T132
- T133
- T134
- T135
- T136
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-24T09:43:24Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks (review findings of WP03, WP04 and WP08)
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/readonly-map.ts
create_intent:
- packages/kernel/src/readonly-map.ts
- packages/kernel/test/readonly-map.test.ts
- packages/kernel/test/model-hardening.test.ts
- packages/kernel/test/closure-unparsable.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/readonly-map.ts
- packages/kernel/test/readonly-map.test.ts
- packages/kernel/test/model-hardening.test.ts
- packages/kernel/test/closure-unparsable.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP22 – Kernel hardening (empty appliesTo, unparsable closure files, read-only model maps)

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Objective

The reviews of WP03, WP04 and WP08 found three gaps between the kernel contracts and the code. The contracts were corrected first; this WP brings the code in line with them:

1. **Empty `appliesTo`.** `Archetype.appliesTo` must be non-empty, but nothing enforces it, and an empty list makes the Archetype apply to every Locus. `buildModel` now reports it with the new error diagnostic `archetype.applies-to-empty` (the eighteenth `DiagnosticCode`).
2. **Unparsable files.** `checkClosure` throws when a managed file cannot be read or does not parse (`Bun.Transpiler.scanImports` throws). It must catch the failure per file, record the new error finding `closure.unparsable` (the eighth `ClosureCode`) and continue with the next file.
3. **Mutable model maps.** `SemanticModel.loci`, `extensions` and `archetypes` are `ReadonlyMap` only in their type: `(model.loci as Map<string, ModelLocus>).set(...)` works at runtime. Wrap them in a frozen read-only view whose `set`, `delete` and `clear` throw.

The contract also now states that `buildModel` is total only for definitions produced by a LocusKind's `make`, and how `ownership.multiple` writes a `null` container. That is wording only: do not change that code.

You create one source file and three test files, and you make small, listed edits to `diagnostic.ts`, `model.ts`, `closure.ts`, `diagnostic.test.ts` and two GRACE documents that WP02, WP04 and WP08 own. Those WPs are approved and merged into your base. Change nothing else in their files.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## diagnostic.ts (WP02)

```ts
export type Severity = "error" | "warning"
export type DiagnosticCode =
  | "identity.malformed" | "identity.duplicate" | "ownership.multiple"
  | "composition.extension-id-conflict" | "composition.property-conflict"
  | "composition.relation-type-conflict" | "composition.archetype-id-conflict"
  | "archetype.applies-to-empty"
  | "property.invalid" | "capability.name-malformed"
  | "relation.type-unavailable" | "relation.target-missing" | "relation.capability-missing"
  | "relation.target-kind" | "relation.self" | "relation.duplicate"
  | "relation.cycle" | "relation.cycle-limit"
// eighteen codes; "archetype.applies-to-empty" was added by WP22 (kernel hardening)
export const SEVERITY: Readonly<Record<DiagnosticCode, Severity>> // warning for relation.duplicate and relation.cycle-limit; error otherwise
```

## archetype.ts (WP03), extract

```ts
export interface Archetype {
  readonly _tag: "Archetype"
  readonly id: string                   // matches EXTENSION_ID_PATTERN
  readonly description: string
  readonly appliesTo: ReadonlyArray<string>   // extension ids, non-empty: buildModel reports an empty list as archetype.applies-to-empty
  readonly rules: ReadonlyArray<Rule>
}
```

`Archetype.make` does not validate `appliesTo`. An empty list would make the Archetype apply to every Locus (the empty set is a subset of every composition), so `buildModel` reports it as the error `archetype.applies-to-empty` (model.ts step 2). `verify` and `applicableArchetypes` are unchanged; a model with this error fails `hasErrors` and therefore every gate.

## model.ts (WP04), extract

```ts
export interface SemanticModel {
  readonly root: string
  readonly ids: ReadonlyArray<string>                       // all Locus ids, sorted (UTF-16)
  readonly loci: ReadonlyMap<string, ModelLocus>            // keyed in ids order; read-only at runtime (readonlyMap)
  readonly relations: ReadonlyArray<ModelRelation>          // sorted by from, type.id, relationTargetKey(target), index
  readonly extensions: ReadonlyMap<string, Extension>       // first extension object seen per id, over all kinds; keyed in id order; read-only at runtime
  readonly archetypes: ReadonlyMap<string, Archetype>       // first archetype object seen per id, over all kinds; keyed in id order; read-only at runtime
  readonly diagnostics: ReadonlyArray<Diagnostic>           // sortDiagnostics output
}
export function buildModel(root: LocusDefinition): SemanticModel
// total (never throws) for every LocusDefinition produced by a LocusKind's make (Locus.make, Locus.extend(...).make),
// including trees whose contains lists were built from such definitions; the behaviour for any other object is undefined
```

Algorithm step 2 gains one check (the other bullets of step 2 are unchanged):

- For each extension of `kind.extensions` (composition order) and each Archetype of its `archetypes` (array order) whose `appliesTo.length === 0` → `archetype.applies-to-empty` (error; subject = Locus id, path = "kind", members = [archetype id], message `"Archetype <archetype id> of extension <extension id> has an empty appliesTo list, so it would apply to every Locus."`). Like composition conflicts, it is reported for every Locus whose kind contains that extension. Exact duplicates are dropped by `sortDiagnostics`.

Algorithm step 6:

6. Diagnostics go through `sortDiagnostics`. The model object, `ids`, `relations` (and each relation), `diagnostics` and each `ModelLocus` (and its `contains`) are frozen. `loci`, `extensions` and `archetypes` are built with `readonlyMap` (below), so they are read-only at runtime, not only in their type: `set`, `delete` and `clear` throw, and no mutable `Map` is reachable from the model.

## readonly-map.ts (WP22) — internal, not exported from `index.ts`

```ts
export function readonlyMap<K, V>(entries: Iterable<readonly [K, V]>): ReadonlyMap<K, V>
// copies the entries into a private Map (insertion order kept; a later duplicate key replaces the value but keeps the first position, as Map does)
// returns a frozen object whose prototype is also frozen:
//   get, has, size, forEach(callback(value, key, theReadonlyMap), thisArg), keys, values, entries and [Symbol.iterator] (= entries) behave as on a Map
//   set, delete and clear exist and always throw new TypeError("SemanticModel maps are read-only.")
//   Map.prototype.set.call(it, ...) throws a TypeError, because it is not a Map
//   it is not instanceof Map; Object.prototype.toString.call(it) === "[object ReadonlyMap]"
```

It has no imports, so it is browser-safe.

`deepFreeze`, `sortKeys`, `makeDiagnostic`, `sortDiagnostics`, `SEVERITY`, `elementaryCycles`, `MAX_CYCLES` and `readonlyMap` stay internal.

## closure.ts (WP08), extract

```ts
export type ClosureCode = "closure.unowned" | "closure.ambiguous" | "closure.empty-claim" | "closure.undeclared-dependency" | "closure.unknown-external" | "closure.unresolved-import" | "closure.dynamic-import" | "closure.unparsable"
// eight codes; "closure.unparsable" was added by WP22 (kernel hardening)
export interface ClosureFinding {
  readonly code: ClosureCode
  readonly severity: "error" | "warning"     // warning for empty-claim and dynamic-import
  readonly file: string | null               // repository-relative path with "/" separators
  readonly loci: ReadonlyArray<string>
  readonly detail: string                    // the glob, import specifier or package name concerned; "parse" for closure.unparsable
  readonly message: string
  readonly knowledge: "derived" | "unknown"  // "unknown" for closure.dynamic-import (the dependency cannot be determined), "derived" for every other code
}
```

Algorithm, step 4 (first sentence) and the end of step 5:

4. For each owned file, in file order, read its text and run `scanImports` (loader `tsx` for `.tsx`, else `ts`). If reading the file throws (for example it is not readable) or `scanImports` throws (the file does not parse), the check does not fail: it records one `closure.unparsable` finding (error, `file` = the file, `loci` = [owner], `detail` = `"parse"`, message `"<file> could not be parsed, so its imports were not checked."`, `knowledge` = `"derived"`), skips the imports of that file and continues with the next file. `checkClosure` never fails or dies because of a file's content or permissions. Otherwise resolve each specifier: (the resolution rules are unchanged)
5. (dynamic imports, unchanged) … This text scan runs on every file whose text was read, before `scanImports`, so a file that was read but does not parse can have both `closure.dynamic-import` and `closure.unparsable`. A file that could not be read has only `closure.unparsable`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/data-model.md` (authoritative).

| Code | Severity | Subject | Raised when |
| --- | --- | --- | --- |
| `archetype.applies-to-empty` | error | Locus id | an Archetype of the Locus kind's extensions has an empty `appliesTo` list |

| Code | Severity | Meaning |
| --- | --- | --- |
| `closure.unparsable` | error | an owned file could not be read or parsed (`scanImports` threw), so its imports were not checked; `detail` is `"parse"` and the check continues with the next file |

### Exact texts

| Item | Exact text |
| --- | --- |
| `archetype.applies-to-empty` message | `` `Archetype ${archetype.id} of extension ${extension.id} has an empty appliesTo list, so it would apply to every Locus.` `` |
| `closure.unparsable` message | `` `${file} could not be parsed, so its imports were not checked.` `` |
| read-only error | `new TypeError("SemanticModel maps are read-only.")` |

Facts checked with Bun 1.4.4-canary.1 while planning (uid 501, not root):

- `new Bun.Transpiler({ loader: "ts" }).scanImports("const = ;")` throws (an `AggregateError`); `scanImports("import {")` throws (a `BuildMessage`); with loader `"tsx"`, `"export const a = <div>;"` throws. `scanImports("export const ok = 1;")` returns `[]`.
- After `chmodSync(path, 0o000)`, `readFileSync(path, "utf8")` throws `EACCES`, and `new Bun.Glob("**/*.ts").scanSync({ cwd, onlyFiles: true })` still lists the file. `rmSync(dir, { recursive: true, force: true })` still removes it. (Symbolic links are not listed by `Bun.Glob` with `onlyFiles`, so do not use them for the read-failure test.)

## Rules for this work package

Read these rules before you write anything. They are part of the acceptance criteria.

1. **Baseline first.** Before you change a file, run `bun run verify` in your worktree and note the result of each step. If the baseline is not green, stop and report it; do not fix unrelated failures.
2. **Only your files.** Edit only the files in `owned_files` (frontmatter) and the sanctioned edits listed below. If you need any other change, stop and report it. Never edit `kitty-specs/**`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` or the charter.
3. **Contracts are exact.** Names, signatures, messages, ids and sort orders are copied from the quoted contracts. If an Effect API in a contract does not exist or behaves differently, stop and report it. Do not invent a replacement.
4. **Tests first.** Write the tests of a subtask before its implementation, run them and see them fail, then implement.
5. **No new dependencies** and no global installs. Do not run `bun add`. `bun install` is allowed only where this prompt says so.
6. **No fake work.** No placeholder code, no `TODO`, no skipped tests, no test that asserts nothing, no hard-coded counts of things that grow.
7. **Shell.** The shell is fish. Use `echo '-----'` as a separator, and pass paths explicitly instead of shell globs with `--include=*.ts`.
8. **Report exactly.** In your final message, list every check you ran and its exact result. Never claim a check passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Commands

| Purpose | Command |
| --- | --- |
| Full gate (run before handing a WP to review, and it must pass) | `bun run verify` |
| Fast loop while working | `bun run typecheck`, `bun test <paths>`, `bun run lint`, `bun run format` (writes), `bun run grace:lint` |
| One package's tests | `bun test packages/kernel/test` (example) |

`bun run verify` = `check:bun && format:check && lint && typecheck && test && docs:build && test:e2e && grace:lint`, plus `&& telos:check` from WP15 on. Report each step's result exactly. Never claim a step passed that you did not run.

## Code

- TypeScript, strict, using the repository `tsconfig.base.json`. Imports have **no** `.ts` extension. Use `import type` for types only.
- Format: run `bun run format` and follow its output. The repository uses double quotes, semicolons and trailing commas.
- Effect 4.0.4 APIs only, as quoted in the contracts. If an API in a contract does not exist, stop and report it. Do not invent a replacement.
- No new dependency, no upgrade, no global install (C-002). Workspace links already exist from WP01.
- No placeholder code, no `TODO` stubs, no tests that assert nothing, no skipped tests.
- No compatibility aliases for removed names (C-004).
- Comments and messages are in English (C-009). Diagnostic and error messages are exactly as written in the contracts.
- Determinism (NFR-002): sort with plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`), never `localeCompare`. Never depend on object key insertion order from user input. Never use `Date.now()` or randomness in output except the `now` option of `verify`.

## Tests

- `bun:test` (`describe`, `test`, `expect`). Test files are `test/<module>.test.ts` next to the package's `src/`.
- Every diagnostic code, closure code and Archetype rule has at least one test where it is reported or fails, and one where it is not reported or passes (NFR-005). The test name names the code or rule id.
- Never hard-code counts of documents, files, Loci or findings that change as the repository grows. Assert membership, or compare with a value computed from the same source.
- No network and no credentials (NFR-007). Subprocess tests use `Bun.spawn(["bun", <absolute path>], ...)` with a 20 s test timeout.
- Fixtures are built in the test file or in `test/fixture.ts`. Never import another package's `test/` files.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Git

- Spec Kitty creates your worktree and branch. Commit only inside it.
- Commit messages follow Conventional Commits 1.0.0: `feat(kernel): build the semantic model`, `docs(foundation): ...`, `test(cli): ...`.
- No AI names, and no author, co-author or session lines. The `.githooks/commit-msg` hook enforces this. Never use `--no-verify`.
- Never edit files that another WP owns (see each WP's "Owned files"). If a needed change falls outside your files, stop and report it.

**Sanctioned edits outside `owned_files`** (recorded in the tasks.md "Shared files" table). Make exactly these edits and nothing else in these files, and name them in your commit body:

| File | Owner | Your edit |
| --- | --- | --- |
| `packages/kernel/src/diagnostic.ts` | WP02 | add `"archetype.applies-to-empty"` to `DiagnosticCode` and `SEVERITY`; "seventeen" → "eighteen" in the `DiagnosticCode` contract comment (T131) |
| `packages/kernel/test/diagnostic.test.ts` | WP02 | add the code to `ALL_CODES`; the test name and the `others` count (T130) |
| `packages/kernel/src/model.ts` | WP04 | the step 2 check, the `readonlyMap` wrapping in step 6, and the `buildModel` contract text (T131, T133) |
| `.grace/graph/kernel-model.xml`, `.grace/verification/kernel-model.xml` | WP04 | add the `readonly-map.ts` path and the two new test files (T136) |
| `packages/kernel/src/closure.ts` | WP08 | the `closure.unparsable` code, the per-file catch, and the module map line (T135) |
| `.grace/verification/kernel-closure.xml` | WP08 | add the new test file, a scenario and the trace (T136) |

The `move-task` auto-commit refuses files outside `owned_files`, so commit the sanctioned edits yourself (with your owned files) before you run `move-task`.

## GRACE synchronisation (part of this WP)

Every source and test file you create carries GRACE markup, and the changed modules stay registered in their area documents in the same commit as the code. `bun run grace:lint` (`grace lint --path . --assertions current`) must pass.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## GRACE file markup

Every new `src/*.ts`, `bin/*.ts` and `scripts/*.ts` file starts with this header. Copy the shape from `scripts/review-gate.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: <one sentence>
//   SCOPE: <what the file contains and what it never does>
//   DEPENDS: <module ids, comma-separated, or none>
//   LINKS: <M-ID>, <V-M-ID>
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   <exportName> - <short description>      (one line per export, every export, in file order)
// END_MODULE_MAP
```

Each exported function, constant or class has a contract block right above it:

```ts
// START_CONTRACT: <exportName>
//   PURPOSE: ...
//   INPUTS: { name: type - meaning, ... }
//   OUTPUTS: { type - meaning }
//   SIDE_EFFECTS: none | <what>
//   LINKS: <M-ID>
// END_CONTRACT: <exportName>
```

Exported types and interfaces need only the MODULE_MAP line. Test files use `ROLE: TEST` and `MAP_MODE: LOCALS`, and list their local helpers in the map. A test file with no local helpers has exactly one map line `(none) - no local helpers`, with the parentheses. Never write `none - no local helpers`: `grace lint` reads the leading identifier of each map line as a symbol name, so a bare `none` counts as a helper that does not exist and fails with `markup.module-map-mismatch`. `(none)` does not start with an identifier, so it keeps the map non-empty (no `markup.module-map-missing`) without naming a symbol. Optional named regions use `// START_BLOCK_<NAME>` / `// END_BLOCK_<NAME>`. The guides quote these regions (contracts/docs.md).

Lint rules that were confirmed while planning (they fail the gate when ignored):

- `START_MODULE_MAP` lists **every** export of the file, one line each (types and interfaces too), in file order.
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or exactly one line `(none) - no local helpers` (with the parentheses; a bare `none` fails `grace lint` with `markup.module-map-mismatch`).
- Every `<File>` in a verification entry must exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

No module id is added or removed, so `.grace/graph/index.xml` and `.grace/verification/index.xml` do not change.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP22 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T130 – Failing tests for `archetype.applies-to-empty` and read-only model maps

**1. `packages/kernel/test/diagnostic.test.ts`** (sanctioned edit, WP02's file). Make exactly three changes:

- In `ALL_CODES`, add the line `"archetype.applies-to-empty",` right after `"composition.archetype-id-conflict",`.
- Rename the test `"has exactly the seventeen codes of DiagnosticCode"` to `"has exactly the eighteen codes of DiagnosticCode"`.
- In the test `"gives error for every other code"`, change `expect(others.length).toBe(15);` to `expect(others.length).toBe(16);`.

**2. Create `packages/kernel/test/model-hardening.test.ts`.** Header (copy exactly; the helper map line names the one local helper):

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that buildModel reports an Archetype with an empty appliesTo list and that the maps of the semantic model are read-only at runtime.
//   SCOPE: Tests of the archetype.applies-to-empty check and of the read-only loci, extensions and archetypes maps of model.ts. Out: the other diagnostics (model.test.ts, model-relations.test.ts) and readonlyMap itself (readonly-map.test.ts).
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DEFINITIONS, M-KERNEL-DIAGNOSTIC
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   withCode - the diagnostics of a model that carry one code
// END_MODULE_MAP
```

Imports: `describe, expect, test` from `"bun:test"`; `Archetype` from `"../src/archetype"`; `type Diagnostic, type DiagnosticCode` from `"../src/diagnostic"`; `Extension` from `"../src/extension"`; `Locus` from `"../src/locus"`; `buildModel, hasErrors, type ModelLocus, type SemanticModel` from `"../src/model"`.

```ts
function withCode(
  model: SemanticModel,
  code: DiagnosticCode,
): ReadonlyArray<Diagnostic> {
  return model.diagnostics.filter((d) => d.code === code);
}
```

`describe("archetype.applies-to-empty", ...)` with these tests (names exactly as written):

- `"archetype.applies-to-empty is reported for every Locus whose kind has the archetype"`:
  ```ts
  const empty = Archetype.make({ id: "x.empty", description: "d", appliesTo: [], rules: [] });
  const ext = Extension.make("x.ext", { description: "d", archetypes: [empty] });
  const Kind = Locus.extend(ext);
  const model = buildModel(
    Locus.make({
      id: "app:root",
      contains: [Kind.make({ id: "app:b" }), Kind.make({ id: "app:a" })],
    }),
  );
  ```
  Expect `withCode(model, "archetype.applies-to-empty")` to equal exactly:
  ```ts
  [
    { code: "archetype.applies-to-empty", severity: "error", subject: "app:a", path: "kind", members: ["x.empty"], message: "Archetype x.empty of extension x.ext has an empty appliesTo list, so it would apply to every Locus." },
    { code: "archetype.applies-to-empty", severity: "error", subject: "app:b", path: "kind", members: ["x.empty"], message: "Archetype x.empty of extension x.ext has an empty appliesTo list, so it would apply to every Locus." },
  ]
  ```
  and `hasErrors(model)` to be `true`. `app:root` (plain `Locus`) gets no such diagnostic.
- `"archetype.applies-to-empty is not reported when appliesTo names an extension"`: the same tree with `appliesTo: ["x.ext"]`. Expect `withCode(...)` to equal `[]` and `model.diagnostics` to equal `[]`.
- `"archetype.applies-to-empty is reported once per Locus when an extension lists the same archetype twice"`: `Extension.make("x.ext", { description: "d", archetypes: [empty, empty] })` on one Locus `app:a` inside `app:root`. Expect exactly one `archetype.applies-to-empty` diagnostic (subject `app:a`).
- `"archetype.applies-to-empty names the extension that declares the archetype"`: two extensions `x.one` (archetype `x.first`, `appliesTo: []`) and `x.two` (archetype `x.second`, `appliesTo: ["x.two"]`) on `Locus.extend(one, two).make({ id: "app:a" })`. Expect exactly one diagnostic, with `members: ["x.first"]` and message `"Archetype x.first of extension x.one has an empty appliesTo list, so it would apply to every Locus."`.

`describe("read-only model maps", ...)` with one shared model built in each test as
`buildModel(Locus.make({ id: "app:root", contains: [Locus.extend(ext).make({ id: "app:a" })] }))`, where `ext = Extension.make("x.ext", { description: "d", archetypes: [Archetype.make({ id: "x.rule", description: "d", appliesTo: ["x.ext"], rules: [] })] })`:

- `"model.loci rejects set, delete and clear and stays unchanged"`:
  ```ts
  const loci = model.loci as unknown as Map<string, ModelLocus>;
  const before = [...model.loci.keys()];
  expect(() => loci.set("app:x", model.loci.get("app:a")!)).toThrow(new TypeError("SemanticModel maps are read-only."));
  expect(() => loci.delete("app:a")).toThrow(new TypeError("SemanticModel maps are read-only."));
  expect(() => loci.clear()).toThrow(new TypeError("SemanticModel maps are read-only."));
  expect([...model.loci.keys()]).toEqual(before);
  expect(model.loci.has("app:x")).toBe(false);
  ```
- `"model.extensions and model.archetypes reject set, delete and clear"`: the same three `toThrow` checks on `model.extensions as unknown as Map<string, unknown>` and on `model.archetypes as unknown as Map<string, unknown>`, then `model.extensions.get("x.ext")` is `ext` and `model.archetypes.has("x.rule")` is `true`.
- `"the model maps are frozen, are not Map instances and reject Map.prototype methods"`: for each of `model.loci`, `model.extensions`, `model.archetypes`: `Object.isFrozen(m)` is `true`; `m instanceof Map` is `false`; `expect(() => Map.prototype.set.call(m as never, "k", 1)).toThrow(TypeError)`.
- `"model.loci keeps the ids order and reads like a Map"`: `[...model.loci.keys()]` equals `model.ids`; `model.loci.size` equals `model.ids.length`; `model.loci.get("app:a")?.container` is `"app:root"`; `[...model.loci].map(([id]) => id)` equals `model.ids`.

Run `bun test packages/kernel/test/diagnostic.test.ts packages/kernel/test/model-hardening.test.ts` and see the new tests fail (typecheck errors on the new code also count as failing).

### T131 – Implement `archetype.applies-to-empty`

**`packages/kernel/src/diagnostic.ts`** (sanctioned edit, WP02's file). Exactly:

- In `export type DiagnosticCode =`, add the line `  | "archetype.applies-to-empty"` right after `  | "composition.archetype-id-conflict"`.
- In `SEVERITY`, add `  "archetype.applies-to-empty": "error",` right after `  "composition.archetype-id-conflict": "error",`.
- In the `START_CONTRACT: DiagnosticCode` block, change `one of the seventeen stable codes of the kernel contract` to `one of the eighteen stable codes of the kernel contract`.

Do not add comments inside the `DiagnosticCode` union: WP20 reads the text from `export type DiagnosticCode =` to the next `;` and collects every quoted code.

**`packages/kernel/src/model.ts`** (sanctioned edit, WP04's file). In `buildModel`, step 2 (`// Step 2: per-Locus checks in id order.`), add this block inside the `for (const id of ids)` loop, right after the loop over `Object.keys(def.capabilities)` that reports `capability.name-malformed`:

```ts
    for (const extension of def.kind.extensions) {
      for (const archetype of extension.archetypes) {
        if (archetype.appliesTo.length === 0) {
          diagnostics.push(
            makeDiagnostic({
              code: "archetype.applies-to-empty",
              subject: id,
              path: "kind",
              members: [archetype.id],
              message: `Archetype ${archetype.id} of extension ${extension.id} has an empty appliesTo list, so it would apply to every Locus.`,
            }),
          );
        }
      }
    }
```

Also change the `START_CONTRACT: buildModel` OUTPUTS line to
`//   OUTPUTS: { SemanticModel - frozen model with read-only maps; diagnostics sorted by sortDiagnostics; never throws for definitions made by a LocusKind's make }`.

Run the T130 `archetype.applies-to-empty` tests and the existing `packages/kernel/test/model.test.ts` (its `composition.archetype-id-conflict` test uses `appliesTo: []` but filters by code, so it stays green).

### T132 – Failing tests for `readonlyMap`

Create `packages/kernel/test/readonly-map.test.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that readonlyMap reads like a Map in insertion order, copies its entries, is frozen and rejects every mutation.
//   SCOPE: Tests of readonly-map.ts only. Out: the semantic model that uses it (model-hardening.test.ts).
//   DEPENDS: M-KERNEL-MODEL
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { readonlyMap } from "../src/readonly-map";
```

`describe("readonlyMap", ...)` with these tests (names exactly as written), each starting from `const m = readonlyMap([["b", 2], ["a", 1], ["c", 3]] as const);` unless stated:

- `"reads like a Map in insertion order"`: `m.size` is `3`; `m.get("a")` is `1`; `m.get("z")` is `undefined`; `m.has("c")` is `true`; `m.has("z")` is `false`; `[...m.keys()]` equals `["b", "a", "c"]`; `[...m.values()]` equals `[2, 1, 3]`; `[...m.entries()]` and `[...m]` both equal `[["b", 2], ["a", 1], ["c", 3]]`.
- `"forEach passes value, key and the read-only map, with thisArg"`: collect `this`, value, key and the third argument of `m.forEach(function (this: unknown, value, key, map) { ... }, marker)` with `const marker = { name: "marker" }`; expect the calls `[[2, "b"], [1, "a"], [3, "c"]]`, every `this` to be `marker` and every third argument to be `m` (`toBe`).
- `"copies its entries so later changes of the source do not show"`: `const source = new Map([["a", 1]]); const view = readonlyMap(source); source.set("b", 2); source.delete("a");` then `[...view]` equals `[["a", 1]]`.
- `"keeps the first position of a repeated key with the last value"`: `readonlyMap([["a", 1], ["b", 2], ["a", 3]])` gives `[...view]` equal to `[["a", 3], ["b", 2]]`.
- `"set, delete and clear throw and change nothing"`: cast with `const mutable = m as unknown as Map<string, number>;`; each of `mutable.set("d", 4)`, `mutable.delete("a")` and `mutable.clear()` throws `new TypeError("SemanticModel maps are read-only.")` (use `toThrow(new TypeError("SemanticModel maps are read-only."))`); afterwards `[...m]` still equals `[["b", 2], ["a", 1], ["c", 3]]`.
- `"is frozen with a frozen prototype"`: `Object.isFrozen(m)` and `Object.isFrozen(Object.getPrototypeOf(m))` are `true`; `expect(() => { (m as unknown as { extra: number }).extra = 1; }).toThrow(TypeError);` (test files are ES modules, so strict mode throws).
- `"is not a Map and rejects Map.prototype methods"`: `m instanceof Map` is `false`; `Object.prototype.toString.call(m)` is `"[object ReadonlyMap]"`; `expect(() => Map.prototype.set.call(m as never, "d", 4)).toThrow(TypeError)`; `expect(() => Map.prototype.get.call(m as never, "a")).toThrow(TypeError)`.
- `"an empty view has size 0"`: `readonlyMap([]).size` is `0` and `[...readonlyMap([])]` equals `[]`.

Run `bun test packages/kernel/test/readonly-map.test.ts` and see it fail (the module does not exist yet).

### T133 – Implement `readonly-map.ts` and wrap the model maps

Create `packages/kernel/src/readonly-map.ts` with exactly this content (then run `bun run format`):

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Provide a Map view that reads like a Map but can never be changed, so the maps of the semantic model are read-only at runtime and not only in their type.
//   SCOPE: readonlyMap. Out: the semantic model itself (model.ts); never exported from index.ts.
//   DEPENDS: none
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   readonlyMap - copies entries into a frozen read-only Map view whose set, delete and clear throw
// END_MODULE_MAP

const READ_ONLY_MESSAGE = "SemanticModel maps are read-only.";

// A frozen view over a private Map. Nothing outside this class can reach the inner Map.
class ReadonlyMapView<K, V> implements ReadonlyMap<K, V> {
  readonly #inner: Map<K, V>;

  constructor(entries: Iterable<readonly [K, V]>) {
    this.#inner = new Map(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.#inner.size;
  }

  get(key: K): V | undefined {
    return this.#inner.get(key);
  }

  has(key: K): boolean {
    return this.#inner.has(key);
  }

  forEach(
    callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#inner.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  keys() {
    return this.#inner.keys();
  }

  values() {
    return this.#inner.values();
  }

  entries() {
    return this.#inner.entries();
  }

  [Symbol.iterator]() {
    return this.#inner.entries();
  }

  get [Symbol.toStringTag](): string {
    return "ReadonlyMap";
  }

  set(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }

  delete(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }

  clear(): never {
    throw new TypeError(READ_ONLY_MESSAGE);
  }
}

Object.freeze(ReadonlyMapView.prototype);

// START_CONTRACT: readonlyMap
//   PURPOSE: Copy entries into a frozen Map view that supports every ReadonlyMap read and throws on set, delete and clear.
//   INPUTS: { entries: Iterable<readonly [K, V]> - the entries in the order they are kept }
//   OUTPUTS: { ReadonlyMap<K, V> - a frozen view, not a Map instance; set, delete and clear throw TypeError("SemanticModel maps are read-only.") }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-MODEL
// END_CONTRACT: readonlyMap
/** A read-only copy of the entries. Mutating methods throw instead of changing it. */
export function readonlyMap<K, V>(
  entries: Iterable<readonly [K, V]>,
): ReadonlyMap<K, V> {
  return new ReadonlyMapView(entries);
}
```

If `bun run typecheck` or `bun run lint` rejects this file, report the exact message and make the smallest change that keeps every T132 test as written; do not weaken a test.

**`packages/kernel/src/model.ts`** (sanctioned edit, WP04's file):

- Add `import { readonlyMap } from "./readonly-map";` to the imports (keep the import order that `bun run format`/`bun run lint` accept).
- In the object returned at the end of `buildModel` (step 6), replace `loci,` with `loci: readonlyMap(loci),`, `extensions: sortedExtensions,` with `extensions: readonlyMap(sortedExtensions),` and `archetypes: sortedArchetypes,` with `archetypes: readonlyMap(sortedArchetypes),`. Nothing else in step 6 changes.

`readonly-map.ts` is part of the module `M-KERNEL-MODEL`, so `model.ts`'s `DEPENDS` line does not change. Do **not** export `readonlyMap` from `packages/kernel/src/index.ts` (WP09's file): the public export list is fixed by the contract and checked by `api.test.ts`.

Run `bun test packages/kernel/test` (every kernel test, including WP05–WP09 tests that read `model.loci`, `model.extensions` and `model.archetypes`, must stay green).

### T134 – Failing tests for `closure.unparsable`

Create `packages/kernel/test/closure-unparsable.test.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that checkClosure reports a file it cannot read or parse as closure.unparsable and continues with the next file instead of failing.
//   SCOPE: Tests of the closure.unparsable finding of closure.ts over temporary fixture repositories. Out: the other closure codes (closure.test.ts).
//   DEPENDS: M-KERNEL-CLOSURE, M-KERNEL-MODEL, M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-CLOSURE, V-M-KERNEL-CLOSURE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Owned - the test kind with the source extension
//   created - the fixture directories to remove after each test
//   fixture - writes the files of a fixture repository into a new temporary directory
//   check - runs checkClosure over a built model of the fixture repository
//   withCode - the findings of a report that carry one closure code
// END_MODULE_MAP

import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Effect } from "effect";
import {
  checkClosure,
  hasClosureErrors,
  type ClosureCode,
  type ClosureFinding,
  type ClosureOptions,
  type ClosureReport,
} from "../src/closure";
import { Locus, type LocusDefinition } from "../src/locus";
import { buildModel } from "../src/model";
import { Source } from "../src/extensions/source";

const Owned = Locus.extend(Source);

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "telos-closure-unparsable-"));
  created.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  return dir;
}

function check(
  model: LocusDefinition,
  root: string,
  options: Partial<ClosureOptions> = {},
): Promise<ClosureReport> {
  return Effect.runPromise(
    checkClosure(buildModel(model), { root, include: ["**/*.ts"], ...options }),
  );
}

function withCode(
  report: ClosureReport,
  code: ClosureCode,
): ReadonlyArray<ClosureFinding> {
  return report.findings.filter((f) => f.code === code);
}
```

The model in every test is `Owned.make({ id: "app:a", properties: { sources: ["a/**"] } })` (the root itself; it owns every fixture file under `a/`, `.ts` and `.tsx`). Use the single glob `"a/**"`: a second glob that matches no file would add a `closure.empty-claim` warning and break the "`report.findings` equals `[]`" assertion.

`describe("closure.unparsable", ...)` with these tests (names exactly as written). "The finding for `<file>`" means exactly
`{ code: "closure.unparsable", severity: "error", file: "<file>", loci: ["app:a"], detail: "parse", message: "<file> could not be parsed, so its imports were not checked.", knowledge: "derived" }`.

| Test name | Fixture and options | Expected |
| --- | --- | --- |
| `"closure.unparsable is reported for a file that does not parse"` | `a/bad.ts` = `"const = ;\n"` | `withCode(report, "closure.unparsable")` equals `[the finding for a/bad.ts]`; `hasClosureErrors(report)` is `true`; `report.files` equals `[{ file: "a/bad.ts", owner: "app:a" }]` |
| `"closure.unparsable is reported for a .tsx file that does not parse"` | `a/view.tsx` = `"export const a = <div>;\n"`, options `{ include: ["**/*.tsx"] }` | equals `[the finding for a/view.tsx]` |
| `"closure.unparsable is reported for a file that cannot be read"` | `a/locked.ts` = `"export const x = 1;\n"`, then `chmodSync(join(dir, "a/locked.ts"), 0o000)`, then the precondition `expect(() => readFileSync(join(dir, "a/locked.ts"), "utf8")).toThrow()` (it fails loudly if the tests run as root, which can read any file) | equals `[the finding for a/locked.ts]` |
| `"closure.unparsable does not stop the check of the next file"` | `a/bad.ts` = `"const = ;\n"`, `a/next.ts` = `"import \"./missing\";\n"` | `withCode(report, "closure.unparsable")` equals `[the finding for a/bad.ts]`, and `withCode(report, "closure.unresolved-import")` has exactly one finding with `file: "a/next.ts"` and `detail: "./missing"` |
| `"closure.unparsable and closure.dynamic-import are both reported for a file that was read but does not parse"` | `a/both.ts` = `"const m = await import(name);\nconst = ;\n"` | `withCode(report, "closure.unparsable")` equals `[the finding for a/both.ts]`; `withCode(report, "closure.dynamic-import")` has exactly one finding with `file: "a/both.ts"` |
| `"closure.unparsable is not reported for a file that parses"` | `a/ok.ts` = `"export const ok = 1;\n"` | `withCode(report, "closure.unparsable")` equals `[]` and `report.findings` equals `[]` |

`check` must resolve in every test: a rejected promise (the current behaviour, where `scanImports` or `readFileSync` throws inside `Effect.sync`) fails the test. Run `bun test packages/kernel/test/closure-unparsable.test.ts` and see the reported tests fail.

### T135 – Implement `closure.unparsable`

**`packages/kernel/src/closure.ts`** (sanctioned edit, WP08's file). Exactly:

1. `ClosureCode`: add `  | "closure.unparsable"` as the last member, after `  | "closure.dynamic-import"`.
2. `START_MODULE_MAP`: change `ClosureCode - the seven closure finding codes` to `ClosureCode - the eight closure finding codes`.
3. Add three private helpers (no `export`, so no map line) next to the other private helpers, for example right before `// START_CONTRACT: checkClosure`:

   ```ts
   // Reads a file as UTF-8, or returns null when it cannot be read.
   function readText(absolute: string): string | null {
     try {
       return readFileSync(absolute, "utf8");
     } catch {
       return null;
     }
   }

   // Lists the import specifiers of a file, or returns null when the file does not parse.
   function scanSpecifiers(file: string, text: string): ReadonlyArray<string> | null {
     const transpiler = new Bun.Transpiler({
       loader: file.endsWith(".tsx") ? "tsx" : "ts",
     });
     try {
       return transpiler.scanImports(text).map((entry) => entry.path);
     } catch {
       return null;
     }
   }

   function unparsable(file: string, owner: string): ClosureFinding {
     return {
       code: "closure.unparsable",
       severity: "error",
       file,
       loci: [owner],
       detail: "parse",
       message: `${file} could not be parsed, so its imports were not checked.`,
       knowledge: "derived",
     };
   }
   ```

4. In `computeClosure`, in the loop `// Step 4 and 5: imports and dynamic imports of owned files.`:
   - Replace `const text = readFileSync(posix.join(root, file), "utf8");` with
     ```ts
     const text = readText(posix.join(root, file));
     if (text === null) {
       findings.push(unparsable(file, owner));
       continue;
     }
     ```
   - Keep the `closure.dynamic-import` block unchanged, right after it.
   - Replace the `const transpiler = new Bun.Transpiler({ ... });` statement with
     ```ts
     const specifiers = scanSpecifiers(file, text);
     if (specifiers === null) {
       findings.push(unparsable(file, owner));
       continue;
     }
     ```
   - Keep the `const ctx: FileContext = { ... };` statement unchanged, and replace
     `for (const entry of transpiler.scanImports(text)) { checkImport(ctx, entry.path); }` with
     `for (const specifier of specifiers) { checkImport(ctx, specifier); }`.
5. In the `START_CONTRACT: checkClosure` block, change the OUTPUTS line to
   `//   OUTPUTS: { Effect<ClosureReport> - the frozen report with scope, files, findings, limits and knowledge; a file that cannot be read or parsed becomes a closure.unparsable finding, never a failure }`.

`CLOSURE_LIMITS` does not change. Run `bun test packages/kernel/test/closure.test.ts packages/kernel/test/closure-unparsable.test.ts`.

### T136 – GRACE and the full gate

These area documents already exist (written by WP04 and WP08). Change them exactly as follows. If the current file is not the "current" text below, stop and report it.

`.grace/graph/kernel-model.xml`: add `<Path>packages/kernel/src/readonly-map.ts</Path>` on the line after `<Path>packages/kernel/src/model.ts</Path>`. Result:

```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-KERNEL-MODEL>
    <M-KERNEL-MODEL>
      <Summary>Builds a checked semantic model from a root Locus and reports structural diagnostics.</Summary>
      <Path>packages/kernel/src/model.ts</Path>
      <Path>packages/kernel/src/readonly-map.ts</Path>
      <M-KERNEL-DEFINITIONS />
      <M-KERNEL-DIAGNOSTIC />
      <M-KERNEL-IDENTITY />
    </M-KERNEL-MODEL>
  </GD-KERNEL-MODEL>
</GraceGraphDocument>
```

`.grace/verification/kernel-model.xml`, current:

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-MODEL>
    <V-M-KERNEL-MODEL>
      <TestFiles>
        <File>packages/kernel/test/model.test.ts</File>
        <File>packages/kernel/test/model-relations.test.ts</File>
        <File>packages/kernel/test/model-determinism.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/model.test.ts packages/kernel/test/model-relations.test.ts packages/kernel/test/model-determinism.test.ts</Command>
      <Scenario>Each structural diagnostic code is reported for its rule and not reported when the rule holds, with the exact contract message. The Locus tree is traversed in array order, and a shared Locus object is reported as ownership.multiple. Relations are checked, cycles of acyclic types are found with the cycle limit, and the model is frozen, sorted and independent of contains order.</Scenario>
      <TraceAssertion>model.test.ts names the identity, ownership, composition, property, capability and ancestor tests. model-relations.test.ts names the relation, cycle, ordering and incoming and outgoing tests. model-determinism.test.ts names the contains-order and repeat-call determinism tests.</TraceAssertion>
    </V-M-KERNEL-MODEL>
  </VD-KERNEL-MODEL>
</GraceVerificationDocument>
```

Result:

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-MODEL>
    <V-M-KERNEL-MODEL>
      <TestFiles>
        <File>packages/kernel/test/model.test.ts</File>
        <File>packages/kernel/test/model-relations.test.ts</File>
        <File>packages/kernel/test/model-determinism.test.ts</File>
        <File>packages/kernel/test/model-hardening.test.ts</File>
        <File>packages/kernel/test/readonly-map.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/model.test.ts packages/kernel/test/model-relations.test.ts packages/kernel/test/model-determinism.test.ts packages/kernel/test/model-hardening.test.ts packages/kernel/test/readonly-map.test.ts</Command>
      <Scenario>Each structural diagnostic code is reported for its rule and not reported when the rule holds, with the exact contract message. The Locus tree is traversed in array order, and a shared Locus object is reported as ownership.multiple. Relations are checked, cycles of acyclic types are found with the cycle limit, and the model is frozen, sorted and independent of contains order.</Scenario>
      <Scenario>An Archetype with an empty appliesTo list is reported as archetype.applies-to-empty for every Locus whose kind has it, and the loci, extensions and archetypes maps of the model are read-only at runtime: set, delete and clear throw and change nothing.</Scenario>
      <TraceAssertion>model.test.ts names the identity, ownership, composition, property, capability and ancestor tests. model-relations.test.ts names the relation, cycle, ordering and incoming and outgoing tests. model-determinism.test.ts names the contains-order and repeat-call determinism tests. model-hardening.test.ts names the reported and not-reported archetype.applies-to-empty tests and the read-only model map tests. readonly-map.test.ts names the readonlyMap read, order, copy, frozen and mutation tests.</TraceAssertion>
    </V-M-KERNEL-MODEL>
  </VD-KERNEL-MODEL>
</GraceVerificationDocument>
```

`.grace/verification/kernel-closure.xml`, result (the current file is the same without the second `<File>`, without the second `<Scenario>`, with the shorter `<Command>` and with the trace ending at "...and hasClosureErrors tests."):

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-CLOSURE>
    <V-M-KERNEL-CLOSURE>
      <TestFiles>
        <File>packages/kernel/test/closure.test.ts</File>
        <File>packages/kernel/test/closure-unparsable.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/closure.test.ts packages/kernel/test/closure-unparsable.test.ts</Command>
      <Scenario>Each closure code is reported exactly when its rule fails, with the exact finding fields and message, and not reported when the rule holds. Scope, claims, owners, relative, alias, workspace and asset resolution, externals, dynamic imports, limits, the report shape, determinism and hasClosureErrors are checked over temporary fixture repositories.</Scenario>
      <Scenario>A file that cannot be read or does not parse gives one closure.unparsable error finding, and the check continues with the next file instead of failing.</Scenario>
      <TraceAssertion>closure.test.ts names one reported and one not-reported test per closure code (closure.unowned, closure.ambiguous, closure.empty-claim, closure.undeclared-dependency, closure.unknown-external, closure.unresolved-import, closure.dynamic-import), and the report, determinism and hasClosureErrors tests. closure-unparsable.test.ts names the reported and not-reported closure.unparsable tests.</TraceAssertion>
    </V-M-KERNEL-CLOSURE>
  </VD-KERNEL-CLOSURE>
</GraceVerificationDocument>
```

`.grace/graph/kernel-closure.xml`, `.grace/verification/kernel-base.xml` and both index files do not change.

Then run, in this order, and report each result exactly: `bun run format`, `bun run grace:lint`, `bun test packages/kernel/test`, `bun run verify`.

Commit everything (owned files and the sanctioned edits) in one or more commits, for example `fix(kernel): report empty appliesTo, unparsable closure files and make model maps read-only`, with a body that names the sanctioned edits to `diagnostic.ts`, `diagnostic.test.ts`, `model.ts`, `closure.ts`, `kernel-model.xml` (graph and verification) and `kernel-closure.xml`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] `DiagnosticCode` has eighteen codes and `SEVERITY` gives `archetype.applies-to-empty` the severity `error`; `ClosureCode` has eight codes.
- [ ] `archetype.applies-to-empty` and `closure.unparsable` each have reported and not-reported tests whose names name the code (NFR-005).
- [ ] `(model.loci as Map).set(...)`, `.delete(...)` and `.clear()` throw for `loci`, `extensions` and `archetypes`; `readonlyMap` is not exported from `src/index.ts`.
- [ ] `checkClosure` resolves for unreadable and unparsable files; it never rejects because of a file.
- [ ] Every new or changed source and test file carries GRACE markup; the kernel-model and kernel-closure area documents list the new path and test files.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly).
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP22 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- `chmod 0o000` does not stop root from reading a file. The precondition in the read-failure test makes that visible instead of letting the test pass for the wrong reason. Never run the tests with `sudo`.
- Fixture directories live only in the OS temp directory; never write them into the repository.
- WP05–WP09 code reads `model.loci`, `model.extensions` and `model.archetypes` with `get`, `has`, `keys`, `values`, `entries`, `forEach`, spread and `for…of`. The view supports all of them. If any kernel test fails after T133 because code relies on `instanceof Map` or on mutating a model map, stop and report the file and line; do not change that WP's file.
- Do not put comments or other quoted strings between `export type DiagnosticCode =` and its `;`.

## Reviewer guidance

- Messages and the `TypeError` text match the "Exact texts" table character for character.
- The edits to WP02, WP04 and WP08 files are exactly the listed ones (`git diff` of those files against the base).
- `readonly-map.ts` has no imports, and `packages/kernel/src/index.ts` does not export `readonlyMap`.
- Each new test checks the full finding or diagnostic object, not just its code.

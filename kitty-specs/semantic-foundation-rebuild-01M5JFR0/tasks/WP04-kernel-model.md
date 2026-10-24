---
work_package_id: WP04
title: Kernel semantic model and structural diagnostics
dependencies:
- WP03
requirement_refs:
- FR-005
- FR-006
- FR-008
- NFR-002
- NFR-005
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T019
- T020
- T021
- T022
- T023
- T024
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/model.ts
create_intent:
- packages/kernel/src/model.ts
- packages/kernel/test/model.test.ts
- packages/kernel/test/model-relations.test.ts
- packages/kernel/test/model-determinism.test.ts
- .grace/graph/kernel-model.xml
- .grace/verification/kernel-model.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/model.ts
- packages/kernel/test/model.test.ts
- packages/kernel/test/model-relations.test.ts
- packages/kernel/test/model-determinism.test.ts
- .grace/graph/kernel-model.xml
- .grace/verification/kernel-model.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – Kernel semantic model and structural diagnostics

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

Implement `buildModel` and its helpers in `packages/kernel/src/model.ts`: a checked, frozen `SemanticModel` built from a root Locus, with every structural diagnostic code of the data model. WP03 created `model.ts` with the three interfaces only; keep them unchanged and add the functions and the GRACE markup.

`buildModel` never throws. Every problem becomes a `Diagnostic` made with `makeDiagnostic` (WP02, `./diagnostic`).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## model.ts (WP04)

```ts
export interface ModelLocus {
  readonly definition: LocusDefinition
  readonly container: string | null
  readonly contains: ReadonlyArray<string>     // ids, sorted
  readonly depth: number                       // root = 0
}
export interface ModelRelation {
  readonly from: string
  readonly type: RelationType
  readonly target: RelationTarget
  readonly index: number                       // index in the source Locus's relations array
  readonly valid: boolean                      // false when any relation.* error was reported for it
}
export interface SemanticModel {
  readonly root: string
  readonly ids: ReadonlyArray<string>                       // all Locus ids, sorted (UTF-16)
  readonly loci: ReadonlyMap<string, ModelLocus>
  readonly relations: ReadonlyArray<ModelRelation>          // sorted by from, type.id, relationTargetKey(target), index
  readonly extensions: ReadonlyMap<string, Extension>       // first extension object seen per id, over all kinds
  readonly archetypes: ReadonlyMap<string, Archetype>       // first archetype object seen per id, over all kinds
  readonly diagnostics: ReadonlyArray<Diagnostic>           // sortDiagnostics output
}
export function buildModel(root: LocusDefinition): SemanticModel
export function incoming(model: SemanticModel, target: string): ReadonlyArray<ModelRelation>
// relations whose target.locus === target (Locus or capability targets), valid only, sorted as in model.relations
export function outgoing(model: SemanticModel, from: string): ReadonlyArray<ModelRelation>
export function ancestors(model: SemanticModel, id: string): ReadonlyArray<string> // nearest container first
export function hasErrors(model: SemanticModel): boolean  // any diagnostic with severity "error"
```

Algorithm:

1. Iterative depth-first traversal from `root`, visiting `contains` in array order, with a `Set` of visited objects.
   - A Locus object reached a second time gets `ownership.multiple` (subject = its id, members = [first container id, second container id]) and is not traversed again.
   - The first registration of an id wins. A different object with the same id gets `identity.duplicate` (members = []).
2. For every registered Locus:
   - `isLocusId` → `identity.malformed`.
   - Each kind conflict becomes a `composition.*` diagnostic (subject = Locus id, path = "kind", members = conflict.extensions, message names conflict.subject).
   - `propertyIssues` non-empty → one `property.invalid` (path = "properties", message lists the issues as `path: message` joined with "; ").
   - Each capability name failing `isCapabilityName` → `capability.name-malformed` (path = `capabilities/<name>`).
3. Relations, for each Locus and each relation index `i`, with path `relations/<i>`:
   - The type object is not in `kind.relationTypes` → `relation.type-unavailable`.
   - The target Locus is missing → `relation.target-missing`.
   - `type.target === "capability"` while `target.capability === null`, or the reverse → `relation.target-kind`.
   - The capability is missing on an existing target → `relation.capability-missing`.
   - `target.capability === null && target.locus === from` → `relation.self`.
   - The same `(type.id, relationTargetKey)` seen earlier on this Locus → `relation.duplicate` (warning; the relation is still valid).
4. Cycles:
   - For each relation type id with `acyclic: true`, build edges from valid relations of that type (Locus targets only) and call `elementaryCycles`.
   - Each cycle → `relation.cycle` (subject = first member, path = "relations", members = the cycle, message `"<type> cycle: a -> b -> a."`).
   - `exceeded` → one `relation.cycle-limit` (subject = root id, members = [type id]).
5. `model.extensions` and `model.archetypes` collect all kinds' extensions and archetypes (first per id).
6. Diagnostics go through `sortDiagnostics`. The model object is frozen (the maps are wrapped as read-only and never exposed for mutation).

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/data-model.md` (authoritative).

## Diagnostic codes

| Code | Severity | Subject | Raised when |
| --- | --- | --- | --- |
| `identity.malformed` | error | the id | a Locus id fails `isLocusId` |
| `identity.duplicate` | error | the id | two different Locus objects have the same id |
| `ownership.multiple` | error | the contained Locus id | the same Locus object is contained by more than one container |
| `composition.extension-id-conflict` | error | Locus id | two different extension objects with the same id in a kind |
| `composition.property-conflict` | error | Locus id | two different extensions define the same property name |
| `composition.relation-type-conflict` | error | Locus id | two different RelationType objects with the same id in a kind |
| `composition.archetype-id-conflict` | error | Locus id | two different Archetype objects with the same id in a kind |
| `property.invalid` | error | Locus id | properties do not decode against the merged schema |
| `capability.name-malformed` | error | Locus id | a capability name fails `isCapabilityName` |
| `relation.type-unavailable` | error | Locus id | the relation type is not declared by the Locus kind's extensions |
| `relation.target-missing` | error | Locus id | the target Locus id is not in the model |
| `relation.capability-missing` | error | Locus id | the target Locus has no such capability |
| `relation.target-kind` | error | Locus id | a capability target for a `"locus"` type, or the reverse |
| `relation.self` | error | Locus id | the target Locus is the source Locus |
| `relation.duplicate` | warning | Locus id | the same type and target appear twice on one Locus |
| `relation.cycle` | error | the smallest member id | a cycle in an acyclic relation type |
| `relation.cycle-limit` | warning | root id | more than 100 cycles exist |

Modules you use (all exist from WP02 and WP03): `isLocusId`, `isCapabilityName` (`./identity`); `makeDiagnostic`, `sortDiagnostics`, `Diagnostic` (`./diagnostic`); `elementaryCycles` (`./cycles`); `relationTargetKey`, `RelationType`, `RelationTarget` (`./relation`); `LocusDefinition` (`./locus`); `Extension` (`./extension`); `Archetype` (`./archetype`).

### Exact messages

Use these message templates exactly (angle brackets are replaced, quotes are literal):

| Code | Path | Members | Message |
| --- | --- | --- | --- |
| `identity.malformed` | `id` | `[]` | `Locus id "<id>" does not match the identity grammar.` |
| `identity.duplicate` | `id` | `[]` | `Locus id <id> is declared by two different Locus objects.` |
| `ownership.multiple` | `contains` | `[<first container>, <second container>]` | `Locus <id> is contained by both <first> and <second>.` |
| `composition.extension-id-conflict` | `kind` | `conflict.extensions` | `Two different extensions share the id <subject>.` |
| `composition.property-conflict` | `kind` | `conflict.extensions` | `Extensions <a> and <b> both define property <subject>.` |
| `composition.relation-type-conflict` | `kind` | `conflict.extensions` | `Extensions <a> and <b> both define relation type <subject>.` |
| `composition.archetype-id-conflict` | `kind` | `conflict.extensions` | `Extensions <a> and <b> both define archetype <subject>.` |
| `property.invalid` | `properties` | `[]` | `Properties of <id> are invalid: <issues>.` where `<issues>` is each issue formatted as `` `${issue.path.join(".")}: ${issue.message}` ``, joined with `"; "` |
| `capability.name-malformed` | `capabilities/<name>` | `[]` | `Capability name "<name>" does not match the capability name grammar.` |
| `relation.type-unavailable` | `relations/<i>` | `[]` | `Relation type <type id> is not declared by any extension of <id>.` |
| `relation.target-missing` | `relations/<i>` | `[]` | `Relation target <target locus> is not in the model.` |
| `relation.capability-missing` | `relations/<i>` | `[]` | `Locus <target locus> has no capability <capability>.` |
| `relation.target-kind` | `relations/<i>` | `[]` | `Relation type <type id> needs a <type.target> target, got <relationTargetKey(target)>.` |
| `relation.self` | `relations/<i>` | `[]` | `Locus <id> relates to itself with <type id>.` |
| `relation.duplicate` | `relations/<i>` | `[]` | `Relation <type id> to <relationTargetKey(target)> is declared more than once.` |
| `relation.cycle` | `relations` | the cycle | `<type id> cycle: <members joined with " -> "> -> <first member>.` |
| `relation.cycle-limit` | `relations` | `[<type id>]` | `More than 100 cycles exist for <type id>; only the first 100 are reported.` |

The subject is the Locus id in every row, except `relation.cycle` (the first cycle member) and `relation.cycle-limit` (the root id). For a property issue with an empty path, the text is `: <message>` (empty path joined).

Examples: `relation.cycle` for type `demo.flows-to` and cycle `["a:x","a:y"]` has the message `demo.flows-to cycle: a:x -> a:y -> a:x.`; `property.invalid` for `{ purpose: 3 }` has `Properties of app:x are invalid: purpose: Expected string.`

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

**Sanctioned edits outside `owned_files`**: none.

## GRACE synchronisation (part of this WP)

Every source and test file you create carries GRACE markup, and your modules are registered in **your own** area documents in the same commit as the code. `bun run grace:lint` (`grace lint --path . --assertions current`) must pass.

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

## GRACE graph and verification layout (created by WP01)

WP01 replaces `graph/main.xml` and `verification/main.xml` with one document per area:

- It moves the existing modules unchanged into `tooling`, `legacy` and `docs`.
- It creates the other documents empty with `<Owns />`.
- It rewrites both index files to list every document.

A WP edits **only** its own area documents and its own `<GD-…>` / `<VD-…>` block in `graph/index.xml` and `verification/index.xml`.

| Area | Graph doc / id | Verification doc / id | Owner WP | Modules (graph id → paths) |
| --- | --- | --- | --- | --- |
| tooling | `graph/tooling.xml` `GD-TOOLING` | `verification/tooling.xml` `VD-TOOLING` | WP01 (move), WP15, WP20 | `M-BUN-VERSION-GUARD`, `M-REVIEW-GATE` (moved); WP15: `M-REPOSITORY-MODEL` → `telos.ts`, `M-TELOS-COMMAND` → `scripts/telos.ts` |
| legacy | `graph/legacy.xml` `GD-LEGACY` | `verification/legacy.xml` `VD-LEGACY` | WP01 (move), WP20 (delete) | the six `M-LOCUS-*` modules (moved) |
| docs | `graph/docs.xml` `GD-DOCS` | `verification/docs.xml` `VD-DOCS` | WP01 (move), WP18, WP19, WP20 | `M-DOCS-CONTENT`, `M-DOCS-SPEC-REPORT`, `M-DOCS-SITE`, `M-DOCS-PLAYGROUND` (moved); WP18: rewrite `M-DOCS-PLAYGROUND`; WP19: `M-DOCS-SPEC-REPORT` → `M-DOCS-SEMANTIC-REPORT`, add `M-DOCS-INSPECTOR`; WP20: add `M-DOCS-CALCULATOR` |
| kernel-base | `graph/kernel-base.xml` `GD-KERNEL-BASE` | `verification/kernel-base.xml` `VD-KERNEL-BASE` | WP02 | `M-KERNEL-IDENTITY` → identity.ts, freeze.ts; `M-KERNEL-CANONICAL` → canonical.ts, digest.ts; `M-KERNEL-DIAGNOSTIC` → diagnostic.ts, cycles.ts |
| kernel-definitions | `GD-KERNEL-DEFINITIONS` | `VD-KERNEL-DEFINITIONS` | WP03 | `M-KERNEL-DEFINITIONS` → relation.ts, capability.ts, extension.ts, archetype.ts, locus.ts, extensions/purpose.ts, extensions/source.ts |
| kernel-model | `GD-KERNEL-MODEL` | `VD-KERNEL-MODEL` | WP04 | `M-KERNEL-MODEL` → model.ts |
| kernel-verify | `GD-KERNEL-VERIFY` | `VD-KERNEL-VERIFY` | WP05 | `M-KERNEL-VERIFY` → verify.ts |
| kernel-describe | `GD-KERNEL-DESCRIBE` | `VD-KERNEL-DESCRIBE` | WP06 | `M-KERNEL-DESCRIBE` → describe.ts, fields.ts; `M-KERNEL-INVOKE` → invoke.ts |
| kernel-decode | `GD-KERNEL-DECODE` | `VD-KERNEL-DECODE` | WP07 | `M-KERNEL-DECODE` → decode.ts |
| kernel-closure | `GD-KERNEL-CLOSURE` | `VD-KERNEL-CLOSURE` | WP08 | `M-KERNEL-CLOSURE` → closure.ts |
| kernel-api | `GD-KERNEL-API` | `VD-KERNEL-API` | WP09 | `M-KERNEL-INTROSPECTION` → introspection.ts; `M-KERNEL-IMPACT` → impact.ts; `M-KERNEL-API` → index.ts |
| pack-cli | `GD-PACK-CLI` | `VD-PACK-CLI` | WP10 | `M-PACK-CLI` → all `packages/cli/src/*.ts` |
| pack-agent | `GD-PACK-AGENT` | `VD-PACK-AGENT` | WP11 | `M-PACK-AGENT` → semantics, archetype, tools, introspection-tools, index; `M-PACK-AGENT-MCP` → mcp.ts, client.ts |
| pack-web | `GD-PACK-WEB` | `VD-PACK-WEB` | WP12 | `M-PACK-WEB` → all `packages/web/src/*.ts` |
| calculator-core | `GD-CALCULATOR-CORE` | `VD-CALCULATOR-CORE` | WP13 | `M-CALC-ARITHMETIC` → errors.ts, arithmetic.ts, archetypes.ts (index.ts until WP14 takes it) |
| calculator-interfaces | `GD-CALCULATOR-INTERFACES` | `VD-CALCULATOR-INTERFACES` | WP14 | `M-CALC-INTERFACES` → interfaces.ts, app.ts, index.ts, bin/cli.ts, bin/mcp.ts, bin/agent-demo.ts |

The file name of a graph or verification document is the area name, e.g. `graph/kernel-model.xml`. Kernel paths are under `packages/kernel/src/`, and calculator paths under `apps/calculator/`.

### Graph entry

Each module lists its dependency modules as empty child elements, as in the existing documents:

```xml
<M-KERNEL-MODEL>
  <Summary>Builds a checked semantic model from a root Locus and reports structural diagnostics.</Summary>
  <Path>packages/kernel/src/model.ts</Path>
  <M-KERNEL-DEFINITIONS />
  <M-KERNEL-DIAGNOSTIC />
</M-KERNEL-MODEL>
```

### Verification entry

```xml
<V-M-KERNEL-MODEL>
  <TestFiles>
    <File>packages/kernel/test/model.test.ts</File>
  </TestFiles>
  <Command>bun test packages/kernel/test/model.test.ts</Command>
  <Scenario>One sentence per tested behaviour.</Scenario>
  <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
</V-M-KERNEL-MODEL>
```

Register a module **only together with** its verification entry, and only once the listed test files exist. Otherwise `grace lint` reports `missing-module-coverage` or `invalid-test-file` (research R8). Add the ids to your `<Owns>` blocks in both index files.

### How to edit the area documents (exact shapes)

WP01 created your area documents empty. Replace the empty element with the filled one. Example for the area `kernel-base` (use your own area name and ids):

```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-KERNEL-BASE>
    <M-KERNEL-IDENTITY>
      <Summary>One sentence.</Summary>
      <Path>packages/kernel/src/identity.ts</Path>
      <Path>packages/kernel/src/freeze.ts</Path>
    </M-KERNEL-IDENTITY>
  </GD-KERNEL-BASE>
</GraceGraphDocument>
```

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-BASE>
    <V-M-KERNEL-IDENTITY>
      <TestFiles>
        <File>packages/kernel/test/identity.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/identity.test.ts</Command>
      <Scenario>One sentence per tested behaviour.</Scenario>
      <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
    </V-M-KERNEL-IDENTITY>
  </VD-KERNEL-BASE>
</GraceVerificationDocument>
```

In `.grace/graph/index.xml` change only your block, from `<Owns />` to:

```xml
    <GD-KERNEL-BASE>
      <Path>graph/kernel-base.xml</Path>
      <Owns>
        <M-KERNEL-IDENTITY />
      </Owns>
    </GD-KERNEL-BASE>
```

and in `.grace/verification/index.xml` the same with `<VD-…>` and `<V-M-… />`. Editing your own `GD-`/`VD-` block of the two index files is a sanctioned edit for every WP.

Lint rules that were confirmed while planning (they fail the gate when ignored):

- `START_MODULE_MAP` lists **every** export of the file, one line each (types and interfaces too), in file order.
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or exactly one line `(none) - no local helpers` (with the parentheses; a bare `none` fails `grace lint` with `markup.module-map-mismatch`).
- Every `<File>` in a verification entry must exist. Register a module only together with its verification entry, after the test files exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP04 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T019 – Failing tests

Create three test files with GRACE test markup. Build every fixture in the test file with `Locus`, `Extension`, `RelationType`, `Capability`, `Purpose` and `Archetype` from the WP03 modules.

`packages/kernel/test/model.test.ts` (structure and per-Locus checks; one `test` per code and case, named after the code):

- Empty root: `buildModel(Locus.make({ id: "app:root" }))` has `ids` `["app:root"]`, `relations` `[]`, `diagnostics` `[]`, root `ModelLocus` with `container: null`, `depth: 0`, `contains: []`.
- Containment: root contains `b` and `a` (in that order) → `ids` sorted `["app:a", "app:b", "app:root"]`; root `contains` `["app:a", "app:b"]`; `a.container === "app:root"`, `a.depth === 1`.
- `identity.malformed` reported for id `"Bad Id"` (exact message) and not reported for `"app:good"`.
- `identity.duplicate` reported when two different objects share `app:x` (exact message, `members` `[]`); not reported for one object.
- `ownership.multiple` reported when the same object `c` is in `a.contains` and `b.contains` under root `[a, b]` (members `["app:a", "app:b"]`, the container recorded is `app:a`); not reported when each container holds a different object.
- Each `composition.*` code reported on a Locus whose kind has that conflict (subject is the Locus id, members the two extension ids, exact message), and not reported for a kind without conflicts.
- `property.invalid` reported for `Locus.extend(Purpose).make({ id: "app:x", properties: { purpose: 3 } as never })` with the exact example message; not reported for valid properties.
- `capability.name-malformed` reported for a capability named `Add` (path `capabilities/Add`); not reported for `add`.
- `hasErrors` is false for a model with only warnings (`relation.duplicate`) and true when an error exists.
- `ancestors(model, "app:c")` for root → a → c is `["app:a", "app:root"]`; `ancestors` of the root and of an unknown id is `[]`.
- The model is frozen: `Object.isFrozen(model)`, `Object.isFrozen(model.ids)`, `Object.isFrozen(model.relations)`, `Object.isFrozen(model.diagnostics)`.
- `model.extensions` keys are sorted and hold the first object per id over all kinds; `model.archetypes` likewise.

`packages/kernel/test/model-relations.test.ts`. Fixture: an extension `test.links` with RelationTypes `test.uses` (target `"locus"`), `test.calls` (target `"capability"`, `grantsInvocation: true`) and `test.flows` (target `"locus"`, `acyclic: true`); a kind `Links = Locus.extend(Links)`; a Locus `app:svc` with capability `run`.

- A valid `test.uses` relation and a valid `test.calls` relation to `app:svc#run` → no diagnostics, both `valid: true`.
- `relation.type-unavailable`: a Locus of plain `Locus` using `test.uses` → reported, relation `valid: false`.
- `relation.target-missing`: target `app:nowhere` → reported, `valid: false`.
- `relation.capability-missing`: `test.calls` to `app:svc#nope` → reported.
- `relation.target-kind`: `test.uses` to `app:svc#run`, and `test.calls` to `app:svc` → each reported with the exact message.
- `relation.self`: `test.uses` to its own id → reported; `test.calls` to a capability of its own Locus → **not** reported (allowed edge case).
- `relation.duplicate`: the same type and target twice → one warning at the second index (`relations/1`); both relations stay `valid: true`.
- `relation.cycle`: `app:a` flows to `app:b` and `app:b` flows to `app:a` → one diagnostic with subject `app:a`, members `["app:a","app:b"]`, the exact message; the same edges with `test.uses` (not acyclic) → no cycle diagnostic.
- `relation.cycle-limit`: six Loci `app:n1`…`app:n6` each flowing to all five others → exactly 100 `relation.cycle` diagnostics and one `relation.cycle-limit` with subject = root id and members `["test.flows"]`; a 3-cycle → no limit diagnostic.
- `model.relations` is sorted by from, type id, target key, index (assert on a model with relations declared in reverse order).
- `incoming(model, "app:svc")` returns the valid relations whose `target.locus` is `app:svc` (both Locus and capability targets) and no invalid ones; `outgoing(model, id)` returns all relations from `id` in model order.

`packages/kernel/test/model-determinism.test.ts`
- Build two roots that hold the same Loci (with a malformed id, a missing target, a 2-cycle and a duplicate relation) but list `contains` in opposite orders. `JSON.stringify` of `{ ids, relations: relations.map(r => ({ from: r.from, type: r.type.id, target: r.target, index: r.index, valid: r.valid })), diagnostics }` is identical for both.
- `buildModel` twice on the same root gives identical JSON of the same projection.
- Never use `ownership.multiple` in this test (its first container depends on order by definition).

Run them and see them fail.

### T020 – Traversal, identity and ownership

Algorithm step 1, exactly:

1. `stack = [{ def: root, container: null, depth: 0 }]`; `visited = new Set<LocusDefinition>()`; `byId = new Map<string, { def, container, depth, children: string[] }>()`; `firstContainer = new Map<LocusDefinition, string | null>()`.
2. Pop an entry. If `visited.has(def)`: add `ownership.multiple` (subject `def.id`, members `[firstContainer.get(def), entry.container]`) and continue. Otherwise add it to `visited` and record `firstContainer`.
3. If `byId` already has `def.id` (it is a different object): add `identity.duplicate` and continue (do not traverse its contents).
4. Register it in `byId`; add its id to the container's `children`.
5. Push its `contains` in **reverse** order, so they are popped in array order (pre-order depth-first).

`ids` is the sorted list of registered ids (code-unit order). Each `ModelLocus.contains` is its sorted `children`.

### T021 – Per-Locus checks

For every registered Locus, in `ids` order (algorithm step 2): `identity.malformed`, then each kind conflict as a `composition.*` diagnostic, then `property.invalid` when `propertyIssues` is non-empty, then `capability.name-malformed` per capability name (in sorted name order).

### T022 – Relation checks

For every registered Locus (in `ids` order) and each relation index `i`, with `type = relation.type`, `target = relation.target`, `key = relationTargetKey(target)`, `errors = 0`:

1. `!kind.relationTypes.includes(type)` → `relation.type-unavailable`; `errors++`.
2. Target Locus not registered → `relation.target-missing`; `errors++`.
3. Else if `(type.target === "capability") !== (target.capability !== null)` → `relation.target-kind`; `errors++`.
4. Else if `target.capability !== null` and the target Locus's `capabilities` has no own key `target.capability` → `relation.capability-missing`; `errors++`.
5. `target.capability === null && target.locus === id` → `relation.self`; `errors++`.
6. If `type.id + "\u0000" + key` was already seen on this Locus → `relation.duplicate` (warning; does not change `errors`).
7. Push `{ from: id, type, target, index: i, valid: errors === 0 }`.

Sort the relations by `from`, then `type.id`, then `key`, then `index` (code-unit order).

### T023 – Cycles, maps, sorting, freezing and helpers

- Collect the acyclic relation types by id from the valid relations (`type.acyclic === true`), in sorted id order. For each, the edges are `[from, target.locus]` of its valid relations with `target.capability === null`; call `elementaryCycles(ids, edges)` and add the diagnostics described above.
- `extensions` / `archetypes`: walk the registered Loci in `ids` order and each kind's `extensions` (and each extension's `archetypes`) in order; keep the first object per id; then build a new `Map` with the keys sorted.
- `diagnostics = sortDiagnostics(all)`.
- Freeze: each `ModelLocus` and `ModelRelation` with `Object.freeze`, the `ids`, `relations` and `contains` arrays, and the model object. Do not call `deepFreeze` on definitions (already frozen).
- `incoming`, `outgoing`, `ancestors`, `hasErrors` as in the contract.

### T024 – Determinism check and GRACE

Run the determinism test. Then add GRACE markup to `model.ts` (module header listing `ModelLocus`, `ModelRelation`, `SemanticModel`, `buildModel`, `incoming`, `outgoing`, `ancestors`, `hasErrors`) and register, in area `kernel-model`, `M-KERNEL-MODEL` → `packages/kernel/src/model.ts` with children `<M-KERNEL-DEFINITIONS />`, `<M-KERNEL-DIAGNOSTIC />`, `<M-KERNEL-IDENTITY />`, and `V-M-KERNEL-MODEL` with the three test files and one `<Command>` running them. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP04 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Message texts are part of the contract; tests compare them exactly.
- Sort with code-unit comparison only; never `localeCompare`.
- A relation with several problems gets one diagnostic per problem in the order above; tests depend on it.

## Reviewer guidance

- Every diagnostic code has a reported and a not-reported test whose name contains the code.
- The traversal pushes children in reverse order; the determinism test passes.
- `model.ts` keeps the WP03 interfaces unchanged.

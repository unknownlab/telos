---
work_package_id: WP09
title: Kernel introspection service, impact, model comparison and public API
dependencies:
- WP06
- WP07
requirement_refs:
- FR-011
- FR-014
- NFR-001
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T048
- T049
- T050
- T051
- T052
- T053
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/
create_intent:
- packages/kernel/src/introspection.ts
- packages/kernel/src/impact.ts
- packages/kernel/test/introspection.test.ts
- packages/kernel/test/impact.test.ts
- packages/kernel/test/api.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/introspection.ts
- packages/kernel/src/impact.ts
- packages/kernel/src/index.ts
- packages/kernel/test/introspection.test.ts
- packages/kernel/test/impact.test.ts
- packages/kernel/test/api.test.ts
- .grace/graph/kernel-api.xml
- .grace/verification/kernel-api.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP09 – Kernel introspection service, impact, model comparison and public API

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

Finish the kernel:

- `introspection.ts`: the `Telos` Effect service, the single entry for agents and tools.
- `impact.ts`: change impact derived from the model, and model comparison (`diffModels`).
- `index.ts`: the exact public API, with a test that proves the export list and that the main entry imports no platform module.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## introspection.ts (WP09)

```ts
export class LocusNotFound extends Schema.TaggedError<LocusNotFound>()("LocusNotFound", { id: Schema.String, message: Schema.String }) {}
export class CapabilityNotFound extends Schema.TaggedError<CapabilityNotFound>()("CapabilityNotFound", { ref: Schema.String, message: Schema.String }) {}
export interface LocusView {
  readonly id: string
  readonly inspect: () => Effect.Effect<LocusDescription>
  readonly relations: () => Effect.Effect<LocusDescription["relations"]>
  readonly capabilities: () => Effect.Effect<ReadonlyArray<CapabilityDescription>>
  readonly verifications: () => Effect.Effect<ReadonlyArray<VerificationDescription>>  // uses the latest report of this service, else not-run
}
export interface TelosApi {
  readonly model: SemanticModel
  readonly loci: () => Effect.Effect<ReadonlyArray<string>>                      // model.ids
  readonly resolve: (id: string) => Effect.Effect<LocusView, LocusNotFound>
  readonly describe: () => Effect.Effect<ModelDescription>
  readonly diagnostics: () => Effect.Effect<ReadonlyArray<Diagnostic>>
  readonly verify: (options: VerifyOptions) => Effect.Effect<VerificationReport>  // also stores it as the latest report (Ref)
  readonly impact: (target: string) => Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound>
  readonly invoke: (ref: CapabilityRef | string, input: unknown, options: InvokeOptions) => Effect.Effect<InvocationOutcome>
}
export class Telos extends Context.Service<Telos, TelosApi>()("@telos/kernel/Telos") {
  static readonly make: (root: LocusDefinition) => Effect.Effect<TelosApi>
  static readonly layer: (root: LocusDefinition) => Layer.Layer<Telos>
}
```

`LocusNotFound` message: `"No Locus <id> in the model."`.

## impact.ts (WP09)

```ts
export interface AffectedLocus {
  readonly locus: string
  readonly path: ReadonlyArray<{ readonly from: string; readonly type: string; readonly to: string }>  // shortest relation path, from the affected Locus toward the target
  readonly distance: number   // path length
}
export interface ImpactReport {
  readonly target: string                          // the Locus id or capability key analysed
  readonly affected: ReadonlyArray<AffectedLocus>  // sorted by distance then locus
  readonly checks: ReadonlyArray<{ readonly locus: string; readonly archetype: string; readonly rule: string; readonly method: RuleMethod }>
  // every rule of applicableArchetypes for the target Locus, every affected Locus, and every ancestor of those (archetypes of containers see their contents); deduplicated; sorted by locus, archetype, rule
  readonly knowledge: "derived"
}
export function impact(model: SemanticModel, target: string): ImpactReport
// target: a Locus id or "<locus>#<capability>"; callers validate existence first.
// Breadth-first over valid incoming relations. Level 0: relations targeting exactly the target
// (for a Locus target, also relations to any of its capabilities). Then relations targeting each affected Locus or its capabilities, transitively.
export type ModelChangeKind = "locus-added" | "locus-removed" | "contract-changed" | "capability-added" | "capability-removed" | "locus-changed"
export interface ModelChange {
  readonly kind: ModelChangeKind
  readonly locus: string
  readonly capability: string | null
  readonly patch: ReadonlyArray<JsonPatch.JsonPatchOperation>   // JsonPatch.get(before, after) of the compared descriptions; [] for added/removed
}
export const diffModels: (before: SemanticModel, after: SemanticModel) => Effect.Effect<ReadonlyArray<ModelChange>>
// compares describeModel outputs by id; for shared capabilities compares contractDigest (contract-changed with the patch of
// the two CapabilityDescriptions without exposedBy); for other differences in a shared Locus reports one locus-changed with the
// patch of the two descriptions with capabilities, digest, diagnostics removed; sorted by locus, capability ("" for null), kind
```

## index.ts (WP09) — the public API

`src/index.ts` re-exports exactly the following from the modules above. Nothing else is exported.

`LOCUS_ID_PATTERN, EXTENSION_ID_PATTERN, CAPABILITY_NAME_PATTERN, isLocusId, isExtensionId, isCapabilityName, capabilityKey, parseCapabilityKey, canonicalJson, jsonEqual, digestOf, Digest, Diagnostic, DiagnosticCode, Severity, compareDiagnostics, RelationType, Relation, RelationTarget, CapabilityRef, relationTargetKey, Capability, EffectClass, ErrorSchema, errorTag, Extension, Archetype, Rule, RuleViolation, RuleContext, RuleMethod, violation, Locus, LocusKind, LocusDefinition, CompositionConflict, MergedFields, PropertiesOf, Purpose, Source, SourceDependsOn, External, SemanticModel, ModelLocus, ModelRelation, buildModel, incoming, outgoing, ancestors, hasErrors, verify, applicableArchetypes, VerifyOptions, VerificationReport, Finding, Outcome, Provenance, Knowledge, JsonSchemaDocument, toJsonSchema, describeLocus, describeModel, describeCapability, describeVerifications, LocusDescription, ModelDescription, CapabilityDescription, RelationDescription, VerificationDescription, invoke, isGranted, InvocationOutcome, InvocationError, InvocationIssue, InvokeOptions, inputFields, coerceInput, InputField, InputFieldType, decodeLocus, decodeLocusText, LocusJson, LocusJsonSchema, DecodeResult, DecodeIssue, ExtensionRegistry, FieldType, Telos, TelosApi, LocusView, LocusNotFound, CapabilityNotFound, impact, ImpactReport, AffectedLocus, diffModels, ModelChange, ModelChangeKind`

`deepFreeze`, `sortKeys`, `makeDiagnostic`, `sortDiagnostics`, `SEVERITY`, `elementaryCycles` and `MAX_CYCLES` stay internal.

The kernel header rules (they apply to `index.ts` and everything it imports):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

# Contract: `@telos/kernel`

Package `packages/kernel`, name `@telos/kernel`. Dependency: `effect` 4.0.4 only. Export map (set by WP01):

```json
{ ".": "./src/index.ts", "./closure": "./src/closure.ts", "./package.json": "./package.json" }
```

The main entry (`src/index.ts` and everything it imports) must not import `bun`, `bun:*`, `node:*`, `effect/cli`, `effect/ai`, `effect/process`, React or any Pack. `src/closure.ts` is Bun-only and is not re-exported from the main entry.

All imports inside the kernel use relative paths without extension (`import { isLocusId } from "./identity"`). Types use `import type`.

### Effect 4.0.4 facts (run while planning)

```ts
import { Context, Effect, Layer, Ref } from "effect";
interface Api { readonly hello: () => Effect.Effect<string> }
class Svc extends Context.Service<Svc, Api>()("x/Svc") {
  static readonly make = (n: string): Effect.Effect<Api> => Effect.succeed({ hello: () => Effect.succeed("hi " + n) });
  static readonly layer = (n: string) => Layer.effect(Svc, Svc.make(n));
}
// Effect.gen(function* () { const s = yield* Svc; return yield* s.hello(); }).pipe(Effect.provide(Svc.layer("bob"))) gives "hi bob"
// Ref.make<T | null>(null), Ref.set(ref, value), Ref.get(ref) exist.
// JsonPatch.get({ a: 1 }, { a: 2, b: 1 }) gives [{"op":"replace","path":"/a","value":2},{"op":"add","path":"/b","value":1}]
```

Modules you use: everything from WP02–WP07 (`./model`, `./verify`, `./describe`, `./invoke`, `./fields`, `./decode`, `./identity`, `./relation`, `./freeze`).

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

Exported types and interfaces need only the MODULE_MAP line. Test files use `ROLE: TEST` and `MAP_MODE: LOCALS`, and list their local helpers (or "none") in the map. Optional named regions use `// START_BLOCK_<NAME>` / `// END_BLOCK_<NAME>`. The guides quote these regions (contracts/docs.md).

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
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or one line `none - no local helpers`.
- Every `<File>` in a verification entry must exist. Register a module only together with its verification entry, after the test files exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP09 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T048 – Failing introspection tests

Create `packages/kernel/test/introspection.test.ts` with GRACE test markup. Fixture: the same shape as WP06's describe fixture (`app:math` with `double` and an applicable Archetype with rules `r.a` passing and `r.b` failing, `app:ui` with a granting relation to `app:math#double`, root `app:root`).

- `Effect.runPromise(Telos.make(root))` gives an api whose `model.root` is `app:root` and whose `loci()` equals `model.ids`.
- `resolve("app:none")` fails with `LocusNotFound` (`id: "app:none"`, message `No Locus app:none in the model.`); assert with `Effect.exit` and `Cause.findErrorOption`.
- `resolve("app:math")` → view with `id`; `view.inspect()` deep-equals `describeLocus(model, "app:math")`; `view.relations()` equals its `relations`; `view.capabilities()` equals its `capabilities`.
- Before any `verify`, `view.verifications()` entries are all `not-run`; after `api.verify({ runner: "test" })`, `r.a` is `verified` and `r.b` is `failed` (the service keeps the latest report).
- `describe()` equals `describeModel(model)`; `diagnostics()` equals `model.diagnostics`.
- `impact("app:none")` fails with `LocusNotFound`; `impact("app:math#nope")` fails with `CapabilityNotFound` (`ref: "app:math#nope"`, message `Locus app:math has no capability nope.`); `impact("app:none#x")` fails with `LocusNotFound`.
- `invoke("app:math#double", { n: 2 }, { via: "app:ui" })` gives `{ ok: true, output: { value: 4 } }`.
- The layer: `Effect.gen(function* () { const t = yield* Telos; return yield* t.loci(); }).pipe(Effect.provide(Telos.layer(root)))` gives the ids.

Create `packages/kernel/test/impact.test.ts`. Fixture: `app:core` with capabilities `add` and `sub`; `app:cli` and `app:web` with a granting relation (`test.calls`, target `"capability"`) to `app:core#add`; `app:gate` with a `test.uses` (target `"locus"`) relation to `app:cli`; an unrelated `app:other`; an Archetype that applies to the kind of `app:cli`; root `app:root` contains them all, and root's kind has an Archetype too.

- `impact(model, "app:core#add").affected` is `[{ locus: "app:cli", distance: 1, path: [{ from: "app:cli", type: "test.calls", to: "app:core#add" }] }, { locus: "app:web", distance: 1, ... }, { locus: "app:gate", distance: 2, path: [{ from: "app:gate", type: "test.uses", to: "app:cli" }, { from: "app:cli", type: "test.calls", to: "app:core#add" }] }]` (sorted by distance, then locus).
- `impact(model, "app:core#sub").affected` is `[]`.
- `impact(model, "app:core")` (a Locus target) includes the relations to its capabilities, so it lists `app:cli` and `app:web`.
- `checks` contain the rules applicable to `app:core`, to every affected Locus and to their ancestors (the root's Archetype rules appear for `app:root`), with no duplicates, sorted by locus, archetype, rule; `knowledge` is `"derived"`.
- Adding a new Locus with a granting relation to `app:core#add` and rebuilding the model makes it appear in `affected` (US6.3) with no other change.
- `diffModels`: identical models → `[]`; `after` with a different output schema for `add` → exactly one change `{ kind: "contract-changed", locus: "app:core", capability: "add", patch: <non-empty> }`; a Locus added → `locus-added` with `patch: []`; removed → `locus-removed`; a capability added or removed → `capability-added` / `capability-removed`; a changed description of `app:other` → `locus-changed` with a non-empty patch; changes are sorted by locus, capability (`""` for null), kind.

### T049 – The `Telos` service

`introspection.ts` defines `LocusNotFound`, `CapabilityNotFound`, `LocusView`, `TelosApi` and `Telos` exactly as the contract. `Telos.make(root)`:

1. `model = buildModel(root)`; `latest = yield* Ref.make<VerificationReport | null>(null)`.
2. `resolve(id)`: unknown → `Effect.fail(new LocusNotFound({ id, message: \`No Locus ${id} in the model.\` }))`; otherwise a view whose methods use `describeLocus` and `describeVerifications(model, id, yield* Ref.get(latest))`.
3. `verify(options)`: run kernel `verify`, `Ref.set(latest, report)`, return it.
4. `impact(target)`: when `target` contains `#`, parse it with `parseCapabilityKey`; an unknown Locus → `LocusNotFound`, an unknown capability → `CapabilityNotFound({ ref: target, message: \`Locus ${locus} has no capability ${name}.\` })`; otherwise call `impact(model, target)`.
5. `invoke` delegates to kernel `invoke`.

`Telos.layer(root) = Layer.effect(Telos, Telos.make(root))`.

### T050 – `impact`

Breadth-first:

1. `targetLocus` = the Locus id of the target. `matches(rel, x)`: for the first level, a capability target matches relations with `target.locus === locus && target.capability === name`; a Locus target matches every relation with `target.locus === targetLocus`. For later levels, a relation matches affected Locus `x` when `target.locus === x`.
2. Only valid relations (`incoming` returns valid ones). Process one level at a time; within a level visit the current Loci in sorted order and their incoming relations in model order. A source Locus that is the target Locus or already affected is skipped. `to` in a path step is `relationTargetKey(rel.target)`.
3. `affected` sorted by distance, then locus.
4. `checks` as in the contract, using `applicableArchetypes` and `ancestors`.
5. Deep-freeze the report.

### T051 – `diffModels`

Compare `describeModel(before)` and `describeModel(after)` as in the contract. For `contract-changed`, the patch is `JsonPatch.get(b, a)` of the two `CapabilityDescription`s with `exposedBy` removed. For `locus-changed`, the patch is `JsonPatch.get(b, a)` of the two `LocusDescription`s with `capabilities`, `digest` and `diagnostics` removed; report it only when that patch is non-empty.

### T052 – `index.ts` and `api.test.ts`

Write `src/index.ts` with exactly the names of the contract list: values with `export { ... } from "./module";`, types with `export type { ... } from "./module";`. Nothing else, and never `./closure`.

Create `packages/kernel/test/api.test.ts`:

1. `import * as Kernel from "../src/index";` and assert `Object.keys(Kernel).sort()` equals this sorted list of the value exports:
   `Archetype, CAPABILITY_NAME_PATTERN, Capability, CapabilityNotFound, CapabilityRef, EXTENSION_ID_PATTERN, Extension, External, LOCUS_ID_PATTERN, Locus, LocusJsonSchema, LocusNotFound, Purpose, RelationType, Rule, RuleViolation, Source, SourceDependsOn, Telos, ancestors, applicableArchetypes, buildModel, canonicalJson, capabilityKey, coerceInput, compareDiagnostics, decodeLocus, decodeLocusText, describeCapability, describeLocus, describeModel, describeVerifications, diffModels, digestOf, errorTag, hasErrors, impact, incoming, inputFields, invoke, isCapabilityName, isExtensionId, isGranted, isLocusId, jsonEqual, outgoing, parseCapabilityKey, relationTargetKey, toJsonSchema, verify, violation` (51 names; sort them in the test with code-unit order).
2. A type-only import of every type name of the contract list (`import type { AffectedLocus, CapabilityDescription, ... } from "../src/index";`) used in one `type _AllTypes = [AffectedLocus, ...]` alias, so `bun run typecheck` fails when a type export is missing.
3. Browser safety: starting at `packages/kernel/src/index.ts`, follow every relative import (resolve `./x` to `x.ts` or `x/index.ts`) with `new Bun.Transpiler({ loader: "ts" }).scanImports`, collecting every visited file and every non-relative specifier. Assert that `closure.ts` is not visited, and that no specifier is `bun`, starts with `bun:` or `node:`, starts with `effect/cli`, `effect/ai` or `effect/process`, is `react` or starts with `@telos/`.

### T053 – GRACE

Area `kernel-api`. Register `M-KERNEL-INTROSPECTION` → `introspection.ts` (children `<M-KERNEL-DESCRIBE />`, `<M-KERNEL-INVOKE />`, `<M-KERNEL-VERIFY />`, `<M-KERNEL-MODEL />`) with `V-M-KERNEL-INTROSPECTION` (`introspection.test.ts`); `M-KERNEL-IMPACT` → `impact.ts` (children `<M-KERNEL-MODEL />`, `<M-KERNEL-DESCRIBE />`, `<M-KERNEL-VERIFY />`) with `V-M-KERNEL-IMPACT` (`impact.test.ts`); `M-KERNEL-API` → `index.ts` (children: every kernel module id except `M-KERNEL-CLOSURE`) with `V-M-KERNEL-API` (`api.test.ts`). Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP09 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- The export list must match exactly; an extra or missing export fails `api.test.ts`.
- `closure.ts` must never be reachable from `index.ts`.

## Reviewer guidance

- Compare `index.ts` with the contract list name by name.
- Check that typed failures (`LocusNotFound`, `CapabilityNotFound`) are failures, not defects.
- Check impact paths point from the affected Locus toward the target.

---
work_package_id: WP05
title: Kernel Archetype verification
dependencies:
- WP04
requirement_refs:
- FR-009
- FR-010
- NFR-005
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T025
- T026
- T027
- T028
- T029
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/verify.ts
create_intent:
- packages/kernel/src/verify.ts
- packages/kernel/test/verify.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/verify.ts
- packages/kernel/test/verify.test.ts
- .grace/graph/kernel-verify.xml
- .grace/verification/kernel-verify.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP05 – Kernel Archetype verification

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

Implement `packages/kernel/src/verify.ts`: find the Archetypes that apply to each Locus from its composition, run their rules, and report `passed`, `failed` and `error` findings with provenance. A rule never stops other rules.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## verify.ts (WP05)

```ts
export type Outcome = "passed" | "failed" | "error"
export interface Finding {
  readonly archetype: string
  readonly rule: string
  readonly locus: string
  readonly method: RuleMethod
  readonly outcome: Outcome
  readonly message: string | null   // RuleViolation.message for failed; String(defect) for error; null for passed
}
export interface Provenance {
  readonly runner: string           // e.g. "bun 1.4.4-canary.1" or "browser"; given by the caller
  readonly startedAt: string        // ISO 8601
  readonly finishedAt: string       // ISO 8601
}
export interface VerificationReport {
  readonly provenance: Provenance
  readonly findings: ReadonlyArray<Finding>      // sorted by locus, archetype, rule
  readonly summary: { readonly passed: number; readonly failed: number; readonly error: number }
}
export interface VerifyOptions {
  readonly runner: string
  readonly methods?: ReadonlyArray<RuleMethod>   // default ["static", "execution"]
  readonly loci?: ReadonlyArray<string>          // default all model ids
  readonly now?: () => Date                      // default () => new Date()
}
export function applicableArchetypes(model: SemanticModel, locusId: string): ReadonlyArray<Archetype>
// all archetypes in model.archetypes whose appliesTo ids are all in the Locus kind's extension ids; sorted by id; [] for unknown id
export const verify: (model: SemanticModel, options: VerifyOptions) => Effect.Effect<VerificationReport>
```

Each `(locus, archetype, rule)` with a selected method runs sequentially. The rule check runs with `Effect.exit`:

- success → `passed`
- `Fail(RuleViolation)` → `failed`
- any other cause, including a defect or a thrown exception wrapped by `Effect.suspend`/`Effect.try` → `error`

A rule never stops other rules.

Archetype and rule shapes (WP03, `./archetype`): `Archetype { id, description, appliesTo, rules }`, `Rule { id, description, method, check(ctx) }`, `RuleContext { locus, model }`, `RuleViolation` (TaggedError with `message`), `violation(message)`.

### Effect 4.0.4 pattern (run while planning)

```ts
import { Cause, Effect, Exit, Option } from "effect";

const exit = yield* Effect.exit(Effect.suspend(() => rule.check(ctx)));
if (Exit.isSuccess(exit)) {
  // passed
} else {
  const error = Cause.findErrorOption(exit.cause);
  if (Option.isSome(error) && error.value instanceof RuleViolation) {
    // failed, message = error.value.message
  } else {
    // error, message = String(Option.isSome(error) ? error.value : Cause.squash(exit.cause))
  }
}
```

Planning output of the same pattern: `Effect.sync(() => { throw new Error("boom") })` ends as a defect whose `String(Cause.squash(cause))` is `"Error: boom"`; `Effect.die("x")` gives `"x"`. `Effect.suspend` turns a synchronous throw inside `check` itself into a defect, so a rule whose `check` throws before returning an Effect also gives `error`.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP05 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T025 – Failing tests

Create `packages/kernel/test/verify.test.ts` with GRACE test markup. Fixture (in the test file): extensions `test.a` and `test.b`; Archetype `test.arch-a` (appliesTo `["test.a"]`) with rules `r.pass` (static, succeeds), `r.fail` (static, `violation("bad thing.")`), `r.die` (execution, `Effect.die("boom")`), `r.throw` (execution, `check: () => { throw new Error("thrown") }` cast to the rule type); Archetype `test.arch-ab` (appliesTo `["test.a", "test.b"]`) with one static passing rule `r.both`; Loci `app:a` (kind `Locus.extend(A)`), `app:ab` (kind `Locus.extend(A, B)`), `app:none` (plain `Locus`), all inside root `app:root`. A fixed clock: `now: () => new Date("2026-01-01T00:00:00.000Z")`.

Tests (named after the behaviour):

- `applicableArchetypes(model, "app:a")` ids are `["test.arch-a"]`; for `app:ab` they are `["test.arch-a", "test.arch-ab"]` (sorted by id); for `app:none` and for an unknown id `[]`.
- Outcomes: for `app:a`, `r.pass` is `passed` with `message: null`; `r.fail` is `failed` with `message: "bad thing."`; `r.die` is `error` with `message: "boom"`; `r.throw` is `error` with message `"Error: thrown"`. All four findings exist, so a failing or dying rule did not stop the others.
- Findings are sorted by locus, then archetype, then rule (assert the full `[locus, archetype, rule]` list for the fixture).
- `summary` counts equal the counts of each outcome in `findings`.
- `methods: ["static"]` runs no execution rule; `methods: ["execution"]` runs no static rule.
- `loci: ["app:ab"]` gives only findings for `app:ab`; an unknown id in `loci` is ignored.
- Provenance: `runner` is the given string; `startedAt` and `finishedAt` are `"2026-01-01T00:00:00.000Z"` with the fixed clock.
- A cross-Locus rule sees the whole model: a rule that fails unless `ctx.model.ids.includes("app:root")` passes.
- The report is frozen (`Object.isFrozen(report.findings)`).

Run them and see them fail.

### T026 – `applicableArchetypes`

Unknown id → `[]`. Otherwise the kind's extension ids are `new Set(definition.kind.extensions.map((e) => e.id))`; return the values of `model.archetypes` whose `appliesTo` ids are all in that set, sorted by id (code-unit order).

### T027 – Rule execution

`verify` is `Effect.gen`:

1. `now = options.now ?? (() => new Date())`; `startedAt = now().toISOString()`.
2. `methods = options.methods ?? ["static", "execution"]`; `selected = (options.loci ?? model.ids)` filtered to ids in `model.loci`, de-duplicated and sorted.
3. For each id, each archetype of `applicableArchetypes`, each rule whose method is selected, in order: run the pattern above with `ctx = { locus: model.loci.get(id).definition, model }` and push the finding.

### T028 – Report

`finishedAt = now().toISOString()`. Sort the findings by `locus`, `archetype`, `rule` (code-unit order). Count the summary. Return the report deep-frozen (`deepFreeze` from `./freeze`).

### T029 – GRACE

Area `kernel-verify`. Register `M-KERNEL-VERIFY` → `packages/kernel/src/verify.ts` with children `<M-KERNEL-MODEL />`, `<M-KERNEL-DEFINITIONS />`, and `V-M-KERNEL-VERIFY` with `packages/kernel/test/verify.test.ts`. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP05 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- A thrown exception inside a rule must become `error`, never stop the run or reject the Effect.
- Do not use `Date.now()` anywhere except through `options.now`'s default.

## Reviewer guidance

- Check the four outcome cases and both filters are tested.
- Check findings are sorted and the summary is computed from the findings.

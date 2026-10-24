---
work_package_id: WP15
title: Repository self-description, telos command and gate
dependencies:
- WP14
- WP08
- WP22
requirement_refs:
- FR-022
- FR-023
- FR-024
- NFR-003
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: 4bf5c72e10cca6d0efe03744c32ac971881d7212
created_at: '2026-10-24T14:45:45.262020+00:00'
subtasks:
- T084
- T085
- T086
- T087
- T088
- T089
phase: Phase 5 – Repository gate
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/telos.ts
create_intent:
- telos.ts
- scripts/telos.ts
- scripts/telos.test.ts
- .grace/graph/tooling.xml
- .grace/verification/tooling.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- telos.ts
- scripts/telos.ts
- scripts/telos.test.ts
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .grace/graph/tooling.xml
- .grace/verification/tooling.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP15 – Repository self-description, telos command and gate

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

Make the repository describe itself with the kernel, give developers and agents one command to read that description, and put it into the gate:

- root `telos.ts`: the repository as a Telos model (Loci with purpose, source claims, external packages and dependency relations);
- `scripts/telos.ts`: the `bun run telos <command>` developer command, including the closure check and the `SemanticReport` that the docs site reads (WP19);
- the gate: `telos:check` at the end of `verify` and as the last review-gate step.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/repository.md` (authoritative).

# Contract: repository self-description and gate (WP15)

The repository describes itself with the kernel (FR-022). One command reads that description (FR-023), and the gate enforces it (FR-024, spec D7).

## Root `telos.ts`

The root file imports only `@telos/kernel` and `@telos/calculator`. The root `package.json` has these as `workspace:*` dependencies since WP01, together with `@telos/cli` and `"effect": "4.0.4"` (owner decision of 2026-10-24: `scripts/telos.ts` runs kernel Effects, and Bun's isolated installs expose `effect` to root files only when the root declares it).

```ts
import { External, Locus, Purpose, Source, SourceDependsOn, buildModel } from "@telos/kernel"
import { app as calculatorApp } from "@telos/calculator"
const Module = Locus.extend(Purpose, Source, External)
export const kernel = Module.make({ id: "telos:kernel", ... })
// ... one const per Locus below
export const repository = Module.make({ id: "telos:repository", ..., contains: [kernel, cliPack, agentPack, webPack, calculator, tooling, docsSite, legacyLocus] })
export const repositoryModel = buildModel(repository)
```

| Id | `sources` | `packages` (External) | Relations (`SourceDependsOn.to(...)`) | Contains |
| --- | --- | --- | --- | --- |
| `telos:repository` | `telos.ts` | — (`[]`) | — | all below |
| `telos:kernel` | `packages/kernel/src/**/*.ts`, `packages/kernel/test/**/*.ts` | `effect` | — | — |
| `telos:cli-pack` | `packages/cli/src/**/*.ts`, `packages/cli/test/**/*.ts` | `effect` | kernel | — |
| `telos:agent-pack` | `packages/agent/src/**/*.ts`, `packages/agent/test/**/*.ts` | `effect` | kernel | — |
| `telos:web-pack` | `packages/web/src/**/*.ts`, `packages/web/test/**/*.ts` | `effect` | kernel | — |
| `telos:calculator` | `apps/calculator/src/**/*.ts`, `apps/calculator/bin/**/*.ts`, `apps/calculator/test/**/*.ts` | `effect` | kernel, cli-pack, agent-pack, web-pack | `calculatorApp` |
| `telos:tooling` | `scripts/**/*.ts` | `effect` | kernel | — |
| `telos:docs-site` | `apps/docs/*.ts`, `apps/docs/src/**/*.ts`, `apps/docs/src/**/*.tsx`, `apps/docs/scripts/**/*.ts`, `apps/docs/test/**/*.ts`, `apps/docs/test/**/*.tsx`, `apps/docs/e2e/**/*.ts` | the third-party packages the docs files import today (see below) | kernel, web-pack, calculator, legacy-locus | — |
| `telos:legacy-locus` | `packages/locus/src/**/*.ts`, `packages/locus/test/**/*.ts`, `packages/locus/specs/**/*.ts` | `effect` | — | — |

Notes:

- Each Locus has a `purpose` sentence and a `description`. The texts are written by the implementer and state what the package does.
- **Docs externals**: run the closure check once, take every `closure.unknown-external` reported for `telos:docs-site`, check that each package is listed in `apps/docs/package.json` (`dependencies` or `devDependencies`), and add them to `packages`, sorted. A package that is imported but not in the manifest is a real finding: stop and report it rather than listing it.
- **Later changes**:
  - `telos:docs-site` declares its relations to kernel, web-pack and calculator from the start, because WP18–WP20 add those imports to the docs app. A declared relation without an import is allowed; the closure check only rejects imports without a relation.
  - WP20 removes `telos:legacy-locus` and the relation to it.
  - Every WP that adds a cross-Locus import adds the matching relation in the same commit.

## Closure scope (constant `CLOSURE_SCOPE` in `scripts/telos.ts`)

```ts
export const CLOSURE_SCOPE = {
  include: [
    "telos.ts", "scripts/**/*.ts",
    "packages/*/src/**/*.ts", "packages/*/test/**/*.ts", "packages/*/specs/**/*.ts",
    "apps/calculator/src/**/*.ts", "apps/calculator/bin/**/*.ts", "apps/calculator/test/**/*.ts",
    "apps/docs/*.ts", "apps/docs/src/**/*.ts", "apps/docs/src/**/*.tsx", "apps/docs/scripts/**/*.ts",
    "apps/docs/test/**/*.ts", "apps/docs/test/**/*.tsx", "apps/docs/e2e/**/*.ts",
  ],
  exclude: ["**/node_modules/**", "**/*.d.ts", "apps/docs/src/generated/**", "apps/docs/test/fixtures/**"],
  aliases: [{ prefix: "@/", dir: "apps/docs/src/" }],
} as const
```

`packages` (workspace packages) are read at run time from `packages/*/package.json` and `apps/*/package.json`: `{ name, dir }` for each manifest.

## `scripts/telos.ts` — the developer command

`bun run telos <command> [args]`. Every command prints exactly one JSON document and a newline to stdout. Errors print `{"tag","message"}` JSON to stderr.

| Command | Output (stdout) | Exit code |
| --- | --- | --- |
| `list` | `{ "loci": string[] }` (model ids) | 0 |
| `inspect <id>` | the `LocusDescription` | 0; 2 with `LocusNotFound` |
| `verify [--static]` | the `VerificationReport` (`--static` = `methods: ["static"]`; runner `bun <Bun.version>`) | 0 when `failed + error === 0`, else 1 |
| `closure` | the `ClosureReport` | 0 when `!hasClosureErrors`, else 1 |
| `impact <target>` | the `ImpactReport` (target is a Locus id or `locus#capability`) | 0; 2 with `LocusNotFound` / `CapabilityNotFound` |
| `check` | `{ ok, diagnostics, verification: summary, failures: Finding[], closure: { errors, warnings, findings: ClosureFinding[] } }`. `failures` lists the failed or errored findings, and `closure.findings` lists the error findings. | 0 when `ok`, else 1 |
| `report --out <path>` | writes the `SemanticReport` (below) to `<path>` (directories created), prints `{ "written": <path> }` | 0, or 1 when `check` would fail |
| anything else | `{"tag":"UsageError","message":"Usage: telos list|inspect <id>|verify [--static]|closure|impact <target>|check|report --out <path>"}` on stderr | 2 |

`ok` is true when there are no error diagnostics, `summary.failed === 0 && summary.error === 0`, and there are no closure errors.

### Exports for tests

```ts
export interface TelosRunResult { readonly exitCode: number; readonly stdout: string; readonly stderr: string }
export const runTelos: (argv: ReadonlyArray<string>, options?: { readonly root?: LocusDefinition; readonly cwd?: string }) => Promise<TelosRunResult>
// root defaults to the repository Locus from "../telos"; cwd defaults to the repository root (resolved from import.meta.dir)
export const CLOSURE_SCOPE: { include; exclude; aliases }
export interface SemanticReport {
  readonly version: 1
  readonly provenance: { readonly runner: string; readonly generatedAt: string; readonly commit: string | null }  // commit from `git rev-parse HEAD`, null when unavailable
  readonly model: ModelDescription
  readonly verification: VerificationReport
  readonly verifications: Readonly<Record<string, ReadonlyArray<VerificationDescription>>>   // per Locus id, from describeVerifications
  readonly closure: { readonly limits: ReadonlyArray<string>; readonly scope: ClosureReport["scope"]; readonly fileCount: number; readonly findings: ReadonlyArray<ClosureFinding> }
  readonly ok: boolean
}
if (import.meta.main) { const r = await runTelos(process.argv.slice(2)); process.stdout.write(r.stdout); process.stderr.write(r.stderr); process.exitCode = r.exitCode }
```

### Tests (`scripts/telos.test.ts`)

- `runTelos(["list"])` includes `telos:kernel` and `calculator:arithmetic`.
- `inspect telos:kernel` has `knowledge: "declared"`.
- `inspect nope:nope` exits 2.
- `check` on the real repository exits 0 with `ok: true`.
- `check` with a fixture root (a Locus with a malformed relation) exits 1.
- `closure` with a fixture root and a temporary directory `cwd` containing an unowned file reports `closure.unowned`.
- `impact calculator:arithmetic#add` lists `calculator:cli`.
- `report --out <tmp>/r.json` writes a file whose `version` is 1 and whose `model.loci` contains `telos:repository`.
- An unknown command exits 2.
- Timing (NFR-003): `verify --static` on the repository completes in under 2000 ms and `closure` in under 10000 ms, measured with `performance.now()` around `runTelos`.

## Gate wiring

- Root `package.json` `scripts`:
  - `"telos": "bun scripts/telos.ts"`
  - `"telos:check": "bun scripts/telos.ts check"`
  - `verify` gains `&& bun run telos:check` at the **end**, after `grace:lint`.
- `scripts/review-gate.ts` `CHECK_STEPS` gains `{ name: "telos:check", command: ["bun", "run", "telos:check"] }` as the last entry. Its `START_CONTRACT: CHECK_STEPS` OUTPUTS text lists `telos:check`.
- The existing `scripts/review-gate.test.ts` already compares `CHECK_STEPS` with `verifyStepNames(verify)`. It must stay green, so update any expected list in it.
- `.kittify/config.yaml` `review.test_command` is **not** edited: it already runs the review gate, which now includes the new step. Editing that file is an owner decision.

The closure API you call (kernel, Bun only, import from `@telos/kernel/closure`):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## closure.ts (WP08) — `@telos/kernel/closure`, Bun only

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
export interface ClosureOptions {
  readonly root: string                                  // absolute repository root
  readonly include: ReadonlyArray<string>                // globs of managed files, e.g. ["packages/*/src/**/*.ts", ...]
  readonly exclude?: ReadonlyArray<string>               // globs removed from the scope
  readonly packages?: ReadonlyArray<{ readonly name: string; readonly dir: string }>  // workspace packages (dir repository-relative)
  readonly aliases?: ReadonlyArray<{ readonly prefix: string; readonly dir: string }> // TS path aliases, e.g. { prefix: "@/", dir: "apps/docs/src/" }
}
export interface ClosureReport {
  readonly scope: { readonly include: ReadonlyArray<string>; readonly exclude: ReadonlyArray<string> }
  readonly files: ReadonlyArray<{ readonly file: string; readonly owner: string | null }>   // sorted by file
  readonly findings: ReadonlyArray<ClosureFinding>   // sorted by code, file ("" for null), detail
  readonly limits: ReadonlyArray<string>             // CLOSURE_LIMITS
  readonly knowledge: "derived"
}
export const CLOSURE_LIMITS: ReadonlyArray<string>  // the four limits of research R11, as sentences
export const checkClosure: (model: SemanticModel, options: ClosureOptions) => Effect.Effect<ClosureReport>
export function hasClosureErrors(report: ClosureReport): boolean
```

Algorithm:

1. Scope = the union of `new Bun.Glob(g).scan({ cwd: root, onlyFiles: true })` over `include`, minus files matching any `exclude` glob (`new Bun.Glob(x).match(file)`). The result is sorted.
2. Claims: for every model Locus with the `telos.source` extension, each glob in `properties.sources` claims the files it matches. A glob matching no file in scope → `closure.empty-claim`.
3. Owner of a file: the claiming Loci, reduced to those not an ancestor of another claimant. Exactly one → that Locus. More than one → `closure.ambiguous` (loci sorted). Zero → `closure.unowned`.
4. For each owned file, in file order, read its text and run `scanImports` (loader `tsx` for `.tsx`, else `ts`). If reading the file throws (for example it is not readable) or `scanImports` throws (the file does not parse), the check does not fail: it records one `closure.unparsable` finding (error, `file` = the file, `loci` = [owner], `detail` = `"parse"`, message `"<file> could not be parsed, so its imports were not checked."`, `knowledge` = `"derived"`), skips the imports of that file and continues with the next file. `checkClosure` never fails or dies because of a file's content or permissions. Otherwise resolve each specifier:
   - Relative (`./`, `../`) → try `<path>`, `<path>.ts`, `<path>.tsx`, `<path>/index.ts`, `<path>/index.tsx`, and `.js` → `.ts` replacement. Not found → `closure.unresolved-import`. Its owner B is checked with the dependency rule.
   - `node:*`, `bun`, `bun:*` → platform, always allowed.
   - A specifier starting with an alias `prefix` → replace the prefix with the alias `dir` and resolve it like a relative path from the repository root. Aliases apply only to files under the alias `dir`'s app (the first path segment pair, e.g. `apps/docs/`).
   - A name in `options.packages` (exact, or `name/<sub>`) → read `<root>/<dir>/package.json` and take `exports["."]` (bare name) or `exports["./<sub>"]`. Only string values are used. Resolve it to a repository-relative file. B = the owner of that file. A missing export or file → `closure.unresolved-import`. Then the dependency rule.
   - Before resolving, remove a query suffix (`?url`, `?raw`). A relative or alias path that then ends with an extension other than `.ts`, `.tsx` or `.js` (for example `.css`, `.json`) is an **asset**: it is allowed when the file exists, and `closure.unresolved-import` otherwise. A workspace subpath that ends with `/package.json` is also an asset and is allowed.
   - A resolved target file that has no owner (outside the scope or unowned) → `closure.unresolved-import` with the message `"<specifier> resolves to <file>, which no Locus owns."`.
   - Another bare specifier → package name = `@scope/name` or the first segment. Allowed if it is listed in `properties.packages` of an `telos.external` Locus that is the owner or an ancestor of the owner. Otherwise → `closure.unknown-external`.
   - Dependency rule: allowed when B === A, B is an ancestor or descendant of A, or a valid relation (any type) exists from A or any ancestor of A to B or to a capability of B. Otherwise → `closure.undeclared-dependency` (loci = [A, B]).
5. A file whose text matches `/\bimport\s*\(\s*(?!["'`])/` (a non-literal argument, e.g. `import(name)`) or `/\bimport\s*\(\s*`[^`]*\$\{/` (a template literal with an interpolation, e.g. ``import(`./m/${name}`)``) → one `closure.dynamic-import` finding for that file. A template literal without `${` is a literal: `scanImports` returns it, and it is resolved like a static import (checked with Bun 1.4.4-canary.1 while planning). This text scan runs on every file whose text was read, before `scanImports`, so a file that was read but does not parse can have both `closure.dynamic-import` and `closure.unparsable`. A file that could not be read has only `closure.unparsable`.

Other kernel functions you use (from `@telos/kernel`): `buildModel`, `hasErrors`, `verify` (`VerifyOptions { runner, methods?, loci?, now? }` → `Effect<VerificationReport>` with `summary { passed, failed, error }` and `findings`), `describeLocus(model, id)` and `describeModel(model)` (both `Effect`), `describeVerifications(model, id, report)`, `impact(model, target)` (plain function), `parseCapabilityKey`, `LocusNotFound`, `CapabilityNotFound`, and the types `ModelDescription`, `VerificationReport`, `VerificationDescription`, `LocusDefinition`.

Current state you change:

- Root `package.json` `verify` is `bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run docs:build && bun run test:e2e && bun run grace:lint`.
- `scripts/review-gate.ts` `CHECK_STEPS` has the eight steps of that script in order, and `scripts/review-gate.test.ts` compares `CHECK_STEPS` with `verifyStepNames(pkg.scripts.verify)` (the no-drift test, lines 208–235).
- WP01 already set the root `tsconfig.json` `include` to `["scripts", "telos.ts"]` and the root `dependencies` to `@telos/calculator`, `@telos/cli` and `@telos/kernel` (`workspace:*`) and `"effect": "4.0.4"`, so `scripts/telos.ts` can `import { Effect } from "effect"`. Do not add or change any dependency.

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

**Sanctioned edits outside `owned_files`** (name each one in your commit body):

- Root `package.json` (owned by WP01): add the `telos` and `telos:check` scripts and append `&& bun run telos:check` to `verify`.

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
| kernel-model | `GD-KERNEL-MODEL` | `VD-KERNEL-MODEL` | WP04 (WP22: adds a path and test files) | `M-KERNEL-MODEL` → model.ts; WP22 adds readonly-map.ts |
| kernel-verify | `GD-KERNEL-VERIFY` | `VD-KERNEL-VERIFY` | WP05 | `M-KERNEL-VERIFY` → verify.ts |
| kernel-describe | `GD-KERNEL-DESCRIBE` | `VD-KERNEL-DESCRIBE` | WP06 | `M-KERNEL-DESCRIBE` → describe.ts, fields.ts; `M-KERNEL-INVOKE` → invoke.ts |
| kernel-decode | `GD-KERNEL-DECODE` | `VD-KERNEL-DECODE` | WP07 | `M-KERNEL-DECODE` → decode.ts |
| kernel-closure | `GD-KERNEL-CLOSURE` | `VD-KERNEL-CLOSURE` | WP08 (WP22: adds a test file) | `M-KERNEL-CLOSURE` → closure.ts |
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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP15 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T084 – Failing tests

Create `scripts/telos.test.ts` (GRACE test markup) with every test of the contract's Tests list. Use `mkdtempSync(join(tmpdir(), "telos-cmd-"))` for temporary directories and remove them in `afterEach`. The fixture root for `check` is `Locus.make({ id: "fix:root", contains: [Locus.extend(Source).make({ id: "fix:a", properties: { sources: ["a/**/*.ts"] }, relations: [SourceDependsOn.to("fix:missing")] })] })` (a relation to a missing Locus is an error diagnostic). The closure fixture writes `a/x.ts` (claimed) and `b/y.ts` (unclaimed) into the temporary directory and runs `runTelos(["closure"], { root, cwd: dir })`; assert a `closure.unowned` finding for `b/y.ts` and exit code 1. Timing tests measure `performance.now()` around `runTelos` on the real repository. Each test that runs on the real repository gets a 30 s timeout.

Run them and see them fail.

### T085 – Root `telos.ts`

Write `telos.ts` exactly by the contract table and code shape. Purposes (use these exact texts; descriptions are one further sentence you write):

| Id | `purpose` |
| --- | --- |
| `telos:repository` | `Holds the Telos framework, its packs, the calculator proof and the documentation site.` |
| `telos:kernel` | `Builds, checks, describes, verifies and invokes semantic models.` |
| `telos:cli-pack` | `Derives command-line interfaces from capabilities exposed by CLI Loci.` |
| `telos:agent-pack` | `Derives agent tools and an MCP server from capabilities exposed by agent Loci.` |
| `telos:web-pack` | `Derives web form models from capabilities exposed by web Loci.` |
| `telos:calculator` | `Proves that one arithmetic implementation serves a command line, a web page and agent tools.` |
| `telos:tooling` | `Runs the repository checks, the review gate and the telos command.` |
| `telos:docs-site` | `Builds the documentation site from the foundation documents and the semantic report.` |
| `telos:legacy-locus` | `Keeps the previous Locus package until the documentation no longer uses it.` |

`telos:tooling` declares `packages: ["effect"]` (as in the contract table), because `scripts/telos.ts` runs kernel Effects. `telos:calculator` contains the imported `app` Locus (`calculator:app`), so the calculator Loci are part of the repository model.

**Docs externals procedure** (contract): first write `telos:docs-site` with `packages: []`, run `bun scripts/telos.ts closure`, collect the `detail` of every `closure.unknown-external` finding whose `loci[0]` is `telos:docs-site`, check each against `apps/docs/package.json` (`dependencies` or `devDependencies`), and write the sorted list into `packages`. A planning scan found these third-party packages in the docs files today, all in the manifest: `@axe-core/playwright, @playwright/test, @tailwindcss/vite, @tanstack/react-router, @tanstack/react-start, @vitejs/plugin-react, class-variance-authority, clsx, effect, lucide-react, mermaid, minisearch, radix-ui, react, react-dom, tailwind-merge, vite`. Use the list the closure check gives you; if it names a package that is not in the manifest, stop and report it.

### T086 – `scripts/telos.ts` commands

Implement `runTelos`, `CLOSURE_SCOPE` and the command table exactly. Details:

- Parse `argv[0]` as the command. Every successful command writes `JSON.stringify(value) + "\n"` to stdout. Errors write `JSON.stringify({ tag, message }) + "\n"` to stderr.
- `inspect <id>`: unknown id → `{"tag":"LocusNotFound","message":"No Locus <id> in the model."}`, exit 2.
- `impact <target>`: a target with `#` is parsed with `parseCapabilityKey`; unknown Locus → `LocusNotFound` as above; unknown capability → `{"tag":"CapabilityNotFound","message":"Locus <locus> has no capability <name>."}`; exit 2.
- `verify`: runner is `` `bun ${Bun.version}` ``.
- `closure`: `checkClosure(model, { root: cwd, include, exclude, aliases, packages })`, where `packages` are read from `cwd` with `new Bun.Glob("{packages,apps}/*/package.json").scanSync({ cwd })`: `{ name: manifest.name, dir: <the manifest's directory> }`, sorted by name.
- `check`: build the model, run `verify` (all methods) and `closure`; `ok` by the contract; exit 0 when `ok`, else 1.
- Missing arguments (`inspect` without id, `impact` without target, `report` without `--out <path>`) and unknown commands print the `UsageError` line and exit 2.
- `if (import.meta.main)` block exactly as the contract.

### T087 – `report` and `SemanticReport`

`report --out <path>`: compute everything `check` computes, then write the `SemanticReport` (`version: 1`; `provenance.runner` as `verify`; `generatedAt = new Date().toISOString()`; `commit` from `Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd })`, trimmed, or `null` when the exit code is not 0; `model = describeModel(model)`; `verification` = the full report; `verifications` = `describeVerifications(model, id, report)` for every id in `model.ids`; `closure = { limits, scope, fileCount: report.files.length, findings: report.findings }`; `ok`). Create parent directories with `mkdirSync(dirname(path), { recursive: true })`. Print `{"written":"<path>"}` and exit 0, or 1 when `ok` is false (the file is still written).

### T088 – Gate wiring

Sanctioned edit of the root `package.json`: add `"telos": "bun scripts/telos.ts"` and `"telos:check": "bun scripts/telos.ts check"`, and append ` && bun run telos:check` to the end of `verify`. In `scripts/review-gate.ts` append `{ name: "telos:check", command: ["bun", "run", "telos:check"] }` as the last `CHECK_STEPS` entry and add `telos:check` to the end of the step list in its `START_CONTRACT: CHECK_STEPS` OUTPUTS text. Update any hard-coded expected step list in `scripts/review-gate.test.ts` so the no-drift test stays green. Do not edit `.kittify/config.yaml`.

Then run `bun run telos check` on the repository. If it reports closure errors, fix them with declarations in `telos.ts` (claims, externals or relations that are true), never by adding files to `exclude`. If a finding shows a real architecture problem (for example a Pack importing another Pack), stop and report it.

### T089 – GRACE

Area `tooling` (you own `.grace/graph/tooling.xml` and `.grace/verification/tooling.xml` now): add `M-REPOSITORY-MODEL` (path `telos.ts`; children `<M-KERNEL-API />`, `<M-CALC-INTERFACES />`) with `V-M-REPOSITORY-MODEL` (`scripts/telos.test.ts`, `bun test scripts/telos.test.ts`), and `M-TELOS-COMMAND` (path `scripts/telos.ts`; children `<M-REPOSITORY-MODEL />`, `<M-KERNEL-API />`, `<M-KERNEL-CLOSURE />`) with `V-M-TELOS-COMMAND` (same test file). Update the `V-M-REVIEW-GATE` scenario text to mention the `telos:check` step. Add the new ids to the `GD-TOOLING` / `VD-TOOLING` `<Owns>` blocks. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP15 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Closure findings on the real repository must be fixed by true declarations, not by excluding files.
- `verify` now ends with `telos:check`; the review-gate no-drift test must stay green.
- Timing tests depend on machine speed; the limits come from NFR-003 and must not be raised.

## Reviewer guidance

- `bun run telos check` exits 0 and `bun run verify` runs it last.
- `telos.ts` matches the contract table (ids, claims, relations, containment).
- The docs externals list came from the closure check, not from guessing.

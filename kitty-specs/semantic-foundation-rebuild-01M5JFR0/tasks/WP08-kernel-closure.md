---
work_package_id: WP08
title: Kernel Semantic Closure check (Bun)
dependencies:
- WP04
requirement_refs:
- FR-015
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T042
- T043
- T044
- T045
- T046
- T047
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/closure.ts
create_intent:
- packages/kernel/src/closure.ts
- packages/kernel/test/closure.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/closure.ts
- packages/kernel/test/closure.test.ts
- .grace/graph/kernel-closure.xml
- .grace/verification/kernel-closure.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP08 – Kernel Semantic Closure check (Bun)

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

Implement `packages/kernel/src/closure.ts` (`@telos/kernel/closure`, Bun only): the Semantic Closure check. Every managed file must have exactly one owning Locus (the most specific claimant), every cross-Locus import must follow a declared relation, and every third-party import must be declared by an `External` Locus.

This module may use `Bun.Glob`, `Bun.Transpiler`, `node:fs` and `node:path`. It is **not** re-exported from `src/index.ts` (the export map already has `"./closure": "./src/closure.ts"` from WP01).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## closure.ts (WP08) — `@telos/kernel/closure`, Bun only

```ts
export type ClosureCode = "closure.unowned" | "closure.ambiguous" | "closure.empty-claim" | "closure.undeclared-dependency" | "closure.unknown-external" | "closure.unresolved-import" | "closure.dynamic-import"
export interface ClosureFinding {
  readonly code: ClosureCode
  readonly severity: "error" | "warning"     // warning for empty-claim and dynamic-import
  readonly file: string | null               // repository-relative path with "/" separators
  readonly loci: ReadonlyArray<string>
  readonly detail: string                    // the glob, import specifier or package name concerned
  readonly message: string
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
4. For each owned file, run `scanImports` (loader `tsx` for `.tsx`, else `ts`) and resolve each specifier:
   - Relative (`./`, `../`) → try `<path>`, `<path>.ts`, `<path>.tsx`, `<path>/index.ts`, `<path>/index.tsx`, and `.js` → `.ts` replacement. Not found → `closure.unresolved-import`. Its owner B is checked with the dependency rule.
   - `node:*`, `bun`, `bun:*` → platform, always allowed.
   - A specifier starting with an alias `prefix` → replace the prefix with the alias `dir` and resolve it like a relative path from the repository root. Aliases apply only to files under the alias `dir`'s app (the first path segment pair, e.g. `apps/docs/`).
   - A name in `options.packages` (exact, or `name/<sub>`) → read `<root>/<dir>/package.json` and take `exports["."]` (bare name) or `exports["./<sub>"]`. Only string values are used. Resolve it to a repository-relative file. B = the owner of that file. A missing export or file → `closure.unresolved-import`. Then the dependency rule.
   - Before resolving, remove a query suffix (`?url`, `?raw`). A relative or alias path that then ends with an extension other than `.ts`, `.tsx` or `.js` (for example `.css`, `.json`) is an **asset**: it is allowed when the file exists, and `closure.unresolved-import` otherwise. A workspace subpath that ends with `/package.json` is also an asset and is allowed.
   - A resolved target file that has no owner (outside the scope or unowned) → `closure.unresolved-import` with the message `"<specifier> resolves to <file>, which no Locus owns."`.
   - Another bare specifier → package name = `@scope/name` or the first segment. Allowed if it is listed in `properties.packages` of an `telos.external` Locus that is the owner or an ancestor of the owner. Otherwise → `closure.unknown-external`.
   - Dependency rule: allowed when B === A, B is an ancestor or descendant of A, or a valid relation (any type) exists from A or any ancestor of A to B or to a capability of B. Otherwise → `closure.undeclared-dependency` (loci = [A, B]).
5. A text match of `/\bimport\s*\(\s*(?!["'`])/` in a file → `closure.dynamic-import`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/data-model.md` (authoritative).

## Closure finding codes

| Code | Severity | Meaning |
| --- | --- | --- |
| `closure.unowned` | error | an in-scope file matches no `Source` glob |
| `closure.ambiguous` | error | the file matches Loci where neither contains the other |
| `closure.empty-claim` | warning | a `Source` glob matches no file in scope |
| `closure.undeclared-dependency` | error | a file of Locus A imports a file owned by Locus B, where B is not A, an ancestor or descendant of A, or a target of a relation from A or its ancestors |
| `closure.unknown-external` | error | a bare package import that no `External` declaration on the owner or its ancestors lists |
| `closure.unresolved-import` | error | a relative import whose target file does not exist |
| `closure.dynamic-import` | warning | a computed `import(...)`, so the dependency is unknown |

Modules you use: `SemanticModel`, `ancestors`, `outgoing` (`./model`); `deepFreeze` (`./freeze`). Read `properties.sources` of Loci whose kind has the extension id `telos.source`, and `properties.packages` of Loci whose kind has `telos.external` (`definition.kind.extensions.some((e) => e.id === "telos.source")`).

### Exact texts

`CLOSURE_LIMITS` (in this order):

```ts
export const CLOSURE_LIMITS: ReadonlyArray<string> = Object.freeze([
  "Ownership is checked per file; code inside a file is not attributed to a narrower Locus.",
  "Type-only imports are not seen, so type-only dependencies are not checked.",
  "A computed import(...) is found by a text scan and reported as an unknown dependency (closure.dynamic-import).",
  "Generated files, node_modules and files outside the include globs are not checked.",
]);
```

| Code | Severity | `file` | `loci` | `detail` | Message |
| --- | --- | --- | --- | --- | --- |
| `closure.unowned` | error | the file | `[]` | the file | `<file> is not claimed by any Locus.` |
| `closure.ambiguous` | error | the file | claimants, sorted | the file | `<file> is claimed by unrelated Loci <a>, <b>.` (all claimants joined with `", "`) |
| `closure.empty-claim` | warning | `null` | `[<locus>]` | the glob | `Source glob <glob> of <locus> matches no file.` |
| `closure.undeclared-dependency` | error | the importing file | `[A, B]` | the specifier | `<A> imports <B> through <specifier> without a declared relation.` |
| `closure.unknown-external` | error | the importing file | `[A]` | the package name | `<A> imports <package>, which no External declaration of <A> or its containers lists.` |
| `closure.unresolved-import` | error | the importing file | `[A]` | the specifier | `<specifier> does not resolve to a file.`, or `<specifier> resolves to <target file>, which no Locus owns.` when the target exists but has no owner |
| `closure.dynamic-import` | warning | the file | `[A]` | `import(` | `<file> contains a computed import(...); its dependency is unknown.` |

Findings are de-duplicated (same code, file, loci, detail) and sorted by code, then file (`""` for `null`), then detail, then message, with code-unit comparison.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP08 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T042 – Failing tests with temporary fixture repositories

Create `packages/kernel/test/closure.test.ts` with GRACE test markup. A local helper `fixture(files: Record<string, string>): string` writes the files under `mkdtempSync(join(tmpdir(), "telos-closure-"))` and returns the directory; remove it in `afterEach` with `rmSync(dir, { recursive: true, force: true })`. Never commit fixture files. Kinds: `Owned = Locus.extend(Source)`, `OwnedExt = Locus.extend(Source, External)`.

Each test runs `Effect.runPromise(checkClosure(buildModel(root), { root: dir, include: ["**/*.ts"] }))` unless it says otherwise, and asserts the full finding (code, severity, file, loci, detail, message) or its absence. One reported and one not-reported test per code:

| Code | Reported | Not reported |
| --- | --- | --- |
| `closure.unowned` | `a/x.ts` exists, no glob claims it | the glob `a/**/*.ts` claims it |
| `closure.ambiguous` | two sibling Loci both claim `a/**/*.ts` | a container claims `a/**/*.ts`, its child claims `a/b/**/*.ts`: `a/b/y.ts` is owned by the child (more specific wins), `a/x.ts` by the container |
| `closure.empty-claim` | glob `none/**/*.ts` matches nothing (warning, `hasClosureErrors` stays false when it is the only finding) | the glob matches a file |
| `closure.undeclared-dependency` | `a/x.ts` (`app:a`) has `import { y } from "../b/y";` and `b/y.ts` is owned by an unrelated `app:b` | the same with `SourceDependsOn.to(b)` on `app:a`; or on a container of `app:a`; or `app:b` contained in `app:a` |
| `closure.unknown-external` | `import { Effect } from "effect";` with no External | the owner or its container is `OwnedExt` with `packages: ["effect"]`; `import "@scope/pkg/sub"` allowed by `"@scope/pkg"` |
| `closure.unresolved-import` | `import "./missing";`; also, with `include: ["a/**/*.ts"]`, `a/x.ts` importing `../c/z` where `c/z.ts` exists outside the scope (the second message, `../c/z resolves to c/z.ts, which no Locus owns.`) | `./y` resolves through `./y.ts`, `./dir` through `./dir/index.ts`, `./z.js` through `./z.ts` |
| `closure.dynamic-import` | `const m = await import(name);` (warning) | `await import("./y")` with a literal is resolved like a static import |

More tests:

- Platform imports `node:fs`, `bun`, `bun:test` are always allowed.
- Asset imports: `import "./style.css";` is allowed when the file exists and unresolved when not; `import u from "./logo.svg?url";` strips the query first.
- Workspace packages: a fixture with `packages/k/package.json` `{ "name": "@x/k", "exports": { ".": "./src/index.ts", "./sub": "./src/sub.ts" } }` and options `packages: [{ name: "@x/k", dir: "packages/k" }]`: `import "@x/k"` and `import "@x/k/sub"` resolve to the owner of those files and then follow the dependency rule; `import "@x/k/nope"` is `closure.unresolved-import`; `import "@x/k/package.json"` is allowed.
- Aliases: options `aliases: [{ prefix: "@/", dir: "apps/d/src/" }]`; a file under `apps/d/` importing `@/lib/x` resolves to `apps/d/src/lib/x.ts`.
- `exclude: ["**/gen/**"]` removes `gen/x.ts` from `files`.
- `report.files` is sorted by file and lists the owner (`null` for unowned); `report.limits` equals `CLOSURE_LIMITS`; `report.knowledge` is `"derived"`; `report.scope` echoes include and exclude (`[]` default).
- The same fixture twice gives identical JSON.

### T043 – Scope, claims and owners

Algorithm steps 1–3. Use `new Bun.Glob(g).scanSync({ cwd: root, onlyFiles: true })` and convert any `\` to `/`. Owners: claimants of a file, minus every claimant that is in `ancestors(model, other)` of another claimant.

### T044 – Import scanning and resolution

Use `new Bun.Transpiler({ loader: file.endsWith(".tsx") ? "tsx" : "ts" }).scanImports(text)`; each entry's `path` is the specifier. Strip a `?query` suffix first. Resolve with the rules of the contract, in this order: platform; workspace package (exact name or `name/<sub>`); alias prefix (only for files whose path starts with the alias app directory, i.e. the first two segments of `dir`, for example `apps/docs/`); relative (`./`, `../`); otherwise a bare package. Relative and alias paths are joined with `path.posix` from the importing file's directory (relative) or the repository root (alias); a result that starts with `../` is unresolved. Candidates for a code path: `p`, `p.ts`, `p.tsx`, `p/index.ts`, `p/index.tsx`, and `p` with a final `.js` replaced by `.ts`. A path whose extension is not `.ts`, `.tsx` or `.js` is an asset: allowed when the file exists.

### T045 – Externals, the dependency rule, dynamic imports

- Bare package name = the first two segments for `@scope/name...`, otherwise the first segment. Allowed when any Locus in `[A, ...ancestors(model, A)]` with `telos.external` lists it.
- Dependency rule for an owned target file with owner B: allowed when `B === A`, B is in `ancestors(A)`, A is in `ancestors(B)`, or a valid relation (any type) from A or an ancestor of A targets `B` (`target.locus === B`, Locus or capability target). Use `outgoing` and check `valid`.
- Dynamic import: test the file text with `/\bimport\s*\(\s*(?!["'`])/`.

### T046 – Limits, sorting, `hasClosureErrors`

Add `CLOSURE_LIMITS` exactly, sort and de-duplicate the findings, deep-freeze the report, and implement `hasClosureErrors` (any finding with severity `error`).

### T047 – GRACE

Area `kernel-closure`. Register `M-KERNEL-CLOSURE` → `packages/kernel/src/closure.ts` (children `<M-KERNEL-MODEL />`) with `V-M-KERNEL-CLOSURE` (`packages/kernel/test/closure.test.ts`). Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP08 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Fixture directories live only in the OS temp directory; never write them into the repository.
- Normalise every path to forward slashes before comparing or reporting.
- `scanImports` does not report type-only imports; that is a documented limit, not a bug to work around.

## Reviewer guidance

- Each of the seven codes has a reported and a not-reported test.
- `closure.ts` is not imported by any file that `src/index.ts` imports.
- Messages and `CLOSURE_LIMITS` match the tables exactly.

---
work_package_id: WP02
title: 'Kernel foundations: identity, freeze, canonical JSON, digest, diagnostics, cycles'
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-008
- NFR-002
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/
create_intent:
- packages/kernel/src/identity.ts
- packages/kernel/src/freeze.ts
- packages/kernel/src/canonical.ts
- packages/kernel/src/digest.ts
- packages/kernel/src/diagnostic.ts
- packages/kernel/src/cycles.ts
- packages/kernel/test/identity.test.ts
- packages/kernel/test/freeze.test.ts
- packages/kernel/test/canonical.test.ts
- packages/kernel/test/digest.test.ts
- packages/kernel/test/diagnostic.test.ts
- packages/kernel/test/cycles.test.ts
- .grace/graph/kernel-base.xml
- .grace/verification/kernel-base.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/identity.ts
- packages/kernel/src/freeze.ts
- packages/kernel/src/canonical.ts
- packages/kernel/src/digest.ts
- packages/kernel/src/diagnostic.ts
- packages/kernel/src/cycles.ts
- packages/kernel/test/identity.test.ts
- packages/kernel/test/freeze.test.ts
- packages/kernel/test/canonical.test.ts
- packages/kernel/test/digest.test.ts
- packages/kernel/test/diagnostic.test.ts
- packages/kernel/test/cycles.test.ts
- .grace/graph/kernel-base.xml
- .grace/verification/kernel-base.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Kernel foundations: identity, freeze, canonical JSON, digest, diagnostics, cycles

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

Create the six base modules of `@telos/kernel` (`identity`, `freeze`, `canonical`, `digest`, `diagnostic`, `cycles`) with their tests. Most code is copied from the old `packages/locus` package (audit decision: keep or generalize). All kernel imports are relative, without extension. Nothing is exported from `packages/kernel/src/index.ts` yet (WP09 writes it), so tests import the modules by relative path, for example `import { isLocusId } from "../src/identity";`.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

# Contract: `@telos/kernel`

Package `packages/kernel`, name `@telos/kernel`. Dependency: `effect` 4.0.4 only. Export map (set by WP01):

```json
{ ".": "./src/index.ts", "./closure": "./src/closure.ts", "./package.json": "./package.json" }
```

The main entry (`src/index.ts` and everything it imports) must not import `bun`, `bun:*`, `node:*`, `effect/cli`, `effect/ai`, `effect/process`, React or any Pack. `src/closure.ts` is Bun-only and is not re-exported from the main entry.

All imports inside the kernel use relative paths without extension (`import { isLocusId } from "./identity"`). Types use `import type`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## identity.ts (WP02)

Reuses `packages/locus/src/identity.ts`.

```ts
export const LOCUS_ID_PATTERN: RegExp        // /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
export const EXTENSION_ID_PATTERN: RegExp    // /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*)*$/
export const CAPABILITY_NAME_PATTERN: RegExp // /^[a-z][a-zA-Z0-9]*$/
export function isLocusId(value: string): boolean        // pattern and length <= 128
export function isExtensionId(value: string): boolean    // pattern and length <= 128
export function isCapabilityName(value: string): boolean // pattern and length <= 64
export function capabilityKey(locus: string, capability: string): string // `${locus}#${capability}`
export function parseCapabilityKey(key: string): { readonly locus: string; readonly capability: string } | null
// parseCapabilityKey splits at the LAST "#"; it returns null when there is no "#" or either side is empty
```

## freeze.ts (WP02)

`export function deepFreeze<T>(value: T): T`. Copy `packages/locus/src/freeze.ts` unchanged, except that it **skips functions and objects that are Effect Schemas** (objects with an `ast` property). Schemas and handlers stay unfrozen.

## canonical.ts (WP02)

Copy `packages/locus/specs/canonical-json.ts`:

```ts
export const sortKeys: (value: unknown) => unknown
export const canonicalJson: (value: unknown) => string   // JSON with object keys sorted recursively, no spaces
export const jsonEqual: (a: unknown, b: unknown) => boolean
```

## digest.ts (WP02)

```ts
export type Digest = `sha256:${string}`
export const digestOf: (value: unknown) => Effect.Effect<Digest>
// SHA-256 (globalThis.crypto.subtle) over UTF-8 of canonicalJson(value); lowercase hex; dies if Web Crypto is missing
```

## diagnostic.ts (WP02)

```ts
export type Severity = "error" | "warning"
export type DiagnosticCode =
  | "identity.malformed" | "identity.duplicate" | "ownership.multiple"
  | "composition.extension-id-conflict" | "composition.property-conflict"
  | "composition.relation-type-conflict" | "composition.archetype-id-conflict"
  | "property.invalid" | "capability.name-malformed"
  | "relation.type-unavailable" | "relation.target-missing" | "relation.capability-missing"
  | "relation.target-kind" | "relation.self" | "relation.duplicate"
  | "relation.cycle" | "relation.cycle-limit"
export interface Diagnostic {
  readonly code: DiagnosticCode
  readonly severity: Severity
  readonly subject: string                    // Locus id (see data-model.md table)
  readonly path: string                       // e.g. "id", "contains", "properties", "relations/0", "capabilities/add", "kind"
  readonly members: ReadonlyArray<string>     // related ids (both extension ids for conflicts, cycle members); [] when none
  readonly message: string                    // one English sentence ending with "."
}
export const SEVERITY: Readonly<Record<DiagnosticCode, Severity>> // warning for relation.duplicate and relation.cycle-limit; error otherwise
export function makeDiagnostic(fields: { code: DiagnosticCode; subject: string; path: string; members?: ReadonlyArray<string>; message: string }): Diagnostic
// severity comes from SEVERITY; members defaults to []; the result is deep-frozen
export function compareDiagnostics(a: Diagnostic, b: Diagnostic): number
// order by subject, code, path, members.join(","), then JSON.stringify fallback; compare by UTF-16 code unit (<, >), never localeCompare
export function sortDiagnostics(list: ReadonlyArray<Diagnostic>): ReadonlyArray<Diagnostic>
// sorts with compareDiagnostics and drops exact duplicates (equal JSON.stringify)
```

## cycles.ts (WP02)

Copy `rotateToSmallest`, `cyclicComponent`, `reachWithin`, `findElementaryCycles` and `unblock` from `packages/locus/src/validate.ts` (lines 355–471), and add:

```ts
export const MAX_CYCLES = 100
export function elementaryCycles(
  nodes: ReadonlyArray<string>,                     // sorted ids
  edges: ReadonlyArray<readonly [string, string]>,  // from -> to, ids in nodes
): { readonly cycles: ReadonlyArray<ReadonlyArray<string>>; readonly exceeded: boolean }
// successor lists are deduplicated and sorted by index; each cycle is rotated to its smallest member;
// at most MAX_CYCLES cycles; exceeded is true when more exist; output sorted by cycle.join(",")
```

Legacy sources you copy from (they stay in place until WP20; never edit them):

| New file | Copy from | Change |
| --- | --- | --- |
| `src/identity.ts` | `packages/locus/src/identity.ts` | Replace the old names with the contract names. The prototype below is the target. |
| `src/freeze.ts` | `packages/locus/src/freeze.ts` | Add `if ("ast" in current) continue;` after the frozen check, so Effect Schemas stay unfrozen. Functions are already skipped by the `typeof current !== "object"` test. |
| `src/canonical.ts` | `packages/locus/specs/canonical-json.ts` | Export `sortKeys` too. Keep the behaviour (keys sorted by code unit, `undefined` members dropped, arrays keep order). |
| `src/digest.ts` | the digest part of `packages/locus/src/revision.ts` (`createRevision`) | `digestOf(value)` hashes `new TextEncoder().encode(canonicalJson(value))` with `globalThis.crypto.subtle.digest("SHA-256", …)` inside `Effect.promise` (so a missing Web Crypto is a defect), and returns `` `sha256:${hex}` `` with lowercase hex. |
| `src/diagnostic.ts` | `packages/locus/src/diagnostic.ts` (`makeDiagnostic`, `compareDiagnostics`) and the duplicate-dropping loop at the end of `validate` in `packages/locus/src/validate.ts` (just above `rotateToSmallest`) | New fields and codes as in the contract; no `scope` or `detail` field. |
| `src/cycles.ts` | `packages/locus/src/validate.ts`: `rotateToSmallest`, `cyclicComponent`, `reachWithin`, `findElementaryCycles`, `unblock` (from the comment above `rotateToSmallest` to the end of `unblock`, about lines 355–471), and the driver loop in `START_BLOCK_REFINES_CYCLES` (about lines 279–326) | Generalize the driver into `elementaryCycles(nodes, edges)` (see T010). |

The prototype of `identity.ts` (type-checked while planning; add the GRACE markup):

```ts
const PART = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
export const LOCUS_ID_PATTERN: RegExp = new RegExp(`^${PART}:${PART}$`);
export const EXTENSION_ID_PATTERN: RegExp = new RegExp(`^${PART}(?:\\.${PART})*$`);
export const CAPABILITY_NAME_PATTERN: RegExp = /^[a-z][a-zA-Z0-9]*$/;
export function isLocusId(value: string): boolean { return value.length <= 128 && LOCUS_ID_PATTERN.test(value); }
export function isExtensionId(value: string): boolean { return value.length <= 128 && EXTENSION_ID_PATTERN.test(value); }
export function isCapabilityName(value: string): boolean { return value.length <= 64 && CAPABILITY_NAME_PATTERN.test(value); }
export function capabilityKey(locus: string, capability: string): string { return `${locus}#${capability}`; }
export function parseCapabilityKey(key: string): { readonly locus: string; readonly capability: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0 || at === key.length - 1) return null;
  return { locus: key.slice(0, at), capability: key.slice(at + 1) };
}
```

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP02 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T006 – Failing tests

Create these test files (each with GRACE test markup). Every test below is required; add more if useful.

`packages/kernel/test/identity.test.ts`
- `isLocusId` accepts `"telos:kernel"`, `"calculator:arithmetic"`, `"a1:b-2"`; rejects `"Telos:kernel"`, `"telos"`, `"telos:"`, `"telos:kernel:x"`, `"telos:-x"`, `"telos:x--y"`, `"telos: kernel"` and a valid-looking id of 129 characters.
- `isExtensionId` accepts `"telos.purpose"`, `"calculator.arithmetic-behavior"`, `"demo"`; rejects `"Telos.purpose"`, `"telos..purpose"`, `"telos.purpose."`, `"telos:purpose"`.
- `isCapabilityName` accepts `"add"`, `"divideBy2"`; rejects `"Add"`, `"add-x"`, `"2add"`, `""`, and 65 characters.
- `capabilityKey("calculator:arithmetic", "add")` is `"calculator:arithmetic#add"`; `parseCapabilityKey` of that returns `{ locus: "calculator:arithmetic", capability: "add" }`; `parseCapabilityKey("a#b#c")` splits at the last `#` (`{ locus: "a#b", capability: "c" }`); `"nohash"`, `"#add"` and `"x:y#"` give `null`.

`packages/kernel/test/freeze.test.ts`
- A nested plain object and array are frozen at every level and the same reference is returned.
- An object with an `ast` property (use `Schema.Struct({ a: Schema.String })` from `effect`) inside a frozen object stays unfrozen (`Object.isFrozen(schema) === false`).
- A function value inside the object stays unfrozen.

`packages/kernel/test/canonical.test.ts`
- `canonicalJson({ b: [2, { d: 1, c: 0 }], a: "x" })` is exactly `{"a":"x","b":[2,{"c":0,"d":1}]}`.
- `undefined` members are dropped; arrays keep order; `jsonEqual({a:1,b:2},{b:2,a:1})` is true and `jsonEqual([1,2],[2,1])` is false.

`packages/kernel/test/digest.test.ts`
- `Effect.runPromise(digestOf({ a: 1 }))` equals `"sha256:015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862"` (SHA-256 of `{"a":1}`).
- `digestOf({ a: 1, b: 2 })` equals `digestOf({ b: 2, a: 1 })`; a different value gives a different digest; every digest matches `/^sha256:[0-9a-f]{64}$/`.

`packages/kernel/test/diagnostic.test.ts`
- `SEVERITY["relation.duplicate"]` and `SEVERITY["relation.cycle-limit"]` are `"warning"`; every other code of the `DiagnosticCode` union is `"error"` (list the 15 codes in the test).
- `makeDiagnostic` fills `severity` from `SEVERITY`, defaults `members` to `[]`, and returns a frozen object.
- `compareDiagnostics` orders by subject first, then code, then path, then `members.join(",")`; it uses code-unit order (`"B" < "a"`).
- `sortDiagnostics` sorts and drops exact duplicates (equal `JSON.stringify`), keeping one.

`packages/kernel/test/cycles.test.ts`
- No edges → `{ cycles: [], exceeded: false }`.
- `a→b→a` gives `[["a","b"]]`; `a→b→c→a` plus `b→a` gives both cycles, sorted by `cycle.join(",")`.
- Duplicate edges do not duplicate cycles; a self-edge `a→a` gives no cycle.
- Edges given in a different order give the same output.
- The complete digraph on 6 nodes `n1`…`n6` (every ordered pair, no self-edges) has 409 elementary cycles, so the result has exactly `MAX_CYCLES` (100) cycles and `exceeded: true`.
- 3 nodes in one 3-cycle: `exceeded` is false.

Run `bun test packages/kernel/test` and see them fail (missing modules).

### T007 – `identity.ts` and `freeze.ts`

Implement both from the table above. `freeze.ts` exports only `deepFreeze`.

### T008 – `canonical.ts` and `digest.ts`

Implement from the table above. `digest.ts` imports `canonicalJson` from `./canonical` and `Effect` from `effect`, and exports `Digest` and `digestOf`.

### T009 – `diagnostic.ts`

Implement exactly the contract: `Severity`, `DiagnosticCode` (17 codes), `Diagnostic`, `SEVERITY` (frozen record), `makeDiagnostic`, `compareDiagnostics`, `sortDiagnostics`. Use `deepFreeze` from `./freeze`. Compare strings only with `<` and `>`, never `localeCompare`.

### T010 – `cycles.ts`

Copy the five helper functions unchanged except for types (`Identity` becomes `string`). Export `MAX_CYCLES = 100` and:

```ts
export function elementaryCycles(
  nodes: ReadonlyArray<string>,
  edges: ReadonlyArray<readonly [string, string]>,
): { readonly cycles: ReadonlyArray<ReadonlyArray<string>>; readonly exceeded: boolean }
```

Algorithm (the old driver loop, generalized):

1. `index` maps each node to its position in `nodes` (the caller passes them sorted). Ignore an edge whose ends are not both in `nodes`, and ignore self-edges.
2. Build `successors` and `predecessors` per index, then sort each list ascending and remove duplicates.
3. For `s` from 0 while not exceeded: `component = cyclicComponent(s, successors, predecessors)`; skip when `component.size < 2`; call `findElementaryCycles(s, successors, component, onCycle)`. `onCycle` returns `false` and sets `exceeded = true` when `MAX_CYCLES` cycles are already collected; otherwise it maps the indices to ids, applies `rotateToSmallest`, stores the cycle and returns `true`.
4. Sort the cycles by `cycle.join(",")` (code-unit order) and return them deep-frozen with `exceeded`.

### T011 – GRACE

Area `kernel-base` (`GD-KERNEL-BASE`, `VD-KERNEL-BASE`). Register:

- `M-KERNEL-IDENTITY` → `packages/kernel/src/identity.ts`, `packages/kernel/src/freeze.ts`; no dependencies; tests `identity.test.ts`, `freeze.test.ts`.
- `M-KERNEL-CANONICAL` → `canonical.ts`, `digest.ts`; no dependencies; tests `canonical.test.ts`, `digest.test.ts`.
- `M-KERNEL-DIAGNOSTIC` → `diagnostic.ts`, `cycles.ts`; depends on `M-KERNEL-IDENTITY`; tests `diagnostic.test.ts`, `cycles.test.ts`.

Each verification entry's `<Command>` runs its test files (`bun test packages/kernel/test/identity.test.ts packages/kernel/test/freeze.test.ts`). Then run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP02 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Leaving old names (`Identity`, `isIdentity`, `refines`) in the copied code: search your files for them before committing.
- `localeCompare` anywhere breaks determinism (NFR-002).

## Reviewer guidance

- Check the digest test vector and the 6-node limit test exist and pass.
- Check `freeze.ts` skips objects with `ast`.
- Check that every export is in its file's `START_MODULE_MAP`.

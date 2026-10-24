---
work_package_id: WP07
title: Kernel JSON definition decoding
dependencies:
- WP04
requirement_refs:
- FR-016
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: d0f55cbbfae1a7297721d18caaa28afa1f955bc4
created_at: '2026-10-24T09:23:16.646472+00:00'
subtasks:
- T036
- T037
- T038
- T039
- T040
- T041
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/decode.ts
create_intent:
- packages/kernel/src/decode.ts
- packages/kernel/test/decode.test.ts
- .grace/graph/kernel-decode.xml
- .grace/verification/kernel-decode.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/decode.ts
- packages/kernel/test/decode.test.ts
- .grace/graph/kernel-decode.xml
- .grace/verification/kernel-decode.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP07 – Kernel JSON definition decoding

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

Implement `packages/kernel/src/decode.ts`: Locus definitions given as JSON (for the docs playground and for agents) are decoded against a registry of extensions into the same `LocusDefinition` objects that code builds. JSON is data: it is decoded, never evaluated.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## decode.ts (WP07)

JSON definitions for the playground and agents. They are decoded, never evaluated.

```ts
export interface ExtensionRegistry { readonly extensions: ReadonlyArray<Extension> }   // looked up by id
export type FieldType = "number" | "integer" | "string" | "boolean"
export interface LocusJson {
  readonly id: string
  readonly extensions?: ReadonlyArray<string>                  // extension ids from the registry
  readonly description?: string
  readonly properties?: Readonly<Record<string, unknown>>
  readonly contains?: ReadonlyArray<LocusJson>
  readonly relations?: ReadonlyArray<{ readonly type: string; readonly target: string }>  // target "ns:name" or "ns:name#capability"
  readonly capabilities?: Readonly<Record<string, {
    readonly description: string
    readonly effect: EffectClass
    readonly input: Readonly<Record<string, FieldType>>
    readonly output: Readonly<Record<string, FieldType>>
  }>>
}
export interface DecodeIssue { readonly path: string; readonly message: string }   // path like "contains/0/relations/1/type"
export type DecodeResult =
  | { readonly ok: true; readonly root: LocusDefinition }
  | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> }
export const LocusJsonSchema: Schema.Codec<LocusJson>   // recursive (Schema.suspend) structural schema
export function decodeLocus(input: unknown, registry: ExtensionRegistry): DecodeResult
export function decodeLocusText(text: string, registry: ExtensionRegistry): DecodeResult  // JSON.parse failure -> issue at path "" with the parser message
```

Rules:

- An unknown extension id → issue `"Unknown extension <id>."`.
- A relation type id not declared by any registry extension → issue `"Unknown relation type <id>."`. A type that exists in the registry but is not declared by this Locus's extensions decodes fine, and `buildModel` then reports `relation.type-unavailable`. This keeps structural problems as diagnostics.
- Field type mapping: `number` → `Schema.Finite`, `integer` → `Schema.Int`, `string` → `Schema.String`, `boolean` → `Schema.Boolean`.
- Capabilities use `Capability.declare` (no handler).
- The kind is `Locus.extend(...extensionsInListedOrder)`.

Modules you use: `Locus` (`./locus`), `Extension` (`./extension`), `Capability`, `EffectClass` (`./capability`), `RelationType` (`./relation`), `deepFreeze` (`./freeze`). You do not need `buildModel` in `decode.ts`; the parity test uses it.

### Structural schema

`LocusJsonSchema` checks the shape only (ids are not checked here; `buildModel` reports malformed ids):

```ts
const FieldTypeSchema = Schema.Literals(["number", "integer", "string", "boolean"]);
const CapabilityJsonSchema = Schema.Struct({
  description: Schema.String,
  effect: Schema.Literals(["pure", "read", "write"]),
  input: Schema.Record(Schema.String, FieldTypeSchema),
  output: Schema.Record(Schema.String, FieldTypeSchema),
});
export const LocusJsonSchema: Schema.Codec<LocusJson> = Schema.Struct({
  id: Schema.String,
  extensions: Schema.optionalKey(Schema.Array(Schema.String)),
  description: Schema.optionalKey(Schema.String),
  properties: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
  contains: Schema.optionalKey(Schema.Array(Schema.suspend((): Schema.Codec<LocusJson> => LocusJsonSchema))),
  relations: Schema.optionalKey(Schema.Array(Schema.Struct({ type: Schema.String, target: Schema.String }))),
  capabilities: Schema.optionalKey(Schema.Record(Schema.String, CapabilityJsonSchema)),
});
```

This pattern (`Schema.Literals([...])`, `Schema.Record(Schema.String, value)`, `Schema.suspend` with an explicit return type) was type-checked and run while planning. Planning output for `{ id: "x", contains: [{}], rec: { k: "c" } }`: issues `[{"path":["contains",0,"id"],"message":"Missing key"},{"path":["rec","k"],"message":"Expected \"a\" | \"b\""}]`.

Decoding uses `Schema.decodeUnknownExit(LocusJsonSchema)(input, { errors: "all" })`. Issues come from `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues` with `error = Option.getOrThrow(Cause.findErrorOption(exit.cause))`. A decode issue path is the issue path elements (`typeof p === "object" ? p.key : p`) joined with `"/"`, for example `contains/0/relations/1/type`; the root is `""`.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP07 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T036 – Failing tests

Create `packages/kernel/test/decode.test.ts` with GRACE test markup. The registry is `{ extensions: [Purpose, Source, External, Flow] }`, where `Flow` is a test extension `test.flow` with RelationType `test.flows-to` (target `"locus"`, `acyclic: true`).

- `decodeLocus({ id: "demo:hello" }, registry)` → `ok: true`; the root has `kind.extensions` `[]`, `description: null`, and `buildModel(root).diagnostics` is `[]`.
- Extensions are composed in listed order: `{ id: "demo:a", extensions: ["telos.purpose", "telos.source"], properties: { purpose: "p", sources: ["x/**"] } }` → kind extension ids `["telos.purpose", "telos.source"]`, properties decoded.
- Contained Loci and relations: a root containing `demo:b`, with `relations: [{ type: "test.flows-to", target: "demo:b" }]` on a Locus whose extensions include `test.flow` → `relations[0].type === Flow's RelationType object`, target `{ locus: "demo:b", capability: null }`.
- A capability target string `"demo:b#run"` gives `{ locus: "demo:b", capability: "run" }`.
- Capabilities: `{ run: { description: "d", effect: "read", input: { n: "integer" }, output: { ok: "boolean" } } }` → a capability with `handler: null`, `effect: "read"`; `Schema.decodeUnknownSync(cap.input)({ n: 1 })` succeeds and `({ n: 1.5 })` throws.
- Field type mapping: `number` accepts `1.5` and rejects `Infinity`; `string` and `boolean` behave as their schemas.
- Unknown extension: `{ id: "demo:a", extensions: ["demo.unknown"] }` → `ok: false`, issues `[{ path: "extensions/0", message: "Unknown extension demo.unknown." }]`.
- Unknown relation type: `{ id: "demo:a", relations: [{ type: "demo.nope", target: "demo:b" }] }` → issue at `relations/0/type` with `Unknown relation type demo.nope.`
- A relation type that exists in the registry but not in the Locus's extensions decodes fine, and `buildModel` reports `relation.type-unavailable`.
- Structural errors: `{ id: 5 }` → `ok: false` with an issue at path `id`; `{ id: "demo:a", contains: [{ }] }` → an issue at `contains/0/id`.
- Nested issue paths: an unknown relation type in `contains[0].relations[1]` → path `contains/0/relations/1/type`.
- `decodeLocusText("{", registry)` → `ok: false`, one issue with path `""` and the `JSON.parse` error message; `decodeLocusText('{"id":"demo:a"}', registry)` → `ok: true`.
- Never evaluated: a JSON string such as `{"id":"demo:a","description":"${process.exit(1)}"}` decodes with that literal description.

### T037 – `LocusJsonSchema`

Write the schema above with the `LocusJson`, `FieldType`, `DecodeIssue`, `DecodeResult` and `ExtensionRegistry` types of the contract.

### T038 – `decodeLocus`

1. Decode structurally. On failure, return `{ ok: false, issues }` (paths joined with `/`).
2. Walk the decoded tree depth-first (children in array order), with the current path prefix. Collect issues for unknown extension ids (`<prefix>extensions/<i>`) and unknown relation types (`<prefix>relations/<i>/type`). A relation type is known when any registry extension's `relationTypes` has that id; use the first such RelationType object.
3. If any issue was collected, return `{ ok: false, issues }` sorted by path, then message.
4. Otherwise build each Locus bottom-up: `kind = Locus.extend(...extensions in listed order)`; `capabilities` with `Capability.declare({ description, effect, input: Schema.Struct(mapped fields), output: Schema.Struct(mapped fields) })`; `relations` with `type.to(target)`; `kind.make({ id, description, properties, contains, relations, capabilities })` (omit keys that are absent).

Field mapping: `number` → `Schema.Finite`, `integer` → `Schema.Int`, `string` → `Schema.String`, `boolean` → `Schema.Boolean`.

### T039 – `decodeLocusText`

`JSON.parse` inside `try`; on a throw return `{ ok: false, issues: [{ path: "", message: <error.message> }] }`; otherwise `decodeLocus`.

### T040 – Parity test

In `decode.test.ts`, define the same small model twice: once in code (`Locus.extend(Purpose, Flow).make(...)`, with a 2-cycle of `test.flows-to` and a relation to a missing Locus) and once as JSON with the same ids, properties and relations. `JSON.stringify(buildModel(codeRoot).diagnostics)` equals `JSON.stringify(buildModel(jsonRoot).diagnostics)`.

### T041 – GRACE

Area `kernel-decode`. Register `M-KERNEL-DECODE` → `packages/kernel/src/decode.ts` (children `<M-KERNEL-DEFINITIONS />`) with `V-M-KERNEL-DECODE` (`packages/kernel/test/decode.test.ts`). Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP07 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- The recursive schema needs `Schema.suspend` with an explicit return type, or TypeScript reports an implicit `any` cycle.
- Issue paths are strings joined with `/`; tests compare them exactly.

## Reviewer guidance

- Check unknown extension, unknown relation type, JSON syntax error and the parity test exist and pass.
- Check nothing in `decode.ts` evaluates text (`eval`, `Function`, dynamic `import`).

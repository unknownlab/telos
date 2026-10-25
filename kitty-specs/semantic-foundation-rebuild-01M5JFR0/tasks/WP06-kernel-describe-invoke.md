---
work_package_id: WP06
title: Kernel descriptions, governed invocation and input fields
dependencies:
- WP05
requirement_refs:
- FR-007
- FR-011
- FR-012
- FR-013
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: eff4051992c42fa386790cc69bb48c7300e876fc
created_at: '2026-10-24T09:32:09.544509+00:00'
subtasks:
- T030
- T031
- T032
- T033
- T034
- T035
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/
create_intent:
- packages/kernel/src/describe.ts
- packages/kernel/src/invoke.ts
- packages/kernel/src/fields.ts
- packages/kernel/test/describe.test.ts
- packages/kernel/test/invoke.test.ts
- packages/kernel/test/fields.test.ts
- .grace/graph/kernel-describe.xml
- .grace/verification/kernel-describe.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/describe.ts
- packages/kernel/src/invoke.ts
- packages/kernel/src/fields.ts
- packages/kernel/test/describe.test.ts
- packages/kernel/test/invoke.test.ts
- packages/kernel/test/fields.test.ts
- .grace/graph/kernel-describe.xml
- .grace/verification/kernel-describe.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP06 – Kernel descriptions, governed invocation and input fields

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

Implement three kernel modules:

- `describe.ts`: JSON descriptions of Loci, capabilities, the model and verification state, each with its knowledge status and a digest.
- `invoke.ts`: governed invocation. A capability runs only through a grant, with input decoded and output encoded against its contract. Every outcome is a value, never a failure.
- `fields.ts`: input fields derived from a capability description, and the text-to-value coercion that every interface Pack shares.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## describe.ts (WP06)

```ts
export type Knowledge = "declared" | "derived" | "verified" | "failed" | "not-run" | "observed" | "invalidated" | "unknown"
// "observed" and "invalidated" are reserved: no function in this mission returns them (directive §5)
export interface JsonSchemaDocument { readonly dialect: string; readonly schema: unknown; readonly definitions: Readonly<Record<string, unknown>> }
export interface RelationDescription {
  readonly type: string
  readonly typeDescription: string
  readonly from: string
  readonly target: RelationTarget
  readonly grantsInvocation: boolean
  readonly knowledge: "declared" | "derived"   // "declared" in outgoing lists, "derived" in incoming lists
}
export interface CapabilityDescription {
  readonly ref: string                          // capabilityKey(locus, name)
  readonly locus: string
  readonly name: string
  readonly description: string
  readonly effect: EffectClass
  readonly input: JsonSchemaDocument
  readonly output: JsonSchemaDocument
  readonly errors: ReadonlyArray<{ readonly tag: string; readonly schema: JsonSchemaDocument }>  // sorted by tag
  readonly implemented: boolean
  readonly contractDigest: Digest               // digestOf({ input, output, errors, effect })
  readonly exposedBy: ReadonlyArray<{ readonly locus: string; readonly relationType: string }> // valid granting relations to it; sorted
  readonly knowledge: "declared"
}
export interface VerificationDescription {
  readonly archetype: string
  readonly rule: string
  readonly description: string
  readonly method: RuleMethod
  readonly outcome: Outcome | "not-run"
  readonly message: string | null
  readonly knowledge: "verified" | "failed" | "not-run"
  readonly provenance: Provenance | null
}
export interface LocusDescription {
  readonly id: string
  readonly description: string | null
  readonly container: string | null
  readonly contains: ReadonlyArray<string>
  readonly extensions: ReadonlyArray<{ readonly id: string; readonly description: string }>
  readonly properties: unknown                  // encoded with Schema.encodeUnknownSync(Schema.Struct(kind.properties)); raw value when issues exist
  readonly relations: { readonly outgoing: ReadonlyArray<RelationDescription>; readonly incoming: ReadonlyArray<RelationDescription> }
  readonly capabilities: ReadonlyArray<CapabilityDescription>   // sorted by name
  readonly archetypes: ReadonlyArray<{ readonly id: string; readonly description: string; readonly rules: ReadonlyArray<{ readonly id: string; readonly description: string; readonly method: RuleMethod }> }>
  readonly diagnostics: ReadonlyArray<Diagnostic>              // model diagnostics whose subject is this id
  readonly digest: Digest                                      // digestOf(the description without digest and knowledge)
  readonly knowledge: "declared"
}
export interface ModelDescription {
  readonly root: string
  readonly loci: ReadonlyArray<LocusDescription>   // in model.ids order
  readonly diagnostics: ReadonlyArray<Diagnostic>
  readonly digest: Digest                          // digestOf(loci.map(l => l.digest))
}
export const toJsonSchema: (schema: Schema.Top) => JsonSchemaDocument  // Schema.toJsonSchemaDocument
export const describeCapability: (model: SemanticModel, locus: string, name: string) => Effect.Effect<CapabilityDescription>
export const describeLocus: (model: SemanticModel, id: string) => Effect.Effect<LocusDescription>   // dies for an unknown id; callers check first
export const describeModel: (model: SemanticModel) => Effect.Effect<ModelDescription>
export function describeVerifications(model: SemanticModel, id: string, report: VerificationReport | null): ReadonlyArray<VerificationDescription>
// one entry per rule of applicableArchetypes(model, id), sorted by archetype then rule;
// with a matching finding: outcome = finding.outcome, knowledge = "verified" when passed else "failed", provenance = report.provenance;
// otherwise outcome "not-run", knowledge "not-run", message null, provenance null
```

## invoke.ts (WP06)

```ts
export interface InvocationIssue { readonly path: ReadonlyArray<PropertyKey>; readonly message: string }
export interface InvocationError {
  readonly tag: string
  readonly message: string
  readonly issues: ReadonlyArray<InvocationIssue>   // [] unless tag is InvalidInput or InvalidOutput
}
export type InvocationOutcome =
  | { readonly ok: true; readonly output: unknown }          // encoded output (JSON-compatible)
  | { readonly ok: false; readonly error: InvocationError }
export interface InvokeOptions { readonly via: string }       // the Locus id performing the invocation
export function isGranted(model: SemanticModel, ref: CapabilityRef, via: string): boolean
export const invoke: (model: SemanticModel, ref: CapabilityRef | string, input: unknown, options: InvokeOptions) => Effect.Effect<InvocationOutcome>
```

Steps, in this order (messages are exact):

1. Parse `ref`. If it is a string without `#` → `CapabilityNotFound` `"Not a capability reference: <ref>."`.
2. Unknown Locus → `LocusNotFound` `"No Locus <locus> in the model."`.
3. Unknown capability → `CapabilityNotFound` `"Locus <locus> has no capability <name>."`.
4. `!isGranted` → `NotGranted` `"<via> is not granted to invoke <locus>#<name>."`. Granted when `via === ref.locus`, or some valid model relation has `from === via`, `type.grantsInvocation`, `target.locus === ref.locus` and `target.capability === ref.capability`.
5. Decode the input with `{ errors: "all" }`. On failure → `InvalidInput` `"Invalid input for <locus>#<name>."`, with `issues` from the standard-schema formatter.
6. `handler === null` → `NotImplemented` `"<locus>#<name> has no implementation."`.
7. Run the handler under `Effect.exit` (wrap it in `Effect.suspend` so synchronous throws become defects):
   - A `Fail` value matched by `Schema.is(errorSchema)` → `{ tag: value._tag, message: value.message, issues: [] }`.
   - Any other `Fail`, and any `Die` → `Defect` `"<locus>#<name> failed unexpectedly: <String(cause value)>."`.
8. Encode the output with `Schema.encodeUnknownExit(output)`. On failure → `InvalidOutput` `"<locus>#<name> returned output that does not match its contract."` with issues.
9. Return `{ ok: true, output: encoded }`.

## fields.ts (WP06)

Shared by every interface Pack, so the CLI, Web and Agent paths turn text into input the same way (NFR-004).

```ts
export type InputFieldType = "number" | "integer" | "string" | "boolean" | "unsupported"
export interface InputField {
  readonly name: string
  readonly type: InputFieldType
  readonly required: boolean
  readonly description: string | null
}
export function inputFields(capability: CapabilityDescription): ReadonlyArray<InputField>
export function coerceInput(fields: ReadonlyArray<InputField>, raw: Readonly<Record<string, string | undefined>>): Record<string, unknown>
```

Rules for `inputFields`:

- Read `capability.input.schema`. If it contains `$ref` of the form `"#/$defs/<Name>"`, resolve it in `capability.input.definitions[<Name>]`, once, at the top level and for each property.
- If the resolved schema's `type` is not `"object"` or it has no `properties` object → `[]`.
- Keep the key order of `properties`. `type` is the property's `type` when it is one of `number`, `integer`, `string`, `boolean`, and `"unsupported"` otherwise. `required` is true when the name is in the schema's `required` array. `description` is the property's `description` string, or `null`.

Rules for `coerceInput`. For each field whose raw value is not `undefined` (absent fields are omitted, so the kernel reports a missing key):

- `number` / `integer`: if `raw.trim() === ""`, keep the raw string. Otherwise use `Number(raw.trim())`. If that is `NaN`, keep the raw string, so the kernel reports `InvalidInput`.
- `boolean`: `"true"` → `true`, `"false"` → `false`, anything else is kept as the raw string.
- `string` / `unsupported`: the raw string.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/data-model.md` (authoritative).

## Invocation error tags

| Tag | Raised by | Meaning |
| --- | --- | --- |
| `LocusNotFound` | kernel | the ref's Locus is not in the model |
| `CapabilityNotFound` | kernel | the Locus has no such capability |
| `NotGranted` | kernel | `via` has no granting relation to the capability |
| `InvalidInput` | kernel | raw input does not decode. `issues` lists `{ path, message }`. |
| `NotImplemented` | kernel | the capability has no handler (JSON-declared) |
| `InvalidOutput` | kernel | the handler's output does not encode against the output contract |
| `Defect` | kernel | the handler died or failed with an undeclared value |
| any declared tag | the handler | a declared TaggedError, for example `DivisionByZero` or `NonFiniteResult` |

Modules you use: `digestOf`, `Digest` (`./digest`); `capabilityKey`, `parseCapabilityKey` (`./identity`); `deepFreeze` (`./freeze`); `CapabilityRef`, `RelationTarget` (`./relation`); `errorTag`, `EffectClass` (`./capability`); `SemanticModel`, `incoming`, `outgoing` (`./model`); `applicableArchetypes`, `VerificationReport`, `Outcome`, `Provenance` (`./verify`); `RuleMethod` (`./archetype`); `Diagnostic` (`./diagnostic`).

### Effect 4.0.4 facts (run while planning)

- `Schema.toJsonSchemaDocument(Schema.Struct({ a: Schema.Finite, b: Schema.Finite }))` returns `{"dialect":"draft-2020-12","schema":{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"],"additionalProperties":true},"definitions":{}}`. So `toJsonSchema` is `(schema) => { const d = Schema.toJsonSchemaDocument(schema); return { dialect: d.dialect, schema: d.schema, definitions: d.definitions }; }`.
- For a TaggedError class `DivisionByZero` it returns `{"dialect":"draft-2020-12","schema":{"$ref":"#/$defs/DivisionByZeroEncoded"},"definitions":{"DivisionByZeroEncoded":{...}}}`, and `DivisionByZero.identifier` is `"DivisionByZero"`.
- `Schema.decodeUnknownExit(Operands)({ a: "x" }, { errors: "all" })` fails; `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues` is `[{"path":["a"],"message":"Expected number"},{"path":["b"],"message":"Missing key"}]`, where `error = Option.getOrThrow(Cause.findErrorOption(exit.cause))`. Map each path element `p` to `typeof p === "object" ? p.key : p` (the same helper as in `locus.ts`).
- `Schema.is(DivisionByZero)(value)` tells a declared error from any other failure value.
- `Schema.encodeUnknownExit(Schema.Struct({ result: Schema.Finite }))({ result: "no" })` is a failure.
- The run pattern: `const exit = yield* Effect.exit(Effect.suspend(() => handler(decoded)))`. A thrown error inside the handler ends as a defect; `String(Cause.squash(exit.cause))` is `"Error: boom"` for `throw new Error("boom")`, and `"x"` for `Effect.die("x")`.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP06 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T030 – Failing describe tests

Create `packages/kernel/test/describe.test.ts` with GRACE test markup. Fixture: an extension `test.ui` with RelationType `test.calls` (target `"capability"`, `grantsInvocation: true`) and `test.uses` (target `"locus"`); `app:math` of kind `Locus.extend(Purpose)` (purpose `"Math."`) with capabilities `double` (input `Schema.Struct({ n: Schema.Finite })`, output `Schema.Struct({ value: Schema.Finite })`, errors `[Negative]`, effect `"pure"`) and `half` (same shapes, no errors); `app:ui` of kind `Locus.extend(Ui)` with `test.calls` to `app:math#double` and `test.uses` to `app:math`; an Archetype `test.math-rules` (appliesTo `["telos.purpose"]`) with static rules `r.a` (passes) and `r.b` (fails); root `app:root` contains both.

Tests:

- `describeCapability(model, "app:math", "double")`: `ref` `"app:math#double"`, `effect` `"pure"`, `input.schema.type` `"object"`, `errors[0].tag` `"Negative"`, `implemented: true`, `exposedBy` `[{ locus: "app:ui", relationType: "test.calls" }]`, `knowledge: "declared"`, and `contractDigest` equals `digestOf({ input, output, errors, effect })` computed in the test from the same values.
- `contractDigest` changes when the output schema changes and stays the same for an identical schema built again.
- `describeLocus(model, "app:math")`: `extensions` `[{ id: "telos.purpose", description: <Purpose description> }]`; `properties` `{ purpose: "Math." }`; capabilities sorted by name (`half`, `double` → `["double", "half"]`); `relations.incoming` has both relations from `app:ui` with `knowledge: "derived"`; `archetypes[0].rules` lists `r.a` and `r.b` with their methods; `knowledge: "declared"`.
- `describeLocus(model, "app:ui").relations.outgoing` entries have `knowledge: "declared"`, `typeDescription`, and `grantsInvocation` true for `test.calls`.
- `diagnostics` of a Locus contains only diagnostics whose subject is that id (use a second model with a missing target).
- `digest` equals `digestOf` of the description without `digest` and `knowledge`.
- `describeModel`: `loci` ids equal `model.ids`; `digest` equals `digestOf(loci.map((l) => l.digest))`; describing twice gives identical JSON.
- `describeVerifications(model, "app:math", null)`: two entries, both `outcome: "not-run"`, `knowledge: "not-run"`, `message: null`, `provenance: null` (US2.4: never passed without a run).
- With a report from `verify(model, { runner: "test" })`: `r.a` is `outcome: "passed"`, `knowledge: "verified"`; `r.b` is `failed` / `"failed"` with its message; both carry `report.provenance`.
- No function returns `observed` or `invalidated` (assert that `JSON.stringify(describeModel(...))` does not contain them).

### T031 – `describe.ts`: schemas, capabilities, Loci, model

- `describeCapability`: dies (`Effect.die`) for an unknown Locus or capability. `errors` sorted by tag. `exposedBy` = the valid model relations with `type.grantsInvocation`, `target.locus === locus` and `target.capability === name`, mapped to `{ locus: from, relationType: type.id }`, sorted by locus then relationType.
- `describeLocus`: dies for an unknown id. `extensions` in composition order. `properties`: when `propertyIssues` is empty, `Schema.encodeUnknownSync(Schema.Struct(kind.properties))(definition.properties)`; otherwise the raw `definition.properties`. `relations.outgoing` = `outgoing(model, id)` with `knowledge: "declared"`; `relations.incoming` = `incoming(model, id)` with `knowledge: "derived"`; both keep model order. `capabilities` by name (code-unit order). `archetypes` from `applicableArchetypes(model, id)` with rules in declared order. `digest` over everything except `digest` and `knowledge`.
- `describeModel` as in the contract.
- Deep-freeze every returned description.

### T032 – `describeVerifications`

One entry per rule of `applicableArchetypes(model, id)`, sorted by archetype id, then rule id. A matching finding is the one with the same `locus`, `archetype` and `rule`. `knowledge` is `"verified"` only for `passed`; `"failed"` for `failed` and `error`; `"not-run"` without a finding.

### T033 – `invoke.ts`

Create `packages/kernel/test/invoke.test.ts` first. Fixture: `app:math` with `double` (doubles `n`; fails with `Negative` when `n < 0`), `boom` (handler throws `new Error("boom")`), `undeclared` (fails with an error class it does not declare), `liar` (output schema `{ value: Schema.Finite }` but the handler returns `{ value: "no" }` via a cast), `declared` (built with `Capability.declare`, no handler); `app:ui` with a `grantsInvocation: true` relation to `app:math#double`; `app:other` with a `grantsInvocation: false` relation to `app:math#double`. One test per tag, each asserting the full outcome object with the exact message:

| Case | Outcome |
| --- | --- |
| `invoke(model, "app:math#double", { n: 2 }, { via: "app:math" })` | `{ ok: true, output: { value: 4 } }` |
| same `via: "app:ui"` | `{ ok: true, output: { value: 4 } }` |
| `"nohash"` | `CapabilityNotFound`, `Not a capability reference: nohash.` |
| `"app:none#double"` | `LocusNotFound`, `No Locus app:none in the model.` |
| `"app:math#nope"` | `CapabilityNotFound`, `Locus app:math has no capability nope.` |
| `double` via `app:other` | `NotGranted`, `app:other is not granted to invoke app:math#double.` |
| `double` with `{ n: "x" }` | `InvalidInput`, `Invalid input for app:math#double.`, issues `[{ path: ["n"], message: "Expected number" }]` |
| `double` with `{ n: -1 }` | `{ tag: "Negative", message: <its message>, issues: [] }` |
| `declared` with valid input | `NotImplemented`, `app:math#declared has no implementation.` |
| `boom` | `Defect`, `app:math#boom failed unexpectedly: Error: boom.` |
| `undeclared` | `Defect` whose message starts with `app:math#undeclared failed unexpectedly: ` |
| `liar` | `InvalidOutput`, `app:math#liar returned output that does not match its contract.`, non-empty issues |

Also: `isGranted` is false for a relation that is not valid (for example a `grantsInvocation` relation from a Locus whose kind does not declare the type), and the input never reaches the handler when it is invalid (a handler that records calls stays at 0 calls).

Then implement the nine steps of the contract in order inside `Effect.gen`. The Effect's error type is `never`.

### T034 – `fields.ts`

Create `packages/kernel/test/fields.test.ts` first. Build `CapabilityDescription` objects by hand in the test (only `input` matters), so the test does not depend on schema annotations:

- `{ schema: { type: "object", properties: { a: { type: "number" }, b: { type: "integer", description: "B." }, c: { type: "array" } }, required: ["a"] }, definitions: {} }` → `[{ name: "a", type: "number", required: true, description: null }, { name: "b", type: "integer", required: false, description: "B." }, { name: "c", type: "unsupported", required: false, description: null }]`.
- `{ schema: { $ref: "#/$defs/In" }, definitions: { In: { type: "object", properties: { s: { $ref: "#/$defs/Str" } }, required: ["s"] }, Str: { type: "string" } } }` → `[{ name: "s", type: "string", required: true, description: null }]`.
- A non-object schema (`{ type: "number" }`) → `[]`.
- Also from a real description: `inputFields(describeCapability(model, "app:math", "double"))` → one field `n`, `number`, required.
- `coerceInput` with fields `a: number`, `i: integer`, `f: boolean`, `s: string`: `{ a: "2.5", i: "3", f: "true", s: "x" }` → `{ a: 2.5, i: 3, f: true, s: "x" }`; `{ a: "x" }` → `{ a: "x" }`; `{ a: "" }` → `{ a: "" }`; `{ a: " 4 " }` → `{ a: 4 }`; `{ f: "yes" }` → `{ f: "yes" }`; an absent field (`undefined`) is omitted from the result.

Then implement `fields.ts` exactly by the contract rules.

### T035 – GRACE

Area `kernel-describe`. Register `M-KERNEL-DESCRIBE` → `describe.ts`, `fields.ts` (children `<M-KERNEL-MODEL />`, `<M-KERNEL-VERIFY />`, `<M-KERNEL-CANONICAL />`) with `V-M-KERNEL-DESCRIBE` (`describe.test.ts`, `fields.test.ts`), and `M-KERNEL-INVOKE` → `invoke.ts` (children `<M-KERNEL-MODEL />`, `<M-KERNEL-DEFINITIONS />`) with `V-M-KERNEL-INVOKE` (`invoke.test.ts`). Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP06 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Digests must be computed over exactly the documented objects, or later WPs and the docs site disagree.
- `invoke` must never fail in its error channel; use `Effect.exit` around the handler.

## Reviewer guidance

- Each invocation error tag has its own test with the exact message.
- `describeVerifications` never reports `verified` without a matching passed finding.
- No module returns `observed` or `invalidated`.

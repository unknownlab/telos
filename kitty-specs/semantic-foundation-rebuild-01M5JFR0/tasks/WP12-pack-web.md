---
work_package_id: WP12
title: Web Pack @telos/web (form model)
dependencies:
- WP09
requirement_refs:
- FR-019
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T068
- T069
- T070
- T071
phase: Phase 3 – Packs
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/web/
create_intent:
- packages/web/src/semantics.ts
- packages/web/src/form.ts
- packages/web/src/archetype.ts
- packages/web/src/index.ts
- packages/web/test/fixture.ts
- packages/web/test/form.test.ts
- packages/web/test/archetype.test.ts
- .grace/graph/pack-web.xml
- .grace/verification/pack-web.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/web/src/semantics.ts
- packages/web/src/form.ts
- packages/web/src/archetype.ts
- packages/web/src/index.ts
- packages/web/test/fixture.ts
- packages/web/test/form.test.ts
- packages/web/test/archetype.test.ts
- .grace/graph/pack-web.xml
- .grace/verification/pack-web.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP12 – Web Pack @telos/web (form model)

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

Implement the Web Pack `packages/web` (`@telos/web`): a web interface Locus exposes capabilities through `web.form` relations, and the Pack derives a UI-independent form model (one form per exposed capability). Submitting a form coerces the text fields with kernel `coerceInput` and calls kernel `invoke` with `via` = the web Locus. The docs site (WP20) renders this model; the Pack itself imports no React and no DOM API.

The package scaffold (`package.json` with the export map, `tsconfig.json`, `test/tsconfig.json`, `src/index.ts` containing `export {};`) already exists from WP01. Do not change the scaffold files.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/packs.md` (authoritative).

# Contract: Packs `@telos/cli`, `@telos/agent`, `@telos/web`

Packs are ordinary packages that import **only** the public entry `@telos/kernel` (never `@telos/kernel/src/...`) and `effect`. No Pack imports another Pack. The main entry of every Pack is browser-safe. Bun-only code lives in the extra entries listed in each export map.

Shared rules:

- An **interface Locus** is a Locus whose kind includes the Pack's extension. It exposes a capability through a relation of the Pack's relation type. These relation types have `target: "capability"` and `grantsInvocation: true`.
- An interface Locus is recognized by its kind: `definition.kind.extensions.some((e) => e.id === "<extension id>")`.
- The exposed capabilities are the valid (`valid: true`) outgoing model relations of the interface Locus whose `type.id` equals the Pack's relation type id constant. They are sorted by capability name, then by Locus id. When two targets share a capability name, only the first is used, and the Pack's Archetype reports it.
- **Module order, to avoid import cycles**: the relation type id is a string constant in the derivation module (`derive.ts`, `tools.ts`, `form.ts`). `semantics.ts` imports that constant and `archetype.ts`, and it is the only module that builds the RelationType and the Extension. `archetype.ts` imports the derivation and run modules, never `semantics.ts`.
- Every invocation goes through kernel `invoke(model, ref, input, { via: interfaceLocusId })`. Text input is turned into values with kernel `inputFields` + `coerceInput`. Errors are the kernel's `InvocationError`, unchanged.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/packs.md` (authoritative).

## `@telos/web` (WP12)

Export map: `{ ".": "./src/index.ts", "./package.json": "./package.json" }`. No React or DOM import: the docs site renders the form model.

### semantics.ts

```ts
export const WebForm: RelationType<"web.form">
// description "Exposes the target capability as a web form named after the capability."; target "capability"; grantsInvocation true
export const WebSemantics: Extension<"telos.web", { title: typeof Schema.String }>
// description "Marks a Locus as a web interface. Its `title` is the page title."; relationTypes [WebForm]; archetypes [WebInterface]
```

### form.ts

```ts
export const WEB_FORM_TYPE = "web.form"
export interface WebField {
  readonly name: string
  readonly label: string                 // the field name, first letter upper-cased ("a" -> "A")
  readonly type: InputFieldType
  readonly required: boolean
  readonly inputMode: "decimal" | "numeric" | "text"   // number -> decimal, integer -> numeric, otherwise text
  readonly description: string | null
}
export interface WebFormDefinition {
  readonly name: string                  // capability name
  readonly ref: string                   // capability key
  readonly description: string
  readonly fields: ReadonlyArray<WebField>
  readonly submit: (raw: Readonly<Record<string, string | undefined>>) => Effect.Effect<InvocationOutcome>
  // invoke(model, ref, coerceInput(fields, raw), { via: webLocusId })
}
export interface WebFormModel { readonly locus: string; readonly title: string; readonly forms: ReadonlyArray<WebFormDefinition> }
export const formModel: (model: SemanticModel, webLocusId: string) => Effect.Effect<WebFormModel, LocusNotFound>
// fails with LocusNotFound when the id is unknown or the Locus lacks WebSemantics
```

### archetype.ts

```ts
export const WebInterface: Archetype   // id "telos.web.interface", appliesTo ["telos.web"]
```

| Rule id | Method | Passes when |
| --- | --- | --- |
| `web.forms-exist` | static | at least one valid `web.form` relation |
| `web.unique-forms` | static | no two exposed capabilities share a name |
| `web.fields-derivable` | static | no field of type `unsupported` |
| `web.invalid-input-error` | execution | for every form with a required field, `submit({})` gives `{ ok: false }` with `error.tag === "InvalidInput"` |

### index.ts

Exports `WEB_FORM_TYPE, WebForm, WebSemantics, WebInterface, formModel, WebFormModel, WebFormDefinition, WebField`.

Kernel APIs you use (from `@telos/kernel` only):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

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

`LocusNotFound` is the kernel's TaggedError: `new LocusNotFound({ id, message })`.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP12 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T068 – Fixture and failing tests

`packages/web/test/fixture.ts` (GRACE test markup), importing only `@telos/kernel`, `effect` and `../src/...`:

```ts
export class Negative extends Schema.TaggedError<Negative>()("Negative", { message: Schema.String }) {}
export const double = Capability.make({
  description: "Doubles n.",
  input: Schema.Struct({ n: Schema.Finite }),
  output: Schema.Struct({ value: Schema.Finite }),
  errors: [Negative],
  effect: "pure",
  handler: ({ n }) => (n < 0 ? Effect.fail(new Negative({ message: "n must not be negative." })) : Effect.succeed({ value: n * 2 })),
});
export const math = Locus.make({ id: "example:math", capabilities: { double } });
export const web = Locus.extend(WebSemantics).make({ id: "example:web", properties: { title: "Math" }, relations: [WebForm.to(math.capability("double"))] });
export const root = Locus.make({ id: "example:root", contains: [math, web] });
export const model = buildModel(root);
export const withWeb = (webLocus: LocusDefinition, extra: ReadonlyArray<LocusDefinition> = []) =>
  buildModel(Locus.make({ id: "example:root", contains: [math, webLocus, ...extra] }));
```

`packages/web/test/form.test.ts`:

- `buildModel(root).diagnostics` is `[]`.
- `formModel(model, "example:web")` → `locus: "example:web"`, `title: "Math"`, one form with `name: "double"`, `ref: "example:math#double"`, `description: "Doubles n."`, `fields: [{ name: "n", label: "N", type: "number", required: true, inputMode: "decimal", description: null }]`.
- `inputMode` mapping: a capability with input `Schema.Struct({ i: Schema.Int, s: Schema.String, b: Schema.Boolean })` gives `numeric`, `text`, `text` (and labels `I`, `S`, `B`).
- `submit({ n: "2" })` → `{ ok: true, output: { value: 4 } }`; `submit({ n: " 2.5 " })` → `{ value: 5 }`; `submit({ n: "-1" })` → error tag `Negative`; `submit({ n: "x" })` and `submit({})` → `InvalidInput` with message `Invalid input for example:math#double.`; `submit({ n: "" })` → `InvalidInput`.
- `formModel(model, "example:none")` fails with `LocusNotFound` (`id: "example:none"`, message `No web Locus example:none in the model.`); the same for `"example:math"`. Assert with `Effect.exit` and `Cause.findErrorOption`.
- Forms are sorted by capability name; with two targets of the same name, the one with the smaller Locus id is used.

`packages/web/test/archetype.test.ts`: one passing and one failing test per `WebInterface` rule, via `verify(m, { runner: "test", loci: ["example:web"] })`:

| Rule | Failing model | Message |
| --- | --- | --- |
| `web.forms-exist` | `example:web` with no relations | `Web Locus example:web exposes no form.` |
| `web.unique-forms` | relations to `example:math#double` and `example:other#double` | `Form double is exposed more than once.` |
| `web.fields-derivable` | relation to `example:math#tags` with input `Schema.Struct({ tags: Schema.Array(Schema.String) })` | `Capability example:math#tags has an unsupported field tags.` |
| `web.invalid-input-error` | the not-granted fake below | `Form double does not answer missing input with InvalidInput.` |

```ts
const FakeForm = RelationType.make("web.form", { description: "Fake form.", target: "capability" });
const FakeWeb = Extension.make("telos.web", { description: "Fake web.", properties: { title: Schema.String }, relationTypes: [FakeForm], archetypes: [WebInterface] });
const fake = Locus.extend(FakeWeb).make({ id: "example:web", properties: { title: "Math" }, relations: [FakeForm.to(math.capability("double"))] });
```

The fake's relation type id matches, so the form is derived, but it does not grant invocation; the kernel answers `NotGranted`, so the rule fails. Define the extra capabilities and Loci inside the test file.

Run the tests and see them fail.

### T069 – `form.ts`

`WEB_FORM_TYPE`, `WebField`, `WebFormDefinition`, `WebFormModel` and `formModel`:

1. Unknown id, or a Locus whose kind has no extension with id `telos.web` → `Effect.fail(new LocusNotFound({ id, message: \`No web Locus ${id} in the model.\` }))`.
2. `title = String(properties.title)`.
3. Exposed capabilities by the shared rules (valid outgoing relations with `type.id === WEB_FORM_TYPE`, sorted by capability name then Locus id, first per name).
4. For each: `describeCapability`, `inputFields`, and the `WebField` mapping (`label` = first letter upper-cased: `name.charAt(0).toUpperCase() + name.slice(1)`; `inputMode`: `number` → `decimal`, `integer` → `numeric`, otherwise `text`).
5. `submit(raw)` = `invoke(model, ref, coerceInput(fields, raw), { via: webLocusId })` (pass the kernel `InputField` list to `coerceInput`).

Deep-freeze nothing that holds functions; return plain objects.

### T070 – `semantics.ts` and `archetype.ts`

`WebForm` and `WebSemantics` with the exact descriptions (`semantics.ts` imports `WEB_FORM_TYPE` from `./form` and `WebInterface` from `./archetype`). `WebInterface`: `id "telos.web.interface"`, description `"Checks that a web interface Locus exposes uniquely named forms with derivable fields that reject invalid input."`, `appliesTo: ["telos.web"]`, rules in table order:

| Rule | Description |
| --- | --- |
| `web.forms-exist` | `The interface exposes at least one form.` |
| `web.unique-forms` | `No two exposed capabilities share a form name.` |
| `web.fields-derivable` | `Every field of every form can be derived.` |
| `web.invalid-input-error` | `Every form with a required field answers missing input with InvalidInput.` |

`web.unique-forms` checks all valid `web.form` relations before the first-per-name reduction. The execution rule runs `formModel(ctx.model, ctx.locus.id)` and, for every form with a required field, `submit({})`; it passes when the outcome is `{ ok: false }` with `error.tag === "InvalidInput"`. `archetype.ts` imports `./form`, never `./semantics`.

### T071 – `index.ts` and GRACE

`src/index.ts` exports exactly `WEB_FORM_TYPE, WebForm, WebSemantics, WebInterface, formModel` as values and `WebFormModel, WebFormDefinition, WebField` as types. Area `pack-web`: `M-PACK-WEB` with one `<Path>` per `packages/web/src/*.ts` file and child `<M-KERNEL-API />`, and `V-M-PACK-WEB` with both test files and the command `bun test packages/web/test`. Add the ids to your `<Owns>` blocks. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP12 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- No `react`, `react-dom`, `document`, `window` or `Bun` in `packages/web/src`.
- Absent fields must stay absent after `coerceInput`, so the kernel reports a missing key.

## Reviewer guidance

- Every `WebInterface` rule has a passing and a failing test.
- `submit` goes through kernel `invoke` with `via` = the web Locus.

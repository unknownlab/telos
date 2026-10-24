---
work_package_id: WP18
title: Documentation playground on the real kernel
dependencies:
- WP09
- WP16
requirement_refs:
- FR-026
- NFR-001
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T102
- T103
- T104
- T105
- T106
- T107
- T108
- T109
phase: Phase 7 – Documentation site
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/src/playground/
create_intent:
- apps/docs/test/playground.test.ts
- .grace/graph/docs.xml
- .grace/verification/docs.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/playground/**
- apps/docs/src/routes/playground/**
- apps/docs/src/routeTree.gen.ts
- apps/docs/test/playground.test.ts
- apps/docs/test/playground-render-de.test.tsx
- apps/docs/test/playground-render.test.tsx
- apps/docs/test/playground-revisions.test.ts
- apps/docs/test/playground-run.test.ts
- apps/docs/test/playground-specs.test.ts
- apps/docs/test/run-state.test.ts
- apps/docs/e2e/playground.e2e.ts
- apps/docs/e2e/equality.e2e.ts
- apps/docs/e2e/keyboard.e2e.ts
- apps/docs/e2e/search.e2e.ts
- .grace/graph/docs.xml
- .grace/verification/docs.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP18 – Documentation playground on the real kernel

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Objective

Replace the old scenario playground (`/playground` index plus `/playground/a` … `/playground/e`, built on `@telos/locus`) with one page, `/playground`, where a reader picks or types a JSON Locus definition and the real `@telos/kernel` decodes, builds, verifies and describes it in the browser (FR-026, NFR-001). Delete the old scenario code and tests, and move every test and link that named the old pages to the new page.

`apps/docs/package.json` already depends on `@telos/kernel`, `@telos/web` and `@telos/calculator` (WP01). The kernel API is complete (WP09). WP16 has rewritten the doctrine. Do not touch the verification page, the spec report or `src/lib/build*.ts` / `src/lib/provenance.ts` (WP19 replaces them).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

## Playground (WP18); calculator page, guides, removal (WP20)

WP18 replaces the old scenario playground before WP19 removes the spec report, because the old scenario E reads the spec report through `src/lib/build.ts`. The new playground imports neither `src/lib/build.ts`, `src/lib/build-data.ts` nor `src/lib/provenance.ts`: the provenance it shows is the verification report's own `provenance`.

### Playground (WP18; `/playground`, single page; `/playground/$scenario` is removed)

- `src/playground/registry.ts` (rewritten) exports `PLAYGROUND_REGISTRY: ExtensionRegistry`:
  - `[Purpose, Source, External, DemoLabelA, DemoLabelB, DemoFlow]` (the docs app depends only on `@telos/kernel`, `@telos/web` and `@telos/calculator`)
  - `DemoLabelA` (`"demo.label-a"`) and `DemoLabelB` (`"demo.label-b"`) both define `label: Schema.String`, so composing them shows a conflict.
  - `DemoFlow` (`"demo.flow"`) defines the RelationType `"demo.flows-to"` (target `"locus"`, `acyclic: true`) and an Archetype `"demo.flow-has-label"` with one static rule `flow.labelled`, which fails when the Locus has no `description`.
- `src/playground/examples.ts` exports `PLAYGROUND_EXAMPLES: ReadonlyArray<{ name: string; title: string; valid: boolean; json: string }>`:

  | name | valid | shows |
  | --- | --- | --- |
  | `minimal` | yes | `{"id":"demo:hello"}` |
  | `composed` | yes | Purpose and Source with properties, a contained Locus, and a `demo.flows-to` relation |
  | `property-conflict` | no | extensions `demo.label-a` and `demo.label-b` → `composition.property-conflict` |
  | `invalid-property` | no | Purpose with `purpose: 5` → `property.invalid` |
  | `missing-target` | no | relation to `demo:nowhere` → `relation.target-missing` |
  | `cycle` | no | two Loci that flow to each other → `relation.cycle` |
  | `malformed-id` | no | id `Demo Hello` → `identity.malformed` |
  | `unknown-extension` | no | `extensions: ["demo.unknown"]` → decode issue |

- `src/playground/run.ts`: `runDefinition(text: string): Effect<PlaygroundResult>`. It calls `decodeLocusText`, then `buildModel`, `verify(model, { runner: "browser", methods: ["static"] })` and `describeModel`. The result is `{ kind: "decode-error", decodeIssues } | { kind: "built", diagnostics, report, description }`; the `kind` discriminator lets the UI and tests switch on the result.
- UI: an example picker, a JSON editor (the existing `json-editor` component), a Run button, and result panels for decode issues, diagnostics, verification findings and the model description. The result root has `data-result="playground"`.
- Delete the old scenario files: `run-fabric.ts`, `run-revisions.ts`, `run-specs.ts`, `locus-text.ts`, `run-state.ts`, `use-run.ts`, the scenario components, `routes/playground/$scenario.tsx`, and their tests (`test/playground-*.test.ts(x)` except `playground-safety.test.ts`, and `test/run-state.test.ts`). The new playground keeps its run state inside its own component.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

### e2e (WP18 playground and selectors, WP20 calculator)

- `playground.e2e.ts` (rewritten):
  - For each example, run it and assert the expected diagnostic code text or "No diagnostics".
  - Edit the JSON to a syntax error and assert that the decode issue appears.
  - This proves the kernel runs in Chromium (NFR-001).
- `calculator.e2e.ts` (new): `add` 2 and 3 shows `"result":5`, `divide` 1 and 0 shows `DivisionByZero`, and `a = x` shows `InvalidInput`.
- `keyboard.e2e.ts`, `search.e2e.ts`, `navigation.e2e.ts`, `provenance.e2e.ts` and `a11y.e2e.ts`: replace the old scenario pages and selectors (`/playground/a`…`/playground/e`, `#fabric-input`, "Fabric JSON") with the single `/playground` page and the new editor's.
- `equality.e2e.ts` is deleted by WP18: it only compares old Revision ids between Bun and the browser, and Revisions are removed (spec D1).

The Playground llms bullet (contract, `scripts/content.ts` `llmsText`): "Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser."

Kernel APIs you use (import from `@telos/kernel` only):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

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

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## relation.ts (WP03)

```ts
export interface RelationTarget { readonly locus: string; readonly capability: string | null }
export interface CapabilityRef { readonly _tag: "CapabilityRef"; readonly locus: string; readonly capability: string }
export const CapabilityRef: { make: (locus: string, capability: string) => CapabilityRef }
export interface RelationType<Id extends string = string> {
  readonly _tag: "RelationType"
  readonly id: Id
  readonly description: string
  readonly target: "locus" | "capability"
  readonly acyclic: boolean
  readonly grantsInvocation: boolean
  readonly to: (target: { readonly id: string } | CapabilityRef | string) => Relation
  // a { id } object (a LocusDefinition) -> { locus: id, capability: null }
  // a CapabilityRef -> { locus, capability }
  // a string: parseCapabilityKey(s) when it contains "#", otherwise { locus: s, capability: null }
}
export interface Relation { readonly type: RelationType; readonly target: RelationTarget }
export const RelationType: {
  make: <const Id extends string>(id: Id, options: {
    readonly description: string
    readonly target: "locus" | "capability"
    readonly acyclic?: boolean           // default false
    readonly grantsInvocation?: boolean  // default false
  }) => RelationType<Id>
}
export function relationTargetKey(target: RelationTarget): string // capability === null ? locus : capabilityKey(locus, capability)
```

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## archetype.ts (WP03)

```ts
export class RuleViolation extends Schema.TaggedError<RuleViolation>()("RuleViolation", { message: Schema.String }) {}
export type RuleMethod = "static" | "execution"
export interface RuleContext {
  readonly locus: LocusDefinition       // the Locus the rule is applied to
  readonly model: SemanticModel         // the whole model (for cross-Locus rules)
}
export interface Rule {
  readonly id: string                   // matches EXTENSION_ID_PATTERN, unique within its Archetype
  readonly description: string
  readonly method: RuleMethod
  readonly check: (ctx: RuleContext) => Effect.Effect<void, RuleViolation>
}
export interface Archetype {
  readonly _tag: "Archetype"
  readonly id: string                   // matches EXTENSION_ID_PATTERN
  readonly description: string
  readonly appliesTo: ReadonlyArray<string>   // extension ids, non-empty
  readonly rules: ReadonlyArray<Rule>
}
export const Rule: { make: (rule: Rule) => Rule }
export const Archetype: { make: (options: Omit<Archetype, "_tag">) => Archetype }
export const violation: (message: string) => Effect.Effect<never, RuleViolation> // Effect.fail(new RuleViolation({ message }))
```

`archetype.ts` imports `LocusDefinition` and `SemanticModel` with `import type` only, to avoid runtime cycles.

## extension.ts (WP03)

```ts
export interface Extension<Id extends string = string, F extends Schema.Struct.Fields = Schema.Struct.Fields> {
  readonly _tag: "Extension"
  readonly id: Id
  readonly description: string
  readonly properties: F
  readonly relationTypes: ReadonlyArray<RelationType>
  readonly archetypes: ReadonlyArray<Archetype>
}
export const Extension: {
  make: <const Id extends string, const F extends Schema.Struct.Fields = {}>(id: Id, options: {
    readonly description: string
    readonly properties?: F
    readonly relationTypes?: ReadonlyArray<RelationType>
    readonly archetypes?: ReadonlyArray<Archetype>
  }) => Extension<Id, F>
}
```

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## extensions/purpose.ts (WP03)

```ts
export const Purpose: Extension<"telos.purpose", {
  purpose: Schema.String
  responsibilities: Schema.optionalKey<Schema.$Array<Schema.String>>
  excluded: Schema.optionalKey<Schema.$Array<Schema.String>>
}>
// description: "States why a Locus exists, what it is responsible for and what it explicitly excludes."
```

Use `Schema.Array(Schema.String)` in the value. The written type above is illustrative, so let TypeScript infer it from `Extension.make`.

## extensions/source.ts (WP03)

```ts
export const SourceDependsOn: RelationType<"source.depends-on">  // target "locus", acyclic: false, grantsInvocation: false
// description: "The source files of this Locus import code owned by the target Locus."
export const Source: Extension<"telos.source", { sources: Schema.$Array<Schema.String> }>
// description: "Claims source files for a Locus by repository-relative glob patterns."; relationTypes: [SourceDependsOn]
export const External: Extension<"telos.external", { packages: Schema.$Array<Schema.String> }>
// description: "Declares third-party packages this Locus may import, without modelling their internals."
```

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

`buildModel(root: LocusDefinition): SemanticModel` (synchronous, never throws) returns a model whose `diagnostics: ReadonlyArray<Diagnostic>` are sorted. `describeModel(model): Effect<ModelDescription>` returns `{ root, loci, diagnostics, digest }`.

### The page contract you implement (tests rely on these exact selectors and texts)

- Route file `apps/docs/src/routes/playground/index.tsx` (`createFileRoute("/playground/")`): title `pageTitle("Playground")`, meta description = `PLAYGROUND_INTRO`, component `PlaygroundPage`.
- `<main id="content" data-page="playground" className="flex flex-col gap-8 py-8">`, `<h1>Playground</h1>`, `<p>{PLAYGROUND_INTRO}</p>` where `PLAYGROUND_INTRO` (exported from `registry.ts`) is exactly the llms bullet text above.
- Before hydration (`useState(false)` + `useEffect(() => setHydrated(true), [])`, as the old `scenario-shell.tsx` does): `<div data-slot="no-js">` with an Alert "The playground needs JavaScript. Without it you can read the example input below; the results appear only when the kernel runs in your browser." and `<pre data-slot="example-input" tabIndex={0}>` holding the `minimal` example's `json`.
- After hydration: `<div data-slot="playground" data-ready="true">` holding:
  - `<label htmlFor="playground-example">Example</label>` and `<select id="playground-example" data-action="example">` with one `<option value={name}>{title}</option>` per example; changing it sets the editor text to that example's `json`.
  - `<JsonEditor id="playground-input" label="Locus JSON" … />` (the existing component in `src/playground/components/json-editor.tsx`; keep it).
  - `<Button data-action="run">Run</Button>` (disabled while running) and `<Button variant="outline" data-action="reset">Reset to example</Button>`.
  - `<div data-slot="results" aria-live="polite">`: idle text `Press Run to decode, build and verify this definition in your browser.`; while running `Running…`; on a defect an Alert `The run failed: <message>`.
  - After a run: `<section data-result="playground" data-provenance={stale ? "historical" : "browser"} data-valid={valid ? "true" : "false"}>`, where `stale` = the editor text differs from the text that was run, and `valid` = no decode issues and no diagnostic with `severity === "error"`. Inside, in this order:
    1. `<p data-slot="provenance-label">`: when a report exists, `Run in this browser at <report.provenance.finishedAt> with @telos/kernel.`; for decode issues, `Decoded in this browser at <time of the run, ISO>; nothing was built.` When stale, prefix `Historical: ` and lower-case the first letter of the rest (`Historical: run in this browser at …`), and append ` The input has changed since this run.`
    2. Decode issues (only for a decode failure): `<h2>Decode issues</h2>` and a list of `<li data-decode-issue>` with `<code>{path === "" ? "(root)" : path}</code> {message}`.
    3. Otherwise: `<h2>Diagnostics</h2>`, then `<p data-slot="no-diagnostics">No diagnostics</p>` or a table with one `<tr data-diagnostic-code={code}>` per diagnostic (columns code, severity, subject, path, message).
    4. `<h2>Verification</h2>`, then `<p>No Archetype applies to this model.</p>` or a table with one `<tr data-finding-outcome={outcome}>` per finding (columns Locus, Archetype, rule, method, outcome, message).
    5. `<h2>Model description</h2>` and `<pre data-slot="description" tabIndex={0}>{JSON.stringify(description, null, 2)}</pre>`.
- Run state lives in `PlaygroundPage` (`useState`); no separate run-state module.

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

- `apps/docs/src/lib/content-types.ts` and `apps/docs/src/lib/prerender.ts` (owned by WP19): remove `/playground/a`...`/playground/e` only.
- `apps/docs/scripts/content.ts` (WP19), `apps/docs/test/content.test.ts` (WP16), `apps/docs/e2e/machine-files.e2e.ts` (WP19): the Playground llms bullet text only.
- `apps/docs/test/site.test.ts` (WP16): replace `/playground/a` route rows only.
- `apps/docs/e2e/navigation.e2e.ts`, `apps/docs/e2e/a11y.e2e.ts`, `apps/docs/e2e/provenance.e2e.ts` (WP19): replace old scenario pages and selectors only.
- `apps/docs/src/components/verification-view.tsx` (WP19): fix links to removed playground pages only.
- `docs/guides/**` (WP20): change only link targets `/playground/a` … `/playground/e` to `/playground`.
- `apps/docs/test/fixtures/valid/docs/research/prior-art.md` and the two `/playground/a` lines of `apps/docs/test/content.test.ts` (fixture link and its expectations): `/playground/a` → `/playground` only.

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

**Sanctioned edits outside `owned_files`, exact form**:

- `apps/docs/src/lib/content-types.ts`: remove the five lines `"/playground/a",` … `"/playground/e",` from `APP_ROUTES`. `apps/docs/src/lib/prerender.ts`: remove the same five lines from `APP_PAGES`.
- `apps/docs/scripts/content.ts` line `` `## ${section.title}\n\n- [${section.title}](${section.route}): Scenarios A to E run the real @telos/locus package in your browser.` ``: replace the text after `): ` with the new bullet. Same text in `apps/docs/test/content.test.ts` (the `- [Playground](/playground): …` line of the expected llms text) and `apps/docs/e2e/machine-files.e2e.ts` (`APP_PAGE_LINES`).
- `apps/docs/test/fixtures/valid/docs/research/prior-art.md` line 13: `[scenario A](/playground/a)` → `[the playground](/playground)`. In `apps/docs/test/content.test.ts`: case 16 becomes `fixture(PRIOR).replace("](/playground)", "](/playground/z)")` (problem text unchanged), and `expect(prior).toContain('href="/playground/a"')` becomes `'href="/playground"'`.
- `apps/docs/test/site.test.ts` `SECTION_CASES`: `["/playground/a", "playground"]` → `["/playground", "playground"]`.
- `apps/docs/src/components/verification-view.tsx`: the `href="/playground/e"` link becomes `href="/playground"` with link text `The playground`; adjust the sentence around it so it reads correctly ("The playground runs the kernel in this browser.").
- `docs/guides/*.md`: every link target `/playground/a` … `/playground/e` becomes `/playground` (link text unchanged; WP20 rewrites the guides).
- `apps/docs/e2e/navigation.e2e.ts`: the test "a playground scenario shows its example input and the notice" becomes "the playground shows its example input and the notice without JavaScript": `page.goto("/playground")`, `[data-slot="no-js"]` visible, `[data-slot="example-input"]` contains `"demo:hello"`, `main` contains `The playground needs JavaScript`, `[data-slot="playground"]` count 0.
- `apps/docs/e2e/a11y.e2e.ts`: replace the "playground index" entry and the five scenario entries with two entries: `{ name: "playground after a valid run", path: "/playground", prepare: (page) => runExample(page, "composed") }` and `{ name: "playground with diagnostics", path: "/playground", prepare: (page) => runExample(page, "cycle") }`. Rename `runScenario` to `runExample(page, name)`: goto `/playground`, wait for `data-ready="true"`, `page.selectOption("#playground-example", name)`, click `[data-action="run"]`, wait for `[data-result="playground"]`. Update its GRACE contract comment and the module header text.
- `apps/docs/e2e/provenance.e2e.ts`: replace `RUN_ACTIONS` and the scenario loop with one test "the playground: the result panel after a run has an origin and a visible label" (open `/playground`, wait ready, run, `expectEveryPanelLabelled` > 0, `countResultsOutsidePanels` = 0). Add `[data-decode-issue], [data-finding-outcome]` to `RESULT_ELEMENTS`. "browser labels say where and when…": open `/playground`, run, the label `[data-result="playground"] [data-slot="provenance-label"]` contains `Run in this browser at` and `@telos/kernel`. "before any run…": only `/playground`, `[data-slot="results"]` contains `Press`, `[data-result]` count 0. "an edited result…": run, `caretToEnd(page.locator("#playground-input"))`, type a space, the label contains `Historical: run in this browser at`, and `[data-result][data-provenance="historical"]` count 1. Leave the two `/verification` tests unchanged (WP19 rewrites them). Rename `openScenario` to `openPlayground(page)`.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP18 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T102 – `registry.ts` and `examples.ts`

Rewrite `apps/docs/src/playground/registry.ts` (GRACE markup; exports `PLAYGROUND_INTRO`, `DemoLabelA`, `DemoLabelB`, `DemoFlowsTo`, `DemoFlowHasLabel`, `DemoFlow`, `PLAYGROUND_REGISTRY`):

```ts
export const DemoLabelA = Extension.make("demo.label-a", { description: "Gives a Locus a label (first definition).", properties: { label: Schema.String } });
export const DemoLabelB = Extension.make("demo.label-b", { description: "Gives a Locus a label (second definition).", properties: { label: Schema.String } });
export const DemoFlowsTo = RelationType.make("demo.flows-to", { description: "Work flows from this Locus to the target Locus.", target: "locus", acyclic: true });
export const DemoFlowHasLabel = Archetype.make({
  id: "demo.flow-has-label",
  description: "Checks that every flow Locus says what it does.",
  appliesTo: ["demo.flow"],
  rules: [Rule.make({ id: "flow.labelled", description: "A flow Locus has a description.", method: "static",
    check: (ctx) => (ctx.locus.description ? Effect.void : violation(`Locus ${ctx.locus.id} has no description.`)) })],
});
export const DemoFlow = Extension.make("demo.flow", { description: "Marks a Locus that takes part in a flow.", relationTypes: [DemoFlowsTo], archetypes: [DemoFlowHasLabel] });
export const PLAYGROUND_REGISTRY: ExtensionRegistry = { extensions: [Purpose, Source, External, DemoLabelA, DemoLabelB, DemoFlow] };
```

Write `apps/docs/src/playground/examples.ts` exporting `PlaygroundExample` (interface `{ readonly name: string; readonly title: string; readonly valid: boolean; readonly json: string }`) and `PLAYGROUND_EXAMPLES`, in this order, each `json` being `JSON.stringify(<value>, null, 2)` of:

| name | title | valid | value |
| --- | --- | --- | --- |
| `minimal` | `Minimal Locus` | true | `{ id: "demo:hello" }` |
| `composed` | `Composed Locus` | true | `{ id: "demo:shop", extensions: ["telos.purpose", "telos.source", "demo.flow"], description: "A small shop.", properties: { purpose: "Sell things.", responsibilities: ["Take orders"], sources: ["src/shop/**/*.ts"] }, contains: [{ id: "demo:checkout", extensions: ["demo.flow"], description: "Turns a basket into an order." }], relations: [{ type: "demo.flows-to", target: "demo:checkout" }] }` |
| `property-conflict` | `Property conflict` | false | `{ id: "demo:labelled", extensions: ["demo.label-a", "demo.label-b"], properties: { label: "Hello" } }` |
| `invalid-property` | `Invalid property` | false | `{ id: "demo:purpose", extensions: ["telos.purpose"], properties: { purpose: 5 } }` |
| `missing-target` | `Missing relation target` | false | `{ id: "demo:flow", extensions: ["demo.flow"], description: "Flows nowhere.", relations: [{ type: "demo.flows-to", target: "demo:nowhere" }] }` |
| `cycle` | `Relation cycle` | false | `{ id: "demo:loop", contains: [{ id: "demo:a", extensions: ["demo.flow"], description: "First step.", relations: [{ type: "demo.flows-to", target: "demo:b" }] }, { id: "demo:b", extensions: ["demo.flow"], description: "Second step.", relations: [{ type: "demo.flows-to", target: "demo:a" }] }] }` |
| `malformed-id` | `Malformed identity` | false | `{ id: "Demo Hello" }` |
| `unknown-extension` | `Unknown extension` | false | `{ id: "demo:hello", extensions: ["demo.unknown"] }` |

### T103 – `run.ts` and its unit test

Test first: rewrite `apps/docs/test/playground-run.test.ts` (GRACE test markup, `LINKS: V-M-DOCS-PLAYGROUND`). With `const run = (text: string) => Effect.runPromise(runDefinition(text))`:

- `minimal` → `kind: "built"`, `diagnostics` `[]`, `report.provenance.runner` `"browser"`, `description.root` `"demo:hello"`.
- `composed` → no diagnostics; `report.findings` has two findings of rule `flow.labelled`, both `passed`.
- Expected codes: `property-conflict` → a diagnostic `composition.property-conflict`; `invalid-property` → `property.invalid`; `missing-target` → `relation.target-missing`; `cycle` → `relation.cycle`; `malformed-id` → `identity.malformed`.
- `unknown-extension` → `kind: "decode-error"`, an issue with message `Unknown extension demo.unknown.`
- `'{"id":'` → `decode-error` with one issue at path `""`.
- A text longer than 1 000 000 characters → `decode-error` with the single issue `{ path: "", message: "The input is larger than 1 MB." }`, and the decoder is not called.
- Every example's `valid` flag equals "decoded and no error diagnostic" of its run.

Delete `apps/docs/test/playground-render.test.tsx`, `playground-render-de.test.tsx`, `playground-revisions.test.ts`, `playground-specs.test.ts`, `run-state.test.ts` (keep `playground-safety.test.ts` and `safety-scan.ts`).

Then write `apps/docs/src/playground/run.ts`:

```ts
export type PlaygroundResult =
  | { readonly kind: "decode-error"; readonly decodeIssues: ReadonlyArray<DecodeIssue> }
  | { readonly kind: "built"; readonly diagnostics: ReadonlyArray<Diagnostic>; readonly report: VerificationReport; readonly description: ModelDescription };
export const MAX_INPUT_LENGTH = 1_000_000;
export const runDefinition = (text: string): Effect.Effect<PlaygroundResult> => ...
```

Steps: size check; `decodeLocusText(text, PLAYGROUND_REGISTRY)`; on failure return the issues; else `buildModel(root)`, `verify(model, { runner: "browser", methods: ["static"] })`, `describeModel(model)`. (The `kind` field is an addition to the contract's union so the UI can switch on it.)

### T104 – UI and the `/playground` route

Write `apps/docs/src/playground/components/playground-page.tsx` (`PlaygroundPage`) and `apps/docs/src/playground/components/playground-results.tsx` (`PlaygroundResults`, the panel of the page contract), and rewrite `apps/docs/src/routes/playground/index.tsx`. Use the existing UI components (`@/components/ui/button`, `alert`, `table`). The Run handler runs `Effect.runPromise(runDefinition(text))` and stores `{ text, result, ranAt }`; a rejected promise shows the crash Alert. No `innerHTML`, no `eval`, no dynamic `import()` anywhere in `src/playground` (the safety test scans it).

### T105 – Deletions and route lists

`git rm` the old files: `src/playground/run-fabric.ts`, `run-revisions.ts`, `run-specs.ts`, `locus-text.ts`, `run-state.ts`, `use-run.ts`, `src/playground/components/fabric-results.tsx`, `fabric-scenario.tsx`, `playground-index.tsx`, `revision-results.tsx`, `revisions-scenario.tsx`, `scenario-shell.tsx`, `specs-results.tsx`, `specs-scenario.tsx`, and `src/routes/playground/$scenario.tsx`. Apply the sanctioned edits to `content-types.ts`, `prerender.ts`, `site.test.ts`, the fixture and `content.test.ts`, `verification-view.tsx` and `docs/guides/*.md`. Run `bun run docs:build`; the router plugin regenerates `src/routeTree.gen.ts` (commit the regenerated file; never edit it by hand). Then `git grep -n "/playground/[a-e]\b\|@/playground/run-\|scenario-shell" -- apps/docs docs` must find nothing.

### T106 – e2e

- Rewrite `apps/docs/e2e/playground.e2e.ts` (GRACE test markup): for each `PLAYGROUND_EXAMPLES` entry (import it from `../src/playground/examples`), open `/playground`, wait for `data-ready="true"`, `selectOption("#playground-example", name)`, click Run, then: `minimal` and `composed` → `[data-slot="no-diagnostics"]` has text `No diagnostics` and `[data-result="playground"]` has `data-valid="true"`; the five diagnostic examples → `[data-diagnostic-code="<code>"]` visible (codes from T103); `unknown-extension` → `[data-decode-issue]` contains `Unknown extension demo.unknown.`. A second test fills `#playground-input` with `{"id":`, runs, and expects a `[data-decode-issue]`. Every test uses `trackPageErrors(page)` from `./helpers` and calls `check()` at the end.
- Rewrite `apps/docs/e2e/keyboard.e2e.ts` around `/playground` (keep `tabTo`, `focusRingShown`, `PLAYGROUND_CONTROLS`): "Tab to the input, type a change, Tab to Run, press Enter" (expects `[data-result="playground"][data-provenance="browser"]` and `data-valid="true"`), "every control in the playground has a non-empty accessible name" (after a run), and "the focused control shows a visible focus indicator" (`#playground-input`, then `[data-action="run"]`).
- `apps/docs/e2e/search.e2e.ts` test "a slash typed inside a playground field…": `page.goto("/playground")` and `page.getByLabel("Locus JSON")`.
- Delete `apps/docs/e2e/equality.e2e.ts`.
- Apply the sanctioned edits to `navigation.e2e.ts`, `a11y.e2e.ts` and `provenance.e2e.ts`.

### T107 – llms bullet

Apply the three sanctioned text edits (content.ts, content.test.ts, machine-files.e2e.ts). `PLAYGROUND_INTRO` holds the same text.

### T108 – GRACE

In `.grace/graph/docs.xml` rewrite `M-DOCS-PLAYGROUND`: Summary "One page that decodes, builds, verifies and describes a JSON Locus definition with the real kernel in the browser.", `<Path>apps/docs/src/playground/</Path>`, children `<M-KERNEL-API />` and `<M-DOCS-SITE />` (remove the `M-LOCUS-*` children). In `.grace/verification/docs.xml` rewrite `V-M-DOCS-PLAYGROUND`: TestFiles `apps/docs/test/playground-run.test.ts`, `apps/docs/test/playground-safety.test.ts`, `apps/docs/test/guide-examples.test.ts`, `apps/docs/e2e/playground.e2e.ts`, `apps/docs/e2e/keyboard.e2e.ts`, `apps/docs/e2e/provenance.e2e.ts`; Commands `bun test apps/docs/test/playground-run.test.ts apps/docs/test/playground-safety.test.ts` and `bun run test:e2e apps/docs/e2e/playground.e2e.ts`; Scenarios: every example gives its expected diagnostic or "No diagnostics" in Chromium; a syntax error shows a decode issue; input over 1 MB is refused; an edit marks the result historical; every playground source passes the safety scan. Remove `equality.e2e.ts` from any verification entry and the deleted unit tests from `V-M-DOCS-SITE` if listed there. Run `bun run grace:lint`.

### T109 – Verify

`bun run format`, then `bun run verify`. Report each step.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP18 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- `routeTree.gen.ts` is generated; a hand edit is overwritten and fails review.
- The playground safety scan forbids `innerHTML`, `eval`, `new Function` and any `import()` in `src/playground`.
- `verify` on a model with error diagnostics still runs; do not skip it.

## Reviewer guidance

- One `/playground` page; no `/playground/a`…`/e` anywhere (`git grep`).
- `playground.e2e.ts` covers every example and the syntax error in Chromium.
- No import of `@telos/locus`, `@/lib/build`, `@/lib/build-data` or `@/lib/provenance` under `src/playground`.

---
work_package_id: WP10
title: CLI Pack @telos/cli
dependencies:
- WP09
requirement_refs:
- FR-017
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: 69bf613c3866ef6a152810ffb72c742cda13b9f7
created_at: '2026-10-24T13:44:38.327447+00:00'
subtasks:
- T054
- T055
- T056
- T057
- T058
- T059
phase: Phase 3 – Packs
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/cli/
create_intent:
- packages/cli/src/semantics.ts
- packages/cli/src/derive.ts
- packages/cli/src/environment.ts
- packages/cli/src/run.ts
- packages/cli/src/bun.ts
- packages/cli/src/archetype.ts
- packages/cli/src/index.ts
- packages/cli/test/fixture.ts
- packages/cli/test/derive.test.ts
- packages/cli/test/run.test.ts
- packages/cli/test/archetype.test.ts
- packages/cli/test/bun.test.ts
- .grace/graph/pack-cli.xml
- .grace/verification/pack-cli.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/cli/src/semantics.ts
- packages/cli/src/derive.ts
- packages/cli/src/environment.ts
- packages/cli/src/run.ts
- packages/cli/src/bun.ts
- packages/cli/src/archetype.ts
- packages/cli/src/index.ts
- packages/cli/test/fixture.ts
- packages/cli/test/derive.test.ts
- packages/cli/test/run.test.ts
- packages/cli/test/archetype.test.ts
- packages/cli/test/bun.test.ts
- .grace/graph/pack-cli.xml
- .grace/verification/pack-cli.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP10 – CLI Pack @telos/cli

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

Implement the CLI Pack `packages/cli` (`@telos/cli`): a CLI interface Locus exposes capabilities through `cli.command` relations, and the Pack derives one `effect/cli` subcommand per exposed capability. Every command runs through kernel `invoke` with `via` = the CLI Locus. Text flags become values with kernel `inputFields` + `coerceInput`.

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

## `@telos/cli` (WP10)

Export map: `{ ".": "./src/index.ts", "./bun": "./src/bun.ts", "./package.json": "./package.json" }`.

### semantics.ts

```ts
export const CliCommand: RelationType<"cli.command">
// description "Exposes the target capability as a command-line subcommand named after the capability."; target "capability"; grantsInvocation true
export const CliSemantics: Extension<"telos.cli", { program: typeof Schema.String }>
// description "Marks a Locus as a command-line interface. Its `program` is the executable name."; relationTypes [CliCommand]; archetypes [CliInterface]
```

### derive.ts

```ts
export const CLI_COMMAND_TYPE = "cli.command"
export interface DerivedCommand {
  readonly name: string                     // the capability name
  readonly ref: CapabilityRef
  readonly description: string
  readonly fields: ReadonlyArray<InputField>
}
export const deriveCommands: (model: SemanticModel, cliLocusId: string) => Effect.Effect<ReadonlyArray<DerivedCommand>>
// uses describeCapability for each exposed capability; [] for an unknown id or a Locus without CliSemantics
```

### environment.ts

The in-memory Effect environment for `effect/cli`. Quote this code from research R7:

```ts
import { Effect, FileSystem, Layer, Path, Sink, Stdio, Stream, Terminal } from "effect"
import { ChildProcessSpawner } from "effect/process"
export interface Captured { readonly stdout: Array<string>; readonly stderr: Array<string> }
export function memoryEnvironment(argv: ReadonlyArray<string>, captured: Captured): Layer.Layer<FileSystem.FileSystem | Path.Path | Stdio.Stdio | Terminal.Terminal | ChildProcessSpawner.ChildProcessSpawner>
// const dec = new TextDecoder()
// const w = (buf: string[]) => (c: string | Uint8Array) => Effect.sync(() => { buf.push(typeof c === "string" ? c : dec.decode(c)) })
// Layer.mergeAll(FileSystem.layerNoop({}), Path.layer,
//   Layer.succeed(Stdio.Stdio, Stdio.make({ args: Effect.succeed([...argv]), stdout: () => Sink.forEach(w(captured.stdout)), stderr: () => Sink.forEach(w(captured.stderr)), stdin: Stream.empty })),
//   Layer.succeed(Terminal.Terminal, Terminal.make({ columns: Effect.succeed(80), rows: Effect.succeed(24), readInput: Effect.die("unused"), readLine: Effect.die("unused"), display: (s) => w(captured.stdout)(s) })),
//   Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, ChildProcessSpawner.make(() => Effect.die("unused"))))
```

### run.ts

```ts
export interface CliResult { readonly exitCode: 0 | 1 | 2; readonly stdout: string; readonly stderr: string }
export const EXIT_CODE: (error: InvocationError) => 1 | 2
// 2 for InvalidInput, NotGranted, NotImplemented, LocusNotFound, CapabilityNotFound, UsageError; 1 for everything else (declared errors, Defect, InvalidOutput)
export const runCli: (model: SemanticModel, cliLocusId: string, argv: ReadonlyArray<string>, options?: { readonly version?: string }) => Effect.Effect<CliResult>
```

Behaviour of `runCli`:

1. Build `Command.make(program)` with `Command.withSubcommands`. `program` comes from the CLI Locus `properties.program`, and the version defaults to `"0.0.0"`. There is one `Command.make(name, flags, handler)` per derived command, where `flags = { [field.name]: Flag.String(field.name).pipe(Flag.optional) }` for every field.
2. The handler converts `Option` values to `Record<string, string | undefined>`, applies `coerceInput`, calls `invoke`, and writes one line:
   - success → `JSON.stringify(output) + "\n"` to stdout, exit 0
   - failure → `JSON.stringify(error) + "\n"` to stderr, exit `EXIT_CODE(error)`
3. It runs `Command.runWith(root, { version })(argv)` provided with `memoryEnvironment`, under `Effect.exit`. If the run fails before a handler wrote anything, it writes `{"tag":"UsageError","message":"Invalid command line: <argv joined with one space>.","issues":[]}` to stderr with exit 2.
4. Help (`--help`) is printed by `effect/cli` through the Effect `Console` and not through `Stdio`. Tests assert only `exitCode === 0` for help.
5. An unknown `cliLocusId`, or one without `CliSemantics`, gives exit 2 with `{"tag":"LocusNotFound","message":"No CLI Locus <id> in the model.","issues":[]}`.

### bun.ts (`@telos/cli/bun`)

```ts
export const runMain: (model: SemanticModel, cliLocusId: string, options?: { readonly version?: string; readonly argv?: ReadonlyArray<string> }) => Promise<void>
// argv defaults to process.argv.slice(2); writes result.stdout to process.stdout and result.stderr to process.stderr; sets process.exitCode = result.exitCode
```

### archetype.ts

```ts
export const CliInterface: Archetype   // id "telos.cli.interface", appliesTo ["telos.cli"]
```

| Rule id | Method | Passes when |
| --- | --- | --- |
| `cli.commands-exist` | static | the Locus has at least one valid `cli.command` relation |
| `cli.unique-commands` | static | no two exposed capabilities share a name |
| `cli.flags-derivable` | static | every exposed capability has `inputFields(...)` non-empty or an input schema of an empty object, and no field of type `unsupported` |
| `cli.invalid-input-exit` | execution | for every command with at least one required field, `runCli(model, id, [name])` gives exit 2 and a stderr line whose JSON `tag` is `InvalidInput` |

The violation messages name the offending capability, e.g. `"Capability calculator:arithmetic#add has an unsupported field x."`.

### index.ts

Exports `CLI_COMMAND_TYPE, CliCommand, CliSemantics, CliInterface, deriveCommands, DerivedCommand, runCli, CliResult, EXIT_CODE, memoryEnvironment, Captured`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/packs.md` (authoritative).

## Tests (each Pack's `test/` directory)

Each Pack builds a tiny fixture model in `test/fixture.ts`: an `example:math` Locus with a `double` capability (input `{ n: Schema.Finite }`, output `{ value: Schema.Finite }`, error `Negative` when `n < 0`) and one interface Locus exposing it. Every Archetype rule has one passing and one failing test (NFR-005). The CLI tests use `runCli` in memory. The agent tests use `callTool`, `introspectionTools`, and one subprocess test that spawns `bun test/fixture-server.ts` (calls `serveMcp`) through `McpStdioClient`, then asserts `tools/list` names, annotations and a `tools/call` round trip. The web tests use `formModel`.

**Discovery never grants invocation (US4.4, spec D6).** The agent fixture's `example:math` Locus also declares a capability `secret` (input `{}`, output `{ ok: Schema.Boolean }`, effect `read`) that no `agent.tool` relation exposes. `test/grant.test.ts` asserts three things:

- `telos_capabilities {"id":"example:math"}` lists `secret` (it is discoverable);
- `invoke(model, "example:math#secret", {}, { via: "example:agent" })` returns `{ ok: false, error: { tag: "NotGranted", message: "example:agent is not granted to invoke example:math#secret.", issues: [] } }`;
- `deriveTools` has no tool named `secret`, and over MCP `tools/call` for `secret` is rejected by the server with `MCP error -32602: Tool 'secret' not found` (the client sees no tool to call).

Kernel APIs you use (all from `@telos/kernel`, never from `@telos/kernel/src/...`):

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

### Prototype (run while planning, effect 4.0.4)

This prototype ran under Bun. It shows the exact `effect/cli` calls: `Flag.String(name).pipe(Flag.optional)`, `Command.make(name, flags, handler)`, `Command.make(program).pipe(Command.withSubcommands([...]))`, `Command.runWith(root, { version })(argv)` provided with the in-memory environment, and `Option.getOrUndefined` for flag values.

```ts
import { Effect, Exit, FileSystem, Layer, Option, Path, Sink, Stdio, Stream, Terminal } from "effect";
import { Command, Flag } from "effect/cli";
import { ChildProcessSpawner } from "effect/process";
interface Captured { readonly stdout: Array<string>; readonly stderr: Array<string> }
function memoryEnvironment(argv: ReadonlyArray<string>, captured: Captured) {
  const dec = new TextDecoder();
  const w = (buf: Array<string>) => (c: string | Uint8Array) => Effect.sync(() => { buf.push(typeof c === "string" ? c : dec.decode(c)); });
  return Layer.mergeAll(
    FileSystem.layerNoop({}),
    Path.layer,
    Layer.succeed(Stdio.Stdio, Stdio.make({ args: Effect.succeed([...argv]), stdout: () => Sink.forEach(w(captured.stdout)), stderr: () => Sink.forEach(w(captured.stderr)), stdin: Stream.empty })),
    Layer.succeed(Terminal.Terminal, Terminal.make({ columns: Effect.succeed(80), rows: Effect.succeed(24), readInput: Effect.die("unused"), readLine: Effect.die("unused"), display: (s) => w(captured.stdout)(s) })),
    Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, ChildProcessSpawner.make(() => Effect.die("unused"))),
  );
}
const fields = ["a", "b"];
const run = (argv: ReadonlyArray<string>) => Effect.gen(function* () {
  const captured: Captured = { stdout: [], stderr: [] };
  let exitCode = 0; let wrote = false;
  const flags: Record<string, Flag.Flag<Option.Option<string>>> = {};
  for (const f of fields) flags[f] = Flag.String(f).pipe(Flag.optional);
  const sub = Command.make("add", flags, (values) => Effect.sync(() => {
    const raw: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(values as Record<string, Option.Option<string>>)) raw[k] = Option.getOrUndefined(v);
    captured.stdout.push(JSON.stringify(raw) + "\n"); wrote = true; exitCode = 0;
  }));
  const root = Command.make("calculator").pipe(Command.withSubcommands([sub]));
  const exit = yield* Effect.exit(Command.runWith(root, { version: "0.0.0" })(argv).pipe(Effect.provide(memoryEnvironment(argv, captured))));
  if (Exit.isFailure(exit) && !wrote) { exitCode = 2; captured.stderr.push("usage\n"); }
  return { exitCode, stdout: captured.stdout.join(""), stderr: captured.stderr.join("") };
});
for (const argv of [["add", "--a", "2", "--b", "3"], ["add", "--a", "2"], ["nope"], ["--help"], ["add"]]) console.log(JSON.stringify(argv), JSON.stringify(Effect.runSync(run(argv) as any)));
```

Planning results of `effect/cli` behaviour:

- `["add", "--a", "2", "--b", "3"]` runs the handler; a missing optional flag gives `Option.none()`; the handler still runs.
- An unknown subcommand, an unknown flag (`--zzz`) or an extra positional argument makes `runWith` fail before the handler runs. `effect/cli` prints its usage text and the error through the Effect `Console` (real stdout), not through `Stdio`. That text is expected noise in test output; never assert it.
- `--help` and `--version` print through `Console` too. Assert only `exitCode === 0` for them.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP10 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T054 – Fixture and failing tests

Create `packages/cli/test/fixture.ts` (GRACE test markup, `ROLE: TEST`). It imports only `@telos/kernel`, `effect` and `../src/...`:

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
export const cli = Locus.extend(CliSemantics).make({ id: "example:cli", properties: { program: "math" }, relations: [CliCommand.to(math.capability("double"))] });
export const root = Locus.make({ id: "example:root", contains: [math, cli] });
export const model = buildModel(root);
```

Also export `withCli(cliLocus: LocusDefinition, extra: ReadonlyArray<LocusDefinition> = [])` returning `buildModel(Locus.make({ id: "example:root", contains: [math, cliLocus, ...extra] }))`, used to build broken variants.

`buildModel(root).diagnostics` must be `[]` (assert it in `derive.test.ts`).

`packages/cli/test/derive.test.ts`:

- `deriveCommands(model, "example:cli")` → exactly `[{ name: "double", ref: CapabilityRef.make("example:math", "double"), description: "Doubles n.", fields: [{ name: "n", type: "number", required: true, description: null }] }]`.
- `[]` for `"example:none"` and for `"example:math"` (no `CliSemantics`).
- Sorting and duplicates: a second Locus `example:other` with its own `double` and a `triple`; a CLI Locus with relations to `example:other#triple`, `example:other#double`, `example:math#double` → names `["double", "triple"]`, and `double` comes from `example:math` (sorted by name, then Locus id; first wins).

`packages/cli/test/run.test.ts` (each test calls `Effect.runPromise(runCli(model, "example:cli", argv))`):

| argv | exitCode | stdout | stderr |
| --- | --- | --- | --- |
| `["double", "--n", "2"]` | 0 | `{"value":4}\n` | `""` |
| `["double", "--n", " 2.5 "]` | 0 | `{"value":5}\n` | `""` |
| `["double", "--n", "-1"]` | 1 | `""` | `{"tag":"Negative","message":"n must not be negative.","issues":[]}\n` |
| `["double", "--n", "x"]` | 2 | `""` | one line; `JSON.parse` gives `tag: "InvalidInput"`, `message: "Invalid input for example:math#double."`, issue paths `[["n"]]` |
| `["double"]` | 2 | `""` | one line with `tag: "InvalidInput"` and issue path `["n"]` |
| `["nope"]` | 2 | `""` | `{"tag":"UsageError","message":"Invalid command line: nope.","issues":[]}\n` |
| `["double", "--zzz", "1"]` | 2 | `""` | `{"tag":"UsageError","message":"Invalid command line: double --zzz 1.","issues":[]}\n` |
| `["--help"]` | 0 | (not asserted) | (not asserted) |
| `["--version"]` | 0 | (not asserted) | (not asserted) |

Also:

- `runCli(model, "example:none", ["double"])` → exit 2, stderr `{"tag":"LocusNotFound","message":"No CLI Locus example:none in the model.","issues":[]}\n`; the same for `"example:math"` with its id in the message.
- `EXIT_CODE`: `2` for each of `InvalidInput, NotGranted, NotImplemented, LocusNotFound, CapabilityNotFound, UsageError`; `1` for `Negative`, `Defect`, `InvalidOutput` (build `{ tag, message: "m", issues: [] }`).

`packages/cli/test/archetype.test.ts`: each rule of `CliInterface` has one passing and one failing test. Run `Effect.runPromise(verify(m, { runner: "test", loci: [<cli id>] }))` and find the finding by `rule`.

| Rule | Passing model | Failing model (assert `outcome: "failed"` and the message) |
| --- | --- | --- |
| `cli.commands-exist` | `model` | a CLI Locus `example:cli` with no relations; message `CLI Locus example:cli exposes no command.` |
| `cli.unique-commands` | `model` | relations to `example:math#double` and `example:other#double`; message `Command double is exposed more than once.` |
| `cli.flags-derivable` | `model` | relation to `example:math#tags` where `tags` has input `Schema.Struct({ tags: Schema.Array(Schema.String) })`; message `Capability example:math#tags has an unsupported field tags.` |
| `cli.invalid-input-exit` | `model` | the not-granted fake below; message `Command double does not exit with code 2 and InvalidInput for missing input.` |

The failing model for `cli.invalid-input-exit` uses a fake extension with the same id `telos.cli` and a relation type with the id `cli.command` that does **not** grant invocation. The command is derived (the type id matches), but the kernel answers `NotGranted`, so the rule must fail:

```ts
const FakeCommand = RelationType.make("cli.command", { description: "Fake command.", target: "capability" });
const FakeCli = Extension.make("telos.cli", { description: "Fake CLI.", properties: { program: Schema.String }, relationTypes: [FakeCommand], archetypes: [CliInterface] });
const fake = Locus.extend(FakeCli).make({ id: "example:cli", properties: { program: "math" }, relations: [FakeCommand.to(math.capability("double"))] });
```

Add `math` variants that declare `tags` (and `example:other`) inside the test file; never change the shared fixture for one test.

`packages/cli/test/bun.test.ts`: call `await runMain(model, "example:cli", { argv: ["double", "--n", "2"] })` while `process.stdout.write` and `process.stderr.write` are replaced by recorders (restore them and `process.exitCode = 0` in `finally`). Assert the recorded stdout `{"value":4}\n` and `process.exitCode === 0`; then `argv: ["double", "--n", "x"]` → recorded stderr contains `"InvalidInput"` and `process.exitCode === 2`.

Run the tests and see them fail.

### T055 – `semantics.ts`, `derive.ts`, `environment.ts`

- `derive.ts`: `CLI_COMMAND_TYPE`, `DerivedCommand`, `deriveCommands`. The exposed capabilities follow the shared rules (valid outgoing relations with `type.id === CLI_COMMAND_TYPE`, sorted by capability name then Locus id, first per name). For each, `describeCapability(model, target.locus, target.capability)` and `inputFields(description)`.
- `environment.ts`: `Captured` and `memoryEnvironment` exactly as quoted.
- `semantics.ts`: `CliCommand` and `CliSemantics` with the exact descriptions. It imports `CLI_COMMAND_TYPE` from `./derive` and `CliInterface` from `./archetype`.

### T056 – `run.ts`

`CliResult`, `EXIT_CODE` and `runCli`, following the five behaviour points. Notes:

- One `Captured` per call; `stdout` and `stderr` of the result are the joined captured chunks.
- The handler writes exactly one line and sets the exit code; keep a local `wrote` flag. If `runWith` fails and `wrote` is false, write the `UsageError` line (argv joined with one space) and use exit 2.
- The flags record is typed `Record<string, Flag.Flag<Option.Option<string>>>`, as in the prototype.
- Errors written to stderr are the kernel `InvocationError` objects unchanged (`JSON.stringify(error)` gives the key order `tag, message, issues`).

### T057 – `bun.ts`

`runMain` as quoted. It is the only module of this Pack that touches `process`. It is not exported from `src/index.ts`.

### T058 – `archetype.ts`

`CliInterface` (`id "telos.cli.interface"`, description `"Checks that a command-line interface Locus exposes derivable, unique commands that reject invalid input."`, `appliesTo: ["telos.cli"]`) with the four rules of the table, in table order, using the exact violation messages above. Rule descriptions:

| Rule | Description |
| --- | --- |
| `cli.commands-exist` | `The interface exposes at least one command.` |
| `cli.unique-commands` | `No two exposed capabilities share a command name.` |
| `cli.flags-derivable` | `Every exposed capability has input flags that can be derived.` |
| `cli.invalid-input-exit` | `Every command with a required field exits with code 2 and InvalidInput when the input is missing.` |

`cli.unique-commands` looks at all valid `cli.command` relations before the first-per-name reduction. `cli.flags-derivable` fails for a capability with any `unsupported` field, or with no fields while its input schema is not an object schema; the message for the second case is `Capability <ref> has no derivable flags.`. Execution rule: for each derived command with at least one required field, run `runCli(ctx.model, ctx.locus.id, [name])`; it passes when `exitCode === 2` and `JSON.parse(stderr).tag === "InvalidInput"`.

`archetype.ts` imports `./derive` and `./run`, never `./semantics`.

### T059 – `index.ts` and GRACE

`src/index.ts` exports exactly the names of the contract (values with `export { ... }`, types with `export type { ... }`); it never exports `./bun`. Area `pack-cli`: register `M-PACK-CLI` with one `<Path>` per `packages/cli/src/*.ts` file and child `<M-KERNEL-API />`, and `V-M-PACK-CLI` with the four test files and the command `bun test packages/cli/test`. Add the ids to your `GD-PACK-CLI` / `VD-PACK-CLI` `<Owns>` blocks. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP10 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- `effect/cli` prints help and parse errors through `Console`; never assert that text.
- Use `Option.getOrUndefined` for flag values; an absent flag must be omitted by `coerceInput`, not passed as `""`.

## Reviewer guidance

- Every `CliInterface` rule has a passing and a failing test, including the not-granted fake.
- `src/index.ts` and everything it imports are browser-safe: no `process`, `Bun` or `node:` outside `bun.ts`.
- All invocations go through kernel `invoke` with `via` = the CLI Locus.

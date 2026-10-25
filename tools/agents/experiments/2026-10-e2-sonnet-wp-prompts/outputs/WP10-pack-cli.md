---
work_package_id: "WP10"
title: "CLI Pack @telos/cli"
dependencies: ["WP09"]
requirement_refs: ["FR-017"]
subtasks: ["T054", "T055", "T056", "T057", "T058", "T059"]
owned_files:
  - "packages/cli/src/semantics.ts"
  - "packages/cli/src/archetype.ts"
  - "packages/cli/src/derive.ts"
  - "packages/cli/src/run.ts"
  - "packages/cli/src/environment.ts"
  - "packages/cli/src/bun.ts"
  - "packages/cli/src/index.ts"
  - "packages/cli/test/fixture.ts"
  - "packages/cli/test/fixture-main.ts"
  - "packages/cli/test/semantics.test.ts"
  - "packages/cli/test/derive.test.ts"
  - "packages/cli/test/run.test.ts"
  - "packages/cli/test/archetype.test.ts"
  - "packages/cli/test/bun.test.ts"
  - "packages/cli/test/exports.test.ts"
  - ".grace/graph/pack-cli.xml"
  - ".grace/verification/pack-cli.xml"
authoritative_surface: "packages/cli/"
execution_mode: "code_change"
create_intent:
  - "packages/cli/src/semantics.ts"
  - "packages/cli/src/archetype.ts"
  - "packages/cli/src/derive.ts"
  - "packages/cli/src/run.ts"
  - "packages/cli/src/environment.ts"
  - "packages/cli/src/bun.ts"
  - "packages/cli/test/fixture.ts"
  - "packages/cli/test/fixture-main.ts"
  - "packages/cli/test/semantics.test.ts"
  - "packages/cli/test/derive.test.ts"
  - "packages/cli/test/run.test.ts"
  - "packages/cli/test/archetype.test.ts"
  - "packages/cli/test/bun.test.ts"
  - "packages/cli/test/exports.test.ts"
agent_profile: "implementer-ivan"
role: "implementer"
agent: "claude"
model: ""
---

# Work Package Prompt: WP10 – CLI Pack @telos/cli

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Build the `@telos/cli` Pack in `packages/cli`: a relation type (`cli.command`), an extension (`telos.cli`), an Archetype (`telos.cli.interface`) with four rules, a derivation of command-line subcommands from the capabilities a CLI Locus exposes, and an in-memory runner `runCli` that turns `argv` into `{ exitCode, stdout, stderr }` through kernel `invoke`. A Bun entry `@telos/cli/bun` wires the runner to the real process.

## Context

- Mission: `semantic-foundation-rebuild-01M5JFR0`. Requirement: FR-017 (CLI pack). The tests also serve NFR-005 (each Archetype rule has a passing and a failing test) and NFR-004 (the same error tag and message as the other interfaces: errors are the kernel's `InvocationError`, unchanged).
- Depends on WP09: `@telos/kernel` already exports its full public API. You consume only that entry. The names you use are `Archetype, Rule, violation, RuleViolation, RuleContext, Extension, RelationType, CapabilityRef, capabilityKey, SemanticModel, LocusDefinition, buildModel, outgoing, hasErrors, verify, describeCapability, CapabilityDescription, inputFields, coerceInput, InputField, invoke, InvocationError, InvocationOutcome, jsonEqual, Locus, Capability, Purpose`.
- Depended on by WP14 (the calculator `interfaces.ts` uses `CliSemantics`, `CliCommand`, `runCli`, `runMain`; its 14-case table passes argv as `[capability, "--a", "2", "--b", "3"]`). Do not change names, signatures or the argv convention.
- WP01 already created `packages/cli/package.json` (export map `".": "./src/index.ts"`, `"./bun": "./src/bun.ts"`, `"./package.json"`; dependencies `@telos/kernel` and `effect` 4.0.4), `packages/cli/tsconfig.json`, `packages/cli/test/tsconfig.json` and `packages/cli/src/index.ts` containing only `export {};`. You overwrite `src/index.ts`. You do not touch the manifests or tsconfig files.
- Parallel WPs WP11, WP12, WP13 run at the same time. Never edit their files. A Pack imports only `@telos/kernel` and `effect` (including `effect/cli` and `effect/process`), never another Pack, and never a kernel path such as `@telos/kernel/src/...`.

### Read first (all read-only; the contracts are authoritative, and if this prompt and a contract disagree, the contract wins and you report the conflict)

All paths are under `kitty-specs/semantic-foundation-rebuild-01M5JFR0/`:

1. `contracts/packs.md`: sections "Shared rules", "`@telos/cli` (WP10)" and "Tests (each Pack's `test/` directory)".
2. `contracts/conventions.md`: whole file (commands, code rules, GRACE markup, graph/verification layout, git rules).
3. `contracts/kernel.md`: the sections `model.ts`, `verify.ts`, `describe.ts`, `invoke.ts`, `fields.ts`, `relation.ts`, `capability.ts`, `archetype.ts`, `extension.ts`, `locus.ts` (only the signatures you call).
4. `data-model.md`: "Invocation error tags".
5. `research.md`: R7 (command line).

### Owned files and sanctioned edits

You own exactly the files in `owned_files`. You additionally make one sanctioned edit each in `.grace/graph/index.xml` and `.grace/verification/index.xml`: change only the `GD-PACK-CLI` / `VD-PACK-CLI` `<Owns>` block. Those two index files are not in `owned_files`, so Spec Kitty's automatic commit refuses them. Commit them yourself with `git add` and `git commit` before you move the WP (see the final subtask), and name them in the commit body. Never edit any other WP's file.

### Open questions (the planner answers them; apply the default until then)

- **Q1. Failing test for the execution rule `cli.invalid-input-exit`.** With the shared kernel, `runCli(model, id, [name])` on a command with a required field always exits 2 with `InvalidInput` (the kernel decodes before it calls the handler), so no real model makes the rule fail. *Recommended default (apply it):* in `archetype.ts` write the rule body as an internal function `invalidInputExitViolation(model, cliLocusId, run)` that takes the runner as a parameter (default `runCli`), and export it from `archetype.ts` only (not from `index.ts`). The rule's `check` calls it with `runCli`. The passing test goes through `CliInterface` with the real runner (via `verify`). The failing test calls `invalidInputExitViolation` with a stub runner that returns `exitCode: 0`, and a second one that returns exit 2 with tag `Negative`. Name those tests "(stub runner)" so a reviewer sees what they do. If the planner supplies a real failing model, replace the stub tests.
- **Q2. What "an input schema of an empty object" means in `cli.flags-derivable`.** The contract says a capability passes when `inputFields(...)` is non-empty, or its input schema is an empty object. *Recommended default (apply it):* after resolving a top-level `$ref` of the form `"#/$defs/<Name>"` through `input.definitions`, the schema is an empty object when `jsonEqual(schema, { not: { type: "null" } })` (what `Schema.toJsonSchemaDocument(Schema.Struct({}))` returns, see `contracts/packs.md` `toolInputSchema` rule 2), or when `schema.type === "object"` and it has no `properties` or an empty `properties`. Any other schema with zero derived fields (for example `Schema.String`) fails the rule.
- **Q3. `program` property that is not a string** (the Locus has a `property.invalid` diagnostic). *Default:* use `String(program)` when it is a non-empty string, else the Locus id as the program name. Do not invent other behaviour.

## Subtasks and detailed guidance

### Subtask T054 – Write the fixture model and failing tests

- **Purpose**: tests first. Every behaviour below gets a test before its implementation exists. Tests fail on import until T055–T059 land, which is expected.
- **Steps**:
  1. Create `packages/cli/test/fixture.ts` (header `ROLE: TEST`, `MAP_MODE: LOCALS`). It builds, with `@telos/kernel` and `effect` only:
     - `export class Negative extends Schema.TaggedError<Negative>()("Negative", { message: Schema.String }) {}`
     - `export const NEGATIVE_MESSAGE = "n must not be negative."`
     - `math`: `Locus.extend(Purpose).make({ id: "example:math", properties: { purpose: "Doubles numbers." }, capabilities: { double, ping, list, echo, boom, pending } })` where
       - `double`: `Capability.make({ description: "Doubles n.", input: Schema.Struct({ n: Schema.Finite }), output: Schema.Struct({ value: Schema.Finite }), errors: [Negative], effect: "pure", handler: ({ n }) => n < 0 ? Effect.fail(new Negative({ message: NEGATIVE_MESSAGE })) : Effect.succeed({ value: n * 2 }) })`
       - `ping`: input `Schema.Struct({})`, output `Schema.Struct({ ok: Schema.Boolean })`, effect `"read"`, handler returns `{ ok: true }`
       - `list`: input `Schema.Struct({ items: Schema.Array(Schema.String) })` (a field the CLI cannot turn into a flag), output `Schema.Struct({ count: Schema.Finite })`, effect `"pure"`, handler returns `{ count: items.length }`
       - `echo`: input `Schema.String` (not an object), output `Schema.Struct({ text: Schema.String })`, effect `"pure"`, handler `(text) => Effect.succeed({ text })`
       - `boom`: input `Schema.Struct({ n: Schema.Finite })`, output `Schema.Struct({ value: Schema.Finite })`, effect `"pure"`, handler `() => Effect.die("boom")`
       - `pending`: `Capability.declare({ description: "Declared only.", input: Schema.Struct({ n: Schema.Finite }), output: Schema.Struct({ value: Schema.Finite }), effect: "pure" })` (no handler, so `NotImplemented`)
     - `other`: a second Locus `example:other` (plain `Locus.make`) with a capability `double` (same contract as above), used for the duplicate-name test.
     - `cliLocus(exposes: ReadonlyArray<CapabilityRef>, id = "example:cli")`: `Locus.extend(CliSemantics).make({ id, properties: { program: "example" }, relations: exposes.map((ref) => CliCommand.to(ref)) })`. Import `CliSemantics`, `CliCommand` from `../src/semantics`.
     - `makeRoot(...children)`: `Locus.make({ id: "example:root", contains: children })`.
     - `export const cli = cliLocus([math.capability("double"), math.capability("ping")])`, `export const root = makeRoot(math, cli)`, `export const model = buildModel(root)`.
  2. Create `packages/cli/test/fixture-main.ts`: `await runMain(model, "example:cli", { version: "0.0.0" })` with `runMain` from `../src/bun` and `model` from `./fixture`.
  3. Create the test files listed under "Test list" below. Test names must contain the code or rule id they cover (conventions). Imports in tests: `bun:test`, `effect`, `@telos/kernel`, and relative `../src/<module>` (no extension). Never import another package's `test/` files.
- **Files**: `packages/cli/test/fixture.ts` (about 90 lines), `fixture-main.ts` (about 12), six `*.test.ts` files (about 60 to 120 lines each).
- **Validation**: `bun test packages/cli/test` fails only with missing-module errors from `../src/...`. The fixture itself must typecheck once the src files exist.

#### Test list (exact behaviours)

`derive.test.ts`
- "deriveCommands returns double and ping sorted by name, with ref, description and fields": names `["double","ping"]`; `double.fields` equals `[{ name: "n", type: "number", required: true, description: null }]`; `ping.fields` equals `[]`; `double.ref` equals `CapabilityRef.make("example:math", "double")`; `double.description` is `"Doubles n."`.
- "deriveCommands returns [] for an unknown id" and "deriveCommands returns [] for a Locus without CliSemantics" (use `"example:math"`).
- "deriveCommands uses only the first of two capabilities with the same name": a CLI Locus exposing `math.capability("double")` and `other.capability("double")`; result has one `double` whose `ref.locus` is `"example:math"` (sorted by name, then Locus id).
- "deriveCommands ignores relations that are not valid": a CLI Locus with `CliCommand.to("example:math#missing")`; the model reports `relation.capability-missing` and the command list does not contain `missing`.

`run.test.ts` (all through `runCli(model, "example:cli", argv)` with `Effect.runPromise`)
- "runCli double --n 4 prints the output and exits 0": `{ exitCode: 0, stdout: '{"value":8}\n', stderr: "" }`.
- "runCli ping exits 0 with the empty input": stdout `'{"ok":true}\n'`.
- "runCli reports a declared error with exit 1": argv `["double","--n","-1"]` gives exit 1, stdout `""`, stderr line parses to `{ tag: "Negative", message: NEGATIVE_MESSAGE, issues: [] }`. If `effect/cli` treats `-1` as a flag, do not change the argv convention: stop and report to the planner (WP14 depends on negative values after a flag).
- "runCli reports InvalidInput with exit 2 for a non-numeric operand": `["double","--n","abc"]`; the stderr JSON has `tag: "InvalidInput"` and an issue whose `path` equals `["n"]`.
- "runCli reports InvalidInput with exit 2 for a missing flag": `["double"]`.
- "runCli reports Defect with exit 1": a CLI Locus exposing `boom`; argv `["boom","--n","1"]`; tag `Defect`.
- "runCli reports NotImplemented with exit 2": exposing `pending`; argv `["pending","--n","1"]`.
- "runCli reports UsageError with exit 2 for an unknown subcommand": argv `["nope"]`; stderr is exactly `'{"tag":"UsageError","message":"Invalid command line: nope.","issues":[]}\n'` and stdout is `""`.
- "runCli reports LocusNotFound for an unknown id" and "runCli reports LocusNotFound for a Locus without CliSemantics": exit 2, stderr `'{"tag":"LocusNotFound","message":"No CLI Locus <id> in the model.","issues":[]}\n'`.
- "runCli exits 0 for --help and for double --help" and "runCli exits 0 for --version": assert `exitCode === 0` only (help goes to the Effect Console, not to Stdio).
- "EXIT_CODE maps every tag": 2 for `InvalidInput, NotGranted, NotImplemented, LocusNotFound, CapabilityNotFound, UsageError`; 1 for `Negative, Defect, InvalidOutput, SomethingElse`. Build `InvocationError` values as `{ tag, message: "x", issues: [] }`.
- "runCli stderr equals the kernel InvocationError": for `["double","--n","abc"]` compare the parsed stderr with the outcome of `invoke(model, "example:math#double", { n: "abc" }, { via: "example:cli" })` (the `error` field). This is the NFR-004 guarantee.

`archetype.test.ts` (run through `verify(model, { runner: "test", loci: [cliId] })` and look up `findings.find((f) => f.rule === ruleId && f.locus === cliId)`)
- For each rule id, one test named "<rule id> passes ..." and one named "<rule id> fails ..." with the fixed violation message:

| Rule id | Failing model | Expected `message` |
| --- | --- | --- |
| `cli.commands-exist` | `cliLocus([])` | `CLI Locus example:cli exposes no capability.` |
| `cli.unique-commands` | `cliLocus([math.capability("double"), other.capability("double")])` | `CLI Locus example:cli exposes more than one capability named double.` |
| `cli.flags-derivable` | `cliLocus([math.capability("list")])` | `Capability example:math#list has an unsupported field items.` |
| `cli.flags-derivable` (second failing test) | `cliLocus([math.capability("echo")])` | `Capability example:math#echo has an input that cannot be turned into flags.` |
| `cli.invalid-input-exit` | stub runner (see Q1): exit 0 | `Command double of example:cli did not exit 2 with InvalidInput for missing input.` |

- Passing models: `cli` from the fixture (`double`, `ping`) for all four rules, plus a passing `cli.flags-derivable` for `ping` alone (empty-object input, Q2).
- "no CliInterface finding is produced for a Locus without CliSemantics": `verify` on `example:math` has no finding with `archetype === "telos.cli.interface"`.
- Failing models need `makeRoot(math, other, brokenCli)` (each Locus id must be unique and each object contained once). Build them inside the test.

`semantics.test.ts`
- "CliCommand has the contract fields": `id === "cli.command"`, `target === "capability"`, `grantsInvocation === true`, `acyclic === false`, `description === "Exposes the target capability as a command-line subcommand named after the capability."`.
- "CliSemantics has the contract fields": `id === "telos.cli"`, `description === "Marks a Locus as a command-line interface. Its \`program\` is the executable name."`, `relationTypes` equals `[CliCommand]` (same object), `archetypes` equals `[CliInterface]`.
- "composing CliSemantics with Purpose has no conflicts": `Locus.extend(Purpose, CliSemantics).conflicts` is `[]` (`Locus.extend` returns the Locus kind, which has `conflicts`). The fixture `model` has `hasErrors(model) === false` and `model.diagnostics` equals `[]`.

`bun.test.ts` (20 s timeouts: `test(name, fn, 20000)`)
- "runMain writes stdout and exits 0": `Bun.spawn(["bun", <absolute path of test/fixture-main.ts>, "double", "--n", "4"], { stdout: "pipe", stderr: "pipe" })`; absolute path from `join(import.meta.dir, "fixture-main.ts")`. Expect exit 0 and stdout `'{"value":8}\n'`.
- "runMain writes stderr and sets the exit code": `["double","--n","abc"]` gives exit 2 and stderr tag `InvalidInput`.

`exports.test.ts`
- "the main entry exports exactly the contract values": `Object.keys(await import("../src/index")).sort()` equals `["CLI_COMMAND_TYPE","CliCommand","CliInterface","CliSemantics","EXIT_CODE","deriveCommands","memoryEnvironment","runCli"]` sorted with plain code-unit order (the type-only exports `DerivedCommand`, `CliResult`, `Captured` do not exist at run time).
- "the main entry does not import platform modules": read each `packages/cli/src/*.ts` except `bun.ts` and assert that every `from "<specifier>"` is relative, `@telos/kernel`, `effect`, `effect/cli` or `effect/process`. Assert that `bun.ts` is not imported by any other src file.

### Subtask T055 – Implement derive.ts, environment.ts and semantics.ts

- **Purpose**: the pure derivation and the in-memory Effect environment, then the extension that ties them to the Archetype.
- **Order**: write `derive.ts` and `environment.ts` first. `semantics.ts` imports `CliInterface` from `archetype.ts` (T058), which imports `derive.ts` and `run.ts`. So write `semantics.ts` last, after T058, and mark T055 done only when it exists. Never import `semantics.ts` from `derive.ts`, `run.ts` or `archetype.ts` (contract "Module order": that would be an import cycle).
- **Steps**:
  1. `derive.ts` (header `LINKS: M-PACK-CLI, V-M-PACK-CLI`):
     - `export const CLI_COMMAND_TYPE = "cli.command"` (a `const` so its type is the literal).
     - `export interface DerivedCommand { readonly name: string; readonly ref: CapabilityRef; readonly description: string; readonly fields: ReadonlyArray<InputField> }`.
     - Module-internal helpers, exported from `derive.ts` but **not** re-exported by `index.ts`: `CLI_EXTENSION_ID = "telos.cli"`, `isCliLocus(model, id): boolean` (`model.loci.get(id)?.definition.kind.extensions.some((e) => e.id === CLI_EXTENSION_ID) === true`), `exposedTargets(model, id): ReadonlyArray<{ readonly locus: string; readonly capability: string }>`.
     - `exposedTargets`: `[]` unless `isCliLocus`. Otherwise take `outgoing(model, id)`, keep entries with `valid === true`, `type.id === CLI_COMMAND_TYPE` and `target.capability !== null`, map to `{ locus: target.locus, capability: target.capability }`, sort by capability name then Locus id with plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`, never `localeCompare`). **Do not de-duplicate** (the Archetype needs the duplicates).
     - `deriveCommands(model, cliLocusId)`: `Effect.gen`; take `exposedTargets`, keep the first target per capability name, and for each call `describeCapability(model, locus, capability)`; build `{ name: capability, ref: CapabilityRef.make(locus, capability), description: description.description, fields: inputFields(description) }`. Returns `[]` for an unknown id or a Locus without `CliSemantics`.
  2. `environment.ts`: `Captured` and `memoryEnvironment(argv, captured)` exactly as in `contracts/packs.md` (the code block there; the contract says it comes from "research R7", but `research.md` R7 contains only prose, so use the contract's code). Reference shape:

     ```ts
     import { Effect, FileSystem, Layer, Path, Sink, Stdio, Stream, Terminal } from "effect";
     import { ChildProcessSpawner } from "effect/process";
     const dec = new TextDecoder();
     const w = (buf: Array<string>) => (c: string | Uint8Array) =>
       Effect.sync(() => {
         buf.push(typeof c === "string" ? c : dec.decode(c));
       });
     // memoryEnvironment returns Layer.mergeAll(
     //   FileSystem.layerNoop({}), Path.layer,
     //   Layer.succeed(Stdio.Stdio, Stdio.make({ args: Effect.succeed([...argv]),
     //     stdout: () => Sink.forEach(w(captured.stdout)), stderr: () => Sink.forEach(w(captured.stderr)),
     //     stdin: Stream.empty })),
     //   Layer.succeed(Terminal.Terminal, Terminal.make({ columns: Effect.succeed(80), rows: Effect.succeed(24),
     //     readInput: Effect.die("unused"), readLine: Effect.die("unused"), display: (s) => w(captured.stdout)(s) })),
     //   Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, ChildProcessSpawner.make(() => Effect.die("unused"))))
     ```

     Its return type is `Layer.Layer<FileSystem.FileSystem | Path.Path | Stdio.Stdio | Terminal.Terminal | ChildProcessSpawner.ChildProcessSpawner>`.
  3. `semantics.ts` (after T058): 
     - `export const CliCommand = RelationType.make(CLI_COMMAND_TYPE, { description: "Exposes the target capability as a command-line subcommand named after the capability.", target: "capability", grantsInvocation: true })`
     - `export const CliSemantics = Extension.make("telos.cli", { description: "Marks a Locus as a command-line interface. Its \`program\` is the executable name.", properties: { program: Schema.String }, relationTypes: [CliCommand], archetypes: [CliInterface] })`. The description text contains backticks around `program` exactly as in the contract; write the string with a normal quoted string and escaped backticks or single quotes around the text.
- **Files**: `derive.ts` (about 70 lines), `environment.ts` (about 40), `semantics.ts` (about 30).
- **Validation**: `bun test packages/cli/test/derive.test.ts packages/cli/test/semantics.test.ts` passes after T058.
- **Notes**: if `effect` 4.0.4 has no export that the contract names (`Stdio.make`, `Sink.forEach`, `Terminal.make`, `ChildProcessSpawner.make`, `FileSystem.layerNoop`, `Path.layer`), look it up in the installed declarations (find the `effect` package with `bun pm ls effect` or look under the workspace `node_modules/effect`, using its `package.json` `exports`). If it truly does not exist, stop and report. Do not invent a replacement.

### Subtask T056 – Implement run.ts

- **Purpose**: `runCli` and `EXIT_CODE`.
- **Steps**:
  1. Exports: `CliResult { exitCode: 0 | 1 | 2; stdout: string; stderr: string }`, `EXIT_CODE(error: InvocationError): 1 | 2` (2 for tags `InvalidInput, NotGranted, NotImplemented, LocusNotFound, CapabilityNotFound, UsageError`; 1 for every other tag), and `runCli(model, cliLocusId, argv, options?: { readonly version?: string }): Effect.Effect<CliResult>`. It never fails and never dies for a user error.
  2. `runCli` behaviour (contract steps, in this order):
     - If `!isCliLocus(model, cliLocusId)` → `{ exitCode: 2, stdout: "", stderr: JSON.stringify({ tag: "LocusNotFound", message: "No CLI Locus <id> in the model.", issues: [] }) + "\n" }`.
     - `program` = `definition.properties["program"]` when it is a non-empty string, else the Locus id (Q3). `version` = `options?.version ?? "0.0.0"`.
     - `commands = yield* deriveCommands(model, cliLocusId)`. Build `Command.make(program)` with `Command.withSubcommands`, and per derived command `Command.make(name, flags, handler)` where `flags = { [field.name]: Flag.String(field.name).pipe(Flag.optional) }` for every field (also fields of type `unsupported`). Check the exact signatures of `Command.make`, `Command.withSubcommands`, `Command.runWith`, `Flag.String`, `Flag.optional` in the installed `effect/cli` declarations before you write them (research R7: `Flag.float` does not exist; the constructors are `Flag.String`, `Flag.Finite`, ...). The dynamic flags object needs a cast to a record of `Flag<Option<string>>` and the handler parameter is `Record<string, Option.Option<string>>`; keep the cast in one place with a one-line comment.
     - Handler: turn the `Option` values into `Record<string, string | undefined>` (`Option.getOrUndefined`), `coerceInput(command.fields, raw)`, then `invoke(model, command.ref, coerced, { via: cliLocusId })`. On `{ ok: true }` push `JSON.stringify(output) + "\n"` to a local `out` array. On `{ ok: false }` push `JSON.stringify(error) + "\n"` to a local `err` array and record `exitCode = EXIT_CODE(error)`. Set a local `handled = true` flag. The handler itself succeeds either way.
     - Run `Command.runWith(root, { version })(argv)` provided with `memoryEnvironment(argv, captured)` under `Effect.exit`. Use a separate throw-away `Captured` for the environment: the result is built only from the handler's own `out` and `err` lines, so output that `effect/cli` writes to Stdio never leaks into the result.
     - If the exit is a failure and `handled` is false → `{ exitCode: 2, stdout: "", stderr: JSON.stringify({ tag: "UsageError", message: "Invalid command line: " + argv.join(" ") + ".", issues: [] }) + "\n" }`. If the exit is a failure and `handled` is true, keep the handler's result.
     - Otherwise return `{ exitCode, stdout: out.join(""), stderr: err.join("") }` (exit code 0 by default, so `--help` and `--version` give 0).
  3. File header and a `START_CONTRACT` block for `EXIT_CODE` and `runCli` (conventions "GRACE file markup").
- **Files**: `packages/cli/src/run.ts` (about 110 lines).
- **Validation**: `bun test packages/cli/test/run.test.ts` passes.
- **Notes**: help is printed through the Effect `Console` to the process stdout. This is why tests only assert `exitCode === 0` for help. Do not try to capture it.

### Subtask T057 – Implement bun.ts

- **Purpose**: the Bun-only entry `@telos/cli/bun`.
- **Steps**: `export const runMain = (model: SemanticModel, cliLocusId: string, options?: { readonly version?: string; readonly argv?: ReadonlyArray<string> }): Promise<void>`. `argv` defaults to `process.argv.slice(2)`. It runs `Effect.runPromise(runCli(model, cliLocusId, argv, version option))`, writes `result.stdout` to `process.stdout` and `result.stderr` to `process.stderr` (only when non-empty), and sets `process.exitCode = result.exitCode`. With `exactOptionalPropertyTypes`, build the options object without passing `version: undefined`.
- **Files**: `packages/cli/src/bun.ts` (about 30 lines). It is the only src file that may use `process`. It is not imported by `index.ts`.
- **Validation**: `bun test packages/cli/test/bun.test.ts` passes.

### Subtask T058 – Implement archetype.ts

- **Purpose**: the `CliInterface` Archetype (id `telos.cli.interface`, `appliesTo: ["telos.cli"]`).
- **Steps**: `export const CliInterface = Archetype.make({ id: "telos.cli.interface", description: "Checks that a command-line interface Locus exposes derivable, uniquely named commands that report invalid input with exit code 2.", appliesTo: ["telos.cli"], rules: [...] })`. Build each rule with `Rule.make({ id, description, method, check })`. `check` receives `ctx: RuleContext` (`ctx.model`, `ctx.locus.id`) and returns `Effect.Effect<void, RuleViolation>`; fail with `violation(message)`. Import `exposedTargets`, `deriveCommands` from `./derive` and `runCli` from `./run`. Never import `./semantics`.

  | Rule id | Method | Passes when | Failure message (exact) |
  | --- | --- | --- | --- |
  | `cli.commands-exist` | static | `exposedTargets(...)` is non-empty | `CLI Locus <id> exposes no capability.` |
  | `cli.unique-commands` | static | no capability name appears twice in `exposedTargets` | `CLI Locus <id> exposes more than one capability named <name>.` (first duplicated name in sorted order) |
  | `cli.flags-derivable` | static | for every target, `describeCapability` then `inputFields` has no field of type `unsupported`, and has at least one field or an empty-object input schema (Q2) | unsupported field: `Capability <locus>#<capability> has an unsupported field <field>.`; no fields and not an empty object: `Capability <locus>#<capability> has an input that cannot be turned into flags.` (first offending target in order) |
  | `cli.invalid-input-exit` | execution | for every derived command with at least one required field, `runCli(model, id, [name])` gives `exitCode === 2` and a stderr line whose JSON `tag` is `InvalidInput` | `Command <name> of <id> did not exit 2 with InvalidInput for missing input.` |

  Rule descriptions (use these): "The Locus exposes at least one capability as a command." / "No two exposed capabilities share a command name." / "Every exposed capability has an input that maps to flags." / "A command with required input exits with code 2 and InvalidInput when the input is missing."
  Implement `cli.invalid-input-exit` through `invalidInputExitViolation(model, cliLocusId, run = runCli)` per Q1: it returns `Effect<string | null>` (the message or `null`). Parse the stderr with `JSON.parse` inside a `try`/`catch`; unparsable stderr is a violation. Keep `invalidInputExitViolation` and no other helper in the exports of `archetype.ts` besides `CliInterface`.
- **Files**: `packages/cli/src/archetype.ts` (about 130 lines).
- **Validation**: `bun test packages/cli/test/archetype.test.ts` passes. Every rule has a passing and a failing test (NFR-005).

### Subtask T059 – Write index.ts and register M-PACK-CLI in GRACE

- **Purpose**: the public entry and the architecture knowledge.
- **Steps**:
  1. Overwrite `packages/cli/src/index.ts` with the contract export list: values `CLI_COMMAND_TYPE, CliCommand, CliSemantics, CliInterface, deriveCommands, runCli, EXIT_CODE, memoryEnvironment`, and types `DerivedCommand, CliResult, Captured` (use `export type { ... }`; the repository sets `verbatimModuleSyntax`). Imports have no `.ts` extension. Do not export `exposedTargets`, `isCliLocus`, `CLI_EXTENSION_ID`, `invalidInputExitViolation` or `runMain`.
  2. Every new `src/*.ts` and every test file starts with the GRACE header in `contracts/conventions.md` (copy the shape from `scripts/review-gate.ts`). All src files use `LINKS: M-PACK-CLI, V-M-PACK-CLI`, `ROLE: RUNTIME`, `MAP_MODE: EXPORTS`, and `DEPENDS: M-KERNEL-API`. Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`. Each exported function or constant has a `START_CONTRACT` / `END_CONTRACT` block; exported types need only the MODULE_MAP line.
  3. Register the module only now, when all test files exist. Open `.grace/graph/pack-cli.xml` and `.grace/verification/pack-cli.xml` (WP01 created them with an empty `<Owns />`; keep their root element and style, as in `.grace/graph/main.xml` before the split) and add:

     ```xml
     <M-PACK-CLI>
       <Summary>Derives command-line subcommands from the capabilities a CLI Locus exposes and runs them through kernel invoke.</Summary>
       <Path>packages/cli/src/semantics.ts</Path>
       <Path>packages/cli/src/archetype.ts</Path>
       <Path>packages/cli/src/derive.ts</Path>
       <Path>packages/cli/src/run.ts</Path>
       <Path>packages/cli/src/environment.ts</Path>
       <Path>packages/cli/src/bun.ts</Path>
       <Path>packages/cli/src/index.ts</Path>
       <M-KERNEL-API />
     </M-PACK-CLI>
     ```

     and in the verification document a `V-M-PACK-CLI` entry with `<TestFiles>` listing the six `*.test.ts` files, `<Command>bun test packages/cli/test</Command>`, one `<Scenario>` per tested behaviour (derivation, runner outputs and exit codes, usage errors, the four rules, extension fields, Bun entry, export list) and a `<TraceAssertion>` naming the tests that prove them.
  4. In `.grace/graph/index.xml` add `<M-PACK-CLI />` to the `<Owns>` block of `GD-PACK-CLI`, and in `.grace/verification/index.xml` add `<V-M-PACK-CLI />` to `VD-PACK-CLI`. Edit nothing else in those files. If `M-KERNEL-API` does not exist in the graph, stop and report (WP09 must have registered it).
- **Files**: `packages/cli/src/index.ts` (about 25 lines), the two area documents, the two index files (own block only).
- **Validation**: `bun test packages/cli/test/exports.test.ts` passes, and `bun run grace:lint` passes (no `missing-module-coverage`, no `invalid-test-file`).

## Implementation command and gate

```bash
spec-kitty agent action implement WP10 --agent claude
```

Fast loop while you work: `bun test packages/cli/test`, `bun run typecheck`, `bun run lint`, `bun run format` (this one writes files), `bun run grace:lint`.
Run `bun run format` once so the files match the repository style, then before you hand over run the full gate `bun run verify` and report each step's result exactly. Then:

1. Commit the sanctioned index edits yourself (`git add .grace/graph/index.xml .grace/verification/index.xml`) with a Conventional Commit such as `feat(cli): register the CLI Pack in GRACE` and a body line `Sanctioned edit: own Owns block in .grace/graph/index.xml and .grace/verification/index.xml.` No AI names, no co-author lines, never `--no-verify`.
2. Record each subtask: `spec-kitty agent tasks mark-status T054 --status done` (and T055 to T059).
3. Move the WP to review: `spec-kitty agent tasks move-task WP10 --to for_review` (run `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` if the lane name differs).

## Definition of Done

- `bun test packages/cli/test` passes with every test in the lists above (T054 to T058), and no test is skipped or empty.
- `bun run typecheck`, `bun run lint`, `bun run format:check` and `bun run grace:lint` pass. `bun run verify` passes as a whole.
- `packages/cli/src/index.ts` exports exactly the contract list. The main entry imports only `@telos/kernel`, `effect`, `effect/cli`, `effect/process` and relative modules. Only `bun.ts` uses `process`.
- Every `CliInterface` rule has one passing and one failing test with the exact messages above (the `cli.invalid-input-exit` failing tests use the stub runner of Q1 until the planner answers).
- `runCli` output and exit codes follow the contract, and the CLI error JSON equals the kernel `InvocationError` unchanged.
- `M-PACK-CLI` and `V-M-PACK-CLI` are registered in the `pack-cli` documents and in the `<Owns>` blocks of both index files, and `grace lint --path . --assertions current` passes.
- Each subtask has a `mark-status ... --status done` record. Commits follow Conventional Commits with no AI attribution.
- No file outside `owned_files` changed, except the sanctioned own-block edits of the two GRACE index files.

## Risks

- **effect/cli names differ from the contract.** Mitigation: check the installed declarations first. If a contract API does not exist, stop and report. Do not invent a replacement.
- **`--n -1` parsed as a flag.** The "declared error" test covers it. If it fails, report; do not change the argv convention.
- **Import cycle** `semantics.ts` to `archetype.ts` to `run.ts`/`derive.ts` back to `semantics.ts`. Mitigation: the module order rule above; `exports.test.ts` and `bun run typecheck` catch it.
- **Help output** goes to the Effect Console. Assert exit codes only.
- **GRACE lint** fails if a module is registered before its test files exist, or without its `V-` entry. Register in T059 only.
- **Move-task auto-commit refuses non-owned files** (the two index files). Commit them yourself first.
- **Q1 stub tests** can be mistaken for fake tests. Name them clearly, and keep the passing path on the real runner.

## Reviewer Guidance

- Check each contract signature in `contracts/packs.md` (CLI section) against the code, especially `deriveCommands`, `runCli`, `EXIT_CODE`, `runMain`, and the `memoryEnvironment` return type.
- Check that every `CliInterface` rule has a passing and a failing test, that failure messages match this prompt exactly, and that the stderr JSON for failures equals the kernel `InvocationError`.
- Confirm no import of another Pack or a kernel internal path, no `bun`/`node:` import outside `bun.ts`, and no `localeCompare`.
- Confirm that only the own `<Owns>` blocks changed in the two GRACE index files and that headers and `START_CONTRACT` blocks exist for every export.
- Confirm that `bun run verify` output is quoted exactly in the hand-over, and that the open questions Q1 to Q3 were applied as written.

## Activity Log

- 2026-10-24T00:00:00Z – system – Prompt created.

# Contract: Packs `@telos/cli`, `@telos/agent`, `@telos/web`

Packs are ordinary packages that import **only** the public entry `@telos/kernel` (never `@telos/kernel/src/...`) and `effect`. No Pack imports another Pack. The main entry of every Pack is browser-safe. Bun-only code lives in the extra entries listed in each export map.

Shared rules:

- An **interface Locus** is a Locus whose kind includes the Pack's extension. It exposes a capability through a relation of the Pack's relation type. These relation types have `target: "capability"` and `grantsInvocation: true`.
- An interface Locus is recognized by its kind: `definition.kind.extensions.some((e) => e.id === "<extension id>")`.
- The exposed capabilities are the valid (`valid: true`) outgoing model relations of the interface Locus whose `type.id` equals the Pack's relation type id constant. They are sorted by capability name, then by Locus id. When two targets share a capability name, only the first is used, and the Pack's Archetype reports it.
- **Module order, to avoid import cycles**: the relation type id is a string constant in the derivation module (`derive.ts`, `tools.ts`, `form.ts`). `semantics.ts` imports that constant and `archetype.ts`, and it is the only module that builds the RelationType and the Extension. `archetype.ts` imports the derivation and run modules, never `semantics.ts`.
- Every invocation goes through kernel `invoke(model, ref, input, { via: interfaceLocusId })`. Text input is turned into values with kernel `inputFields` + `coerceInput`. Errors are the kernel's `InvocationError`, unchanged.

---

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

---

## `@telos/agent` (WP11)

Export map: `{ ".": "./src/index.ts", "./mcp": "./src/mcp.ts", "./client": "./src/client.ts", "./package.json": "./package.json" }`.

### semantics.ts

```ts
export const AgentTool: RelationType<"agent.tool">
// description "Exposes the target capability as an agent tool named after the capability."; target "capability"; grantsInvocation true
export const AgentSemantics: Extension<"telos.agent", { server: typeof Schema.String }>
// description "Marks a Locus as an agent tool interface. Its `server` is the MCP server name."; relationTypes [AgentTool]; archetypes [AgentInterface]
```

### tools.ts

```ts
export const AGENT_TOOL_TYPE = "agent.tool"
export const TOOL_NAME_PATTERN: RegExp   // /^[a-zA-Z0-9_-]{1,64}$/
export interface ToolAnnotations { readonly readOnlyHint: boolean; readonly destructiveHint: boolean; readonly idempotentHint: boolean; readonly openWorldHint: boolean }
export interface ToolDefinition {
  readonly name: string                       // capability name, or telos_* for introspection tools
  readonly description: string
  readonly inputSchema: unknown               // derived with toolInputSchema(capability.input), see below
  readonly annotations: ToolAnnotations       // readOnlyHint = idempotentHint = (effect !== "write"); destructiveHint = false; openWorldHint = false
  readonly _meta: { readonly "telos/capability": string | null; readonly "telos/effect": EffectClass }  // ref string, or null for introspection tools
}
export interface ToolResult {
  readonly isError: boolean
  readonly text: string                       // JSON.stringify(output) on success, JSON.stringify(error) on failure
  readonly structured: Readonly<Record<string, unknown>>   // { ok: true, output } or { ok: false, error }
}
export interface DerivedTool { readonly definition: ToolDefinition; readonly ref: CapabilityRef }
export const deriveTools: (model: SemanticModel, agentLocusId: string) => Effect.Effect<ReadonlyArray<DerivedTool>>
export const callTool: (model: SemanticModel, agentLocusId: string, name: string, args: unknown) => Effect.Effect<ToolResult>
// unknown name -> isError with { tag: "CapabilityNotFound", message: "Agent <id> has no tool <name>.", issues: [] }
// otherwise invoke(model, ref, args, { via: agentLocusId }) and map the outcome; args are passed unchanged (no coercion; JSON values)
export function toToolResult(outcome: InvocationOutcome): ToolResult
export function toolInputSchema(input: JsonSchemaDocument): Readonly<Record<string, unknown>>
```

`toolInputSchema` turns the kernel's `JsonSchemaDocument` into an MCP tool input schema. MCP requires `inputSchema.type === "object"` (`McpSchema.ToolJson`). The rules, in order:

1. `top = input.schema`. If `top` is exactly `{ "$ref": "#/$defs/<Name>" }` and `input.definitions[<Name>]` exists, `top = input.definitions[<Name>]` (an identifier-annotated struct or a `Schema.Class`).
2. If `top` deep-equals `{ "not": { "type": "null" } }` (what `Schema.toJsonSchemaDocument(Schema.Struct({}))` returns), `top = { "type": "object", "properties": {} }`.
3. If `input.definitions` has at least one key, the result is `{ ...top, "$defs": input.definitions }`; otherwise it is `{ ...top }`.

Any other top-level schema (for example a non-struct input) is returned as it is; `agent.input-object` then fails for it, and `registerTools` skips tools whose `inputSchema.type !== "object"`. Prototyped outputs (effect 4.0.4): `Schema.Struct({ a: Schema.Finite, b: Schema.Finite })` gives `{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"],"additionalProperties":true}` with empty definitions.

### introspection-tools.ts

These are read-only tools over the `Telos` service. They describe; they never invoke (information access does not grant authority).

```ts
export interface IntrospectionTool { readonly definition: ToolDefinition; readonly call: (args: unknown) => Effect.Effect<ToolResult> }
export const INTROSPECTION_TOOL_NAMES: ReadonlyArray<string>
// ["telos_capabilities", "telos_impact", "telos_inspect", "telos_list_loci", "telos_relations", "telos_verifications"]
export function introspectionTools(telos: TelosApi): ReadonlyArray<IntrospectionTool>   // sorted by name
```

| Tool | Input schema | Output (`structured.output`) |
| --- | --- | --- |
| `telos_list_loci` | `{}` | `{ loci: string[] }` |
| `telos_inspect` | `{ id: string }` | the `LocusDescription` |
| `telos_relations` | `{ id: string }` | `{ outgoing, incoming }` |
| `telos_capabilities` | `{ id: string }` | `{ capabilities: CapabilityDescription[] }` |
| `telos_verifications` | `{ id: string }` | `{ verifications: VerificationDescription[] }` (latest report of the service, else not-run) |
| `telos_impact` | `{ target: string }` | the `ImpactReport` |

- Each tool's `inputSchema` is `toolInputSchema(toJsonSchema(<its input schema>))`, where the input schema is `Schema.Struct({})` for `telos_list_loci`, `Schema.Struct({ id: Schema.String })` for the four id tools and `Schema.Struct({ target: Schema.String })` for `telos_impact`. So `telos_list_loci` has exactly `{ "type": "object", "properties": {} }`.
- Input is decoded with the same schema. Failure → `{ tag: "InvalidInput", message: "Invalid input for <tool>.", issues }`.
- `LocusNotFound` and `CapabilityNotFound` failures → `{ tag, message, issues: [] }`.
- All annotations are `readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false`, with `_meta["telos/capability"] = null` and `_meta["telos/effect"] = "read"`.

### mcp.ts (`@telos/agent/mcp`, Bun)

Quote the prototype from research R6.

```ts
export const BunStdio: Layer.Layer<Stdio.Stdio>
// Stdio.make({ args: Effect.sync(() => process.argv.slice(2)),
//   stdout: () => Sink.forEach((c: string | Uint8Array) => Effect.sync(() => { process.stdout.write(c) })),
//   stderr: () => Sink.forEach((c: string | Uint8Array) => Effect.sync(() => { process.stderr.write(c) })),
//   stdin: Stream.fromReadableStream({ evaluate: () => Bun.stdin.stream() as ReadableStream<Uint8Array>, onError: (e) => e as any }) })
export const registerTools: (telos: TelosApi, agentLocusId: string) => Layer.Layer<never, never, McpServer.McpServer>
// Layer.effectDiscard: for every deriveTools(...) entry whose definition.inputSchema.type === "object", and every introspectionTools(...) entry:
//   server.addTool({ tool: new McpSchema.Tool({ name, description, inputSchema, annotations: <plain object>, _meta }), annotations: Context.empty(),
//     handle: (payload) => <call>.pipe(Effect.map((r) => new McpSchema.CallToolResult({ content: [{ type: "text", text: r.text }] as any, structuredContent: r.structured, isError: r.isError }))) })
// content MUST be plain objects (McpSchema.TextContent instances cause an InternalError)
export const serveMcp: (root: LocusDefinition, agentLocusId: string, options: { readonly version: string }) => Promise<void>
// builds Telos.make(root); server name = the agent Locus properties.server;
// const ready = Deferred.makeUnsafe<void>();
// Layer.launch(Layer.effectDiscard(Deferred.succeed(ready, undefined)).pipe(
//   Layer.provide(registerTools(telos, agentLocusId)),
//   Layer.provide(McpServer.layerStdio({ name, version, protocols: [McpProtocol.v2025_06_18] })),
//   Layer.provide(gateStdin(ready)),
//   Layer.provide(BunStdio)))
// gateStdin (module-local, not exported): Layer.effect(Stdio.Stdio, ...) over the provided Stdio, returning
//   Stdio.make({ args: stdio.args, stdout: (o) => stdio.stdout(o), stderr: (o) => stdio.stderr(o),
//                stdin: Stream.unwrap(Effect.as(Deferred.await(ready), stdio.stdin)) })
// logs nothing to stdout (stdout carries the protocol)
```

**Startup order (required).** `serveMcp` registers every tool before the server reads its first request. `tools/list` is complete from the first request on, and every tool is callable from the first request on. This holds even when the requests are already waiting on stdin when the process starts.

Why the gate is needed: `McpServer.layerStdio` starts the server and its stdin reader when the layer is built. `registerTools` is built after it, and `deriveTools` crosses an asynchronous boundary. Without the gate, a request already on stdin is answered before the tools exist: `tools/list` returns `[]` and `tools/call` fails with `Tool '<name>' not found`. WP14 found this with the calculator server (17 of 20 fresh starts listed no tool). The `notifications/tools/list_changed` that `addTool` sends does not help, because the deterministic client ignores notifications. `Layer.provide` builds the provided layer first. So the order is `BunStdio`, then the gate, then the server (its stdin reader waits on `ready`), then `registerTools`, then `ready` is completed.

Do not use `McpServer.toolkit`: it answers invalid params with JSON-RPC `-32602` and bypasses kernel `InvalidInput` (research R6).

### client.ts (`@telos/agent/client`, Bun) — the deterministic agent client

```ts
export interface ListedTool { readonly name: string; readonly description: string; readonly inputSchema: unknown; readonly annotations?: unknown; readonly _meta?: unknown }
export interface CallResult { readonly isError: boolean; readonly text: string; readonly structuredContent: unknown }
export class McpStdioClient {
  static spawn(command: ReadonlyArray<string>, options?: { readonly cwd?: string; readonly timeoutMs?: number }): Promise<McpStdioClient>
  // Bun.spawn(command, { stdin: "pipe", stdout: "pipe", stderr: "pipe" }); timeoutMs default 10000; then performs initialize
  readonly server: { readonly serverName: string; readonly protocolVersion: string }  // the result of the initialize that spawn performed
  initialize(): Promise<{ readonly serverName: string; readonly protocolVersion: string }>
  // sends {"jsonrpc":"2.0","id":n,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"telos-deterministic-client","version":"0.0.0"}}}
  // then the notification {"jsonrpc":"2.0","method":"notifications/initialized"}
  listTools(): Promise<ReadonlyArray<ListedTool>>                    // method "tools/list"; sorted by name
  callTool(name: string, args: unknown): Promise<CallResult>         // method "tools/call", params { name, arguments: args }
  close(): Promise<number>                                           // ends stdin, waits for exit, returns the exit code
}
```

- Messages are newline-delimited JSON. Request ids start at 1 and increase by 1. Responses are matched by id, and notifications from the server are ignored.
- A JSON-RPC `error` response rejects with `Error("MCP error <code>: <message>")`. A timeout rejects with `Error("MCP request <method> timed out.")`.
- No network and no credentials are used (NFR-007).

### archetype.ts

```ts
export const AgentInterface: Archetype   // id "telos.agent.interface", appliesTo ["telos.agent"]
```

| Rule id | Method | Passes when |
| --- | --- | --- |
| `agent.tools-exist` | static | at least one valid `agent.tool` relation |
| `agent.tool-names` | static | every exposed capability name matches `TOOL_NAME_PATTERN`, is not in `INTROSPECTION_TOOL_NAMES`, and is unique |
| `agent.input-object` | static | every derived tool's `definition.inputSchema.type === "object"` (after `toolInputSchema`) |
| `agent.invalid-input-error` | execution | for every tool with a required field, `callTool(model, id, name, {})` gives `isError: true` and `structured.error.tag === "InvalidInput"` |

### index.ts

Exports `AGENT_TOOL_TYPE, AgentTool, AgentSemantics, AgentInterface, TOOL_NAME_PATTERN, deriveTools, callTool, toToolResult, toolInputSchema, introspectionTools, INTROSPECTION_TOOL_NAMES, ToolDefinition, ToolAnnotations, ToolResult, DerivedTool, IntrospectionTool`.

---

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

---

## Tests (each Pack's `test/` directory)

Each Pack builds a tiny fixture model in `test/fixture.ts`: an `example:math` Locus with a `double` capability (input `{ n: Schema.Finite }`, output `{ value: Schema.Finite }`, error `Negative` when `n < 0`) and one interface Locus exposing it. Every Archetype rule has one passing and one failing test (NFR-005). The CLI tests use `runCli` in memory. The agent tests use `callTool`, `introspectionTools`, and one subprocess test that spawns `bun test/fixture-server.ts` (calls `serveMcp`) through `McpStdioClient`, then asserts `tools/list` names, annotations and a `tools/call` round trip. A startup-order test in `test/mcp.test.ts` spawns `bun test/fixture-server.ts` ten times in a row. Each time it passes `initialize`, `notifications/initialized` and `tools/list` (id 2) as stdin that is already written before the server starts (`Bun.spawn(..., { stdin: <encoded payload> })`). It asserts that each run exits 0 and that the id-2 response names `double` and every introspection tool. The test fails without the stdin gate (18 of 20 runs listed no tool when it was planned). The web tests use `formModel`.

**Discovery never grants invocation (US4.4, spec D6).** The agent fixture's `example:math` Locus also declares a capability `secret` (input `{}`, output `{ ok: Schema.Boolean }`, effect `read`) that no `agent.tool` relation exposes. `test/grant.test.ts` asserts three things:

- `telos_capabilities {"id":"example:math"}` lists `secret` (it is discoverable);
- `invoke(model, "example:math#secret", {}, { via: "example:agent" })` returns `{ ok: false, error: { tag: "NotGranted", message: "example:agent is not granted to invoke example:math#secret.", issues: [] } }`;
- `deriveTools` has no tool named `secret`, and over MCP `tools/call` for `secret` is rejected by the server with `MCP error -32602: Tool 'secret' not found` (the client sees no tool to call).

# Research: Semantic Foundation Rebuild

The prototypes below ran on 2026-10-22 against the installed effect 4.0.4 and Bun 1.4.4-canary.1, in a scratch directory outside the repository. The code that worked is quoted in [contracts/](contracts/) and in the WP prompts.

## R1 Baseline

- **Decision**: start from the green baseline on `main`: typecheck clean (211 files, 4 projects), 875 tests passing in 48 files, lint clean, `grace lint` clean. Missions 001–003 are done, and no Spec Kitty Op is open.
- **Rationale**: every WP must keep this green (NFR-006).

## R2 Type-level composition of extensions

- **Decision**: `Extension<Id, Fields extends Schema.Struct.Fields>`, plus `LocusKind<Es extends ReadonlyArray<Extension>>` whose `extend(...more)` returns `LocusKind<readonly [...Es, ...More]>`. The property type of `make` is `Schema.Struct.Type<MergedFields<Es>>`, where `MergedFields` is the intersection of the fields of all extensions (a `UnionToIntersection` over `Es[number]`). `properties` is optional exactly when every merged field is optional. `definition.capability(name)` only accepts keys of the declared capabilities.
- **Evidence**: the prototype type-checked under the repository's `tsconfig.base.json` (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) with `bun check`. The checks were:
  - a missing required property is a type error (`@ts-expect-error` held)
  - an unknown capability name is a type error
  - `Locus.make({ id })` needs no properties
  - handler parameters are inferred from the input schema
- **Alternatives**: a namespace per extension (`properties: { cli: {...} }`). It is rejected as the default because it is more verbose and makes conflict detection pointless (spec D5).

## R3 Runtime schema operations

- **Decision**:
  - Properties are decoded with `Schema.decodeUnknownExit(Schema.Struct(merged))(raw, { errors: "all" })`.
  - Issues are formatted with `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue)`, which gives `{ issues: [{ path, message }] }`.
  - JSON Schemas come from `Schema.toJsonSchemaDocument(schema)`, which gives `{ dialect, schema, definitions }`.
  - Declared errors are recognized with `Schema.is(errorSchema)(value)`, and an error's tag is the class's `identifier`.
  - Model comparison uses `JsonPatch.get(before, after)`, which gives RFC 6902 operations.
- **Evidence**: the prototype printed `{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"],...}` for `Schema.Struct({ a: Schema.Finite, b: Schema.Finite })`. It printed `DivisionByZero` for `DivisionByZero.identifier` and `[{"op":"replace","path":"/b/c","value":3},{"op":"add","path":"/d","value":4}]` for `JsonPatch.get`.
- **Note**: in Effect 4.0.4 the constructor is `Schema.TaggedError<Self>()("Tag", fields)`. `TaggedErrorClass` does not exist.

## R4 Digests

- **Decision**: `digestOf(value)` is SHA-256 over `canonicalJson(value)` through Web Crypto, returned as `sha256:<hex>`. It is an `Effect`, because Web Crypto is asynchronous, and it works in both Bun and the browser. The old `revision.ts` code is reused.
- **Alternatives**: `Bun.CryptoHasher` is synchronous, but it is Bun-only and would break NFR-001.

## R5 Effect services

- **Decision**: `class Telos extends Context.Service<Telos, TelosApi>()("@telos/kernel/Telos") {}`, with `Telos.layer(root)` built by `Layer.effect(Telos, Effect.gen(...))` and `Telos.of({...})`.
- **Evidence**: the prototype ran, and a typed `LocusNotFound` failure was observed through `Effect.flip`.

## R6 Agent tools over MCP

- **Decision**: the agent Pack registers each exposed capability with `McpServer.addTool({ tool: new McpSchema.Tool({ name, description, inputSchema, annotations, _meta }), annotations: Context.empty(), handle })`. `inputSchema` is the capability's input JSON Schema, and `handle` calls kernel `invoke`. Results are `new McpSchema.CallToolResult({ content: [{ type: "text", text }], structuredContent?, isError })` with **plain-object** content. The server runs with `McpServer.layerStdio({ name, version, protocols: [McpProtocol.v2025_06_18] })` and a hand-built Bun `Stdio` layer.
- **Evidence**: an NDJSON exchange of `initialize`, `notifications/initialized`, `tools/list` and `tools/call` returned `{"ok":true,"output":{"result":5}}` for valid input, and an `isError: true` result carrying the kernel `InvalidInput` for invalid input.
  - Passing `McpSchema.TextContent` instances inside the result failed schema validation, which produced an MCP InternalError. Plain objects are required.
  - The higher-level `McpServer.toolkit(Toolkit)` validates parameters itself and answers JSON-RPC `-32602`, which bypasses kernel `InvalidInput`. That is why it is rejected: errors would differ from the CLI and the Web interface (NFR-004).
  - `annotations` values on the `Tool` constructor were replaced by defaults when a `ToolAnnotations` class instance was passed. WP11 must pass a plain object and assert the listed annotations in its test. If the plain object is also ignored, the test documents the observed defaults, and the read-only status is carried in `_meta["telos/effect"]` instead.
- **Alternatives**: a hand-written JSON-RPC server, rejected because it rebuilds what Effect provides (directive §8). An in-process `Toolkit` only, rejected because no out-of-process agent could use it.

## R7 Command line

- **Decision**: commands are derived with `effect/cli`. There is one subcommand per exposed capability, and every input field is a `Flag.String(name).pipe(Flag.optional)`. Raw strings are coerced from the field's JSON Schema type (`number` → `Number(s)`, `integer` → `Number(s)`, `boolean` → `"true"`/`"false"`, otherwise the string) and passed to kernel `invoke`, so a non-numeric operand becomes kernel `InvalidInput`.
  - Output: success prints `JSON.stringify(output)` and a newline to stdout, with exit 0.
  - Failure prints `JSON.stringify(error)` and a newline to stderr, with exit 1 for a domain error and exit 2 for `InvalidInput`, `NotGranted`, `NotImplemented` or a usage error.
- **Evidence**: an in-memory runner (custom `Stdio` collecting chunks, `FileSystem.layerNoop({})`, `Path.layer`, a stub `Terminal` and `ChildProcessSpawner`) returned `{"code":0,"out":"{\"result\":5}\n"}` for `add --a 2 --b 3`. An unknown subcommand made `Command.runWith` fail, which maps to exit 2. Help text is printed through the Effect `Console` (process stdout), not through `Stdio`, so tests assert exit codes only for help.
- **Note**: `Flag.float` does not exist. The constructors are `Flag.String`, `Flag.Finite` and similar. `@effect/platform-bun` is not installed, so the Bun environment is assembled by hand (spec D-defaults, C-002).

## R8 GRACE layout for parallel work

- **Decision**: one graph document and one verification document per WP area, all created empty by WP01 (`<Owns />`). Each WP adds its modules only inside its own documents and its own `<Owns>` block of the two index files.
- **Evidence**: on a copy of the repository, `grace lint --path . --assertions current` accepted:
  - empty documents
  - a module whose `<Path>` does not yet exist
  - split graph documents
- It reported `projection.verification.missing-module-coverage` when a module had no `V-` entry, and `projection.verification.invalid-test-file` when a `<File>` did not exist. So a WP registers a module only together with its verification entry and existing test files.

## R9 Workspace linking

- **Decision**: Bun installs workspaces in isolated mode. The root has no `node_modules/@telos`, so the root `package.json` gains `dependencies` on the workspace packages it imports (`@telos/kernel`, `@telos/cli`, `@telos/calculator`) with `workspace:*`. This lets root `telos.ts` and `scripts/telos.ts` import them. Isolated mode also hides `effect` from root files, and `scripts/telos.ts` runs kernel Effects, so the root `package.json` also declares `"effect": "4.0.4"` (owner decision of 2026-10-24, analysis finding I1). The docs app gains `@telos/kernel`, `@telos/web` and `@telos/calculator`.
- **Rationale**: no external version changes. `effect` 4.0.4 is already pinned in `bun.lock`. The `bun.lock` changes contain workspace entries and the root `effect` entry only.

## R10 Empty TS projects

- **Decision**: a referenced composite project with no input files fails with TS18003. WP01 therefore gives every new package a `src/index.ts` entry module that later WPs fill in. Each new package's `test/tsconfig.json` includes `../src`, so it always has inputs.

## R11 Semantic Closure analysis

- **Decision**: file granularity. `Bun.Glob` matches `Source` globs. `new Bun.Transpiler({ loader: "ts" | "tsx" }).scanImports(code)` gives static import and export-from specifiers, plus `import()` calls with string literals. Specifiers are classified as:
  - relative → resolved to a file
  - `@telos/*` workspace package → resolved to that package's owning Locus
  - `node:` or `bun`/`bun:` → platform
  - other bare specifiers → external package name, the first segment or `@scope/name`
- **Evidence**: `scanImports` returned the following kinds. It **drops** type-only imports (`import type`, `export type`, and `import { type B }` when only types are imported) and **silently skips** `import(name)` with a computed specifier.
  - `import-statement`: imports and `export … from`
  - `dynamic-import`: `import()` with a literal specifier
  - `require-call`
- **Limits (documented)**:
  - Code inside a file is not attributed below file level.
  - Type-only dependencies are not seen.
  - Computed `import(...)` is found by a separate text scan, `/\bimport\s*\(\s*(?!["'`])/` or a template literal with an interpolation (`/\bimport\s*\(\s*`[^`]*\$\{/`), and reported as `closure.dynamic-import` (warning, `knowledge: "unknown"`). A template literal without `${` is returned by `scanImports` and resolved like a string literal.
  - Generated files and `node_modules` are excluded by the scope globs.

## R12 Supply chain

- **Decision**: no dependency is added, removed (except the workspace package `@telos/locus`) or upgraded. Directive 051 is satisfied by not changing third-party dependencies. No adversarial-squad pass is needed, because there is no security-impacting dependency decision.

## R13 Directive items mapped to design

| Directive item | Design element |
| --- | --- |
| §2 minimal Locus, `Locus.extend` | `Locus` base kind with zero extensions; `extend`, `make` |
| §2 conflict detection | `LocusKind.conflicts`, `composition.*` diagnostics |
| §3 typed, user-defined semantics | `RelationType.make` in any extension |
| §3 Semantic Closure | `@telos/kernel/closure`, `Source` and `External` extensions, repository gate |
| §4 Archetypes | `Archetype.make` with `appliesTo` extension ids; `verify` |
| §4/§5 declared vs verified | `knowledge` field on every description; `not-run` default |
| §6 introspection | `Telos` service, `resolve`, `LocusView` |
| §6 derived tools, information ≠ authority | agent Pack derives tools; `invoke` requires a granting relation |
| §7 Packs | `@telos/cli`, `@telos/agent`, `@telos/web` packages |
| §11 change impact | `diffModels`, `impact` |
| §12 living docs | inspector, verification report, playground |
| §13 future revisioning | digests and `diffModels` are the base; no history service |

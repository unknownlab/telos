# Contract: `@telos/kernel`

Package `packages/kernel`, name `@telos/kernel`. Dependency: `effect` 4.0.4 only. Export map (set by WP01):

```json
{ ".": "./src/index.ts", "./closure": "./src/closure.ts", "./package.json": "./package.json" }
```

The main entry (`src/index.ts` and everything it imports) must not import `bun`, `bun:*`, `node:*`, `effect/cli`, `effect/ai`, `effect/process`, React or any Pack. `src/closure.ts` is Bun-only and is not re-exported from the main entry.

All imports inside the kernel use relative paths without extension (`import { isLocusId } from "./identity"`). Types use `import type`.

---

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

---

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

## capability.ts (WP03)

```ts
export type EffectClass = "pure" | "read" | "write"
/** A TaggedError class schema with a `message: string` field, e.g. Schema.TaggedError<X>()("X", { message: Schema.String }). */
export type ErrorSchema = Schema.Codec<{ readonly _tag: string; readonly message: string }, any> & { readonly identifier: string }
export interface Capability<I = any, O = any, E = any> {
  readonly _tag: "Capability"
  readonly description: string
  readonly input: Schema.Codec<I, any>
  readonly output: Schema.Codec<O, any>
  readonly errors: ReadonlyArray<ErrorSchema>
  readonly effect: EffectClass
  readonly handler: ((input: I) => Effect.Effect<O, E>) | null
}
export const Capability: {
  make: <I, IE, O, OE, const Errs extends ReadonlyArray<ErrorSchema> = readonly []>(options: {
    readonly description: string
    readonly input: Schema.Codec<I, IE>
    readonly output: Schema.Codec<O, OE>
    readonly errors?: Errs
    readonly effect: EffectClass
    readonly handler: (input: I) => Effect.Effect<O, Errs[number]["Type"]>
  }) => Capability<I, O, Errs[number]["Type"]>
  /** A declared capability without implementation, used by decodeLocus; handler is null. */
  declare: (options: { readonly description: string; readonly input: Schema.Codec<any, any>; readonly output: Schema.Codec<any, any>; readonly errors?: ReadonlyArray<ErrorSchema>; readonly effect: EffectClass }) => Capability
}
export function errorTag(schema: ErrorSchema): string // schema.identifier
```

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

## locus.ts (WP03)

Copy these type helpers verbatim. They were type-checked in research R2.

```ts
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type FieldsOf<E> = E extends Extension<string, infer F> ? F : never
export type MergedFields<Es extends ReadonlyArray<Extension>> =
  [Es[number]] extends [never] ? {} :
  UnionToIntersection<FieldsOf<Es[number]>> extends infer I extends Schema.Struct.Fields ? I : {}
export type PropertiesOf<Es extends ReadonlyArray<Extension>> = Schema.Struct.Type<MergedFields<Es>>

export interface CompositionConflict {
  readonly code: "composition.extension-id-conflict" | "composition.property-conflict" | "composition.relation-type-conflict" | "composition.archetype-id-conflict"
  readonly subject: string                  // the conflicting extension id, property name, relation type id or archetype id
  readonly extensions: ReadonlyArray<string> // the two extension ids involved, in composition order
}

export interface LocusDefinition<Caps extends Record<string, Capability> = Record<string, Capability>> {
  readonly _tag: "Locus"
  readonly id: string
  readonly kind: LocusKind<ReadonlyArray<Extension>>
  readonly description: string | null
  readonly contains: ReadonlyArray<LocusDefinition>
  readonly relations: ReadonlyArray<Relation>
  readonly capabilities: Caps
  readonly properties: Readonly<Record<string, unknown>>   // decoded value, or the raw input when decoding failed
  readonly propertyIssues: ReadonlyArray<{ readonly path: ReadonlyArray<PropertyKey>; readonly message: string }>
  readonly capability: <K extends keyof Caps & string>(name: K) => CapabilityRef
}

export interface LocusKind<Es extends ReadonlyArray<Extension>> {
  readonly _tag: "LocusKind"
  readonly extensions: Es                       // deduplicated by object identity, composition order kept
  readonly conflicts: ReadonlyArray<CompositionConflict>
  readonly properties: Schema.Struct.Fields     // merged fields; first definition wins on conflict
  readonly relationTypes: ReadonlyArray<RelationType>   // all relation types of the extensions, first wins on id conflict
  readonly archetypes: ReadonlyArray<Archetype>         // all archetypes of the extensions, first wins on id conflict
  readonly extend: <const More extends ReadonlyArray<Extension>>(...more: More) => LocusKind<readonly [...Es, ...More]>
  readonly make: <const Caps extends Record<string, Capability> = {}>(definition: {
    readonly id: string
    readonly description?: string
    readonly contains?: ReadonlyArray<LocusDefinition<any>>
    readonly relations?: ReadonlyArray<Relation>
    readonly capabilities?: Caps
  } & ({} extends PropertiesOf<Es> ? { readonly properties?: PropertiesOf<Es> } : { readonly properties: PropertiesOf<Es> })) => LocusDefinition<Caps>
}

/** The universal Locus kind: no extensions. `Locus.make({ id })` is a complete Locus. */
export const Locus: LocusKind<readonly []>
```

Rules for `extend` and `make`:

- `extend` builds a new kind from `[...this.extensions, ...more]`. An extension object that is already present is skipped (no conflict). It then computes `conflicts` in composition order:
  1. A different extension object with an id already seen → `composition.extension-id-conflict` (subject = the id).
  2. For each property name of each extension: if an earlier *different* extension defined it → `composition.property-conflict` (subject = the property name).
  3. For each relation type: if a *different* RelationType object with the same id was seen → `composition.relation-type-conflict`.
  4. For each archetype: if a *different* Archetype object with the same id was seen → `composition.archetype-id-conflict`.
- `make` never throws:
  - It decodes `properties ?? {}` with `Schema.decodeUnknownExit(Schema.Struct(kind.properties))(raw, { errors: "all" })`.
  - On failure it keeps the raw value and fills `propertyIssues` from `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues`.
  - The result is frozen with `deepFreeze` (schemas and handlers are skipped).
  - Missing optional fields become `null` (`description`) or empty (`contains`, `relations`, `capabilities`).
- `definition.capability(name)` returns `CapabilityRef.make(definition.id, name)`.

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

---

## model.ts (WP04)

```ts
export interface ModelLocus {
  readonly definition: LocusDefinition
  readonly container: string | null
  readonly contains: ReadonlyArray<string>     // ids, sorted
  readonly depth: number                       // root = 0
}
export interface ModelRelation {
  readonly from: string
  readonly type: RelationType
  readonly target: RelationTarget
  readonly index: number                       // index in the source Locus's relations array
  readonly valid: boolean                      // false when any relation.* error was reported for it
}
export interface SemanticModel {
  readonly root: string
  readonly ids: ReadonlyArray<string>                       // all Locus ids, sorted (UTF-16)
  readonly loci: ReadonlyMap<string, ModelLocus>
  readonly relations: ReadonlyArray<ModelRelation>          // sorted by from, type.id, relationTargetKey(target), index
  readonly extensions: ReadonlyMap<string, Extension>       // first extension object seen per id, over all kinds
  readonly archetypes: ReadonlyMap<string, Archetype>       // first archetype object seen per id, over all kinds
  readonly diagnostics: ReadonlyArray<Diagnostic>           // sortDiagnostics output
}
export function buildModel(root: LocusDefinition): SemanticModel
export function incoming(model: SemanticModel, target: string): ReadonlyArray<ModelRelation>
// relations whose target.locus === target (Locus or capability targets), valid only, sorted as in model.relations
export function outgoing(model: SemanticModel, from: string): ReadonlyArray<ModelRelation>
export function ancestors(model: SemanticModel, id: string): ReadonlyArray<string> // nearest container first
export function hasErrors(model: SemanticModel): boolean  // any diagnostic with severity "error"
```

Algorithm:

1. Iterative depth-first traversal from `root`, visiting `contains` in array order, with a `Set` of visited objects.
   - A Locus object reached a second time gets `ownership.multiple` (subject = its id, members = [first container id, second container id]) and is not traversed again.
   - The first registration of an id wins. A different object with the same id gets `identity.duplicate` (members = []).
2. For every registered Locus:
   - `isLocusId` → `identity.malformed`.
   - Each kind conflict becomes a `composition.*` diagnostic (subject = Locus id, path = "kind", members = conflict.extensions, message names conflict.subject).
   - `propertyIssues` non-empty → one `property.invalid` (path = "properties", message lists the issues as `path: message` joined with "; ").
   - Each capability name failing `isCapabilityName` → `capability.name-malformed` (path = `capabilities/<name>`).
3. Relations, for each Locus and each relation index `i`, with path `relations/<i>`:
   - The type object is not in `kind.relationTypes` → `relation.type-unavailable`.
   - The target Locus is missing → `relation.target-missing`.
   - `type.target === "capability"` while `target.capability === null`, or the reverse → `relation.target-kind`.
   - The capability is missing on an existing target → `relation.capability-missing`.
   - `target.capability === null && target.locus === from` → `relation.self`.
   - The same `(type.id, relationTargetKey)` seen earlier on this Locus → `relation.duplicate` (warning; the relation is still valid).
4. Cycles:
   - For each relation type id with `acyclic: true`, build edges from valid relations of that type (Locus targets only) and call `elementaryCycles`.
   - Each cycle → `relation.cycle` (subject = first member, path = "relations", members = the cycle, message `"<type> cycle: a -> b -> a."`).
   - `exceeded` → one `relation.cycle-limit` (subject = root id, members = [type id]).
5. `model.extensions` and `model.archetypes` collect all kinds' extensions and archetypes (first per id).
6. Diagnostics go through `sortDiagnostics`. The model object is frozen (the maps are wrapped as read-only and never exposed for mutation).

---

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

## describe.ts (WP06)

```ts
export type Knowledge = "declared" | "derived" | "verified" | "failed" | "not-run" | "observed" | "unknown"
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

## introspection.ts (WP09)

```ts
export class LocusNotFound extends Schema.TaggedError<LocusNotFound>()("LocusNotFound", { id: Schema.String, message: Schema.String }) {}
export class CapabilityNotFound extends Schema.TaggedError<CapabilityNotFound>()("CapabilityNotFound", { ref: Schema.String, message: Schema.String }) {}
export interface LocusView {
  readonly id: string
  readonly inspect: () => Effect.Effect<LocusDescription>
  readonly relations: () => Effect.Effect<LocusDescription["relations"]>
  readonly capabilities: () => Effect.Effect<ReadonlyArray<CapabilityDescription>>
  readonly verifications: () => Effect.Effect<ReadonlyArray<VerificationDescription>>  // uses the latest report of this service, else not-run
}
export interface TelosApi {
  readonly model: SemanticModel
  readonly loci: () => Effect.Effect<ReadonlyArray<string>>                      // model.ids
  readonly resolve: (id: string) => Effect.Effect<LocusView, LocusNotFound>
  readonly describe: () => Effect.Effect<ModelDescription>
  readonly diagnostics: () => Effect.Effect<ReadonlyArray<Diagnostic>>
  readonly verify: (options: VerifyOptions) => Effect.Effect<VerificationReport>  // also stores it as the latest report (Ref)
  readonly impact: (target: string) => Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound>
  readonly invoke: (ref: CapabilityRef | string, input: unknown, options: InvokeOptions) => Effect.Effect<InvocationOutcome>
}
export class Telos extends Context.Service<Telos, TelosApi>()("@telos/kernel/Telos") {
  static readonly make: (root: LocusDefinition) => Effect.Effect<TelosApi>
  static readonly layer: (root: LocusDefinition) => Layer.Layer<Telos>
}
```

`LocusNotFound` message: `"No Locus <id> in the model."`.

## impact.ts (WP09)

```ts
export interface AffectedLocus {
  readonly locus: string
  readonly path: ReadonlyArray<{ readonly from: string; readonly type: string; readonly to: string }>  // shortest relation path, from the affected Locus toward the target
  readonly distance: number   // path length
}
export interface ImpactReport {
  readonly target: string                          // the Locus id or capability key analysed
  readonly affected: ReadonlyArray<AffectedLocus>  // sorted by distance then locus
  readonly checks: ReadonlyArray<{ readonly locus: string; readonly archetype: string; readonly rule: string; readonly method: RuleMethod }>
  // every rule of applicableArchetypes for the target Locus, every affected Locus, and every ancestor of those (archetypes of containers see their contents); deduplicated; sorted by locus, archetype, rule
  readonly knowledge: "derived"
}
export function impact(model: SemanticModel, target: string): ImpactReport
// target: a Locus id or "<locus>#<capability>"; callers validate existence first.
// Breadth-first over valid incoming relations. Level 0: relations targeting exactly the target
// (for a Locus target, also relations to any of its capabilities). Then relations targeting each affected Locus or its capabilities, transitively.
export type ModelChangeKind = "locus-added" | "locus-removed" | "contract-changed" | "capability-added" | "capability-removed" | "locus-changed"
export interface ModelChange {
  readonly kind: ModelChangeKind
  readonly locus: string
  readonly capability: string | null
  readonly patch: ReadonlyArray<JsonPatch.JsonPatchOperation>   // JsonPatch.get(before, after) of the compared descriptions; [] for added/removed
}
export const diffModels: (before: SemanticModel, after: SemanticModel) => Effect.Effect<ReadonlyArray<ModelChange>>
// compares describeModel outputs by id; for shared capabilities compares contractDigest (contract-changed with the patch of
// the two CapabilityDescriptions without exposedBy); for other differences in a shared Locus reports one locus-changed with the
// patch of the two descriptions with capabilities, digest, diagnostics removed; sorted by locus, capability ("" for null), kind
```

## index.ts (WP09) — the public API

`src/index.ts` re-exports exactly the following from the modules above. Nothing else is exported.

`LOCUS_ID_PATTERN, EXTENSION_ID_PATTERN, CAPABILITY_NAME_PATTERN, isLocusId, isExtensionId, isCapabilityName, capabilityKey, parseCapabilityKey, canonicalJson, jsonEqual, digestOf, Digest, Diagnostic, DiagnosticCode, Severity, compareDiagnostics, RelationType, Relation, RelationTarget, CapabilityRef, relationTargetKey, Capability, EffectClass, ErrorSchema, errorTag, Extension, Archetype, Rule, RuleViolation, RuleContext, RuleMethod, violation, Locus, LocusKind, LocusDefinition, CompositionConflict, MergedFields, PropertiesOf, Purpose, Source, SourceDependsOn, External, SemanticModel, ModelLocus, ModelRelation, buildModel, incoming, outgoing, ancestors, hasErrors, verify, applicableArchetypes, VerifyOptions, VerificationReport, Finding, Outcome, Provenance, Knowledge, JsonSchemaDocument, toJsonSchema, describeLocus, describeModel, describeCapability, describeVerifications, LocusDescription, ModelDescription, CapabilityDescription, RelationDescription, VerificationDescription, invoke, isGranted, InvocationOutcome, InvocationError, InvocationIssue, InvokeOptions, inputFields, coerceInput, InputField, InputFieldType, decodeLocus, decodeLocusText, LocusJson, LocusJsonSchema, DecodeResult, DecodeIssue, ExtensionRegistry, FieldType, Telos, TelosApi, LocusView, LocusNotFound, CapabilityNotFound, impact, ImpactReport, AffectedLocus, diffModels, ModelChange, ModelChangeKind`

`deepFreeze`, `sortKeys`, `makeDiagnostic`, `sortDiagnostics`, `SEVERITY`, `elementaryCycles` and `MAX_CYCLES` stay internal.

---

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

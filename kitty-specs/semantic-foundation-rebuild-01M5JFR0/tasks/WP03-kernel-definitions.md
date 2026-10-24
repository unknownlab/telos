---
work_package_id: WP03
title: 'Kernel definitions: relation types, capabilities, Archetypes, extensions, Locus'
dependencies:
- WP02
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-006
- FR-007
- FR-009
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
- T016
- T017
- T018
phase: Phase 2 – Kernel
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/src/
create_intent:
- packages/kernel/src/relation.ts
- packages/kernel/src/capability.ts
- packages/kernel/src/archetype.ts
- packages/kernel/src/extension.ts
- packages/kernel/src/locus.ts
- packages/kernel/src/extensions/purpose.ts
- packages/kernel/src/extensions/source.ts
- packages/kernel/test/relation.test.ts
- packages/kernel/test/capability.test.ts
- packages/kernel/test/archetype.test.ts
- packages/kernel/test/extension.test.ts
- packages/kernel/test/locus.test.ts
- packages/kernel/test/extensions.test.ts
- packages/kernel/test/types.test.ts
- .grace/graph/kernel-definitions.xml
- .grace/verification/kernel-definitions.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/kernel/src/relation.ts
- packages/kernel/src/capability.ts
- packages/kernel/src/archetype.ts
- packages/kernel/src/extension.ts
- packages/kernel/src/locus.ts
- packages/kernel/src/extensions/purpose.ts
- packages/kernel/src/extensions/source.ts
- packages/kernel/test/relation.test.ts
- packages/kernel/test/capability.test.ts
- packages/kernel/test/archetype.test.ts
- packages/kernel/test/extension.test.ts
- packages/kernel/test/locus.test.ts
- packages/kernel/test/extensions.test.ts
- packages/kernel/test/types.test.ts
- .grace/graph/kernel-definitions.xml
- .grace/verification/kernel-definitions.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Kernel definitions: relation types, capabilities, Archetypes, extensions, Locus

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

Create the definition API of `@telos/kernel`: relation types, capabilities, Archetypes, extensions, Locus kinds and the two built-in extension files. Every file is new. The code below was written and type-checked while planning; copy it, add the GRACE markup, format it, and test it. Do not simplify the type helpers in `locus.ts`.

`src/index.ts` stays `export {};` (WP09 writes it). Tests import modules by relative path, for example `import { Locus } from "../src/locus";`.

## Context

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

The three model interfaces that `archetype.ts` imports as types (you create `model.ts` with exactly this, and nothing else; WP04 owns the file and adds the functions and the GRACE markup):

```ts
import type { Archetype } from "./archetype";
import type { Diagnostic } from "./diagnostic";
import type { Extension } from "./extension";
import type { LocusDefinition } from "./locus";
import type { RelationTarget, RelationType } from "./relation";

export interface ModelLocus {
  readonly definition: LocusDefinition;
  readonly container: string | null;
  readonly contains: ReadonlyArray<string>;
  readonly depth: number;
}
export interface ModelRelation {
  readonly from: string;
  readonly type: RelationType;
  readonly target: RelationTarget;
  readonly index: number;
  readonly valid: boolean;
}
export interface SemanticModel {
  readonly root: string;
  readonly ids: ReadonlyArray<string>;
  readonly loci: ReadonlyMap<string, ModelLocus>;
  readonly relations: ReadonlyArray<ModelRelation>;
  readonly extensions: ReadonlyMap<string, Extension>;
  readonly archetypes: ReadonlyMap<string, Archetype>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}
```

### Prototype code (type-checked; copy it, then add GRACE markup and run `bun run format`)

`packages/kernel/src/relation.ts`:

```ts
import { capabilityKey, parseCapabilityKey } from "./identity";
export interface RelationTarget { readonly locus: string; readonly capability: string | null; }
export interface CapabilityRef { readonly _tag: "CapabilityRef"; readonly locus: string; readonly capability: string; }
export const CapabilityRef = {
  make: (locus: string, capability: string): CapabilityRef => Object.freeze({ _tag: "CapabilityRef", locus, capability }),
};
export interface RelationType<Id extends string = string> {
  readonly _tag: "RelationType";
  readonly id: Id;
  readonly description: string;
  readonly target: "locus" | "capability";
  readonly acyclic: boolean;
  readonly grantsInvocation: boolean;
  readonly to: (target: { readonly id: string } | CapabilityRef | string) => Relation;
}
export interface Relation { readonly type: RelationType; readonly target: RelationTarget; }
function targetOf(target: { readonly id: string } | CapabilityRef | string): RelationTarget {
  if (typeof target === "string") {
    const parsed = target.includes("#") ? parseCapabilityKey(target) : null;
    return parsed === null ? { locus: target, capability: null } : { locus: parsed.locus, capability: parsed.capability };
  }
  if ("_tag" in target && target._tag === "CapabilityRef") return { locus: target.locus, capability: target.capability };
  return { locus: (target as { readonly id: string }).id, capability: null };
}
export const RelationType = {
  make: <const Id extends string>(id: Id, options: { readonly description: string; readonly target: "locus" | "capability"; readonly acyclic?: boolean; readonly grantsInvocation?: boolean }): RelationType<Id> => {
    const type: RelationType<Id> = Object.freeze({
      _tag: "RelationType", id, description: options.description, target: options.target,
      acyclic: options.acyclic ?? false, grantsInvocation: options.grantsInvocation ?? false,
      to: (target: { readonly id: string } | CapabilityRef | string): Relation => Object.freeze({ type, target: Object.freeze(targetOf(target)) }),
    });
    return type;
  },
};
export function relationTargetKey(target: RelationTarget): string { return target.capability === null ? target.locus : capabilityKey(target.locus, target.capability); }
```

`packages/kernel/src/capability.ts`:

```ts
import type { Effect, Schema } from "effect";
export type EffectClass = "pure" | "read" | "write";
export type ErrorSchema = Schema.Codec<{ readonly _tag: string; readonly message: string }, any> & { readonly identifier: string };
export interface Capability<I = any, O = any, E = any> {
  readonly _tag: "Capability";
  readonly description: string;
  readonly input: Schema.Codec<I, any>;
  readonly output: Schema.Codec<O, any>;
  readonly errors: ReadonlyArray<ErrorSchema>;
  readonly effect: EffectClass;
  readonly handler: ((input: I) => Effect.Effect<O, E>) | null;
}
export const Capability = {
  make: <I, IE, O, OE, const Errs extends ReadonlyArray<ErrorSchema> = readonly []>(options: {
    readonly description: string; readonly input: Schema.Codec<I, IE>; readonly output: Schema.Codec<O, OE>;
    readonly errors?: Errs; readonly effect: EffectClass;
    readonly handler: (input: I) => Effect.Effect<O, Errs[number]["Type"]>;
  }): Capability<I, O, Errs[number]["Type"]> => Object.freeze({
    _tag: "Capability", description: options.description, input: options.input, output: options.output,
    errors: options.errors ?? [], effect: options.effect, handler: options.handler,
  }),
  declare: (options: { readonly description: string; readonly input: Schema.Codec<any, any>; readonly output: Schema.Codec<any, any>; readonly errors?: ReadonlyArray<ErrorSchema>; readonly effect: EffectClass }): Capability => Object.freeze({
    _tag: "Capability", description: options.description, input: options.input, output: options.output,
    errors: options.errors ?? [], effect: options.effect, handler: null,
  }),
};
export function errorTag(schema: ErrorSchema): string { return schema.identifier; }
```

`packages/kernel/src/archetype.ts`:

```ts
import { Effect, Schema } from "effect";
import type { LocusDefinition } from "./locus";
import type { SemanticModel } from "./model";
export class RuleViolation extends Schema.TaggedError<RuleViolation>()("RuleViolation", { message: Schema.String }) {}
export type RuleMethod = "static" | "execution";
export interface RuleContext { readonly locus: LocusDefinition; readonly model: SemanticModel; }
export interface Rule { readonly id: string; readonly description: string; readonly method: RuleMethod; readonly check: (ctx: RuleContext) => Effect.Effect<void, RuleViolation>; }
export interface Archetype { readonly _tag: "Archetype"; readonly id: string; readonly description: string; readonly appliesTo: ReadonlyArray<string>; readonly rules: ReadonlyArray<Rule>; }
export const Rule = { make: (rule: Rule): Rule => Object.freeze({ ...rule }) };
export const Archetype = { make: (options: Omit<Archetype, "_tag">): Archetype => Object.freeze({ _tag: "Archetype", ...options }) };
export const violation = (message: string): Effect.Effect<never, RuleViolation> => Effect.fail(new RuleViolation({ message }));
```

`packages/kernel/src/extension.ts`:

```ts
import type { Schema } from "effect";
import type { Archetype } from "./archetype";
import type { RelationType } from "./relation";
export interface Extension<Id extends string = string, F extends Schema.Struct.Fields = Schema.Struct.Fields> {
  readonly _tag: "Extension"; readonly id: Id; readonly description: string; readonly properties: F;
  readonly relationTypes: ReadonlyArray<RelationType>; readonly archetypes: ReadonlyArray<Archetype>;
}
export const Extension = {
  make: <const Id extends string, const F extends Schema.Struct.Fields = {}>(id: Id, options: {
    readonly description: string; readonly properties?: F; readonly relationTypes?: ReadonlyArray<RelationType>; readonly archetypes?: ReadonlyArray<Archetype>;
  }): Extension<Id, F> => Object.freeze({
    _tag: "Extension", id, description: options.description, properties: options.properties ?? ({} as F),
    relationTypes: options.relationTypes ?? [], archetypes: options.archetypes ?? [],
  }),
};
```

`packages/kernel/src/locus.ts` (the `make` path never throws; `compose` records conflicts in composition order; `extend` skips extension objects already present):

```ts
import { Exit, Schema, SchemaIssue, Cause, Option } from "effect";
import type { Archetype } from "./archetype";
import type { Capability } from "./capability";
import type { Extension } from "./extension";
import { deepFreeze } from "./freeze";
import { CapabilityRef, type Relation, type RelationType } from "./relation";

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type FieldsOf<E> = E extends Extension<string, infer F> ? F : never;
export type MergedFields<Es extends ReadonlyArray<Extension>> =
  [Es[number]] extends [never] ? {} :
  UnionToIntersection<FieldsOf<Es[number]>> extends infer I extends Schema.Struct.Fields ? I : {};
export type PropertiesOf<Es extends ReadonlyArray<Extension>> = Schema.Struct.Type<MergedFields<Es>>;

export interface CompositionConflict {
  readonly code: "composition.extension-id-conflict" | "composition.property-conflict" | "composition.relation-type-conflict" | "composition.archetype-id-conflict";
  readonly subject: string;
  readonly extensions: ReadonlyArray<string>;
}

export interface LocusDefinition<Caps extends Record<string, Capability> = Record<string, Capability>> {
  readonly _tag: "Locus";
  readonly id: string;
  readonly kind: LocusKind<ReadonlyArray<Extension>>;
  readonly description: string | null;
  readonly contains: ReadonlyArray<LocusDefinition>;
  readonly relations: ReadonlyArray<Relation>;
  readonly capabilities: Caps;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly propertyIssues: ReadonlyArray<{ readonly path: ReadonlyArray<PropertyKey>; readonly message: string }>;
  readonly capability: <K extends keyof Caps & string>(name: K) => CapabilityRef;
}

export interface LocusKind<Es extends ReadonlyArray<Extension>> {
  readonly _tag: "LocusKind";
  readonly extensions: Es;
  readonly conflicts: ReadonlyArray<CompositionConflict>;
  readonly properties: Schema.Struct.Fields;
  readonly relationTypes: ReadonlyArray<RelationType>;
  readonly archetypes: ReadonlyArray<Archetype>;
  readonly extend: <const More extends ReadonlyArray<Extension>>(...more: More) => LocusKind<readonly [...Es, ...More]>;
  readonly make: <const Caps extends Record<string, Capability> = {}>(definition: {
    readonly id: string;
    readonly description?: string;
    readonly contains?: ReadonlyArray<LocusDefinition<any>>;
    readonly relations?: ReadonlyArray<Relation>;
    readonly capabilities?: Caps;
  } & ({} extends PropertiesOf<Es> ? { readonly properties?: PropertiesOf<Es> } : { readonly properties: PropertiesOf<Es> })) => LocusDefinition<Caps>;
}

interface RawDefinition {
  readonly id: string;
  readonly description?: string;
  readonly contains?: ReadonlyArray<LocusDefinition<any>>;
  readonly relations?: ReadonlyArray<Relation>;
  readonly capabilities?: Record<string, Capability>;
  readonly properties?: unknown;
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

function compose(extensions: ReadonlyArray<Extension>): LocusKind<ReadonlyArray<Extension>> {
  const conflicts: CompositionConflict[] = [];
  const byId = new Map<string, Extension>();
  const propertyOwner = new Map<string, Extension>();
  const properties: { [name: string]: Schema.Struct.Fields[string] } = {};
  const relationTypes = new Map<string, { readonly type: RelationType; readonly owner: Extension }>();
  const archetypes = new Map<string, { readonly archetype: Archetype; readonly owner: Extension }>();
  for (const extension of extensions) {
    const seen = byId.get(extension.id);
    if (seen === undefined) byId.set(extension.id, extension);
    else conflicts.push({ code: "composition.extension-id-conflict", subject: extension.id, extensions: [seen.id, extension.id] });
    for (const [name, schema] of Object.entries(extension.properties)) {
      const owner = propertyOwner.get(name);
      if (owner === undefined) { propertyOwner.set(name, extension); properties[name] = schema; }
      else if (owner !== extension) conflicts.push({ code: "composition.property-conflict", subject: name, extensions: [owner.id, extension.id] });
    }
    for (const type of extension.relationTypes) {
      const entry = relationTypes.get(type.id);
      if (entry === undefined) relationTypes.set(type.id, { type, owner: extension });
      else if (entry.type !== type) conflicts.push({ code: "composition.relation-type-conflict", subject: type.id, extensions: [entry.owner.id, extension.id] });
    }
    for (const archetype of extension.archetypes) {
      const entry = archetypes.get(archetype.id);
      if (entry === undefined) archetypes.set(archetype.id, { archetype, owner: extension });
      else if (entry.archetype !== archetype) conflicts.push({ code: "composition.archetype-id-conflict", subject: archetype.id, extensions: [entry.owner.id, extension.id] });
    }
  }
  const kind: LocusKind<ReadonlyArray<Extension>> = {
    _tag: "LocusKind",
    extensions: Object.freeze([...extensions]),
    conflicts: deepFreeze(conflicts),
    properties: Object.freeze(properties),
    relationTypes: Object.freeze([...relationTypes.values()].map((entry) => entry.type)),
    archetypes: Object.freeze([...archetypes.values()].map((entry) => entry.archetype)),
    extend: ((...more: ReadonlyArray<Extension>) => {
      const next = [...extensions];
      for (const extension of more) if (!next.includes(extension)) next.push(extension);
      return compose(next);
    }) as LocusKind<ReadonlyArray<Extension>>["extend"],
    make: ((definition: RawDefinition) => makeLocus(kind, definition)) as LocusKind<ReadonlyArray<Extension>>["make"],
  };
  return Object.freeze(kind);
}

function makeLocus(kind: LocusKind<ReadonlyArray<Extension>>, definition: RawDefinition): LocusDefinition {
  const raw = definition.properties ?? {};
  const schema = Schema.Struct(kind.properties) as unknown as Schema.Codec<Record<string, unknown>, unknown>;
  const exit = Schema.decodeUnknownExit(schema)(raw, { errors: "all" });
  let properties: Readonly<Record<string, unknown>> = raw as Readonly<Record<string, unknown>>;
  let propertyIssues: LocusDefinition["propertyIssues"] = [];
  if (Exit.isSuccess(exit)) properties = exit.value as Readonly<Record<string, unknown>>;
  else {
    const error = Cause.findErrorOption(exit.cause);
    propertyIssues = Option.isSome(error)
      ? formatIssues(error.value.issue).issues.map((issue) => ({ path: (issue.path ?? []).map((p) => (typeof p === "object" ? p.key : p)), message: issue.message }))
      : [{ path: [], message: String(Cause.squash(exit.cause)) }];
  }
  const id = definition.id;
  return deepFreeze({
    _tag: "Locus" as const,
    id,
    kind,
    description: definition.description ?? null,
    contains: [...(definition.contains ?? [])],
    relations: [...(definition.relations ?? [])],
    capabilities: { ...(definition.capabilities ?? {}) },
    properties,
    propertyIssues,
    capability: (name: string) => CapabilityRef.make(id, name),
  });
}

/** The universal Locus kind: no extensions. */
export const Locus: LocusKind<readonly []> = compose([]) as unknown as LocusKind<readonly []>;
```

`packages/kernel/src/extensions/purpose.ts`:

```ts
import { Schema } from "effect";
import { Extension } from "../extension";
export const Purpose = Extension.make("telos.purpose", {
  description: "States why a Locus exists, what it is responsible for and what it explicitly excludes.",
  properties: { purpose: Schema.String, responsibilities: Schema.optionalKey(Schema.Array(Schema.String)), excluded: Schema.optionalKey(Schema.Array(Schema.String)) },
});
```

`packages/kernel/src/extensions/source.ts`:

```ts
import { Schema } from "effect";
import { Extension } from "../extension";
import { RelationType } from "../relation";
export const SourceDependsOn = RelationType.make("source.depends-on", { description: "The source files of this Locus import code owned by the target Locus.", target: "locus" });
export const Source = Extension.make("telos.source", { description: "Claims source files for a Locus by repository-relative glob patterns.", properties: { sources: Schema.Array(Schema.String) }, relationTypes: [SourceDependsOn] });
export const External = Extension.make("telos.external", { description: "Declares third-party packages this Locus may import, without modelling their internals.", properties: { packages: Schema.Array(Schema.String) } });
```

Behaviour confirmed while planning (effect 4.0.4): decoding `{ purpose: 3 }` against Purpose gives one issue with path `["purpose"]` and message `Expected string`; a missing key gives `Missing key`; `Object.isFrozen(Schema.Struct({ a: Schema.String }))` is `false` before and after `deepFreeze` of a Locus that holds it.

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

- Create `packages/kernel/src/model.ts` containing only the three interfaces `ModelLocus`, `ModelRelation` and `SemanticModel` exactly as in the model.ts contract (WP04 owns the file and adds the functions).

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP03 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T012 – Failing tests

Create these files with GRACE test markup. Every listed test is required.

`packages/kernel/test/relation.test.ts`
- `RelationType.make("a.b", { description: "d", target: "locus" })` has `acyclic: false`, `grantsInvocation: false`, `_tag: "RelationType"`, and is frozen.
- `type.to({ id: "x:y" })` gives target `{ locus: "x:y", capability: null }`; `type.to(CapabilityRef.make("x:y", "add"))` gives `{ locus: "x:y", capability: "add" }`; `type.to("x:y#add")` gives the same; `type.to("x:y")` gives `{ locus: "x:y", capability: null }`.
- The relation and its target are frozen; `relation.type` is the same object as the type.
- `relationTargetKey({ locus: "x:y", capability: null })` is `"x:y"`; with capability `"add"` it is `"x:y#add"`.

`packages/kernel/test/capability.test.ts`
- `Capability.make` keeps description, input, output, effect and handler; `errors` defaults to `[]`; the object is frozen.
- `Capability.declare` gives `handler: null`.
- `errorTag(E1)` is `"E1"` for `class E1 extends Schema.TaggedError<E1>()("E1", { message: Schema.String }) {}`.

`packages/kernel/test/archetype.test.ts`
- `Rule.make` and `Archetype.make` return frozen objects; `Archetype.make(...)._tag` is `"Archetype"`.
- `const exit = Effect.runSyncExit(violation("bad"))` is a failure; `Cause.findErrorOption(exit.cause)` (when `Exit.isFailure(exit)`) is `Some` of a `RuleViolation` with `_tag: "RuleViolation"` and `message: "bad"` (imports `Cause`, `Effect`, `Exit`, `Option` from `effect`).

`packages/kernel/test/extension.test.ts`
- `Extension.make("x.y", { description: "d" })` has `properties` `{}`, `relationTypes` `[]`, `archetypes` `[]`, `_tag: "Extension"`, and is frozen.

`packages/kernel/test/locus.test.ts` (one test per behaviour; the names name the behaviour or the conflict code)
- Minimality: `Locus.make({ id: "app:a" })` has `description: null`, `contains: []`, `relations: []`, `capabilities: {}`, `properties: {}`, `propertyIssues: []`, `kind.extensions: []`, and is deep-frozen (`Object.isFrozen` on the Locus, `contains`, `relations`, `properties`).
- Two extensions composed: `Locus.extend(Purpose, Source).make({ id: "app:a", properties: { purpose: "p", sources: ["a/**"] } })` has both extension ids in order and decoded properties; `conflicts` is `[]`.
- `extend` skips the same object: `Locus.extend(Purpose, Purpose).extensions.length` is 1 and `conflicts` is `[]`; `Locus.extend(Purpose).extend(Purpose)` likewise.
- `composition.extension-id-conflict`: a different extension object with id `telos.purpose` gives `{ code: "composition.extension-id-conflict", subject: "telos.purpose", extensions: ["telos.purpose", "telos.purpose"] }`.
- `composition.property-conflict`: `Extension.make("other.purpose", { description: "d", properties: { purpose: Schema.String } })` composed after Purpose gives `{ code: "composition.property-conflict", subject: "purpose", extensions: ["telos.purpose", "other.purpose"] }`, and `kind.properties.purpose` is Purpose's schema (first wins).
- `composition.relation-type-conflict`: two different `RelationType.make("x.rel", ...)` objects in two extensions → conflict with subject `"x.rel"`; the same RelationType object in two extensions → no conflict.
- `composition.archetype-id-conflict`: same as above with two different `Archetype.make({ id: "x.arch", ... })` objects; the same object in two extensions → no conflict.
- Invalid properties do not throw: `Locus.extend(Purpose).make({ id: "app:x", properties: { purpose: 3 } as never })` keeps `properties` `{ purpose: 3 }` and has `propertyIssues` `[{ path: ["purpose"], message: "Expected string" }]`.
- Schemas and handlers stay unfrozen: a Locus with a capability keeps `Object.isFrozen(capability.input) === false`.
- `definition.capability("add")` returns `{ _tag: "CapabilityRef", locus: <id>, capability: "add" }`.

`packages/kernel/test/extensions.test.ts`
- `Purpose.id` is `"telos.purpose"` and its description is exactly the contract sentence; `responsibilities` and `excluded` are optional (a Locus with only `purpose` has no issues).
- `Source.id` is `"telos.source"`, its `relationTypes` is `[SourceDependsOn]`; `SourceDependsOn.id` is `"source.depends-on"`, target `"locus"`, `acyclic: false`, `grantsInvocation: false`.
- `External.id` is `"telos.external"`; a Locus of `Locus.extend(External)` without `packages` has a property issue.

Run `bun test packages/kernel/test` and see the new tests fail.

### T013 – `relation.ts` and `capability.ts`

Copy the prototypes, add GRACE markup (module header with every export in the map, a contract block above each exported value), run `bun run format`.

### T014 – `archetype.ts`, `extension.ts`, `model.ts` bootstrap

Copy the prototypes. Write `model.ts` exactly as quoted in Context (types only, no GRACE markup; WP04 adds it). `archetype.ts` imports `LocusDefinition` and `SemanticModel` with `import type` only.

### T015 – `locus.ts`

Copy the prototype. It imports `deepFreeze` from `./freeze` (WP02). Keep `UnionToIntersection`, `FieldsOf`, `MergedFields`, `PropertiesOf` and the `make` parameter type exactly.

### T016 – Built-in extensions

Copy `extensions/purpose.ts` and `extensions/source.ts`. They import from `../extension` and `../relation`.

### T017 – `types.test.ts` (compile-time checks that also run)

Create `packages/kernel/test/types.test.ts` with this content (add nothing that removes an `@ts-expect-error`; `bun run typecheck` fails if a directive becomes unused, which is the point of the test):

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that composed Locus kinds type their properties, capability names and handler errors at compile time.
//   SCOPE: Each @ts-expect-error line is checked by bun run typecheck; each call also runs and its run-time result is asserted.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: V-M-KERNEL-DEFINITIONS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   E1 - a tagged error that the test capabilities may or may not declare
//   operands - the input schema shared by the test capabilities
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability } from "../src/capability";
import { Purpose } from "../src/extensions/purpose";
import { Source, SourceDependsOn } from "../src/extensions/source";
import { Locus } from "../src/locus";

class E1 extends Schema.TaggedError<E1>()("E1", { message: Schema.String }) {}
const operands = Schema.Struct({ x: Schema.Finite });

describe("compile-time composition", () => {
  test("a required property is enforced by the type and reported at run time", () => {
    const P = Locus.extend(Purpose);
    // @ts-expect-error purpose is required
    const missing = P.make({ id: "app:c" });
    expect(missing.propertyIssues.length).toBeGreaterThan(0);
    // @ts-expect-error purpose must be a string
    const wrong = P.make({ id: "app:c", properties: { purpose: 1 } });
    expect(wrong.propertyIssues.length).toBeGreaterThan(0);
    const ok = P.make({ id: "app:b", properties: { purpose: "x" } });
    expect(ok.propertyIssues).toEqual([]);
  });

  test("a composed kind requires the properties of every extension", () => {
    const a = Locus.make({ id: "app:a" });
    const PS = Locus.extend(Purpose, Source);
    const d = PS.make({
      id: "app:d",
      properties: { purpose: "x", sources: ["a/**"] },
      relations: [SourceDependsOn.to(a)],
    });
    expect(d.propertyIssues).toEqual([]);
    // @ts-expect-error sources is required
    const noSources = PS.make({ id: "app:d", properties: { purpose: "x" } });
    expect(noSources.propertyIssues.length).toBeGreaterThan(0);
  });

  test("capability names are typed", () => {
    const cap = Capability.make({
      description: "d",
      input: operands,
      output: Schema.Finite,
      errors: [E1],
      effect: "pure",
      handler: ({ x }) => (x > 0 ? Effect.succeed(x) : Effect.fail(new E1({ message: "neg" }))),
    });
    const c = Locus.make({ id: "app:c", capabilities: { add: cap } });
    expect(c.capability("add").capability).toBe("add");
    // @ts-expect-error sub is not a capability of app:c
    const sub = c.capability("sub");
    expect(sub.capability).toBe("sub");
  });

  test("a handler may fail only with declared errors", () => {
    const cap = Capability.make({
      description: "d",
      input: operands,
      output: Schema.Finite,
      effect: "pure",
      // @ts-expect-error E1 is not declared in errors
      handler: () => Effect.fail(new E1({ message: "m" })),
    });
    expect(cap.errors).toEqual([]);
  });
});
```

If `bun run format` moves an `@ts-expect-error` away from its line, restore it above the exact line that has the type error and keep the line short.

**Acceptance**: `bun test packages/kernel/test/types.test.ts` passes and `bun run typecheck` passes.

### T018 – GRACE

Area `kernel-definitions`. Register `M-KERNEL-DEFINITIONS` with seven `<Path>` elements (`relation.ts`, `capability.ts`, `archetype.ts`, `extension.ts`, `locus.ts`, `extensions/purpose.ts`, `extensions/source.ts`, all under `packages/kernel/src/`) and the dependency children `<M-KERNEL-IDENTITY />`. Its verification entry `V-M-KERNEL-DEFINITIONS` lists the seven test files of this WP and runs them in one `<Command>`. Update your `GD-KERNEL-DEFINITIONS` / `VD-KERNEL-DEFINITIONS` index blocks. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP03 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- The type helpers are subtle; any edit to `MergedFields`, `PropertiesOf` or the `make` parameter type can make `types.test.ts` fail. Copy them unchanged.
- `bun run format` may reflow the long prototype lines; that is expected.
- `model.ts` holds types only in this WP. Do not add functions to it.

## Reviewer guidance

- Compare each file with the quoted prototype and the contract; check the four conflict codes are each tested with a positive and a negative case.
- Check `types.test.ts` keeps all five `@ts-expect-error` lines and that `bun run typecheck` passes.
- Check `model.ts` contains only the three interfaces.

// START_MODULE_CONTRACT
//   PURPOSE: Define Locus kinds that compose extensions with conflict reporting, and build frozen Locus definitions that never throw.
//   SCOPE: The Locus kind and definition types, the composition rules, the type helpers that merge extension properties, and the universal Locus kind. Out: relation target validation and model building.
//   DEPENDS: M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MergedFields - the merged property fields of a list of extensions
//   PropertiesOf - the decoded property type of a list of extensions
//   CompositionConflict - one conflict found while composing extensions
//   LocusDefinition - a frozen Locus with its kind, parts, decoded properties and capability references
//   LocusKind - a composed set of extensions that makes Locus definitions
//   Locus - the universal Locus kind with no extensions
// END_MODULE_MAP

import { Cause, Exit, Option, Schema, SchemaIssue } from "effect";
import type { Archetype } from "./archetype";
import type { Capability } from "./capability";
import type { Extension } from "./extension";
import { deepFreeze } from "./freeze";
import { CapabilityRef, type Relation, type RelationType } from "./relation";

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
type FieldsOf<E> = E extends Extension<string, infer F> ? F : never;
export type MergedFields<Es extends ReadonlyArray<Extension>> = [
  Es[number],
] extends [never]
  ? {}
  : UnionToIntersection<FieldsOf<Es[number]>> extends infer I extends
        Schema.Struct.Fields
    ? I
    : {};
export type PropertiesOf<Es extends ReadonlyArray<Extension>> =
  Schema.Struct.Type<MergedFields<Es>>;

export interface CompositionConflict {
  readonly code:
    | "composition.extension-id-conflict"
    | "composition.property-conflict"
    | "composition.relation-type-conflict"
    | "composition.archetype-id-conflict";
  readonly subject: string;
  readonly extensions: ReadonlyArray<string>;
}

export interface LocusDefinition<
  Caps extends Record<string, Capability> = Record<string, Capability>,
> {
  readonly _tag: "Locus";
  readonly id: string;
  readonly kind: LocusKind<ReadonlyArray<Extension>>;
  readonly description: string | null;
  readonly contains: ReadonlyArray<LocusDefinition>;
  readonly relations: ReadonlyArray<Relation>;
  readonly capabilities: Caps;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly propertyIssues: ReadonlyArray<{
    readonly path: ReadonlyArray<PropertyKey>;
    readonly message: string;
  }>;
  readonly capability: <K extends keyof Caps & string>(
    name: K,
  ) => CapabilityRef;
}

export interface LocusKind<Es extends ReadonlyArray<Extension>> {
  readonly _tag: "LocusKind";
  readonly extensions: Es;
  readonly conflicts: ReadonlyArray<CompositionConflict>;
  readonly properties: Schema.Struct.Fields;
  readonly relationTypes: ReadonlyArray<RelationType>;
  readonly archetypes: ReadonlyArray<Archetype>;
  readonly extend: <const More extends ReadonlyArray<Extension>>(
    ...more: More
  ) => LocusKind<readonly [...Es, ...More]>;
  readonly make: <const Caps extends Record<string, Capability> = {}>(
    definition: {
      readonly id: string;
      readonly description?: string;
      readonly contains?: ReadonlyArray<LocusDefinition<any>>;
      readonly relations?: ReadonlyArray<Relation>;
      readonly capabilities?: Caps;
    } & ({} extends PropertiesOf<Es>
      ? { readonly properties?: PropertiesOf<Es> }
      : { readonly properties: PropertiesOf<Es> }),
  ) => LocusDefinition<Caps>;
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

function compose(
  extensions: ReadonlyArray<Extension>,
): LocusKind<ReadonlyArray<Extension>> {
  const conflicts: CompositionConflict[] = [];
  const byId = new Map<string, Extension>();
  const propertyOwner = new Map<string, Extension>();
  const properties: { [name: string]: Schema.Struct.Fields[string] } = {};
  const relationTypes = new Map<
    string,
    { readonly type: RelationType; readonly owner: Extension }
  >();
  const archetypes = new Map<
    string,
    { readonly archetype: Archetype; readonly owner: Extension }
  >();
  for (const extension of extensions) {
    const seen = byId.get(extension.id);
    if (seen === undefined) byId.set(extension.id, extension);
    else
      conflicts.push({
        code: "composition.extension-id-conflict",
        subject: extension.id,
        extensions: [seen.id, extension.id],
      });
    for (const [name, schema] of Object.entries(extension.properties)) {
      const owner = propertyOwner.get(name);
      if (owner === undefined) {
        propertyOwner.set(name, extension);
        properties[name] = schema;
      } else if (owner !== extension)
        conflicts.push({
          code: "composition.property-conflict",
          subject: name,
          extensions: [owner.id, extension.id],
        });
    }
    for (const type of extension.relationTypes) {
      const entry = relationTypes.get(type.id);
      if (entry === undefined)
        relationTypes.set(type.id, { type, owner: extension });
      else if (entry.type !== type)
        conflicts.push({
          code: "composition.relation-type-conflict",
          subject: type.id,
          extensions: [entry.owner.id, extension.id],
        });
    }
    for (const archetype of extension.archetypes) {
      const entry = archetypes.get(archetype.id);
      if (entry === undefined)
        archetypes.set(archetype.id, { archetype, owner: extension });
      else if (entry.archetype !== archetype)
        conflicts.push({
          code: "composition.archetype-id-conflict",
          subject: archetype.id,
          extensions: [entry.owner.id, extension.id],
        });
    }
  }
  const kind: LocusKind<ReadonlyArray<Extension>> = {
    _tag: "LocusKind",
    extensions: Object.freeze([...extensions]),
    conflicts: deepFreeze(conflicts),
    properties: Object.freeze(properties),
    relationTypes: Object.freeze(
      [...relationTypes.values()].map((entry) => entry.type),
    ),
    archetypes: Object.freeze(
      [...archetypes.values()].map((entry) => entry.archetype),
    ),
    extend: ((...more: ReadonlyArray<Extension>) => {
      const next = [...extensions];
      for (const extension of more)
        if (!next.includes(extension)) next.push(extension);
      return compose(next);
    }) as LocusKind<ReadonlyArray<Extension>>["extend"],
    make: ((definition: RawDefinition) =>
      makeLocus(kind, definition)) as LocusKind<
      ReadonlyArray<Extension>
    >["make"],
  };
  return Object.freeze(kind);
}

function makeLocus(
  kind: LocusKind<ReadonlyArray<Extension>>,
  definition: RawDefinition,
): LocusDefinition {
  const raw = definition.properties ?? {};
  const schema = Schema.Struct(kind.properties) as unknown as Schema.Codec<
    Record<string, unknown>,
    unknown
  >;
  const exit = Schema.decodeUnknownExit(schema)(raw, { errors: "all" });
  let properties: Readonly<Record<string, unknown>> = raw as Readonly<
    Record<string, unknown>
  >;
  let propertyIssues: LocusDefinition["propertyIssues"] = [];
  if (Exit.isSuccess(exit))
    properties = exit.value as Readonly<Record<string, unknown>>;
  else {
    const error = Cause.findErrorOption(exit.cause);
    propertyIssues = Option.isSome(error)
      ? formatIssues(error.value.issue).issues.map((issue) => ({
          path: (issue.path ?? []).map((p) =>
            typeof p === "object" ? p.key : p,
          ),
          message: issue.message,
        }))
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

// START_CONTRACT: Locus
//   PURPOSE: The universal Locus kind with no extensions; Locus.make({ id }) is a complete Locus.
//   INPUTS: none
//   OUTPUTS: { LocusKind<readonly []> - the kind with no extensions, extend and make }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Locus
export const Locus: LocusKind<readonly []> = compose(
  [],
) as unknown as LocusKind<readonly []>;

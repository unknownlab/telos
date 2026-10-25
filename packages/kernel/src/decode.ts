import { Cause, Exit, Option, Schema, SchemaIssue } from "effect";
import { Capability, type EffectClass } from "./capability";
import type { Extension } from "./extension";
import { Locus, type LocusDefinition, type LocusKind } from "./locus";
import { type Relation, type RelationType } from "./relation";

export interface ExtensionRegistry {
  readonly extensions: ReadonlyArray<Extension>;
}

export type FieldType = "number" | "integer" | "string" | "boolean";

export interface LocusJson {
  readonly id: string;
  readonly extensions?: ReadonlyArray<string>;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly contains?: ReadonlyArray<LocusJson>;
  readonly relations?: ReadonlyArray<{
    readonly type: string;
    readonly target: string;
  }>;
  readonly capabilities?: Readonly<
    Record<
      string,
      {
        readonly description: string;
        readonly effect: EffectClass;
        readonly input: Readonly<Record<string, FieldType>>;
        readonly output: Readonly<Record<string, FieldType>>;
      }
    >
  >;
}

export interface DecodeIssue {
  readonly path: string;
  readonly message: string;
}

export type DecodeResult =
  | { readonly ok: true; readonly root: LocusDefinition }
  | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> };

const FieldTypeSchema = Schema.Literals([
  "number",
  "integer",
  "string",
  "boolean",
]);
const CapabilityJsonSchema = Schema.Struct({
  description: Schema.String,
  effect: Schema.Literals(["pure", "read", "write"]),
  input: Schema.Record(Schema.String, FieldTypeSchema),
  output: Schema.Record(Schema.String, FieldTypeSchema),
});

export const LocusJsonSchema: Schema.Codec<LocusJson> = Schema.Struct({
  id: Schema.String,
  extensions: Schema.optionalKey(Schema.Array(Schema.String)),
  description: Schema.optionalKey(Schema.String),
  properties: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
  contains: Schema.optionalKey(
    Schema.Array(
      Schema.suspend((): Schema.Codec<LocusJson> => LocusJsonSchema),
    ),
  ),
  relations: Schema.optionalKey(
    Schema.Array(Schema.Struct({ type: Schema.String, target: Schema.String })),
  ),
  capabilities: Schema.optionalKey(
    Schema.Record(Schema.String, CapabilityJsonSchema),
  ),
});

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface Lookup {
  readonly extensions: ReadonlyMap<string, Extension>;
  readonly relationTypes: ReadonlyMap<string, RelationType>;
}

function lookupOf(registry: ExtensionRegistry): Lookup {
  const extensions = new Map<string, Extension>();
  const relationTypes = new Map<string, RelationType>();
  for (const extension of registry.extensions) {
    if (!extensions.has(extension.id)) extensions.set(extension.id, extension);
    for (const type of extension.relationTypes)
      if (!relationTypes.has(type.id)) relationTypes.set(type.id, type);
  }
  return { extensions, relationTypes };
}

function structuralIssues(
  cause: Cause.Cause<unknown>,
): ReadonlyArray<DecodeIssue> {
  const error = Cause.findErrorOption(
    cause,
  ) as Option.Option<Schema.SchemaError>;
  if (Option.isNone(error))
    return [{ path: "", message: String(Cause.squash(cause)) }];
  return formatIssues(error.value.issue).issues.map((issue) => ({
    path: (issue.path ?? [])
      .map((p) => String(typeof p === "object" ? p.key : p))
      .join("/"),
    message: issue.message,
  }));
}

function collectIssues(
  json: LocusJson,
  prefix: string,
  lookup: Lookup,
): Array<DecodeIssue> {
  const issues: Array<DecodeIssue> = [];
  (json.extensions ?? []).forEach((id, index) => {
    if (!lookup.extensions.has(id))
      issues.push({
        path: `${prefix}extensions/${index}`,
        message: `Unknown extension ${id}.`,
      });
  });
  (json.relations ?? []).forEach((relation, index) => {
    if (!lookup.relationTypes.has(relation.type))
      issues.push({
        path: `${prefix}relations/${index}/type`,
        message: `Unknown relation type ${relation.type}.`,
      });
  });
  (json.contains ?? []).forEach((child, index) => {
    issues.push(...collectIssues(child, `${prefix}contains/${index}/`, lookup));
  });
  return issues;
}

function fieldSchema(type: FieldType): Schema.Top {
  switch (type) {
    case "number":
      return Schema.Finite;
    case "integer":
      return Schema.Int;
    case "string":
      return Schema.String;
    case "boolean":
      return Schema.Boolean;
  }
}

function structOf(
  fields: Readonly<Record<string, FieldType>>,
): Schema.Codec<unknown, unknown> {
  const mapped: Record<string, Schema.Top> = {};
  for (const [name, type] of Object.entries(fields))
    mapped[name] = fieldSchema(type);
  return Schema.Struct(mapped) as unknown as Schema.Codec<unknown, unknown>;
}

function buildLocus(json: LocusJson, lookup: Lookup): LocusDefinition {
  const extensions = (json.extensions ?? []).map((id) => {
    const extension = lookup.extensions.get(id);
    if (extension === undefined) throw new Error(`Unknown extension ${id}.`);
    return extension;
  });
  const kind = (Locus as LocusKind<ReadonlyArray<Extension>>).extend(
    ...extensions,
  );
  const contains = (json.contains ?? []).map((child) =>
    buildLocus(child, lookup),
  );
  const relations: Array<Relation> = (json.relations ?? []).map((relation) => {
    const type = lookup.relationTypes.get(relation.type);
    if (type === undefined)
      throw new Error(`Unknown relation type ${relation.type}.`);
    return type.to(relation.target);
  });
  const capabilities: Record<string, Capability> = {};
  for (const [name, declared] of Object.entries(json.capabilities ?? {}))
    capabilities[name] = Capability.declare({
      description: declared.description,
      effect: declared.effect,
      input: structOf(declared.input),
      output: structOf(declared.output),
    });
  const definition: Record<string, unknown> = { id: json.id };
  if (json.description !== undefined) definition.description = json.description;
  if (json.properties !== undefined) definition.properties = json.properties;
  definition.contains = contains;
  definition.relations = relations;
  definition.capabilities = capabilities;
  const make = kind.make as unknown as (
    value: Record<string, unknown>,
  ) => LocusDefinition;
  return make(definition);
}

export function decodeLocus(
  input: unknown,
  registry: ExtensionRegistry,
): DecodeResult {
  const exit = Schema.decodeUnknownExit(LocusJsonSchema)(input, {
    errors: "all",
  });
  if (!Exit.isSuccess(exit))
    return { ok: false, issues: structuralIssues(exit.cause) };
  const json = exit.value;
  const lookup = lookupOf(registry);
  const issues = collectIssues(json, "", lookup).sort(
    (a, b) => compareText(a.path, b.path) || compareText(a.message, b.message),
  );
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, root: buildLocus(json, lookup) };
}

export function decodeLocusText(
  text: string,
  registry: ExtensionRegistry,
): DecodeResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      issues: [{ path: "", message: (error as Error).message }],
    };
  }
  return decodeLocus(value, registry);
}

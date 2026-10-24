// START_MODULE_CONTRACT
//   PURPOSE: Describe capabilities, Loci, the model and verification state as JSON with a knowledge status and a digest on each described object.
//   SCOPE: The description types, toJsonSchema, describeCapability, describeLocus, describeModel and describeVerifications. Out: invoking capabilities (invoke.ts), input fields (fields.ts) and running rules (verify.ts).
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-VERIFY, M-KERNEL-CANONICAL, M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DESCRIBE, V-M-KERNEL-DESCRIBE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Knowledge - the knowledge status a description can carry
//   JsonSchemaDocument - a JSON Schema document with its dialect and definitions
//   RelationDescription - one relation of a Locus with its type description and knowledge
//   CapabilityDescription - one capability with its contract, exposure and digest
//   VerificationDescription - one Archetype rule of a Locus with its verification outcome
//   LocusDescription - one Locus with its kind, relations, capabilities, archetypes, diagnostics and digest
//   ModelDescription - the whole model with its Loci, diagnostics and digest
//   toJsonSchema - converts an Effect schema to a JSON Schema document
//   describeCapability - describes one capability of one Locus
//   describeLocus - describes one Locus of the model
//   describeModel - describes every Locus of the model in model order
//   describeVerifications - lists the rules of a Locus with the outcome of a verification report
// END_MODULE_MAP

import { Effect, Schema as S } from "effect";
import type { RuleMethod } from "./archetype";
import { errorTag, type EffectClass } from "./capability";
import type { Diagnostic } from "./diagnostic";
import { digestOf, type Digest } from "./digest";
import { deepFreeze } from "./freeze";
import { capabilityKey } from "./identity";
import {
  incoming,
  outgoing,
  type ModelRelation,
  type SemanticModel,
} from "./model";
import type { RelationTarget } from "./relation";
import {
  applicableArchetypes,
  type Outcome,
  type Provenance,
  type VerificationReport,
} from "./verify";

/** Where a described fact comes from. Only declared, derived, verified, failed and not-run are produced here. */
export type Knowledge =
  | "declared"
  | "derived"
  | "verified"
  | "failed"
  | "not-run"
  | "observed"
  | "invalidated"
  | "unknown";

export interface JsonSchemaDocument {
  readonly dialect: string;
  readonly schema: unknown;
  readonly definitions: Readonly<Record<string, unknown>>;
}

export interface RelationDescription {
  readonly type: string;
  readonly typeDescription: string;
  readonly from: string;
  readonly target: RelationTarget;
  readonly grantsInvocation: boolean;
  readonly knowledge: "declared" | "derived";
}

export interface CapabilityDescription {
  readonly ref: string;
  readonly locus: string;
  readonly name: string;
  readonly description: string;
  readonly effect: EffectClass;
  readonly input: JsonSchemaDocument;
  readonly output: JsonSchemaDocument;
  readonly errors: ReadonlyArray<{
    readonly tag: string;
    readonly schema: JsonSchemaDocument;
  }>;
  readonly implemented: boolean;
  readonly contractDigest: Digest;
  readonly exposedBy: ReadonlyArray<{
    readonly locus: string;
    readonly relationType: string;
  }>;
  readonly knowledge: "declared";
}

export interface VerificationDescription {
  readonly archetype: string;
  readonly rule: string;
  readonly description: string;
  readonly method: RuleMethod;
  readonly outcome: Outcome | "not-run";
  readonly message: string | null;
  readonly knowledge: "verified" | "failed" | "not-run";
  readonly provenance: Provenance | null;
}

export interface LocusDescription {
  readonly id: string;
  readonly description: string | null;
  readonly container: string | null;
  readonly contains: ReadonlyArray<string>;
  readonly extensions: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
  }>;
  readonly properties: unknown;
  readonly relations: {
    readonly outgoing: ReadonlyArray<RelationDescription>;
    readonly incoming: ReadonlyArray<RelationDescription>;
  };
  readonly capabilities: ReadonlyArray<CapabilityDescription>;
  readonly archetypes: ReadonlyArray<{
    readonly id: string;
    readonly description: string;
    readonly rules: ReadonlyArray<{
      readonly id: string;
      readonly description: string;
      readonly method: RuleMethod;
    }>;
  }>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly digest: Digest;
  readonly knowledge: "declared";
}

export interface ModelDescription {
  readonly root: string;
  readonly loci: ReadonlyArray<LocusDescription>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly digest: Digest;
}

// Orders strings by UTF-16 code unit, never by locale.
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

// START_CONTRACT: toJsonSchema
//   PURPOSE: Convert an Effect schema to a JSON Schema document with its dialect and definitions.
//   INPUTS: { schema: S.Top - any Effect schema }
//   OUTPUTS: { JsonSchemaDocument - dialect, schema and definitions of Schema.toJsonSchemaDocument }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: toJsonSchema
export const toJsonSchema = (schema: S.Top): JsonSchemaDocument => {
  const document = S.toJsonSchemaDocument(schema);
  return {
    dialect: document.dialect,
    schema: document.schema,
    definitions: document.definitions,
  };
};

// START_CONTRACT: describeCapability
//   PURPOSE: Describe one capability of one Locus with its contract, implementation state, exposure and contract digest.
//   INPUTS: { model: SemanticModel - a built model; locus: string - a Locus id; name: string - a capability name }
//   OUTPUTS: { Effect<CapabilityDescription> - frozen description; dies for an unknown Locus or capability }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: describeCapability
/** Describes one capability. Dies when the Locus or the capability does not exist. */
export const describeCapability = (
  model: SemanticModel,
  locus: string,
  name: string,
): Effect.Effect<CapabilityDescription> =>
  Effect.gen(function* () {
    const definition = model.loci.get(locus)?.definition;
    if (definition === undefined)
      return yield* Effect.die(`No Locus ${locus} in the model.`);
    if (!hasOwn(definition.capabilities, name))
      return yield* Effect.die(`Locus ${locus} has no capability ${name}.`);
    const capability = definition.capabilities[name]!;
    const input = toJsonSchema(capability.input);
    const output = toJsonSchema(capability.output);
    const errors = capability.errors
      .map((error) => ({ tag: errorTag(error), schema: toJsonSchema(error) }))
      .sort((a, b) => byCodeUnit(a.tag, b.tag));
    const effect = capability.effect;
    const contractDigest = yield* digestOf({ input, output, errors, effect });
    const exposedBy = model.relations
      .filter(
        (relation) =>
          relation.valid &&
          relation.type.grantsInvocation &&
          relation.target.locus === locus &&
          relation.target.capability === name,
      )
      .map((relation) => ({
        locus: relation.from,
        relationType: relation.type.id,
      }))
      .sort(
        (a, b) =>
          byCodeUnit(a.locus, b.locus) ||
          byCodeUnit(a.relationType, b.relationType),
      );
    return deepFreeze({
      ref: capabilityKey(locus, name),
      locus,
      name,
      description: capability.description,
      effect,
      input,
      output,
      errors,
      implemented: capability.handler !== null,
      contractDigest,
      exposedBy,
      knowledge: "declared" as const,
    });
  });

function describeRelation(
  relation: ModelRelation,
  knowledge: "declared" | "derived",
): RelationDescription {
  return {
    type: relation.type.id,
    typeDescription: relation.type.description,
    from: relation.from,
    target: relation.target,
    grantsInvocation: relation.type.grantsInvocation,
    knowledge,
  };
}

// START_CONTRACT: describeLocus
//   PURPOSE: Describe one Locus with its extensions, decoded properties, relations, capabilities, archetypes, diagnostics and digest.
//   INPUTS: { model: SemanticModel - a built model; id: string - a Locus id }
//   OUTPUTS: { Effect<LocusDescription> - frozen description; dies for an unknown id }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: describeLocus
/** Describes one Locus. Dies when the id is not in the model. */
export const describeLocus = (
  model: SemanticModel,
  id: string,
): Effect.Effect<LocusDescription> =>
  Effect.gen(function* () {
    const entry = model.loci.get(id);
    if (entry === undefined)
      return yield* Effect.die(`No Locus ${id} in the model.`);
    const definition = entry.definition;
    const properties =
      definition.propertyIssues.length === 0
        ? S.encodeUnknownSync(
            S.Struct(definition.kind.properties) as unknown as S.Codec<
              unknown,
              unknown
            >,
          )(definition.properties)
        : definition.properties;
    const capabilityNames = Object.keys(definition.capabilities).sort(
      byCodeUnit,
    );
    const capabilities: CapabilityDescription[] = [];
    for (const name of capabilityNames)
      capabilities.push(yield* describeCapability(model, id, name));
    const base = {
      id,
      description: definition.description,
      container: entry.container,
      contains: [...entry.contains],
      extensions: definition.kind.extensions.map((extension) => ({
        id: extension.id,
        description: extension.description,
      })),
      properties,
      relations: {
        outgoing: outgoing(model, id).map((relation) =>
          describeRelation(relation, "declared"),
        ),
        incoming: incoming(model, id).map((relation) =>
          describeRelation(relation, "derived"),
        ),
      },
      capabilities,
      archetypes: applicableArchetypes(model, id).map((archetype) => ({
        id: archetype.id,
        description: archetype.description,
        rules: archetype.rules.map((rule) => ({
          id: rule.id,
          description: rule.description,
          method: rule.method,
        })),
      })),
      diagnostics: model.diagnostics.filter(
        (diagnostic) => diagnostic.subject === id,
      ),
    };
    const digest = yield* digestOf(base);
    return deepFreeze({ ...base, digest, knowledge: "declared" as const });
  });

// START_CONTRACT: describeModel
//   PURPOSE: Describe every Locus of a model in model order, with the model diagnostics and a digest over the Locus digests.
//   INPUTS: { model: SemanticModel - a built model }
//   OUTPUTS: { Effect<ModelDescription> - frozen description with loci in model.ids order }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: describeModel
/** Describes the whole model. */
export const describeModel = (
  model: SemanticModel,
): Effect.Effect<ModelDescription> =>
  Effect.gen(function* () {
    const loci: LocusDescription[] = [];
    for (const id of model.ids) loci.push(yield* describeLocus(model, id));
    const digest = yield* digestOf(loci.map((locus) => locus.digest));
    return deepFreeze({
      root: model.root,
      loci,
      diagnostics: [...model.diagnostics],
      digest,
    });
  });

// START_CONTRACT: describeVerifications
//   PURPOSE: List every rule of a Locus with the outcome of a verification report, never claiming verified without a passed finding.
//   INPUTS: { model: SemanticModel - a built model; id: string - a Locus id; report: VerificationReport | null - a verification report or none }
//   OUTPUTS: { ReadonlyArray<VerificationDescription> - one entry per applicable rule sorted by archetype and rule, frozen }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: describeVerifications
/** One entry per rule of the applicable archetypes of `id`, with the outcome from `report` when a finding matches. */
export function describeVerifications(
  model: SemanticModel,
  id: string,
  report: VerificationReport | null,
): ReadonlyArray<VerificationDescription> {
  const entries: VerificationDescription[] = [];
  for (const archetype of applicableArchetypes(model, id)) {
    for (const rule of archetype.rules) {
      const finding = report?.findings.find(
        (candidate) =>
          candidate.locus === id &&
          candidate.archetype === archetype.id &&
          candidate.rule === rule.id,
      );
      if (report === null || finding === undefined) {
        entries.push({
          archetype: archetype.id,
          rule: rule.id,
          description: rule.description,
          method: rule.method,
          outcome: "not-run",
          message: null,
          knowledge: "not-run",
          provenance: null,
        });
      } else {
        entries.push({
          archetype: archetype.id,
          rule: rule.id,
          description: rule.description,
          method: rule.method,
          outcome: finding.outcome,
          message: finding.message,
          knowledge: finding.outcome === "passed" ? "verified" : "failed",
          provenance: report.provenance,
        });
      }
    }
  }
  entries.sort(
    (a, b) =>
      byCodeUnit(a.archetype, b.archetype) || byCodeUnit(a.rule, b.rule),
  );
  return deepFreeze(entries);
}

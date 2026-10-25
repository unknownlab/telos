import { Effect } from "effect";
import {
  CapabilityRef,
  describeCapability,
  invoke,
  jsonEqual,
  outgoing,
  capabilityKey,
  type EffectClass,
  type InvocationOutcome,
  type JsonSchemaDocument,
  type ModelRelation,
  type SemanticModel,
} from "@telos/kernel";

export const AGENT_TOOL_TYPE = "agent.tool";

export const AGENT_EXTENSION_ID = "telos.agent";

export const TOOL_NAME_PATTERN: RegExp = /^[a-zA-Z0-9_-]{1,64}$/;

export interface ToolAnnotations {
  readonly readOnlyHint: boolean;
  readonly destructiveHint: boolean;
  readonly idempotentHint: boolean;
  readonly openWorldHint: boolean;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: unknown;
  readonly annotations: ToolAnnotations;
  readonly _meta: {
    readonly "telos/capability": string | null;
    readonly "telos/effect": EffectClass;
  };
}

export interface ToolResult {
  readonly isError: boolean;
  readonly text: string;
  readonly structured: Readonly<Record<string, unknown>>;
}

export interface DerivedTool {
  readonly definition: ToolDefinition;
  readonly ref: CapabilityRef;
}

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const hasOwn = (record: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

export function exposedRelations(
  model: SemanticModel,
  agentLocusId: string,
): ReadonlyArray<ModelRelation> {
  const entry = model.loci.get(agentLocusId);
  if (entry === undefined) return [];
  if (
    !entry.definition.kind.extensions.some((e) => e.id === AGENT_EXTENSION_ID)
  )
    return [];
  const sorted = outgoing(model, agentLocusId)
    .filter(
      (r) =>
        r.valid &&
        r.type.id === AGENT_TOOL_TYPE &&
        r.target.capability !== null,
    )
    .slice()
    .sort(
      (a, b) =>
        byCodeUnit(a.target.capability ?? "", b.target.capability ?? "") ||
        byCodeUnit(a.target.locus, b.target.locus),
    );
  const seen = new Set<string>();
  const unique: ModelRelation[] = [];
  for (const relation of sorted) {
    const name = relation.target.capability ?? "";
    if (seen.has(name)) continue;
    seen.add(name);
    unique.push(relation);
  }
  return unique;
}

const REF_PATTERN = /^#\/\$defs\/(.+)$/;

export function toolInputSchema(
  input: JsonSchemaDocument,
): Readonly<Record<string, unknown>> {
  let top: unknown = input.schema;
  const definitions = input.definitions;
  if (typeof top === "object" && top !== null) {
    const keys = Object.keys(top);
    const ref = (top as Record<string, unknown>)["$ref"];
    if (keys.length === 1 && typeof ref === "string") {
      const match = REF_PATTERN.exec(ref);
      if (match !== null && hasOwn(definitions, match[1]!)) {
        top = definitions[match[1]!];
      }
    }
  }
  if (jsonEqual(top, { not: { type: "null" } })) {
    top = { type: "object", properties: {} };
  }
  if (typeof top !== "object" || top === null) {
    return top as Readonly<Record<string, unknown>>;
  }
  if (Object.keys(definitions).length > 0) {
    return { ...(top as Record<string, unknown>), $defs: definitions };
  }
  return { ...(top as Record<string, unknown>) };
}

export function toToolResult(outcome: InvocationOutcome): ToolResult {
  if (outcome.ok) {
    return {
      isError: false,
      text: JSON.stringify(outcome.output),
      structured: { ok: true, output: outcome.output },
    };
  }
  return {
    isError: true,
    text: JSON.stringify(outcome.error),
    structured: { ok: false, error: outcome.error },
  };
}

export const deriveTools = (
  model: SemanticModel,
  agentLocusId: string,
): Effect.Effect<ReadonlyArray<DerivedTool>> =>
  Effect.forEach(exposedRelations(model, agentLocusId), (relation) =>
    Effect.map(
      describeCapability(
        model,
        relation.target.locus,
        relation.target.capability ?? "",
      ),
      (description): DerivedTool => {
        const readOnly = description.effect !== "write";
        return {
          definition: {
            name: description.name,
            description: description.description,
            inputSchema: toolInputSchema(description.input),
            annotations: {
              readOnlyHint: readOnly,
              destructiveHint: false,
              idempotentHint: readOnly,
              openWorldHint: false,
            },
            _meta: {
              "telos/capability": capabilityKey(
                description.locus,
                description.name,
              ),
              "telos/effect": description.effect,
            },
          },
          ref: CapabilityRef.make(description.locus, description.name),
        };
      },
    ),
  );

export const callTool = (
  model: SemanticModel,
  agentLocusId: string,
  name: string,
  args: unknown,
): Effect.Effect<ToolResult> =>
  Effect.gen(function* () {
    const tools = yield* deriveTools(model, agentLocusId);
    const tool = tools.find((t) => t.definition.name === name);
    if (tool === undefined) {
      return toToolResult({
        ok: false,
        error: {
          tag: "CapabilityNotFound",
          message: `Agent ${agentLocusId} has no tool ${name}.`,
          issues: [],
        },
      });
    }
    const outcome = yield* invoke(model, tool.ref, args, {
      via: agentLocusId,
    });
    return toToolResult(outcome);
  });

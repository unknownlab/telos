// START_MODULE_CONTRACT
//   PURPOSE: Derive agent tools from the capabilities an agent interface Locus exposes, and call them only through the kernel grant.
//   SCOPE: AGENT_TOOL_TYPE, AGENT_EXTENSION_ID, TOOL_NAME_PATTERN, the tool interfaces, exposedRelations, toolInputSchema, toToolResult, deriveTools and callTool. Out: the introspection tools, the MCP transport and the Archetype rules, which their own modules own.
//   DEPENDS: none
//   LINKS: M-PACK-AGENT, V-M-PACK-AGENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AGENT_TOOL_TYPE - the relation type id that exposes a capability as a tool
//   AGENT_EXTENSION_ID - the extension id that marks an agent interface Locus
//   TOOL_NAME_PATTERN - the pattern of a valid tool name
//   ToolAnnotations - the MCP annotations of a tool
//   ToolDefinition - the MCP definition of a tool
//   ToolResult - the result of a tool call
//   DerivedTool - a tool derived from one exposed capability with its reference
//   exposedRelations - the valid tool relations of an agent Locus, sorted and unique by name
//   toolInputSchema - turns a JSON Schema document into an MCP object input schema
//   toToolResult - turns a kernel invocation outcome into a tool result
//   deriveTools - the tools of an agent Locus, one per exposed capability name
//   callTool - calls a tool of an agent Locus through the kernel
// END_MODULE_MAP

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

// START_CONTRACT: AGENT_TOOL_TYPE
//   PURPOSE: The relation type id of the relation that exposes a capability as an agent tool.
//   INPUTS: {}
//   OUTPUTS: { "agent.tool" - the relation type id }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: AGENT_TOOL_TYPE
export const AGENT_TOOL_TYPE = "agent.tool";

// START_CONTRACT: AGENT_EXTENSION_ID
//   PURPOSE: The extension id that marks a Locus as an agent tool interface.
//   INPUTS: {}
//   OUTPUTS: { "telos.agent" - the extension id }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: AGENT_EXTENSION_ID
export const AGENT_EXTENSION_ID = "telos.agent";

// START_CONTRACT: TOOL_NAME_PATTERN
//   PURPOSE: The pattern that every agent tool name must match.
//   INPUTS: {}
//   OUTPUTS: { RegExp - matches 1 to 64 letters, digits, underscores and hyphens }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: TOOL_NAME_PATTERN
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

// START_CONTRACT: exposedRelations
//   PURPOSE: List the valid agent tool relations of an agent Locus, sorted by capability name then Locus id, keeping only the first relation of each name.
//   INPUTS: { model: SemanticModel - a built model; agentLocusId: string - the agent Locus id }
//   OUTPUTS: { ReadonlyArray<ModelRelation> - unique by capability name; empty for a Locus without the agent kind }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: exposedRelations
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

// START_CONTRACT: toolInputSchema
//   PURPOSE: Turn a kernel JSON Schema document into the object input schema that MCP requires.
//   INPUTS: { input: JsonSchemaDocument - the schema and definitions of a capability input }
//   OUTPUTS: { Record<string, unknown> - the schema with a top-level type object, or the schema as it is when it is not an object }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: toolInputSchema
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

// START_CONTRACT: toToolResult
//   PURPOSE: Turn a kernel invocation outcome into the text and structured result of a tool call.
//   INPUTS: { outcome: InvocationOutcome - the value or the error of an invocation }
//   OUTPUTS: { ToolResult - isError false with the output, or isError true with the error }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: toToolResult
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

// START_CONTRACT: deriveTools
//   PURPOSE: Derive one tool per exposed capability name of an agent Locus, with its contract and annotations.
//   INPUTS: { model: SemanticModel - a built model; agentLocusId: string - the agent Locus id }
//   OUTPUTS: { Effect<ReadonlyArray<DerivedTool>> - tools in the order of exposedRelations }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: deriveTools
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

// START_CONTRACT: callTool
//   PURPOSE: Call a tool of an agent Locus by name, through the kernel grant of that Locus, without coercing the arguments.
//   INPUTS: { model: SemanticModel; agentLocusId: string - the agent Locus; name: string - the tool name; args: unknown - the JSON arguments }
//   OUTPUTS: { Effect<ToolResult> - CapabilityNotFound when no tool has the name, else the kernel outcome as a tool result }
//   SIDE_EFFECTS: none beyond the handler of the invoked capability
//   LINKS: M-PACK-AGENT
// END_CONTRACT: callTool
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

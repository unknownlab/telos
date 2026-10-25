// START_MODULE_CONTRACT
//   PURPOSE: Give agents six read-only telos_* tools that describe the model through the kernel Telos service and never invoke a capability.
//   SCOPE: INTROSPECTION_TOOL_NAMES, IntrospectionTool and introspectionTools with the input decoding and failure mapping of each tool. Out: the agent tools that invoke capabilities (tools.ts) and the MCP transport (mcp.ts).
//   DEPENDS: M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-PACK-AGENT, V-M-PACK-AGENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   INTROSPECTION_TOOL_NAMES - the names of the six introspection tools in sorted order
//   IntrospectionTool - one introspection tool with its definition and call
//   introspectionTools - the six introspection tools of a Telos service, sorted by name
// END_MODULE_MAP

import { Cause, Effect, Exit, Option, Schema, SchemaIssue } from "effect";
import {
  toJsonSchema,
  type CapabilityNotFound,
  type LocusNotFound,
  type TelosApi,
} from "@telos/kernel";
import {
  toToolResult,
  toolInputSchema,
  type ToolDefinition,
  type ToolResult,
} from "./tools";

// START_CONTRACT: INTROSPECTION_TOOL_NAMES
//   PURPOSE: The names of the introspection tools, sorted by code unit.
//   INPUTS: {}
//   OUTPUTS: { ReadonlyArray<string> - the six telos_* names }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: INTROSPECTION_TOOL_NAMES
export const INTROSPECTION_TOOL_NAMES: ReadonlyArray<string> = [
  "telos_capabilities",
  "telos_impact",
  "telos_inspect",
  "telos_list_loci",
  "telos_relations",
  "telos_verifications",
];

export interface IntrospectionTool {
  readonly definition: ToolDefinition;
  readonly call: (args: unknown) => Effect.Effect<ToolResult>;
}

type ToolFailure = LocusNotFound | CapabilityNotFound;

interface ToolSpec<A> {
  readonly name: string;
  readonly description: string;
  readonly input: Schema.Codec<A, any, never, never>;
  readonly run: (
    telos: TelosApi,
    input: A,
  ) => Effect.Effect<unknown, ToolFailure>;
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

// START_CONTRACT: makeTool
//   PURPOSE: Build one introspection tool from its name, description, input schema and run function.
//   INPUTS: { telos: TelosApi - the service; spec: ToolSpec - the tool specification }
//   OUTPUTS: { IntrospectionTool - the definition with read annotations and the call }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: makeTool
function makeTool<A>(telos: TelosApi, spec: ToolSpec<A>): IntrospectionTool {
  return {
    definition: {
      name: spec.name,
      description: spec.description,
      inputSchema: toolInputSchema(toJsonSchema(spec.input as Schema.Top)),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: { "telos/capability": null, "telos/effect": "read" },
    },
    call: (args: unknown) =>
      Effect.gen(function* () {
        const decoded = Schema.decodeUnknownExit(spec.input)(args, {
          errors: "all",
        });
        if (Exit.isFailure(decoded)) {
          const error = Option.getOrThrow(Cause.findErrorOption(decoded.cause));
          const issues = formatIssues(error.issue).issues.map((entry) => ({
            path: (entry.path ?? []).map((p) =>
              typeof p === "object" ? p.key : p,
            ),
            message: entry.message,
          }));
          return toToolResult({
            ok: false,
            error: {
              tag: "InvalidInput",
              message: `Invalid input for ${spec.name}.`,
              issues,
            },
          });
        }
        const exit = yield* Effect.exit(spec.run(telos, decoded.value));
        if (Exit.isSuccess(exit)) {
          return toToolResult({ ok: true, output: exit.value });
        }
        const failure = Cause.findErrorOption(exit.cause);
        if (Option.isSome(failure)) {
          const error = failure.value;
          return toToolResult({
            ok: false,
            error: { tag: error._tag, message: error.message, issues: [] },
          });
        }
        return yield* Effect.die(Cause.squash(exit.cause));
      }),
  };
}

const IdInput = Schema.Struct({ id: Schema.String });
const TargetInput = Schema.Struct({ target: Schema.String });
const NoInput = Schema.Struct({});

// START_CONTRACT: introspectionTools
//   PURPOSE: Build the six introspection tools over one Telos service, sorted by name.
//   INPUTS: { telos: TelosApi - the service the tools describe }
//   OUTPUTS: { ReadonlyArray<IntrospectionTool> - the tools in INTROSPECTION_TOOL_NAMES order }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-AGENT
// END_CONTRACT: introspectionTools
export function introspectionTools(
  telos: TelosApi,
): ReadonlyArray<IntrospectionTool> {
  return [
    makeTool(telos, {
      name: "telos_capabilities",
      description: "Lists the capabilities of a Locus with their contracts.",
      input: IdInput,
      run: (t, { id }) =>
        Effect.flatMap(t.resolve(id), (view) =>
          Effect.map(view.capabilities(), (capabilities) => ({ capabilities })),
        ),
    }),
    makeTool(telos, {
      name: "telos_impact",
      description:
        "Lists the Loci and checks affected by a change to a Locus or capability.",
      input: TargetInput,
      run: (t, { target }) => t.impact(target),
    }),
    makeTool(telos, {
      name: "telos_inspect",
      description:
        "Describes one Locus: purpose, relations, capabilities, archetypes and diagnostics.",
      input: IdInput,
      run: (t, { id }) =>
        Effect.flatMap(t.resolve(id), (view) => view.inspect()),
    }),
    makeTool(telos, {
      name: "telos_list_loci",
      description: "Lists the ids of every Locus in the model.",
      input: NoInput,
      run: (t) => Effect.map(t.loci(), (loci) => ({ loci })),
    }),
    makeTool(telos, {
      name: "telos_relations",
      description: "Lists the outgoing and incoming relations of a Locus.",
      input: IdInput,
      run: (t, { id }) =>
        Effect.flatMap(t.resolve(id), (view) => view.relations()),
    }),
    makeTool(telos, {
      name: "telos_verifications",
      description:
        "Lists the verification state of every rule that applies to a Locus.",
      input: IdInput,
      run: (t, { id }) =>
        Effect.flatMap(t.resolve(id), (view) =>
          Effect.map(view.verifications(), (verifications) => ({
            verifications,
          })),
        ),
    }),
  ];
}

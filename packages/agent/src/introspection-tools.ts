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

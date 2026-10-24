// START_MODULE_CONTRACT
//   PURPOSE: Serve the derived agent tools and the introspection tools of one agent Locus as an MCP stdio server on Bun.
//   SCOPE: BunStdio, registerTools and serveMcp. Out: the derivation rules (tools.ts), the introspection behaviour (introspection-tools.ts) and the client (client.ts).
//   DEPENDS: M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-PACK-AGENT-MCP, V-M-PACK-AGENT-MCP
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BunStdio - the Stdio layer over the Bun process streams
//   registerTools - registers every tool of the agent and the introspection tools on the MCP server
//   serveMcp - builds the Telos service of a root Locus and serves its agent over stdio until the stream ends
// END_MODULE_MAP

import {
  Cause,
  Context,
  Effect,
  Exit,
  Layer,
  Sink,
  Stdio,
  Stream,
} from "effect";
import { McpProtocol, McpSchema, McpServer } from "effect/ai";
import { Telos, type LocusDefinition, type TelosApi } from "@telos/kernel";
import {
  AGENT_EXTENSION_ID,
  callTool,
  deriveTools,
  type ToolDefinition,
  type ToolResult,
} from "./tools";
import { introspectionTools } from "./introspection-tools";

// START_CONTRACT: BunStdio
//   PURPOSE: Provide the Stdio service over process.argv, process.stdout, process.stderr and Bun.stdin.
//   INPUTS: {}
//   OUTPUTS: { Layer.Layer<Stdio.Stdio> }
//   SIDE_EFFECTS: writes to process.stdout and process.stderr when the server sends or logs
//   LINKS: M-PACK-AGENT-MCP
// END_CONTRACT: BunStdio
export const BunStdio: Layer.Layer<Stdio.Stdio> = Layer.succeed(
  Stdio.Stdio,
  Stdio.make({
    args: Effect.sync(() => process.argv.slice(2)),
    stdout: () =>
      Sink.forEach((c: string | Uint8Array) =>
        Effect.sync(() => {
          process.stdout.write(c);
        }),
      ),
    stderr: () =>
      Sink.forEach((c: string | Uint8Array) =>
        Effect.sync(() => {
          process.stderr.write(c);
        }),
      ),
    stdin: Stream.fromReadableStream({
      evaluate: () => Bun.stdin.stream() as ReadableStream<Uint8Array>,
      onError: (e) => e as never,
    }),
  }),
);

interface Served {
  readonly definition: ToolDefinition;
  readonly call: (args: unknown) => Effect.Effect<ToolResult>;
}

// START_CONTRACT: registerTools
//   PURPOSE: Add every object-input derived tool and every introspection tool to the MCP server, with plain annotations and plain content.
//   INPUTS: { telos: TelosApi - the service; agentLocusId: string - the agent Locus whose tools are served }
//   OUTPUTS: { Layer.Layer<never, never, McpServer> - a layer that only registers tools }
//   SIDE_EFFECTS: registers tools on the McpServer service
//   LINKS: M-PACK-AGENT-MCP
// END_CONTRACT: registerTools
export const registerTools = (
  telos: TelosApi,
  agentLocusId: string,
): Layer.Layer<never, never, McpServer.McpServer> =>
  Layer.effectDiscard(
    Effect.gen(function* () {
      const server = yield* McpServer.McpServer;
      const derived = yield* deriveTools(telos.model, agentLocusId);
      const served: Served[] = [
        ...derived.map((tool) => ({
          definition: tool.definition,
          call: (args: unknown) =>
            callTool(telos.model, agentLocusId, tool.definition.name, args),
        })),
        ...introspectionTools(telos),
      ];
      for (const entry of served) {
        const schema = entry.definition.inputSchema as { type?: unknown };
        if (schema.type !== "object") continue;
        yield* server.addTool({
          tool: new McpSchema.Tool({
            name: entry.definition.name,
            description: entry.definition.description,
            inputSchema: entry.definition.inputSchema as any,
            annotations: { ...entry.definition.annotations } as any,
            _meta: { ...entry.definition._meta } as any,
          }),
          annotations: Context.empty(),
          handle: (payload: unknown) =>
            entry.call(payload).pipe(
              Effect.map(
                (result) =>
                  new McpSchema.CallToolResult({
                    content: [{ type: "text", text: result.text }] as any,
                    structuredContent: result.structured as any,
                    isError: result.isError,
                  }),
              ),
            ),
        });
      }
    }),
  );

// START_CONTRACT: serveMcp
//   PURPOSE: Serve the agent Locus of a root Locus over MCP stdio, naming the server after its server property.
//   INPUTS: { root: LocusDefinition - the root of the model; agentLocusId: string - the agent Locus; options: { version: string } }
//   OUTPUTS: { Promise<void> - resolves when the stream ends; rejects with "No agent Locus <id> in the model." for an id that is not an agent }
//   SIDE_EFFECTS: reads stdin and writes the protocol to stdout; sets process.exitCode 1 on a failure that is not an interrupt
//   LINKS: M-PACK-AGENT-MCP
// END_CONTRACT: serveMcp
export const serveMcp = async (
  root: LocusDefinition,
  agentLocusId: string,
  options: { readonly version: string },
): Promise<void> => {
  const telos = await Effect.runPromise(Telos.make(root));
  const definition = telos.model.loci.get(agentLocusId)?.definition;
  if (
    definition === undefined ||
    !definition.kind.extensions.some((e) => e.id === AGENT_EXTENSION_ID)
  ) {
    throw new Error(`No agent Locus ${agentLocusId} in the model.`);
  }
  const name = String(definition.properties["server"]);
  const exit = await Effect.runPromiseExit(
    Layer.launch(
      registerTools(telos, agentLocusId).pipe(
        Layer.provide(
          McpServer.layerStdio({
            name,
            version: options.version,
            protocols: [McpProtocol.v2025_06_18],
          }),
        ),
        Layer.provide(BunStdio),
      ),
    ) as Effect.Effect<never, unknown, never>,
  );
  if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) {
    process.stderr.write(String(Cause.squash(exit.cause)) + "\n");
    process.exitCode = 1;
  }
};

import {
  Cause,
  Context,
  Deferred,
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

const gateStdin = (
  ready: Deferred.Deferred<void>,
): Layer.Layer<Stdio.Stdio, never, Stdio.Stdio> =>
  Layer.effect(
    Stdio.Stdio,
    Effect.gen(function* () {
      const stdio = yield* Stdio.Stdio;
      return Stdio.make({
        args: stdio.args,
        stdout: (options) => stdio.stdout(options),
        stderr: (options) => stdio.stderr(options),
        stdin: Stream.unwrap(Effect.as(Deferred.await(ready), stdio.stdin)),
      });
    }),
  );

interface Served {
  readonly definition: ToolDefinition;
  readonly call: (args: unknown) => Effect.Effect<ToolResult>;
}

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
  const ready = Deferred.makeUnsafe<void>();
  const exit = await Effect.runPromiseExit(
    Layer.launch(
      Layer.effectDiscard(Deferred.succeed(ready, undefined)).pipe(
        Layer.provide(registerTools(telos, agentLocusId)),
        Layer.provide(
          McpServer.layerStdio({
            name,
            version: options.version,
            protocols: [McpProtocol.v2025_06_18],
          }),
        ),
        Layer.provide(gateStdin(ready)),
        Layer.provide(BunStdio),
      ),
    ) as Effect.Effect<never, unknown, never>,
  );
  if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) {
    process.stderr.write(String(Cause.squash(exit.cause)) + "\n");
    process.exitCode = 1;
  }
};

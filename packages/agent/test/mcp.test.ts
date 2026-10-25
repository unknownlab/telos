import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Effect } from "effect";
import { Telos, describeLocus } from "@telos/kernel";
import { McpStdioClient } from "../src/client";
import { deriveTools } from "../src/tools";
import { INTROSPECTION_TOOL_NAMES } from "../src/introspection-tools";
import { model, root } from "./fixture";

const fixtureServer = join(import.meta.dir, "fixture-server.ts");
const TIMEOUT = 20000;

const spawnFixture = () => McpStdioClient.spawn(["bun", fixtureServer]);
const STARTUP_RUNS = 10;
const STARTUP_REQUESTS = [
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "telos-startup-test", version: "0.0.0" },
    },
  },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
]
  .map((message) => JSON.stringify(message) + "\n")
  .join("");

describe("MCP stdio server and deterministic client", () => {
  test(
    "initialize reports the server name from the agent properties and the protocol version",
    async () => {
      const client = await spawnFixture();
      try {
        expect(client.server).toEqual({
          serverName: "example-math",
          protocolVersion: "2025-06-18",
        });
      } finally {
        expect(await client.close()).toBe(0);
      }
    },
    TIMEOUT,
  );

  test(
    "tools/list names the derived tool and every introspection tool, sorted, with the derived annotations",
    async () => {
      const client = await spawnFixture();
      try {
        const listed = await client.listTools();
        const names = listed.map((t) => t.name);
        expect(names).toEqual(["double", ...INTROSPECTION_TOOL_NAMES].sort());
        const derived = await Effect.runPromise(
          deriveTools(model, "example:agent"),
        );
        const double = listed.find((t) => t.name === "double")!;
        expect(double.annotations).toEqual(derived[0]!.definition.annotations);
        expect(double._meta).toEqual(derived[0]!.definition._meta);
        expect(double.inputSchema).toEqual(derived[0]!.definition.inputSchema);
      } finally {
        await client.close();
      }
    },
    TIMEOUT,
  );

  test(
    "tools/list is complete when it is already waiting on stdin as the first request after initialize",
    async () => {
      const expected = ["double", ...INTROSPECTION_TOOL_NAMES].sort();
      for (let run = 0; run < STARTUP_RUNS; run++) {
        const proc = Bun.spawn(["bun", fixtureServer], {
          stdin: new TextEncoder().encode(STARTUP_REQUESTS),
          stdout: "pipe",
          stderr: "pipe",
        });
        const stdout = await new Response(proc.stdout).text();
        expect(await proc.exited).toBe(0);
        const response = stdout
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map(
            (line) =>
              JSON.parse(line) as {
                id?: unknown;
                result?: { tools?: ReadonlyArray<{ name: string }> };
              },
          )
          .find((message) => message.id === 2);
        const names = (response?.result?.tools ?? [])
          .map((tool) => tool.name)
          .sort();
        expect(names).toEqual(expected);
      }
    },
    TIMEOUT,
  );

  test(
    "tools/call double returns the output as text and structured content",
    async () => {
      const client = await spawnFixture();
      try {
        const result = await client.callTool("double", { n: 2 });
        expect(result).toEqual({
          isError: false,
          text: '{"value":4}',
          structuredContent: { ok: true, output: { value: 4 } },
        });
      } finally {
        await client.close();
      }
    },
    TIMEOUT,
  );

  test(
    "tools/call double with a string is a tool error with InvalidInput, not a JSON-RPC error",
    async () => {
      const client = await spawnFixture();
      try {
        const result = await client.callTool("double", { n: "x" });
        expect(result.isError).toBe(true);
        expect(
          (result.structuredContent as { error: { tag: string } }).error.tag,
        ).toBe("InvalidInput");
      } finally {
        await client.close();
      }
    },
    TIMEOUT,
  );

  test(
    "tools/call telos_inspect returns the Locus description",
    async () => {
      const client = await spawnFixture();
      try {
        const result = await client.callTool("telos_inspect", {
          id: "example:math",
        });
        const expected = await Effect.runPromise(
          describeLocus(model, "example:math"),
        );
        expect(
          (result.structuredContent as { output: unknown }).output,
        ).toEqual(expected);
      } finally {
        await client.close();
      }
    },
    TIMEOUT,
  );

  test(
    "a server that never answers makes spawn reject with the initialize timeout",
    async () => {
      await expect(
        McpStdioClient.spawn(["bun", "-e", "await new Promise(() => {})"], {
          timeoutMs: 500,
        }),
      ).rejects.toThrow("MCP request initialize timed out.");
    },
    TIMEOUT,
  );

  test("the telos model used by the fixture server has the telos service", async () => {
    const telos = await Effect.runPromise(Telos.make(root));
    expect(telos.model.ids).toEqual(model.ids);
  });
});

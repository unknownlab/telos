// START_MODULE_CONTRACT
//   PURPOSE: Prove that the MCP stdio server serves the derived and introspection tools with the same contract, and that the deterministic client talks to it over a subprocess.
//   SCOPE: The fixture server spawned through McpStdioClient, tools/list, tools/call round trips, the close code and the request timeout. Out: the kernel behaviour, which the other test files cover.
//   DEPENDS: M-PACK-AGENT-MCP, M-PACK-AGENT
//   LINKS: V-M-PACK-AGENT-MCP
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   fixtureServer - the absolute path of the fixture MCP server
//   TIMEOUT - the test timeout of every subprocess test in milliseconds
//   spawnFixture - starts the fixture server through the deterministic client
// END_MODULE_MAP

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

// START_MODULE_CONTRACT
//   PURPOSE: Prove that discovery never grants invocation: an introspection tool can describe a hidden capability, but the kernel refuses to invoke it and no tool or MCP call reaches it.
//   SCOPE: The three assertions of the discovery rule, through telos_capabilities, invoke, deriveTools and the MCP client. Out: the other tool behaviour, covered by the sibling test files.
//   DEPENDS: M-PACK-AGENT, M-PACK-AGENT-MCP
//   LINKS: V-M-PACK-AGENT, V-M-PACK-AGENT-MCP
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Effect } from "effect";
import { CapabilityRef, Telos, invoke } from "@telos/kernel";
import { McpStdioClient } from "../src/client";
import { callTool, deriveTools } from "../src/tools";
import { introspectionTools } from "../src/introspection-tools";
import { model, root } from "./fixture";

describe("discovery never grants invocation", () => {
  test("telos_capabilities lists the hidden secret capability", async () => {
    const telos = await Effect.runPromise(Telos.make(root));
    const tool = introspectionTools(telos).find(
      (t) => t.definition.name === "telos_capabilities",
    )!;
    const result = await Effect.runPromise(tool.call({ id: "example:math" }));
    const names = (
      result.structured["output"] as {
        capabilities: ReadonlyArray<{ name: string }>;
      }
    ).capabilities.map((c) => c.name);
    expect(names).toContain("secret");
  });

  test("the kernel refuses the agent an invocation of the hidden capability", async () => {
    const outcome = await Effect.runPromise(
      invoke(model, "example:math#secret", {}, { via: "example:agent" }),
    );
    expect(outcome).toEqual({
      ok: false,
      error: {
        tag: "NotGranted",
        message: "example:agent is not granted to invoke example:math#secret.",
        issues: [],
      },
    });
  });

  test("deriveTools has no tool named secret, and callTool refuses it", async () => {
    const tools = await Effect.runPromise(deriveTools(model, "example:agent"));
    expect(tools.map((t) => t.definition.name)).not.toContain("secret");
    expect(tools.map((t) => t.ref)).not.toContainEqual(
      CapabilityRef.make("example:math", "secret"),
    );
    const result = await Effect.runPromise(
      callTool(model, "example:agent", "secret", {}),
    );
    expect(result.isError).toBe(true);
    expect((result.structured["error"] as { tag: string }).tag).toBe(
      "CapabilityNotFound",
    );
  });

  test("over MCP the server rejects tools/call for secret as an unknown tool", async () => {
    const client = await McpStdioClient.spawn([
      "bun",
      join(import.meta.dir, "fixture-server.ts"),
    ]);
    try {
      await expect(client.callTool("secret", {})).rejects.toThrow(
        "MCP error -32602: Tool 'secret' not found",
      );
    } finally {
      await client.close();
    }
  }, 20000);
});

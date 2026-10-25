import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Effect } from "effect";
import { describeCapability, describeLocus } from "@telos/kernel";
import { INTROSPECTION_TOOL_NAMES, toolInputSchema } from "@telos/agent";
import { McpStdioClient } from "@telos/agent/client";
import { calculatorModel } from "../src/app";
import { CASES, matchesExpected, normalizeTool } from "./cases";

const MCP = join(import.meta.dir, "../bin/mcp.ts");
const ARITHMETIC_ID = "calculator:arithmetic";
const CALCULATOR_TOOLS = ["add", "divide", "multiply", "subtract"];

const withClient = async (
  body: (client: McpStdioClient) => Promise<void>,
): Promise<void> => {
  const client = await McpStdioClient.spawn(["bun", MCP]);
  try {
    await body(client);
  } finally {
    await client.close();
  }
};

describe("calculator mcp server", () => {
  test("the server name is telos-calculator", () => {
    return withClient(async (client) => {
      expect(client.server.serverName).toBe("telos-calculator");
    });
  }, 20000);

  test("tools/list names the four calculator tools and the introspection tools", () => {
    return withClient(async (client) => {
      const names = (await client.listTools()).map((tool) => tool.name);
      expect(names.sort()).toEqual(
        [...CALCULATOR_TOOLS, ...INTROSPECTION_TOOL_NAMES].sort(),
      );
    });
  }, 20000);

  test("each calculator tool schema equals its capability input schema", () => {
    return withClient(async (client) => {
      const tools = await client.listTools();
      for (const name of CALCULATOR_TOOLS) {
        const tool = tools.find((t) => t.name === name);
        const description = await Effect.runPromise(
          describeCapability(calculatorModel, ARITHMETIC_ID, name),
        );
        expect(tool?.inputSchema).toEqual(toolInputSchema(description.input));
      }
    });
  }, 20000);

  test("every shared case through tools/call matches its expected outcome", () => {
    return withClient(async (client) => {
      for (const c of CASES) {
        const result = await client.callTool(c.capability, c.json);
        expect(matchesExpected(normalizeTool(result), c)).toBe(true);
      }
    });
  }, 20000);

  test("telos_inspect returns the description of the arithmetic Locus (US4.3)", () => {
    return withClient(async (client) => {
      const result = await client.callTool("telos_inspect", {
        id: ARITHMETIC_ID,
      });
      const expected = await Effect.runPromise(
        describeLocus(calculatorModel, ARITHMETIC_ID),
      );
      expect((result.structuredContent as { output: unknown }).output).toEqual(
        expected,
      );
    });
  }, 20000);

  test("an unknown tool rejects with the MCP error (US4.4)", () => {
    return withClient(async (client) => {
      let message = "";
      try {
        await client.callTool("secret", {});
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toBe("MCP error -32602: Tool 'secret' not found");
    });
  }, 20000);
});

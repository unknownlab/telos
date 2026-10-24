// START_MODULE_CONTRACT
//   PURPOSE: Prove that tools.ts derives agent tools only from exposed capabilities, calls them through the kernel grant, and turns JSON input schemas into MCP object schemas.
//   SCOPE: deriveTools, callTool, toToolResult and toolInputSchema, one test per rule. Out: the introspection tools and the MCP transport, which their own test files cover.
//   DEPENDS: M-PACK-AGENT
//   LINKS: V-M-PACK-AGENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   writer - a write capability exposed by a second agent
//   writerAgent - the agent Locus that exposes writer
//   writeModel - the model holding writerAgent and the writer Locus
//   run - runs an Effect to its value in a test
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability, CapabilityRef, Locus, toJsonSchema } from "@telos/kernel";
import { callTool, deriveTools, toolInputSchema } from "../src/tools";
import { AgentSemantics, AgentTool } from "../src/semantics";
import { model, withAgent } from "./fixture";

const run = <A>(effect: Effect.Effect<A>): Promise<A> =>
  Effect.runPromise(effect);

const writer = Locus.make({
  id: "example:writer",
  capabilities: {
    save: Capability.make({
      description: "Saves.",
      input: Schema.Struct({}),
      output: Schema.Struct({ ok: Schema.Boolean }),
      effect: "write",
      handler: () => Effect.succeed({ ok: true }),
    }),
  },
});

const writerAgent = Locus.extend(AgentSemantics).make({
  id: "example:writer-agent",
  properties: { server: "example-writer" },
  relations: [AgentTool.to(writer.capability("save"))],
});

const writeModel = withAgent(writerAgent, [writer]);

describe("tools", () => {
  test("the example model has no diagnostics", () => {
    expect(model.diagnostics).toEqual([]);
  });

  test("deriveTools gives one tool for the exposed capability with its contract and annotations", async () => {
    const tools = await run(deriveTools(model, "example:agent"));
    expect(tools.length).toBe(1);
    expect(tools[0]!.definition).toEqual({
      name: "double",
      description: "Doubles n.",
      inputSchema: {
        type: "object",
        properties: { n: { type: "number" } },
        required: ["n"],
        additionalProperties: true,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        "telos/capability": "example:math#double",
        "telos/effect": "pure",
      },
    });
    expect(tools[0]!.ref).toEqual(CapabilityRef.make("example:math", "double"));
  });

  test("a write capability gives readOnlyHint false and idempotentHint false", async () => {
    const tools = await run(deriveTools(writeModel, "example:writer-agent"));
    expect(tools.length).toBe(1);
    expect(tools[0]!.definition.annotations.readOnlyHint).toBe(false);
    expect(tools[0]!.definition.annotations.idempotentHint).toBe(false);
  });

  test("an unknown Locus and a Locus that is not an agent derive no tools", async () => {
    expect(await run(deriveTools(model, "example:none"))).toEqual([]);
    expect(await run(deriveTools(model, "example:math"))).toEqual([]);
  });

  test("callTool with valid JSON arguments returns the output as text and structured output", async () => {
    const result = await run(
      callTool(model, "example:agent", "double", { n: 2 }),
    );
    expect(result).toEqual({
      isError: false,
      text: '{"value":4}',
      structured: { ok: true, output: { value: 4 } },
    });
  });

  test("callTool maps a declared error to a tool error result", async () => {
    const result = await run(
      callTool(model, "example:agent", "double", { n: -1 }),
    );
    expect(result.isError).toBe(true);
    expect(result.structured).toEqual({
      ok: false,
      error: {
        tag: "Negative",
        message: "n must not be negative.",
        issues: [],
      },
    });
    expect(result.text).toBe(JSON.stringify(result.structured["error"]));
  });

  test("callTool never coerces JSON arguments, so a string for a number is InvalidInput", async () => {
    const result = await run(
      callTool(model, "example:agent", "double", { n: "2" }),
    );
    expect(result.isError).toBe(true);
    expect((result.structured["error"] as { tag: string }).tag).toBe(
      "InvalidInput",
    );
  });

  test("callTool for a name no tool exposes is CapabilityNotFound", async () => {
    const result = await run(callTool(model, "example:agent", "nope", {}));
    expect(result).toEqual({
      isError: true,
      text: JSON.stringify({
        tag: "CapabilityNotFound",
        message: "Agent example:agent has no tool nope.",
        issues: [],
      }),
      structured: {
        ok: false,
        error: {
          tag: "CapabilityNotFound",
          message: "Agent example:agent has no tool nope.",
          issues: [],
        },
      },
    });
  });

  test("callTool for a capability that no tool exposes is CapabilityNotFound", async () => {
    const result = await run(callTool(model, "example:agent", "secret", {}));
    expect(result.isError).toBe(true);
    expect(result.structured).toEqual({
      ok: false,
      error: {
        tag: "CapabilityNotFound",
        message: "Agent example:agent has no tool secret.",
        issues: [],
      },
    });
  });

  test("toolInputSchema resolves a top-level $ref to its definition and keeps $defs", () => {
    expect(
      toolInputSchema({
        dialect: "draft-2020-12",
        schema: { $ref: "#/$defs/In" },
        definitions: {
          In: { type: "object", properties: { a: { type: "string" } } },
        },
      }),
    ).toEqual({
      type: "object",
      properties: { a: { type: "string" } },
      $defs: { In: { type: "object", properties: { a: { type: "string" } } } },
    });
  });

  test("toolInputSchema turns the null-type schema of an empty struct into an empty object", () => {
    expect(
      toolInputSchema({
        dialect: "draft-2020-12",
        schema: { not: { type: "null" } },
        definitions: {},
      }),
    ).toEqual({ type: "object", properties: {} });
  });

  test("toolInputSchema adds no $defs key when there are no definitions", () => {
    const result = toolInputSchema({
      dialect: "draft-2020-12",
      schema: { type: "object", properties: {} },
      definitions: {},
    });
    expect(Object.keys(result)).not.toContain("$defs");
    expect(result).toEqual({ type: "object", properties: {} });
  });

  test("toolInputSchema returns any other top-level schema as it is", () => {
    expect(
      toolInputSchema({
        dialect: "draft-2020-12",
        schema: { type: "number" },
        definitions: {},
      }),
    ).toEqual({ type: "number" });
  });

  test("toolInputSchema of an empty Schema.Struct is an empty object schema", () => {
    expect(toolInputSchema(toJsonSchema(Schema.Struct({})))).toEqual({
      type: "object",
      properties: {},
    });
  });
});

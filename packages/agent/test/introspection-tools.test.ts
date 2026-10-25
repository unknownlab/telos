import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { Telos, describeLocus } from "@telos/kernel";
import {
  INTROSPECTION_TOOL_NAMES,
  introspectionTools,
  type IntrospectionTool,
} from "../src/introspection-tools";
import { model, root } from "./fixture";

const run = <A>(effect: Effect.Effect<A>): Promise<A> =>
  Effect.runPromise(effect);

const telos = await Effect.runPromise(Telos.make(root));
const tools = introspectionTools(telos);

const toolNamed = (name: string): IntrospectionTool => {
  const found = tools.find((t) => t.definition.name === name);
  if (found === undefined) throw new Error(`No tool ${name}.`);
  return found;
};

describe("introspection tools", () => {
  test("the tool names are the fixed list, sorted, and every tool carries that name", () => {
    expect([...INTROSPECTION_TOOL_NAMES]).toEqual([
      "telos_capabilities",
      "telos_impact",
      "telos_inspect",
      "telos_list_loci",
      "telos_relations",
      "telos_verifications",
    ]);
    expect(tools.map((t) => t.definition.name)).toEqual([
      ...INTROSPECTION_TOOL_NAMES,
    ]);
  });

  test("every tool is read-only with the read effect and no capability", () => {
    for (const tool of tools) {
      expect(tool.definition.annotations).toEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
      expect(tool.definition._meta).toEqual({
        "telos/capability": null,
        "telos/effect": "read",
      });
    }
  });

  test("telos_list_loci has an empty object input schema and lists the model ids", async () => {
    const tool = toolNamed("telos_list_loci");
    expect(tool.definition.inputSchema).toEqual({
      type: "object",
      properties: {},
    });
    const result = await run(tool.call({}));
    expect(result.isError).toBe(false);
    expect(result.structured).toEqual({
      ok: true,
      output: { loci: model.ids },
    });
  });

  test("telos_inspect returns the Locus description", async () => {
    const result = await run(
      toolNamed("telos_inspect").call({ id: "example:math" }),
    );
    const expected = await run(describeLocus(model, "example:math"));
    expect(result.structured).toEqual({ ok: true, output: expected });
    expect(result.text).toBe(JSON.stringify(expected));
  });

  test("telos_inspect with a missing id is InvalidInput with issues", async () => {
    const result = await run(toolNamed("telos_inspect").call({}));
    expect(result.isError).toBe(true);
    const error = result.structured["error"] as {
      tag: string;
      message: string;
      issues: ReadonlyArray<unknown>;
    };
    expect(error.tag).toBe("InvalidInput");
    expect(error.message).toBe("Invalid input for telos_inspect.");
    expect(error.issues.length).toBeGreaterThan(0);
  });

  test("telos_inspect with an unknown id is LocusNotFound", async () => {
    const result = await run(
      toolNamed("telos_inspect").call({ id: "example:none" }),
    );
    expect(result.isError).toBe(true);
    expect(result.structured).toEqual({
      ok: false,
      error: {
        tag: "LocusNotFound",
        message: "No Locus example:none in the model.",
        issues: [],
      },
    });
  });

  test("telos_relations lists the incoming agent tool relation of the math Locus", async () => {
    const result = await run(
      toolNamed("telos_relations").call({ id: "example:math" }),
    );
    const output = result.structured["output"] as {
      outgoing: ReadonlyArray<{ type: string }>;
      incoming: ReadonlyArray<{ type: string }>;
    };
    expect(output.incoming.map((r) => r.type)).toContain("agent.tool");
    expect(Object.keys(output).sort()).toEqual(["incoming", "outgoing"]);
  });

  test("telos_capabilities names every capability of the math Locus, including the hidden one", async () => {
    const result = await run(
      toolNamed("telos_capabilities").call({ id: "example:math" }),
    );
    const output = result.structured["output"] as {
      capabilities: ReadonlyArray<{ name: string }>;
    };
    expect(output.capabilities.map((c) => c.name)).toEqual([
      "double",
      "secret",
    ]);
  });

  test("telos_verifications is not-run before a verify and verified or failed after it", async () => {
    const local = await Effect.runPromise(Telos.make(root));
    const verifications = introspectionTools(local).find(
      (t) => t.definition.name === "telos_verifications",
    )!;
    const before = await run(verifications.call({ id: "example:agent" }));
    const beforeList = (
      before.structured["output"] as {
        verifications: ReadonlyArray<{ knowledge: string }>;
      }
    ).verifications;
    expect(beforeList.length).toBeGreaterThan(0);
    for (const entry of beforeList) expect(entry.knowledge).toBe("not-run");

    await run(local.verify({ runner: "test" }));
    const after = await run(verifications.call({ id: "example:agent" }));
    const afterList = (
      after.structured["output"] as {
        verifications: ReadonlyArray<{ knowledge: string }>;
      }
    ).verifications;
    for (const entry of afterList) {
      expect(["verified", "failed"]).toContain(entry.knowledge);
    }
  });

  test("telos_impact lists the agent affected by a change to double", async () => {
    const result = await run(
      toolNamed("telos_impact").call({ target: "example:math#double" }),
    );
    const output = result.structured["output"] as {
      affected: ReadonlyArray<{ locus: string }>;
    };
    expect(output.affected.map((a) => a.locus)).toContain("example:agent");
  });

  test("telos_impact with an unknown capability is CapabilityNotFound", async () => {
    const result = await run(
      toolNamed("telos_impact").call({ target: "example:math#nope" }),
    );
    expect(result.structured).toEqual({
      ok: false,
      error: {
        tag: "CapabilityNotFound",
        message: "Locus example:math has no capability nope.",
        issues: [],
      },
    });
  });
});

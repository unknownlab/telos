// START_MODULE_CONTRACT
//   PURPOSE: Prove that every rule of the AgentInterface archetype has one passing and one failing model.
//   SCOPE: The four AgentInterface rules, each checked through the kernel verify with the rule id and the contract message. Out: the derivation and invocation behaviour, which tools.test.ts covers.
//   DEPENDS: M-PACK-AGENT
//   LINKS: V-M-PACK-AGENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FakeTool - a relation type with the agent.tool id that does not grant invocation
//   FakeAgent - an extension with the telos.agent id that uses AgentInterface
//   fake - an agent Locus that exposes double through FakeTool
//   other - a second Locus that also has a double capability
//   scalar - a Locus whose capability takes a number instead of an object
//   findingOf - returns the finding of one rule for the agent Locus
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import {
  Capability,
  Extension,
  Locus,
  RelationType,
  buildModel,
  verify,
} from "@telos/kernel";
import { AgentInterface } from "../src/archetype";
import { AgentSemantics, AgentTool } from "../src/semantics";
import { agent, math, withAgent } from "./fixture";

const findingOf = (model: ReturnType<typeof buildModel>, rule: string) =>
  Effect.runPromise(
    verify(model, { runner: "test", loci: ["example:agent"] }),
  ).then((report) => {
    const finding = report.findings.find((f) => f.rule === rule);
    if (finding === undefined) throw new Error(`No finding for ${rule}.`);
    return finding;
  });

const FakeTool = RelationType.make("agent.tool", {
  description: "Fake tool.",
  target: "capability",
});

const FakeAgent = Extension.make("telos.agent", {
  description: "Fake agent.",
  properties: { server: Schema.String },
  relationTypes: [FakeTool],
  archetypes: [AgentInterface],
});

const fake = Locus.extend(FakeAgent).make({
  id: "example:agent",
  properties: { server: "example-math" },
  relations: [FakeTool.to(math.capability("double"))],
});

const other = Locus.make({
  id: "example:other",
  capabilities: {
    double: Capability.make({
      description: "Doubles n too.",
      input: Schema.Struct({ n: Schema.Finite }),
      output: Schema.Struct({ value: Schema.Finite }),
      effect: "pure",
      handler: ({ n }) => Effect.succeed({ value: n * 2 }),
    }),
  },
});

const scalar = Locus.make({
  id: "example:numbers",
  capabilities: {
    scalar: Capability.make({
      description: "Takes a plain number.",
      input: Schema.Finite,
      output: Schema.Finite,
      effect: "pure",
      handler: (n) => Effect.succeed(n),
    }),
  },
});

describe("AgentInterface archetype", () => {
  test("agent.tools-exist passes when the agent exposes a tool", async () => {
    const finding = await findingOf(withAgent(agent), "agent.tools-exist");
    expect(finding.outcome).toBe("passed");
  });

  test("agent.tools-exist fails when the agent exposes no tool", async () => {
    const noTools = Locus.extend(AgentSemantics).make({
      id: "example:agent",
      properties: { server: "example-math" },
    });
    const finding = await findingOf(withAgent(noTools), "agent.tools-exist");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Agent Locus example:agent exposes no tool.");
  });

  test("agent.tool-names passes when every exposed name is unique and valid", async () => {
    const finding = await findingOf(withAgent(agent), "agent.tool-names");
    expect(finding.outcome).toBe("passed");
  });

  test("agent.tool-names fails when two targets expose the same name", async () => {
    const twice = Locus.extend(AgentSemantics).make({
      id: "example:agent",
      properties: { server: "example-math" },
      relations: [
        AgentTool.to(math.capability("double")),
        AgentTool.to(other.capability("double")),
      ],
    });
    const finding = await findingOf(
      withAgent(twice, [other]),
      "agent.tool-names",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Tool double is exposed more than once.");
  });

  test("agent.input-object passes when every tool takes an object", async () => {
    const finding = await findingOf(withAgent(agent), "agent.input-object");
    expect(finding.outcome).toBe("passed");
  });

  test("agent.input-object fails when a tool takes a scalar", async () => {
    const scalarAgent = Locus.extend(AgentSemantics).make({
      id: "example:agent",
      properties: { server: "example-math" },
      relations: [AgentTool.to(scalar.capability("scalar"))],
    });
    const finding = await findingOf(
      withAgent(scalarAgent, [scalar]),
      "agent.input-object",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Tool scalar does not take an object input.");
  });

  test("agent.invalid-input-error passes when missing input is InvalidInput", async () => {
    const finding = await findingOf(
      withAgent(agent),
      "agent.invalid-input-error",
    );
    expect(finding.outcome).toBe("passed");
  });

  test("agent.invalid-input-error fails when the tool is not granted", async () => {
    const finding = await findingOf(
      buildModel(Locus.make({ id: "example:root", contains: [math, fake] })),
      "agent.invalid-input-error",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Tool double does not answer missing input with InvalidInput.",
    );
  });
});

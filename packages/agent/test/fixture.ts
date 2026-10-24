// START_MODULE_CONTRACT
//   PURPOSE: Build the small example model that every agent test uses, with one exposed capability, one hidden capability and one agent interface.
//   SCOPE: Negative, double, secret, math, agent, root, model, withAgent. Out: any behaviour under test, which the test files assert themselves.
//   DEPENDS: M-PACK-AGENT
//   LINKS: V-M-PACK-AGENT, V-M-PACK-AGENT-MCP
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Negative - the declared error of the double capability
//   double - the exposed pure capability that doubles n
//   secret - the hidden read capability that no tool exposes
//   math - the example Locus with double and secret
//   agent - the example agent Locus exposing double
//   root - the root Locus containing math and agent
//   model - the built model of the root
//   withAgent - builds a model with a given agent Locus and extra Loci
// END_MODULE_MAP

import { Effect, Schema } from "effect";
import {
  Capability,
  Locus,
  buildModel,
  type LocusDefinition,
} from "@telos/kernel";
import { AgentSemantics, AgentTool } from "../src/semantics";

// START_CONTRACT: Negative
//   PURPOSE: The declared error of the double capability.
//   INPUTS: { message: string - what went wrong }
//   OUTPUTS: { Negative - tagged error with tag Negative }
//   SIDE_EFFECTS: none
//   LINKS: V-M-PACK-AGENT
// END_CONTRACT: Negative
export class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}

// START_CONTRACT: double
//   PURPOSE: The exposed pure capability that doubles n and fails for a negative n.
//   INPUTS: { n: number - the finite number to double }
//   OUTPUTS: { value: number - twice n }
//   SIDE_EFFECTS: none
//   LINKS: V-M-PACK-AGENT
// END_CONTRACT: double
export const double = Capability.make({
  description: "Doubles n.",
  input: Schema.Struct({ n: Schema.Finite }),
  output: Schema.Struct({ value: Schema.Finite }),
  errors: [Negative],
  effect: "pure",
  handler: ({ n }) =>
    n < 0
      ? Effect.fail(new Negative({ message: "n must not be negative." }))
      : Effect.succeed({ value: n * 2 }),
});

// START_CONTRACT: secret
//   PURPOSE: A read capability that no agent tool exposes, used to prove that discovery never grants invocation.
//   INPUTS: {}
//   OUTPUTS: { ok: boolean - always true }
//   SIDE_EFFECTS: none
//   LINKS: V-M-PACK-AGENT
// END_CONTRACT: secret
export const secret = Capability.make({
  description: "A capability that no tool exposes.",
  input: Schema.Struct({}),
  output: Schema.Struct({ ok: Schema.Boolean }),
  effect: "read",
  handler: () => Effect.succeed({ ok: true }),
});

export const math = Locus.make({
  id: "example:math",
  capabilities: { double, secret },
});

export const agent = Locus.extend(AgentSemantics).make({
  id: "example:agent",
  properties: { server: "example-math" },
  relations: [AgentTool.to(math.capability("double"))],
});

export const root = Locus.make({
  id: "example:root",
  contains: [math, agent],
});

export const model = buildModel(root);

export const withAgent = (
  agentLocus: LocusDefinition,
  extra: ReadonlyArray<LocusDefinition> = [],
) =>
  buildModel(
    Locus.make({ id: "example:root", contains: [math, agentLocus, ...extra] }),
  );

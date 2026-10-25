import { Effect, Schema } from "effect";
import {
  Capability,
  Locus,
  buildModel,
  type LocusDefinition,
} from "@telos/kernel";
import { AgentSemantics, AgentTool } from "../src/semantics";

export class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}

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

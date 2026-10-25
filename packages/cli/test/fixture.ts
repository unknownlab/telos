import { Effect, Schema } from "effect";
import {
  Capability,
  Locus,
  buildModel,
  type LocusDefinition,
} from "@telos/kernel";
import { CliCommand, CliSemantics } from "../src/semantics";

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

export const math = Locus.make({
  id: "example:math",
  capabilities: { double },
});

export const cli = Locus.extend(CliSemantics).make({
  id: "example:cli",
  properties: { program: "math" },
  relations: [CliCommand.to(math.capability("double"))],
});

export const root = Locus.make({ id: "example:root", contains: [math, cli] });

export const model = buildModel(root);

export function withCli(
  cliLocus: LocusDefinition,
  extra: ReadonlyArray<LocusDefinition> = [],
) {
  return buildModel(
    Locus.make({
      id: "example:root",
      contains: [math, cliLocus, ...extra],
    }),
  );
}

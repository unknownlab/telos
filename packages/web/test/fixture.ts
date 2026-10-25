import { Capability, Locus, buildModel } from "@telos/kernel";
import type { LocusDefinition } from "@telos/kernel";
import { Effect, Schema } from "effect";
import { WebForm, WebSemantics } from "../src/semantics";

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

export const web = Locus.extend(WebSemantics).make({
  id: "example:web",
  properties: { title: "Math" },
  relations: [WebForm.to(math.capability("double"))],
});

export const root = Locus.make({ id: "example:root", contains: [math, web] });

export const model = buildModel(root);

export const withWeb = (
  webLocus: LocusDefinition,
  extra: ReadonlyArray<LocusDefinition> = [],
) =>
  buildModel(
    Locus.make({ id: "example:root", contains: [math, webLocus, ...extra] }),
  );

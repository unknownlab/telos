// START_MODULE_CONTRACT
//   PURPOSE: Build the tiny example model that every test of the CLI Pack runs against.
//   SCOPE: The example:math Locus with its double capability, the example:cli interface Locus that exposes it, and helpers that build broken variants. Out: the Pack under test (src/) and any other Pack's fixtures.
//   DEPENDS: M-PACK-CLI
//   LINKS: M-PACK-CLI, V-M-PACK-CLI
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Negative - the declared error of double when n is negative
//   double - the example capability that doubles n
//   math - the example:math Locus that holds double
//   cli - the example:cli interface Locus that exposes math#double
//   root - the root Locus that contains math and cli
//   model - the built model of root
//   withCli - builds a model whose interface Locus is the given Locus, with optional extra Loci
// END_MODULE_MAP

import { Effect, Schema } from "effect";
import {
  Capability,
  Locus,
  buildModel,
  type LocusDefinition,
} from "@telos/kernel";
import { CliCommand, CliSemantics } from "../src/semantics";

// START_CONTRACT: Negative
//   PURPOSE: Declare the error that double fails with when n is negative.
//   INPUTS: { message: string - the failure text }
//   OUTPUTS: { Negative - a tagged error with the tag "Negative" }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: Negative
export class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}

// START_CONTRACT: double
//   PURPOSE: Provide the example capability whose input is one number.
//   INPUTS: { n: number - the number to double }
//   OUTPUTS: { { value: number } - twice n, or the Negative error }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
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

// START_CONTRACT: math
//   PURPOSE: Hold the double capability in the example:math Locus.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the example:math Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: math
export const math = Locus.make({
  id: "example:math",
  capabilities: { double },
});

// START_CONTRACT: cli
//   PURPOSE: Expose math#double through the example:cli interface Locus with the program name math.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the example:cli Locus with one cli.command relation }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: cli
export const cli = Locus.extend(CliSemantics).make({
  id: "example:cli",
  properties: { program: "math" },
  relations: [CliCommand.to(math.capability("double"))],
});

// START_CONTRACT: root
//   PURPOSE: Contain the math and cli Loci under one root.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the example:root Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: root
export const root = Locus.make({ id: "example:root", contains: [math, cli] });

// START_CONTRACT: model
//   PURPOSE: Hold the built semantic model of the fixture tree.
//   INPUTS: none
//   OUTPUTS: { SemanticModel - the model of root with no diagnostics }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: model
export const model = buildModel(root);

// START_CONTRACT: withCli
//   PURPOSE: Build a model in which the given interface Locus sits next to math and any extra Loci.
//   INPUTS: { cliLocus: LocusDefinition - the interface Locus; extra: ReadonlyArray<LocusDefinition> - more Loci to contain }
//   OUTPUTS: { SemanticModel - the built model of the example:root tree }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-CLI
// END_CONTRACT: withCli
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

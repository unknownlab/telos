// START_MODULE_CONTRACT
//   PURPOSE: Build the shared web fixture: a math capability exposed by a web interface Locus inside one model.
//   SCOPE: Fixture Loci, capabilities and the model built from them for the web tests. Out: assertions and verification runs (form.test.ts, archetype.test.ts).
//   DEPENDS: M-PACK-WEB, M-KERNEL-API
//   LINKS: M-PACK-WEB, V-M-PACK-WEB
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Negative - the declared error of the double capability for negative input
//   double - the capability that doubles a number and refuses negative input
//   math - the Locus that holds the double capability
//   web - the web interface Locus that exposes math#double as a form
//   root - the root Locus that contains math and web
//   model - the model built from root
//   withWeb - builds a model from a root that contains math, the given web Locus and extra Loci
// END_MODULE_MAP

import { Capability, Locus, buildModel } from "@telos/kernel";
import type { LocusDefinition } from "@telos/kernel";
import { Effect, Schema } from "effect";
import { WebForm, WebSemantics } from "../src/semantics";

// START_CONTRACT: Negative
//   PURPOSE: Declare the error of double for negative input.
//   INPUTS: none
//   OUTPUTS: { Negative - tagged error with the message }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: Negative
export class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}

// START_CONTRACT: double
//   PURPOSE: Give the fixture a capability with one required number field and one declared error.
//   INPUTS: none
//   OUTPUTS: { Capability - the double capability }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
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
//   PURPOSE: Hold the double capability in the Locus example:math.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the math Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: math
export const math = Locus.make({
  id: "example:math",
  capabilities: { double },
});

// START_CONTRACT: web
//   PURPOSE: Expose example:math#double as a form through the web interface Locus example:web titled Math.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the web interface Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: web
export const web = Locus.extend(WebSemantics).make({
  id: "example:web",
  properties: { title: "Math" },
  relations: [WebForm.to(math.capability("double"))],
});

// START_CONTRACT: root
//   PURPOSE: Contain the math and web Loci under example:root.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - the root Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: root
export const root = Locus.make({ id: "example:root", contains: [math, web] });

// START_CONTRACT: model
//   PURPOSE: Hold the model built from the fixture root.
//   INPUTS: none
//   OUTPUTS: { SemanticModel - the built fixture model }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: model
export const model = buildModel(root);

// START_CONTRACT: withWeb
//   PURPOSE: Build a model whose root contains math, the given web Locus and the extra Loci.
//   INPUTS: { webLocus: LocusDefinition - the web interface Locus; extra: ReadonlyArray<LocusDefinition> - more Loci to contain }
//   OUTPUTS: { SemanticModel - the built model }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: withWeb
export const withWeb = (
  webLocus: LocusDefinition,
  extra: ReadonlyArray<LocusDefinition> = [],
) =>
  buildModel(
    Locus.make({ id: "example:root", contains: [math, webLocus, ...extra] }),
  );

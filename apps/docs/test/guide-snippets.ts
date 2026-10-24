// START_MODULE_CONTRACT
//   PURPOSE: Hold the real, compiled code that the first-locus guide quotes, so that every TypeScript block of that guide is code the typecheck and a test run.
//   SCOPE: The demo Loci, extension, composed kind, capability, model and inspect program of the first-locus guide, each inside a named region. It never reads files and never runs at import beyond building the frozen definitions and the model.
//   DEPENDS: M-KERNEL-API
//   LINKS: M-DOCS-CONTENT, V-M-DOCS-CONTENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   hello - the smallest complete Locus, demo:hello
//   Greeting - the demo.greeting extension with a greeting property
//   Greeter - the Locus kind composed from Purpose and Greeting
//   greet - the greet capability of demo:greeter
//   greeter - the demo:greeter Locus of kind Greeter with the greet capability
//   demo - the demo:app root Locus that contains hello and greeter
//   demoModel - the semantic model built from demo
//   inspectGreeter - the program that resolves demo:greeter and inspects it
// END_MODULE_MAP

import { Effect, Schema } from "effect";
import {
  Capability,
  Extension,
  Locus,
  Purpose,
  Telos,
  buildModel,
} from "@telos/kernel";

// START_BLOCK_GUIDE_FIRST_LOCUS
export const hello = Locus.make({
  id: "demo:hello",
  description: "The smallest complete Locus: an identity and a description.",
});
// END_BLOCK_GUIDE_FIRST_LOCUS

// START_BLOCK_GUIDE_EXTENSION
export const Greeting = Extension.make("demo.greeting", {
  description: "Gives a Locus the greeting it answers with.",
  properties: { greeting: Schema.String },
});
// END_BLOCK_GUIDE_EXTENSION

// START_BLOCK_GUIDE_COMPOSITION
export const Greeter = Locus.extend(Purpose, Greeting);
// END_BLOCK_GUIDE_COMPOSITION

// START_BLOCK_GUIDE_CAPABILITY
export const greet = Capability.make({
  description: "Greets a person by name.",
  input: Schema.Struct({ name: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
  effect: "pure",
  handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}.` }),
});

export const greeter = Greeter.make({
  id: "demo:greeter",
  description: "Answers with a greeting.",
  properties: { purpose: "Greet people by name.", greeting: "Hello" },
  capabilities: { greet },
});
// END_BLOCK_GUIDE_CAPABILITY

// START_BLOCK_GUIDE_MODEL
export const demo = Locus.make({ id: "demo:app", contains: [hello, greeter] });
export const demoModel = buildModel(demo);
// END_BLOCK_GUIDE_MODEL

// START_BLOCK_GUIDE_INSPECT
export const inspectGreeter = Effect.gen(function* () {
  const telos = yield* Telos;
  const view = yield* telos.resolve("demo:greeter");
  return yield* view.inspect();
}).pipe(Effect.provide(Telos.layer(demo)));
// END_BLOCK_GUIDE_INSPECT

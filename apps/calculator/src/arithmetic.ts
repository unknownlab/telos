import { Effect, Schema } from "effect";
import { Capability, Extension, Locus, Purpose } from "@telos/kernel";
import { ArithmeticBehavior } from "./archetypes";
import {
  DIVISION_BY_ZERO_MESSAGE,
  DivisionByZero,
  NON_FINITE_MESSAGE,
  NonFiniteResult,
} from "./errors";

const finite = (r: number) =>
  Number.isFinite(r)
    ? Effect.succeed({ result: r })
    : Effect.fail(new NonFiniteResult({ message: NON_FINITE_MESSAGE }));

export const Operands = Schema.Struct({
  a: Schema.Finite,
  b: Schema.Finite,
});

export const Result = Schema.Struct({
  result: Schema.Finite,
});

export const Arithmetic = Extension.make("calculator.arithmetic", {
  description:
    "Marks a Locus that performs binary arithmetic on finite numbers.",
  archetypes: [ArithmeticBehavior],
});

export const add = Capability.make({
  description: "Adds b to a.",
  input: Operands,
  output: Result,
  errors: [NonFiniteResult],
  effect: "pure",
  handler: ({ a, b }) => finite(a + b),
});

export const subtract = Capability.make({
  description: "Subtracts b from a.",
  input: Operands,
  output: Result,
  errors: [NonFiniteResult],
  effect: "pure",
  handler: ({ a, b }) => finite(a - b),
});

export const multiply = Capability.make({
  description: "Multiplies a by b.",
  input: Operands,
  output: Result,
  errors: [NonFiniteResult],
  effect: "pure",
  handler: ({ a, b }) => finite(a * b),
});

export const divide = Capability.make({
  description: "Divides a by b.",
  input: Operands,
  output: Result,
  errors: [DivisionByZero, NonFiniteResult],
  effect: "pure",
  handler: ({ a, b }) =>
    b === 0
      ? Effect.fail(new DivisionByZero({ message: DIVISION_BY_ZERO_MESSAGE }))
      : finite(a / b),
});

export const arithmetic = Locus.extend(Purpose, Arithmetic).make({
  id: "calculator:arithmetic",
  description: "The single arithmetic implementation of the calculator.",
  properties: {
    //@unknownhero wtf is this ?
    purpose: "Performs the four basic arithmetic operations on finite numbers.",
    responsibilities: [
      "add",
      "subtract",
      "multiply",
      "divide",
      "report division by zero and non-finite results",
    ],
    excluded: ["parsing text input", "presentation"], //@unknownhero why ? we cant describe all excludes, no sense
  },
  capabilities: { add, subtract, multiply, divide }, //@unknownhero too abstract, still must be more functional and composition, think as graph deps, not extension everything to everything
});

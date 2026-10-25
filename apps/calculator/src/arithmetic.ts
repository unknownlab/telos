// START_MODULE_CONTRACT
//   PURPOSE: Define the one arithmetic Locus of the calculator with its four pure capabilities and its extension.
//   SCOPE: The input and output schemas, the four capabilities, the Arithmetic extension and the arithmetic Locus definition. It never parses text, never formats output and never imports the Packs.
//   DEPENDS: M-KERNEL-API, M-CALC-ARITHMETIC
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Operands - the input schema of a binary operation with two finite numbers
//   Result - the output schema of a binary operation with one finite number
//   Arithmetic - the extension that marks a Locus that performs binary arithmetic
//   add - the capability that adds b to a
//   subtract - the capability that subtracts b from a
//   multiply - the capability that multiplies a by b
//   divide - the capability that divides a by b and fails on a zero divisor
//   arithmetic - the calculator:arithmetic Locus with its four capabilities
// END_MODULE_MAP

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

// START_CONTRACT: Operands
//   PURPOSE: The input of a binary operation: two finite numbers a and b.
//   INPUTS: none
//   OUTPUTS: { Schema.Struct - { a: finite number, b: finite number } }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: Operands
//
// START_CONTRACT: Result
//   PURPOSE: The output of a binary operation: one finite number.
//   INPUTS: none
//   OUTPUTS: { Schema.Struct - { result: finite number } }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: Result
//
// START_CONTRACT: Arithmetic
//   PURPOSE: Mark a Locus that performs binary arithmetic on finite numbers, and carry ArithmeticBehavior.
//   INPUTS: none
//   OUTPUTS: { Extension - the calculator.arithmetic extension }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: Arithmetic
//
// START_CONTRACT: add
//   PURPOSE: Add b to a.
//   INPUTS: { input: Operands - the operands a and b }
//   OUTPUTS: { Capability - pure, returns { result: a + b } or fails with NonFiniteResult }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: add
//
// START_CONTRACT: subtract
//   PURPOSE: Subtract b from a.
//   INPUTS: { input: Operands - the operands a and b }
//   OUTPUTS: { Capability - pure, returns { result: a - b } or fails with NonFiniteResult }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: subtract
//
// START_CONTRACT: multiply
//   PURPOSE: Multiply a by b.
//   INPUTS: { input: Operands - the operands a and b }
//   OUTPUTS: { Capability - pure, returns { result: a * b } or fails with NonFiniteResult }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: multiply
//
// START_CONTRACT: divide
//   PURPOSE: Divide a by b; a zero divisor, including -0, fails before any division.
//   INPUTS: { input: Operands - the operands a and b }
//   OUTPUTS: { Capability - pure, returns { result: a / b }, fails with DivisionByZero when b is 0 or NonFiniteResult }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: divide
//
// START_CONTRACT: arithmetic
//   PURPOSE: The single arithmetic Locus of the calculator, with its purpose and its four capabilities.
//   INPUTS: none
//   OUTPUTS: { LocusDefinition - calculator:arithmetic of kind Purpose + Arithmetic }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: arithmetic

// START_BLOCK_ARITHMETIC_LOCUS
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
// END_BLOCK_ARITHMETIC_LOCUS

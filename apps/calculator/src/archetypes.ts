// START_MODULE_CONTRACT
//   PURPOSE: Define the ArithmeticBehavior archetype that checks an arithmetic Locus offers exactly the four pure operations with the documented results and errors.
//   SCOPE: The five ArithmeticBehavior rules and their checks. It never defines capabilities and never imports ./arithmetic, which would be a cycle.
//   DEPENDS: M-KERNEL-API
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ArithmeticBehavior - the archetype applied to calculator.arithmetic Loci with its five rules
// END_MODULE_MAP

import { Effect } from "effect";
import {
  Archetype,
  CapabilityRef,
  Rule,
  invoke,
  jsonEqual,
  violation,
  type RuleContext,
} from "@telos/kernel";
import { DIVISION_BY_ZERO_MESSAGE } from "./errors";

const EXPECTED_OPERATIONS = ["add", "divide", "multiply", "subtract"];

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const invokeCapability = (ctx: RuleContext, name: string, input: unknown) =>
  invoke(ctx.model, CapabilityRef.make(ctx.locus.id, name), input, {
    via: ctx.locus.id,
  });

const EXAMPLES: ReadonlyArray<
  readonly [name: string, input: unknown, expected: unknown]
> = [
  ["add", { a: 2, b: 3 }, { result: 5 }],
  ["subtract", { a: 5, b: 3 }, { result: 2 }],
  ["multiply", { a: 4, b: 2.5 }, { result: 10 }],
  ["divide", { a: 7, b: 2 }, { result: 3.5 }],
];

// START_CONTRACT: ArithmeticBehavior
//   PURPOSE: Check that an arithmetic Locus offers add, divide, multiply and subtract, that they are pure, that the documented examples hold, and that errors are reported with their tags and messages.
//   INPUTS: none
//   OUTPUTS: { Archetype - calculator.arithmetic-behavior with five rules applied to calculator.arithmetic }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: ArithmeticBehavior
export const ArithmeticBehavior = Archetype.make({
  id: "calculator.arithmetic-behavior",
  description:
    "Checks that an arithmetic Locus offers the four pure operations with correct results and errors.",
  appliesTo: ["calculator.arithmetic"],
  rules: [
    Rule.make({
      id: "arithmetic.operations",
      description:
        "The Locus offers exactly add, divide, multiply and subtract.",
      method: "static",
      check: (ctx) => {
        const names = Object.keys(ctx.locus.capabilities).sort(byCodeUnit);
        return names.join(", ") === EXPECTED_OPERATIONS.join(", ")
          ? Effect.void
          : violation(
              `Locus ${ctx.locus.id} offers ${names.join(", ")} instead of ${EXPECTED_OPERATIONS.join(", ")}.`,
            );
      },
    }),
    Rule.make({
      id: "arithmetic.pure",
      description: "Every arithmetic capability is pure.",
      method: "static",
      check: (ctx) => {
        const names = Object.keys(ctx.locus.capabilities).sort(byCodeUnit);
        const impure = names.find(
          (name) => ctx.locus.capabilities[name]?.effect !== "pure",
        );
        return impure === undefined
          ? Effect.void
          : violation(`Capability ${ctx.locus.id}#${impure} is not pure.`);
      },
    }),
    Rule.make({
      id: "arithmetic.examples",
      description: "The four operations give the documented example results.",
      method: "execution",
      check: (ctx) =>
        Effect.gen(function* () {
          for (const [name, input, expected] of EXAMPLES) {
            const outcome = yield* invokeCapability(ctx, name, input);
            if (!outcome.ok || !jsonEqual(outcome.output, expected)) {
              yield* violation(
                `${name} ${JSON.stringify(input)} did not give ${JSON.stringify(expected)}.`,
              );
            }
          }
        }),
    }),
    Rule.make({
      id: "arithmetic.division-by-zero",
      description:
        "Dividing by zero fails with DivisionByZero and its message.",
      method: "execution",
      check: (ctx) =>
        Effect.gen(function* () {
          const input = { a: 1, b: 0 };
          const outcome = yield* invokeCapability(ctx, "divide", input);
          const passes =
            !outcome.ok &&
            outcome.error.tag === "DivisionByZero" &&
            outcome.error.message === DIVISION_BY_ZERO_MESSAGE;
          if (!passes) {
            yield* violation(
              `divide ${JSON.stringify(input)} did not fail with DivisionByZero.`,
            );
          }
        }),
    }),
    Rule.make({
      id: "arithmetic.non-finite",
      description: "A result that is not finite fails with NonFiniteResult.",
      method: "execution",
      check: (ctx) =>
        Effect.gen(function* () {
          const input = { a: 1e308, b: 10 };
          const outcome = yield* invokeCapability(ctx, "multiply", input);
          if (outcome.ok || outcome.error.tag !== "NonFiniteResult") {
            yield* violation(
              `multiply ${JSON.stringify(input)} did not fail with NonFiniteResult.`,
            );
          }
        }),
    }),
  ],
});

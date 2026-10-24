// START_MODULE_CONTRACT
//   PURPOSE: Prove that each arithmetic capability returns the documented results and errors through invoke, and that the arithmetic Locus builds without diagnostics or composition conflicts.
//   SCOPE: Tests of the four capabilities, both declared errors, input rejection and the Locus properties. Out: the archetype rules (archetypes.test.ts) and the NFR-008 size check (ergonomics.test.ts).
//   DEPENDS: M-CALC-ARITHMETIC, M-KERNEL-API
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Operation - the names of the four arithmetic capabilities
//   model - the built model of the arithmetic Locus
//   run - invokes one arithmetic capability through the calculator:arithmetic Locus
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { buildModel, invoke, type InvocationOutcome } from "@telos/kernel";
import { arithmetic } from "../src/arithmetic";
import { DIVISION_BY_ZERO_MESSAGE, NON_FINITE_MESSAGE } from "../src/errors";

const model = buildModel(arithmetic);

type Operation = "add" | "subtract" | "multiply" | "divide";

const run = (name: Operation, input: unknown): Promise<InvocationOutcome> =>
  Effect.runPromise(
    invoke(model, arithmetic.capability(name), input, {
      via: "calculator:arithmetic",
    }),
  );

describe("calculator:arithmetic model", () => {
  test("builds with no diagnostics and no composition conflicts", () => {
    expect(model.diagnostics).toEqual([]);
    expect(arithmetic.kind.conflicts).toEqual([]);
  });

  test("properties equal the contract values", () => {
    expect(arithmetic.properties).toEqual({
      purpose:
        "Performs the four basic arithmetic operations on finite numbers.",
      responsibilities: [
        "add",
        "subtract",
        "multiply",
        "divide",
        "report division by zero and non-finite results",
      ],
      excluded: ["parsing text input", "presentation"],
    });
  });

  test("the four capabilities have the contract descriptions and are pure", () => {
    expect(arithmetic.capabilities.add.description).toBe("Adds b to a.");
    expect(arithmetic.capabilities.subtract.description).toBe(
      "Subtracts b from a.",
    );
    expect(arithmetic.capabilities.multiply.description).toBe(
      "Multiplies a by b.",
    );
    expect(arithmetic.capabilities.divide.description).toBe("Divides a by b.");
    for (const name of ["add", "subtract", "multiply", "divide"]) {
      expect(arithmetic.capabilities[name as "add"].effect).toBe("pure");
    }
  });
});

describe("calculator:arithmetic capabilities", () => {
  test("add returns the sum", async () => {
    expect(await run("add", { a: 2, b: 3 })).toEqual({
      ok: true,
      output: { result: 5 },
    });
  });

  test("subtract returns the difference", async () => {
    expect(await run("subtract", { a: 5, b: 3 })).toEqual({
      ok: true,
      output: { result: 2 },
    });
  });

  test("multiply returns the product", async () => {
    expect(await run("multiply", { a: 4, b: 2.5 })).toEqual({
      ok: true,
      output: { result: 10 },
    });
  });

  test("divide returns the quotient", async () => {
    expect(await run("divide", { a: 7, b: 2 })).toEqual({
      ok: true,
      output: { result: 3.5 },
    });
  });

  test("divide by zero fails with DivisionByZero, also for -0", async () => {
    const expected: InvocationOutcome = {
      ok: false,
      error: {
        tag: "DivisionByZero",
        message: "Division by zero is not defined.",
        issues: [],
      },
    };
    expect(DIVISION_BY_ZERO_MESSAGE).toBe("Division by zero is not defined.");
    expect(await run("divide", { a: 1, b: 0 })).toEqual(expected);
    expect(await run("divide", { a: 0, b: 0 })).toEqual(expected);
    expect(await run("divide", { a: 1, b: -0 })).toEqual(expected);
  });

  test("multiply overflowing to Infinity fails with NonFiniteResult", async () => {
    expect(await run("multiply", { a: 1e308, b: 10 })).toEqual({
      ok: false,
      error: {
        tag: "NonFiniteResult",
        message: "The result is not a finite number.",
        issues: [],
      },
    });
  });

  test("add overflowing to Infinity fails with NonFiniteResult", async () => {
    const outcome = await run("add", { a: 1e308, b: 1e308 });
    expect(outcome).toEqual({
      ok: false,
      error: {
        tag: "NonFiniteResult",
        message: NON_FINITE_MESSAGE,
        issues: [],
      },
    });
  });

  test("a text operand is rejected as InvalidInput with path a", async () => {
    const outcome = await run("add", { a: "x", b: 1 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.tag).toBe("InvalidInput");
    expect(outcome.error.issues.map((issue) => issue.path)).toEqual([["a"]]);
  });

  test("a missing operand is rejected as InvalidInput with path b", async () => {
    const outcome = await run("add", { a: 1 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.tag).toBe("InvalidInput");
    expect(outcome.error.issues.map((issue) => issue.path)).toEqual([["b"]]);
  });
});

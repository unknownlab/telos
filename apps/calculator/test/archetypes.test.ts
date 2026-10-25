import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  Capability,
  Locus,
  Purpose,
  buildModel,
  verify,
  type Finding,
} from "@telos/kernel";
import { ArithmeticBehavior } from "../src/archetypes";
import {
  Arithmetic,
  Operands,
  Result,
  add,
  arithmetic,
  divide,
  multiply,
} from "../src/arithmetic";
import { DivisionByZero, NonFiniteResult } from "../src/errors";

const ARCHETYPE = "calculator.arithmetic-behavior";

const findingOf = (locus: unknown, rule: string): Finding => {
  const report = Effect.runSync(
    verify(buildModel(locus as never), { runner: "test" }),
  );
  const found = report.findings.find(
    (finding) => finding.archetype === ARCHETYPE && finding.rule === rule,
  );
  if (found === undefined) throw new Error(`no finding for ${rule}`);
  return found;
};

const variant = (capabilities: Record<string, Capability>) =>
  Locus.extend(Purpose, Arithmetic).make({
    id: "calculator:arithmetic",
    description: "A broken arithmetic Locus for a test.",
    properties: arithmetic.properties as never,
    capabilities,
  });

describe("ArithmeticBehavior on calculator:arithmetic", () => {
  test("every rule passes on the real arithmetic Locus", () => {
    const report = Effect.runSync(
      verify(buildModel(arithmetic), { runner: "test" }),
    );
    const own = report.findings.filter(
      (finding) => finding.archetype === ARCHETYPE,
    );
    expect(own.length).toBe(ArithmeticBehavior.rules.length);
    for (const finding of own) {
      expect(finding.outcome).toBe("passed");
    }
  });

  test("arithmetic.operations fails when only add is offered", () => {
    const finding = findingOf(variant({ add }), "arithmetic.operations");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Locus calculator:arithmetic offers add instead of add, divide, multiply, subtract.",
    );
  });

  test("arithmetic.pure fails when add is a write capability", () => {
    const writeAdd = { ...add, effect: "write" as const };
    const finding = findingOf(
      variant({
        add: writeAdd,
        subtract: arithmetic.capabilities.subtract,
        multiply,
        divide,
      }),
      "arithmetic.pure",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Capability calculator:arithmetic#add is not pure.",
    );
  });

  test("arithmetic.examples fails when add returns a wrong result", () => {
    const wrongAdd = Capability.make({
      description: "Adds b to a.",
      input: Operands,
      output: Result,
      errors: [NonFiniteResult],
      effect: "pure",
      handler: ({ a, b }) => Effect.succeed({ result: a + b + 1 }),
    });
    const finding = findingOf(
      variant({
        add: wrongAdd,
        subtract: arithmetic.capabilities.subtract,
        multiply,
        divide,
      }),
      "arithmetic.examples",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      'add {"a":2,"b":3} did not give {"result":5}.',
    );
  });

  test("arithmetic.division-by-zero fails when divide has no zero check", () => {
    const uncheckedDivide = Capability.make({
      description: "Divides a by b.",
      input: Operands,
      output: Result,
      errors: [DivisionByZero, NonFiniteResult],
      effect: "pure",
      handler: ({ a, b }) => Effect.succeed({ result: a / b }),
    });
    const finding = findingOf(
      variant({
        add,
        subtract: arithmetic.capabilities.subtract,
        multiply,
        divide: uncheckedDivide,
      }),
      "arithmetic.division-by-zero",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      'divide {"a":1,"b":0} did not fail with DivisionByZero.',
    );
  });

  test("arithmetic.non-finite fails when multiply has no finite check", () => {
    const uncheckedMultiply = Capability.make({
      description: "Multiplies a by b.",
      input: Operands,
      output: Result,
      errors: [NonFiniteResult],
      effect: "pure",
      handler: ({ a, b }) => Effect.succeed({ result: a * b }),
    });
    const finding = findingOf(
      variant({
        add,
        subtract: arithmetic.capabilities.subtract,
        multiply: uncheckedMultiply,
        divide,
      }),
      "arithmetic.non-finite",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      'multiply {"a":1e+308,"b":10} did not fail with NonFiniteResult.',
    );
  });
});

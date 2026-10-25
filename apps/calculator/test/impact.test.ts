import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import {
  Capability,
  Locus,
  Purpose,
  buildModel,
  diffModels,
  impact,
} from "@telos/kernel";
import { CliCommand, CliSemantics, CliInterface } from "@telos/cli";
import { WebInterface } from "@telos/web";
import { AgentInterface } from "@telos/agent";
import {
  Arithmetic,
  Operands,
  arithmetic,
  divide,
  multiply,
  subtract,
} from "../src/arithmetic";
import { ArithmeticBehavior } from "../src/archetypes";
import { NonFiniteResult } from "../src/errors";
import { CalculatorInterfaces, app, makeApp } from "../src/app";
import { interfaceLoci } from "../src/interfaces";

const TARGET = "calculator:arithmetic#add";
const EXPECTED_AFFECTED = [
  "calculator:agent",
  "calculator:cli",
  "calculator:web",
];

const checksOf = (report: ReturnType<typeof impact>): ReadonlyArray<string> =>
  report.checks.map(
    (check) => `${check.locus}|${check.archetype}|${check.rule}`,
  );

const sumAdd = Capability.make({
  description: "Adds b to a.",
  input: Operands,
  output: Schema.Struct({ sum: Schema.Finite }),
  errors: [NonFiniteResult],
  effect: "pure",
  handler: ({ a, b }) => Effect.succeed({ sum: a + b }),
});

const variantArithmetic = Locus.extend(Purpose, Arithmetic).make({
  id: "calculator:arithmetic",
  description: "The single arithmetic implementation of the calculator.",
  properties: {
    purpose: "Performs the four basic arithmetic operations on finite numbers.",
    responsibilities: [
      "add",
      "subtract",
      "multiply",
      "divide",
      "report division by zero and non-finite results",
    ],
    excluded: ["parsing text input", "presentation"],
  },
  capabilities: { add: sumAdd, subtract, multiply, divide },
});

describe("impact of the calculator", () => {
  test("a change to add affects exactly the three interfaces at distance 1", () => {
    const report = impact(buildModel(app), TARGET);
    const loci = report.affected.map((entry) => entry.locus).sort();
    expect(loci).toEqual(EXPECTED_AFFECTED);
    for (const entry of report.affected) expect(entry.distance).toBe(1);
  });

  test("the checks cover the rules of each Archetype on its locus", () => {
    const checks = checksOf(impact(buildModel(app), TARGET));
    const expectations: ReadonlyArray<
      readonly [string, { id: string; rules: ReadonlyArray<{ id: string }> }]
    > = [
      ["calculator:cli", CliInterface],
      ["calculator:web", WebInterface],
      ["calculator:agent", AgentInterface],
      ["calculator:arithmetic", ArithmeticBehavior],
      ["calculator:app", CalculatorInterfaces],
    ];
    for (const [locus, archetype] of expectations) {
      for (const rule of archetype.rules) {
        expect(checks).toContain(`${locus}|${archetype.id}|${rule.id}`);
      }
    }
  });

  test("diffModels reports one contract change for add", async () => {
    const variant = makeApp([
      variantArithmetic,
      ...interfaceLoci(variantArithmetic),
    ]);
    const changes = await Effect.runPromise(
      diffModels(buildModel(app), buildModel(variant)),
    );
    const contract = changes.filter(
      (change) => change.kind === "contract-changed",
    );
    expect(contract.length).toBe(1);
    expect(contract[0]!.locus).toBe("calculator:arithmetic");
    expect(contract[0]!.capability).toBe("add");
    expect(contract[0]!.patch.length).toBeGreaterThan(0);
  });

  test("a new interface Locus is affected by add without any source change (US6.3)", () => {
    const extra = Locus.extend(CliSemantics).make({
      id: "calculator:extra",
      description: "An extra command line for a test.",
      properties: { program: "extra" },
      relations: [CliCommand.to(arithmetic.capability("add"))],
    });
    const model = buildModel(makeApp([...app.contains, extra]));
    const affected = impact(model, TARGET).affected.map((entry) => entry.locus);
    expect(affected).toContain("calculator:extra");
  });
});

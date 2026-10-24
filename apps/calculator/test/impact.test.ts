// START_MODULE_CONTRACT
//   PURPOSE: Prove that a change to the add capability affects exactly the three interfaces, that the checks cover their Archetypes, that diffModels reports a contract change, and that a new interface Locus is found by impact.
//   SCOPE: impact and diffModels on calculatorModel and on makeApp variants. Out: the archetype rules and the verify findings (verification.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-CALC-ARITHMETIC, M-KERNEL-API, M-PACK-CLI, M-PACK-WEB, M-PACK-AGENT
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   TARGET - the impact target, the add capability of the arithmetic Locus
//   EXPECTED_AFFECTED - the Loci that must be affected at distance 1
//   checksOf - the (locus, archetype, rule) triples of an impact report
//   sumAdd - an add capability whose output is { sum }
//   variantArithmetic - an arithmetic Locus whose add has the { sum } output
// END_MODULE_MAP

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
  add,
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

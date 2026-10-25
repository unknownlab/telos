import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { verify } from "@telos/kernel";
import { AgentInterface } from "@telos/agent";
import { CliInterface } from "@telos/cli";
import { WebInterface } from "@telos/web";
import { ArithmeticBehavior } from "../src/archetypes";
import { CalculatorInterfaces, calculatorModel } from "../src/app";

const ARCHETYPES = [
  ArithmeticBehavior,
  CliInterface,
  WebInterface,
  AgentInterface,
  CalculatorInterfaces,
];

const APPLICABLE = ARCHETYPES.flatMap((archetype) =>
  archetype.rules.map((rule) => ({ archetype: archetype.id, rule: rule.id })),
);

const report = await Effect.runPromise(
  verify(calculatorModel, { runner: "test" }),
);

describe("verification of the calculator model", () => {
  test("no finding fails or errors", () => {
    expect(report.summary.failed).toBe(0);
    expect(report.summary.error).toBe(0);
  });

  test("every rule of every applicable archetype has a finding", () => {
    for (const pair of APPLICABLE) {
      const found = report.findings.some(
        (finding) =>
          finding.archetype === pair.archetype && finding.rule === pair.rule,
      );
      expect(found).toBe(true);
    }
  });
});

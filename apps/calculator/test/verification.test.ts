// START_MODULE_CONTRACT
//   PURPOSE: Prove that verifying the calculator model passes with no failed or errored findings and reports a finding for every rule of every Archetype that applies.
//   SCOPE: The full verify run over calculatorModel. Out: the rule-level pass and failure cases (archetypes.test.ts, app.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-KERNEL-API, M-PACK-CLI, M-PACK-WEB, M-PACK-AGENT
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ARCHETYPES - the five archetypes that apply to the calculator
//   APPLICABLE - the (archetype id, rule id) pairs of the five archetypes of the calculator
//   report - the verify report of calculatorModel
// END_MODULE_MAP

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

// START_MODULE_CONTRACT
//   PURPOSE: Prove that each CalculatorInterfaces rule passes on the real app and fails with its exact message on a broken app variant.
//   SCOPE: The three CalculatorInterfaces rules verified on calculator:app and on makeApp variants. Out: the shared case table (interfaces.test.ts) and the other Archetypes (verification.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-CALC-ARITHMETIC, M-PACK-CLI, M-PACK-WEB, M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ARCHETYPE - the id of the CalculatorInterfaces archetype
//   APP - the id of the app Locus
//   findingOf - the verify finding of one CalculatorInterfaces rule on the app
//   fakeDivide - a divide capability whose zero case fails with a different message
//   fake - a plain Locus that disagrees with the arithmetic Locus on divide
//   webDeclaringAdd - a web Locus that declares its own capability
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  Capability,
  Locus,
  Purpose,
  buildModel,
  verify,
  type Finding,
  type LocusDefinition,
} from "@telos/kernel";
import { WebSemantics } from "@telos/web";
import {
  add,
  arithmetic,
  multiply,
  subtract,
  Operands,
  Result,
} from "../src/arithmetic";
import { DivisionByZero } from "../src/errors";
import { CalculatorInterfaces, app, makeApp } from "../src/app";
import {
  calculatorAgent,
  calculatorCli,
  calculatorWeb,
  interfaceLoci,
} from "../src/interfaces";

const ARCHETYPE = CalculatorInterfaces.id;
const APP = "calculator:app";

const findingOf = async (
  root: LocusDefinition,
  rule: string,
): Promise<Finding> => {
  const report = await Effect.runPromise(
    verify(buildModel(root), { runner: "test", loci: [APP] }),
  );
  const found = report.findings.find(
    (finding) =>
      finding.archetype === ARCHETYPE &&
      finding.rule === rule &&
      finding.locus === APP,
  );
  if (found === undefined) throw new Error(`no finding for ${rule}`);
  return found;
};

const fakeDivide = Capability.make({
  description: "Divides a by b, with a different zero message.",
  input: Operands,
  output: Result,
  errors: [DivisionByZero],
  effect: "pure",
  handler: ({ a, b }) =>
    b === 0
      ? Effect.fail(new DivisionByZero({ message: "Nope." }))
      : Effect.succeed({ result: a / b }),
});

const fake = Locus.extend(Purpose).make({
  id: "calculator:fake",
  description: "A stand-in arithmetic Locus that disagrees on divide.",
  properties: { purpose: "Disagrees with the arithmetic Locus on divide." },
  capabilities: { add, subtract, multiply, divide: fakeDivide },
});

const webDeclaringAdd = Locus.extend(WebSemantics).make({
  id: "calculator:web",
  description: "A web interface that declares its own capability.",
  properties: { title: "Calculator" },
  capabilities: { add },
});

describe("CalculatorInterfaces on calculator:app", () => {
  test("every rule passes on the real app", async () => {
    for (const rule of [
      "interfaces.complete",
      "interfaces.single-implementation",
      "interfaces.parity",
    ]) {
      expect((await findingOf(app, rule)).outcome).toBe("passed");
    }
  });

  test("interfaces.complete fails when the cli lacks divide", async () => {
    const cliVariant = interfaceLoci(arithmetic, [
      "add",
      "subtract",
      "multiply",
    ])[0]!;
    const finding = await findingOf(
      makeApp([arithmetic, cliVariant, calculatorWeb, calculatorAgent]),
      "interfaces.complete",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Interface calculator:cli does not expose calculator:arithmetic#divide.",
    );
  });

  test("interfaces.complete fails when the web lacks divide (US5.2)", async () => {
    const webVariant = interfaceLoci(arithmetic, [
      "add",
      "subtract",
      "multiply",
    ])[1]!;
    const finding = await findingOf(
      makeApp([arithmetic, calculatorCli, webVariant, calculatorAgent]),
      "interfaces.complete",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Interface calculator:web does not expose calculator:arithmetic#divide.",
    );
  });

  test("interfaces.single-implementation fails when the web declares a capability", async () => {
    const finding = await findingOf(
      makeApp([arithmetic, calculatorCli, webDeclaringAdd, calculatorAgent]),
      "interfaces.single-implementation",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Locus calculator:web declares a capability, but only calculator:arithmetic may implement capabilities.",
    );
  });

  test("interfaces.parity fails when the cli disagrees on divide", async () => {
    const finding = await findingOf(
      makeApp([
        arithmetic,
        interfaceLoci(fake)[0]!,
        calculatorWeb,
        calculatorAgent,
        fake,
      ]),
      "interfaces.parity",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      'Interfaces disagree on divide {"a":"1","b":"0"}: calculator:cli.',
    );
  });
});

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { Archetype, violation, type Rule } from "../src/archetype";
import { Extension } from "../src/extension";
import { Locus } from "../src/locus";
import { buildModel, type SemanticModel } from "../src/model";
import {
  applicableArchetypes,
  verify,
  type Finding,
  type VerificationReport,
  type VerifyOptions,
} from "../src/verify";

const FIXED_TIME = "2026-01-01T00:00:00.000Z";
const fixedNow = () => new Date(FIXED_TIME);

const rulePass: Rule = {
  id: "r.pass",
  description: "always passes",
  method: "static",
  check: () => Effect.void,
};
const ruleFail: Rule = {
  id: "r.fail",
  description: "always fails",
  method: "static",
  check: () => violation("bad thing."),
};
const ruleDie: Rule = {
  id: "r.die",
  description: "dies as a defect",
  method: "execution",
  check: () => Effect.die("boom"),
};
const ruleThrow: Rule = {
  id: "r.throw",
  description: "throws before returning an Effect",
  method: "execution",
  check: (() => {
    throw new Error("thrown");
  }) as unknown as Rule["check"],
};
const ruleBoth: Rule = {
  id: "r.both",
  description: "passes for both extensions",
  method: "static",
  check: () => Effect.void,
};

const archetypeA = Archetype.make({
  id: "test.arch-a",
  description: "rules for test.a",
  appliesTo: ["test.a"],
  rules: [rulePass, ruleFail, ruleDie, ruleThrow],
});
const archetypeAB = Archetype.make({
  id: "test.arch-ab",
  description: "rules for test.a and test.b",
  appliesTo: ["test.a", "test.b"],
  rules: [ruleBoth],
});

const extA = Extension.make("test.a", {
  description: "extension A",
  archetypes: [archetypeA, archetypeAB],
});
const extB = Extension.make("test.b", { description: "extension B" });

const locusA = Locus.extend(extA).make({ id: "app:a" });
const locusAB = Locus.extend(extA, extB).make({ id: "app:ab" });
const locusNone = Locus.make({ id: "app:none" });
const root = Locus.make({
  id: "app:root",
  contains: [locusA, locusAB, locusNone],
});
const model: SemanticModel = buildModel(root);

function runWith(
  target: SemanticModel,
  options: Partial<VerifyOptions> = {},
): VerificationReport {
  return Effect.runSync(
    verify(target, { runner: "bun test", now: fixedNow, ...options }),
  );
}

function findingKeys(
  report: VerificationReport,
): ReadonlyArray<ReadonlyArray<string>> {
  return report.findings.map((f) => [f.locus, f.archetype, f.rule]);
}

function findOne(
  report: VerificationReport,
  locus: string,
  rule: string,
): Finding {
  const found = report.findings.filter(
    (f) => f.locus === locus && f.rule === rule,
  );
  expect(found).toHaveLength(1);
  return found[0]!;
}

describe("applicableArchetypes", () => {
  test("app:a gets only the archetype whose extensions it has", () => {
    expect(applicableArchetypes(model, "app:a").map((a) => a.id)).toEqual([
      "test.arch-a",
    ]);
  });

  test("app:ab gets both archetypes, sorted by id", () => {
    expect(applicableArchetypes(model, "app:ab").map((a) => a.id)).toEqual([
      "test.arch-a",
      "test.arch-ab",
    ]);
  });

  test("app:none has no extensions, so no archetype applies", () => {
    expect(applicableArchetypes(model, "app:none")).toEqual([]);
  });

  test("an unknown id gives no archetype", () => {
    expect(applicableArchetypes(model, "app:missing")).toEqual([]);
  });
});

describe("verify outcomes", () => {
  test("a passing rule is passed with message null", () => {
    const finding = findOne(runWith(model), "app:a", "r.pass");
    expect(finding).toEqual({
      archetype: "test.arch-a",
      rule: "r.pass",
      locus: "app:a",
      method: "static",
      outcome: "passed",
      message: null,
    });
  });

  test("a failing rule is failed with the violation message", () => {
    const finding = findOne(runWith(model), "app:a", "r.fail");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("bad thing.");
  });

  test("a rule that dies is an error with the defect text", () => {
    const finding = findOne(runWith(model), "app:a", "r.die");
    expect(finding.outcome).toBe("error");
    expect(finding.message).toBe("boom");
  });

  test("a rule that throws before returning an Effect is an error", () => {
    const finding = findOne(runWith(model), "app:a", "r.throw");
    expect(finding.outcome).toBe("error");
    expect(finding.message).toBe("Error: thrown");
  });

  test("a failing or dying rule does not stop the other rules", () => {
    const report = runWith(model);
    expect(findingKeys(report)).toEqual([
      ["app:a", "test.arch-a", "r.die"],
      ["app:a", "test.arch-a", "r.fail"],
      ["app:a", "test.arch-a", "r.pass"],
      ["app:a", "test.arch-a", "r.throw"],
      ["app:ab", "test.arch-a", "r.die"],
      ["app:ab", "test.arch-a", "r.fail"],
      ["app:ab", "test.arch-a", "r.pass"],
      ["app:ab", "test.arch-a", "r.throw"],
      ["app:ab", "test.arch-ab", "r.both"],
    ]);
  });
});

describe("verify report", () => {
  test("findings are sorted by locus, archetype and rule even when the loci are given out of order", () => {
    const report = runWith(model, { loci: ["app:ab", "app:a"] });
    expect(findingKeys(report)).toEqual([
      ["app:a", "test.arch-a", "r.die"],
      ["app:a", "test.arch-a", "r.fail"],
      ["app:a", "test.arch-a", "r.pass"],
      ["app:a", "test.arch-a", "r.throw"],
      ["app:ab", "test.arch-a", "r.die"],
      ["app:ab", "test.arch-a", "r.fail"],
      ["app:ab", "test.arch-a", "r.pass"],
      ["app:ab", "test.arch-a", "r.throw"],
      ["app:ab", "test.arch-ab", "r.both"],
    ]);
  });

  test("summary counts equal the outcome counts of the findings", () => {
    const report = runWith(model);
    const count = (outcome: Finding["outcome"]) =>
      report.findings.filter((f) => f.outcome === outcome).length;
    expect(report.summary).toEqual({
      passed: count("passed"),
      failed: count("failed"),
      error: count("error"),
    });
    expect(report.summary).toEqual({ passed: 3, failed: 2, error: 4 });
  });

  test("provenance carries the runner and the fixed clock times", () => {
    const report = runWith(model, { runner: "browser" });
    expect(report.provenance).toEqual({
      runner: "browser",
      startedAt: FIXED_TIME,
      finishedAt: FIXED_TIME,
    });
  });

  test("the report and its findings are frozen", () => {
    const report = runWith(model);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.findings)).toBe(true);
    expect(Object.isFrozen(report.findings[0])).toBe(true);
  });
});

describe("verify selection", () => {
  test("methods static runs no execution rule", () => {
    const report = runWith(model, { methods: ["static"] });
    expect(report.findings.some((f) => f.method === "execution")).toBe(false);
    expect(findingKeys(report)).toEqual([
      ["app:a", "test.arch-a", "r.fail"],
      ["app:a", "test.arch-a", "r.pass"],
      ["app:ab", "test.arch-a", "r.fail"],
      ["app:ab", "test.arch-a", "r.pass"],
      ["app:ab", "test.arch-ab", "r.both"],
    ]);
  });

  test("methods execution runs no static rule", () => {
    const report = runWith(model, { methods: ["execution"] });
    expect(report.findings.some((f) => f.method === "static")).toBe(false);
    expect(findingKeys(report)).toEqual([
      ["app:a", "test.arch-a", "r.die"],
      ["app:a", "test.arch-a", "r.throw"],
      ["app:ab", "test.arch-a", "r.die"],
      ["app:ab", "test.arch-a", "r.throw"],
    ]);
  });

  test("loci app:ab gives only findings for app:ab", () => {
    const report = runWith(model, { loci: ["app:ab"] });
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.findings.every((f) => f.locus === "app:ab")).toBe(true);
  });

  test("an unknown id in loci is ignored", () => {
    const withUnknown = runWith(model, { loci: ["app:missing", "app:a"] });
    const without = runWith(model, { loci: ["app:a"] });
    expect(withUnknown.findings).toEqual(without.findings);
  });

  test("a rule sees the whole model, so a cross-Locus rule passes", () => {
    const crossRule: Rule = {
      id: "r.sees-root",
      description: "passes when the model contains the root",
      method: "static",
      check: (ctx) =>
        ctx.model.ids.includes("app:root")
          ? Effect.void
          : violation("no root in the model."),
    };
    const crossModel = buildModel(
      Locus.make({
        id: "app:root",
        contains: [
          Locus.extend(
            Extension.make("test.c", {
              description: "extension C",
              archetypes: [
                Archetype.make({
                  id: "test.arch-cross",
                  description: "cross-Locus rules",
                  appliesTo: ["test.c"],
                  rules: [crossRule],
                }),
              ],
            }),
          ).make({ id: "app:c" }),
        ],
      }),
    );
    const report = runWith(crossModel);
    expect(findingKeys(report)).toEqual([
      ["app:c", "test.arch-cross", "r.sees-root"],
    ]);
    expect(report.findings[0]?.outcome).toBe("passed");
  });
});

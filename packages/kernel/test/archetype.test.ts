// START_MODULE_CONTRACT
//   PURPOSE: Prove that rules and archetypes are frozen values and that violation fails with a RuleViolation.
//   SCOPE: Tests of archetype.ts only. Out: applying archetypes to a model.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Cause, Effect, Exit, Option } from "effect";
import { Archetype, Rule, RuleViolation, violation } from "../src/archetype";

describe("Rule.make", () => {
  test("returns a frozen rule with the given fields", () => {
    const rule = Rule.make({
      id: "r.one",
      description: "d",
      method: "static",
      check: () => violation("never"),
    });
    expect(rule.id).toBe("r.one");
    expect(rule.method).toBe("static");
    expect(Object.isFrozen(rule)).toBe(true);
  });
});

describe("Archetype.make", () => {
  test("returns a frozen archetype with the _tag Archetype", () => {
    const archetype = Archetype.make({
      id: "x.arch",
      description: "d",
      appliesTo: ["x.one"],
      rules: [],
    });
    expect(archetype._tag).toBe("Archetype");
    expect(archetype.appliesTo).toEqual(["x.one"]);
    expect(Object.isFrozen(archetype)).toBe(true);
  });
});

describe("violation", () => {
  test("fails with a RuleViolation that carries the message", () => {
    const exit = Effect.runSyncExit(violation("bad"));
    expect(Exit.isFailure(exit)).toBe(true);
    if (!Exit.isFailure(exit)) return;
    const error = Cause.findErrorOption(exit.cause);
    expect(Option.isSome(error)).toBe(true);
    if (!Option.isSome(error)) return;
    expect(error.value).toBeInstanceOf(RuleViolation);
    const violationValue = error.value as RuleViolation;
    expect(violationValue._tag).toBe("RuleViolation");
    expect(violationValue.message).toBe("bad");
  });
});

import { describe, expect, test } from "bun:test";
import {
  compareDiagnostics,
  type Diagnostic,
  makeDiagnostic,
} from "../src/diagnostic";

function diag(overrides: Partial<Diagnostic>): Diagnostic {
  return makeDiagnostic({
    code: "charter.purpose-blank",
    scope: "locus",
    subject: "shop:a",
    path: "charter.purpose",
    message: "m",
    ...overrides,
  });
}

describe("compareDiagnostics order", () => {
  test("orders by subject first", () => {
    const a = diag({ subject: "shop:a", code: "owner.missing" });
    const b = diag({ subject: "shop:b", code: "charter.purpose-blank" });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
    expect(compareDiagnostics(b, a)).toBeGreaterThan(0);
  });

  test("then by code", () => {
    const a = diag({ code: "charter.purpose-blank", path: "z" });
    const b = diag({ code: "identity.malformed", path: "a" });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("then by path", () => {
    const a = diag({ path: "charter.purpose" });
    const b = diag({ path: "owner" });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("then by detail", () => {
    const a = diag({
      code: "relation.duplicate",
      path: "relations",
      detail: "depends-on shop:a",
    });
    const b = diag({
      code: "relation.duplicate",
      path: "relations",
      detail: "refines shop:a",
    });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("a diagnostic with no detail comes before one with a detail", () => {
    const without = diag({});
    const withDetail = diag({ detail: "x" });
    expect(compareDiagnostics(without, withDetail)).toBeLessThan(0);
    expect(compareDiagnostics(withDetail, without)).toBeGreaterThan(0);
  });

  test("then by members joined with a comma", () => {
    const a = diag({
      code: "owner.cycle",
      path: "owner",
      members: ["shop:a", "shop:b"],
    });
    const b = diag({
      code: "owner.cycle",
      path: "owner",
      members: ["shop:a", "shop:c"],
    });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("compares by UTF-16 code unit, so uppercase sorts before lowercase", () => {
    expect(
      compareDiagnostics(diag({ subject: "B" }), diag({ subject: "a" })),
    ).toBeLessThan(0);
  });

  test("compares by UTF-16 code unit inside a subject", () => {
    expect(
      compareDiagnostics(diag({ subject: "Z:x" }), diag({ subject: "a:x" })),
    ).toBeLessThan(0);
  });

  test("identical diagnostics compare as zero", () => {
    expect(compareDiagnostics(diag({}), diag({}))).toBe(0);
  });

  test("diagnostics whose members join to the same key are still ordered, in opposite directions", () => {
    // Identities can hold commas only when malformed, so ["a,b"] and ["a","b"]
    // join to the same key. The fallback keeps the output independent of input order.
    const joined = diag({
      code: "owner.cycle",
      path: "owner",
      members: ["a,b"],
    });
    const split = diag({
      code: "owner.cycle",
      path: "owner",
      members: ["a", "b"],
    });
    const forward = compareDiagnostics(joined, split);
    expect(forward).not.toBe(0);
    expect(compareDiagnostics(split, joined)).toBe(-forward);
  });
});

describe("makeDiagnostic", () => {
  test("keys are in the fixed order when every optional field is given", () => {
    const d = makeDiagnostic({
      code: "owner.cycle",
      scope: "locus",
      subject: "shop:a",
      path: "owner",
      detail: "x",
      members: ["shop:a", "shop:b"],
      message: "m",
    });
    expect(Object.keys(d)).toEqual([
      "code",
      "scope",
      "subject",
      "path",
      "detail",
      "members",
      "message",
    ]);
  });

  test("detail and members are left out when not given", () => {
    const d = makeDiagnostic({
      code: "owner.self",
      scope: "locus",
      subject: "shop:a",
      path: "owner",
      message: "m",
    });
    expect(Object.keys(d)).toEqual([
      "code",
      "scope",
      "subject",
      "path",
      "message",
    ]);
    expect("detail" in d).toBe(false);
    expect("members" in d).toBe(false);
  });

  test("the result is frozen", () => {
    const d = diag({});
    expect(Object.isFrozen(d)).toBe(true);
  });
});

import { describe, expect, test } from "bun:test";
import {
  SEVERITY,
  compareDiagnostics,
  makeDiagnostic,
  sortDiagnostics,
} from "../src/diagnostic";
import type { Diagnostic, DiagnosticCode } from "../src/diagnostic";

const ALL_CODES: ReadonlyArray<DiagnosticCode> = [
  "identity.malformed",
  "identity.duplicate",
  "ownership.multiple",
  "composition.extension-id-conflict",
  "composition.property-conflict",
  "composition.relation-type-conflict",
  "composition.archetype-id-conflict",
  "archetype.applies-to-empty",
  "property.invalid",
  "capability.name-malformed",
  "relation.type-unavailable",
  "relation.target-missing",
  "relation.capability-missing",
  "relation.target-kind",
  "relation.self",
  "relation.duplicate",
  "relation.cycle",
  "relation.cycle-limit",
];

function diag(fields: {
  subject: string;
  code: DiagnosticCode;
  path: string;
  members?: ReadonlyArray<string>;
}): Diagnostic {
  return makeDiagnostic({ ...fields, message: "A test message." });
}

describe("SEVERITY", () => {
  test("has exactly the eighteen codes of DiagnosticCode", () => {
    expect(Object.keys(SEVERITY).sort()).toEqual([...ALL_CODES].sort());
  });

  test("gives warning for relation.duplicate", () => {
    expect(SEVERITY["relation.duplicate"]).toBe("warning");
  });

  test("gives warning for relation.cycle-limit", () => {
    expect(SEVERITY["relation.cycle-limit"]).toBe("warning");
  });

  test("gives error for every other code", () => {
    const others = ALL_CODES.filter(
      (code) =>
        code !== "relation.duplicate" && code !== "relation.cycle-limit",
    );
    expect(others.length).toBe(16);
    for (const code of others) {
      expect(SEVERITY[code]).toBe("error");
    }
  });
});

describe("makeDiagnostic", () => {
  test("fills severity from SEVERITY", () => {
    const d = diag({
      subject: "telos:a",
      code: "relation.duplicate",
      path: "relations",
    });
    expect(d.severity).toBe("warning");
    expect(d.code).toBe("relation.duplicate");
  });

  test("defaults members to an empty array", () => {
    const d = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    expect(d.members).toEqual([]);
  });

  test("returns a deeply frozen object", () => {
    const d = diag({
      subject: "telos:a",
      code: "relation.cycle",
      path: "relations",
      members: ["telos:a", "telos:b"],
    });
    expect(Object.isFrozen(d)).toBe(true);
    expect(Object.isFrozen(d.members)).toBe(true);
  });
});

describe("compareDiagnostics", () => {
  test("orders by subject first", () => {
    const a = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    const b = diag({
      subject: "telos:b",
      code: "identity.malformed",
      path: "id",
    });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
    expect(compareDiagnostics(b, a)).toBeGreaterThan(0);
  });

  test("orders by code when the subjects are equal", () => {
    const a = diag({
      subject: "telos:a",
      code: "identity.malformed",
      path: "relations",
    });
    const b = diag({ subject: "telos:a", code: "relation.self", path: "id" });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("orders by path when subject and code are equal", () => {
    const a = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "contains",
    });
    const b = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("orders by members joined with a comma when the first three keys are equal", () => {
    const a = diag({
      subject: "telos:a",
      code: "relation.cycle",
      path: "relations",
      members: ["x", "y"],
    });
    const b = diag({
      subject: "telos:a",
      code: "relation.cycle",
      path: "relations",
      members: ["x", "z"],
    });
    expect(compareDiagnostics(a, b)).toBeLessThan(0);
  });

  test("compares by UTF-16 code unit, so uppercase sorts before lowercase", () => {
    const upper = diag({
      subject: "B:x",
      code: "relation.self",
      path: "relations",
    });
    const lower = diag({
      subject: "a:x",
      code: "relation.self",
      path: "relations",
    });
    expect("B" < "a").toBe(true);
    expect(compareDiagnostics(upper, lower)).toBeLessThan(0);
  });
});

describe("sortDiagnostics", () => {
  test("sorts the list and keeps one of each exact duplicate", () => {
    const first = diag({
      subject: "telos:b",
      code: "relation.self",
      path: "relations",
    });
    const second = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    const duplicateOfSecond = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    const sorted = sortDiagnostics([first, second, duplicateOfSecond]);
    expect(sorted.length).toBe(2);
    expect(sorted[0]!.subject).toBe("telos:a");
    expect(sorted[1]!.subject).toBe("telos:b");
    expect(JSON.stringify(sorted[0])).toBe(JSON.stringify(second));
  });

  test("keeps two diagnostics that differ in content", () => {
    const a = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "relations",
    });
    const b = diag({
      subject: "telos:a",
      code: "relation.self",
      path: "contains",
    });
    expect(sortDiagnostics([a, b]).length).toBe(2);
  });
});

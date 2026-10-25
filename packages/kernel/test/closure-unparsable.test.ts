import { afterEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Effect } from "effect";
import {
  checkClosure,
  hasClosureErrors,
  type ClosureCode,
  type ClosureFinding,
  type ClosureOptions,
  type ClosureReport,
} from "../src/closure";
import { Locus, type LocusDefinition } from "../src/locus";
import { buildModel } from "../src/model";
import { Source } from "../src/extensions/source";

const Owned = Locus.extend(Source);

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "telos-closure-unparsable-"));
  created.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  return dir;
}

function check(
  model: LocusDefinition,
  root: string,
  options: Partial<ClosureOptions> = {},
): Promise<ClosureReport> {
  return Effect.runPromise(
    checkClosure(buildModel(model), { root, include: ["**/*.ts"], ...options }),
  );
}

function withCode(
  report: ClosureReport,
  code: ClosureCode,
): ReadonlyArray<ClosureFinding> {
  return report.findings.filter((f) => f.code === code);
}

function unparsableFinding(file: string): ClosureFinding {
  return {
    code: "closure.unparsable",
    severity: "error",
    file,
    loci: ["app:a"],
    detail: "parse",
    message: `${file} could not be parsed, so its imports were not checked.`,
    knowledge: "derived",
  };
}

const model = Owned.make({ id: "app:a", properties: { sources: ["a/**"] } });

describe("closure.unparsable", () => {
  test("closure.unparsable is reported for a file that does not parse", async () => {
    const dir = fixture({ "a/bad.ts": "const = ;\n" });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unparsable")).toEqual([
      unparsableFinding("a/bad.ts"),
    ]);
    expect(hasClosureErrors(report)).toBe(true);
    expect(report.files).toEqual([{ file: "a/bad.ts", owner: "app:a" }]);
  });

  test("closure.unparsable is reported for a .tsx file that does not parse", async () => {
    const dir = fixture({ "a/view.tsx": "export const a = <div>;\n" });
    const report = await check(model, dir, { include: ["**/*.tsx"] });
    expect(withCode(report, "closure.unparsable")).toEqual([
      unparsableFinding("a/view.tsx"),
    ]);
  });

  test("closure.unparsable is reported for a file that cannot be read", async () => {
    const dir = fixture({ "a/locked.ts": "export const x = 1;\n" });
    const lockedPath = join(dir, "a/locked.ts");
    chmodSync(lockedPath, 0o000);
    expect(() => readFileSync(lockedPath, "utf8")).toThrow();
    const report = await check(model, dir);
    expect(withCode(report, "closure.unparsable")).toEqual([
      unparsableFinding("a/locked.ts"),
    ]);
  });

  test("closure.unparsable does not stop the check of the next file", async () => {
    const dir = fixture({
      "a/bad.ts": "const = ;\n",
      "a/next.ts": 'import "./missing";\n',
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unparsable")).toEqual([
      unparsableFinding("a/bad.ts"),
    ]);
    const unresolved = withCode(report, "closure.unresolved-import");
    expect(unresolved.length).toBe(1);
    expect(unresolved[0]?.file).toBe("a/next.ts");
    expect(unresolved[0]?.detail).toBe("./missing");
  });

  test("closure.unparsable and closure.dynamic-import are both reported for a file that was read but does not parse", async () => {
    const dir = fixture({
      "a/both.ts": "const m = await import(name);\nconst = ;\n",
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unparsable")).toEqual([
      unparsableFinding("a/both.ts"),
    ]);
    const dynamic = withCode(report, "closure.dynamic-import");
    expect(dynamic.length).toBe(1);
    expect(dynamic[0]?.file).toBe("a/both.ts");
  });

  test("closure.unparsable is not reported for a file that parses", async () => {
    const dir = fixture({ "a/ok.ts": "export const ok = 1;\n" });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unparsable")).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

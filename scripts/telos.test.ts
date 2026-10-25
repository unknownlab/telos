import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Locus, Source, SourceDependsOn } from "@telos/kernel";
import { CLOSURE_SCOPE, runTelos } from "./telos";

const createdDirs: string[] = [];

const makeDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "telos-cmd-"));
  createdDirs.push(dir);
  return dir;
};

const writeFile = (dir: string, file: string, text: string): void => {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), text);
};

const fixtureRoot = Locus.make({
  id: "fix:root",
  contains: [
    Locus.extend(Source).make({
      id: "fix:a",
      properties: { sources: ["a/**/*.ts"] },
      relations: [SourceDependsOn.to("fix:missing")],
    }),
  ],
});

const claimedRoot = Locus.make({
  id: "fix:root",
  contains: [
    Locus.extend(Source).make({
      id: "fix:a",
      properties: { sources: ["scripts/a/**/*.ts"] },
    }),
  ],
});

const parseJson = (text: string): any => JSON.parse(text);

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("telos list and inspect", () => {
  test("list includes telos:kernel and calculator:arithmetic", async () => {
    const result = await runTelos(["list"]);
    expect(result.exitCode).toBe(0);
    const ids: string[] = parseJson(result.stdout).loci;
    expect(ids).toContain("telos:kernel");
    expect(ids).toContain("calculator:arithmetic");
  });

  test("inspect telos:kernel reports the declared knowledge status", async () => {
    const result = await runTelos(["inspect", "telos:kernel"]);
    expect(result.exitCode).toBe(0);
    expect(parseJson(result.stdout).knowledge).toBe("declared");
  });

  test("inspect of an unknown id exits 2 with LocusNotFound", async () => {
    const result = await runTelos(["inspect", "nope:nope"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(parseJson(result.stderr).tag).toBe("LocusNotFound");
  });
});

describe("telos check", () => {
  test("check on the repository exits 0 with ok true", async () => {
    const result = await runTelos(["check"]);
    expect(result.exitCode).toBe(0);
    expect(parseJson(result.stdout).ok).toBe(true);
  }, 30_000);

  test("check with a malformed relation fixture exits 1 with ok false", async () => {
    const result = await runTelos(["check"], { root: fixtureRoot });
    expect(result.exitCode).toBe(1);
    expect(parseJson(result.stdout).ok).toBe(false);
  }, 30_000);
});

describe("telos closure", () => {
  test("closure reports closure.unowned for an unclaimed file and exits 1", async () => {
    const dir = makeDir();
    writeFile(dir, "scripts/a/x.ts", "export const x = 1;\n");
    writeFile(dir, "scripts/b/y.ts", "export const y = 2;\n");
    const result = await runTelos(["closure"], {
      root: claimedRoot,
      cwd: dir,
    });
    expect(result.exitCode).toBe(1);
    const findings = parseJson(result.stdout).findings as Array<{
      code: string;
      file: string;
    }>;
    expect(
      findings.some(
        (finding) =>
          finding.code === "closure.unowned" &&
          finding.file === "scripts/b/y.ts",
      ),
    ).toBe(true);
  }, 30_000);
});

describe("telos impact", () => {
  test("impact calculator:arithmetic#add lists calculator:cli", async () => {
    const result = await runTelos(["impact", "calculator:arithmetic#add"]);
    expect(result.exitCode).toBe(0);
    const affected = parseJson(result.stdout).affected as Array<{
      locus: string;
    }>;
    expect(affected.map((entry) => entry.locus)).toContain("calculator:cli");
  });
});

describe("telos report", () => {
  test("report --out writes a version 1 SemanticReport that describes telos:repository", async () => {
    const dir = makeDir();
    const out = join(dir, "nested", "r.json");
    const result = await runTelos(["report", "--out", out]);
    expect(result.exitCode).toBe(0);
    expect(parseJson(result.stdout)).toEqual({ written: out });
    const report = parseJson(readFileSync(out, "utf8"));
    expect(report.version).toBe(1);
    const ids = (report.model.loci as Array<{ id: string }>).map(
      (locus) => locus.id,
    );
    expect(ids).toContain("telos:repository");
  }, 30_000);
});

describe("telos usage", () => {
  test("an unknown command exits 2 with a UsageError on stderr", async () => {
    const result = await runTelos(["nonsense"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(parseJson(result.stderr).tag).toBe("UsageError");
  });

  test("inspect without an id exits 2 with a UsageError", async () => {
    const result = await runTelos(["inspect"]);
    expect(result.exitCode).toBe(2);
    expect(parseJson(result.stderr).tag).toBe("UsageError");
  });

  test("the closure scope names the repository source globs and no path alias", () => {
    expect(CLOSURE_SCOPE.include).toContain("telos.ts");
    expect(CLOSURE_SCOPE.include).toContain("scripts/**/*.ts");
    expect(CLOSURE_SCOPE.aliases).toEqual([]);
  });
});

describe("telos timing on the repository (NFR-003)", () => {
  test("verify --static completes in under 2000 ms", async () => {
    const started = performance.now();
    const result = await runTelos(["verify", "--static"]);
    const elapsed = performance.now() - started;
    expect(result.exitCode).toBe(0);
    expect(elapsed).toBeLessThan(2000);
  }, 30_000);

  test("closure completes in under 10000 ms", async () => {
    const started = performance.now();
    const result = await runTelos(["closure"]);
    const elapsed = performance.now() - started;
    expect(result.exitCode).toBe(0);
    expect(elapsed).toBeLessThan(10_000);
  }, 30_000);
});

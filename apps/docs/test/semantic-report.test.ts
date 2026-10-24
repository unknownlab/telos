// START_MODULE_CONTRACT
//   PURPOSE: Prove that the semantic report is decoded strictly, that a failed or crashed telos report run is handled as the contract says, and that the docs build writes the report and the build info from the real repository run.
//   SCOPE: readSemanticReport with every field of the contract, reportProblem, writeSemanticReport with a fake runner and with the real bun run telos report, and the verificationProblem and check-verification command.
//   DEPENDS: M-DOCS-SEMANTIC-REPORT, M-DOCS-SITE
//   LINKS: V-M-DOCS-SEMANTIC-REPORT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   APP_DOCS - the apps/docs package directory
//   REPO_ROOT - the repository root, two levels above apps/docs
//   FAKE_GIT - a fixed git reader so the output does not depend on the checkout
//   dirs - temporary directories created by a test and removed after each test
//   freshDir - create a temporary directory
//   cloneOf - a deep copy of a plain JSON value
//   fakeRun - a runner that writes the fixture to the --out path it receives
//   FIELDS - the fields of readSemanticReport that the contract checks, in order
//   ARRAY_FIELDS - the fields that must be arrays, so a wrong value for them is an object
//   withWrong - a copy of the report with one field of the wrong type, by dotted path
// END_MODULE_MAP

import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readSemanticReport, type SemanticReport } from "../src/lib/build-data";
import { verificationProblem } from "../scripts/check-verification";
import {
  reportProblem,
  writeSemanticReport,
  type ReportRun,
} from "../scripts/semantic-report";
import { semanticReportFixture } from "./semantic-report-fixture";

const APP_DOCS = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(import.meta.dir, "../../..");
const FAKE_GIT = () => ({ commit: "f00", dirty: false });
const dirs: string[] = [];

function freshDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "semantic-report-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

function cloneOf<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const FIELDS: ReadonlyArray<string> = [
  "provenance",
  "provenance.runner",
  "provenance.generatedAt",
  "provenance.commit",
  "model",
  "model.loci",
  "verification",
  "verification.findings",
  "verification.summary",
  "verifications",
  "closure",
  "closure.limits",
  "closure.fileCount",
  "closure.findings",
  "ok",
];

// A value of the wrong type for each field: an object where an array is expected, an array
// elsewhere, so that every field fails its own check and no field passes by accident.
const ARRAY_FIELDS: ReadonlyArray<string> = [
  "model.loci",
  "verification.findings",
  "closure.limits",
  "closure.findings",
];

// Set one field of a plain copy of the report to a wrong value, by dotted path.
function withWrong(report: SemanticReport, path: string): unknown {
  const copy = cloneOf(report) as unknown as Record<string, unknown>;
  const parts = path.split(".");
  let target: Record<string, unknown> = copy;
  for (const part of parts.slice(0, -1)) {
    target = target[part] as Record<string, unknown>;
  }
  target[parts[parts.length - 1] as string] = ARRAY_FIELDS.includes(path)
    ? {}
    : [];
  return copy;
}

function fakeRun(report: SemanticReport) {
  return (cmd: ReadonlyArray<string>): ReportRun => {
    const out = cmd[cmd.indexOf("--out") + 1] as string;
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, JSON.stringify(report));
    return { exitCode: 0, stderr: "" };
  };
}

describe("readSemanticReport", () => {
  test("returns a valid report unchanged and null for null", async () => {
    const report = await semanticReportFixture();
    expect(readSemanticReport(cloneOf(report))).toEqual(report);
    expect(readSemanticReport(null)).toBeNull();
  });

  test("a document that is not an object is refused", () => {
    expect(() => readSemanticReport("wrong")).toThrow(
      "semantic-report.json: document is invalid",
    );
  });

  test("version must be 1", async () => {
    const report = { ...(await semanticReportFixture()), version: 2 };
    expect(() => readSemanticReport(report)).toThrow(
      "semantic-report.json: version is invalid",
    );
  });

  test.each(FIELDS)(
    "a wrong %s is refused and the message names it",
    async (field) => {
      const report = await semanticReportFixture();
      expect(() => readSemanticReport(withWrong(report, field))).toThrow(
        `semantic-report.json: ${field} is invalid`,
      );
    },
  );

  test("provenance.commit may be null", async () => {
    const report = await semanticReportFixture();
    const copy = {
      ...cloneOf(report),
      provenance: { ...report.provenance, commit: null },
    };
    expect(readSemanticReport(copy)?.provenance.commit).toBeNull();
  });
});

describe("reportProblem", () => {
  test("exit 0 with the file written has no problem", () => {
    expect(reportProblem({ exitCode: 0, stderr: "" }, true, "x")).toBeNull();
  });

  test("exit 1 with the file written is a non-fatal problem", () => {
    expect(reportProblem({ exitCode: 1, stderr: "" }, true, "x")?.fatal).toBe(
      false,
    );
  });

  test("exit 2 is fatal and names the code", () => {
    const problem = reportProblem({ exitCode: 2, stderr: "boom" }, true, "x");
    expect(problem?.fatal).toBe(true);
    expect(problem?.message).toContain("exited with 2");
  });

  test("no exit code and no file is fatal", () => {
    expect(
      reportProblem({ exitCode: null, stderr: "" }, false, "x")?.fatal,
    ).toBe(true);
  });

  test("exit 0 without a file is fatal and says it did not write", () => {
    const problem = reportProblem({ exitCode: 0, stderr: "" }, false, "x");
    expect(problem?.fatal).toBe(true);
    expect(problem?.message).toContain("did not write");
  });
});

describe("writeSemanticReport with a fake runner", () => {
  test("writes the report, the build info and the public copy", async () => {
    const docsDir = freshDir();
    const report = await semanticReportFixture();
    const problem = await writeSemanticReport({
      docsDir,
      repoRoot: REPO_ROOT,
      git: FAKE_GIT,
      run: fakeRun(report),
    });
    expect(problem).toBeNull();
    const generated = join(docsDir, "src/generated/semantic-report.json");
    expect(
      readFileSync(join(docsDir, "public/semantic-report.json"), "utf8"),
    ).toBe(readFileSync(generated, "utf8"));
    expect(
      JSON.parse(
        readFileSync(join(docsDir, "src/generated/build-info.json"), "utf8"),
      ),
    ).toEqual({
      commit: "f00",
      dirty: false,
    });
  });

  test("a runner that throws leaves no stale report behind", async () => {
    const docsDir = freshDir();
    mkdirSync(join(docsDir, "src/generated"), { recursive: true });
    mkdirSync(join(docsDir, "public"), { recursive: true });
    writeFileSync(join(docsDir, "src/generated/semantic-report.json"), "{}");
    writeFileSync(join(docsDir, "public/semantic-report.json"), "{}");
    const problem = await writeSemanticReport({
      docsDir,
      repoRoot: REPO_ROOT,
      git: FAKE_GIT,
      run: () => {
        throw new Error("spawn failed");
      },
    });
    expect(problem?.fatal).toBe(true);
    expect(
      existsSync(join(docsDir, "src/generated/semantic-report.json")),
    ).toBe(false);
    expect(existsSync(join(docsDir, "public/semantic-report.json"))).toBe(
      false,
    );
  });

  test("a runner that exits with no code and writes nothing is fatal", async () => {
    const docsDir = freshDir();
    const problem = await writeSemanticReport({
      docsDir,
      repoRoot: REPO_ROOT,
      git: FAKE_GIT,
      run: () => ({ exitCode: null, stderr: "killed" }),
    });
    expect(problem?.fatal).toBe(true);
  });
});

describe("writeSemanticReport with the real bun run telos report", () => {
  test(
    "the written report decodes and names the repository and calculator Loci",
    async () => {
      const docsDir = freshDir();
      const problem = await writeSemanticReport({
        docsDir,
        repoRoot: REPO_ROOT,
        git: () => ({ commit: "test", dirty: false }),
      });
      expect(problem === null || problem.fatal === false).toBe(true);
      const written = JSON.parse(
        readFileSync(
          join(docsDir, "src/generated/semantic-report.json"),
          "utf8",
        ),
      );
      const report = readSemanticReport(written);
      expect(report).not.toBeNull();
      const ids = report?.model.loci.map((locus) => locus.id) ?? [];
      expect(ids).toContain("telos:docs-site");
      expect(ids).toContain("calculator:arithmetic");
    },
    { timeout: 60_000 },
  );
});

describe("verificationProblem, the post-build check of the Verification page", () => {
  const SHELL =
    '<!doctype html><html><body><div id="root"></div></body></html>';

  test("a page that carries the semantic report passes", () => {
    const page =
      '<html><body><section data-result="semantic-report" data-provenance="none">Not run</section></body></html>';
    expect(verificationProblem(page)).toBeNull();
  });

  test("a missing page is reported as missing", () => {
    expect(verificationProblem(null)).toContain("is missing");
  });

  test("a client shell without the semantic report is reported", () => {
    expect(verificationProblem(SHELL)).toContain(
      'data-result="semantic-report"',
    );
  });

  test("the command exits 1 for a client shell", () => {
    const dist = freshDir();
    mkdirSync(join(dist, "verification"), { recursive: true });
    writeFileSync(join(dist, "verification/index.html"), SHELL);
    const run = Bun.spawnSync({
      cmd: [process.execPath, "scripts/check-verification.ts", "--dist", dist],
      cwd: APP_DOCS,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(1);
    expect(run.stderr.toString()).toContain('data-result="semantic-report"');
  });

  test("the command exits 0 for a page that carries the result", () => {
    const dist = freshDir();
    mkdirSync(join(dist, "verification"), { recursive: true });
    writeFileSync(
      join(dist, "verification/index.html"),
      '<html><body><section data-result="semantic-report" data-provenance="none">Not run</section></body></html>',
    );
    const run = Bun.spawnSync({
      cmd: [process.execPath, "scripts/check-verification.ts", "--dist", dist],
      cwd: APP_DOCS,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString()).toContain("carries the semantic report");
  });
});

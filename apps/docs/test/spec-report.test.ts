// START_MODULE_CONTRACT
//   PURPOSE: Prove that the build-time spec report keeps every record, derives its summary from the rows, deletes a stale report before a run and decodes the generated files strictly.
//   SCOPE: createSpecReportFile, writeSpecReport with the real catalogue, a failing record kept as failing, a crashed run that leaves no report, the spec-report CLI exit code and output, the decoders readSpecReportFile and readBuildInfo, and the post-build verification check.
//   DEPENDS: M-DOCS-SPEC-REPORT
//   LINKS: V-M-DOCS-SPEC-REPORT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   APP_DOCS - the apps/docs package directory, the working directory of the CLI
//   FAKE_GIT - a fixed git reader so the output does not depend on the checkout
//   FIXED_NOW - the fixed instant of the report run
//   RUNTIME - the Bun runtime label that the report is expected to carry
//   dirs - temporary directories created by a test and removed after each test
//   freshDir - create a temporary output directory
//   flippedValidate - a copy of a validate record whose expected validity is inverted
//   twoResultReport - a report with one passing and one failing result, built by hand
//   oneResultReport - a report with only the passing result of twoResultReport
//   wireFile - a spec-report file as it is read back from JSON on disk
//   catalogueIds - the catalogue record ids in catalogue order, as a fresh mutable array
//   passingResults - one passing result for each id, in the order given
//   reportOf - a report whose summary is derived from its rows
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
import {
  type Specification,
  type SpecReport,
  type SpecResult,
  catalogue,
} from "@telos/locus/specs";
import {
  type SpecReportFile,
  readBuildInfo,
  readSpecReportFile,
} from "../src/lib/build-data";
import { PACKAGE_VERSIONS } from "../src/lib/provenance";
import { createSpecReportFile, writeSpecReport } from "../scripts/spec-report";
import { verificationProblem } from "../scripts/check-verification";

const APP_DOCS = resolve(import.meta.dir, "..");
const FAKE_GIT = () => ({ commit: "f00", dirty: false });
const FIXED_NOW = new Date("2026-10-21T10:18:46.123Z");
const RUNTIME = `Bun ${Bun.version}`;

const dirs: string[] = [];

function freshDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "spec-report-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function flippedValidate(spec: Specification): Specification {
  const copy = structuredClone(spec);
  if (copy.check.kind !== "validate") {
    throw new Error("expected a validate record");
  }
  return {
    ...copy,
    check: {
      ...copy.check,
      expect: { ...copy.check.expect, valid: !copy.check.expect.valid },
    },
  };
}

function twoResultReport(): SpecReport {
  return {
    results: [
      {
        id: "LOC-001",
        status: "pass",
        expected: { valid: true },
        observed: { valid: true },
        durationMs: 1,
      },
      {
        id: "LOC-002",
        status: "fail",
        expected: { valid: false },
        observed: { valid: true },
        durationMs: 2,
      },
    ],
    summary: { total: 2, passed: 1, failed: 1, errored: 0 },
  };
}

function oneResultReport(): SpecReport {
  const [first] = twoResultReport().results;
  if (first === undefined) throw new Error("no result");
  return {
    results: [first],
    summary: { total: 1, passed: 1, failed: 0, errored: 0 },
  };
}

/** The spec-report.json value as it is read back from disk, so the decoder sees plain JSON. */
function wireFile(report: SpecReport = twoResultReport()): SpecReportFile {
  return JSON.parse(
    JSON.stringify(
      createSpecReportFile({
        report,
        at: FIXED_NOW,
        runtime: RUNTIME,
        packages: PACKAGE_VERSIONS,
        git: FAKE_GIT(),
      }),
    ),
  ) as SpecReportFile;
}

function catalogueIds(): string[] {
  return catalogue.map((spec) => spec.id);
}

function passingResults(ids: ReadonlyArray<string>): SpecResult[] {
  return ids.map((id) => ({
    id: id as SpecResult["id"],
    status: "pass",
    expected: { valid: true },
    observed: { valid: true },
    durationMs: 1,
  }));
}

function reportOf(results: ReadonlyArray<SpecResult>): SpecReport {
  const count = (status: SpecResult["status"]): number =>
    results.filter((result) => result.status === status).length;
  return {
    results,
    summary: {
      total: results.length,
      passed: count("pass"),
      failed: count("fail"),
      errored: count("error"),
    },
  };
}

describe("createSpecReportFile", () => {
  test("wraps the report with bun-build provenance and the git reading", () => {
    const report = twoResultReport();
    const file = createSpecReportFile({
      report,
      at: FIXED_NOW,
      runtime: "Bun 1.4.4",
      packages: PACKAGE_VERSIONS,
      git: { commit: "0123abc", dirty: true },
    });
    expect(file).toEqual({
      report,
      provenance: {
        origin: "bun-build",
        at: "2026-10-21T10:18:46.123Z",
        runtime: "Bun 1.4.4",
        packages: PACKAGE_VERSIONS,
        commit: "0123abc",
        dirty: true,
      },
    });
  });
});

describe("writeSpecReport with the real catalogue", () => {
  test("runs all 44 records and writes both files", async () => {
    const outDir = freshDir();
    const file = await writeSpecReport({
      outDir,
      git: FAKE_GIT,
      now: () => FIXED_NOW,
    });

    expect(file.report.summary).toEqual({
      total: 44,
      passed: 44,
      failed: 0,
      errored: 0,
    });
    expect(file.report.results.map((r) => r.id)).toEqual(
      catalogue.map((spec) => spec.id),
    );
    expect(file.provenance.runtime).toBe(RUNTIME);
    expect(file.provenance.packages).toEqual(PACKAGE_VERSIONS);

    const generated = join(outDir, "src/generated");
    const buildInfo = JSON.parse(
      readFileSync(join(generated, "build-info.json"), "utf8"),
    );
    expect(buildInfo).toEqual({ commit: "f00", dirty: false });

    const written = JSON.parse(
      readFileSync(join(generated, "spec-report.json"), "utf8"),
    );
    expect(readSpecReportFile(written)).toEqual(file);
  });
});

describe("failing records are kept", () => {
  test("a failing record is written with status fail and counted as failed", async () => {
    const outDir = freshDir();
    const first = catalogue[0];
    if (first === undefined) throw new Error("the catalogue is empty");
    const file = await writeSpecReport({
      outDir,
      git: FAKE_GIT,
      now: () => FIXED_NOW,
      specs: [first, flippedValidate(first)],
    });

    expect(file.report.summary).toEqual({
      total: 2,
      passed: 1,
      failed: 1,
      errored: 0,
    });
    expect(file.report.results[1]?.status).toBe("fail");

    const written = JSON.parse(
      readFileSync(join(outDir, "src/generated/spec-report.json"), "utf8"),
    );
    expect(written.report.results).toHaveLength(2);
    expect(written.report.results[1].status).toBe("fail");
  });
});

describe("a crashed run leaves no report", () => {
  test("the stale report is removed, the run error propagates and build info is written", async () => {
    const outDir = freshDir();
    const generated = join(outDir, "src/generated");
    mkdirSync(generated, { recursive: true });
    writeFileSync(join(generated, "spec-report.json"), '{"stale":true}\n');

    await expect(
      writeSpecReport({
        outDir,
        git: FAKE_GIT,
        now: () => FIXED_NOW,
        run: () => Promise.reject(new Error("boom")),
      }),
    ).rejects.toThrow("boom");

    expect(existsSync(join(generated, "spec-report.json"))).toBe(false);
    expect(existsSync(join(generated, "build-info.json"))).toBe(true);
  });
});

describe("the spec-report command", () => {
  test("exits 0 and prints the summary with the commit for the real catalogue", () => {
    const outDir = freshDir();
    const run = Bun.spawnSync({
      cmd: [process.execPath, "scripts/spec-report.ts", "--out", outDir],
      cwd: APP_DOCS,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = run.stdout.toString();
    expect(run.exitCode).toBe(0);
    expect(stdout).toMatch(
      /^spec-report: 44 specifications, 44 passed, 0 failed, 0 errored \(commit ([0-9a-f]{7}|unknown)\)/m,
    );

    const generated = join(outDir, "src/generated");
    expect(existsSync(join(generated, "build-info.json"))).toBe(true);
    expect(existsSync(join(generated, "spec-report.json"))).toBe(true);
  });
});

describe("readSpecReportFile", () => {
  test("null is null, meaning no report was produced", () => {
    expect(readSpecReportFile(null)).toBeNull();
  });

  test("a valid file round-trips through JSON", async () => {
    const file = await writeSpecReport({
      outDir: freshDir(),
      git: FAKE_GIT,
      now: () => FIXED_NOW,
    });
    expect(readSpecReportFile(JSON.parse(JSON.stringify(file)))).toEqual(file);
  });

  test("a browser origin is refused and the message names the field", () => {
    const good = wireFile();
    const wrong = {
      ...good,
      provenance: { ...good.provenance, origin: "browser" },
    };
    expect(() => readSpecReportFile(wrong)).toThrow(
      "spec-report.json: provenance.origin is invalid",
    );
  });

  test("a missing results array is refused and the message names it", () => {
    const good = wireFile();
    const wrong = { ...good, report: { summary: good.report.summary } };
    expect(() => readSpecReportFile(wrong)).toThrow(
      "spec-report.json: report.results is invalid",
    );
  });

  test("an unknown status is refused and the message names the field", () => {
    const good = wireFile();
    const [first, ...rest] = good.report.results;
    if (first === undefined) throw new Error("no result");
    const wrong = {
      ...good,
      report: {
        ...good.report,
        results: [{ ...first, status: "skipped" }, ...rest],
      },
    };
    expect(() => readSpecReportFile(wrong)).toThrow(
      "spec-report.json: report.results[0].status is invalid",
    );
  });

  test("a summary that claims more passes than the rows hold is refused", () => {
    const good = wireFile(oneResultReport());
    const wrong = {
      ...good,
      report: {
        ...good.report,
        summary: { total: 1, passed: 2, failed: 0, errored: 0 },
      },
    };
    expect(() => readSpecReportFile(wrong)).toThrow(
      "spec-report.json: summary is invalid",
    );
  });
});

describe("readBuildInfo", () => {
  test("null is null", () => {
    expect(readBuildInfo(null)).toBeNull();
  });

  test("a valid value round-trips", () => {
    const info = { commit: "0123abc", dirty: true };
    expect(readBuildInfo(JSON.parse(JSON.stringify(info)))).toEqual(info);
  });

  test("a non-boolean dirty flag is refused and the message names the field", () => {
    expect(() => readBuildInfo({ commit: "abc", dirty: "no" })).toThrow(
      "build-info.json: dirty is invalid",
    );
  });
});

describe("readSpecReportFile refuses a report that is consistent but wrong", () => {
  test("a duplicate record id is refused even though the summary counts it", () => {
    const ids = catalogueIds();
    ids[43] = "LOC-001";
    const file = wireFile(reportOf(passingResults(ids)));
    expect(() => readSpecReportFile(file)).toThrow(
      "spec-report.json: report.results[43].id is invalid",
    );
  });

  test("a duplicate record id is refused against the catalogue as well", () => {
    const ids = catalogueIds();
    ids[43] = "LOC-001";
    const file = wireFile(reportOf(passingResults(ids)));
    expect(() => readSpecReportFile(file, catalogueIds())).toThrow(
      "spec-report.json: report.results[43].id is invalid",
    );
  });

  test("an empty record id is refused", () => {
    const ids = catalogueIds();
    ids[2] = "";
    const file = wireFile(reportOf(passingResults(ids)));
    expect(() => readSpecReportFile(file)).toThrow(
      "spec-report.json: report.results[2].id is invalid",
    );
  });

  test("a record popped from the report is refused against the catalogue, though the summary agrees", () => {
    const file = wireFile(
      reportOf(passingResults(catalogueIds().slice(0, 43))),
    );
    expect(() => readSpecReportFile(file, catalogueIds())).toThrow(
      "spec-report.json: report.results is invalid",
    );
  });

  test("records out of catalogue order are refused against the catalogue", () => {
    const ids = ["LOC-002", "LOC-001", ...catalogueIds().slice(2)];
    const file = wireFile(reportOf(passingResults(ids)));
    expect(() => readSpecReportFile(file, catalogueIds())).toThrow(
      "spec-report.json: report.results[0].id is invalid",
    );
  });

  test("the complete catalogue report is accepted with the catalogue ids", () => {
    const file = wireFile(reportOf(passingResults(catalogueIds())));
    expect(readSpecReportFile(file, catalogueIds())).toEqual(file);
  });
});

describe("the summary counts of failed and errored records are checked", () => {
  test("a failed count that disagrees with the rows is refused", () => {
    const good = wireFile(twoResultReport());
    const wrong = {
      ...good,
      report: {
        ...good.report,
        summary: { total: 2, passed: 1, failed: 0, errored: 0 },
      },
    };
    expect(() => readSpecReportFile(wrong)).toThrow(
      "spec-report.json: summary is invalid",
    );
  });

  test("an errored count that disagrees with the rows is refused", () => {
    const report: SpecReport = {
      results: [
        ...passingResults(["LOC-001"]),
        {
          id: "LOC-002" as SpecResult["id"],
          status: "error",
          expected: { valid: true },
          observed: { error: "boom" },
          durationMs: 1,
        },
      ],
      summary: { total: 2, passed: 1, failed: 0, errored: 0 },
    };
    expect(() => readSpecReportFile(wireFile(report))).toThrow(
      "spec-report.json: summary is invalid",
    );
  });

  test("an errored count that agrees with the rows is accepted", () => {
    const report: SpecReport = {
      results: [
        ...passingResults(["LOC-001"]),
        {
          id: "LOC-002" as SpecResult["id"],
          status: "error",
          expected: { valid: true },
          observed: { error: "boom" },
          durationMs: 1,
        },
      ],
      summary: { total: 2, passed: 1, failed: 0, errored: 1 },
    };
    expect(readSpecReportFile(wireFile(report))?.report.summary).toEqual({
      total: 2,
      passed: 1,
      failed: 0,
      errored: 1,
    });
  });
});

describe("verificationProblem, the post-build check of the Verification page", () => {
  const SHELL =
    '<!doctype html><html><body><div id="root"></div></body></html>';

  test("a page that carries the spec-report result passes", () => {
    const page =
      '<html><body><section data-result="spec-report" data-provenance="none">Not run</section></body></html>';
    expect(verificationProblem(page)).toBeNull();
  });

  test("a missing page is reported as missing", () => {
    expect(verificationProblem(null)).toContain("is missing");
  });

  test("a client shell without the spec-report result is reported", () => {
    expect(verificationProblem(SHELL)).toContain('data-result="spec-report"');
  });

  test("the command exits 1 with the message when the page is missing", () => {
    const dist = freshDir();
    const run = Bun.spawnSync({
      cmd: [process.execPath, "scripts/check-verification.ts", "--dist", dist],
      cwd: APP_DOCS,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(1);
    expect(run.stderr.toString()).toContain("is missing");
  });

  test("the command exits 1 with the message for a client shell", () => {
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
    expect(run.stderr.toString()).toContain('data-result="spec-report"');
  });

  test("the command exits 0 for a page that carries the result", () => {
    const dist = freshDir();
    mkdirSync(join(dist, "verification"), { recursive: true });
    writeFileSync(
      join(dist, "verification/index.html"),
      '<html><body><section data-result="spec-report" data-provenance="none">Not run</section></body></html>',
    );
    const run = Bun.spawnSync({
      cmd: [process.execPath, "scripts/check-verification.ts", "--dist", dist],
      cwd: APP_DOCS,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(0);
  });
});

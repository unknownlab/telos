// START_MODULE_CONTRACT
//   PURPOSE: Run the whole check suite for Spec Kitty's review gate and always write one JUnit report.
//   SCOPE: Run every check step, record each as a JUnit test case, merge in bun test's own JUnit suites, exit 1 on any failure.
//   DEPENDS: M-BUN-VERSION-GUARD
//   LINKS: M-REVIEW-GATE, V-M-REVIEW-GATE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   StepResult - outcome of one check step
//   escapeXml - escape text for an XML attribute
//   buildReport - JUnit report with a "verify" suite plus bun test's suites
// END_MODULE_MAP

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type StepResult = {
  name: string;
  ok: boolean;
  message: string;
};

// START_CONTRACT: escapeXml
//   PURPOSE: Escape text so it is safe inside a double-quoted XML attribute.
//   INPUTS: { text: string - raw text }
//   OUTPUTS: { string - text with & < > " ' escaped }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: escapeXml
export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// START_CONTRACT: buildReport
//   PURPOSE: Build the JUnit report the review gate parses.
//   INPUTS: { steps: StepResult[] - one per check step, bunJunit: string | null - bun test's JUnit file content, or null when it wrote none }
//   OUTPUTS: { string - a <testsuites> document: a "verify" suite with one test case per step, then every <testsuite> from bunJunit }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: buildReport
export function buildReport(
  steps: StepResult[],
  bunJunit: string | null,
): string {
  const failures = steps.filter((step) => !step.ok).length;
  const cases = steps.map((step) => {
    const open = `    <testcase classname="verify" name="${escapeXml(step.name)}"`;
    if (step.ok) return `${open} />`;
    return `${open}>\n      <failure message="${escapeXml(step.message)}" />\n    </testcase>`;
  });
  const bunSuites = bunJunit?.match(/<testsuite[\s>][\s\S]*<\/testsuite>/)?.[0];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<testsuites>",
    `  <testsuite name="verify" tests="${steps.length}" failures="${failures}">`,
    ...cases,
    "  </testsuite>",
    ...(bunSuites ? [`  ${bunSuites}`] : []),
    "</testsuites>",
    "",
  ].join("\n");
}

function lastLine(text: string): string {
  return text.trim().split("\n").at(-1) ?? "";
}

function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function runStep(name: string, command: string[]): StepResult {
  const result = Bun.spawnSync(command, { stdout: "pipe", stderr: "pipe" });
  const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;
  const ok = result.exitCode === 0;
  const message = ok ? "" : lastLine(output) || `exit code ${result.exitCode}`;
  return { name, ok, message };
}

if (import.meta.main) {
  // START_BLOCK_READ_OUTPUT_PATH
  const outputFile = process.argv[2];
  if (!outputFile) {
    console.error("usage: bun scripts/review-gate.ts <junit-output-file>");
    process.exit(2);
  }
  // END_BLOCK_READ_OUTPUT_PATH

  // START_BLOCK_RUN_STEPS
  const tempDir = mkdtempSync(join(tmpdir(), "review-gate-"));
  const bunJunitPath = join(tempDir, "bun-test.xml");
  const steps = [
    runStep("check:bun", ["bun", "run", "check:bun"]),
    runStep("format:check", ["bun", "run", "format:check"]),
    runStep("lint", ["bun", "run", "lint"]),
    runStep("typecheck", ["bun", "run", "typecheck"]),
    runStep("test", [
      "bun",
      "test",
      "--pass-with-no-tests",
      "--reporter=junit",
      `--reporter-outfile=${bunJunitPath}`,
    ]),
    runStep("grace:lint", ["bun", "run", "grace:lint"]),
  ];
  // END_BLOCK_RUN_STEPS

  // START_BLOCK_WRITE_REPORT
  const bunJunit = readOptional(bunJunitPath);
  rmSync(tempDir, { recursive: true, force: true });
  writeFileSync(outputFile, buildReport(steps, bunJunit));
  for (const step of steps) {
    console.log(
      `${step.ok ? "PASS" : "FAIL"} verify.${step.name}${step.ok ? "" : `: ${step.message}`}`,
    );
  }
  process.exit(steps.every((step) => step.ok) ? 0 : 1);
  // END_BLOCK_WRITE_REPORT
}

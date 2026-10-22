// START_MODULE_CONTRACT
//   PURPOSE: Run the whole check suite for Spec Kitty's review gate and always write one JUnit report.
//   SCOPE: Install dependencies once when node_modules is missing, run every check step of CHECK_STEPS in the order of the root verify script with colour off, record each as a JUnit test case whose failure message is the step's cause, sanitize all report text so it stays well-formed, merge in bun test's own JUnit suites, exit 1 on any failure.
//   DEPENDS: M-BUN-VERSION-GUARD
//   LINKS: M-REVIEW-GATE, V-M-REVIEW-GATE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   StepResult - outcome of one check step
//   CheckStep - one check step: its report name and the command that runs it
//   CHECK_STEPS - the check steps in verify order, the single list the gate runs
//   verifyStepNames - the step names the root verify script runs, parsed from its text
//   sanitizeText - strip escape codes and characters XML cannot represent
//   escapeXml - sanitize, then escape text for an XML attribute
//   failureMessage - pick the first real error line of a failed step
//   needsInstall - true when a directory has no node_modules yet
//   cleanEnv - child environment with NO_COLOR set and agent output variables removed
//   buildReport - JUnit report with a "verify" suite plus bun test's suites
// END_MODULE_MAP

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type StepResult = {
  name: string;
  ok: boolean;
  message: string;
};

export type CheckStep = {
  readonly name: string;
  readonly command: ReadonlyArray<string>;
};

// START_CONTRACT: CHECK_STEPS
//   PURPOSE: Name every check step the review gate runs, in the order of the root verify script, so the gate and verify cannot drift apart.
//   INPUTS: {}
//   OUTPUTS: { ReadonlyArray<CheckStep> - check:bun, format:check, lint, typecheck, test, docs:build, test:e2e, grace:lint; the test step runs bun test without reporter flags, which the gate adds at run time }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: CHECK_STEPS
export const CHECK_STEPS: ReadonlyArray<CheckStep> = [
  { name: "check:bun", command: ["bun", "run", "check:bun"] },
  { name: "format:check", command: ["bun", "run", "format:check"] },
  { name: "lint", command: ["bun", "run", "lint"] },
  { name: "typecheck", command: ["bun", "run", "typecheck"] },
  { name: "test", command: ["bun", "test", "--pass-with-no-tests"] },
  { name: "docs:build", command: ["bun", "run", "docs:build"] },
  { name: "test:e2e", command: ["bun", "run", "test:e2e"] },
  { name: "grace:lint", command: ["bun", "run", "grace:lint"] },
];

// START_CONTRACT: verifyStepNames
//   PURPOSE: Read the step names out of the root verify script, so a test can compare them with CHECK_STEPS.
//   INPUTS: { verifyScript: string - the text of the verify script, a chain of "bun run <name>" joined by "&&" }
//   OUTPUTS: { string[] - the <name> of each part, in order }
//   SIDE_EFFECTS: none; throws an Error when a part is not exactly "bun run <name>", so an edit that adds any other form fails the tests
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: verifyStepNames
export function verifyStepNames(verifyScript: string): string[] {
  return verifyScript.split("&&").map((part) => {
    const match = /^bun run ([^\s;|&<>]+)$/.exec(part.trim());
    if (!match?.[1]) {
      throw new Error(`verify step is not "bun run <name>": ${part.trim()}`);
    }
    return match[1];
  });
}

function isXmlChar(point: number): boolean {
  return (
    point === 0x9 ||
    point === 0xa ||
    point === 0xd ||
    (point >= 0x20 && point <= 0xd7ff) ||
    (point >= 0xe000 && point <= 0xfffd) ||
    (point >= 0x10000 && point <= 0x10ffff)
  );
}

// START_CONTRACT: sanitizeText
//   PURPOSE: Remove ANSI colour sequences and every character XML 1.0 cannot represent, so text can go into a report.
//   INPUTS: { text: string - raw text, possibly with escape codes or control characters }
//   OUTPUTS: { string - the text without ESC [ ... final-byte sequences and without XML-invalid characters; tab, newline, carriage return and all other text are kept }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: sanitizeText
export function sanitizeText(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text.charCodeAt(i) === 0x1b && text[i + 1] === "[") {
      // ANSI CSI: ESC [ parameter bytes, intermediate bytes, one final byte
      let j = i + 2;
      while (
        j < text.length &&
        text.charCodeAt(j) >= 0x30 &&
        text.charCodeAt(j) <= 0x3f
      )
        j++;
      while (
        j < text.length &&
        text.charCodeAt(j) >= 0x20 &&
        text.charCodeAt(j) <= 0x2f
      )
        j++;
      if (
        j < text.length &&
        text.charCodeAt(j) >= 0x40 &&
        text.charCodeAt(j) <= 0x7e
      ) {
        i = j + 1;
        continue;
      }
    }
    const point = text.codePointAt(i) ?? 0;
    const width = point > 0xffff ? 2 : 1;
    if (isXmlChar(point)) out += text.slice(i, i + width);
    i += width;
  }
  return out;
}

// START_CONTRACT: escapeXml
//   PURPOSE: Escape text so it is safe inside a double-quoted XML attribute.
//   INPUTS: { text: string - raw text }
//   OUTPUTS: { string - text sanitized first, then with & < > " ' escaped }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: escapeXml
export function escapeXml(text: string): string {
  return sanitizeText(text)
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
  const bunSuites = sanitizeText(bunJunit ?? "").match(
    /<testsuite[\s>][\s\S]*<\/testsuite>/,
  )?.[0];
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

const WRAPPER_LINE = /^error: script "[^"]*" exited with code \d+$/;

// START_CONTRACT: failureMessage
//   PURPOSE: Pick the line of a failed step's output that shows its cause, for the report and the console.
//   INPUTS: { output: string - the step's stdout and stderr, exitCode: number - the step's exit code }
//   OUTPUTS: { string - the first non-wrapper line containing "error" (case-insensitive) or starting with "(fail)"; else the last non-wrapper line; else the wrapper line; else "exit code <n>"; at most 300 characters }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: failureMessage
export function failureMessage(output: string, exitCode: number): string {
  const lines = sanitizeText(output)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const real = lines.filter((line) => !WRAPPER_LINE.test(line));
  const pick =
    real.find((line) => /error/i.test(line) || line.startsWith("(fail)")) ??
    real.at(-1) ??
    lines.at(-1) ??
    `exit code ${exitCode}`;
  return pick.slice(0, 300);
}

// START_CONTRACT: needsInstall
//   PURPOSE: Tell whether dependencies must be installed before the checks can run in a directory, such as a Spec Kitty worktree or a base-branch checkout.
//   INPUTS: { dir: string - the project root directory }
//   OUTPUTS: { boolean - true when join(dir, "node_modules") does not exist }
//   SIDE_EFFECTS: reads the file system only
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: needsInstall
export function needsInstall(dir: string): boolean {
  return !existsSync(join(dir, "node_modules"));
}

function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

// START_CONTRACT: cleanEnv
//   PURPOSE: Build the environment for a check step so its output is plain text: no colour, and no variables that make the tools print agent-specific formats.
//   INPUTS: { env: Record<string, string | undefined> - the parent environment }
//   OUTPUTS: { Record<string, string | undefined> - a new object: a copy of env with NO_COLOR set to "1" and without FORCE_COLOR, CLAUDECODE and CLAUDE_CODE_ENTRYPOINT }
//   SIDE_EFFECTS: none; the input object is not mutated
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: cleanEnv
export function cleanEnv(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const copy: Record<string, string | undefined> = { ...env, NO_COLOR: "1" };
  delete copy.FORCE_COLOR;
  delete copy.CLAUDECODE;
  delete copy.CLAUDE_CODE_ENTRYPOINT;
  return copy;
}

function runStep(name: string, command: string[]): StepResult {
  const result = Bun.spawnSync(command, {
    stdout: "pipe",
    stderr: "pipe",
    env: cleanEnv(process.env),
  });
  const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;
  const ok = result.exitCode === 0;
  const message = ok ? "" : failureMessage(output, result.exitCode);
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
  // Base-branch checkouts have no node_modules, so every check would fail on
  // missing type definitions. Install once; a failed install is its own step.
  const steps: StepResult[] = [];
  if (needsInstall(process.cwd())) {
    const install = runStep("install", ["bun", "install", "--frozen-lockfile"]);
    if (!install.ok) steps.push(install);
  }
  for (const step of CHECK_STEPS) {
    const command =
      step.name === "test"
        ? [
            ...step.command,
            "--reporter=junit",
            `--reporter-outfile=${bunJunitPath}`,
          ]
        : [...step.command];
    steps.push(runStep(step.name, command));
  }
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

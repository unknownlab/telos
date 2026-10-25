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

export const CHECK_STEPS: ReadonlyArray<CheckStep> = [
  { name: "check:bun", command: ["bun", "run", "check:bun"] },
  { name: "format:check", command: ["bun", "run", "format:check"] },
  { name: "lint", command: ["bun", "run", "lint"] },
  { name: "typecheck", command: ["bun", "run", "typecheck"] },
  { name: "test", command: ["bun", "test", "--pass-with-no-tests"] },
  { name: "telos:check", command: ["bun", "run", "telos:check"] },
];

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

export function sanitizeText(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text.charCodeAt(i) === 0x1b && text[i + 1] === "[") {
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

export function escapeXml(text: string): string {
  return sanitizeText(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

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
  const outputFile = process.argv[2];
  if (!outputFile) {
    console.error("usage: bun scripts/review-gate.ts <junit-output-file>");
    process.exit(2);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "review-gate-"));
  const bunJunitPath = join(tempDir, "bun-test.xml");
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

  const bunJunit = readOptional(bunJunitPath);
  rmSync(tempDir, { recursive: true, force: true });
  writeFileSync(outputFile, buildReport(steps, bunJunit));
  for (const step of steps) {
    console.log(
      `${step.ok ? "PASS" : "FAIL"} verify.${step.name}${step.ok ? "" : `: ${step.message}`}`,
    );
  }
  process.exit(steps.every((step) => step.ok) ? 0 : 1);
}

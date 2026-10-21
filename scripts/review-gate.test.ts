// START_MODULE_CONTRACT
//   PURPOSE: Prove the review gate report marks every failing step as a JUnit failure and keeps bun test's suites.
//   SCOPE: Unit tests of escapeXml and buildReport.
//   DEPENDS: M-REVIEW-GATE
//   LINKS: V-M-REVIEW-GATE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BUN_JUNIT - a minimal bun test JUnit document
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildReport,
  escapeXml,
  failureMessage,
  needsInstall,
  sanitizeText,
} from "./review-gate";

const BUN_JUNIT = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="bun test" tests="1">
  <testsuite name="a.test.ts" tests="1">
    <testcase name="adds" classname="" />
  </testsuite>
</testsuites>
`;

describe("escapeXml", () => {
  test("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });
});

describe("buildReport", () => {
  test("a passing step is a test case without a failure", () => {
    const report = buildReport([{ name: "lint", ok: true, message: "" }], null);
    expect(report).toContain('<testcase classname="verify" name="lint" />');
    expect(report).not.toContain("<failure");
  });

  test("a failing step is a test case with an escaped failure message", () => {
    const report = buildReport(
      [{ name: "typecheck", ok: false, message: 'x.ts: "1" < 2' }],
      null,
    );
    expect(report).toContain('<testcase classname="verify" name="typecheck">');
    expect(report).toContain(
      '<failure message="x.ts: &quot;1&quot; &lt; 2" />',
    );
    expect(report).toContain('tests="1" failures="1"');
  });

  test("bun test suites are kept inside the single testsuites root", () => {
    const report = buildReport(
      [{ name: "test", ok: true, message: "" }],
      BUN_JUNIT,
    );
    expect(report).toContain('<testsuite name="a.test.ts" tests="1">');
    expect(report).toContain('<testcase name="adds" classname="" />');
    expect(report.match(/<testsuites[\s>]/g)).toHaveLength(1);
  });

  test("no bun test output still gives a valid report", () => {
    const report = buildReport([{ name: "test", ok: true, message: "" }], null);
    expect(
      report.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>'),
    ).toBe(true);
    expect(report.trimEnd().endsWith("</testsuites>")).toBe(true);
  });
});

describe("sanitizeText", () => {
  test("removes ANSI colour sequences but keeps the text", () => {
    expect(sanitizeText("\u001b[31mfailed\u001b[0m")).toBe("failed");
  });

  test("removes characters XML 1.0 cannot represent", () => {
    expect(sanitizeText("a\u0000b\u0001c\u000bd￾e")).toBe("abcde");
  });

  test("keeps tab, newline, carriage return and non-ASCII text", () => {
    expect(sanitizeText("a\tb\nc\rd é 日本 😀")).toBe("a\tb\nc\rd é 日本 😀");
  });

  test("drops a lone surrogate but keeps a valid pair", () => {
    expect(sanitizeText("x\ud800y😀")).toBe("xy😀");
  });
});

describe("escapeXml and buildReport with escape codes", () => {
  test("escapeXml strips escape codes before escaping", () => {
    expect(escapeXml("\u001b[1m<a>\u001b[0m")).toBe("&lt;a&gt;");
  });

  test("buildReport never contains an ESC character, even from the bun test report", () => {
    const report = buildReport(
      [{ name: "typecheck", ok: false, message: "\u001b[31mTS2322\u001b[0m" }],
      '<testsuites><testsuite name="x" tests="1" failures="0"><testcase name="a\u001b[0m" /></testsuite></testsuites>',
    );
    expect(report.includes("\u001b")).toBe(false);
    expect(report).toContain('message="TS2322"');
    expect(sanitizeText(report)).toBe(report);
  });
});

describe("failureMessage", () => {
  const wrapper = 'error: script "typecheck" exited with code 1';

  test("prefers the first real error line over bun's wrapper line", () => {
    expect(failureMessage(`a.ts(3,1): error TS2322: x\n${wrapper}\n`, 1)).toBe(
      "a.ts(3,1): error TS2322: x",
    );
  });

  test("shows the failing test line, not the summary", () => {
    expect(
      failureMessage("(fail) f\n 1 fail\nRan 12 tests across 3 files.\n", 1),
    ).toBe("(fail) f");
  });

  test("falls back to the last real line when no line looks like an error", () => {
    expect(
      failureMessage(
        'docs/tooling.md\n1 file needs formatting.\nerror: script "format:check" exited with code 1\n',
        1,
      ),
    ).toBe("1 file needs formatting.");
  });

  test("falls back to the wrapper line, then to the exit code", () => {
    expect(failureMessage(`${wrapper}\n`, 1)).toBe(wrapper);
    expect(failureMessage("", 3)).toBe("exit code 3");
  });

  test("strips colour and limits the length to 300 characters", () => {
    expect(failureMessage("\u001b[31merror: boom\u001b[0m", 1)).toBe(
      "error: boom",
    );
    expect(failureMessage(`error: ${"x".repeat(500)}`, 1).length).toBe(300);
  });
});

describe("needsInstall", () => {
  test("is true when the directory has no node_modules", () => {
    const dir = mkdtempSync(join(tmpdir(), "needs-install-"));
    try {
      expect(needsInstall(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("is false once node_modules exists in the directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "needs-install-"));
    try {
      mkdirSync(join(dir, "node_modules"));
      expect(needsInstall(dir)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

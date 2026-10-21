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
import { buildReport, escapeXml } from "./review-gate";

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

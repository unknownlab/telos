// START_MODULE_CONTRACT
//   PURPOSE: Fail the site build when the built Verification page is not the result page, so that a broken spec report can never ship as an empty client shell (FR-022, INV-013).
//   SCOPE: verificationProblem, the check of one built page, and the command line that reads dist/client/verification/index.html. It only reads the built page and never writes.
//   DEPENDS: none
//   LINKS: M-DOCS-SPEC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   verificationProblem - the problem with the built Verification page, or null when it carries the spec-report result
// END_MODULE_MAP

import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const PAGE = "verification/index.html";
const RESULT_MARKER = 'data-result="spec-report"';

// START_CONTRACT: verificationProblem
//   PURPOSE: Say what is wrong with the built Verification page, so that the build fails with a clear message when the page was prerendered without its result.
//   INPUTS: { html: string | null - the built page, null when the file does not exist }
//   OUTPUTS: { string | null - null when the page contains data-result="spec-report"; otherwise a message naming the page and the reason }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SPEC-REPORT
// END_CONTRACT: verificationProblem
export function verificationProblem(html: string | null): string | null {
  if (html === null) {
    return `${PAGE} is missing: the build did not prerender /verification`;
  }
  if (!html.includes(RESULT_MARKER)) {
    return `${PAGE} does not contain ${RESULT_MARKER}: the page was rendered without its result, usually because spec-report.json is invalid`;
  }
  return null;
}

// START_BLOCK_CLI
if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { dist: { type: "string" } },
    strict: true,
  });
  const dist = resolve(
    values.dist ?? resolve(import.meta.dir, "../dist/client"),
  );
  const file = Bun.file(join(dist, PAGE));
  const html = (await file.exists()) ? await file.text() : null;
  const problem = verificationProblem(html);
  if (problem !== null) {
    console.error(`verification check failed: ${problem}`);
    process.exit(1);
  }
  console.log(`verification check: ${PAGE} carries the spec-report result`);
}
// END_BLOCK_CLI

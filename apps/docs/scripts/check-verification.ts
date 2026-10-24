// START_MODULE_CONTRACT
//   PURPOSE: Fail the site build when the built Verification page is not the semantic report page, so that a broken semantic report can never ship as an empty client shell (FR-022, INV-013).
//   SCOPE: verificationProblem, the check of one built page, and the command line that reads dist/client/verification/index.html. It only reads the built page and never writes.
//   DEPENDS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   verificationProblem - the problem with the built Verification page, or null when it carries the semantic report
// END_MODULE_MAP

import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const PAGE = "verification/index.html";
const RESULT_MARKER = 'data-result="semantic-report"';

// START_CONTRACT: verificationProblem
//   PURPOSE: Say what is wrong with the built Verification page, so that the build fails with a clear message when the page was prerendered without its result.
//   INPUTS: { html: string | null - the built page, null when the file does not exist }
//   OUTPUTS: { string | null - null when the page contains data-result="semantic-report"; otherwise a message naming the page and the reason }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: verificationProblem
export function verificationProblem(html: string | null): string | null {
  if (html === null) {
    return `${PAGE} is missing: the build did not prerender /verification`;
  }
  if (!html.includes(RESULT_MARKER)) {
    return `${PAGE} does not contain ${RESULT_MARKER}: the page was rendered without the semantic report, usually because semantic-report.json is missing or invalid`;
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
  console.log(`verification check: ${PAGE} carries the semantic report`);
}
// END_BLOCK_CLI

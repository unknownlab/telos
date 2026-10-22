// START_MODULE_CONTRACT
//   PURPOSE: Decode the build-time files once, so that the pages read the spec report and the site commit as typed values.
//   SCOPE: specReportFile, the decoded spec report or null, and SITE_COMMIT, the commit the site was built from. Vite-only: it imports the generated files, so tests and components never import it.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   specReportFile - the decoded build-time spec report, or null when none was produced (NS-018)
//   SITE_COMMIT - the commit the site was built from, "unknown" when the build did not record it
// END_MODULE_MAP

import { catalogue } from "@telos/locus/specs";
import { readBuildInfo, readSpecReportFile } from "./build-data";
import { buildInfoJson, specReportJson } from "./generated";
import { siteCommitOf } from "./provenance";

// START_CONTRACT: specReportFile
//   PURPOSE: Hold the decoded build-time report, so that the verification page can show it or say that it was not run. The rows must be exactly the catalogue, in order.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { SpecReportFile | null - the decoded report, or null when spec-report.json was not produced }
//   SIDE_EFFECTS: none; a broken spec-report.json throws when this module loads, which fails the prerender
//   LINKS: M-DOCS-SITE
// END_CONTRACT: specReportFile
export const specReportFile = readSpecReportFile(
  specReportJson,
  catalogue.map((spec) => spec.id),
);

// START_CONTRACT: SITE_COMMIT
//   PURPOSE: Name the commit the site was built from, for the browser provenance of WP14 and WP15.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { string - the commit, with -dirty when the tree had changes; "unknown" when build-info.json is absent }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SITE_COMMIT
export const SITE_COMMIT = siteCommitOf(readBuildInfo(buildInfoJson));

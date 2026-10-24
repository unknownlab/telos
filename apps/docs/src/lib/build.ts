// START_MODULE_CONTRACT
//   PURPOSE: Decode the build-time files once, so that the pages read the semantic report and the build provenance as typed values.
//   SCOPE: semanticReport, the decoded semantic report or null, and BUILD_PROVENANCE, the provenance of that report. Vite-only: it imports the generated files, so tests and components never import it.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   semanticReport - the decoded build-time semantic report, or null when none was produced
//   BUILD_PROVENANCE - the provenance of semanticReport, or null when none was produced
// END_MODULE_MAP

import { readBuildInfo, readSemanticReport } from "./build-data";
import { buildInfoJson, semanticReportJson } from "./generated";
import { buildProvenanceOf } from "./provenance";

// START_CONTRACT: semanticReport
//   PURPOSE: Hold the decoded build-time semantic report, so that the inspector and verification pages can show it or say that it was not run.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { SemanticReport | null - the decoded report, or null when semantic-report.json was not produced }
//   SIDE_EFFECTS: none; a broken semantic-report.json throws when this module loads, which fails the prerender
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: semanticReport
export const semanticReport = readSemanticReport(semanticReportJson);

// START_CONTRACT: BUILD_PROVENANCE
//   PURPOSE: Name where the build-time report came from, for every label of the inspector and verification pages.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { BuildProvenance | null - the provenance of semanticReport, null when none was produced }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: BUILD_PROVENANCE
export const BUILD_PROVENANCE = buildProvenanceOf(
  semanticReport,
  readBuildInfo(buildInfoJson),
);

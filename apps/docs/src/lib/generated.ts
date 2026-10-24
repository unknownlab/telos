// START_MODULE_CONTRACT
//   PURPOSE: Inline the generated site data at build time, so the pages read the compiled documents and the optional semantic report without any request.
//   SCOPE: The content.json document list, the raw semantic-report.json and the raw build-info.json, when they exist. search.json is deliberately not listed, so it is not inlined.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   content - the compiled documents, or an empty document list when content.json is absent
//   semanticReportJson - the raw semantic report, or null when it was not produced
//   buildInfoJson - the raw build info, or null when semantic-report.ts did not run
// END_MODULE_MAP

import type { ContentFile } from "./content-types";

// Explicit paths, so search.json (WP12 loads it lazily) is not inlined here.
const modules = import.meta.glob<{ default: unknown }>(
  [
    "../generated/content.json",
    "../generated/semantic-report.json",
    "../generated/build-info.json",
  ],
  { eager: true },
);

// START_CONTRACT: content
//   PURPOSE: Hold the compiled documentation, inlined at build time from src/generated/content.json.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { ContentFile - the content.json document, or { version: 1, documents: [] } when it is absent }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: content
export const content: ContentFile = (modules["../generated/content.json"]
  ?.default as ContentFile | undefined) ?? { version: 1, documents: [] };

// START_CONTRACT: semanticReportJson
//   PURPOSE: Hold the raw semantic report for the inspector and verification pages, which decode it.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { unknown - the parsed semantic-report.json, or null when the report was not produced }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: semanticReportJson
export const semanticReportJson: unknown =
  modules["../generated/semantic-report.json"]?.default ?? null;

// START_CONTRACT: buildInfoJson
//   PURPOSE: Hold the raw build info ({ commit, dirty }), which the build decodes into the build provenance.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { unknown - the parsed build-info.json, or null when semantic-report.ts did not run }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: buildInfoJson
export const buildInfoJson: unknown =
  modules["../generated/build-info.json"]?.default ?? null;

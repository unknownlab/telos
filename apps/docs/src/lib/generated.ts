// START_MODULE_CONTRACT
//   PURPOSE: Inline the generated site data at build time, so the pages read the compiled documents and the optional spec report without any request.
//   SCOPE: The content.json document list and the raw spec-report.json, when it exists. search.json is deliberately not listed, so it is not inlined.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   content - the compiled documents, or an empty document list when content.json is absent
//   specReportJson - the raw spec report, or null when it was not produced (NS-018)
// END_MODULE_MAP

import type { ContentFile } from "./content-types";

// Explicit paths, so search.json (WP12 loads it lazily) is not inlined here.
const modules = import.meta.glob<{ default: unknown }>(
  ["../generated/content.json", "../generated/spec-report.json"],
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

// START_CONTRACT: specReportJson
//   PURPOSE: Hold the raw spec report for the verification page, which decodes it (WP13).
//   INPUTS: none (build-time constant)
//   OUTPUTS: { unknown - the parsed spec-report.json, or null when the report was not produced (NS-018) }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: specReportJson
export const specReportJson: unknown =
  modules["../generated/spec-report.json"]?.default ?? null;

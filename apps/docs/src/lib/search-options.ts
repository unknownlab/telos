// START_MODULE_CONTRACT
//   PURPOSE: Hold the MiniSearch options shared by the build script that writes search.json and the site that loads it.
//   SCOPE: One constant, SEARCH_OPTIONS. Store fields exclude the section text to keep search.json small.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SEARCH_OPTIONS - MiniSearch options for the section index
// END_MODULE_MAP

import type { Options } from "minisearch";
import type { SearchSection } from "./content-types";

// START_CONTRACT: SEARCH_OPTIONS
//   PURPOSE: Define how the section index is built and queried, identically on the build side and in the browser.
//   INPUTS: none
//   OUTPUTS: { Options<SearchSection> - id field, indexed fields, stored fields and prefix, fuzzy and boost settings }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SEARCH_OPTIONS
export const SEARCH_OPTIONS: Options<SearchSection> = {
  idField: "id",
  fields: ["title", "heading", "summary", "text"],
  storeFields: ["docTitle", "heading", "route"],
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 3, heading: 2, summary: 2 },
  },
};

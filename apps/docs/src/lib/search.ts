// START_MODULE_CONTRACT
//   PURPOSE: Turn the serialised MiniSearch index into a query function whose results are one hit per document, best section first.
//   SCOPE: SearchHit, RESULT_LIMIT, groupHits and createSearch. Pure: it takes the index text and never fetches it.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SearchHit - one result: the link target, the route, the document title and the heading
//   RESULT_LIMIT - the number of documents a search returns
//   groupHits - keeps the best hit of each route, up to a limit
//   createSearch - loads the index text and returns the query function
// END_MODULE_MAP

import MiniSearch from "minisearch";
import type { SearchSection } from "./content-types";
import { SEARCH_OPTIONS } from "./search-options";

/** One search result. `id` is the route, or route#heading for a section. */
export interface SearchHit {
  readonly id: string;
  readonly route: string;
  readonly docTitle: string;
  readonly heading: string;
}

/** The number of documents that one search returns. */
export const RESULT_LIMIT = 10;

// START_CONTRACT: groupHits
//   PURPOSE: Show each document once, at the position of its best-scoring section, so a long document does not fill the list.
//   INPUTS: { results: ReadonlyArray<{ id, route, docTitle, heading }> - MiniSearch results in score order, limit: number - the maximum number of hits }
//   OUTPUTS: { SearchHit[] - the first hit of each route in input order, at most limit long }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: groupHits
export function groupHits(
  results: ReadonlyArray<{
    readonly id: unknown;
    readonly [field: string]: unknown;
  }>,
  limit: number = RESULT_LIMIT,
): SearchHit[] {
  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const result of results) {
    if (hits.length >= limit) break;
    const route = storedText(result.route);
    if (seen.has(route)) continue;
    seen.add(route);
    hits.push({
      id: String(result.id),
      route,
      docTitle: storedText(result.docTitle),
      heading: storedText(result.heading),
    });
  }
  return hits;
}

function storedText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

// START_CONTRACT: createSearch
//   PURPOSE: Restore the index that the build wrote, with the same options, and return a query function over it.
//   INPUTS: { json: string - the serialised MiniSearch index from search.json }
//   OUTPUTS: { (query: string) => SearchHit[] - hits for the trimmed query, empty for a blank query }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: createSearch
export function createSearch(json: string): (query: string) => SearchHit[] {
  const index = MiniSearch.loadJSON<SearchSection>(json, SEARCH_OPTIONS);
  return (query: string): SearchHit[] => {
    const trimmed = query.trim();
    if (trimmed === "") return [];
    return groupHits(index.search(trimmed));
  };
}

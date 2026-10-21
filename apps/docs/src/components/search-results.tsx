// START_MODULE_CONTRACT
//   PURPOSE: Show the search status and the hits, one link per document, with the section heading where there is one.
//   SCOPE: SearchResults and the SearchStatus type. Plain links, so the component needs no router.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SearchStatus - the state of the search index and the query
//   SearchResults - the status message or the list of hits
// END_MODULE_MAP

import type { SearchHit } from "@/lib/search";

/** The state of the search index and of the query. */
export type SearchStatus = "idle" | "loading" | "ready" | "error";

// START_CONTRACT: SearchResults
//   PURPOSE: Render the message for the current status, or the list of hits when the search is ready.
//   INPUTS: { query: string - the query text, hits: ReadonlyArray<SearchHit> - the grouped hits, status: SearchStatus - the state of the search }
//   OUTPUTS: { JSX.Element | null - nothing while idle, otherwise a message or a list of links whose href is the hit id }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SearchResults
export function SearchResults({
  query,
  hits,
  status,
}: {
  readonly query: string;
  readonly hits: ReadonlyArray<SearchHit>;
  readonly status: SearchStatus;
}) {
  if (status === "idle") return null;
  if (status === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading the index…
      </p>
    );
  }
  if (status === "error") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Search is unavailable.
      </p>
    );
  }
  if (hits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No results for “{query}”.</p>
    );
  }
  return (
    <ul data-slot="search-results" className="flex flex-col gap-1">
      {hits.map((hit) => (
        <li key={hit.id}>
          <a
            href={hit.id}
            data-search-result={hit.route}
            className="block rounded-md px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          >
            <span className="block font-medium">{hit.docTitle}</span>
            {hit.heading === "" ? null : (
              <span className="block text-sm text-muted-foreground">
                {hit.heading}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

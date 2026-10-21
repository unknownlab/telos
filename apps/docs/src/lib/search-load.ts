// START_MODULE_CONTRACT
//   PURPOSE: Fetch the build-time search index only when a search is first opened, so the index never joins the page chunk.
//   SCOPE: loadSearchIndex, which reads the generated search.json as raw text through a lazy Vite glob.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   loadSearchIndex - resolves the text of search.json, loaded in its own chunk
// END_MODULE_MAP

// Vite only: import.meta.glob is not available to Bun, so tests never import this module.
const loaders = import.meta.glob<string>("../generated/search.json", {
  query: "?raw",
  import: "default",
});

// START_CONTRACT: loadSearchIndex
//   PURPOSE: Give the serialised search index, fetched on the first call only when the build produced search.json.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { Promise<string> - the text of search.json; rejects when the build did not produce it }
//   SIDE_EFFECTS: fetches the search index chunk on the first call
//   LINKS: M-DOCS-SITE
// END_CONTRACT: loadSearchIndex
export function loadSearchIndex(): Promise<string> {
  const load = loaders["../generated/search.json"];
  return load === undefined
    ? Promise.reject(new Error("search index was not generated"))
    : load();
}

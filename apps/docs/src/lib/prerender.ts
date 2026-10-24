// START_MODULE_CONTRACT
//   PURPOSE: List every route the static build prerenders, so that each content document and each app page gets its own HTML file.
//   SCOPE: APP_PAGES, the app routes prerendered besides the content, and prerenderPaths, which joins them to the content routes and refuses a path listed twice.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   APP_PAGES - app routes prerendered besides the content documents
//   inspectorPages - one inspector page per Locus of the semantic report, in report order
//   prerenderPaths - content routes and app pages, sorted, with a duplicate check
// END_MODULE_MAP

import type { ContentFile } from "./content-types";
import { locusSlug } from "./locus-slug";

/** App routes prerendered besides the content documents. WP18, WP19 and WP20 edit this list. */
export const APP_PAGES: ReadonlyArray<string> = [
  "/architecture",
  "/inspector",
  "/not-found",
  "/verification",
  "/playground",
  "/calculator",
];

// START_CONTRACT: inspectorPages
//   PURPOSE: Give the inspector page of every Locus of the semantic report, so that each Locus is prerendered.
//   INPUTS: { report: { model: { loci: Locus ids } } - the decoded semantic report }
//   OUTPUTS: { string[] - "/inspector/<slug>" for each Locus, in report order }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: inspectorPages
export function inspectorPages(report: {
  readonly model: { readonly loci: ReadonlyArray<{ readonly id: string }> };
}): string[] {
  return report.model.loci.map((locus) => `/inspector/${locusSlug(locus.id)}`);
}

// START_CONTRACT: prerenderPaths
//   PURPOSE: Give the complete, sorted list of routes to prerender, and refuse a route that would be written twice.
//   INPUTS: { content: ContentFile - the compiled documents, appPages: ReadonlyArray<string> - app routes, APP_PAGES by default }
//   OUTPUTS: { string[] - the content routes and app pages sorted by code unit; throws when a path is listed twice }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: prerenderPaths
export function prerenderPaths(
  content: ContentFile,
  appPages: ReadonlyArray<string> = APP_PAGES,
): string[] {
  const paths = [...content.documents.map((doc) => doc.route), ...appPages];
  const seen = new Set<string>();
  for (const path of paths) {
    if (seen.has(path)) {
      throw new Error(`prerender path "${path}" is listed twice`);
    }
    seen.add(path);
  }
  return paths.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

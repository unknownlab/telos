// START_MODULE_CONTRACT
//   PURPOSE: Give the route loaders their data, and the route heads their titles, from the compiled documents.
//   SCOPE: loadDocument, which throws notFound() for an unknown route, and documentHead, which builds the title and description meta of a document page.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DocumentData - a document with the documents it relates to
//   loadDocument - the document data of a route, or notFound
//   documentHead - the title and description meta of a document page
// END_MODULE_MAP

import { notFound } from "@tanstack/react-router";
import type { ContentDocument } from "./content-types";
import { content } from "./generated";
import { documentByRoute, pageTitle, relatedDocuments } from "./site";

export interface DocumentData {
  readonly doc: ContentDocument;
  readonly related: ReadonlyArray<ContentDocument>;
}

// START_CONTRACT: loadDocument
//   PURPOSE: Load the document a route serves, with its related documents, for a route loader.
//   INPUTS: { route: string - the absolute route of the document }
//   OUTPUTS: { DocumentData - the document and its related documents; throws notFound() when no document has the route }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: loadDocument
export function loadDocument(route: string): DocumentData {
  const doc = documentByRoute(content, route);
  if (doc === undefined) throw notFound();
  return { doc, related: relatedDocuments(content, doc) };
}

// START_CONTRACT: documentHead
//   PURPOSE: Build the head meta of a document page, with the page title and, when a document is loaded, its summary as the description.
//   INPUTS: { data: DocumentData | undefined - the loader data of the page }
//   OUTPUTS: { { meta: ReadonlyArray<object> } - the title meta, and a description meta when data is present }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: documentHead
export function documentHead(data: DocumentData | undefined) {
  return {
    meta: [
      { title: pageTitle(data?.doc.title ?? "Page not found") },
      ...(data ? [{ name: "description", content: data.doc.summary }] : []),
    ],
  };
}

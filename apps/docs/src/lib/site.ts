// START_MODULE_CONTRACT
//   PURPOSE: Give the pure site helpers that pages and navigation share: titles, source links, section and document lookups in navigation order, related documents, section of a path and title splitting.
//   SCOPE: SITE_TITLE, REPOSITORY_URL, pageTitle, sourceUrl, documentByRoute, documentsInSection, childDocuments, relatedDocuments, sectionForPath and splitTitle. No router, no DOM.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SITE_TITLE - the site name used in titles and the header
//   REPOSITORY_URL - the GitHub repository that source links point into
//   pageTitle - the document title with the site name appended
//   sourceUrl - the GitHub link of a document's source file
//   documentByRoute - the document served at a route, if any
//   documentsInSection - the documents of one navigation section in order
//   childDocuments - documentsInSection without the index documents
//   relatedDocuments - the documents named in related, in that order
//   sectionForPath - the navigation section a path belongs to, or null
//   splitTitle - the leading h1 of a document body, split off
// END_MODULE_MAP

import {
  type ContentDocument,
  type ContentFile,
  NAV_SECTIONS,
  type NavSectionId,
  compareInSection,
} from "./content-types";

export const SITE_TITLE = "Telos by UnknownLab";
export const REPOSITORY_URL = "https://github.com/unknownlab/telos";

const LEADING_H1 = /^\s*<h1[^>]*>[\s\S]*?<\/h1>/;

// START_CONTRACT: pageTitle
//   PURPOSE: Build the document title shown in the browser tab.
//   INPUTS: { title: string | undefined - the page title, absent for the site itself }
//   OUTPUTS: { string - "<title> · Telos by UnknownLab", or the site title alone }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: pageTitle
export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE_TITLE}` : SITE_TITLE;
}

// START_CONTRACT: sourceUrl
//   PURPOSE: Link a document to its source file on the main branch of the repository (FR-017).
//   INPUTS: { doc: ContentDocument - the document whose source path is linked }
//   OUTPUTS: { string - the GitHub blob URL of doc.source }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: sourceUrl
export function sourceUrl(doc: ContentDocument): string {
  return `${REPOSITORY_URL}/blob/main/${doc.source}`;
}

// START_CONTRACT: documentByRoute
//   PURPOSE: Find the document that a route serves.
//   INPUTS: { content: ContentFile - the compiled documents, route: string - an absolute route such as "/principles/P01-everything-is-code" }
//   OUTPUTS: { ContentDocument | undefined - the document whose route equals route }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: documentByRoute
export function documentByRoute(
  content: ContentFile,
  route: string,
): ContentDocument | undefined {
  return content.documents.find((doc) => doc.route === route);
}

// START_CONTRACT: documentsInSection
//   PURPOSE: List the documents of one navigation section in the order the site and llms.txt use.
//   INPUTS: { content: ContentFile - the compiled documents, section: NavSectionId - the navigation section }
//   OUTPUTS: { ContentDocument[] - the documents whose navSection is section, sorted by compareInSection }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: documentsInSection
export function documentsInSection(
  content: ContentFile,
  section: NavSectionId,
): ContentDocument[] {
  return content.documents
    .filter((doc) => doc.navSection === section)
    .sort(compareInSection);
}

// START_CONTRACT: childDocuments
//   PURPOSE: List the documents of a section that are not its index, for the nested navigation and the section lists.
//   INPUTS: { content: ContentFile - the compiled documents, section: NavSectionId - the navigation section }
//   OUTPUTS: { ContentDocument[] - documentsInSection without the documents of kind index }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: childDocuments
export function childDocuments(
  content: ContentFile,
  section: NavSectionId,
): ContentDocument[] {
  return documentsInSection(content, section).filter(
    (doc) => doc.kind !== "index",
  );
}

// START_CONTRACT: relatedDocuments
//   PURPOSE: Resolve the related ids of a document to the documents they name.
//   INPUTS: { content: ContentFile - the compiled documents, doc: ContentDocument - the document whose related ids are resolved }
//   OUTPUTS: { ContentDocument[] - the documents named in doc.related, in that order; unknown ids are skipped }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: relatedDocuments
export function relatedDocuments(
  content: ContentFile,
  doc: ContentDocument,
): ContentDocument[] {
  const found: ContentDocument[] = [];
  for (const id of doc.related) {
    const related = content.documents.find((candidate) => candidate.id === id);
    if (related !== undefined) found.push(related);
  }
  return found;
}

// START_CONTRACT: sectionForPath
//   PURPOSE: Decide which navigation section a path belongs to, so the navigation can mark it.
//   INPUTS: { path: string - an absolute path, with at most one trailing slash }
//   OUTPUTS: { NavSectionId | null - "introduction" for "/", the section whose route is the path or a prefix of it, otherwise null }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: sectionForPath
export function sectionForPath(path: string): NavSectionId | null {
  const trimmed =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (trimmed === "/") return "introduction";
  for (const section of NAV_SECTIONS) {
    if (section.route === "/") continue;
    if (trimmed === section.route || trimmed.startsWith(`${section.route}/`)) {
      return section.id;
    }
  }
  return null;
}

// START_CONTRACT: splitTitle
//   PURPOSE: Separate the h1 that a document body starts with from the rest of the body, so the page shows the body's own heading once.
//   INPUTS: { html: string - the rendered body of a document }
//   OUTPUTS: { title: string | null - the leading h1 element, body: string - the html without it }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: splitTitle
export function splitTitle(html: string): {
  readonly title: string | null;
  readonly body: string;
} {
  const match = LEADING_H1.exec(html);
  if (match === null) return { title: null, body: html };
  return {
    title: match[0].trimStart(),
    body: html.slice(match[0].length),
  };
}

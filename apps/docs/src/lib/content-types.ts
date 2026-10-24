// START_MODULE_CONTRACT
//   PURPOSE: Define the shape of compiled documentation content and the site navigation order, shared by the build script and the site.
//   SCOPE: Kind, Status, Maturity and nav section unions, NAV_SECTIONS, APP_ROUTES, the content document and search section interfaces, and compareInSection.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Kind - closed set of document kinds from docs front matter
//   Status - closed set of document status values
//   Maturity - closed set of maturity values (FR-018)
//   NavSectionId - identifiers of the site navigation sections
//   NAV_SECTIONS - navigation sections in site order
//   APP_ROUTES - routes the app renders without a source document
//   Heading - one heading of a document outline
//   ContentDocument - one compiled document
//   ContentFile - the content.json document
//   SearchSection - one searchable section of a document
//   compareInSection - order of two documents inside one navigation section
// END_MODULE_MAP

/** Closed set of document kinds. */
export type Kind =
  | "index"
  | "doctrine"
  | "principle"
  | "term"
  | "model"
  | "capability-map"
  | "direction"
  | "roadmap"
  | "questions"
  | "decision"
  | "research"
  | "guide";

/** Closed set of status values. */
export type Status =
  | "provisional"
  | "proposed"
  | "accepted"
  | "open"
  | "superseded"
  | "deprecated";

/** Closed set of maturity values. */
export type Maturity = "vision" | "proposed" | "implemented";

/** Identifiers of the site navigation sections. */
export type NavSectionId =
  | "introduction"
  | "philosophy"
  | "principles"
  | "terminology"
  | "architecture"
  | "first-locus"
  | "examples"
  | "inspector"
  | "playground"
  | "verification"
  | "roadmap"
  | "decisions"
  | "agent-reference";

/** Navigation order of the site (FR-013); llms.txt uses the same order. */
export const NAV_SECTIONS: ReadonlyArray<{
  readonly id: NavSectionId;
  readonly title: string;
  readonly route: string;
}> = [
  { id: "introduction", title: "Introduction", route: "/" },
  { id: "philosophy", title: "Philosophy", route: "/philosophy" },
  { id: "principles", title: "Principles", route: "/principles" },
  { id: "terminology", title: "Terminology", route: "/terminology" },
  { id: "architecture", title: "Architecture", route: "/architecture" },
  { id: "first-locus", title: "First Locus", route: "/first-locus" },
  { id: "examples", title: "Examples", route: "/examples" },
  { id: "inspector", title: "Inspector", route: "/inspector" },
  { id: "playground", title: "Playground", route: "/playground" },
  { id: "verification", title: "Verification", route: "/verification" },
  { id: "roadmap", title: "Roadmap", route: "/roadmap" },
  { id: "decisions", title: "Decisions", route: "/decisions" },
  {
    id: "agent-reference",
    title: "Agent Reference",
    route: "/agent-reference",
  },
];

/** Routes the app renders without a source document. Absolute content links may target them. */
export const APP_ROUTES: ReadonlyArray<string> = [
  "/architecture",
  "/inspector",
  "/playground",
  "/verification",
];

/** One heading of a document outline. */
export interface Heading {
  readonly level: number;
  readonly id: string;
  readonly text: string;
}

/** One compiled document. Kind-specific fields are present only for their kind. */
export interface ContentDocument {
  readonly id: string;
  readonly title: string;
  readonly kind: Kind;
  readonly status: Status;
  readonly maturity: Maturity;
  readonly summary: string;
  readonly related: ReadonlyArray<string>;
  readonly route: string;
  readonly navSection: NavSectionId;
  /** Repository-relative path, e.g. "docs/foundation/principles/P08-preserve-the-baseline.md". */
  readonly source: string;
  /** Rendered body with heading ids and rewritten links. */
  readonly html: string;
  readonly outline: ReadonlyArray<Heading>;
  // kind-specific front matter, present only for that kind
  readonly number?: number; // principle
  readonly code?: string; // principle
  readonly order?: number; // term, guide
  readonly classification?: string; // term
  readonly fundamental?: boolean; // term
  readonly engine?: boolean; // term
  readonly stage0?: "in-scope" | "minimal" | "deferred"; // term
  readonly date?: string; // decision
  readonly section?:
    "introduction" | "first-locus" | "examples" | "agent-reference"; // guide
}

/** The content.json document. */
export interface ContentFile {
  readonly version: 1;
  readonly documents: ReadonlyArray<ContentDocument>;
}

/** One searchable section of a document. */
export interface SearchSection {
  readonly id: string; // route, or route#anchor for a sub-section
  readonly title: string; // document title on the top section, "" otherwise
  readonly heading: string; // "" on the top section, heading text otherwise
  readonly summary: string; // document summary on the top section, "" otherwise
  readonly text: string; // plain text of the section
  readonly docTitle: string; // document title (stored for display)
  readonly route: string; // document route (stored, used to group results)
}

// START_CONTRACT: compareInSection
//   PURPOSE: Order two documents that share a navigation section, the same way llms.txt and the site list them.
//   INPUTS: { a: ContentDocument - first document, b: ContentDocument - second document }
//   OUTPUTS: { number - negative when a comes first, positive when b comes first, zero only for the same id }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: compareInSection
/**
 * Index documents first, then principles by number, terms and guides by order,
 * and everything else by id. Ties break by id, compared by code unit so the
 * result never depends on the locale.
 */
export function compareInSection(
  a: ContentDocument,
  b: ContentDocument,
): number {
  const rankA = a.kind === "index" ? 0 : 1;
  const rankB = b.kind === "index" ? 0 : 1;
  if (rankA !== rankB) return rankA - rankB;
  const keyA = orderKey(a);
  const keyB = orderKey(b);
  if (keyA !== undefined && keyB !== undefined && keyA !== keyB) {
    return keyA - keyB;
  }
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function orderKey(doc: ContentDocument): number | undefined {
  if (doc.kind === "principle") return doc.number;
  if (doc.kind === "term" || doc.kind === "guide") return doc.order;
  return undefined;
}

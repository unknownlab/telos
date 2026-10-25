// START_MODULE_CONTRACT
//   PURPOSE: Compile the Markdown under docs/ into the files the documentation site reads, and fail the build on any NS-020 problem.
//   SCOPE: Scan docs/foundation, docs/decisions, docs/research and docs/guides; validate front matter per kind; check ids, routes, related ids, links and forbidden verification claims; render heading ids and outlines; write content.json, search.json, llms.txt and index.json.
//   DEPENDS: none
//   LINKS: M-DOCS-CONTENT, V-M-DOCS-CONTENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   slugify - GitHub heading slug of decoded heading text
//   stripTags - remove HTML tags from a fragment
//   decodeEntities - decode the entities Bun.markdown emits
//   plainText - visible text of an HTML fragment, whitespace collapsed
//   VOCABULARY_DEFINITION - the one table exempt from the verification-claim check
//   CompileOptions - repository root and the git reader
//   CompileOutput - the four generated files and their content
//   CompileResult - success with the output, or failure with the sorted problems
//   compileContent - compile docs/ into the generated site files
// END_MODULE_MAP

import { mkdirSync, statSync } from "node:fs";
import { parseArgs } from "node:util";
import { join, posix, resolve } from "node:path";
import { Effect, Schema, SchemaIssue } from "effect";
import MiniSearch from "minisearch";
import {
  APP_ROUTES,
  NAV_SECTIONS,
  compareInSection,
  type ContentDocument,
  type ContentFile,
  type Heading,
  type Kind,
  type Maturity,
  type NavSectionId,
  type SearchSection,
  type Status,
} from "../src/lib/content-types";
import { SEARCH_OPTIONS } from "../src/lib/search-options";

// START_CONTRACT: slugify
//   PURPOSE: Compute the GitHub slug of heading text, so #fragment links written for GitHub also work on the site.
//   INPUTS: { text: string - heading text with tags stripped and entities decoded }
//   OUTPUTS: { string - lower-cased text with letters, marks, numbers, connector punctuation and hyphens kept, and each space turned into a hyphen }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: slugify
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
    .replace(/ /g, "-");
}

// START_CONTRACT: stripTags
//   PURPOSE: Remove HTML tags so that only their text remains.
//   INPUTS: { html: string - an HTML fragment }
//   OUTPUTS: { string - the fragment without any tag, entities still encoded }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: stripTags
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
};

// START_CONTRACT: decodeEntities
//   PURPOSE: Decode the named and numeric character references that Bun.markdown writes into HTML text.
//   INPUTS: { text: string - text that may contain character references }
//   OUTPUTS: { string - the text with &amp; &lt; &gt; &quot;, decimal and hexadecimal references decoded in one pass }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: decodeEntities
export function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot);/g,
    (whole: string, body: string) => {
      if (body.startsWith("#x") || body.startsWith("#")) {
        const code = body.startsWith("#x")
          ? Number.parseInt(body.slice(2), 16)
          : Number(body.slice(1));
        return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
      }
      return NAMED_ENTITIES[body] ?? whole;
    },
  );
}

// START_CONTRACT: plainText
//   PURPOSE: Give the visible text of an HTML fragment, for search and for table cell checks.
//   INPUTS: { html: string - an HTML fragment }
//   OUTPUTS: { string - tags replaced by spaces, entities decoded, whitespace collapsed to single spaces and trimmed }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: plainText
export function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// START_CONTRACT: VOCABULARY_DEFINITION
//   PURPOSE: Name the single table exempt from the forbidden-claim check, the maturity vocabulary of the foundation README.
//   INPUTS: none
//   OUTPUTS: { source - repository path of the file, heading - slug of the heading that owns the table }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: VOCABULARY_DEFINITION
/**
 * The table under "Maturity vocabulary" in docs/foundation/README.md defines
 * the word `verified` rather than claiming a result, so it is not checked
 * (docs-site contract, body rules). The exemption is narrow: the file and the
 * heading must both match. The same table anywhere else is checked
 * (test cases 19 and 20).
 */
export const VOCABULARY_DEFINITION = {
  source: "docs/foundation/README.md",
  heading: "maturity-vocabulary",
} as const;

export interface CompileOptions {
  readonly root: string; // repository root (absolute)
  readonly git: () => { readonly commit: string; readonly dirty: boolean };
}

export interface CompileOutput {
  readonly content: ContentFile;
  readonly search: string; // JSON.stringify of the MiniSearch index
  readonly llms: string;
  readonly index: string; // JSON.stringify(indexJson, null, 2) + "\n"
}

export type CompileResult =
  | { readonly ok: true; readonly output: CompileOutput }
  | {
      readonly ok: false;
      readonly problems: ReadonlyArray<{
        readonly file: string;
        readonly message: string;
      }>;
    };

type Problem = { file: string; message: string };

/** Front matter after validation. Kind-specific fields are present only for their kind. */
interface Front {
  readonly id: string;
  readonly title: string;
  readonly kind: Kind;
  readonly status: Status;
  readonly maturity: Maturity;
  readonly summary: string;
  readonly related: ReadonlyArray<string>;
  readonly number?: number;
  readonly code?: string;
  readonly order?: number;
  readonly classification?: string;
  readonly fundamental?: boolean;
  readonly engine?: boolean;
  readonly stage0?: "in-scope" | "minimal" | "deferred";
  readonly date?: string;
  readonly section?:
    "introduction" | "first-locus" | "examples" | "agent-reference";
}

interface Placement {
  readonly route: string;
  readonly navSection: NavSectionId;
}

interface Candidate {
  readonly path: string;
  readonly id: string;
  readonly kind: Kind;
  readonly placement: Placement;
  readonly related: ReadonlyArray<string>;
  readonly raw: Record<string, unknown>;
  readonly front: Front | undefined;
  readonly body: string;
}

interface Rendered {
  readonly candidate: Candidate;
  readonly html: string;
  readonly outline: ReadonlyArray<Heading>;
}

type LinkOutcome =
  | { readonly kind: "keep" }
  | { readonly kind: "rewrite"; readonly href: string }
  | { readonly kind: "problem"; readonly message: string };

interface LinkContext {
  readonly root: string;
  readonly routes: ReadonlySet<string>;
  readonly docs: ReadonlyMap<string, Rendered>;
}

const CLAIM = /\b(verified|passing|all tests pass)\b/i;
const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const GITHUB_REPO = "https://github.com/unknownlab/telos";

const KINDS = [
  "index",
  "doctrine",
  "principle",
  "term",
  "model",
  "capability-map",
  "direction",
  "roadmap",
  "questions",
  "decision",
  "research",
  "guide",
] as const;
const STATUSES = [
  "provisional",
  "proposed",
  "accepted",
  "open",
  "superseded",
  "deprecated",
] as const;
const MATURITIES = ["vision", "proposed", "implemented"] as const;
const STAGE0 = ["in-scope", "minimal", "deferred"] as const;
const GUIDE_SECTIONS = [
  "introduction",
  "first-locus",
  "examples",
  "agent-reference",
] as const;

type GuideSection = (typeof GUIDE_SECTIONS)[number];

const NonBlank = Schema.String.check(
  Schema.makeFilter(
    (s: string) => s.trim().length > 0 || "Expected a non-blank string",
  ),
);

const common = {
  id: NonBlank,
  title: NonBlank,
  status: Schema.Literals(STATUSES),
  maturity: Schema.Literals(MATURITIES),
  summary: NonBlank,
  related: Schema.Array(Schema.String),
};

const plain = <K extends Kind>(kind: K) =>
  Schema.Struct({ ...common, kind: Schema.Literal(kind) });

const FRONT_SCHEMAS: Readonly<
  Record<Kind, Schema.Codec<Front, unknown, never, never>>
> = {
  index: plain("index"),
  doctrine: plain("doctrine"),
  principle: Schema.Struct({
    ...common,
    kind: Schema.Literal("principle"),
    number: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 16 })),
    code: Schema.String.check(Schema.isPattern(/^P(0[1-9]|1[0-6])$/)),
  }),
  term: Schema.Struct({
    ...common,
    kind: Schema.Literal("term"),
    order: Schema.Number,
    classification: NonBlank,
    fundamental: Schema.Boolean,
    engine: Schema.Boolean,
    stage0: Schema.Literals(STAGE0),
  }),
  model: plain("model"),
  "capability-map": plain("capability-map"),
  direction: plain("direction"),
  roadmap: plain("roadmap"),
  questions: plain("questions"),
  decision: Schema.Struct({
    ...common,
    kind: Schema.Literal("decision"),
    date: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/)),
  }),
  research: plain("research"),
  guide: Schema.Struct({
    ...common,
    kind: Schema.Literal("guide"),
    order: Schema.Number,
    section: Schema.Literals(GUIDE_SECTIONS),
  }),
};

const KindSchema = Schema.Struct({ kind: Schema.Literals(KINDS) });

const formatter = SchemaIssue.makeFormatterStandardSchemaV1();

function decodeWith<T>(
  schema: Schema.Codec<T, unknown, never, never>,
  input: unknown,
  onExcessProperty: "error" | "ignore",
):
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: ReadonlyArray<string> } {
  const result = Effect.runSync(
    Effect.result(
      Schema.decodeUnknownEffect(schema)(input, {
        onExcessProperty,
        errors: "all",
      }),
    ),
  );
  if (result._tag === "Success") return { ok: true, value: result.success };
  return {
    ok: false,
    issues: formatter(result.failure.issue).issues.map(
      (i) => `${(i.path ?? []).map(String).join(".")}: ${i.message}`,
    ),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isGuideSection(value: unknown): value is GuideSection {
  return (
    typeof value === "string" &&
    (GUIDE_SECTIONS as ReadonlyArray<string>).includes(value)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function statOrUndefined(path: string) {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

// START_BLOCK_PLACEMENT
function placementOf(
  kind: Kind,
  id: string,
  section: unknown,
): Placement | undefined {
  switch (kind) {
    case "guide":
      if (!isGuideSection(section)) return undefined;
      return section === "introduction"
        ? { route: "/", navSection: "introduction" }
        : { route: `/${section}`, navSection: section };
    case "doctrine":
      return { route: "/philosophy", navSection: "philosophy" };
    case "principle":
      return { route: `/principles/${id}`, navSection: "principles" };
    case "term":
      return { route: `/terminology/${id}`, navSection: "terminology" };
    case "decision":
      return { route: `/decisions/${id}`, navSection: "decisions" };
    case "roadmap":
      return { route: "/roadmap", navSection: "roadmap" };
    case "index":
      if (id === "principles")
        return { route: "/principles", navSection: "principles" };
      if (id === "terminology")
        return { route: "/terminology", navSection: "terminology" };
      if (id === "decisions")
        return { route: "/decisions", navSection: "decisions" };
      return { route: `/architecture/${id}`, navSection: "architecture" };
    default:
      return { route: `/architecture/${id}`, navSection: "architecture" };
  }
}
// END_BLOCK_PLACEMENT

// START_BLOCK_READ_DOCUMENT
function readDocument(
  path: string,
  text: string,
  problems: Problem[],
): Candidate | undefined {
  const match = FRONT_MATTER.exec(text);
  if (!match) {
    problems.push({ file: path, message: "missing front matter" });
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(match[1] ?? "");
  } catch (error) {
    problems.push({
      file: path,
      message: `front matter is not valid YAML: ${errorMessage(error)}`,
    });
    return undefined;
  }
  if (!isPlainObject(parsed)) {
    problems.push({ file: path, message: "front matter must be a mapping" });
    return undefined;
  }
  const raw = parsed;
  const body = text.slice(match[0].length);

  const kindCheck = decodeWith(KindSchema, raw, "ignore");
  if (!kindCheck.ok) {
    for (const issue of kindCheck.issues) {
      problems.push({ file: path, message: `front matter: ${issue}` });
    }
    return undefined;
  }
  const kind = kindCheck.value.kind;

  const full = decodeWith(FRONT_SCHEMAS[kind], raw, "error");
  if (!full.ok) {
    for (const issue of full.issues) {
      problems.push({ file: path, message: `front matter: ${issue}` });
    }
  }

  const id = raw.id;
  if (typeof id !== "string") return undefined;
  const placement = placementOf(kind, id, raw.section);
  if (placement === undefined) return undefined;

  return {
    path,
    id,
    kind,
    placement,
    related: Array.isArray(raw.related) ? raw.related.filter(isString) : [],
    raw,
    front: full.ok ? full.value : undefined,
    body,
  };
}
// END_BLOCK_READ_DOCUMENT

// START_BLOCK_RENDER_HEADINGS
function assignHeadingIds(html: string): { html: string; outline: Heading[] } {
  const used = new Set<string>();
  const outline: Heading[] = [];
  const rendered = html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (_whole: string, level: string, inner: string) => {
      const base = slugify(decodeEntities(stripTags(inner)));
      let id = base;
      for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      outline.push({ level: Number(level), id, text: plainText(inner) });
      return `<h${level} id="${escapeAttr(id)}">${inner}</h${level}>`;
    },
  );
  return { html: rendered, outline };
}
// END_BLOCK_RENDER_HEADINGS

// START_BLOCK_REWRITE_LINKS
function resolveHref(
  href: string,
  source: string,
  ctx: LinkContext,
): LinkOutcome {
  if (EXTERNAL.test(href)) return { kind: "keep" };
  if (href.startsWith("/")) {
    const path = href.replace(/[?#].*$/, "");
    return ctx.routes.has(path) || APP_ROUTES.includes(path)
      ? { kind: "keep" }
      : { kind: "problem", message: `unknown site route "${href}"` };
  }

  const hash = href.indexOf("#");
  const pathPart = hash === -1 ? href : href.slice(0, hash);
  const fragment = hash === -1 ? "" : href.slice(hash + 1);
  const joined =
    pathPart === ""
      ? source
      : posix.normalize(posix.join(posix.dirname(source), pathPart));
  const target = joined.replace(/\/+$/, "");
  if (target === ".." || target.startsWith("../")) {
    return {
      kind: "problem",
      message: `broken link "${href}": points outside the repository`,
    };
  }
  const suffix = fragment === "" ? "" : `#${fragment}`;

  const doc = ctx.docs.get(target);
  if (doc !== undefined) {
    if (
      fragment !== "" &&
      !doc.outline.some((h) => h.id === safeDecode(fragment))
    ) {
      return {
        kind: "problem",
        message: `broken link "${href}": no heading "${fragment}" in ${target}`,
      };
    }
    return {
      kind: "rewrite",
      href: `${doc.candidate.placement.route}${suffix}`,
    };
  }

  const info = statOrUndefined(join(ctx.root, target));
  if (info !== undefined) {
    const kind = info.isDirectory() ? "tree" : "blob";
    return {
      kind: "rewrite",
      href: `${GITHUB_REPO}/${kind}/main/${target}${suffix}`,
    };
  }
  return {
    kind: "problem",
    message: `broken link "${href}": no such file ${target}`,
  };
}

function rewriteLinks(
  html: string,
  source: string,
  ctx: LinkContext,
  problems: Problem[],
): string {
  return html.replace(/<a href="([^"]*)"/g, (whole: string, raw: string) => {
    const outcome = resolveHref(decodeEntities(raw), source, ctx);
    if (outcome.kind === "problem") {
      problems.push({ file: source, message: outcome.message });
      return whole;
    }
    if (outcome.kind === "keep") return whole;
    return `<a href="${escapeAttr(outcome.href)}"`;
  });
}
// END_BLOCK_REWRITE_LINKS

// START_BLOCK_CHECK_CLAIMS
function stringsOf(value: unknown): string[] {
  if (isString(value)) return [value];
  return Array.isArray(value) ? value.filter(isString) : [];
}

function isExemptTable(path: string, lastHeading: string): boolean {
  return (
    path === VOCABULARY_DEFINITION.source &&
    lastHeading === VOCABULARY_DEFINITION.heading
  );
}

function checkClaims(rendered: Rendered, problems: Problem[]): void {
  const { path, raw } = rendered.candidate;
  for (const [key, value] of Object.entries(raw)) {
    for (const text of stringsOf(value)) {
      const match = CLAIM.exec(text);
      if (match) {
        problems.push({
          file: path,
          message: `forbidden verification claim "${match[0]}" in front matter field "${key}"`,
        });
      }
    }
  }

  let lastHeading = "";
  for (const block of rendered.html.matchAll(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<table>([\s\S]*?)<\/table>/g,
  )) {
    if (block[1] !== undefined) {
      lastHeading = /id="([^"]*)"/.exec(block[0])?.[1] ?? "";
      continue;
    }
    if (isExemptTable(path, lastHeading)) continue;
    const table = block[3] ?? "";
    const head = /<thead>([\s\S]*?)<\/thead>/.exec(table)?.[1] ?? "";
    const headers = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(
      (cell) => plainText(cell[1] ?? ""),
    );
    const watched = headers.flatMap((header, index) => {
      const name = header.toLowerCase();
      return name === "status" || name === "maturity"
        ? [{ header, index }]
        : [];
    });
    const body = /<tbody>([\s\S]*?)<\/tbody>/.exec(table)?.[1] ?? "";
    for (const row of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const cells = [...(row[1] ?? "").matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
      for (const { header, index } of watched) {
        const cell = cells[index];
        if (cell === undefined) continue;
        const match = CLAIM.exec(plainText(cell[1] ?? ""));
        if (match) {
          problems.push({
            file: path,
            message: `forbidden verification claim "${match[0]}" in the ${header} column`,
          });
        }
      }
    }
  }
}
// END_BLOCK_CHECK_CLAIMS

// START_BLOCK_BUILD_SECTIONS
function searchSectionsOf(doc: ContentDocument): SearchSection[] {
  const headings = [
    ...doc.html.matchAll(/<h([2-6]) id="([^"]*)">([\s\S]*?)<\/h\1>/g),
  ];
  const firstAt = headings[0]?.index ?? doc.html.length;
  const sections: SearchSection[] = [
    {
      id: doc.route,
      title: doc.title,
      heading: "",
      summary: doc.summary,
      text: plainText(doc.html.slice(0, firstAt)),
      docTitle: doc.title,
      route: doc.route,
    },
  ];
  headings.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = headings[index + 1]?.index ?? doc.html.length;
    sections.push({
      id: `${doc.route}#${decodeEntities(match[2] ?? "")}`,
      title: "",
      heading: plainText(match[3] ?? ""),
      summary: "",
      text: plainText(doc.html.slice(start, end)),
      docTitle: doc.title,
      route: doc.route,
    });
  });
  return sections;
}

function llmsText(documents: ReadonlyArray<ContentDocument>): string {
  const blocks = [
    "# Telos by UnknownLab",
    "> Telos by UnknownLab is a framework in which software systems are described, verified and evolved as code. This file lists the pages of the local documentation site, which is generated from docs/ in the repository.",
  ];
  for (const section of NAV_SECTIONS) {
    if (section.id === "playground") {
      blocks.push(
        `## ${section.title}\n\n- [${section.title}](${section.route}): Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser.`,
      );
      continue;
    }
    if (section.id === "calculator") {
      blocks.push(
        `## ${section.title}\n\n- [${section.title}](${section.route}): The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.`,
      );
      continue;
    }
    if (section.id === "inspector") {
      blocks.push(
        `## ${section.title}\n\n- [${section.title}](${section.route}): The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json.`,
      );
      continue;
    }
    if (section.id === "verification") {
      blocks.push(
        `## ${section.title}\n\n- [${section.title}](${section.route}): The Archetype verification and Semantic Closure report from the build-time run, with its provenance.`,
      );
      continue;
    }
    const list = documents
      .filter((d) => d.navSection === section.id)
      .sort(compareInSection);
    if (list.length === 0) continue;
    const lines = list.map((d) => `- [${d.title}](${d.route}): ${d.summary}`);
    blocks.push(`## ${section.title}\n\n${lines.join("\n")}`);
  }
  return `${blocks.join("\n\n")}\n`;
}

function documentFields(front: Front): Partial<ContentDocument> {
  return {
    ...(front.number !== undefined ? { number: front.number } : {}),
    ...(front.code !== undefined ? { code: front.code } : {}),
    ...(front.order !== undefined ? { order: front.order } : {}),
    ...(front.classification !== undefined
      ? { classification: front.classification }
      : {}),
    ...(front.fundamental !== undefined
      ? { fundamental: front.fundamental }
      : {}),
    ...(front.engine !== undefined ? { engine: front.engine } : {}),
    ...(front.stage0 !== undefined ? { stage0: front.stage0 } : {}),
    ...(front.date !== undefined ? { date: front.date } : {}),
    ...(front.section !== undefined ? { section: front.section } : {}),
  };
}
// END_BLOCK_BUILD_SECTIONS

// START_CONTRACT: compileContent
//   PURPOSE: Compile the documentation sources under a repository root into the generated site files, or report every NS-020 problem.
//   INPUTS: { options: CompileOptions - repository root and the git reader for generatedFrom }
//   OUTPUTS: { Promise<CompileResult> - ok with the four outputs, or not ok with problems sorted by file then message }
//   SIDE_EFFECTS: reads Markdown files under the root; writes nothing
//   LINKS: M-DOCS-CONTENT
// END_CONTRACT: compileContent
export async function compileContent(
  options: CompileOptions,
): Promise<CompileResult> {
  const { root } = options;
  const problems: Problem[] = [];

  // START_BLOCK_SCAN_AND_VALIDATE
  const glob = new Bun.Glob(
    "docs/{foundation,decisions,research,guides}/**/*.md",
  );
  const paths = (await Array.fromAsync(glob.scan({ cwd: root }))).sort(
    compareText,
  );
  const candidates: Candidate[] = [];
  for (const path of paths) {
    const text = await Bun.file(join(root, path)).text();
    const candidate = readDocument(path, text, problems);
    if (candidate !== undefined) candidates.push(candidate);
  }
  // END_BLOCK_SCAN_AND_VALIDATE

  // START_BLOCK_DEDUPE_ROUTES
  const idOwner = new Map<string, string>();
  const routeOwner = new Map<string, string>();
  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    const sameId = idOwner.get(candidate.id);
    if (sameId !== undefined) {
      problems.push({
        file: candidate.path,
        message: `duplicate id "${candidate.id}" (also in ${sameId})`,
      });
      continue;
    }
    const route = candidate.placement.route;
    const sameRoute = routeOwner.get(route);
    if (sameRoute !== undefined) {
      problems.push({
        file: candidate.path,
        message: `route "${route}" is also used by ${sameRoute}`,
      });
      continue;
    }
    idOwner.set(candidate.id, candidate.path);
    routeOwner.set(route, candidate.path);
    kept.push(candidate);
  }
  // END_BLOCK_DEDUPE_ROUTES

  // START_BLOCK_RENDER
  const rendered: Rendered[] = kept.map((candidate) => {
    const { html, outline } = assignHeadingIds(
      Bun.markdown.html(candidate.body),
    );
    return { candidate, html, outline };
  });
  const docs = new Map(rendered.map((r) => [r.candidate.path, r] as const));
  const ctx: LinkContext = {
    root,
    routes: new Set(rendered.map((r) => r.candidate.placement.route)),
    docs,
  };
  // END_BLOCK_RENDER

  // START_BLOCK_LINKS_RELATED_CLAIMS
  const linked = rendered.map((r) => ({
    ...r,
    html: rewriteLinks(r.html, r.candidate.path, ctx, problems),
  }));
  const ids = new Set(kept.map((c) => c.id));
  for (const candidate of kept) {
    for (const related of candidate.related) {
      if (!ids.has(related)) {
        problems.push({
          file: candidate.path,
          message: `related id "${related}" does not resolve to a document`,
        });
      }
    }
  }
  for (const r of rendered) {
    if (r.candidate.front !== undefined) checkClaims(r, problems);
  }
  // END_BLOCK_LINKS_RELATED_CLAIMS

  if (problems.length > 0) {
    problems.sort(
      (a, b) =>
        compareText(a.file, b.file) || compareText(a.message, b.message),
    );
    return { ok: false, problems };
  }

  // START_BLOCK_BUILD_OUTPUT
  const documents: ContentDocument[] = [];
  for (const r of linked) {
    const front = r.candidate.front;
    if (front === undefined) continue;
    documents.push({
      id: front.id,
      title: front.title,
      kind: front.kind,
      status: front.status,
      maturity: front.maturity,
      summary: front.summary,
      related: front.related,
      route: r.candidate.placement.route,
      navSection: r.candidate.placement.navSection,
      source: r.candidate.path,
      html: r.html,
      outline: r.outline,
      ...documentFields(front),
    });
  }
  documents.sort((a, b) => compareText(a.id, b.id));

  const search = new MiniSearch<SearchSection>(SEARCH_OPTIONS);
  search.addAll(documents.flatMap(searchSectionsOf));

  const indexJson = {
    version: 1,
    generatedFrom: options.git(),
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      kind: d.kind,
      status: d.status,
      maturity: d.maturity,
      summary: d.summary,
      related: d.related,
      url: d.route,
      source: d.source,
    })),
  };

  return {
    ok: true,
    output: {
      content: { version: 1, documents },
      search: JSON.stringify(search),
      llms: llmsText(documents),
      index: `${JSON.stringify(indexJson, null, 2)}\n`,
    },
  };
  // END_BLOCK_BUILD_OUTPUT
}

// START_BLOCK_CLI_GIT
function readGit(root: string): { commit: string; dirty: boolean } {
  try {
    const head = Bun.spawnSync({
      cmd: ["git", "rev-parse", "HEAD"],
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    const status = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    if (!head.success || !status.success)
      return { commit: "unknown", dirty: true };
    return {
      commit: head.stdout.toString().trim(),
      dirty: status.stdout.toString().trim() !== "",
    };
  } catch {
    return { commit: "unknown", dirty: true };
  }
}
// END_BLOCK_CLI_GIT

if (import.meta.main) {
  // START_BLOCK_CLI_RUN
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { root: { type: "string" }, out: { type: "string" } },
    strict: true,
  });
  const root = resolve(values.root ?? resolve(import.meta.dir, "../../.."));
  const out = resolve(values.out ?? resolve(import.meta.dir, ".."));

  const result = await compileContent({ root, git: () => readGit(root) });
  if (!result.ok) {
    for (const problem of result.problems) {
      console.error(`${problem.file}: ${problem.message}`);
    }
    console.error(`content: ${result.problems.length} problem(s)`);
    process.exit(1);
  }

  const { content, search, llms, index } = result.output;
  const generated = join(out, "src/generated");
  const publicDir = join(out, "public");
  mkdirSync(generated, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  await Bun.write(join(generated, "content.json"), JSON.stringify(content));
  await Bun.write(join(generated, "search.json"), search);
  await Bun.write(join(publicDir, "llms.txt"), llms);
  await Bun.write(join(publicDir, "index.json"), index);
  console.log(`content: ${content.documents.length} documents`);
  // END_BLOCK_CLI_RUN
}

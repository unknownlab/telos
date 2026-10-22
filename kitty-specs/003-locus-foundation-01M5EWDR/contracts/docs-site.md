# Contract: documentation site (`apps/docs`)

Package: `apps/docs`, name `@telos/docs`, `"private": true`. Stack: TanStack Start, React, Tailwind CSS 4, shadcn/ui and Vite, run under Bun (versions in [research.md R-01](../research.md#r-01-dependencies-and-supply-chain)). The site is a static build with no server (C-008). Content comes only from `docs/` (ADR-0012, C-003).

## Content sources

All `*.md` files under `docs/foundation/`, `docs/decisions/`, `docs/research/` and `docs/guides/` (new in this mission). `docs/tooling.md` is not site content.

### Front matter

Every source file starts with YAML front matter. Fields common to all kinds:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | unique across all content; used in `related` and in URLs |
| `title` | string | not blank |
| `kind` | one of the kinds below | closed set |
| `status` | `provisional` \| `proposed` \| `accepted` \| `open` \| `superseded` \| `deprecated` | closed set |
| `maturity` | `vision` \| `proposed` \| `implemented` | closed set (FR-018) |
| `summary` | string | not blank; one or two sentences |
| `related` | list of ids | every id resolves to a document |

Extra fields by kind:

| `kind` | Extra fields (required unless marked optional) | Source |
| --- | --- | --- |
| `index` | — | section `README.md` files |
| `doctrine` | — | `philosophy/` |
| `principle` | `number` (1–16), `code` (`P01`…) | `principles/` |
| `term` | `order` (number), `classification`, `fundamental` (boolean), `engine` (boolean), `stage0` (`in-scope` \| `minimal` \| `deferred`) | `terminology/` |
| `model` | — | `conceptual-model/` |
| `capability-map`, `direction` | — | `architecture/` |
| `roadmap` | — | `roadmap/` |
| `questions` | — | `open-questions.md` |
| `decision` | `date` (ISO date) | `docs/decisions/` |
| `research` | — | `docs/research/` |
| `guide` | `order` (number), `section` (`introduction` \| `first-locus` \| `examples` \| `agent-reference`) | `docs/guides/` (new) |

Unknown fields are build errors. That way a typo cannot silently drop data.

### Body rules

- Relative links to other content files become site routes. A `#fragment` must match a heading id in the target, using GitHub-style slugs.
- Relative links to other repository files become `https://github.com/unknownlab/telos/blob/main/<path>`. The target file must exist.
- ```` ```mermaid ```` blocks are rendered client-side with `securityLevel: "strict"`. Without JavaScript the source text is shown.
- Links that start with `/` must name a document route or one of the app routes (`/architecture`, `/playground`, `/playground/a` … `/playground/e`, `/verification`). Guides use them to link to the playground.
- No content file may claim a result was verified (FR-018). The build fails on the words `verified`, `passing` or `all tests pass` in a status or maturity position, meaning a front matter value or a table cell in a column named Status or Maturity. One exemption, named in the script and covered by a test: the table under the heading "Maturity vocabulary" in `docs/foundation/README.md`, which defines the word `verified` rather than claiming it (task phase, 2026-10-21).

### Build failures (NS-020)

The content script exits non-zero and lists each problem as `<file>: <problem>` when it finds:

- missing or invalid front matter, or an unknown kind, status, maturity or field;
- a duplicate `id`;
- an unresolved `related` id;
- a broken relative link or fragment;
- a link to a missing repository file, or a `/` link to an unknown site route;
- two documents mapped to the same route;
- a forbidden verification claim.

## Routes and sections (FR-013)

| Nav section | Route(s) | Content |
| --- | --- | --- |
| Introduction | `/` | guide `introduction` |
| Philosophy | `/philosophy` | doctrine `evolution-of-determinism` |
| Principles | `/principles`, `/principles/$id` | principles index, P01–P16 |
| Terminology | `/terminology`, `/terminology/$id` | terminology index, terms ordered by `order` |
| Architecture | `/architecture`, `/architecture/$id` | conceptual model, capability map, technical direction, open questions, research documents |
| First Locus | `/first-locus` | guide `first-locus` (tutorial; each step links to the playground with that step's input) |
| Examples | `/examples` | guide `examples` |
| Playground | `/playground`, `/playground/$scenario` (`a`…`e`) | interactive; see below |
| Verification | `/verification` | build-time spec report |
| Roadmap | `/roadmap` | roadmap |
| Decisions | `/decisions`, `/decisions/$id` | ADR index with status, ADR pages |
| Agent Reference | `/agent-reference` | guide `agent-reference` (FR-023) |

Every content route is prerendered to static HTML (NFR-005). An unknown route renders a 404 page. Each content page shows the title, the summary, `status` and `maturity` badges, related documents and the source path in the repository.

## Generated artifacts

Written by `apps/docs/scripts/content.ts` and `apps/docs/scripts/spec-report.ts` before `vite build`. Anything under `src/generated/` is gitignored and never edited by hand.

| Artifact | Contents |
| --- | --- |
| `src/generated/content.json` | every document: front matter, rendered HTML, heading outline, source path, route |
| `src/generated/search.json` | MiniSearch index over title, summary and plain body text (FR-016) |
| `src/generated/spec-report.json` | `{ report: SpecReport; provenance: Provenance }` or, when it was not produced, absent |
| `public/llms.txt` | the [llms.txt](https://llmstxt.org) format: H1 `Telos by UnknownLab`, a summary blockquote, then one `## <section>` list per nav section with `- [title](absolute-path): summary` (FR-017) |
| `public/index.json` | `{ version: 1, generatedFrom: { commit, dirty }, documents: [{ id, title, kind, status, maturity, summary, related, url, source }] }`, sorted by `id` (FR-017) |

## Provenance

```ts
type Provenance =
  | { origin: "browser"; at: string; packages: PackageVersions; siteCommit: string }
  | { origin: "bun-build"; at: string; runtime: string; packages: PackageVersions; commit: string; dirty: boolean }
  | { origin: "ci" }                 // never produced in Stage 0; rendered as "CI: not available"
  | { origin: "historical"; at: string; packages: PackageVersions; siteCommit: string } // a browser result whose input was edited after the run

type PackageVersions = { "@telos/locus": string; "@telos/locus-specs": string }
```

Rendering rules (INV-013, FR-021):

- Every element that shows a result (validation report, Revision id, change set, history state, decode error, spec report or spec result) carries `data-result="<kind>"` and `data-provenance="<origin>"`, and contains a visible `ProvenanceLabel`.
- When the input is edited after a run, the result keeps its content, its origin changes to `historical`, and it is visually marked as stale. It is never silently recomputed.
- `/verification` shows the `bun-build` report when `spec-report.json` exists. If it does not, the page shows "Not run" with `data-result="spec-report" data-provenance="none"`, and no pass counts (NS-018). A non-zero `failed` or `errored` count is shown as such and is never hidden.
- The CI row always reads "CI: not available".

## Playground (FR-019, FR-020)

| Scenario | Route | Input | Output |
| --- | --- | --- | --- |
| A Define | `/playground/a` | Fabric JSON (starts from `examples.valid`) | decode result, validation report (valid) and the Revision id of each Locus |
| B Invalid | `/playground/b` | Fabric JSON (starts from `examples.invalid`) | decode errors with paths, or diagnostics listed with code, subject, path, detail |
| C Relations | `/playground/c` | Fabric JSON (starts from `examples.relations`) | validation report plus a relation table; `refines` cycles highlighted |
| D Revisions | `/playground/d` | two Locus JSON editors, "A" and "B" (starts from `examples.history`) | both Revision ids, the change set, and a history panel with append buttons, an editable expected head, and the outcome of each append |
| E Specifications | `/playground/e` | none (button "Run all") | browser `SpecReport`, with each record's expected and observed values, next to the build report and an id-equality check against it |

Rules:

- Input is text in a `<textarea>`, parsed only with `decodeFabricJson` / `decodeLocus`. The playground source contains no `eval`, `new Function`, dynamic `import()` of user text, `<script>` injection, or `dangerouslySetInnerHTML` of user-derived text. A source scan test enforces this.
- Computation runs on explicit "Run" actions, never on each keystroke. Input over 1 MB is refused by the decoder.
- Without JavaScript, `/playground/*` renders the scenario description, the example input as read-only text, and "The playground needs JavaScript".
- All controls are keyboard operable and have accessible names (NFR-004).

## Theme and search

- Theme: `light`, `dark` or `system` (default). The choice is stored in `localStorage` with every access wrapped in try/catch, and applied before first paint by an inline script. Without storage, the system setting is used (FR-015).
- Search: a dialog opened by a button and `/` or `Ctrl/⌘+K`. It shows matches by title, summary and body, and each result links to the route and heading (FR-016).

## Data attributes for tests

| Attribute | On |
| --- | --- |
| `data-result`, `data-provenance` | every result element (above) |
| `data-doc-id` | the main element of every content page |
| `data-nav-section` | each nav section link |
| `data-spec-id`, `data-spec-status` | each row of a spec report |
| `data-revision-id` | each displayed Revision id |

## Tests

| Suite | Location | Covers |
| --- | --- | --- |
| content pipeline | `apps/docs/test/content.test.ts` (Bun) | parsing, each NS-020 failure with a fixture tree, link rewriting, slugging, `llms.txt` and `index.json` shape |
| spec report | `apps/docs/test/spec-report.test.ts` (Bun) | provenance fields, `dirty` flag, failing records shown as failing |
| playground safety | `apps/docs/test/playground-safety.test.ts` (Bun) | source scan for forbidden constructs |
| browser | `apps/docs/e2e/*.e2e.ts` (Playwright, Chromium, against `dist/client` served by `scripts/serve-static.ts`) | the R-08 suites: navigation, search, theme, machine files, playground A–E, browser/Bun id equality, provenance coverage, NS-018, keyboard use, axe in both themes |

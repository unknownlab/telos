# Research: Locus Foundation — Semantic Identity and Ownership

Phase 0 output. Each entry: Decision, Rationale, Alternatives considered. Dates refer to 2026-10-21.

## R-01 Dependencies and supply chain

**Decision**: add the dependencies below, each pinned to an exact version. Each pin is the newest stable release in the package's current major line that was published by 2026-10-14, i.e. at least 7 days old. Where the newest release is younger than that, the previous one is chosen (marked †).

| Package | Version | Published | Used by | Kind | Install scripts | Why |
| --- | --- | --- | --- | --- | --- | --- |
| `effect` | 4.0.4 † | 2026-10-13 | locus, locus-specs, docs | runtime | none | Errors, services, layers, Schema (ADR-0004); 0 dependencies |
| `@tanstack/react-start` | 1.169.2 † | 2026-10-14 | docs | runtime | none | Framework mandated by the directive; static prerendering |
| `@tanstack/react-router` | 1.170.44 † | 2026-10-12 | docs | runtime | none | Routing (peer of Start) |
| `@tanstack/router-plugin` | — (not added directly) | — | — | — | — | Start's Vite plugin generates the route tree itself and depends on the router plugin transitively (task-phase spike, 2026-10-21) |
| `react`, `react-dom` | 19.3.1 | 2026-10-14 | docs | runtime | none | UI |
| `vite` | 8.3.4 † | 2026-10-08 | docs | dev | none | Build tool required by Start (peer `>=8`) |
| `@vitejs/plugin-react` | 6.1.2 | 2026-10-05 | docs | dev | none | React transform (peer `vite ^8`) |
| `tailwindcss`, `@tailwindcss/vite` | 4.3.3 | 2026-07-16 | docs | dev | none | Styling mandated by the directive |
| `radix-ui` | 1.8.1 | 2026-10-12 | docs | runtime | none | Primitives behind shadcn/ui |
| `class-variance-authority` | 0.7.1 | 2024-11-26 | docs | runtime | none | shadcn/ui variants |
| `clsx` | 2.1.1 | 2024-04-23 | docs | runtime | none | shadcn/ui class joining |
| `tailwind-merge` | 3.7.0 | 2026-09-12 | docs | runtime | none | shadcn/ui class merging |
| `tw-animate-css` | 1.4.0 | 2025-09-24 | docs | dev | none | shadcn/ui animations (Tailwind 4) |
| `lucide-react` | 1.57.0 † | 2026-10-14 | docs | runtime | none | Icons used by shadcn/ui |
| `minisearch` | 7.2.0 | 2025-09-16 | docs | runtime | none | Client-side full-text search (FR-016); 0 dependencies |
| `mermaid` | 12.2.0 | 2026-10-13 | docs | runtime | none | Diagrams in the doctrine (loaded lazily) |
| `@types/react`, `@types/react-dom` | 19.3.0 | 2026-09-09 | docs | dev | none | Types |
| `@playwright/test` | 1.64.1 | 2026-10-14 | docs | dev | none | Browser tests (owner decision 01M5EWF1EAZ6V0FFMXCZ3027D3) |
| `@axe-core/playwright` | 4.13.0 † | 2026-08-11 | docs | dev | none | Accessibility checks (NFR-004) |
| `shadcn` (CLI, not a dependency) | 4.21.5 † | 2026-10-14 | run once via `bunx shadcn@4.21.5 add …` | tool | none | Generates shadcn/ui component source into `apps/docs/src/components/ui/` |

Supply-chain checks:

- **Registry authenticity**: all packages come from `registry.npmjs.org` under their canonical names. There are no scoped look-alikes: `@tanstack/*`, `@vitejs/*`, `@tailwindcss/*`, `@axe-core/*` and `@types/*` are the official scopes.
- **Freshness**: the 7-day cutoff above. The newest Vite (8.3.5) and Effect (4.0.5) were published less than a week ago and are not used.
- **Lifecycle scripts**: none of the pinned versions declares `preinstall`, `install` or `postinstall`. Bun runs dependency lifecycle scripts only for packages listed in `trustedDependencies`; that list stays empty.
- **Lockfile**: `bun.lock` is committed. Installs use `bun install --frozen-lockfile` after the first one.
- **Node LTS**: not applicable. The toolchain runs on Bun 1.4.4, and nothing requires Node.
- **Transitive weight**: `mermaid` (23 direct dependencies) and `radix-ui` (55) are the heaviest. Both are runtime dependencies of the docs app only; neither reaches `@telos/locus`.
- **Browser binary**: `bunx playwright install chromium` downloads Chromium for Playwright 1.64.1 into the user cache (`~/Library/Caches/ms-playwright`), outside the repository. This needs explicit owner approval (global side effect).
- **shadcn CLI**: runs remote package code once per component. Mitigation: pinned version, run only by the IC-01 or IC-08 implementer, and the diff is reviewed. The CLI must not add or upgrade dependencies (`package.json` is checked to be unchanged except for the approved pins).

**Rationale**: the directive mandates TanStack Start, React, shadcn/ui, Tailwind and Effect. The rest are the smallest additions that meet FR-016 (search), the doctrine's Mermaid diagrams and the owner's browser-test decision.

**Alternatives considered**:
- `marked` or `markdown-it` for Markdown: not needed; Bun's built-in renderer (R-04).
- `yaml` for front matter: not needed; `Bun.YAML.parse`.
- `happy-dom` + Testing Library for component tests: not needed; Playwright covers UI behaviour against the real build.
- `shiki` syntax highlighting: deferred; plain code blocks are enough for Stage 0.
- Rendering Mermaid at build time: needs a headless browser during the build; client-side lazy rendering, with the source shown when JavaScript is off, is simpler.
- Fumadocs: rejected in the foundation work (ADR-0012); adds its own content model.

## R-02 Effect 4 usage

**Decision**: use these Effect 4.0.4 APIs, confirmed from the package's type definitions:

- `Context.Service<Self, Shape>()("key")` for the `RevisionHistory` service class.
- `Layer.effect` / `Layer.succeed` for the in-memory layer.
- `Data.TaggedError("…")` for typed errors.
- `Effect.gen`, `Effect.tryPromise` for the Web Crypto digest.
- `Ref` for history state.
- `Schema.Struct`, `Schema.Literals`, `Schema.Array`, `Schema.optionalKey`, `Schema.String`, `Schema.fromJsonString` for the wire format.
- `Schema.decodeUnknownEffect` for decoding.
- `SchemaIssue.makeFormatterStandardSchemaV1()` to turn issues into `{ path, message }` lists.

**Rationale**: Effect 4 renamed and moved APIs relative to Effect 3 (for example `Context.Tag` is now `Context.Service`, and Schema lives in `effect` itself). Implementers must check names against `node_modules/effect/dist/*.d.ts`, not memory.

**Alternatives considered**: Effect 3: would start Telos with a migration (ADR-0004).

## R-03 Validation shape

**Decision**: `validateFabric` is a total pure function returning `{ valid, diagnostics }`. Diagnostics are sorted by (subject, code, path, detail). Cycles are reported once per cycle, as a list rotated to start at its smallest identity, with the subject being that smallest identity. At most 100 `relation.refines-cycle` diagnostics are reported per Fabric, then one `relation.refines-cycle-limit` (owner decision, 2026-10-21; see the contract). Duplicate checks key on values, not array positions, so reordering input cannot change output.

**Rationale**: the technical direction keeps pure functions out of `Effect`; P10 and INV-009 require complete, deterministic results; positional paths would make output depend on order (spec, User Story 1 scenario 3).

**Alternatives considered**: `Effect<Fabric, ValidationError>` failing on first error (violates INV-009); accumulating with `Effect.validateAll` (unneeded machinery for a pure check).

## R-04 Markdown rendering and content compilation

**Decision**: a Bun script (`apps/docs/scripts/content.ts`) reads every `docs/**/*.md` file. For each file it:

1. parses front matter with `Bun.YAML.parse`;
2. validates it with an Effect Schema per `kind`;
3. renders the body with `Bun.markdown.html` (available in Bun 1.4.4);
4. assigns heading ids with the same GitHub-style slug rule used by `docs/` links;
5. rewrites relative links to site routes;
6. collects errors.

It then writes `src/generated/content.json`, `public/llms.txt` and `public/index.json`. Any error stops the build with a list of file and problem. Links to repository files that are not documents become `https://github.com/unknownlab/telos/blob/main/<path>`.

**Rationale**: no Markdown or YAML dependency is needed; the build itself becomes the content linter (ADR-0012). A separate script, rather than a Vite plugin, keeps the logic testable with `bun test`.

**Alternatives considered**: a Vite virtual-module plugin (harder to test in isolation); MDX (moves content into the app).

## R-05 Static prerendering with TanStack Start under Bun

**Decision**: use TanStack Start's static prerender option, crawling from `/` with every route listed explicitly, and run Vite under Bun (`bun --bun vite build`). IC-08 starts with a spike: one prerendered route plus one client-only island. If prerendering under Bun fails, the fallback is SPA mode with a prerendered shell plus a Bun script that renders each content route to HTML through the router's server entry. The fallback is recorded as a deviation for review.

**Spike result (task phase, 2026-10-21)**: with the pinned versions, `tanstackStart({ prerender: { enabled: true, crawlLinks: true, failOnError: true }, pages: [{ path: "/" }] })` under `bun --bun vite build` wrote static `dist/client/index.html` and `dist/client/<route>/index.html` containing the rendered content; the result type-checks with `tsconfig.base.json` plus `jsx: react-jsx` and DOM libraries. The fallback is not needed.

**Rationale**: NFR-005 requires content readable without JavaScript, and C-008 rules out a server.

**Alternatives considered**: running a server (out of scope); a plain Vite SPA (fails NFR-005).

## R-06 Provenance model

**Decision**: one `Provenance` value type with four origins, rendered by one `ProvenanceLabel` component. Every result element carries `data-result` and `data-provenance` attributes so browser tests can check that no result is unlabelled.

| Origin | When | Fields |
| --- | --- | --- |
| `browser` | computed now in the reader's browser | time, package versions, site build commit |
| `bun-build` | computed by `spec-report.ts` during the build | time, Bun version, package versions, git commit, `dirty` flag |
| `ci` | never in Stage 0 | shown as "CI: not available" |
| `historical` | a browser result whose inputs have since been edited | original time; marked as no longer matching the input |

**Rationale**: ADR-0010, INV-013, FR-021. A dirty working tree at build time is recorded rather than hidden.

**Alternatives considered**: free-text labels (not checkable).

## R-07 Specification runner design

**Decision**: specifications are JSON-serialisable records (see [contracts/specifications.md](contracts/specifications.md)). The runner interprets each check kind by calling only the public `@telos/locus` API, and returns the observed outcome next to the expected one. Meta-tests copy each check kind with a deliberately wrong expectation and assert that the runner reports a failure.

**Rationale**: the same records run in Bun and in the playground (ADR-0013). The meta-tests close the "runner always passes" defect class (directive 043).

**Alternatives considered**: specs as functions (not displayable in the playground, not comparable across runtimes).

## R-08 Browser test scope

**Decision**: Playwright runs against the static output `apps/docs/dist/client`, served by a small Bun static file server (`apps/docs/scripts/serve-static.ts`, `Bun.serve`), in Chromium only. (Changed in the task phase: `vite preview` of a Start build runs the server bundle and would hide a missing prerendered page; serving the files proves NFR-005 and C-008.) Suites:

- navigation (every section, every document);
- search;
- theme;
- `llms.txt` and `index.json`;
- playground A–E;
- id equality between browser and build report;
- provenance coverage;
- keyboard-only playground use;
- axe in both themes on five pages.

**Rationale**: FR-013 to FR-022, NFR-001, NFR-004, SC-002, SC-004.

**Alternatives considered**: Firefox and WebKit as well (larger download; Stage 0 needs one real engine).

## R-09 Challenge pass (adversarial evidence)

A structured self-challenge of the security-relevant decisions was run in this planning session. No adversarial squad of separate agents was run: the owner has not asked for subagents during planning, and the mission review after merge (Opus) re-examines the same points.

| # | Challenge | Disposition |
| --- | --- | --- |
| 1 | The shadcn CLI executes remote code and may modify `package.json`. | `changed`: pinned version; the diff check on `package.json` is part of IC-01/IC-08 acceptance; the CLI is run only for listed components. |
| 2 | Mermaid parses Markdown-embedded diagram text in the browser; a malicious diagram could inject markup. | `accepted`: diagrams come only from repository content, not user input; Mermaid runs with `securityLevel: "strict"`. |
| 3 | Rendering repository Markdown as HTML uses raw HTML insertion. | `accepted`: C-002 forbids raw insertion of *user* text; repository content is reviewed source. Playground output never uses raw HTML insertion. |
| 4 | The Chromium download is a global side effect outside the repository. | `deferred_with_rationale`: required for the owner-chosen browser tests; listed as an explicit owner approval. |
| 5 | Pinning to versions at least 7 days old delays security fixes. | `accepted`: this is a local, unpublished site; versions can be bumped with a review. |
| 6 | Large playground JSON could freeze the tab. | `changed`: 1 MB input limit enforced by the decoder (spec edge case). |
| 7 | `localStorage` access can throw in private mode. | `changed`: theme persistence wraps every access and falls back to the system preference. |

## R-10 Model routing

**Decision** (owner, 2026-10-21): Haiku implements every work package, Sonnet reviews every work package, and Opus plans the mission and runs the mission review. The planning proposal was Sonnet for IC-02 to IC-10; the owner kept the charter default.

**Consequence**: each WP prompt must be self-sufficient. It quotes the exact Effect 4 and TanStack Start APIs it needs (R-02, the contracts) instead of relying on model knowledge, and states its acceptance tests. AGENTS.md's rule still applies: after two rejections of one WP, the owner is asked before a stronger model is used.

**Rationale for the original proposal**: the charter routes implementation to Haiku-class models "sized so that one of these models can finish each one from its prompt alone". Effect 4 (2026-10-01) and TanStack Start 1.169 are newer than such models' training data, and the core concerns carry subtle determinism and canonicalisation contracts. A rejected WP costs more than the model difference.

**Alternatives considered**: Haiku throughout, with very detailed prompts; AGENTS.md already escalates after two rejections, but starting on the weaker model for known-hard work is likely to hit that.

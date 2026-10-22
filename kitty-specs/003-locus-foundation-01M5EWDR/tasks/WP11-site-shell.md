---
work_package_id: WP11
title: Site shell
dependencies:
- WP09
- WP10
requirement_refs:
- C-008
- FR-013
- FR-018
- NFR-005
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T057
- T058
- T059
- T060
- T061
- T062
- T063
phase: Phase 5 - Documentation site
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/src/
create_intent:
- apps/docs/components.json
- apps/docs/vite.config.ts
- apps/docs/src/router.tsx
- apps/docs/src/routeTree.gen.ts
- apps/docs/src/styles.css
- apps/docs/src/routes/__root.tsx
- apps/docs/src/routes/index.tsx
- apps/docs/src/routes/philosophy.tsx
- apps/docs/src/routes/first-locus.tsx
- apps/docs/src/routes/examples.tsx
- apps/docs/src/routes/agent-reference.tsx
- apps/docs/src/routes/roadmap.tsx
- apps/docs/src/routes/not-found.tsx
- apps/docs/src/routes/principles/index.tsx
- apps/docs/src/routes/principles/$id.tsx
- apps/docs/src/routes/terminology/index.tsx
- apps/docs/src/routes/terminology/$id.tsx
- apps/docs/src/routes/architecture/index.tsx
- apps/docs/src/routes/architecture/$id.tsx
- apps/docs/src/routes/decisions/index.tsx
- apps/docs/src/routes/decisions/$id.tsx
- apps/docs/src/components/site-layout.tsx
- apps/docs/src/components/site-header.tsx
- apps/docs/src/components/site-nav.tsx
- apps/docs/src/components/badges.tsx
- apps/docs/src/components/document-page.tsx
- apps/docs/src/components/document-list.tsx
- apps/docs/src/components/not-found.tsx
- apps/docs/src/lib/utils.ts
- apps/docs/src/lib/site.ts
- apps/docs/src/lib/prerender.ts
- apps/docs/src/lib/generated.ts
- apps/docs/src/lib/load.ts
- apps/docs/test/site.test.ts
- apps/docs/test/components.test.tsx
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/components.json
- apps/docs/vite.config.ts
- apps/docs/src/router.tsx
- apps/docs/src/routeTree.gen.ts
- apps/docs/src/styles.css
- apps/docs/src/routes/__root.tsx
- apps/docs/src/routes/index.tsx
- apps/docs/src/routes/philosophy.tsx
- apps/docs/src/routes/first-locus.tsx
- apps/docs/src/routes/examples.tsx
- apps/docs/src/routes/agent-reference.tsx
- apps/docs/src/routes/roadmap.tsx
- apps/docs/src/routes/not-found.tsx
- apps/docs/src/routes/principles/**
- apps/docs/src/routes/terminology/**
- apps/docs/src/routes/architecture/**
- apps/docs/src/routes/decisions/**
- apps/docs/src/components/site-layout.tsx
- apps/docs/src/components/site-header.tsx
- apps/docs/src/components/site-nav.tsx
- apps/docs/src/components/badges.tsx
- apps/docs/src/components/document-page.tsx
- apps/docs/src/components/document-list.tsx
- apps/docs/src/components/not-found.tsx
- apps/docs/src/components/ui/**
- apps/docs/src/lib/utils.ts
- apps/docs/src/lib/site.ts
- apps/docs/src/lib/prerender.ts
- apps/docs/src/lib/generated.ts
- apps/docs/src/lib/load.ts
- apps/docs/test/site.test.ts
- apps/docs/test/components.test.tsx
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP11 – Site shell

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and follow its guidance before you read the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest frontend implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. Address all of it before you treat the work as complete.

---

## Objectives & Success Criteria

Build the documentation site's shell with TanStack Start. Every content document from `src/generated/content.json` (WP09) gets a prerendered static page. Each page has a layout, navigation for the 12 sections, maturity and status badges, related documents, a source link and a 404 page (FR-013, FR-018, NFR-005, C-008).

Done means:

1. `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site` finishes in under 60 seconds and writes one `dist/client/<route>/index.html` for every document in `content.json`. It also writes `dist/client/architecture/index.html` and `dist/client/not-found/index.html`.
2. Every content page, read without JavaScript, shows:
   - the document's own H1 (once);
   - the `Status:` and `Maturity:` badges;
   - the summary;
   - the body;
   - an "On this page" outline;
   - the related documents;
   - a source link to `https://github.com/unknownlab/telos/blob/main/<source>`.
   Its `<main>` carries `data-doc-id="<id>"`.
3. The navigation shows the 12 sections in `NAV_SECTIONS` order, each link with `data-nav-section="<id>"`. The current page is marked with `aria-current="page"`.
4. `/principles`, `/terminology` and `/decisions` list all their documents with titles, summaries and badges, taken from the documents themselves (User Story 3 scenario 1). `/architecture` lists the architecture documents.
5. shadcn/ui components were generated with the pinned CLI. `apps/docs/package.json` and `bun.lock` are **unchanged** by this WP.
6. `src/routeTree.gen.ts` is committed and matches what the build generates.
7. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Routes and sections**, **Data attributes for tests**, **Body rules**. This contract is authoritative.
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: FR-013, FR-018, NFR-005, User Story 3
- `apps/docs/src/lib/content-types.ts` (WP09): `ContentDocument`, `ContentFile`, `NAV_SECTIONS`, `APP_ROUTES`, `compareInSection`
- `apps/docs/scripts/content.ts` (WP09): `compileContent`, which the real-content test uses
- `apps/docs/package.json` and `apps/docs/tsconfig.json` (WP01). The `@/*` → `./src/*` alias is already configured.

### Facts verified in planning (TanStack Start 1.169.2, Vite 8.3.4, shadcn 4.21.5, 2026-10-21)

These were built and run in a scratch project with the exact pinned versions:

- **Prerendering** writes `dist/client/<path>/index.html` for every entry in `tanstackStart({ pages })`.
  - Dynamic routes such as `principles/$id.tsx` prerender from a `pages` list built in `vite.config.ts` from `content.json`.
  - With `prerender.failOnError: true`, the build **fails** on a listed page that has no route ("Failed to fetch /playground/a: Not Found") and on a page whose loader throws `notFound()`. So the prerender step also checks that every route exists.
  - `crawlLinks` stays `false`. Navigation links to `/playground` and `/verification` exist before WP13–WP15 create those routes, so crawling would fail the build.
- **Imports in the config.** `vite.config.ts` may import a `.ts` helper from `./src/lib/`, and `readFileSync(new URL("./src/generated/content.json", import.meta.url))` works inside it.
- **Path alias.** `resolve: { tsconfigPaths: true }` in the Vite config resolves the `@/` alias from `tsconfig.json`, so no `resolve.alias` is needed.
- **Generated JSON.** `import.meta.glob` with `{ eager: true }` inlines generated JSON. A pattern that matches no file gives an empty record. That is how a missing `spec-report.json` stays a build-time `null` (NS-018, used by WP13).
- **Loader data.** Route `loader` and `head: ({ loaderData }) => …` work during prerender. The page `<title>` comes from the loader data.
- **Root route.** `useLocation().pathname` in the root route's `component` is the prerendered path, for example `/principles/P01`. `head().scripts: [{ children: "…" }]` renders an inline `<script>` in the head. WP12 uses it for the theme.
- **Component tests.** `renderToStaticMarkup` from `react-dom/server` renders shadcn components in `bun test` with the `@/` alias, run from the repository root.
- **The shadcn CLI 4.21.5 adds an unapproved dependency.** `shadcn add` rewrites the `cn` import to `import { cn } from "cn"` and runs `bun add cn` (`"cn": "^0.5.0"`). `shadcn init` is worse: it also adds `shadcn` and `@fontsource-variable/geist`. The CLI has no flag that skips installing dependencies. T058 gives the exact procedure that undoes this. Never run `shadcn init`.
- The `new-york` style generates components that use only standard Tailwind variants (`data-[state=open]:`) and `tw-animate-css`, which is approved. They pass `bun check -b` under the repository's strict `tsconfig.base.json`, and `bun lint` / `bun fmt`.

### Real content facts

- Every source document has exactly **one** H1, at the top of its body. In 31 of 60 documents it differs from the front-matter `title`, for example `ADR-0002 — Locus is the primary semantic unit` against `Locus is the primary semantic unit`. Use the body's H1 as the visible heading. Never add a second H1 when the body has one.
- The section READMEs (`principles`, `terminology`, `decisions`) contain hand-written tables. The generated lists on their index pages are still required, because User Story 3 asks for titles and summaries "taken from the files".
- The content HTML is generated at build time from the repository. Rendering it with `dangerouslySetInnerHTML` is intended. The C-002 ban on that applies to user-derived text in `src/playground/` (WP14), not to this.
- The total Markdown is about 231 KB. Importing `content.json` into the client bundle is acceptable for this local, static site. Note the main chunk size in your report.

## Rules (all WPs of this mission)

- **Build command until WP13.** The docs `build` script runs `content`, then `spec-report`, then `build:site`. `scripts/spec-report.ts` arrives in WP13, so in this WP build with `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site`. Do not create a stub `spec-report.ts`.
- Work only inside the worktree that `spec-kitty agent action implement WP11 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. This WP has no sanctioned shared edits. **Do not edit `docs/`, `apps/docs/package.json`, `bun.lock`, `apps/docs/scripts/` or `apps/docs/src/lib/content-types.ts`.** If one of them needs a change, stop and report it.
- Do not add dependencies. The shadcn CLI is the one approved tool run (T058).
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- **Components never import `@tanstack/react-router`.** Routes read data and pass it in props, so every component renders in `bun test`.
- **Links are plain `<a href>`**, so a page works the same with and without JavaScript.
- **No module under `src/` except `src/lib/generated.ts` uses `import.meta.glob`.** Bun cannot run it, so tests never import `generated.ts`, `load.ts` or route files.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(docs): add prerendered site shell with navigation and document pages`. No AI names and no `Co-Authored-By` line.
- GRACE markup, in the style of `scripts/check-bun-version.ts`, goes on `vite.config.ts`, `src/routes/__root.tsx`, every file in `src/lib/` except `utils.ts`, and every non-`ui` component.
  - Use `LINKS: M-DOCS-SITE`. `DEPENDS: M-DOCS-CONTENT` applies to files that read generated content.
  - Give each export a `START_CONTRACT` block.
  - Route files, `routeTree.gen.ts` and `src/components/ui/**` (generated) carry no markup.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP11 --agent claude`.

## Seams for later WPs (write them exactly)

Later WPs make small, sanctioned edits to three files of yours (see `tasks.md`, "Shared files"). Leave these seams in place so their edits stay small:

| File | Seam | Used by |
| --- | --- | --- |
| `src/lib/prerender.ts` | the `APP_PAGES` array | WP13 appends `"/verification"`. WP14 appends `"/playground"`, `"/playground/a"`, `"/playground/b"` and `"/playground/c"`. WP15 appends `"/playground/d"` and `"/playground/e"`. |
| `src/components/site-header.tsx` | `<div data-slot="header-actions" className="ml-auto flex items-center gap-2">{/* header actions: WP12 */}</div>` | WP12 adds the search button and the theme toggle |
| `src/routes/__root.tsx` | `scripts: []` in `head()`, and `{/* site-wide widgets: WP12 */}` just before `<Scripts />` | WP12 adds the pre-paint theme script, `suppressHydrationWarning` on `<html>`, and the Mermaid renderer |

## Design

### `src/lib/site.ts` (pure, tested)

```ts
import { compareInSection, NAV_SECTIONS, type ContentDocument, type ContentFile, type NavSectionId } from "./content-types";

export const SITE_TITLE = "Telos by UnknownLab";
export const REPOSITORY_URL = "https://github.com/unknownlab/telos";

/** `${title} · Telos by UnknownLab`, or the site title alone. */
export function pageTitle(title?: string): string;
/** `${REPOSITORY_URL}/blob/main/${doc.source}` */
export function sourceUrl(doc: ContentDocument): string;
export function documentByRoute(content: ContentFile, route: string): ContentDocument | undefined;
/** Documents whose navSection is `section`, sorted with compareInSection. */
export function documentsInSection(content: ContentFile, section: NavSectionId): ContentDocument[];
/** documentsInSection without the `index` documents. */
export function childDocuments(content: ContentFile, section: NavSectionId): ContentDocument[];
/** The documents named in doc.related, in that order; unknown ids are skipped. */
export function relatedDocuments(content: ContentFile, doc: ContentDocument): ContentDocument[];
/** The nav section a path belongs to, or null. */
export function sectionForPath(path: string): NavSectionId | null;
/** Splits a leading <h1>…</h1> off the html. */
export function splitTitle(html: string): { readonly title: string | null; readonly body: string };
```

Rules:

- **`sectionForPath`**:
  1. Remove one trailing `/` unless the path is `/`.
  2. `/` gives `introduction`.
  3. Otherwise, return the `NAV_SECTIONS` entry with `route !== "/"` whose `route` equals the path, or is a prefix of the path followed by `/`.
  4. Anything else gives `null`.
- **`splitTitle`**: match `/^\s*<h1[^>]*>[\s\S]*?<\/h1>/`. On a match, `title` is the matched text without its leading whitespace, and `body` is the rest of the html. Without a match, `title` is `null` and `body` is the html unchanged.

### `src/lib/prerender.ts` (pure, tested; the seam for WP13–WP15)

```ts
import type { ContentFile } from "./content-types";

/** App routes prerendered besides the content documents. WP13–WP15 append their routes here. */
export const APP_PAGES: ReadonlyArray<string> = ["/architecture", "/not-found"];

/** Content routes plus appPages, sorted by code unit. Throws on a path listed twice. */
export function prerenderPaths(content: ContentFile, appPages: ReadonlyArray<string> = APP_PAGES): string[];
```

The error message is `prerender path "<path>" is listed twice`.

### `src/lib/generated.ts` (build-time data; never imported by tests)

```ts
import type { ContentFile } from "./content-types";

// Explicit paths, so search.json (WP12 loads it lazily) is not inlined here.
const modules = import.meta.glob<{ default: unknown }>(
  ["../generated/content.json", "../generated/spec-report.json"],
  { eager: true },
);

export const content: ContentFile =
  (modules["../generated/content.json"]?.default as ContentFile | undefined) ?? { version: 1, documents: [] };

/** The raw spec report, or null when it was not produced (NS-018). WP13 decodes it. */
export const specReportJson: unknown = modules["../generated/spec-report.json"]?.default ?? null;
```

### `src/lib/load.ts` (route helpers; never imported by tests)

```ts
import { notFound } from "@tanstack/react-router";
import type { ContentDocument } from "./content-types";
import { content } from "./generated";
import { documentByRoute, pageTitle, relatedDocuments } from "./site";

export interface DocumentData { readonly doc: ContentDocument; readonly related: ReadonlyArray<ContentDocument> }

export function loadDocument(route: string): DocumentData {
  const doc = documentByRoute(content, route);
  if (doc === undefined) throw notFound();
  return { doc, related: relatedDocuments(content, doc) };
}

export function documentHead(data: DocumentData | undefined) {
  return {
    meta: [
      { title: pageTitle(data?.doc.title ?? "Page not found") },
      ...(data ? [{ name: "description", content: data.doc.summary }] : []),
    ],
  };
}
```

### `vite.config.ts`

```ts
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { ContentFile } from "./src/lib/content-types";
import { prerenderPaths } from "./src/lib/prerender";

function readContent(): ContentFile {
  const url = new URL("./src/generated/content.json", import.meta.url);
  try {
    return JSON.parse(readFileSync(url, "utf8")) as ContentFile;
  } catch (cause) {
    throw new Error("apps/docs/src/generated/content.json is missing or unreadable; run `bun run content` first", { cause });
  }
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // crawlLinks stays false: nav links to routes that later WPs add must not fail this build.
      prerender: { enabled: true, crawlLinks: false, failOnError: true },
      pages: prerenderPaths(readContent()).map((path) => ({ path })),
    }),
    viteReact(),
  ],
});
```

### `src/router.tsx`

```tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true });
}
```

### `src/routes/__root.tsx`

```tsx
import { createRootRoute, HeadContent, Outlet, Scripts, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NotFound } from "@/components/not-found";
import { SiteLayout } from "@/components/site-layout";
import { content } from "@/lib/generated";
import { SITE_TITLE } from "@/lib/site";
import css from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
    ],
    links: [
      { rel: "stylesheet", href: css },
      { rel: "alternate", type: "text/plain", href: "/llms.txt", title: "llms.txt" },
    ],
    scripts: [],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: () => (
    <SiteLayout content={content} currentPath="">
      <NotFound />
    </SiteLayout>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {/* site-wide widgets: WP12 */}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const { pathname } = useLocation();
  return (
    <SiteLayout content={content} currentPath={pathname}>
      <Outlet />
    </SiteLayout>
  );
}
```

### Route files

**Single-document routes** follow one pattern. Here it is for `/philosophy`; the same applies to `/` (`index.tsx`), `/first-locus`, `/examples`, `/agent-reference` and `/roadmap`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/philosophy")({
  loader: () => loadDocument("/philosophy"),
  head: ({ loaderData }) => documentHead(loaderData),
  component: PhilosophyPage,
});

function PhilosophyPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
```

**Dynamic routes** (`principles/$id.tsx`, `terminology/$id.tsx`, `architecture/$id.tsx`, `decisions/$id.tsx`) use `loader: ({ params }) => loadDocument(`/principles/${params.id}`)`, with the matching prefix.

**Index routes**:

| File | Route | Renders |
| --- | --- | --- |
| `principles/index.tsx` | `/principles` | `DocumentPage` of the `principles` index, with `<DocumentList heading="All principles" docs={childDocuments(content, "principles")} />` as children |
| `terminology/index.tsx` | `/terminology` | the same pattern, heading `All terms` |
| `decisions/index.tsx` | `/decisions` | the same pattern, heading `All decisions` |
| `architecture/index.tsx` | `/architecture` | no source document: `<main id="content" data-page="architecture">`, `<h1>Architecture</h1>`, one paragraph "The conceptual model, the capability map, the technical direction, the open questions and the research behind them.", then `<DocumentList heading="Documents" docs={documentsInSection(content, "architecture")} />`. Head title `pageTitle("Architecture")`. |
| `not-found.tsx` | `/not-found` | `<NotFound />`. Head: title `pageTitle("Page not found")` and `{ name: "robots", content: "noindex" }`. |

Index loaders return `{ ...loadDocument(route), children }`, so all data stays in loader data.

### Components

| File | Export and props | Renders |
| --- | --- | --- |
| `site-layout.tsx` | `SiteLayout({ content, currentPath, children })` | a skip link `<a href="#content">Skip to content</a>` (visible on focus), `SiteHeader`, then a two-column grid (`md:grid-cols-[16rem_minmax(0,1fr)]`) with `SiteNav` and `children`, then a footer with links to `/llms.txt` ("llms.txt"), `/index.json` ("JSON index") and `REPOSITORY_URL` ("Source on GitHub") |
| `site-header.tsx` | `SiteHeader()` | `<header>` with a home link "Telos by UnknownLab" and the header-actions seam |
| `site-nav.tsx` | `SiteNav({ content, currentPath })` | **one** `<nav aria-label="Sections">` holding a list of the 12 `NAV_SECTIONS`. Each link carries `data-nav-section`. The link whose route equals the normalised current path gets `aria-current="page"`. The section from `sectionForPath` gets `data-active="true"`. Under the active section, if `childDocuments` is not empty, a nested list of its child links, where the current one gets `aria-current="page"`. Render the navigation once. A second copy for mobile would duplicate landmarks and test ids. On small screens the list wraps above the content. |
| `badges.tsx` | `StatusBadge({ status })`, `MaturityBadge({ maturity })` | shadcn `Badge`. Status uses `data-status={status}`, variant `outline`, text `Status: <status>`. Maturity uses `data-maturity={maturity}`, text `Maturity: <maturity>`, with variants `vision` → `outline`, `proposed` → `secondary`, `implemented` → `default`. |
| `document-page.tsx` | `DocumentPage({ doc, related, children? })` | see below |
| `document-list.tsx` | `DocumentList({ heading, docs })` | `<section aria-labelledby>` with an `<h2>` and a `<ul>` of `<li>` entries. Each entry has a link to `doc.route` with the title, the summary, both badges, and `<time dateTime>` with `doc.date` when present. |
| `not-found.tsx` | `NotFound()` | `<main id="content" data-page="not-found">`, `<h1>Page not found</h1>`, a sentence, and a link to `/` ("Go to the introduction") |

**`DocumentPage`**:

```
<main id="content" data-doc-id={doc.id}>
  <article>
    {title ? <div dangerouslySetInnerHTML={{ __html: title }} /> : <h1>{doc.title}</h1>}
    <div data-slot="doc-meta"> <StatusBadge/> <MaturityBadge/> <p data-slot="summary">{doc.summary}</p> </div>
    <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />
    {children}
    {related.length > 0 && <section aria-labelledby="related-heading"><h2 id="related-heading">Related</h2><ul>…links to each related doc's route with its title…</ul></section>}
    <footer><p>Source: <a href={sourceUrl(doc)}>{doc.source}</a></p></footer>
  </article>
  {outline.length > 0 && <nav aria-label="On this page"><ul>…links to #id for each h2 and h3 in doc.outline…</ul></nav>}
</main>
```

Here `{ title, body } = splitTitle(doc.html)`. The outline sits beside the article on wide screens (`lg:grid-cols-[minmax(0,1fr)_14rem]`) and below it on narrow ones.

### `src/styles.css`

The shadcn neutral tokens and minimal prose rules. There is no typography plugin; it is not an approved dependency. Write the full token set now, so WP12 only toggles the `dark` class:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  :target, h2[id], h3[id] { scroll-margin-top: 5rem; }
}
```

Then add `.prose` rules for `h1`–`h4`, `p`, `ul`/`ol`, `li`, `a`, `code`, `pre`, `blockquote`, `table`/`th`/`td`, and `hr`, using `@apply` with the token colours. Rules to follow:

- Links stay underlined.
- `pre` scrolls horizontally (`overflow-x-auto`).
- Tables scroll inside a wrapper class, or with `display: block; overflow-x: auto`.
- Body text uses `text-foreground`.
- Secondary text uses `text-muted-foreground`. That colour passes AA contrast on both backgrounds, and WP16 checks it with axe.

## Subtasks & Detailed Guidance

### Subtask T057 – Vite config, router and root document

1. Write `src/lib/prerender.ts`, `src/lib/site.ts`, `src/lib/generated.ts`, `src/lib/load.ts`, `vite.config.ts`, `src/router.tsx`, `src/routes/__root.tsx` and `src/styles.css` as designed. Start with the tests of T059 for `site.ts` and `prerender.ts`.
2. `src/routeTree.gen.ts` does not exist yet. The Start plugin generates it on the first `bun run build:site`. Until then, `bun check -b` fails on `./routeTree.gen`. That is expected; T063 commits the generated file.

### Subtask T058 – shadcn/ui setup and components

Run this exact sequence from the worktree root. The CLI fetches the component source from `ui.shadcn.com`, which the owner approved for the pinned version. If the network is blocked, stop and report. Do not write the components by hand.

1. Write `apps/docs/components.json`:

   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": { "config": "", "css": "src/styles.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
     "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
     "iconLibrary": "lucide"
   }
   ```

2. Write `apps/docs/src/lib/utils.ts`, the classic helper on the approved `clsx` and `tailwind-merge`:

   ```ts
   import { type ClassValue, clsx } from "clsx";
   import { twMerge } from "tailwind-merge";

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```

3. Generate the components that WP11–WP15 need. This is the only run of the CLI in this mission:

   ```sh
   cd apps/docs && bunx --bun shadcn@4.21.5 add alert badge button card dialog input separator table textarea --yes
   ```

4. Undo the CLI's dependency change, then prove it is undone:

   ```sh
   git checkout -- apps/docs/package.json bun.lock
   rm -rf node_modules/cn apps/docs/node_modules/cn
   bun install --frozen-lockfile
   sed -i '' 's#from "cn"#from "@/lib/utils"#' apps/docs/src/components/ui/*.tsx   # GNU sed: sed -i without ''
   git diff --exit-code -- apps/docs/package.json bun.lock
   ! grep -rn 'from "cn"' apps/docs/src
   ```

5. `git status` must show only the new `components.json`, `src/lib/utils.ts` and nine files under `src/components/ui/`. If the CLI changed `src/styles.css`, restore your version.
6. Run `bun run format`. Do not otherwise edit the generated components; a reviewer compares them with the CLI output. If `bun check -b` or `bun lint` reports a problem in them, stop and report it. In planning they passed both.

### Subtask T059 – Layout, navigation, badges, document page (tests first)

Write `apps/docs/test/site.test.ts` and `apps/docs/test/components.test.tsx` first. Build their fixtures in the test with a `makeDoc(overrides)` helper that returns a full `ContentDocument`. Do not read `src/generated/`.

**`site.test.ts`**:

1. `pageTitle("Principles")` is `Principles · Telos by UnknownLab`. `pageTitle()` is `Telos by UnknownLab`.
2. `sourceUrl` of a doc with `source: "docs/foundation/principles/P01-everything-is-code.md"` is `https://github.com/unknownlab/telos/blob/main/docs/foundation/principles/P01-everything-is-code.md`.
3. Ordering: terms `act` (`order: 2`) and `witness` (`order: 1`) plus the `terminology` index. `documentsInSection(…, "terminology")` gives ids `["terminology", "witness", "act"]`, which proves that `order` wins over id. `childDocuments` gives `["witness", "act"]`.
4. `relatedDocuments` keeps the order of `related` (`["b", "a"]` gives b, then a) and skips an unknown id.
5. `sectionForPath`, table-driven:

   | Path | Section |
   | --- | --- |
   | `/` | `introduction` |
   | `/principles` | `principles` |
   | `/principles/` | `principles` |
   | `/principles/P01-everything-is-code` | `principles` |
   | `/architecture/foundation` | `architecture` |
   | `/playground/a` | `playground` |
   | `/not-found` | `null` |
   | `/philosophyx` | `null` |

6. `splitTitle('<h1 id="a">A</h1>\n<p>x</p>')` gives title `<h1 id="a">A</h1>` and body `\n<p>x</p>`. `splitTitle("<p>x</p>")` gives title `null` and body unchanged.
7. `prerenderPaths` of a fixture with routes `/principles`, `/` and `/principles/P01` and `appPages` passed explicitly as `["/architecture", "/not-found"]` gives exactly `["/", "/architecture", "/not-found", "/principles", "/principles/P01"]`. Pass the list explicitly: WP13–WP15 append to the default, and the test must not change when they do. Passing `["/principles"]` as `appPages` throws `prerender path "/principles" is listed twice`.
8. Every `APP_PAGES` entry other than `/not-found` is in `APP_ROUTES`. This catches typos in the seam.
9. **Real content.** `compileContent({ root, git: () => ({ commit: "test", dirty: false }) })` on the repository (root `resolve(import.meta.dir, "../../..")`) is ok, and `prerenderPaths(output.content)`:
   - has length `documents.length + 2`;
   - includes `/`, `/philosophy`, `/principles/P08-preserve-the-baseline`, `/terminology/revision`, `/architecture/foundation` and `/decisions/ADR-0012`.

   `documentsInSection(content, "principles")` has 17 entries: the index, then P01 … P16 by number. If an id here differs in the real docs, use the real id and report the difference.

**`components.test.tsx`** (`renderToStaticMarkup`):

1. `MaturityBadge` for each of `vision`, `proposed` and `implemented` contains `data-maturity="<m>"` and `Maturity: <m>`. `StatusBadge` contains `data-status="accepted"` and `Status: accepted`.
2. `DocumentPage` for a doc with:
   - html `<h1 id="t">T</h1><p>Body</p><h2 id="s">S</h2>`;
   - outline `[{1,"t","T"},{2,"s","S"}]`;
   - one related doc.

   The output:
   - contains `data-doc-id="<id>"`, `Status: `, `Maturity: `, the summary, `<p>Body</p>`, `href="#s"`, a link to the related route with its title, and `href="https://github.com/unknownlab/telos/blob/main/<source>"`;
   - contains `<h1` exactly once;
   - lists the outline without the H1.
3. `DocumentPage` for a doc whose html has no H1 renders `<h1>{title}</h1>` exactly once.
4. FR-018: render `DocumentPage` for every combination of the 6 statuses and 3 maturities, with neutral body html. No output matches `/\bverified\b/i`.
5. `SiteNav` with `currentPath: "/principles/P02-x"` and a fixture of the principles index plus P01 and P02:
   - there are 12 `data-nav-section` attributes, in `NAV_SECTIONS` order;
   - the principles link has `data-active="true"` and no `aria-current`;
   - the nested list holds P01 and P02, and only P02's link has `aria-current="page"`.

   With `currentPath: "/principles"`, the principles link has `aria-current="page"`.
6. `DocumentList` renders each title as a link to its route, the summary, both badges, and `<time dateTime="2026-10-21">` for a decision with that date.
7. `NotFound` contains `data-page="not-found"`, `Page not found` and `href="/"`.

Then implement the components until all of this passes.

### Subtask T060 – Section routes for single documents

Create `index.tsx`, `philosophy.tsx`, `first-locus.tsx`, `examples.tsx`, `agent-reference.tsx` and `roadmap.tsx`, plus the four `$id.tsx` routes, using the patterns above.

### Subtask T061 – Index routes

Create `principles/index.tsx`, `terminology/index.tsx`, `decisions/index.tsx` and `architecture/index.tsx` as in the table.

### Subtask T062 – 404, related documents, source link

- Create `not-found.tsx`.
- Check that `DocumentPage` shows the related documents and the source link (tests 2–3).
- Check that the root `notFoundComponent` renders `NotFound` inside the layout.

The static server returns the prerendered `/not-found` page with status 404 for unknown paths. That server is WP16's.

### Subtask T063 – Build, prerender check, route-tree commit

1. `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site`. Record the wall time (NFR-005: under 60 s) and the `[prerender] Prerendered N pages` line. N must equal the number of documents plus 2.
2. Check every prerendered page against `content.json`:

   ```sh
   cd apps/docs && bun -e '
   const c = await Bun.file("src/generated/content.json").json();
   let bad = 0;
   for (const d of c.documents) {
     const f = Bun.file(`dist/client${d.route === "/" ? "" : d.route}/index.html`);
     const html = (await f.exists()) ? await f.text() : "";
     if (!html.includes(`data-doc-id="${d.id}"`) || !html.includes(`data-maturity="${d.maturity}"`)) { bad++; console.log("BAD", d.route); }
   }
   console.log(c.documents.length, "documents,", bad, "bad");
   process.exit(bad ? 1 : 0);'
   ```

3. Check the static output by eye:
   - `dist/client/principles/index.html` contains `All principles` and 16 principle links;
   - `dist/client/not-found/index.html` contains `Page not found`;
   - `grep -c 'data-nav-section' dist/client/index.html` is 12.

   Then check that the main JavaScript chunk does not contain the search index: `grep -l '"documentCount"' dist/client/assets/*.js` finds nothing.
4. Commit `src/routeTree.gen.ts`. Then run `bun run --cwd apps/docs build:site` again and check that `git diff --exit-code apps/docs/src/routeTree.gen.ts` is clean.
5. `bun run verify` passes. Paste the outputs of steps 1–4 into your report, with the main chunk size.

## Definition of Done

- [ ] Every file in `owned_files` exists. The nine shadcn components came from the pinned CLI, with only the `cn` import rewritten.
- [ ] `git diff feat/locus-foundation -- apps/docs/package.json bun.lock` is empty.
- [ ] `site.test.ts` and `components.test.tsx` pass, and they were seen failing first.
- [ ] The build prerenders the documents plus 2 pages in under 60 s, and the check in T063 reports 0 bad pages.
- [ ] `routeTree.gen.ts` is committed and stable across builds.
- [ ] The seams for WP12–WP15 are in place exactly as specified.
- [ ] `bun run verify` passes.

## Risks

- **The CLI changes dependencies.** This happened in planning. The `git diff --exit-code` step in T058 is the guard. Never commit with `cn`, `shadcn` or a font package in `package.json`.
- **A second navigation for mobile** duplicates landmarks and `data-nav-section` ids. That fails axe (`landmark-unique`) and WP16's count. Render the navigation once.
- **Two H1s.** The body already has one. Use `splitTitle`, never a header H1 on top.
- **Inlining `search.json`.** A glob such as `../generated/*.json` would pull the about 316 KB search index into every page. Keep the explicit list.
- **Router hooks in components** break the Bun component tests. Pass data in props.

## Reviewer Guidance

- Rerun T058 step 4's checks, then compare one generated component with a fresh `bunx --bun shadcn@4.21.5 add badge --dry-run` or `--view` output.
- Open three prerendered pages (`/`, a principle, a decision) and read them as raw HTML: H1 once, badges, summary, related links, source link, `data-doc-id`.
- Check that `crawlLinks` is `false` and `failOnError` is `true`, and that `APP_PAGES` is `["/architecture", "/not-found"]`.
- Run `bun test apps/docs`, `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site` and `bun run verify`.

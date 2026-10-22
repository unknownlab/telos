---
work_package_id: WP12
title: Theme, search and diagrams
dependencies:
- WP11
requirement_refs:
- FR-015
- FR-016
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T064
- T065
- T066
- T067
- T068
phase: Phase 5 - Documentation site
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/src/
create_intent:
- apps/docs/src/lib/theme.ts
- apps/docs/src/lib/search.ts
- apps/docs/src/lib/search-load.ts
- apps/docs/src/lib/shortcuts.ts
- apps/docs/src/lib/diagrams.ts
- apps/docs/src/components/theme-toggle.tsx
- apps/docs/src/components/search-dialog.tsx
- apps/docs/src/components/search-results.tsx
- apps/docs/src/components/mermaid-renderer.tsx
- apps/docs/test/theme.test.ts
- apps/docs/test/search.test.ts
- apps/docs/test/shortcuts.test.ts
- apps/docs/test/widgets.test.tsx
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/lib/theme.ts
- apps/docs/src/lib/search.ts
- apps/docs/src/lib/search-load.ts
- apps/docs/src/lib/shortcuts.ts
- apps/docs/src/lib/diagrams.ts
- apps/docs/src/components/theme-toggle.tsx
- apps/docs/src/components/search-dialog.tsx
- apps/docs/src/components/search-results.tsx
- apps/docs/src/components/mermaid-renderer.tsx
- apps/docs/test/theme.test.ts
- apps/docs/test/search.test.ts
- apps/docs/test/shortcuts.test.ts
- apps/docs/test/widgets.test.tsx
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP12 – Theme, search and diagrams

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

Add three features (FR-015, FR-016):

- light, dark and system themes, applied before first paint and remembered;
- a search dialog over the build-time MiniSearch index, opened by a button, `/`, or Ctrl/⌘+K;
- Mermaid diagrams rendered lazily with `securityLevel: "strict"`, with the source text shown when JavaScript is off.

Done means:

1. **Theme**:
   - With no stored choice, the theme follows `prefers-color-scheme`.
   - A choice of `light`, `dark` or `system` is stored under `localStorage["telos-theme"]` and applied before the body paints on the next load.
   - When storage throws (blocked, private mode), the system setting is used and nothing throws (User Story 3 scenario 4, contract "Theme and search").
2. **Search**:
   - "baseline" on the real content returns the principle "Preserve the baseline" and the term "Revision" (User Story 3 scenario 3).
   - Results are grouped by document: one hit per route, the best-scoring section first.
   - Each result links to the route or to `route#heading`.
   - The index loads lazily on the first open and is not inlined into the page chunk.
3. **Diagrams**: pages with ```` ```mermaid ```` blocks show an SVG figure when JavaScript runs, and the original source otherwise. Mermaid is imported only on pages that have a diagram.
4. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Theme and search** and **Body rules** (Mermaid)
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: FR-015, FR-016, User Story 3 scenarios 3–4
- `apps/docs/src/lib/search-options.ts` and `content-types.ts` (WP09): `SEARCH_OPTIONS`, `SearchSection`
- `apps/docs/scripts/content.ts` (WP09): `compileContent`, which produces the search index for the real-content test
- `apps/docs/src/routes/__root.tsx` and `src/components/site-header.tsx` (WP11), with their seams

### Facts verified in planning (2026-10-21)

- **MiniSearch 7.2.0**:
  - `MiniSearch.loadJSON<SearchSection>(json, SEARCH_OPTIONS)` restores the index that WP09 serialised.
  - `search(q)` returns results sorted by score, with the stored fields (`docTitle`, `heading`, `route`) as properties.
  - "baseline" on the real docs hits P08 and Revision.
  - The index is about 316 KB for about 522 sections, so it must load lazily.
- **Lazy raw glob (Vite 8.3.4)**: `import.meta.glob<string>("../generated/search.json", { query: "?raw", import: "default" })` yields a loader. The build emits the file as its **own** small chunk (`assets/search-*.js`), fetched only when the loader runs. Checked by grepping the build output.
- **Inline head scripts (TanStack Start 1.169.2)**: `head().scripts: [{ children: "…" }]` renders `<script>…</script>` inside `<head>` of every prerendered page, so it runs before the body paints.
- **Mermaid 12.2.0**:
  - The default export has `initialize(config: MermaidConfig)` and `render(id: string, text: string): Promise<RenderResult>`, where `RenderResult` has `svg: string`.
  - `securityLevel` accepts `'strict' | 'loose' | 'antiscript' | 'sandbox'`.
  - The package entry is ESM (`mermaid.core.mjs`).
- **Content markup**: WP09 renders a Mermaid fence as `<pre><code class="language-mermaid">…escaped source…</code></pre>`. The real docs have diagrams in `docs/foundation/conceptual-model/README.md` and `docs/foundation/architecture/capabilities.md`.

## Rules (all WPs of this mission)

- **Build command until WP13.** The docs `build` script runs `content`, then `spec-report`, then `build:site`. `scripts/spec-report.ts` arrives in WP13, so in this WP build with `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site`. Do not create a stub `spec-report.ts`.
- Work only inside the worktree that `spec-kitty agent action implement WP12 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edits** (see `tasks.md`, "Shared files"), named in your commit body:
  - `apps/docs/src/routes/__root.tsx`: set `scripts: [{ children: THEME_SCRIPT }]` in `head()`, add `suppressHydrationWarning` to `<html>`, and render `<MermaidRenderer />` at the `{/* site-wide widgets: WP12 */}` seam. Nothing else.
  - `apps/docs/src/components/site-header.tsx`: put `<SearchDialog />` and `<ThemeToggle />` inside the `data-slot="header-actions"` element. Nothing else.
- Do not add dependencies. Do not run the shadcn CLI; use the components WP11 generated (`button`, `dialog`, `input`).
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Components never import `@tanstack/react-router`. Tests never import `search-load.ts`, because it uses `import.meta.glob`, which Bun cannot run.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(docs): add theme toggle, search dialog and diagram rendering`. No AI names and no `Co-Authored-By` line.
- GRACE markup on every file (`LINKS: M-DOCS-SITE`), with a `START_CONTRACT` block on each export.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP12 --agent claude`.

## Design

### `src/lib/theme.ts`

```ts
export type ThemeChoice = "light" | "dark" | "system";
export const THEME_CHOICES: ReadonlyArray<ThemeChoice> = ["light", "dark", "system"];
export const THEME_STORAGE_KEY = "telos-theme";

export interface ThemeRoot {
  readonly classList: { toggle(token: string, force?: boolean): boolean };
  readonly dataset: Record<string, string | undefined>;
}
export type GetStorage = () => { getItem(key: string): string | null; setItem(key: string, value: string): void } | null;

/** "light" | "dark" | "system"; anything else is "system". */
export function parseTheme(value: unknown): ThemeChoice;
export function isDark(choice: ThemeChoice, prefersDark: boolean): boolean;
/** Sets the `dark` class and `data-theme`. */
export function applyTheme(root: ThemeRoot, choice: ThemeChoice, prefersDark: boolean): void;
/** Stores the choice; returns false instead of throwing when storage is unavailable. */
export function storeTheme(getStorage: GetStorage, choice: ThemeChoice): boolean;
/** The choice the pre-paint script applied (from data-theme). */
export function readTheme(root: ThemeRoot): ThemeChoice;

/** Runs before first paint. SELF-CONTAINED: it is serialised with toString(), so it uses literals only. */
export function applyStoredTheme(root: ThemeRoot, getStorage: GetStorage, prefersDark: () => boolean): void {
  let choice = "system";
  try {
    const storage = getStorage();
    const value = storage === null ? null : storage.getItem("telos-theme");
    if (value === "light" || value === "dark") choice = value;
  } catch {
    // storage blocked: fall back to the system setting
  }
  root.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark()));
  root.dataset.theme = choice;
}

export const THEME_SCRIPT = `(${applyStoredTheme.toString()})(document.documentElement,function(){return window.localStorage},function(){return window.matchMedia("(prefers-color-scheme: dark)").matches})`;
```

`applyStoredTheme` must not reference any other identifier of this module, including `THEME_STORAGE_KEY`. The serialised source runs in the page's global scope, where those names do not exist. Note that `getStorage()` itself sits inside the `try`: reading `window.localStorage` throws when storage is blocked.

### `src/lib/search.ts` and `src/lib/search-load.ts`

```ts
// search.ts (pure; tested)
import MiniSearch from "minisearch";
import type { SearchSection } from "./content-types";
import { SEARCH_OPTIONS } from "./search-options";

export interface SearchHit { readonly id: string; readonly route: string; readonly docTitle: string; readonly heading: string }
export const RESULT_LIMIT = 10;

/** Keeps the first (best-scoring) hit of each route, in input order, up to `limit`. */
export function groupHits(
  results: ReadonlyArray<{ readonly id: unknown; readonly [field: string]: unknown }>,
  limit: number = RESULT_LIMIT,
): SearchHit[];

/** Loads the serialised index; the returned function trims the query and gives [] for an empty one. */
export function createSearch(json: string): (query: string) => SearchHit[];
```

```ts
// search-load.ts (Vite only; never imported by tests)
const loaders = import.meta.glob<string>("../generated/search.json", { query: "?raw", import: "default" });

export function loadSearchIndex(): Promise<string> {
  const load = loaders["../generated/search.json"];
  return load === undefined ? Promise.reject(new Error("search index was not generated")) : load();
}
```

In `groupHits`, `String(result.id)` is the hit id. The stored `route`, `docTitle` and `heading` are read with `String(...)`, and a missing one becomes `""`.

### `src/lib/shortcuts.ts`

```ts
export interface KeyLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly target: unknown;
}
/** INPUT, TEXTAREA or SELECT (by tagName), or an element with isContentEditable === true. */
export function isEditableTarget(target: unknown): boolean;
/** "/" with no modifier outside editable targets, or "k"/"K" with Ctrl or ⌘ (and no Alt) anywhere. */
export function isSearchShortcut(event: KeyLike): boolean;
```

### `src/lib/diagrams.ts`

```ts
export const MERMAID_SELECTOR = "pre > code.language-mermaid";
export const MERMAID_CONFIG = { startOnLoad: false, securityLevel: "strict", theme: "neutral" } as const;
```

`neutral` is drawn on a light card (`bg-white text-black rounded-md p-4`) in both themes. That keeps diagrams readable without re-rendering when the theme changes.

### Components

| File | Export | Behaviour |
| --- | --- | --- |
| `theme-toggle.tsx` | `ThemeToggle()` | `<div role="group" aria-label="Theme">` with three shadcn `Button`s (`variant="ghost"`, `size="icon"`). Each button has `data-theme-choice="<c>"`, `aria-pressed`, `aria-label` "Light theme", "Dark theme" or "System theme", and a lucide icon: `Sun`, `Moon` or `Monitor`. The state starts as `"system"`, so server and client markup agree. After mount, an effect sets it from `readTheme(document.documentElement)`. A click calls `storeTheme(() => window.localStorage, c)` and `applyTheme(document.documentElement, c, matchMedia(...).matches)`, then sets state. While the choice is `system`, a `matchMedia("(prefers-color-scheme: dark)")` change listener re-applies the theme. |
| `search-results.tsx` | `SearchResults({ query, hits, status })` | `status` is `"idle" \| "loading" \| "ready" \| "error"`. When ready with hits, it renders `<ul data-slot="search-results">` with one `<li>` per hit. Each `<li>` holds `<a href={hit.id} data-search-result={hit.route}>`, the `docTitle`, and the `heading` in muted text when it is not empty. When ready with no hits it renders `No results for “<query>”.`, while loading `Loading the index…`, and on error `Search is unavailable.` |
| `search-dialog.tsx` | `SearchDialog()` | A controlled shadcn `Dialog`. The trigger is `<Button variant="outline" size="sm" data-slot="search-trigger" aria-keyshortcuts="/ Control+K Meta+K">` with a `Search` icon, the text "Search" and `<kbd>/</kbd>`. A `keydown` listener on `document`, added in an effect and removed on cleanup, opens the dialog when `isSearchShortcut(event)` is true and calls `preventDefault()`. The first open calls `loadSearchIndex()` once and keeps `createSearch(json)` in a ref. The content has a `DialogTitle` "Search", a `DialogDescription` "Titles, summaries and text of every page.", an `Input` with `aria-label="Search the documentation"` and autofocus, and `SearchResults`. The query runs on each input change; this is the docs search, not the playground. Enter navigates to the first hit with `window.location.assign(hit.id)`. |
| `mermaid-renderer.tsx` | `MermaidRenderer()` | Renders `null`. A mount effect collects `document.querySelectorAll(MERMAID_SELECTOR)`; with none, it returns without importing anything. Otherwise it runs `const { default: mermaid } = await import("mermaid")` and `mermaid.initialize({ ...MERMAID_CONFIG })`. For block `i` it calls `const { svg } = await mermaid.render(\`telos-diagram-${i}\`, code.textContent ?? "")`, then: creates `<figure data-mermaid="rendered" class="…light card…">` with `innerHTML = svg`; replaces the `<pre>` with the figure; inserts after the figure a `<details><summary>Diagram source</summary></details>`; and moves the original `<pre>` into it. On error it sets `pre.dataset.mermaid = "error"`, leaves the source visible and calls `console.warn`. A `cancelled` flag stops work after unmount. |

The SVG comes from Mermaid's strict mode, which sanitises labels, and the input is repository content. The C-002 ban on `innerHTML` covers user text in `src/playground/` only.

## Subtasks & Detailed Guidance

### Subtask T064 – Theme: pre-paint script, toggle, storage fallback

**Tests first** (`test/theme.test.ts`). Use a fake root `{ classList: { toggle(t, f) { … record … } }, dataset: {} }` and fake storages.

1. `parseTheme`: `"light"`, `"dark"` and `"system"` map to themselves. `"neon"`, `null`, `undefined` and `1` give `"system"`.
2. `isDark`: `("dark", false)` is true, `("light", true)` is false, `("system", true)` is true, `("system", false)` is false.
3. `applyStoredTheme`, table-driven:

   | Stored value | Storage | `prefersDark` | `dark` class | `data-theme` |
   | --- | --- | --- | --- | --- |
   | `"dark"` | works | false | on | `dark` |
   | `"light"` | works | true | off | `light` |
   | `"system"` | works | true | on | `system` |
   | `"neon"` | works | false | off | `system` |
   | `null` | works | true | on | `system` |
   | — | `getStorage` throws | true | on | `system` |
   | — | `getItem` throws | false | off | `system` |
   | — | `getStorage` returns `null` | false | off | `system` |

4. `storeTheme` writes `telos-theme`. It returns `false` and does not throw when `setItem` throws or when `getStorage` throws.
5. `THEME_SCRIPT`:
   - starts with `(`;
   - contains `"telos-theme"`, `document.documentElement` and `prefers-color-scheme: dark`;
   - contains none of `THEME_STORAGE_KEY`, `parseTheme`, `isDark` or `applyTheme(`, so no outer reference leaked in.

Then implement `theme.ts` and `ThemeToggle`, and make the `__root.tsx` and `site-header.tsx` edits.

### Subtask T065 – Search dialog over `search.json`

**Tests first** (`test/search.test.ts`):

1. `groupHits`:
   - Input `[{id:"/a#x",route:"/a",docTitle:"A",heading:"X"},{id:"/a",route:"/a",docTitle:"A",heading:""},{id:"/b",route:"/b",docTitle:"B",heading:""}]` gives ids `["/a#x", "/b"]`.
   - 15 distinct routes give 10 hits; with `limit` 3 they give 3.
2. **Real content.** Build the index with `compileContent({ root, git: () => ({ commit: "test", dirty: false }) })`, where `root` is `resolve(import.meta.dir, "../../..")`. Then `const search = createSearch(output.search)`:
   - `search("baseline")` includes routes `/principles/P08-preserve-the-baseline` and `/terminology/revision`, and no route appears twice;
   - `search("determ")` includes `/philosophy`, which proves prefix search;
   - `search("   ")` is `[]`.

   If an expected route differs in the real docs, report it. Do not weaken the test.

Then implement `search.ts`, `search-load.ts`, `SearchResults` and `SearchDialog`.

### Subtask T066 – Keyboard shortcuts `/` and Ctrl/⌘+K

**Tests first** (`test/shortcuts.test.ts`), table-driven:

| Event | Expected |
| --- | --- |
| `/`, no modifiers, target `{ tagName: "BODY" }` | true |
| `/`, target `{ tagName: "INPUT" }` | false |
| `/`, target `{ tagName: "TEXTAREA" }` | false |
| `/`, target `{ tagName: "DIV", isContentEditable: true }` | false |
| `/` with `ctrlKey` | false |
| `k` with `ctrlKey`, target INPUT | true |
| `K` with `metaKey` | true |
| `k` with `ctrlKey` and `altKey` | false |
| `k`, no modifiers | false |
| `Enter` | false |

`isEditableTarget(null)` and `isEditableTarget("x")` are false. Implement `shortcuts.ts`; the dialog already uses it.

### Subtask T067 – Mermaid: lazy, strict, source shown without JavaScript

1. **Test first** (in `test/widgets.test.tsx`): `MERMAID_CONFIG.securityLevel` is `"strict"` and `startOnLoad` is `false`. A source scan of `mermaid-renderer.tsx` finds that:
   - `securityLevel` is not set anywhere else in `src/`;
   - the file contains no `"loose"` or `"sandbox"`;
   - `import("mermaid")` is the only import of mermaid in `src/`. A static `from "mermaid"` would put Mermaid in every page.
2. Implement `diagrams.ts` and `MermaidRenderer`.

### Subtask T068 – Widget render tests and build check

1. `test/widgets.test.tsx` (`renderToStaticMarkup`):
   - `ThemeToggle` has `role="group"`, `aria-label="Theme"`, three `data-theme-choice` buttons, and `aria-pressed="true"` only on `system`.
   - `SearchDialog` renders the trigger with `data-slot="search-trigger"` and `aria-keyshortcuts="/ Control+K Meta+K"`. When closed, it does not render the dialog content.
   - `SearchResults`:
     - ready with two hits: two `data-search-result` links with `href` equal to the hit ids, and a heading shown only when it is not empty;
     - ready with no hits: `No results for “zzz”.`;
     - loading: `Loading the index…`;
     - error: `Search is unavailable.`
2. `bun run --cwd apps/docs content && bun run --cwd apps/docs build:site`, then check:
   - `grep -c 'telos-theme' dist/client/index.html` is at least 1, and the script appears before `<body`: `bun -e 'const h=await Bun.file("apps/docs/dist/client/index.html").text(); console.log(h.indexOf("telos-theme") < h.indexOf("<body"))'` prints `true`;
   - the search index is its own chunk: `grep -l '"documentCount"' apps/docs/dist/client/assets/*.js` lists exactly one `search-*.js` file;
   - Mermaid is not in the entry chunk: `grep -l 'securityLevel' apps/docs/dist/client/assets/*.js` lists only lazy chunks, which the entry chunk does not import statically.
3. `bun run verify` passes. Paste the outputs into your report.

## Definition of Done

- [ ] All files in `owned_files` exist, with markup and TSDoc.
- [ ] The theme, search, shortcut and widget tests pass, and they were seen failing first.
- [ ] The two shared edits are exactly as sanctioned and named in the commit body.
- [ ] The build checks in T068 hold.
- [ ] `bun run verify` passes.

## Risks

- **`toString()` leaks.** Referencing a module constant inside `applyStoredTheme` works in tests but throws `ReferenceError` in the browser before paint. Test 5 guards this. WP16's theme suite proves it in Chromium.
- **Hydration warnings on `<html>`.** The pre-paint script changes `class` and `data-theme` before React hydrates. `suppressHydrationWarning` on `<html>` is the sanctioned fix. Do not move theme state into React's server markup.
- **Inlining the index or Mermaid.** A static import pulls hundreds of KB, or MB, into every page. The T068 checks guard this.
- **Shortcut inside inputs.** `/` must stay typeable in the search input and in playground textareas.

## Reviewer Guidance

- Read `applyStoredTheme` and confirm that it is self-contained, and that `getStorage()` sits inside the `try`.
- Check that the shared edits are minimal: diff `__root.tsx` and `site-header.tsx` against WP11.
- Open a built page with a diagram (`/architecture/conceptual-model`) as raw HTML and confirm that the `<pre><code class="language-mermaid">` source is present without JavaScript.
- Run `bun test apps/docs`, the T068 checks and `bun run verify`.

---
work_package_id: WP16
title: Browser tests
dependencies:
- WP12
- WP15
requirement_refs:
- C-008
- FR-013
- FR-015
- FR-016
- FR-017
- FR-019
- NFR-001
- NFR-004
- NFR-005
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T086
- T087
- T088
- T089
- T090
- T091
- T092
phase: Phase 6 - Browser tests, gates, governance
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/e2e/
create_intent:
- apps/docs/scripts/serve-static.ts
- apps/docs/test/serve-static.test.ts
- apps/docs/playwright.config.ts
- apps/docs/e2e/global-setup.ts
- apps/docs/e2e/helpers.ts
- apps/docs/e2e/navigation.e2e.ts
- apps/docs/e2e/search.e2e.ts
- apps/docs/e2e/theme.e2e.ts
- apps/docs/e2e/machine-files.e2e.ts
- apps/docs/e2e/playground.e2e.ts
- apps/docs/e2e/keyboard.e2e.ts
- apps/docs/e2e/equality.e2e.ts
- apps/docs/e2e/provenance.e2e.ts
- apps/docs/e2e/a11y.e2e.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/scripts/serve-static.ts
- apps/docs/test/serve-static.test.ts
- apps/docs/playwright.config.ts
- apps/docs/e2e/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP16 – Browser tests

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

Prove the built site works in a real browser (research R-08). The tests run Playwright with Chromium against the **static files** in `apps/docs/dist/client`, served by a small Bun server, and never a dev server. Serving the files proves NFR-005 and C-008: no server code is involved, and nothing is deployed.

Done means:

1. `bun run --cwd apps/docs build && bun run --cwd apps/docs test:e2e` passes in Chromium, with no retries and no fixed sleeps.
2. These suites exist and pass:
   - navigation, no-JavaScript reading and the 404 page;
   - search;
   - theme;
   - `llms.txt` and `index.json`;
   - playground A–E;
   - keyboard-only playground use;
   - Bun/browser id equality;
   - provenance coverage;
   - axe in both themes on the NFR-004 pages.
3. `scripts/serve-static.ts` serves `dist/client`:
   - each route as its `index.html`;
   - unknown paths as the prerendered not-found page with **status 404**;
   - path traversal refused.

   Its own Bun unit test passes.
4. A **failing** browser check makes `test:e2e` exit non-zero. You show this once by breaking an expectation locally, then revert it. Report what you did.
5. `bun run verify` passes. `test:e2e` is **not** added to `verify` here; WP17 does that.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/research.md`: **R-08**
- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Provenance**, **Playground**, **Theme and search**, **Data attributes for tests**
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: User Stories 3 and 4, NFR-001, NFR-004, NFR-005
- The data-attribute tables in `tasks/WP14-playground-a-c.md` and `tasks/WP15-playground-d-e.md`. If the built markup differs from them, the markup is wrong: report it and do not adapt the test to it.
- `apps/docs/src/lib/theme.ts`, `search.ts` and `diagrams.ts` (WP12), `src/lib/content-types.ts` (`NAV_SECTIONS`, `APP_ROUTES`), and `src/lib/provenance.ts` (WP13)

### Facts verified in planning (2026-10-21)

- **Playwright 1.64.1 runs under Bun.** `apps/docs/package.json` already has `"test:e2e": "bun --bun playwright test"` (WP01). `@axe-core/playwright` 4.13.0 works with it, and Chromium is installed (WP01). Node is not needed.
- **Bun's test runner must never pick up e2e files.** `bunfig.toml` ignores `apps/docs/e2e/**` (WP01). Name every Playwright file `*.e2e.ts` and keep it under `e2e/`. `serve-static.test.ts` is a Bun test, so it lives in `test/`.
- **Playwright test files may import TypeScript from the repository**, for example `@telos/locus`, `@telos/locus-specs` and `../src/lib/content-types`. That is how the equality suite computes ids in Bun, in the same process that drives Chromium.
- **WP12's theme storage key** is `telos-theme`. The pre-paint script sets the `dark` class and `data-theme` on `<html>`. The toggle buttons carry `data-theme-choice` and `aria-pressed`.
- **Search** opens with `/`, `Ctrl+K` or `Meta+K`, or the `data-slot="search-trigger"` button. Results are `a[data-search-result]` inside `[data-slot="search-results"]`. Real content: "baseline" finds `/terminology/revision`.
- **Diagrams**: `docs/foundation/conceptual-model/README.md` and `docs/foundation/architecture/capabilities.md` contain Mermaid blocks. Find their routes through `index.json` (`source` field), never by hard-coding.
- **The not-found page** is prerendered at `dist/client/not-found/index.html` (WP11) and contains `data-page="not-found"`.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP16 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. This WP edits **no** shared file, and no app source at all. If a test finds a real defect in the site, stop and report it with the failing test; do not fix the app in this WP.
- Do not add dependencies. Do not edit `package.json`, `bun.lock`, `bunfig.toml` or anything outside `owned_files`. Do not install browsers other than Chromium.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- **No flakiness tricks.** Use web-first assertions (`await expect(locator).toHaveText(…)`), and no `waitForTimeout`. Set `retries: 0`. Wait for `[data-ready="true"]` before interacting with a playground.
- No fake tests. Every test asserts on real built output.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `test(docs): add Playwright suites against the static build`. No AI names and no `Co-Authored-By` line.
- GRACE markup:
  - `serve-static.ts`: `LINKS: M-DOCS-SITE`, with a `START_CONTRACT` on each export;
  - e2e files and `test/serve-static.test.ts`: test markup naming the suite, with `LINKS: V-M-DOCS-SITE` or `V-M-DOCS-PLAYGROUND`. WP17 registers these.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP16 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T086 – Static server and Playwright config

**`apps/docs/scripts/serve-static.ts`**:

```ts
/** Maps a URL path to a file under root, or null. Never leaves root. */
export function resolveRequestPath(root: string, pathname: string): string | null;
export function createStaticServer(options: { readonly root: string; readonly port: number; readonly hostname?: string }): ReturnType<typeof Bun.serve>;
```

- `resolveRequestPath`:
  - `decodeURIComponent` in try/catch, where a bad escape gives `null`;
  - reject a NUL character and any `..` segment;
  - `posix.normalize`;
  - then try, in order, `root + path` when it is a file, and `root + path + "/index.html"`;
  - use `statSync` in try/catch and accept only regular files;
  - return `null` otherwise.
- The server:
  - `GET` and `HEAD` only; anything else gets 405;
  - a resolved file gets `new Response(Bun.file(path))`, whose type Bun infers;
  - add `content-type: text/plain; charset=utf-8` for `.txt`, and make sure `.json` is `application/json`;
  - otherwise the body of `root/not-found/index.html` with **status 404** and `text/html; charset=utf-8`.
- The CLI (`import.meta.main`):
  - `--port <n>` (default 4173) and `--root <dir>` (default `dist/client`, relative to `apps/docs`);
  - exit 1 with `serve-static: <root>/index.html not found. Build first: bun run --cwd apps/docs build` when the root has no `index.html`;
  - print `serve-static: http://127.0.0.1:<port>/`;
  - bind `127.0.0.1` only (C-008).

**Tests first** (`test/serve-static.test.ts`, Bun). Build a fixture tree in a temporary directory with `index.html`, `a/index.html`, `llms.txt`, `index.json` and `not-found/index.html`. Start `createStaticServer({ port: 0 })` and stop it in `afterAll`. Then:

1. `/` and `/a` give 200 with the right bodies.
2. `/llms.txt` gives `text/plain`, and `/index.json` gives `application/json`.
3. `/missing` gives 404 with the not-found body.
4. These give `null` from `resolveRequestPath`, and 404 from the server:
   - `/../package.json`;
   - `/%2e%2e/package.json`;
   - `/a/%00`;
   - `/%E0%A4%A`.
5. `POST /` gives 405.

**`apps/docs/playwright.config.ts`**:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun scripts/serve-static.ts --port 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
```

`e2e/global-setup.ts` fails fast with the same "Build first" message when `dist/client/index.html` or `dist/client/index.json` is missing.

`e2e/helpers.ts`:

- `readIndex()` reads `dist/client/index.json` from disk and returns its typed `documents`;
- `docBySource(source)`;
- `trackPageErrors(page)` collects `pageerror` events and `console` messages of type `error`, and returns an `assertNone()` function. Every suite calls it, and the site must log no errors.

### Subtask T087 – Navigation, no-JavaScript and 404 (`navigation.e2e.ts`)

1. **Every section is reachable** (FR-013). On `/`, `nav[aria-label="Sections"]` has exactly 12 `[data-nav-section]` links, in `NAV_SECTIONS` order. Click each one and assert:
   - the URL;
   - an `<h1>`;
   - the link's `aria-current="page"` or its `data-active="true"`.
2. **Every document page loads**. For every document in `index.json`:
   - `page.goto(url)` gives status 200;
   - `main[data-doc-id="<id>"]` is visible;
   - the `<h1>` has the document's `title`;
   - no page errors.

   Batch this in one test per nav section to keep reporting readable.
3. **Every app route is prerendered.** For every entry of `APP_ROUTES` (import it from `../src/lib/content-types`), a `request.get` gives 200 and HTML that is not the not-found page. This proves `APP_PAGES` and the content routes cover `APP_ROUTES`.
4. **Readable without JavaScript** (NFR-005). In `browser.newContext({ javaScriptEnabled: false })`:
   - one page per kind (a principle, a term, a decision, the introduction, `/architecture`) shows its `<h1>`, its summary and body text;
   - `/verification` shows the build report table, with 44 `[data-spec-id]` rows;
   - `/playground/b` shows `[data-slot="no-js"]`, `[data-slot="example-input"]` and "The playground needs JavaScript".
5. **404**: `/no-such-page` gives status 404, with `main[data-page="not-found"]`, "Page not found" and a link to `/`.
6. **Diagrams**: the conceptual-model page (found by `source`) renders at least one `figure[data-mermaid="rendered"]` containing an `svg`, and keeps the source in a `<details>` "Diagram source". There must be no `[data-mermaid="error"]`. Without JavaScript, the same page shows the diagram source as a code block.

### Subtask T088 – Search and theme (`search.e2e.ts`, `theme.e2e.ts`)

**Search** (FR-016, User Story 3 scenario 3):

1. Press `/` on `/`: the dialog opens and the input "Search the documentation" is focused. Type `baseline`: a result `a[data-search-result]` with `href` starting `/terminology/revision` appears. Press `Enter`: the URL is that result's `href`, and the heading is in view.
2. `Control+K` and `Meta+K` each open it. `Escape` closes it, and focus returns to the trigger.
3. `/` typed **inside** a playground textarea does not open search; the character is typed instead.
4. Clicking the trigger works. A query with no match shows `No results for`.
5. The search index chunk is requested only when the dialog first opens. Before that, no request matches `/search-.*\.js/`; use `page.on("request")`.

**Theme** (FR-015, User Story 3 scenario 4):

1. With `colorScheme: "dark"` and empty storage, `<html>` has the class `dark` before any click, and the toggle shows `system` pressed. With `colorScheme: "light"`, there is no `dark` class.
2. Click "Dark theme":
   - `<html>` has `dark` and `data-theme="dark"`;
   - `localStorage["telos-theme"]` is `dark`;
   - after a reload, `dark` is present **at `domcontentloaded`**, before hydration. Check it in a `page.waitForEvent("domcontentloaded")` handler with `page.evaluate`. This proves the pre-paint script.
3. Click "Light theme" under a dark system setting: there is no `dark` class, and that survives a reload.
4. Click "System theme", then switch the emulated scheme with `page.emulateMedia({ colorScheme })`: the class follows.
5. **Storage blocked**:
   - `context.addInitScript` replaces `window.localStorage` with a getter that throws;
   - the page loads with no page errors and follows the system setting;
   - clicking a theme still applies it for that page.

### Subtask T089 – Machine-readable files (`machine-files.e2e.ts`)

FR-017, User Story 3 scenario 5. Use `request`:

1. `/llms.txt`:
   - 200, with `text/plain`;
   - the first line is `# Telos by UnknownLab`, and the third starts with `> `;
   - every `index.json` document's `url` appears as `](<url>)`;
   - every `## ` heading is a `NAV_SECTIONS` title, in nav order.
2. `/index.json`:
   - 200, with `application/json`;
   - `version` is `1`, and `generatedFrom` has a string `commit` and a boolean `dirty`;
   - `documents` is sorted by `id`, and every document has `id, title, kind, status, maturity, summary, related, url, source` with the right types;
   - every `related` id exists, and every `url` is served with 200.
3. The page footer links `/llms.txt` and `/index.json`.

### Subtask T090 – Playground A–E and keyboard (`playground.e2e.ts`, `keyboard.e2e.ts`)

FR-019, User Story 4. For each test: `goto`, then `await expect(page.locator('[data-slot="playground"]')).toHaveAttribute("data-ready", "true")`.

**A**:

1. Click `[data-action="run"]`. Then:
   - `[data-valid="true"]` is visible;
   - there are three `[data-revision-id]`;
   - the one with `data-locus="shop:checkout"` has `data-revision-id="sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6"`;
   - every result panel has `data-provenance="browser"`.
2. **Historical marking** (INV-013). Edit the textarea by appending a space with `press("End")` and `type(" ")`. Then:
   - every panel has `data-provenance="historical"` and `data-stale="true"`;
   - the ids are **unchanged**;
   - the stale notice is visible.

   Click run again: the panels are `browser` again. Undoing the edit to the exact text makes them `browser` again without a run. Assert both.

**B**:

1. Run. Then:
   - `[data-diagnostic-code]` values are, in order, `charter.entry-duplicate`, `charter.purpose-blank`;
   - `[data-valid="false"]`;
   - the page text contains no `Valid:` and no `[data-revision-id]`.
2. Replace the text with `{"loci": [` and run: a `decode-error` panel with `[data-issue-path=""]` showing `(whole input)`.
3. Input over 1 MB is refused. Set the textarea value with `locator.fill("x".repeat(1_048_577))`, then run: a decode error, and the page stays responsive.
4. A purpose of `<img src=x onerror=alert(1)>` is shown as text. No `img` element appears in the results, and no dialog event fires. Register `page.on("dialog")` and fail the test if it fires.

**C**: run. `[data-relation="shop:checkout refines shop:payment"]` and `[data-relation="shop:payment refines shop:checkout"]` have status `refines-cycle`. `[data-relation="shop:storefront depends-on shop:ghost"]` has `target-missing`.

**D** (walk-through):

1. Compute. There are two `[data-side] [data-revision-id]`:
   - A: `sha256:666edf28…c6c6`, the full value from WP15;
   - B: `sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315`.

   Change rows: `removed`, then `added`.
2. History: leave `[data-slot="expected-head"]` empty. Then:
   1. Append A: outcome `appended`.
   2. Append B: `stale`.
   3. Click `use-head`, then append B: `appended`.
   4. Click `use-head`, then append B: `no-op`.

   Check `[data-history-step]` outcomes in order, `[data-history-head]` = B, and two `[data-history-entry]`, A then B.
3. A malformed expected head shows the hint, and no new step is added.
4. Edit Locus B. The history panel is `historical`, and the append buttons are disabled.

**E**:

1. Before the run, the build report panel shows `data-provenance="bun-build"` and 44 rows.
2. Run all. Then:
   - the browser report panel has `data-provenance="browser"` and 44 rows, all with `data-spec-status="pass"`;
   - `[data-compare="same"]`;
   - eight `[data-golden-match="true"]` and none `false`.

**Keyboard only** (`keyboard.e2e.ts`, NFR-004). Use only `page.keyboard`: no `click`, `fill` or `check`.

- On A: Tab to the textarea, type a change, Tab to Validate, press Enter, and assert the report.
- On D: reach and operate `append-a`, `use-head` and `append-b` with Tab and Enter or Space. Assert the outcomes.
- On E: reach "Run all" and press Enter.
- Every `button`, `textarea` and `input` in `[data-slot="playground"]` has a non-empty accessible name. Use `getByRole` with a name, or `locator.evaluate` on the computed name through `ariaSnapshot`.
- Focus is visible: the focused element's computed `outline-style` is not `none`, or its `box-shadow` is not `none`.

### Subtask T091 – Bun/browser id equality and provenance coverage

**`equality.e2e.ts`** (NFR-001). This test file runs in Bun, so compute the expected values **in the test process** with the real package:

```ts
import { Effect } from "effect";
import { createRevision, decodeFabric, decodeLocus } from "@telos/locus";
import { catalogue, examples } from "@telos/locus-specs";
```

1. For each Locus of `examples.valid`, the Bun id equals the Chromium id shown on A.
2. For `examples.history.a` and `.b`, the Bun ids equal the ids shown on D.
3. For every `revision-compare` record in `catalogue`, the Bun ids of `a` and `b` equal E's `[data-golden-key]` rows' `[data-revision-id]` values. Compare with Bun, not only with the golden constants.
4. E's browser statuses equal the build report statuses, id by id. This reads both tables from the page and also checks `[data-compare="same"]`.

**`provenance.e2e.ts`** (FR-021, INV-013):

1. After running each scenario A–E, and on `/verification`:
   - every `[data-result]` has a `data-provenance` in `browser`, `bun-build`, `ci`, `historical` or `none`;
   - every `[data-result]` contains a `[data-slot="provenance-label"]` with non-empty text.
2. **No result outside a panel**: every `[data-revision-id]`, `[data-diagnostic-code]`, `[data-spec-id]`, `[data-change-part]` and `[data-history-step]` has an ancestor `[data-result]`.
3. Browser labels contain `Run in this browser at`, `@telos/locus` and `site commit`. The `/verification` label contains `at build time` and `commit`. The CI row reads `CI: not available`.
4. On the A and D pages before any run, `[data-result]` panels either do not exist or have `data-provenance="none"`.

### Subtask T092 – Accessibility (`a11y.e2e.ts`)

NFR-004: 0 **serious** or **critical** violations in both themes.

- Pages:
  - `/`;
  - the first `principle`, `term` and `decision` documents from `index.json`;
  - `/playground`;
  - `/playground/a` to `/playground/e`, each **after a run**, so result panels are included;
  - `/verification`.
- Themes: set `telos-theme` with `context.addInitScript(() => localStorage.setItem("telos-theme", "<t>"))` for `light` and `dark`. Assert the `dark` class state before scanning.
- Scan: `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()`. Filter `violations` to `impact` `serious` or `critical`. On failure, print each rule id, its help text and the first three target selectors, then assert the filtered list is `[]`.
- Do **not** disable rules. If a rule fails, report the page, theme and rule. It is a site defect for the owning WP's follow-up, not something to silence here.

**Run**: `bun run --cwd apps/docs build`, then `bun run --cwd apps/docs test:e2e`. Then show that a failure fails the run: change one expected id, run the suite, see the exit code 1, and revert. Then run `bun test apps/docs` and `bun run verify`.

## Definition of Done

- [ ] `serve-static.ts` and its Bun test pass, and the 404 and traversal cases are covered.
- [ ] All nine suites exist and pass in Chromium, with `retries: 0` and no sleeps.
- [ ] The failing-check demonstration was run and reverted, and is reported in your summary.
- [ ] No app source or shared file changed.
- [ ] `bun run verify` passes.

## Risks

- **Testing a dev server instead of the build.** `vite dev` or `vite preview` would hide missing prerendered pages. Use only `serve-static.ts`.
- **Adapting tests to defects.** A test that passes because it was bent around a bug is worse than none. Report defects instead.
- **Timing.** Hydration happens after load. Always wait for `data-ready="true"`.
- **Large-input test slowness.** `fill` with 1 MB is fine in Chromium. Do not type it character by character.

## Reviewer Guidance

- Check that `retries` is 0, that there is no `waitForTimeout`, and that no `test.skip` or `test.fixme` exists.
- Check that the equality suite computes ids in Bun and does not only compare page text with constants.
- Check that no `disableRules` call appears in `a11y.e2e.ts`.
- Run the build and `test:e2e` yourself, then `bun run verify`.

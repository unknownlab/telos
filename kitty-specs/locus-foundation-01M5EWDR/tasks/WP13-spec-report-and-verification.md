---
work_package_id: WP13
title: Spec report, provenance and Verification page
dependencies:
- WP08
- WP11
requirement_refs:
- FR-021
- FR-022
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T069
- T070
- T071
- T072
- T073
- T074
phase: Phase 5 - Documentation site
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/
create_intent:
- apps/docs/scripts/spec-report.ts
- apps/docs/src/lib/provenance.ts
- apps/docs/src/lib/build-data.ts
- apps/docs/src/lib/build.ts
- apps/docs/src/components/provenance-label.tsx
- apps/docs/src/components/result-panel.tsx
- apps/docs/src/components/spec-report-table.tsx
- apps/docs/src/components/verification-view.tsx
- apps/docs/src/routes/verification.tsx
- apps/docs/test/provenance.test.ts
- apps/docs/test/spec-report.test.ts
- apps/docs/test/verification.test.tsx
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/scripts/spec-report.ts
- apps/docs/src/lib/provenance.ts
- apps/docs/src/lib/build-data.ts
- apps/docs/src/lib/build.ts
- apps/docs/src/components/provenance-label.tsx
- apps/docs/src/components/result-panel.tsx
- apps/docs/src/components/spec-report-table.tsx
- apps/docs/src/components/verification-view.tsx
- apps/docs/src/routes/verification.tsx
- apps/docs/test/provenance.test.ts
- apps/docs/test/spec-report.test.ts
- apps/docs/test/verification.test.tsx
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP13 – Spec report, provenance and Verification page

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

This WP builds the evidence side of the site:

- **one provenance model** that every result on the site uses (FR-021, INV-013);
- the **build-time spec report**, which runs `runSpecifications(catalogue)` under Bun with `bun-build` provenance;
- the **Verification page**, `/verification`, which shows that report, or "Not run" when there is none (FR-022, NS-018).

Done means:

1. `bun run --cwd apps/docs build` (the full build, which now works because `scripts/spec-report.ts` exists):
   - writes `src/generated/build-info.json` and `src/generated/spec-report.json`;
   - prerenders `/verification` with 44 rows carrying `data-spec-id`, inside an element with `data-result="spec-report" data-provenance="bun-build"`;
   - shows the label `Run by Bun <version> at build time, <time> UTC · commit <7 chars> …`.
2. With `spec-report.json` removed, `build:site` prerenders `/verification` with `data-result="spec-report" data-provenance="none"` and "Not run", and with no `data-spec-id` row (NS-018).
3. A failing or erroring record is written to the report and shown as failing. It is never dropped or hidden.
4. The CI row always reads `CI: not available`.
5. `ResultPanel` and `ProvenanceLabel` are the only way the site shows a result. WP14 and WP15 reuse them.
6. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Provenance**, **Generated artifacts**, **Data attributes for tests**
- `kitty-specs/locus-foundation-01M5EWDR/contracts/specifications.md`: `SpecReport`, `SpecResult`, `runSpecifications`, `catalogue`
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: FR-021, FR-022, NS-018, INV-013, User Story 4 scenario 5
- `packages/locus-specs/src/index.ts` (WP07, WP08): what is actually exported
- `apps/docs/src/lib/generated.ts`, `src/lib/prerender.ts`, `src/lib/site.ts` (WP11)

### Facts verified in planning (2026-10-21)

- **Package versions.**
  - `@telos/locus` and `@telos/locus-specs` both export `"./package.json"` (WP01).
  - `import locusPackage from "@telos/locus/package.json";` type-checks with the repo's `resolveJsonModule`.
  - It works in Bun, and Vite inlines the value. A spike prerendered `data-v="9.8.7"` from a workspace package this way.
- **Runner.**
  - `runSpecifications(specs)` returns `Effect.Effect<SpecReport>`. It never fails, because errors become `status: "error"` records.
  - Run it with `Effect.runPromise`. Results come back in input order.
  - `summary` is `{ total, passed, failed, errored }`.
- **Eager glob.** In `generated.ts`, a path in the explicit list that has no file is simply absent from the record. That is how a missing `spec-report.json` becomes `null`.
- **Prerender** runs with `failOnError: true`. A page in `APP_PAGES` with no route fails the build, so add `"/verification"` in the same commit as the route.

### Design decision: where the site commit comes from

Browser provenance needs `siteCommit`, the commit the site was built from, but `content.json` carries no commit. `scripts/spec-report.ts` therefore writes **two** files on each run:

1. `src/generated/build-info.json` = `{ "commit": "<sha>", "dirty": <bool> }`, written **first**;
2. `src/generated/spec-report.json`, written after the run completes.

Before it runs, the script deletes any old `spec-report.json`. A crashed run therefore leaves no stale report, and the page says "Not run". If neither file exists, browser runs label the site commit `unknown`.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP13 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edits** (see `tasks.md`, "Shared files"), each named in your commit body:
  - `apps/docs/src/lib/prerender.ts`: append `"/verification"` to `APP_PAGES`.
  - `apps/docs/src/lib/generated.ts`: add `"../generated/build-info.json"` to the glob list and export `buildInfoJson`, exactly as shown in T073.
  - `apps/docs/src/routeTree.gen.ts`: regenerate it by building. Never edit it by hand.
- Do not add dependencies. Do not edit `package.json`, `bun.lock`, `scripts/content.ts`, `packages/` or `docs/`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Components never import `@tanstack/react-router`, `generated.ts` or `build.ts`. Data reaches them through props from the route file. Tests never import `generated.ts`, `build.ts` or route files, because they use `import.meta.glob`, which Bun cannot run.
- No wording that claims a result is verified or passing unless it is computed from a report. The page text never says "all tests pass".
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(docs): add build-time spec report and verification page`. No AI names and no `Co-Authored-By` line.
- GRACE markup on every file:
  - `scripts/spec-report.ts`: `LINKS: M-DOCS-SPEC-REPORT`, `DEPENDS: M-LOCUS-SPECS`;
  - `src/` files: `LINKS: M-DOCS-SITE`;
  - every export: a `START_CONTRACT` block.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP13 --agent claude`. This WP depends on WP08 and WP11, so its lane must contain both. If either is missing from your worktree, stop and report it.

## Subtasks & Detailed Guidance

### Subtask T069 – Provenance types and helpers (`src/lib/provenance.ts`)

Pure TypeScript. No Bun, Node or DOM API.

```ts
import locusPackage from "@telos/locus/package.json";
import specsPackage from "@telos/locus-specs/package.json";

export interface PackageVersions { readonly "@telos/locus": string; readonly "@telos/locus-specs": string }
export interface BrowserProvenance { readonly origin: "browser"; readonly at: string; readonly packages: PackageVersions; readonly siteCommit: string }
export interface BunBuildProvenance {
  readonly origin: "bun-build"; readonly at: string; readonly runtime: string;
  readonly packages: PackageVersions; readonly commit: string; readonly dirty: boolean;
}
export interface CiProvenance { readonly origin: "ci" }
export interface HistoricalProvenance { readonly origin: "historical"; readonly at: string; readonly packages: PackageVersions; readonly siteCommit: string }
export type Provenance = BrowserProvenance | BunBuildProvenance | CiProvenance | HistoricalProvenance;
/** "none" marks a result slot with nothing in it (NS-018). */
export type ProvenanceOrigin = Provenance["origin"] | "none";

export const PACKAGE_VERSIONS: PackageVersions = {
  "@telos/locus": locusPackage.version,
  "@telos/locus-specs": specsPackage.version,
};
export const CI_PROVENANCE: CiProvenance = { origin: "ci" };

export function browserProvenance(at: Date, siteCommit: string, packages: PackageVersions = PACKAGE_VERSIONS): BrowserProvenance;
/** Same run, marked stale because its input was edited afterwards (INV-013). */
export function toHistorical(provenance: BrowserProvenance | HistoricalProvenance): HistoricalProvenance;
/** "2026-10-21T10:18:46.123Z" → "2026-10-21 10:18:46 UTC". Input that is not an ISO instant is returned unchanged. */
export function formatInstant(iso: string): string;
/** The first 7 characters of a 40-character hex sha, keeping a "-dirty" suffix; anything else unchanged. */
export function shortCommit(commit: string): string;
/** "unknown" for null; the commit, with "-dirty" appended when dirty. */
export function siteCommitOf(info: { readonly commit: string; readonly dirty: boolean } | null): string;
/** The visible label text. null means "Not run". */
export function provenanceText(provenance: Provenance | null): string;
```

`provenanceText`, where `P` is `@telos/locus <v> · @telos/locus-specs <v>`:

| Origin | Text |
| --- | --- |
| `browser` | `Run in this browser at <formatInstant(at)> · P · site commit <shortCommit(siteCommit)>` |
| `bun-build` | `Run by <runtime> at build time, <formatInstant(at)> · commit <shortCommit(commit)>`, then ` (uncommitted changes)` when `dirty`, then ` · P` |
| `ci` | `CI: not available` |
| `historical` | `Historical: run in this browser at <formatInstant(at)> · P · site commit <shortCommit(siteCommit)>. The input has changed since this run.` |
| `null` | `Not run` |

Times are always shown in UTC from the ISO string, never with `toLocaleString`. That keeps the prerendered and hydrated text identical.

**Tests first** (`test/provenance.test.ts`):

1. `PACKAGE_VERSIONS` equals the `version` fields read with `Bun.file(...).json()` from `packages/locus/package.json` and `packages/locus-specs/package.json`.
2. `formatInstant`:
   - `"2026-10-21T10:18:46.123Z"` and `"2026-10-21T10:18:46Z"` both give `"2026-10-21 10:18:46 UTC"`;
   - `"yesterday"` gives `"yesterday"`.
3. `shortCommit`:
   - 40 hex characters give the first 7;
   - `<40 hex>-dirty` gives `<7>-dirty`;
   - `"unknown"` gives `"unknown"`.
4. `siteCommitOf`:
   - `null` gives `"unknown"`;
   - `{ commit: "abc", dirty: false }` gives `"abc"`;
   - `{ commit: "abc", dirty: true }` gives `"abc-dirty"`.
5. `provenanceText`: the exact string for each of the five rows. Use `at: "2026-10-21T10:18:46.123Z"`, `commit: "0123456789abcdef0123456789abcdef01234567"`, `runtime: "Bun 1.4.4"`, packages `0.1.0`/`0.1.0`, and `dirty` both true and false.
6. `browserProvenance(new Date("2026-10-21T10:18:46.123Z"), "abc")` is `{ origin: "browser", at: "2026-10-21T10:18:46.123Z", packages: PACKAGE_VERSIONS, siteCommit: "abc" }`. `toHistorical` of it keeps `at`, `packages` and `siteCommit` and sets `origin: "historical"`.

### Subtask T070 – `scripts/spec-report.ts`

```ts
import type { Specification, SpecReport } from "@telos/locus-specs";
import type { BunBuildProvenance, PackageVersions } from "../src/lib/provenance";
import type { SpecReportFile } from "../src/lib/build-data";

export interface GitInfo { readonly commit: string; readonly dirty: boolean }

/** Pure: wraps a report with bun-build provenance. */
export function createSpecReportFile(options: {
  readonly report: SpecReport; readonly at: Date; readonly runtime: string;
  readonly packages: PackageVersions; readonly git: GitInfo;
}): SpecReportFile;

/** `git rev-parse HEAD` and `git status --porcelain` via Bun.spawnSync in `root`; on any failure { commit: "unknown", dirty: true }. */
export function readGit(root: string): GitInfo;

export interface WriteOptions {
  readonly outDir: string;                       // the apps/docs directory
  readonly git: () => GitInfo;
  readonly now?: () => Date;                     // default () => new Date()
  readonly specs?: ReadonlyArray<Specification>; // default catalogue
  readonly run?: (specs: ReadonlyArray<Specification>) => Promise<SpecReport>; // default Effect.runPromise(runSpecifications(specs))
}
/** Deletes a stale spec-report.json, writes build-info.json, runs, then writes spec-report.json. */
export function writeSpecReport(options: WriteOptions): Promise<SpecReportFile>;
```

The steps of `writeSpecReport`:

1. `mkdir(<outDir>/src/generated, { recursive: true })`, then `rm(<outDir>/src/generated/spec-report.json, { force: true })`.
2. Call `git()` once. Write `build-info.json` as `JSON.stringify({ commit, dirty }, null, 2) + "\n"`.
3. Take `at = now()`, then `report = await run(specs)`. If `run` throws, the error propagates. `spec-report.json` then does not exist, and the page shows "Not run".
4. Build `file = createSpecReportFile({ report, at, runtime: \`Bun ${Bun.version}\`, packages: PACKAGE_VERSIONS, git: info })`. Write it as `JSON.stringify(file, null, 2) + "\n"` and return it.

**CLI** (`if (import.meta.main)`). It takes `--out <dir>`, defaulting to `resolve(import.meta.dir, "..")`. The git root is `resolve(import.meta.dir, "../../..")`. It prints:

```
spec-report: 44 specifications, 44 passed, 0 failed, 0 errored (commit 0123abc)
```

When `failed + errored > 0`, it also prints `spec-report: <n> specification(s) did not pass; the report shows them` to stderr. **It exits 0 in that case.** The site must be able to show a failing report (contract: "never hidden"), and `bun test` already fails the repository checks on any failing record. The CLI exits 1 only when it throws (import, run or write failure) and prints the error.

Use `node:fs/promises` and `node:path` here. This is a build script, so the portability rule (C-004) does not apply. Put GRACE `START_BLOCK_` markers around the CLI and around each step of `writeSpecReport`.

### Subtask T071 – Spec-report tests (`test/spec-report.test.ts`)

Write these before T070.

1. **`createSpecReportFile`**, with a two-result report, `at = new Date("2026-10-21T10:18:46.123Z")`, `runtime: "Bun 1.4.4"`, and git `{ commit: "0123abc", dirty: true }`. The result deep-equals `{ report, provenance: { origin: "bun-build", at: "2026-10-21T10:18:46.123Z", runtime: "Bun 1.4.4", packages, commit: "0123abc", dirty: true } }`.
2. **`writeSpecReport` with the real catalogue**, into a `mkdtemp` directory, with fake git `{ commit: "f00", dirty: false }` and a fixed `now`:
   - it returns a file whose `report.summary` is `{ total: 44, passed: 44, failed: 0, errored: 0 }`;
   - `report.results.map((r) => r.id)` equals `catalogue.map((s) => s.id)`;
   - `provenance.runtime` is `` `Bun ${Bun.version}` `` and `provenance.packages` is `PACKAGE_VERSIONS`;
   - both files on disk parse to the returned values: `build-info.json` is `{ commit: "f00", dirty: false }`;
   - `readSpecReportFile(JSON.parse(<spec-report.json>))` deep-equals the returned file.
3. **Failing records are kept.** Pass `specs: [catalogue[0], mutated]`, where `mutated` is `structuredClone(catalogue[0])` with the validate expectation's `valid` flipped. Then:
   - `summary` is `{ total: 2, passed: 1, failed: 1, errored: 0 }`;
   - `results[1].status` is `"fail"`;
   - the written file has both results.
4. **A crashed run leaves no report.** Write a bogus `spec-report.json` into the temp `src/generated` first. Pass `run: () => Promise.reject(new Error("boom"))`. Then:
   - `writeSpecReport` rejects with `boom`;
   - `spec-report.json` no longer exists;
   - `build-info.json` exists.
5. **CLI.** Run `Bun.spawnSync({ cmd: [process.execPath, "scripts/spec-report.ts", "--out", tmp], cwd: <apps/docs> })`:
   - it exits 0;
   - stdout matches `/^spec-report: 44 specifications, 44 passed, 0 failed, 0 errored \(commit ([0-9a-f]{7}|unknown)\)/m`;
   - both files exist under `tmp/src/generated`.

### Subtask T072 – `ProvenanceLabel`, `ResultPanel`, `SpecReportTable`; reading the generated files

**`src/lib/build-data.ts`** (pure, tested):

```ts
import type { SpecReport } from "@telos/locus-specs";
import type { BunBuildProvenance } from "./provenance";

export interface SpecReportFile { readonly report: SpecReport; readonly provenance: BunBuildProvenance }
export interface BuildInfo { readonly commit: string; readonly dirty: boolean }

/** null → null. A wrong shape throws `spec-report.json: <what> is invalid`, so a broken file fails the prerender loudly. */
export function readSpecReportFile(value: unknown): SpecReportFile | null;
/** null → null. A wrong shape throws `build-info.json: <what> is invalid`. */
export function readBuildInfo(value: unknown): BuildInfo | null;
```

`readSpecReportFile` checks:

- `provenance.origin === "bun-build"`;
- `at`, `runtime` and `commit` are strings, both package versions are strings, and `dirty` is a boolean;
- `report.results` is an array. Each result has a string `id`, a `status` of `pass`, `fail` or `error`, and a number `durationMs`;
- **the summary agrees with the results**: `total === results.length`, and `passed`, `failed` and `errored` equal the counts of each status. A summary that disagrees throws `spec-report.json: summary is invalid`. A report can then never claim more passes than it holds.

**Components** (React, no router):

| File | Export | Renders |
| --- | --- | --- |
| `provenance-label.tsx` | `ProvenanceLabel({ provenance }: { provenance: Provenance \| null })` | `<p data-slot="provenance-label" data-origin={origin} className="text-sm text-muted-foreground">` holding a lucide icon (`Globe` for browser, `Hammer` for bun-build, `CircleSlash` for ci and none, `History` for historical), with `aria-hidden`, followed by `provenanceText(provenance)`. |
| `result-panel.tsx` | `ResultPanel({ kind, provenance, title, children })` | `<section data-result={kind} data-provenance={provenance?.origin ?? "none"} data-stale={historical ? "true" : undefined} aria-label={title}>`, with `<ProvenanceLabel>` first and then `children`. When historical, it gets a dashed border and muted text (`border-dashed opacity-75`). |
| `spec-report-table.tsx` | `SpecReportTable({ report, specs })` | see below |

```ts
export type ResultKind =
  | "validation-report" | "revision-id" | "change-set" | "history-state"
  | "decode-error" | "spec-report" | "spec-result";
```

`ResultKind` is exported from `result-panel.tsx`. Those are the contract's result kinds. WP14 and WP15 use them; do not add others.

**`SpecReportTable({ report, specs }: { report: SpecReport; specs: ReadonlyArray<Specification> })`**:

- `<p data-slot="spec-summary">`: `<total> specifications: <passed> passed, <failed> failed, <errored> errored.` Wrap the failed and errored numbers in `<strong data-count="failed">` and `<strong data-count="errored">`. Use the destructive text colour when they are non-zero.
- A shadcn `Table` with the columns Specification, Title, Invariants, Polarity, Result and Details. Add `<TableCaption>` "Specification results".
- One row per result, in report order: `<TableRow data-spec-id={r.id} data-spec-status={r.status}>`.
  - Title, invariants (joined with `, `, or `—` when empty) and polarity come from `specs`, matched by id.
  - When an id is not in `specs`, the title reads `(not in this catalogue)`. Never drop the row.
  - Result reads `Pass`, `Fail` or `Error`. Fail and error use the destructive colour.
  - Details holds `<details><summary>Expected and observed</summary><pre>` with `Expected:` and `Observed:` followed by `JSON.stringify(value, null, 2)` (write `undefined` when that returns undefined). These are React text nodes, never `innerHTML`.

### Subtask T073 – Verification page and route

**Shared edit, `src/lib/generated.ts`.** The glob list becomes:

```ts
const modules = import.meta.glob<{ default: unknown }>(
  ["../generated/content.json", "../generated/spec-report.json", "../generated/build-info.json"],
  { eager: true },
);
```

Then append:

```ts
/** The raw build info ({ commit, dirty }), or null when spec-report.ts did not run. WP13 decodes it. */
export const buildInfoJson: unknown = modules["../generated/build-info.json"]?.default ?? null;
```

**`src/lib/build.ts`** (Vite only; never imported by tests or components):

```ts
import { readBuildInfo, readSpecReportFile } from "./build-data";
import { buildInfoJson, specReportJson } from "./generated";
import { siteCommitOf } from "./provenance";

export const specReportFile = readSpecReportFile(specReportJson);
/** The commit this site was built from, for browser provenance (WP14, WP15). */
export const SITE_COMMIT = siteCommitOf(readBuildInfo(buildInfoJson));
```

**`src/components/verification-view.tsx`**: `VerificationView({ file, specs }: { file: SpecReportFile | null; specs: ReadonlyArray<Specification> })`.

```
<main id="content" data-page="verification">
  <h1>Verification</h1>
  <p>  The executable specifications LOC-001 to LOC-044 are data records in @telos/locus-specs.
       `bun test` runs them on every repository check. The site build runs them once more with Bun
       and records the report below, with the commit and time of that run. </p>
  <section aria-labelledby="build-report-heading">
    <h2 id="build-report-heading">Build-time report</h2>
    file
      ? <ResultPanel kind="spec-report" provenance={file.provenance} title="Build-time specification report">
          <SpecReportTable report={file.report} specs={specs} /></ResultPanel>
      : <ResultPanel kind="spec-report" provenance={null} title="Build-time specification report">
          <p><strong>Not run.</strong> No specification report was produced for this build, so nothing here is shown as passing.</p></ResultPanel>
  </section>
  <section aria-labelledby="ci-heading">
    <h2 id="ci-heading">Continuous integration</h2>
    <ResultPanel kind="spec-report" provenance={CI_PROVENANCE} title="CI specification report">
      <p>Stage 0 has no CI service, so there is no CI result.</p></ResultPanel>
  </section>
  <section aria-labelledby="run-heading">
    <h2 id="run-heading">Run them yourself</h2>
    <p> `bun test packages/locus-specs` runs every record locally. <a href="/playground/e">Playground scenario E</a> runs the same records in this browser. </p>
  </section>
</main>
```

Write the code in `<code>` elements. The `/playground/e` link is plain `<a href>`. That route arrives in WP15; `crawlLinks` is off, so the build does not follow it.

**`src/routes/verification.tsx`**:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { catalogue } from "@telos/locus-specs";
import { VerificationView } from "@/components/verification-view";
import { specReportFile } from "@/lib/build";
import { pageTitle } from "@/lib/site";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: pageTitle("Verification") },
      { name: "description", content: "The specification report from the build-time Bun run, with its provenance." },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  return <VerificationView file={specReportFile} specs={catalogue} />;
}
```

**Shared edit, `src/lib/prerender.ts`**: `APP_PAGES` becomes `["/architecture", "/not-found", "/verification"]`. WP11's tests pass `appPages` explicitly, so they do not change. Its `APP_ROUTES` test (every `APP_PAGES` entry is a known app route) now also covers `/verification`.

### Subtask T074 – Verification render tests and build check

**Tests first** (`test/verification.test.tsx`, `renderToStaticMarkup`):

1. **No report** (`file={null}`):
   - one element has `data-result="spec-report"` and `data-provenance="none"`, and contains `Not run`;
   - the markup has no `data-spec-id`, and no `passed` outside the sentence "nothing here is shown as passing";
   - the CI panel has `data-provenance="ci"` and contains `CI: not available`.
2. **Report with one pass and one fail** (two catalogue records, results built by hand):
   - two `data-spec-id` rows, with `data-spec-status="pass"` and `data-spec-status="fail"`;
   - the summary reads `2 specifications: 1 passed, 1 failed, 0 errored.`;
   - the panel has `data-provenance="bun-build"`, and its label text equals `provenanceText(file.provenance)`;
   - the failing row's details contain its expected and observed JSON.
3. **Unknown id**: a result `LOC-999` renders a row with `(not in this catalogue)`.
4. **Coverage rule (INV-013)**, over the markup of cases 1 and 2:
   - every opening tag that has `data-result="…"` also has `data-provenance="…"`;
   - the number of `data-slot="provenance-label"` is at least the number of `data-result`.
5. **`ResultPanel` historical**: `data-stale="true"`, `data-provenance="historical"`, and a label that starts with `Historical:`.
6. **`readSpecReportFile` and `readBuildInfo`** (in `test/spec-report.test.ts` or here):
   - `null` gives `null`;
   - a valid value round-trips;
   - `origin: "browser"`, a missing `results`, a status of `"skipped"`, and a summary claiming `passed: 2` for one passing result each throw, with the message naming the field.

**Build check.** Paste the outputs in your report.

1. Run `bun run --cwd apps/docs build`. Then check:
   - `dist/client/verification/index.html` exists;
   - `grep -c 'data-spec-id=' …` gives 44;
   - `grep -o 'data-spec-status="pass"' … | wc -l` gives 44;
   - the file contains `data-provenance="bun-build"` and `44 specifications: 44 passed, 0 failed, 0 errored.`;
   - the prerender line reports the number of documents plus 3.
2. **NS-018**: `rm apps/docs/src/generated/spec-report.json && bun run --cwd apps/docs build:site`. The verification page now contains `data-provenance="none"` and `Not run`, and `grep -c 'data-spec-id='` gives 0.
3. Run `bun run --cwd apps/docs build` again to restore the report. Then run `git diff --exit-code apps/docs/src/routeTree.gen.ts` after a second `build:site`, to show the route tree is stable.
4. Run `bun run verify`.

## Definition of Done

- [ ] All files in `owned_files` exist, with GRACE markup and TSDoc on every export.
- [ ] The provenance, spec-report and verification tests pass, and they were seen failing first.
- [ ] The full `build` works. `/verification` shows 44 rows with `bun-build` provenance, and "Not run" without a report.
- [ ] The three sanctioned shared edits are exactly as described and named in the commit body.
- [ ] `bun run verify` passes.

## Risks

- **Hiding failures.** A report filtered to passing rows, or a summary not derived from the rows, breaks INV-013. `readSpecReportFile` refuses a summary that disagrees with its rows, and test 3 in T071 keeps failing rows.
- **Stale report.** An old `spec-report.json` from an earlier run would show old evidence. Deleting it before each run, plus the commit and time in the label, guards against this.
- **Locale-dependent time.** `toLocaleString` would differ between the prerender and the browser and cause hydration mismatches. Use `formatInstant`.
- **The `/playground/e` link** points to a route that WP15 adds. It must stay a plain link, and `crawlLinks` must stay off.

## Reviewer Guidance

- Check that `provenanceText` matches the table exactly. WP14–WP16 assert on these strings.
- Check that no component imports `generated.ts` or `build.ts`, and that `ResultPanel` is the only place that writes `data-result`.
- Run the NS-018 build check yourself and look at the raw HTML of `/verification`.
- Run `bun test apps/docs`, `bun run --cwd apps/docs build` and `bun run verify`.

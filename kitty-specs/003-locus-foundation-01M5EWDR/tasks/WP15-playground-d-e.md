---
work_package_id: WP15
title: Playground scenarios D–E
dependencies:
- WP14
requirement_refs:
- FR-019
- FR-021
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T082
- T083
- T084
- T085
phase: Phase 5 - Documentation site
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/src/playground/
create_intent:
- apps/docs/src/playground/locus-text.ts
- apps/docs/src/playground/run-revisions.ts
- apps/docs/src/playground/run-specs.ts
- apps/docs/src/playground/components/revision-results.tsx
- apps/docs/src/playground/components/revisions-scenario.tsx
- apps/docs/src/playground/components/specs-results.tsx
- apps/docs/src/playground/components/specs-scenario.tsx
- apps/docs/test/playground-revisions.test.ts
- apps/docs/test/playground-specs.test.ts
- apps/docs/test/playground-render-de.test.tsx
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/playground/locus-text.ts
- apps/docs/src/playground/run-revisions.ts
- apps/docs/src/playground/run-specs.ts
- apps/docs/src/playground/components/revision-results.tsx
- apps/docs/src/playground/components/revisions-scenario.tsx
- apps/docs/src/playground/components/specs-results.tsx
- apps/docs/src/playground/components/specs-scenario.tsx
- apps/docs/test/playground-revisions.test.ts
- apps/docs/test/playground-specs.test.ts
- apps/docs/test/playground-render-de.test.tsx
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP15 – Playground scenarios D–E

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

Add the last two playground scenarios (FR-019, FR-021) on the infrastructure WP14 built. They must follow the same rules: real package, no execution of input, provenance on every result, and staleness instead of recomputation.

Done means:

1. **D — Revisions** (`/playground/d`):
   - Two Locus editors, "Locus A" and "Locus B", start from `examples.history.a` and `.b`.
   - **Compute** shows both Revision ids:
     - A is `sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6`;
     - B is `sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315`.
   - It also shows the change set: responsibility `Collect payment details` removed, then `Collect payment and delivery details` added.
   - A history panel appends A or B with an editable expected head, and shows every outcome. The walk-through "A with no head, B with no head, B with head A, B again with head B" gives appended, stale, appended, no-op.
2. **E — Specifications** (`/playground/e`):
   - **Run all** runs the 44 specifications in the browser with browser provenance.
   - The build report is shown next to them with its own provenance, or as "Not run".
   - A comparison lists each id whose status differs from the build report.
   - A golden check recomputes the Revision ids of every `revision-compare` fixture and compares them with `revisionGoldens`.
3. Both are prerendered with the WP14 no-JavaScript fallback. The WP14 safety and render tests still pass and now cover the new files.
4. The tests were written first and seen failing. `bun run verify` and `bun run --cwd apps/docs build` pass.

## Context & Constraints

Read first:

- `apps/docs/src/playground/` as WP14 left it: `run-state.ts`, `use-run.ts`, `registry.ts`, `components/json-editor.tsx`, `components/fabric-scenario.tsx`, `components/fabric-results.tsx`. Reuse them; do not duplicate them.
- `apps/docs/src/components/result-panel.tsx`, `spec-report-table.tsx` and `src/lib/provenance.ts` (WP13)
- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Playground** rows D and E, **Provenance**
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md`: **ChangeSet** order and the history state diagram
- `packages/locus/test/history.test.ts` (WP05): how the tests reach the `RevisionHistory` service inside `Effect.gen`. Use the same access pattern.
- `packages/locus-specs/src/runner.ts` (WP07), the `history` check: the same append-and-map logic you write here.

### Facts verified in planning (2026-10-21)

- **`decodeLocus(input: unknown): Effect<LocusDefinition, DecodeError>`**. There is **no** `decodeLocusJson`, so this WP adds the text step itself: a length cap of 1,048,576 code units, then `JSON.parse` inside try/catch, then `decodeLocus`. A JSON or length error becomes one issue at path `""`, the same as `decodeFabricJson`.
- **`diffRevisions(from, to): Effect<ChangeSet, LocusMismatchError>`**. `ChangeSet` is `{ locus, from, to, changes }`. Each `Change` is one of:
  - `{ part: "charter.purpose" | "owner", kind: "changed", from, to }`;
  - `{ part, kind: "added" | "removed", value }`.
- **`RevisionHistory.append(revision, expectedHead)`** gives `{ appended, head }`, or fails with `StaleBaselineError { locus, expected, actual }`. The stale check comes first, and appending the current head is a no-op. `RevisionHistoryInMemory` is a **fresh, empty** history each time the layer is built.
- **Replaying** the append log against a fresh layer on every click is deterministic, and it uses the same package path as the runner. It also needs no long-lived runtime. That is the design used here.
- **`runSpecifications(specs): Effect<SpecReport>`** never fails. `catalogue` has 44 records, and `revisionGoldens` has eight keys, `"<id>.a"` and `"<id>.b"` for LOC-008, LOC-009, LOC-034 and LOC-039.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP15 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edits** (see `tasks.md`, "Shared files"), each named in your commit body:
  - `apps/docs/src/playground/registry.ts` (WP14's): append the D and E entries to `SCENARIOS`, with their components imported from your files;
  - `apps/docs/src/lib/prerender.ts`: append `"/playground/d"` and `"/playground/e"` to `APP_PAGES`.

  No route file changes: `$scenario.tsx` already serves every registered id, so `routeTree.gen.ts` must not change.
- **C-002 is absolute** (WP14's rules and scan apply). Input is parsed only by `decodeLocusText` (below). Computation runs only on a button press.
- Do not add dependencies. Do not edit `packages/`, `docs/`, `package.json`, `bun.lock` or any WP14 file other than `registry.ts`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(playground): add revision and specification scenarios`. No AI names and no `Co-Authored-By` line.
- GRACE markup: `LINKS: M-DOCS-PLAYGROUND`, plus `DEPENDS` as each file needs (`M-LOCUS-DECODE`, `M-LOCUS-REVISION`, `M-LOCUS-HISTORY`, `M-LOCUS-SPECS`, `M-DOCS-SITE`). Every export gets a `START_CONTRACT` block.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP15 --agent claude`.

## Data attributes (WP16 relies on these; keep them exact)

WP14's attributes apply (`data-slot="input"`, `data-action="run"`/`"reset"`, `data-slot="results"`, `data-result`, `data-revision-id`, `data-locus`, `data-issue-path`). New ones:

| Attribute | On |
| --- | --- |
| `data-side="a"` or `"b"` | each Locus editor's wrapper, and each side's Revision or decode-error panel |
| `data-change-part`, `data-change-kind` | each change row |
| `data-slot="expected-head"` | the expected head `<input>` |
| `data-action="append-a"`, `"append-b"`, `"use-head"`, `"reset-history"` | the history buttons |
| `data-history-step` (0-based), `data-history-outcome` (`appended`, `no-op`, `stale`) | each row of the append log |
| `data-history-head` | the element showing a Locus's current head (value: the id, or `none`) |
| `data-history-entry` | each entry id in a Locus's history list |
| `data-golden-key`, `data-golden-match` (`true`/`false`) | each golden check row |
| `data-compare="same"` or `"different"`, `data-compare-id` | the comparison summary and each differing row |

## Subtasks & Detailed Guidance

### Subtask T082 – Scenario D: Revisions and change set

**`src/playground/locus-text.ts`**:

```ts
import type { LocusDefinition } from "@telos/locus";
import type { DecodeIssue } from "./run-fabric";

export const MAX_INPUT_LENGTH = 1_048_576;
/** Text → LocusDefinition, mirroring decodeFabricJson's text handling. Never throws. */
export function decodeLocusText(text: string): Promise<{ readonly ok: true; readonly locus: LocusDefinition } | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> }>;
```

- If `text.length > MAX_INPUT_LENGTH`, give `{ ok: false, issues: [{ path: "", message: "Input is longer than 1048576 characters." }] }`.
- `JSON.parse` in try/catch. A parse error gives one issue at `""` with message `Not valid JSON: <error message>`.
- Otherwise run `Effect.result(decodeLocus(value))`. A failure gives `failure.issues`.
- Check that the 1,048,576 limit equals the one in `packages/locus/src/decode.ts` (WP06). Do not import an internal constant; report a mismatch if you find one.

**`src/playground/run-revisions.ts`**, part 1:

```ts
export type SideOutcome =
  | { readonly ok: true; readonly revision: Revision }
  | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> }
  | { readonly ok: false; readonly digestFailed: true };
export type DiffOutcome =
  | { readonly kind: "change-set"; readonly changeSet: ChangeSet }
  | { readonly kind: "locus-mismatch"; readonly from: Identity; readonly to: Identity }
  | { readonly kind: "unavailable" };       // one side failed
export interface RevisionsOutcome { readonly a: SideOutcome; readonly b: SideOutcome; readonly diff: DiffOutcome }

/** Decode both sides, create both Revisions, diff A → B. Never throws. */
export function runRevisions(textA: string, textB: string): Promise<RevisionsOutcome>;
/** The combined input key for run-state staleness. */
export function revisionsKey(textA: string, textB: string): string; // JSON.stringify([textA, textB])
```

**`src/playground/components/revision-results.tsx`**. Each view wraps a WP13 `ResultPanel`:

| Export | `kind` | Renders |
| --- | --- | --- |
| `SideView({ side, outcome, provenance })` | `revision-id`, or `decode-error` when the decode failed | Heading `Locus A` or `Locus B`, with `data-side`. When ok: `<code data-locus>` with the identity and `<code data-revision-id data-locus className="break-all">` with the id. When decoding failed: "Locus <A|B> is not a Locus: <n> decode issue(s)." and WP14's `DecodeIssueList` from `fabric-results.tsx`. When the digest failed: "Revision id unavailable: Web Crypto failed." |
| `ChangeSetView({ diff, provenance })` | `change-set` | **change-set**: "<n> change(s) from A to B." Then a `Table` with Part, Change and Value, rows carrying `data-change-part` and `data-change-kind`. Value is `value`, or `from → to` (with `null` shown as `none`). When there are no changes: "No changes: A and B have the same Revision id." **locus-mismatch**: "A and B are different Loci (<from>, <to>). A change set compares two Revisions of one Locus." **unavailable**: "No change set: fix the input above first." |

**`src/playground/components/revisions-scenario.tsx`**, `RevisionsScenario({ siteCommit })`:

- State:
  - `textA` and `textB`, starting as `JSON.stringify(examples.history.a, null, 2)` and `…b`;
  - `useRun(siteCommit, (key) => { const [a, b] = JSON.parse(key) as [string, string]; return runRevisions(a, b); })`. The key is produced by `revisionsKey`, never by the reader. This `JSON.parse` is of our own key, not user input.
- Layout:
  - two `JsonEditor`s side by side on wide screens and stacked on narrow ones, labelled "Locus A" and "Locus B", in wrappers with `data-side`;
  - the buttons `Compute Revisions` (`data-action="run"`) and `Reset to example` (`data-action="reset"`).
- Results region:
  - the WP14 idle, running and crashed states;
  - when done: `SideView` for A, `SideView` for B and `ChangeSetView`, each with `provenanceFor(state, revisionsKey(textA, textB))`;
  - WP14's stale notice when `isStale`;
  - then the `HistoryPanel` (T083).

### Subtask T083 – Scenario D: history panel

**`run-revisions.ts`**, part 2, a pure replay over the real service:

```ts
export interface AppendStep { readonly revision: Revision; readonly expectedHead: RevisionId | null }
export type StepOutcome =
  | { readonly outcome: "appended"; readonly head: RevisionId }
  | { readonly outcome: "no-op"; readonly head: RevisionId }
  | { readonly outcome: "stale"; readonly expected: RevisionId | null; readonly actual: RevisionId | null };
export interface HistoryReplay {
  readonly outcomes: ReadonlyArray<StepOutcome>;
  /** One entry per distinct Locus, in order of first append. */
  readonly loci: ReadonlyArray<{ readonly locus: Identity; readonly head: RevisionId | null; readonly entries: ReadonlyArray<RevisionId> }>;
}
/** Runs every step, in order, against one fresh RevisionHistoryInMemory. */
export function replayHistory(steps: ReadonlyArray<AppendStep>): Promise<HistoryReplay>;
export function isRevisionId(text: string): boolean; // /^sha256:[0-9a-f]{64}$/
```

Implement the replay as one `Effect.gen` program, provided with `RevisionHistoryInMemory` and run with `Effect.runPromise`:

- for each step, `Effect.result(history.append(step.revision, step.expectedHead))`;
- map a Success to `appended` or `no-op` by `appended`, and a Failure (`StaleBaselineError`) to `stale` with its `expected` and `actual`;
- after the loop, read `head` and `entries` for each distinct Locus.

**`HistoryPanel`** (in `revisions-scenario.tsx`). It takes the Revisions of the **current run**: `a` and `b` when both sides are ok, otherwise whichever is ok.

- State:
  - `steps: AppendStep[]`;
  - `replay: HistoryReplay | null`;
  - `provenance: BrowserProvenance | null`, set by `browserProvenance(new Date(), siteCommit)` after each replay;
  - `expectedText: string`, which starts empty.
- Controls:
  - `<label>Expected head</label>` and a shadcn `Input`, with `data-slot="expected-head"`, `spellCheck={false}`, a monospace font and the hint "Leave empty for no head.";
  - `Use current head` (`data-action="use-head"`) fills the field with the head of A's Locus from `replay`, or empties it;
  - `Append A` and `Append B` (`data-action="append-a"`/`"append-b"`), each disabled when that side has no Revision or the results are stale;
  - `Reset history` (`data-action="reset-history"`).
- Append:
  - Trim `expectedText`. If it is non-empty and not `isRevisionId`, show "Expected head must be empty or a sha256: id." in the field's `aria-describedby` hint, and do not append.
  - Otherwise push `{ revision, expectedHead }` and `replayHistory(nextSteps)`, then set the state.
  - Do **not** change `expectedText` after an append. The reader sets the expected head on purpose, which is how the stale refusal is shown.
- Reset when a new run completes: key the panel by the run's input key (`<HistoryPanel key={state.input} …>`), so a new Compute starts an empty history. Say so in the panel: "The history starts empty for each Compute."
- Rendering: a `ResultPanel` with `kind="history-state"` and the panel's provenance. While the run is stale, it uses `toHistorical(provenance)`, and the append buttons are disabled with the note "Compute again to append the edited input." Before any append, the panel shows the empty-history text with provenance `null` (Not run).
  - The append log is an `<ol>`. Each `<li data-history-step={i} data-history-outcome>` reads:
    - `Append <A|B> expecting <head or none>: appended. Head is now <id>.`
    - `…: no change, it is already the head.`
    - `…: refused, stale baseline. Expected <expected or none>, the head is <actual or none>.`
  - Then, per Locus:
    - `<code>{locus}</code>`;
    - `Head:` with `<code data-history-head={head ?? "none"}>{head ?? "none"}</code>`;
    - an `<ol>` of `<li data-history-entry>` ids.

**Tests first for T082–T083** (`test/playground-revisions.test.ts`, Bun, real package):

1. `decodeLocusText`:
   - `JSON.stringify(examples.history.a)` is ok;
   - `"{"` gives one issue at `""` that starts with `Not valid JSON:`;
   - text of length 1,048,577 gives one issue at `""`;
   - `{"id":"bad id"}` gives issues from the package, whose paths are not `""`.
2. `runRevisions` on the examples:
   - both sides ok, with the two ids above;
   - `diff.kind` is `change-set` and `changes` deep-equals `[{ part: "charter.responsibilities", kind: "removed", value: "Collect payment details" }, { part: "charter.responsibilities", kind: "added", value: "Collect payment and delivery details" }]`.
3. `runRevisions(a, a)` gives `changes` `[]`. `runRevisions(a, aWithOtherId)` gives `locus-mismatch` with both identities. `runRevisions("{", b)` gives A not ok and `diff.kind` `unavailable`.
4. **Same as the package path**: the A and B ids equal `createRevision` on `Effect.runSync(decodeLocus(examples.history.a))` (and `.b`).
5. `replayHistory`:
   - the four steps from the objectives give the outcomes `appended`, `stale` (expected `null`, actual A), `appended` and `no-op`;
   - `loci` is one Locus with head B and entries `[A, B]`;
   - `replayHistory([])` gives no outcomes and no loci.
6. `replayHistory` called twice with the same steps gives deep-equal results (fresh layer each time).
7. `isRevisionId`: true for both example ids; false for `""`, `sha256:abc`, and an upper-case id.

### Subtask T084 – Scenario E: run the specifications

**`src/playground/run-specs.ts`**:

```ts
export interface GoldenRow { readonly key: string; readonly expected: string; readonly observed: string | null; readonly match: boolean }
export interface StatusDifference { readonly id: string; readonly browser: SpecResult["status"] | "missing"; readonly build: SpecResult["status"] | "missing" }
export interface SpecsOutcome { readonly report: SpecReport; readonly goldens: ReadonlyArray<GoldenRow> }

/** Runs the whole catalogue with the real runner, then the golden check. */
export function runAllSpecs(specs?: ReadonlyArray<Specification>): Promise<SpecsOutcome>;
/** For each revision-compare record: decode a and b, create Revisions, compare with revisionGoldens["<id>.a"|".b"]. */
export function goldenRows(specs: ReadonlyArray<Specification>, goldens: Readonly<Record<string, string>>): Promise<GoldenRow[]>;
/** Ids whose status differs between the two reports, or that only one has; sorted by id. */
export function compareReports(browser: SpecReport, build: SpecReport): StatusDifference[];
```

- `goldenRows` gives `observed: null` and `match: false` when a decode or digest step fails. A missing golden key gives a row with `expected: "(no golden value)"` and `match: false`.
- `runAllSpecs` defaults `specs` to `catalogue`, runs `Effect.runPromise(runSpecifications(specs))`, then `goldenRows(specs, revisionGoldens)`.

**`src/playground/components/specs-results.tsx`**:

| Export | `kind` | Renders |
| --- | --- | --- |
| `BrowserReportView({ report, specs, provenance })` | `spec-report` | "In this browser", then WP13's `SpecReportTable` |
| `BuildReportView({ file, specs })` | `spec-report` | "At build time", then `SpecReportTable` with `file.provenance`. When `file` is null, provenance `null` and "Not run: there is no build-time report in this build." |
| `ComparisonView({ differences, buildAvailable, provenance })` | `spec-report` | No build report: "Nothing to compare: there is no build-time report." Otherwise `<p data-compare>`: `Same results as the build report for all <n> specifications.` (`same`) or `<k> specification(s) differ from the build report.` (`different`). Then rows with `data-compare-id`: id, browser status, build status. |
| `GoldenView({ rows, provenance })` | `revision-id` | "Revision ids of the revision fixtures, against the golden values", then `<p>` `<m> of <n> match.`. A table with Fixture, Golden and In this browser. Rows carry `data-golden-key` and `data-golden-match`, and the observed cell holds `<code data-revision-id>`. A mismatch uses the destructive colour. |

**`src/playground/components/specs-scenario.tsx`**, `SpecsScenario({ siteCommit, buildReport })`:

- `useRun(siteCommit, () => runAllSpecs())`, started with the constant input `""`. E has no input, so it is never stale.
- The button `Run all 44 specifications` (`data-action="run"`). Use `catalogue.length`, not a hard-coded 44.
- `BuildReportView` is always shown, before and after the run, because it is a fact of the build.
- When done: `BrowserReportView`, `ComparisonView` (`compareReports(state.result.report, buildReport.report)` when there is a build report) and `GoldenView`, all with `provenanceFor(state, "")`.

**Tests first** (`test/playground-specs.test.ts`):

1. `runAllSpecs()` gives `report.summary` `{ total: 44, passed: 44, failed: 0, errored: 0 }` and eight golden rows, all matching. `goldenRows` keys are exactly the keys of `revisionGoldens`, in catalogue order.
2. `goldenRows` with one golden value changed gives exactly that row `match: false`. A record whose `a` does not decode gives `observed: null`.
3. `compareReports`:
   - equal reports give `[]`;
   - one status flipped gives that id with both statuses;
   - an id only in the build report gives `browser: "missing"`.
4. The browser `report.results` ids equal `catalogue` ids in order.

### Subtask T085 – Register D and E; build and safety check

**Sanctioned edit to `registry.ts`**: append two entries.

| id | Title | Summary | Description | `exampleText` |
| --- | --- | --- | --- | --- |
| `d` | Revise a Locus | Compare two Revisions of one Locus, see the change set, and append them to a compare-and-set history. | "Locus A and Locus B are two versions of the checkout Locus; B rewords one responsibility. Compute both Revisions to see their ids and the change set from A to B." / "Then append them to a history. Each append names the head it expects. If that is not the current head, the history refuses with a stale-baseline error instead of overwriting." | `JSON.stringify(examples.history, null, 2)` |
| `e` | Run the specifications | Run all executable specifications in your browser and compare them with the build report. | "The specifications are data. This page runs them with the same runner the build uses, in your browser, and shows the results next to the report recorded at build time." / "It also recomputes the Revision ids of the revision fixtures and checks them against the golden values the Bun tests use." | `null` |

`ScenarioD` renders `<RevisionsScenario siteCommit={siteCommit} />`. `ScenarioE` renders `<SpecsScenario siteCommit={siteCommit} buildReport={buildReport} />`.

**Sanctioned edit to `prerender.ts`**: append `"/playground/d"` and `"/playground/e"`.

**Tests first** (`test/playground-render-de.test.tsx`, `renderToStaticMarkup`):

1. `SCENARIOS.map((s) => s.id)` is `["a", "b", "c", "d", "e"]`.
2. `ScenarioShell` for D contains the fallback and `example-input`. For E, it contains the fallback and **no** `example-input`.
3. `SideView` (ok) has `data-side="a"`, `data-result="revision-id"` and one `data-revision-id`. `ChangeSetView` with the example change set has two rows with `data-change-kind="removed"` then `"added"`. With `locus-mismatch`, it has the mismatch sentence.
4. `BuildReportView` with `file: null` gives `data-provenance="none"` and `Not run`.
5. `ComparisonView` with `[]` gives `data-compare="same"`. `GoldenView` with one mismatch gives one `data-golden-match="false"`.
6. A rendered `HistoryPanel` is not tested here, because its behaviour needs clicks. WP16 drives it in the browser, using the attributes above.

**Build check**: `bun run --cwd apps/docs build`. Then:

- `dist/client/playground/d/index.html` and `e/index.html` exist and contain `data-slot="no-js"`;
- `git diff --exit-code apps/docs/src/routeTree.gen.ts` shows no change;
- `bun test apps/docs` passes. The WP14 safety scan now also covers your files.

Then `bun run verify`.

## Definition of Done

- [ ] All files in `owned_files` exist, with GRACE markup and TSDoc on every export.
- [ ] The revisions, specs and render tests pass, and they were seen failing first. The WP14 tests still pass.
- [ ] `/playground/d` and `/playground/e` are prerendered, and no route file changed.
- [ ] The sanctioned edits are exactly as described and named in the commit body.
- [ ] `bun run verify` and the full docs build pass.

## Risks

- **A long-lived history runtime.** Keeping a built layer alive across clicks needs scope management and makes reset subtle. Replaying a step log against a fresh layer is simpler, deterministic and testable. Do not switch designs.
- **Auto-filling the expected head.** It would hide the stale-baseline refusal, which is the point of the panel. Only "Use current head" fills it.
- **Hard-coding 44.** Use `catalogue.length` and `report.summary`.
- **Large client bundle.** E imports the catalogue, so the scenario chunk grows. That is expected. Do not lazy-load with `import()`: the scan forbids it in `src/playground`.

## Reviewer Guidance

- Run the D walk-through by hand in `bun run --cwd apps/docs preview`, if a browser is available. Otherwise check test 5 and WP16's suite later.
- Confirm `replayHistory` uses `RevisionHistoryInMemory` from `@telos/locus` and does not re-implement compare-and-set.
- Confirm that E's numbers come from `runSpecifications` and not from the build file.
- Run `bun test apps/docs`, the build check and `bun run verify`.

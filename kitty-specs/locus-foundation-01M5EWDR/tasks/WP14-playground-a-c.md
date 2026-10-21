---
work_package_id: WP14
title: Playground infrastructure and scenarios A–C
dependencies:
- WP13
requirement_refs:
- C-002
- FR-019
- FR-020
- FR-021
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T075
- T076
- T077
- T078
- T079
- T080
- T081
phase: Phase 5 - Documentation site
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/src/playground/
create_intent:
- apps/docs/src/playground/run-state.ts
- apps/docs/src/playground/use-run.ts
- apps/docs/src/playground/run-fabric.ts
- apps/docs/src/playground/registry.ts
- apps/docs/src/playground/components/scenario-shell.tsx
- apps/docs/src/playground/components/json-editor.tsx
- apps/docs/src/playground/components/fabric-results.tsx
- apps/docs/src/playground/components/fabric-scenario.tsx
- apps/docs/src/playground/components/playground-index.tsx
- apps/docs/src/routes/playground/index.tsx
- apps/docs/src/routes/playground/$scenario.tsx
- apps/docs/test/run-state.test.ts
- apps/docs/test/playground-run.test.ts
- apps/docs/test/playground-render.test.tsx
- apps/docs/test/playground-safety.test.ts
- apps/docs/test/safety-scan.ts
- apps/docs/test/guide-examples.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/playground/run-state.ts
- apps/docs/src/playground/use-run.ts
- apps/docs/src/playground/run-fabric.ts
- apps/docs/src/playground/registry.ts
- apps/docs/src/playground/components/scenario-shell.tsx
- apps/docs/src/playground/components/json-editor.tsx
- apps/docs/src/playground/components/fabric-results.tsx
- apps/docs/src/playground/components/fabric-scenario.tsx
- apps/docs/src/playground/components/playground-index.tsx
- apps/docs/src/routes/playground/index.tsx
- apps/docs/src/routes/playground/$scenario.tsx
- apps/docs/test/run-state.test.ts
- apps/docs/test/playground-run.test.ts
- apps/docs/test/playground-render.test.tsx
- apps/docs/test/playground-safety.test.ts
- apps/docs/test/safety-scan.ts
- apps/docs/test/guide-examples.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP14 – Playground infrastructure and scenarios A–C

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

Build the playground (FR-019, FR-020, FR-021, C-002). It calls the **real** `@telos/locus` package on JSON the reader edits, and never executes what they type. Every result says where and when it was produced.

Done means:

1. `/playground` lists the scenarios. `/playground/a`, `/b` and `/c` work as below, and all four pages are prerendered.
2. **A — Define**: the example Fabric validates as valid, and the page shows the Revision id of each of the three Loci. `shop:checkout` is `sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6`.
3. **B — Invalid**: the example gives exactly `charter.entry-duplicate` and `charter.purpose-blank` on `shop:checkout`, and nothing on the page says "Valid". Malformed JSON gives decode issues with their paths instead.
4. **C — Relations**: the example gives `relation.refines-cycle` (members `shop:checkout`, `shop:payment`) and `relation.target-missing` (`depends-on shop:ghost`). The relation table marks the two `refines` rows as in a cycle and the `shop:ghost` row as target missing.
5. **Provenance**:
   - Every result sits in a WP13 `ResultPanel` with browser provenance.
   - Editing the input after a run turns that run's panels `historical` (`data-stale="true"`), and the result content is kept. Nothing reruns until the reader presses **Validate**.
6. **Without JavaScript**, each scenario page shows its description, the example input as read-only text, and "The playground needs JavaScript".
7. **C-002 holds**: a source scan test rejects `eval`, `new Function`, dynamic `import()` other than literal module names, script injection, and raw-HTML insertion in `src/playground/`, and it is shown to catch each form.
8. Every `example=<name>` block in `docs/guides/` equals `examples.<name>` from `@telos/locus-specs`.
9. The tests were written first and seen failing. `bun run verify` and `bun run --cwd apps/docs build` pass.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Playground**, **Provenance**, **Data attributes for tests**
- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`: functions, errors, diagnostic codes
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: User Story 4 scenarios A–C, FR-019, FR-020, C-002
- `apps/docs/src/lib/provenance.ts`, `src/components/result-panel.tsx`, `src/lib/build.ts` (WP13)
- `packages/locus-specs/src/examples.ts` (WP08)
- `docs/guides/first-locus.md` and `docs/guides/examples.md` (WP10): their `example=` blocks

### Facts verified in planning (2026-10-21)

- **`@telos/locus` (contract)**:
  - `decodeFabricJson(text): Effect<Fabric, DecodeError>` refuses text over 1,048,576 code units and reports JSON syntax errors at path `""`.
  - `validateFabric(fabric): ValidationReport` gives `{ valid, diagnostics }`. Each `Diagnostic` has `code, scope, subject, path, detail?, members?, message`.
  - `createRevision(definition): Effect<Revision, DigestError>`.
  - `DecodeError.issues` is `ReadonlyArray<{ path, message }>`.
- **Effect 4.0.4**: `Effect.result(eff)` gives `Effect<Result.Result<A, E>>`. A `Result` is `{ _tag: "Success", success }` or `{ _tag: "Failure", failure }`, with `Result.isSuccess` and `Result.isFailure` (from `import { Effect, Result } from "effect"`).
- **Examples (WP08)**: `examples.valid`, `.invalid` and `.relations` are `FabricJson`, and `examples.history` is `{ a, b }` of `LocusJson`. The expected diagnostics for them are in WP08's `examples.test.ts`.
- **Hydration**: `renderToStaticMarkup` and the prerender do not run effects. A component that renders its no-JavaScript view until a mount effect sets `hydrated = true` gives the same markup on server and client, then switches.
- **Prerender** uses `failOnError: true`. Add a path to `APP_PAGES` only once its route and scenario exist.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP14 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edits** (see `tasks.md`, "Shared files"), each named in your commit body:
  - `apps/docs/src/lib/prerender.ts`: append `"/playground"`, `"/playground/a"`, `"/playground/b"` and `"/playground/c"` to `APP_PAGES`.
  - `apps/docs/src/routeTree.gen.ts`: regenerate by building.
- **C-002 is absolute in `src/playground/`**:
  - no `eval`, `new Function`, `Function(`, `setTimeout`/`setInterval` with a string, or `import()`;
  - no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML`, `document.write`, or creating `script` or `iframe` elements;
  - user text reaches the page only as React text nodes.
- Input is parsed **only** by `decodeFabricJson` (and, in WP15, `decodeLocus` after a size-checked `JSON.parse`). Computation runs only on a button press, never on a keystroke.
- Do not add dependencies. Do not edit `packages/`, `docs/`, `package.json` or `bun.lock`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Components never import `@tanstack/react-router`, `generated.ts` or `build.ts`. Only the route files do. Tests never import route files, `generated.ts` or `build.ts`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(playground): add scenarios A to C with provenance`. No AI names and no `Co-Authored-By` line.
- GRACE markup:
  - `src/playground/**`: `LINKS: M-DOCS-PLAYGROUND`, `DEPENDS: M-LOCUS-DECODE, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-DOCS-SITE`, as each file needs;
  - route files carry no markup, as in WP11;
  - every export: a `START_CONTRACT` block.
  - **Lint rule (checked in planning with grace 4.2.1).** Every source file with markup also needs `ROLE: RUNTIME`, `MAP_MODE: EXPORTS` and a `START_MODULE_MAP` that lists **every** export, `.tsx` files included. A missing or extra name fails `grace lint` with `MODULE_MAP EXPORTS mismatch`. A test file with markup needs `ROLE: TEST`, `MAP_MODE: LOCALS` and a **non-empty** map of its top-level helpers and constants, as in `scripts/review-gate.test.ts`. Run `grace lint --path . --assertions current` before review.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP14 --agent claude`.

## Data attributes (WP16 drives the browser with these; keep them exact)

| Attribute | On |
| --- | --- |
| `data-slot="playground"` and `data-ready="true"` | the interactive root, once hydrated |
| `data-slot="no-js"` | the fallback root, before hydration |
| `data-slot="example-input"` | the read-only example `<pre>` in the fallback |
| `data-slot="input"` | each editor `<textarea>` |
| `data-action="run"` and `data-action="reset"` | the Validate and Reset buttons |
| `data-slot="results"` | the results region (`aria-live="polite"`) |
| `data-result`, `data-provenance`, `data-stale` | every result panel (WP13 `ResultPanel`) |
| `data-valid="true"` or `"false"` | the validation summary line |
| `data-diagnostic-code` | each diagnostic row |
| `data-revision-id` and `data-locus` | each displayed Revision id |
| `data-relation` (`"<from> <kind> <target>"`) and `data-relation-status` | each relation row |
| `data-issue-path` | each decode issue |

## Subtasks & Detailed Guidance

### Subtask T075 – Run state (`run-state.ts`, `use-run.ts`)

Pure model (tested):

```ts
import type { BrowserProvenance, HistoricalProvenance } from "@/lib/provenance";

export type RunState<T> =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly input: string }
  | { readonly status: "done"; readonly input: string; readonly result: T; readonly provenance: BrowserProvenance }
  | { readonly status: "crashed"; readonly input: string; readonly message: string };

export const IDLE: RunState<never>;
export function running(input: string): RunState<never>;
export function done<T>(input: string, result: T, provenance: BrowserProvenance): RunState<T>;
/** For unexpected throws only; package errors are results, not crashes. */
export function crashed(input: string, error: unknown): RunState<never>;
/** null unless done; the run's browser provenance while the input is unchanged, its historical form once it differs. */
export function provenanceFor<T>(state: RunState<T>, currentInput: string): BrowserProvenance | HistoricalProvenance | null;
export function isStale<T>(state: RunState<T>, currentInput: string): boolean;
```

Staleness is **derived** by comparing the current input with the input of the run. It is never stored. If the reader edits the input and then restores the exact text, the result is current again, and that is true. A scenario with two inputs, as in WP15, passes one combined key, for example `JSON.stringify([a, b])`.

`crashed` takes `error instanceof Error ? error.message : String(error)`.

Hook (`use-run.ts`, not unit-tested; WP16 covers it in the browser):

```ts
export function useRun<T>(siteCommit: string, run: (input: string) => Promise<T>): {
  readonly state: RunState<T>;
  readonly start: (input: string) => void;   // ignored while running
};
```

`start` sets `running(input)`, awaits `run(input)`, then sets `done(input, result, browserProvenance(new Date(), siteCommit))`. A throw sets `crashed`. A mounted ref stops state updates after unmount.

**Tests first** (`test/run-state.test.ts`):

- `provenanceFor` is null for idle, running and crashed.
- For done with input `"x"`: `"x"` gives the stored browser provenance (same object), and `"y"` gives `toHistorical` of it, with origin `historical` and the same `at`.
- `isStale` is false for idle, and true only for done with a different input.
- `crashed("x", new Error("boom")).message` is `"boom"`, and `crashed("x", 7).message` is `"7"`.

### Subtask T076 – Registry and routes

**`src/playground/registry.ts`**:

```ts
import type { ComponentType } from "react";
import type { SpecReportFile } from "@/lib/build-data";

export interface ScenarioProps {
  readonly siteCommit: string;
  /** The build-time report (WP13), for scenario E. */
  readonly buildReport: SpecReportFile | null;
}
export interface Scenario {
  readonly id: string;            // "a" … "e"
  readonly letter: string;        // "A" … "E"
  readonly title: string;
  readonly summary: string;       // one sentence, for the index
  readonly description: ReadonlyArray<string>; // paragraphs shown above the editor and in the fallback
  readonly exampleText: string | null;         // shown read-only without JavaScript; null when there is no input (E)
  readonly Component: ComponentType<ScenarioProps>;
}
/** In letter order. WP15 appends D and E. */
export const SCENARIOS: ReadonlyArray<Scenario>;
export function scenarioById(id: string): Scenario | undefined;
```

`exampleText` is `JSON.stringify(example, null, 2)`. Texts for A–C:

| id | Title | Summary | Description |
| --- | --- | --- | --- |
| `a` | Define a Fabric | Validate a valid Fabric and see the Revision id of each Locus. | "This Fabric has three Loci: a storefront that owns a checkout and a payment Locus. Validate it to see that it is valid and to see the Revision id of each Locus." / "Change the purpose of one Locus and validate again. Only that Locus gets a new Revision id." |
| `b` | Find what is invalid | See diagnostics for a Charter with a blank purpose and a duplicated responsibility. | "The checkout Locus has a blank purpose and the same responsibility twice. Validate to see both diagnostics with their codes." / "Break the JSON, for example by deleting a closing bracket. Malformed input gives a decode error with its location, not diagnostics." |
| `c` | Check Relations | See a missing Relation target and a cycle of `refines` Relations. | "The storefront depends on a Locus that does not exist, and checkout and payment refine each other. Validate to see both diagnostics and the relation table with the cycle marked." |

**Routes**:

```tsx
// src/routes/playground/index.tsx
export const Route = createFileRoute("/playground/")({
  head: () => ({ meta: [{ title: pageTitle("Playground") }, { name: "description", content: PLAYGROUND_SUMMARY }] }),
  component: () => <PlaygroundIndex scenarios={SCENARIOS} />,
});

// src/routes/playground/$scenario.tsx
export const Route = createFileRoute("/playground/$scenario")({
  loader: ({ params }) => {
    const scenario = scenarioById(params.scenario);
    if (scenario === undefined) throw notFound();
    return { id: scenario.id };
  },
  head: ({ loaderData }) => {
    const s = loaderData ? scenarioById(loaderData.id) : undefined;
    return { meta: [{ title: pageTitle(s ? `Scenario ${s.letter}: ${s.title}` : "Page not found") }, ...(s ? [{ name: "description", content: s.summary }] : [])] };
  },
  component: ScenarioPage,
});

function ScenarioPage() {
  const { id } = Route.useLoaderData();
  const scenario = scenarioById(id);
  if (scenario === undefined) return null; // unreachable: the loader threw notFound()
  return <ScenarioShell scenario={scenario} siteCommit={SITE_COMMIT} buildReport={specReportFile} />;
}
```

Loader data stays serialisable, holding the id only. Before writing the index route, check how WP11 named its other index routes (`"/principles/"`), and use the same form.

**`PlaygroundIndex({ scenarios })`** renders:

- `<main id="content" data-page="playground">` and `<h1>Playground</h1>`;
- `PLAYGROUND_SUMMARY` (exported from `registry.ts`): "Each scenario runs the real @telos/locus package in your browser on JSON you can edit. Nothing you type is executed as code; every result says where and when it was produced.";
- a `<ul>` with one entry per scenario: a link to `/playground/<id>` reading `Scenario <letter>: <title>`, then the summary.

**Shared edit**: append the four paths to `APP_PAGES` in `prerender.ts`.

### Subtask T077 – Scenario A, and the shared Fabric runner and views

**`src/playground/run-fabric.ts`** (pure apart from Web Crypto; tested under Bun):

```ts
import type { Fabric, RelationKind, RevisionId, ValidationReport } from "@telos/locus";

export interface DecodeIssue { readonly path: string; readonly message: string }
export interface RevisionRow { readonly locus: string; readonly id: RevisionId }
export type RelationProblem = "target-missing" | "self" | "duplicate" | "refines-cycle";
export interface RelationRow {
  readonly from: string; readonly kind: RelationKind; readonly target: string;
  readonly problems: ReadonlyArray<RelationProblem>;
}
export type FabricOutcome =
  | { readonly kind: "decode-error"; readonly issues: ReadonlyArray<DecodeIssue> }
  | {
      readonly kind: "validated";
      readonly report: ValidationReport;
      readonly revisions: { readonly ok: true; readonly rows: ReadonlyArray<RevisionRow> } | { readonly ok: false; readonly message: string };
      readonly relations: ReadonlyArray<RelationRow>;
    };

export function runFabric(text: string): Promise<FabricOutcome>;
/** One row per relation, Loci in Fabric order and relations in entry order; problems read from the report, never recomputed. */
export function relationRows(fabric: Fabric, report: ValidationReport): RelationRow[];
```

`runFabric`:

1. Run `Effect.result(decodeFabricJson(text))`. A failure gives `decode-error` with `failure.issues`.
2. `report = validateFabric(fabric)`.
3. Run `createRevision` for each Locus in Fabric order, inside `Effect.result(Effect.forEach(...))`. A `DigestError` gives `revisions: { ok: false, message: "Revision ids are unavailable: Web Crypto failed." }`.
4. Return `relations: relationRows(fabric, report)`.

`relationRows` rule. For Locus `L` and relation `(kind, target)`, the row's problems come from the diagnostics whose `subject === L`:

- `relation.target-missing`, `relation.self` or `relation.duplicate` whose `detail === \`${kind} ${target}\``;
- for `kind === "refines"`, any `relation.refines-cycle` diagnostic, on any subject, whose `members` include both `L` and `target`.

The problems are listed in the order shown in the type.

**`src/playground/components/fabric-results.tsx`**. Each view wraps a WP13 `ResultPanel` and takes `provenance`:

| Export | `kind` | Renders |
| --- | --- | --- |
| `DecodeIssueList({ issues })` | (none; used inside panels) | A `<ul>` with one `<li data-issue-path={path}>` per issue: `<code>{path === "" ? "(whole input)" : path}</code>` and the message. WP15 reuses it. |
| `DecodeErrorView({ issues, provenance })` | `decode-error` | "The input is not a Fabric: <n> decode issue(s). Nothing was validated." Then `DecodeIssueList`. |
| `ValidationReportView({ report, provenance })` | `validation-report` | A summary `<p data-valid>`: `Valid: no diagnostics.` or `Invalid: <n> diagnostic(s).` When there are diagnostics, a shadcn `Table` with the columns Code, Subject, Path, Detail and Message. Rows carry `data-diagnostic-code`. Detail is `detail`, or `members.join(", ")`, or `—`. |
| `RevisionIdsView({ revisions, provenance })` | `revision-id` | "Revision id of each Locus", then `<ul>` with `<li data-locus={locus} data-revision-id={id}><code>{locus}</code> <code className="break-all">{id}</code></li>`. When `ok` is false, the message instead. |
| `RelationTableView({ rows, provenance })` | `validation-report` | "Relations", then a `Table` with the columns From, Kind, Target and Status. Rows carry `data-relation` and `data-relation-status` (`ok`, or the problems joined with a space). Status text is `OK`, `Target missing`, `Self`, `Duplicate` or `In a refines cycle`. Problem rows use the destructive colour. A message `No Relations.` shows when there are no rows. |

**`src/playground/components/json-editor.tsx`**: `JsonEditor({ id, label, value, onChange })`. It renders a `<label htmlFor>` and a shadcn `Textarea` with `data-slot="input"`, `spellCheck={false}`, `autoComplete="off"`, a monospace font, `rows={18}`, and `aria-describedby` pointing to a hint "JSON. It is decoded, never executed."

**`src/playground/components/fabric-scenario.tsx`**:

```ts
export interface FabricScenarioConfig {
  readonly example: FabricJson;
  readonly panels: ReadonlyArray<"validation" | "revisions" | "relations">;
}
export function FabricScenario({ config, siteCommit }: { config: FabricScenarioConfig; siteCommit: string }): JSX.Element;
```

- State: `text`, which starts as `JSON.stringify(config.example, null, 2)`, and `useRun(siteCommit, runFabric)`.
- Layout: the `JsonEditor` labelled "Fabric JSON", then the buttons `Validate` (`data-action="run"`, disabled while running) and `Reset to example` (`data-action="reset"`). Reset restores the text only and does not run.
- Results region (`data-slot="results"`, `aria-live="polite"`):
  - idle: "Press Validate to run the package on this input.";
  - running: "Running…";
  - crashed: a shadcn `Alert` (destructive) reading "The run failed: <message>". This is not a result panel;
  - done: `DecodeErrorView` for `decode-error`. Otherwise the panels in `config.panels`, in order, each with `provenanceFor(state, text)`.
- When `isStale`, show above the panels: "The input has changed since this run. These results are historical. Press Validate to run again."

Scenario A is `panels: ["validation", "revisions"]` with `examples.valid`. Define `ScenarioA`, `ScenarioB` and `ScenarioC` in `registry.ts` as small components that render `FabricScenario`.

### Subtask T078 – Scenario B

`panels: ["validation"]` with `examples.invalid`. There is no Revision panel here, so nothing on the page reads as a success while the definition is invalid (User Story 4 scenario 2).

### Subtask T079 – Scenario C

`panels: ["validation", "relations"]` with `examples.relations`.

**Tests first for T077–T079** (`test/playground-run.test.ts`, Bun, real package):

1. `runFabric(JSON.stringify(examples.valid))`:
   - kind `validated`, `report.valid` true, no diagnostics;
   - the revision rows are, in order, `shop:storefront`, `shop:checkout`, `shop:payment`;
   - the `shop:checkout` id is `sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6`;
   - every id matches `/^sha256:[0-9a-f]{64}$/`.
2. `examples.invalid` gives the codes, in order, `["charter.entry-duplicate", "charter.purpose-blank"]`, both with subject `shop:checkout`.
3. `examples.relations`:
   - codes `["relation.refines-cycle", "relation.target-missing"]`;
   - `relations` deep-equals `[{ from: "shop:storefront", kind: "depends-on", target: "shop:ghost", problems: ["target-missing"] }, { from: "shop:checkout", kind: "refines", target: "shop:payment", problems: ["refines-cycle"] }, { from: "shop:payment", kind: "refines", target: "shop:checkout", problems: ["refines-cycle"] }]`. Adjust only the row **order** to the Fabric order of the example, and report it if it differs.
4. Decode errors:
   - `"{"` gives `decode-error` with one issue at path `""`;
   - `"x".repeat(1_048_577)` gives `decode-error` at path `""`;
   - the WP10 decode-error Fabric (relation kind `owns`) gives one issue at `loci[0].relations[0].kind`.
5. `relationRows` on a hand-built Fabric with a self `refines` and a duplicate `depends-on` gives `["self"]` and `["duplicate"]`. The self row must not also be marked as a cycle.
6. **Same as Bun** (FR-020): for each example, `runFabric`'s `report` deep-equals `validateFabric` on `Effect.runSync(decodeFabric(example))`. This ties the playground path to the package path.

### Subtask T080 – No-JavaScript fallback (`scenario-shell.tsx`)

```ts
export function ScenarioShell({ scenario, siteCommit, buildReport }: { scenario: Scenario } & ScenarioProps): JSX.Element;
```

- `<main id="content" data-page="playground-scenario" data-scenario={scenario.id}>`, `<h1>Scenario {letter}: {title}</h1>`, the description paragraphs, and a link back to `/playground` ("All scenarios").
- `const [hydrated, setHydrated] = useState(false); useEffect(() => setHydrated(true), []);`
- Before hydration: `<div data-slot="no-js">`, containing:
  - an `Alert`: "The playground needs JavaScript. Without it you can read the example input below; the results appear only when the package runs in your browser.";
  - when `exampleText !== null`, `<h2>Example input</h2>` and `<pre data-slot="example-input" tabIndex={0}>{exampleText}</pre>`.
- After hydration: `<div data-slot="playground" data-ready="true">` holding `<scenario.Component siteCommit={siteCommit} buildReport={buildReport} />`.

**Tests first** (`test/playground-render.test.tsx`, `renderToStaticMarkup`, so effects do not run):

1. For each of A–C, `ScenarioShell` markup contains:
   - the H1, each description paragraph, `data-slot="no-js"` and `The playground needs JavaScript`;
   - a `<pre data-slot="example-input"` whose text, HTML-unescaped, equals `exampleText`;
   - no `data-slot="playground"`.
2. An example containing `<script>alert(1)</script>` as a purpose renders escaped, as `&lt;script&gt;`. Never raw.
3. `ValidationReportView`, valid, with a browser provenance:
   - `data-result="validation-report"`, `data-provenance="browser"`, `data-valid="true"` and `Valid: no diagnostics.`
   - Invalid with two diagnostics gives two `data-diagnostic-code` rows and `Invalid: 2 diagnostic(s).`
4. `RevisionIdsView` gives one `data-revision-id` per row, each with `data-locus`. With a historical provenance it carries `data-stale="true"` and the `Historical:` label.
5. `DecodeErrorView` with path `""` shows `(whole input)`.
6. `RelationTableView` gives `data-relation="shop:checkout refines shop:payment"` with `data-relation-status="refines-cycle"`.
7. `PlaygroundIndex` with `SCENARIOS` gives three links, `/playground/a` to `/playground/c`, in order.

### Subtask T081 – Safety scan (C-002) and guide examples

**`test/safety-scan.ts`**, a pure helper:

```ts
/** Removes // and /* */ comments; good enough for our own sources. */
export function stripComments(source: string): string;
/** Constructs forbidden anywhere in apps/docs/src. */
export function siteViolations(source: string): string[];
/** Additional constructs forbidden in apps/docs/src/playground. */
export function playgroundViolations(source: string): string[];
```

- `siteViolations` flags:
  - `\beval\s*\(`, `new\s+Function\b` and `\bFunction\s*\(`;
  - `setTimeout`/`setInterval` whose first argument is a string literal;
  - `import\s*\(` whose argument does not start with a quote. A literal module name such as `import("mermaid")` is allowed.
- `playgroundViolations` flags:
  - `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML` and `document.write`;
  - `createElement\(\s*["'](script|iframe)`, `<script` and `srcdoc`;
  - any `import\s*\(`.

**`test/playground-safety.test.ts`**:

1. **The scanner bites.** Each forbidden form, written in a sample string, is flagged by the right function. Comments that mention `eval(` are not flagged, and `import("mermaid")` is not flagged by `siteViolations`.
2. Every `.ts`/`.tsx` file under `apps/docs/src` gives `siteViolations === []`. Use `new Bun.Glob("**/*.{ts,tsx}").scanSync({ cwd })` and skip `routeTree.gen.ts`.
3. Every file under `apps/docs/src/playground` gives `playgroundViolations === []`.
4. **Allow-lists**, so the exceptions stay exceptions:
   - `dangerouslySetInnerHTML` occurs only in `src/components/document-page.tsx`, which renders build-time content from `docs/`;
   - `innerHTML` occurs only in `src/components/mermaid-renderer.tsx`, which renders strict-mode SVG of repository content.

   Assert the exact list of files that contain each name.

**`test/guide-examples.test.ts`**:

- Read every `docs/guides/*.md`. With WP10's regex `/^```([^\n]*)\n([\s\S]*?)^```$/gm`, collect each block whose info string contains `example=<name>`.
- Assert `JSON.parse(text)` `toEqual`s the matching example: `valid`, `invalid` and `relations` from `examples`, and `history.a` / `history.b` from `examples.history`.
- Assert that all five names occur at least once across the guides.
- An unknown name fails with the file and the name.

If a guide block differs from the example, **do not edit the guide or the example**. Report the difference.

**Build check**: `bun run --cwd apps/docs build`. Then:

- `dist/client/playground/index.html` and `dist/client/playground/{a,b,c}/index.html` exist;
- each scenario page contains `data-slot="no-js"` and `data-slot="example-input"`;
- `dist/client/playground/d/index.html` does not exist yet;
- the prerender line reports the documents plus 7.

Then run `git diff --exit-code apps/docs/src/routeTree.gen.ts` after a second `build:site`, and `bun run verify`.

## Definition of Done

- [ ] All files in `owned_files` exist, with GRACE markup and TSDoc on every export.
- [ ] Run-state, playground-run, render, safety and guide-example tests pass, and they were seen failing first.
- [ ] `/playground` and A–C are prerendered with the no-JavaScript fallback.
- [ ] The sanctioned shared edits are exactly as described and named in the commit body.
- [ ] `bun run verify` and the full docs build pass.

## Risks

- **Recomputing on keystrokes.** It is tempting to validate as the reader types. The contract forbids it: results must be explicit runs with provenance.
- **Re-implementing rules in the UI.** The relation table must read problems from the report, not recompute cycles. Test 6 ties the playground to the package.
- **Hydration mismatch.** Anything time-based or random in the first render, such as `new Date()` outside a click handler, breaks hydration. Provenance is created only when a run completes.
- **Scanner too weak or too strong.** Test 1 proves it catches each form. Test 4 proves the two known exceptions stay where they are.

## Reviewer Guidance

- Grep `src/playground` for `innerHTML`, `eval`, `Function(` and `import(` yourself. There must be no hit.
- Check that every result goes through `ResultPanel`. Search for `data-result=` outside `result-panel.tsx`; there must be none.
- Build, then open `dist/client/playground/b/index.html` as raw HTML and confirm the fallback content.
- Run `bun test apps/docs`, the build check and `bun run verify`.

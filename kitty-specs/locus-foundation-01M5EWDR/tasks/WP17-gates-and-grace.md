---
work_package_id: WP17
title: Gate wiring and GRACE registration
dependencies:
- WP16
requirement_refs:
- C-007
- FR-025
- NFR-006
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T093
- T094
- T095
- T096
- T097
phase: Phase 6 - Browser tests, gates, governance
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: .grace/
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- package.json
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .grace/graph/index.xml
- .grace/graph/main.xml
- .grace/verification/index.xml
- .grace/verification/main.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP17 – Gate wiring and GRACE registration

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and follow its guidance before you read the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest general implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. Address all of it before you treat the work as complete.

---

## Objectives & Success Criteria

Make the new checks blocking, and record the new architecture in GRACE (FR-025, NFR-006, C-007).

Done means:

1. Root `package.json` has `docs:build`, `docs:preview` and `test:e2e`. `bun run verify` runs, in order:
   - `check:bun`, `format:check`, `lint`, `typecheck`, `test`;
   - **`docs:build`** and **`test:e2e`**;
   - `grace:lint`.

   This is the owner decision of 2026-10-21. The pre-commit hook does **not** change.
2. `scripts/review-gate.ts` runs the same steps in the same order, each as its own JUnit test case: `verify.docs:build` and `verify.test:e2e`. A test proves that the gate's step list and the `verify` script cannot drift apart. No existing review-gate test is removed or weakened.
3. `.grace/` registers the ten modules and ten `V-M-*` entries in the plan's table, with every path and test file real.
4. `grace lint --path . --assertions current` reports **0 errors and 0 warnings**, and every exported symbol of the two packages has TSDoc and a `START_CONTRACT` (NFR-006). A scan, run here and quoted in the report, proves it.
5. The full gate passes: `bun scripts/review-gate.ts <tmp>/junit.xml` exits 0, and its report contains a passing case for every step.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/plan.md`: **GRACE modules to add** and **Owner approvals** item 4
- `kitty-specs/locus-foundation-01M5EWDR/tasks.md`: the **Deviation from plan.md, IC-11** note. This WP registers all ten modules at once.
- `scripts/review-gate.ts` and `scripts/review-gate.test.ts` (mission 001)
- `.grace/graph/*.xml` and `.grace/verification/*.xml`: copy their exact shape.
- `.githooks/pre-commit`: read it, but **do not change it**.

### Facts verified in planning (2026-10-21, grace v4.2.1)

- **Module format**: `<M-NAME>` with `<Summary>`, one or more `<Path>` elements, and one empty child element per dependency, for example `<M-BUN-VERSION-GUARD />`. The module must also be listed under `<Owns>` in `graph/index.xml`.
- **Verification format**: `<V-M-NAME>` with `<TestFiles><File>…</File></TestFiles>`, one or more `<Command>`, one or more `<Scenario>`, and `<TraceAssertion>`. It must be listed under `<Owns>` in `verification/index.xml`.
- **What lint checks**:
  - index ↔ document consistency, a `V-M-*` for every `M-*`, and that every `<File>` exists;
  - file markup and module maps, including `.tsx`.
- **What lint does not check**: that a `<Path>` exists, that a dependency child names a real module, or that a file's `LINKS` names a registered module. T096 checks these with a scan.
- Multiple `<Path>` and multiple `<Command>` elements per entry pass lint.

## Rules

- Work only inside the worktree that `spec-kitty agent action implement WP17 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`.
- If lint finds a markup error in a file another WP wrote, **do not fix it here**. Report it with the file, line and message, and stop before moving to review. The coordinator sends it back to the owning WP.
- Do not add dependencies. Do not change `.githooks/`, `bunfig.toml`, `apps/docs/package.json`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- No fake tests, and do not weaken existing ones.
- Style: double quotes, semicolons, trailing commas. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push.
- Commit messages follow Conventional Commits, for example `ci(gate): run docs build and browser tests in verify and the review gate`, and `chore(grace): register locus and docs modules`. No AI names and no `Co-Authored-By` line. Two commits are fine.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP17 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T093 – Root scripts

Add to root `package.json` `scripts`, keeping every existing script byte-for-byte:

```json
"docs:build": "bun run --cwd apps/docs build",
"docs:preview": "bun run --cwd apps/docs preview",
"test:e2e": "bun run --cwd apps/docs test:e2e",
```

Change `verify` to:

```json
"verify": "bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run docs:build && bun run test:e2e && bun run grace:lint"
```

`docs:build` comes before `test:e2e`, because the browser tests read `dist/client`. Both come before `grace:lint`, so the cheap source checks fail first.

### Subtask T094 – Review gate steps and tests

**Refactor without changing behaviour.** Move the step list in `scripts/review-gate.ts` into an exported constant:

```ts
export type CheckStep = { readonly name: string; readonly command: ReadonlyArray<string> };
/** The check steps, in verify order. The test step's reporter flags are added at run time. */
export const CHECK_STEPS: ReadonlyArray<CheckStep> = [
  { name: "check:bun", command: ["bun", "run", "check:bun"] },
  { name: "format:check", command: ["bun", "run", "format:check"] },
  { name: "lint", command: ["bun", "run", "lint"] },
  { name: "typecheck", command: ["bun", "run", "typecheck"] },
  { name: "test", command: ["bun", "test", "--pass-with-no-tests"] },
  { name: "docs:build", command: ["bun", "run", "docs:build"] },
  { name: "test:e2e", command: ["bun", "run", "test:e2e"] },
  { name: "grace:lint", command: ["bun", "run", "grace:lint"] },
];
/** Names of the steps the verify script runs, in order, parsed from "bun run a && bun run b". */
export function verifyStepNames(verifyScript: string): string[];
```

- The main block maps `CHECK_STEPS` to `runStep`. For `test`, append `--reporter=junit` and `--reporter-outfile=<path>`, exactly as today.
- Keep the install step, report writing and exit codes unchanged.
- Update the `START_MODULE_MAP` and add `START_CONTRACT` blocks for the new exports.
- `verifyStepNames` splits on `&&`, trims, and maps `bun run <name>` to `<name>`. `test` and the gate's `bun test …` are the same step. It throws on any other form, so a future edit cannot slip through unparsed.

**Tests first** (extend `scripts/review-gate.test.ts`; keep every existing test):

1. `verifyStepNames(rootPackageJson.scripts.verify)` equals `CHECK_STEPS.map((s) => s.name)`. Read the root `package.json` with `import pkg from "../package.json"`. **This is the no-drift test.**
2. `CHECK_STEPS` contains `docs:build` before `test:e2e`, and both after `test` and before `grace:lint`.
3. `verifyStepNames("bun run a && bun run b")` is `["a", "b"]`. `verifyStepNames("bun run a; rm -rf x")` throws.
4. `buildReport` with steps named `docs:build` and `test:e2e`, one failing, gives `classname="verify" name="docs:build"` and a failure on the right case. This uses the existing builder; no change to it.

Update the module's `V-M-REVIEW-GATE` scenarios in `.grace/verification/main.xml` (T096) to mention the step list and the no-drift test.

### Subtask T095 – GRACE graph: ten modules

Add to `.grace/graph/main.xml`, inside `<GD-MAIN>` after the existing modules, and list each one in `graph/index.xml` `<Owns>`:

| Module | Summary | Paths | Dependencies |
| --- | --- | --- | --- |
| `M-LOCUS-MODEL` | The Locus, Charter, Relation and Fabric model with Identity checks and deep freezing. | `packages/locus/src/identity.ts`, `charter.ts`, `relation.ts`, `freeze.ts`, `locus.ts`, `fabric.ts`, `index.ts` (the package entry) | — |
| `M-LOCUS-VALIDATION` | Validates a Fabric into an ordered list of diagnostics with stable codes. | `diagnostic.ts`, `validate.ts` | `M-LOCUS-MODEL` |
| `M-LOCUS-REVISION` | Canonical form, content-addressed Revisions and ordered change sets between two Revisions. | `errors.ts`, `canonical.ts`, `revision.ts`, `diff.ts` | `M-LOCUS-MODEL` |
| `M-LOCUS-HISTORY` | The RevisionHistory service with compare-and-set append and an in-memory layer. | `history.ts` | `M-LOCUS-REVISION` |
| `M-LOCUS-DECODE` | Decodes unknown or JSON text input into Fabric and Locus definitions with path-located issues. | `decode.ts` | `M-LOCUS-MODEL` |
| `M-LOCUS-SPECS` | The executable specification catalogue, its runner, the playground examples and Revision goldens. | `packages/locus-specs/src/model.ts`, `canonical-json.ts`, `runner.ts`, `catalogue.ts`, `examples.ts`, `goldens.ts`, `index.ts` | all five `M-LOCUS-*` |
| `M-DOCS-CONTENT` | Compiles docs/ into the site's content, search index, llms.txt and index.json, failing on any content problem. | `apps/docs/scripts/content.ts`, `src/lib/content-types.ts`, `src/lib/search-options.ts` | — |
| `M-DOCS-SPEC-REPORT` | Runs the specifications at build time and writes the spec report and build info with provenance. | `apps/docs/scripts/spec-report.ts` | `M-LOCUS-SPECS` |
| `M-DOCS-SITE` | The prerendered TanStack Start site: layout, navigation, document pages, theme, search, diagrams, verification page and the static server. | `apps/docs/vite.config.ts`, `src/routes/`, `src/components/`, `src/lib/`, `scripts/serve-static.ts` | `M-DOCS-CONTENT`, `M-DOCS-SPEC-REPORT` |
| `M-DOCS-PLAYGROUND` | Scenarios A–E that run the real packages in the browser on decoded input, with provenance and historical marking. | `apps/docs/src/playground/` | `M-LOCUS-VALIDATION`, `M-LOCUS-REVISION`, `M-LOCUS-HISTORY`, `M-LOCUS-DECODE`, `M-LOCUS-SPECS`, `M-DOCS-SITE` |

Paths without a directory prefix in the table belong to the row's package directory (`packages/locus/src/` for the first five, `apps/docs/` for the docs modules). Write every `<Path>` repository-relative and in full. Directory paths end in `/`. `M-DOCS-SITE` lists directories, because its files are many and owned by four WPs; `src/lib/` there excludes the M-DOCS-CONTENT files only by convention, which is acceptable for GRACE.

### Subtask T096 – GRACE verification entries

Add one `V-M-*` per module to `.grace/verification/main.xml` and list it in `verification/index.xml`. `TestFiles` must list **every** test file that exists for the module. Find them with `git ls-files`, not from memory:

| Entry | Test files | Commands |
| --- | --- | --- |
| `V-M-LOCUS-MODEL` | `packages/locus/test/{identity,locus,fabric,manifest}.test.ts` | `bun test packages/locus/test/identity.test.ts packages/locus/test/locus.test.ts packages/locus/test/fabric.test.ts` |
| `V-M-LOCUS-VALIDATION` | `packages/locus/test/{diagnostic,validate,validate-determinism,validate-performance}.test.ts` | `bun test packages/locus/test/validate` and the diagnostic test |
| `V-M-LOCUS-REVISION` | `packages/locus/test/{errors,canonical,revision,diff}.test.ts` | one `bun test` naming them |
| `V-M-LOCUS-HISTORY` | `packages/locus/test/history.test.ts` | `bun test packages/locus/test/history.test.ts` |
| `V-M-LOCUS-DECODE` | `packages/locus/test/{decode,public-surface}.test.ts` | one `bun test` naming them |
| `V-M-LOCUS-SPECS` | every `packages/locus-specs/test/*.test.ts` | `bun test packages/locus-specs` |
| `V-M-DOCS-CONTENT` | `apps/docs/test/content.test.ts`, `apps/docs/test/guides.test.ts` | one `bun test` naming them; `bun run --cwd apps/docs content` |
| `V-M-DOCS-SPEC-REPORT` | `apps/docs/test/spec-report.test.ts` | its `bun test`; `bun run --cwd apps/docs spec-report` |
| `V-M-DOCS-SITE` | `apps/docs/test/{manifest,site,theme,search,shortcuts,provenance,serve-static}.test.ts`, `{components,widgets,verification}.test.tsx`, and `apps/docs/e2e/{navigation,search,theme,machine-files,a11y}.e2e.ts` | one `bun test` for the unit files; `bun run docs:build`; `bun run test:e2e` |
| `V-M-DOCS-PLAYGROUND` | `apps/docs/test/{run-state,playground-run,playground-safety,guide-examples,playground-revisions,playground-specs}.test.ts`, `{playground-render,playground-render-de}.test.tsx`, and `apps/docs/e2e/{playground,keyboard,equality,provenance}.e2e.ts` | one `bun test` for the unit files; `bun run test:e2e` |

`Scenario` elements state behaviour in plain sentences, two to six per entry, taken from the specification and the WP acceptance criteria. For example, for `V-M-LOCUS-HISTORY`: "Appending with an expected head that is not the current head fails with StaleBaselineError, whatever the Revision." and "Appending the current head again is a no-op." `TraceAssertion` names the tests that prove them. For `V-M-LOCUS-SPECS`, name the 44 catalogue records LOC-001 to LOC-044, the runner meta-tests and the Bun golden ids. For `V-M-DOCS-PLAYGROUND`, name the C-002 source scan and the Chromium equality suite.

**Consistency scan.** Lint does not do this, so run it here and quote its output in your report. Do not commit it.

```bash
bun -e '
const g = await Bun.file(".grace/graph/main.xml").text();
const v = await Bun.file(".grace/verification/main.xml").text();
const fs = require("node:fs");
const paths = [...g.matchAll(/<Path>([^<]+)<\/Path>/g)].map((m) => m[1]);
const files = [...v.matchAll(/<File>([^<]+)<\/File>/g)].map((m) => m[1]);
const modules = new Set([...g.matchAll(/^\s{4}<(M-[A-Z0-9-]+)>/gm)].map((m) => m[1]));
const deps = [...g.matchAll(/^\s{6}<(M-[A-Z0-9-]+) \/>/gm)].map((m) => m[1]);
const missing = [...paths, ...files].filter((p) => !fs.existsSync(p));
const unknownDeps = deps.filter((d) => !modules.has(d));
const links = new Set();
for (const f of new Bun.Glob("{packages,apps/docs}/**/*.{ts,tsx}").scanSync(".")) {
  if (f.includes("node_modules") || f.includes("/dist/")) continue;
  const m = fs.readFileSync(f, "utf8").match(/LINKS: ([^\n]+)/);
  if (m) for (const l of m[1].split(",").map((s) => s.trim())) if (l.startsWith("M-")) links.add(l + " " + f);
}
const badLinks = [...links].filter((l) => !modules.has(l.split(" ")[0]));
console.log(JSON.stringify({ modules: modules.size, missing, unknownDeps, badLinks }, null, 2));
'
```

Expect `modules: 12` (the two existing modules plus ten), and empty `missing`, `unknownDeps` and `badLinks`.

**NFR-006 scan** (also quoted in the report, not committed). For each `.ts` file under `packages/locus/src` and `packages/locus-specs/src`, every name exported with `export function|const|class|type|interface` must be:

- preceded by a `/** … */` TSDoc comment, possibly above a `// END_CONTRACT` line;
- matched by a `START_CONTRACT: <name>` block.

Write the scan as a `bun -e` one-off in the same style and print every miss. The expected output is no misses. Re-exports in `index.ts` are exempt.

If either scan finds a problem in a file this WP does not own, report it and stop. Do not fix it here.

### Subtask T097 – Full verify and gate run

From the worktree root:

```bash
bun run verify
bun scripts/review-gate.ts "$TMPDIR/wp17-junit.xml"; echo "exit $?"
grep -c '<testcase classname="verify"' "$TMPDIR/wp17-junit.xml"   # 8 (9 if an install step ran)
grep -c '<failure' "$TMPDIR/wp17-junit.xml"                        # 0
grace lint --path . --assertions current                          # Errors: 0, Warnings: 0
grace status --path . --json
```

Report the duration of `verify`. The docs build must stay under 60 seconds (NFR-005); quote the time `docs:build` printed.

**Prove that the gate blocks.** In the worktree, break one browser expectation, for example a Revision id in `apps/docs/e2e/equality.e2e.ts`. Run the gate and see `FAIL verify.test:e2e` and exit 1. Then `git checkout -- apps/docs/e2e/equality.e2e.ts`. Report it; never commit the broken file.

## Definition of Done

- [ ] Root scripts and `verify` as specified, with the pre-commit hook unchanged.
- [ ] `CHECK_STEPS` and `verifyStepNames` exported and tested. The no-drift test passes, and every earlier review-gate test still passes.
- [ ] Ten modules and ten verification entries are registered. Lint reports 0 errors and 0 warnings, and both scans are clean and quoted.
- [ ] `bun run verify` and the review gate pass, and the blocking demonstration is reported.

## Risks

- **Gate drift.** Without the no-drift test, someone adds a step to `verify` and not to the gate, or the reverse. The test is the point of T094.
- **Fixing other WPs' markup here.** That hides which WP was wrong and breaks ownership. Report it.
- **Slow gate.** The gate now builds and runs a browser. That is the owner's choice; do not cut suites to save time.

## Reviewer Guidance

- Diff `package.json`: only the three new scripts and the `verify` line changed.
- Diff `review-gate.ts`: behaviour unchanged except for the two new steps. Run `bun test scripts`.
- Re-run both scans and `grace lint` yourself.
- Run the gate on the branch and check the JUnit report.

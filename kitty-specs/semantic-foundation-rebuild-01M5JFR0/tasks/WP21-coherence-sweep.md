---
work_package_id: WP21
title: Final coherence sweep
dependencies:
- WP20
- WP17
requirement_refs:
- FR-029
- FR-030
- NFR-006
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: f99d1ce917ff5bcfeb6f1a271858fc32ec533fa4
created_at: '2026-10-24T21:01:53.302583+00:00'
subtasks:
- T126
- T127
- T128
- T129
phase: Phase 8 – Coherence
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: curator-carla
authoritative_surface: README.md
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- README.md
- docs/tooling.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP21 – Final coherence sweep

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `curator-carla`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Objective

This is the last work package of the mission. It leaves the repository coherent:

- No file names a removed package, a removed public name or a removed concept as if it still existed. Allowed places are listed below. This is SC-006 and FR-029.
- `docs/tooling.md` and `README.md` describe the workspace that exists now.
- The terminology documents state `maturity: implemented` where the code exists.
- Documentation, GRACE (FR-030) and the repository model `telos.ts` agree with each other.
- `bun run verify`, `bun run grace:lint` and `bun run telos check` pass (NFR-006).

State when you start:

- WP01 to WP20 are merged. `packages/locus` is deleted.
- The kernel, the Packs `@telos/cli`, `@telos/agent` and `@telos/web`, the calculator, `telos.ts`, `scripts/telos.ts` and the rebuilt documentation site exist.
- WP16 wrote the terminology documents with `maturity: proposed` for every term, because the code was not on its branch. You raise them.

## Context

Success criterion SC-006 (spec, quoted): "The removed package and its public names appear in no file outside superseded ADRs, research history and earlier mission records."

### Allowed places (never edit them in this WP)

- `docs/research/**` (research history)
- `kitty-specs/**` (mission records)
- the superseded ADRs: `docs/decisions/ADR-0002-*`, `ADR-0005-*`, `ADR-0006-*`, `ADR-0007-*`, `ADR-0008-*`, `ADR-0009-*`, `ADR-0010-*`, `ADR-0013-*`, `ADR-0014-*`
- owner-only files: `AGENTS.md`, `CLAUDE.md`, `.kittify/**`, the charter. If one of them names a removed concept, do not edit it: list the file and the line in your final message.

### Removed names

**Group 1: package and public API names.** No hits are allowed outside the allowed places.

`@telos/locus`, `packages/locus`, `defineFabric`, `defineLocus`, `validateFabric`, `RevisionHistory`, `RevisionHistoryInMemory`, `createRevision`, `diffRevisions`, `decodeFabric`, `decodeFabricJson`, `canonicalForm`, `RELATION_KINDS`, `spec-report`, `LOC-0` followed by two digits (the old executable specification ids), `M-LOCUS-`.

**Group 2: removed concepts.** These are capitalized whole words: `Fabric`, `Facet`, `Charter`, `Lens`, `Lenses`, `Law`, `Laws`, `Mandate`, `Witness`, `Verdict`, `Variant`, `Revision`, and the phrase `Stage 0`.

A hit may stay only if it is one of these:

- (a) `docs/foundation/future-semantic-evolution.md`, which describes Mandate, Variant, Witness, Verdict, Evolution and Revision as future concepts.
- (b) A sentence that states what the new model replaces or supersedes. Examples: "Replaces the mandatory Charter" in ADR-0019, or the old id table in a term document.
- (c) A sentence about history, in the past tense. Example: "The Stage 0 directive called the work …".

Every other hit describes the current model with an old word, and you fix it with the current term from the terminology documents:

| Old word | Current term |
| --- | --- |
| Fabric | semantic model |
| Facet | semantic extension |
| Lens, Law | Archetype, rule |
| Act | capability |
| Charter | the `telos.purpose` extension (Purpose) |
| Revision | digest, model comparison |

The front matter key `stage0` of term documents is part of the unchanged schema. It is not a hit.

### Terminology maturity

In `docs/foundation/terminology/`, set `maturity: implemented` in these files, each because the named code exists:

| File | Implemented by |
| --- | --- |
| `locus.md`, `locus-kind.md`, `composition.md` | `packages/kernel/src/locus.ts` |
| `identity.md` | `packages/kernel/src/identity.ts` |
| `semantic-extension.md` | `packages/kernel/src/extension.ts` |
| `containment.md`, `semantic-model.md` | `packages/kernel/src/model.ts` |
| `relation.md`, `relation-type.md` | `packages/kernel/src/relation.ts` |
| `capability.md` | `packages/kernel/src/capability.ts` |
| `contract.md` | `packages/kernel/src/describe.ts` (`contractDigest`) |
| `rule.md`, `archetype.md` | `packages/kernel/src/archetype.ts` |
| `diagnostic.md` | `packages/kernel/src/diagnostic.ts` |
| `finding.md`, `knowledge-status.md` | `packages/kernel/src/verify.ts`, `packages/kernel/src/describe.ts` |
| `semantic-closure.md` | `packages/kernel/src/closure.ts` |
| `pack.md`, `interface-locus.md` | `packages/cli`, `packages/agent`, `packages/web` |
| `impact.md` | `packages/kernel/src/impact.ts` |
| `grant.md` | `packages/kernel/src/invoke.ts` (`isGranted`) |
| `purpose.md` | `packages/kernel/src/extensions/purpose.ts` |
| `executable-introspection.md` | `packages/kernel/src/introspection.ts`, `packages/agent/src/introspection-tools.ts` |

Before you change a file, confirm that the code file exists (`test -e <path>`). If it does not, leave that term at `proposed` and report it.

`semantic-first-programming.md` and `agent-native-development.md` describe approaches. They stay `proposed`. Change only the `maturity` line in these files. `knowledge-status.md` keeps its sentence that `observed` and `invalidated` are reserved.

Then update the terminology README, `docs/foundation/terminology/README.md`. If it has a Maturity column, set each row to the term's new value. Never write `verified` or `passing` in that column.

### ADR-0015 (an accepted record, not superseded)

`docs/decisions/ADR-0015-product-naming.md` names the removed package in its Decision section. Make exactly these two edits and nothing else:

- `` Workspace packages use the `@telos/` scope (`@telos/locus`, `@telos/docs`). `` becomes `` Workspace packages use the `@telos/` scope (for example `@telos/kernel`, `@telos/docs`). ``
- `"Telos" is Greek for purpose or end, matching the role of the Charter. This is a note, not a constraint.` becomes ``"Telos" is Greek for purpose or end, matching the `telos.purpose` extension. This is a note, not a constraint.``

### `docs/tooling.md` (you own it)

Change only the parts that describe the workspace and the checks. Keep everything about Spec Kitty, GRACE setup, the global footprint and upgrading unchanged.

- **`### Layout`**: replace the three `packages/locus` bullets with one bullet per workspace package. For each bullet, read the package's `package.json` `name` and its `src/index.ts` header first.
  - `packages/kernel`: `@telos/kernel`, the semantic kernel. It runs in Bun and the browser. The sub-path `@telos/kernel/closure` is Bun only.
  - `packages/cli`: `@telos/cli`, the CLI Pack.
  - `packages/agent`: `@telos/agent`, the Agent Pack (agent tools, the MCP server and client, the introspection tools).
  - `packages/web`: `@telos/web`, the Web Pack (forms derived from capability contracts).
  - `apps/calculator`: `@telos/calculator`, the reference implementation.
  - `telos.ts`: the repository's own Telos model.
  - `scripts/telos.ts`: the `bun run telos` command.

  Update the `scripts/` bullet so that it names every file in `scripts/` that is not a test (`ls scripts`).
- **`### Commands`** table:
  - The `bun run verify` row lists the real order of the `verify` script in `package.json`, ending with the Telos check.
  - Add rows for `bun run telos <command>` (`list`, `inspect`, `verify`, `closure`, `impact`, `check`, `report`), `bun run telos:check`, `bun run calculator <capability> --a <n> --b <n>`, `bun run calculator:mcp` and `bun run calculator:agent-demo`.
  - Each "What it does" cell is one sentence, taken from the script or its `--help` output.
- **`### Review gate`**: read `scripts/review-gate.ts` and name the Telos check the way the gate reports it.
- **"After a mission merge" and "Accept runs strictly"**: keep them. If `project.path_conventions` now covers more than `packages/` (read `.kittify/config.yaml`; do not edit it), describe what it says.

Run `bun run format` afterwards. The table is formatted by `bun fmt`.

### `README.md` (you own it; it is empty today)

Write a short README:

```markdown
# Telos

Telos by UnknownLab is a semantic-first, agent-native TypeScript framework. Software is described as Loci composed from semantic extensions, verified by Archetypes and exposed to people and agents through Packs.

## Start here

- [Foundation](docs/foundation/README.md): what Telos is, its principles and terms.
- [Your first Locus](docs/guides/first-locus.md): the kernel API step by step.
- [Examples](docs/guides/examples.md): the calculator reference implementation.
- [Development tooling](docs/tooling.md): setup, commands and checks.

## Workspace

<one bullet per workspace package and app, the same list as the Layout section of docs/tooling.md, without the sub-bullets>

## Commands

<an sh block with: bun install, bun run verify, bun run telos list, bun run calculator add --a 2 --b 3, bun run docs:build>
```

Every link must resolve. Check with `test -e` for each target.

### Further sweep items (added 2026-10-24)

The planner found these items while it checked WP20 on a scratch copy, and applied and checked each one there:

- `typecheck` passed.
- The agent, web and CLI Pack tests passed.
- The calculator tests passed (70).
- The new component test passed (2).
- `grace lint` reported 0 errors.

Do every item exactly as written. Items S1 to S8 belong to T127, and item S9 belongs to T128. Every file named here is a sanctioned edit. Where an item says "replace", the old text and the new text are given in `text` blocks. Copy them character for character.

**S1 – The playground llms line names the kernel package.** The source of truth is `PLAYGROUND_INTRO` in `apps/docs/src/playground/registry.ts`: "Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser." Three files still say `the real /kernel decodes`. In each file, replace `the real /kernel decodes` with `the real @telos/kernel decodes`, and change nothing else:

- `apps/docs/scripts/content.ts` (the Playground block of `llmsText`)
- `apps/docs/test/content.test.ts` (the Playground line of `EXPECTED_LLMS`)
- `apps/docs/e2e/machine-files.e2e.ts` (the Playground line of `APP_PAGE_LINES`)

Afterwards, `git grep -n "real /kernel" -- apps docs` prints nothing.

**S2 – ADR-0023 lists the real knowledge statuses.** The values are the type `Knowledge` in `packages/kernel/src/describe.ts`. The closure check in `packages/kernel/src/closure.ts` produces `unknown` (`closure.unparsable`). In `docs/decisions/ADR-0023-archetypes-and-knowledge-status.md` (decision point 4), replace

```text
The statuses are `declared`, `derived`, `verified`, `failed` and `not run`.
```

with

```text
The statuses are `declared`, `derived`, `verified`, `failed`, `not-run` and `unknown`; Semantic Closure gives `unknown` for a file it cannot parse.
```

Leave the rest of the ADR unchanged.

**S3 – `packages/kernel/src/status.ts` does not exist.** The statuses are the type `Knowledge` in `packages/kernel/src/describe.ts`. Make exactly these replacements.

1. `docs/foundation/terminology/knowledge-status.md`: replace

   ```text
   The statuses are defined in `packages/kernel/src/status.ts`.
   ```

   with

   ```text
   The statuses are the values of the type `Knowledge` in `packages/kernel/src/describe.ts`.
   ```

2. `docs/foundation/principles/P13-no-unverified-guarantees.md`: replace

   ```text
   - The status vocabulary is defined in `packages/kernel/src/status.ts` and every finding carries one.
   ```

   with

   ```text
   - The status vocabulary is the type `Knowledge` in `packages/kernel/src/describe.ts`, and every finding carries one.
   ```

3. `docs/foundation/architecture/capabilities.md`, in the "In this mission" bullet that names `verify`, replace

   ```text
   knowledge statuses from `packages/kernel/src/status.ts`.
   ```

   with

   ```text
   knowledge statuses of the type `Knowledge` in `packages/kernel/src/describe.ts`.
   ```

   Then delete the last sentence of the same bullet. The executable specifications were removed with `packages/locus`. The sentence to delete, with the space before it:

   ```text
    Temporary executable specifications run with `bun test` ([ADR-0013](../../decisions/ADR-0013-temporary-executable-specifications.md)).
   ```

Afterwards, `git grep -n "kernel/src/status.ts" -- . ':!kitty-specs' ':!docs/research'` prints nothing.

**S4 – P14 names the check that exists.** First confirm the claim: `bun run telos inspect telos:kernel` prints `"packages":["effect"]`. If it prints more, write the real list in the new bullet and report it. Then, in `docs/foundation/principles/P14-no-ai-in-the-kernel.md`, section "In practice", replace

```text
- No file in `packages/kernel/src` imports a model provider SDK. A check in the repository gate rejects such an import.
```

with

```text
- No file in `packages/kernel/src` imports a model provider SDK. The Semantic Closure check of `bun run telos check` (the last step of `bun run verify`) rejects every package import in `packages/kernel` that `telos:kernel` does not declare in `telos.ts`, and `telos:kernel` declares only `effect`.
```

**S5 – One extension id per Pack.** Each Pack exports its extension id as a constant:

- `AGENT_EXTENSION_ID` in `packages/agent/src/tools.ts`
- `WEB_EXTENSION_ID` in `packages/web/src/form.ts`
- `CLI_EXTENSION_ID` in `packages/cli/src/derive.ts`

The CLI Pack already uses its constant. The agent and web Packs repeat the string. Make exactly these edits. Behavior does not change, because each constant equals the string it replaces.

- `packages/agent/src/semantics.ts`:
  - `import { AGENT_TOOL_TYPE } from "./tools";` becomes `import { AGENT_EXTENSION_ID, AGENT_TOOL_TYPE } from "./tools";`
  - `export const AgentSemantics = Extension.make("telos.agent", {` becomes `export const AgentSemantics = Extension.make(AGENT_EXTENSION_ID, {`
- `packages/web/src/semantics.ts`:
  - `import { WEB_FORM_TYPE } from "./form";` becomes `import { WEB_EXTENSION_ID, WEB_FORM_TYPE } from "./form";`
  - `export const WebSemantics = Extension.make("telos.web", {` becomes `export const WebSemantics = Extension.make(WEB_EXTENSION_ID, {`
- `packages/web/src/archetype.ts`:
  - `import { exposedRelations, firstExposed, formModel } from "./form";` becomes

    ```ts
    import {
      WEB_EXTENSION_ID,
      exposedRelations,
      firstExposed,
      formModel,
    } from "./form";
    ```

  - `appliesTo: ["telos.web"],` becomes `appliesTo: [WEB_EXTENSION_ID],`

Do not change the tests. They compare with the literal strings on purpose.

Then:

- `bun run typecheck` passes.
- `bun test packages/agent/test packages/web/test packages/cli/test` reports 0 fail.
- `git grep -n -E 'make\("telos\.(agent|web|cli)"|appliesTo: \["telos\.' -- packages/agent/src packages/web/src packages/cli/src` prints nothing.

**S6 – The keyboard test reaches every playground control.** The playground now has a `<select>`, the example picker. In `apps/docs/e2e/keyboard.e2e.ts`, replace the module map line

```text
//   PLAYGROUND_CONTROLS - the selector of every button, textarea and input inside a playground
```

with

```text
//   PLAYGROUND_CONTROLS - the selector of every button, textarea, input and select inside a playground
```

and replace the selector string

```text
'[data-slot="playground"] button, [data-slot="playground"] textarea, [data-slot="playground"] input'
```

with

```text
'[data-slot="playground"] button, [data-slot="playground"] textarea, [data-slot="playground"] input, [data-slot="playground"] select'
```

**S7 – A component test for the stale-result label.** So far only the browser test checks that a playground result becomes historical when the text changes. Create `apps/docs/test/playground-results.test.tsx` with exactly this content:

```tsx
// START_MODULE_CONTRACT
//   PURPOSE: Prove that a playground result names its origin and is labelled historical as soon as the editor text differs from the text that was run (FR-021).
//   SCOPE: The static markup of PlaygroundResults for one real run of the minimal example, with the same and with a changed editor text. Bun only; no browser.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MINIMAL - the JSON text of the minimal playground example
//   RUN - one real run of MINIMAL
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaygroundResults } from "@/playground/components/playground-results";
import { PLAYGROUND_EXAMPLES } from "@/playground/examples";
import { runDefinition } from "@/playground/run";

const MINIMAL =
  PLAYGROUND_EXAMPLES.find((example) => example.name === "minimal")?.json ?? "";
const RUN = {
  text: MINIMAL,
  result: await Effect.runPromise(runDefinition(MINIMAL)),
  ranAt: "2026-01-01T00:00:00.000Z",
};

describe("playground results: the stale-result label", () => {
  test("a result for the current text is from the browser and not historical", () => {
    const html = renderToStaticMarkup(
      <PlaygroundResults run={RUN} currentText={MINIMAL} />,
    );
    expect(html).toContain('data-provenance="browser"');
    expect(html).toContain("Run in this browser at ");
    expect(html).not.toContain("Historical:");
  });

  test("a result for a changed text is labelled historical", () => {
    const html = renderToStaticMarkup(
      <PlaygroundResults run={RUN} currentText={`${MINIMAL} `} />,
    );
    expect(html).toContain('data-provenance="historical"');
    expect(html).toContain("Historical: run in this browser at ");
    expect(html).toContain("The input has changed since this run.");
  });
});
```

Then edit the entry `<V-M-DOCS-PLAYGROUND>` in `.grace/verification/docs.xml`:

- Add `        <File>apps/docs/test/playground-results.test.tsx</File>` directly after `        <File>apps/docs/test/playground-safety.test.ts</File>`.
- Change `<Command>bun test apps/docs/test/playground-run.test.ts apps/docs/test/playground-safety.test.ts</Command>` to `<Command>bun test apps/docs/test/playground-run.test.ts apps/docs/test/playground-safety.test.ts apps/docs/test/playground-results.test.tsx</Command>`.

Run `bun test apps/docs/test/playground-results.test.tsx` (expected: 2 pass) and `bun run grace:lint` (expected: 0 errors). The test is a new file outside `owned_files`, so commit it yourself (see "Commit before move-task" below).

**S8 – Lint hygiene.** At planning time `bun run lint` reported 33 warnings. Two of them are `no-unused-vars` warnings on unused imports in the calculator tests. Delete only these two lines; each warning points at its line:

- `apps/calculator/test/app.test.ts`: the line `  divide,` in the import from `../src/arithmetic` (line 34 at planning time).
- `apps/calculator/test/impact.test.ts`: the line `  add,` in the import from `../src/arithmetic` (line 34 at planning time).

The names still appear elsewhere in those files as strings, for example the command name "divide". That is expected; the lint warning is about the import only. Afterwards:

- `bun run typecheck` passes.
- `bun test apps/calculator/test` reports 0 fail.
- `bun run lint` reports 31 warnings.

Leave the `no-explicit-any` and `{}` type warnings in the kernel and agent sources and tests. They are type-level choices, not dead code. Report the warning count before and after.

These outputs are known and are not failures:

- the CLI help text that the `packages/cli` tests print
- the Vite config loader warning and the chunk size warning of `docs:build`

After `bun run verify`, `git status --short` must show only the changes you made on purpose.

**S9 – Checks only.** WP19 already fixed these. If a check finds a hit, fix it with the smallest edit and report it.

- `git grep -n -i -E "revision-id|data-revision" -- apps/docs` prints nothing: no `data-revision-id` selector and no `revision-id` result kind.
- In `apps/docs/src/components/result-panel.tsx`, `ResultKind` has no `"revision-id"` member.
- In `apps/docs/e2e/provenance.e2e.ts`, `ORIGINS` is exactly `"browser"`, `"bun-build"`, `"historical"` and `"none"`, with no `"ci"`. These are the origins the site produces:
  - `bun-build` comes from `apps/docs/src/lib/provenance.ts`.
  - `browser` and `historical` come from the playground results.
  - `none` marks an empty slot.

**Notes.**

- The line about the closure codes in `tasks.md` was corrected during planning. Never edit `kitty-specs/**`.
- WP20 did not touch `docs/tooling.md`. The `docs/tooling.md` section above covers its `bun run telos` and `telos:check` rows.

**Commit before move-task.** The `move-task` auto-commit refuses files outside `owned_files`. Before you run `move-task`, commit every sanctioned edit yourself, staging explicit paths. A suggested split:

- `docs(foundation): align knowledge statuses, P14 and ADR-0023 with the kernel` (S2, S3, S4)
- `refactor(packs): use the exported extension id constants` (S5)
- `test(docs): check the stale playground label and the select control` (S6, S7)
- `fix(docs): name @telos/kernel in the playground llms line` (S1)
- `chore(calculator): remove unused test imports` (S8)

Name every sanctioned file in the commit body.

## Rules for this work package

Read these rules before you write anything. They are part of the acceptance criteria.

1. **Baseline first.** Before you change a file, run `bun run verify` in your worktree and note the result of each step. If the baseline is not green, stop and report it; do not fix unrelated failures.
2. **Only your files.** Edit only the files in `owned_files` (frontmatter) and the sanctioned edits listed below. If you need any other change, stop and report it. Never edit `kitty-specs/**`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` or the charter.
3. **Content lives in `docs/`.** Site content is generated from `docs/` (C-006). Never edit prose inside `apps/docs`.
4. **Front matter.** Keep the front matter schema of each document kind exactly as the existing documents of that kind use it (`apps/docs/scripts/content.ts` validates it). Copy the shape from an existing file of the same kind before you write a new one.
5. **Forbidden claims.** The content build rejects the words `verified`, `passing` and `all tests pass` (case-insensitive) in front matter and in Status or Maturity table columns. Use them in body prose only when they describe a real rule result, and never as a status.
6. **Terms.** Use the terms of the spec's Domain Language table exactly; never use the words in its "Avoid" column for the new model. English only (C-009). No emojis.
7. **Links.** Every Markdown link and every `related` id must resolve. `bun run docs:build` fails on a broken one, so run it often.
8. **Shell.** The shell is fish. Use `echo '-----'` as a separator.
9. **Report exactly.** In your final message, list every check you ran and its exact result. Never claim a check passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Commands

| Purpose | Command |
| --- | --- |
| Full gate (run before handing a WP to review, and it must pass) | `bun run verify` |
| Fast loop while working | `bun run typecheck`, `bun test <paths>`, `bun run lint`, `bun run format` (writes), `bun run grace:lint` |
| One package's tests | `bun test packages/kernel/test` (example) |

`bun run verify` = `check:bun && format:check && lint && typecheck && test && docs:build && test:e2e && grace:lint`, plus `&& telos:check` from WP15 on. Report each step's result exactly. Never claim a step passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Git

- Spec Kitty creates your worktree and branch. Commit only inside it.
- Commit messages follow Conventional Commits 1.0.0: `feat(kernel): build the semantic model`, `docs(foundation): ...`, `test(cli): ...`.
- No AI names, and no author, co-author or session lines. The `.githooks/commit-msg` hook enforces this. Never use `--no-verify`.
- Never edit files that another WP owns (see each WP's "Owned files"). If a needed change falls outside your files, stop and report it.

**Sanctioned edits outside `owned_files`** (name each one in your commit body):

- Any other file that still names a removed concept, except `docs/research/**`, `kitty-specs/**`, superseded ADRs and `AGENTS.md`/`CLAUDE.md`/`.kittify/**` (owner-only). Name every such file in the commit body.
- `docs/foundation/terminology/*.md` (WP16): the `maturity` line only, raised to `implemented` per the table in this prompt; the Maturity column of the terminology README.
- `docs/decisions/ADR-0015-product-naming.md` (WP17): the two sentences quoted in this prompt, nothing else.
- `docs/foundation/README.md`, `docs/foundation/architecture/capabilities.md`, `docs/foundation/roadmap/README.md` (WP16): sentences that call an existing module planned or not yet built.
- The files of "Further sweep items" S1 to S9, and only the edits written there:
  - `apps/docs/scripts/content.ts`, `apps/docs/test/content.test.ts`, `apps/docs/e2e/machine-files.e2e.ts` (WP16, WP19): S1
  - `docs/decisions/ADR-0023-archetypes-and-knowledge-status.md` (WP17): S2
  - `docs/foundation/terminology/knowledge-status.md`, `docs/foundation/principles/P13-no-unverified-guarantees.md`, `docs/foundation/architecture/capabilities.md` (WP16): S3
  - `docs/foundation/principles/P14-no-ai-in-the-kernel.md` (WP16): S4
  - `packages/agent/src/semantics.ts`, `packages/web/src/semantics.ts`, `packages/web/src/archetype.ts` (WP11, WP12): S5
  - `apps/docs/e2e/keyboard.e2e.ts` (WP18): S6
  - the new `apps/docs/test/playground-results.test.tsx` and `.grace/verification/docs.xml` (WP18): S7
  - `apps/calculator/test/app.test.ts`, `apps/calculator/test/impact.test.ts` (WP14): S8
  - any file that an S9 check finds

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP21 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T126 – Stale-reference sweep

Run these commands from the repository root (fish shell) and keep their full output:

```sh
set allowed ':!kitty-specs' ':!docs/research' ':!AGENTS.md' ':!CLAUDE.md' ':!.kittify' ':!docs/decisions/ADR-0002-*' ':!docs/decisions/ADR-0005-*' ':!docs/decisions/ADR-0006-*' ':!docs/decisions/ADR-0007-*' ':!docs/decisions/ADR-0008-*' ':!docs/decisions/ADR-0009-*' ':!docs/decisions/ADR-0010-*' ':!docs/decisions/ADR-0013-*' ':!docs/decisions/ADR-0014-*'
echo '----- group 1'
git grep -n -E '@telos/locus|packages/locus|defineFabric|defineLocus|validateFabric|RevisionHistory|createRevision|diffRevisions|decodeFabric|canonicalForm|RELATION_KINDS|spec-report|LOC-0[0-9]{2}|M-LOCUS-' -- . $allowed
echo '----- group 2'
git grep -n -w -E 'Fabric|Facet|Charter|Lens|Lenses|Law|Laws|Mandate|Witness|Verdict|Variant|Revision' -- . $allowed
git grep -n 'Stage 0' -- . $allowed
echo '----- owner-only files'
git grep -n -w -E '@telos/locus|packages/locus|Fabric|Facet|Charter|Lens|Mandate' -- AGENTS.md CLAUDE.md .kittify
echo '----- removed files'
for p in packages/locus apps/docs/scripts/spec-report.ts apps/docs/src/components/spec-report-table.tsx apps/docs/src/playground/run-fabric.ts apps/docs/src/playground/run-revisions.ts apps/docs/src/playground/run-specs.ts apps/docs/src/routes/playground/\$scenario.tsx .grace/graph/legacy.xml .grace/verification/legacy.xml
  test -e $p; and echo "still present: $p"
end
```

Classify every group 2 hit as (a), (b), (c) or "fix". `bun.lock` must have no group 1 hit. If it does, run `bun install` and report it.

### T127 – Fix stale references

1. Fix every group 1 hit and every group 2 hit classified "fix". In the documentation, use the current terms. In code comments and GRACE XML, use the current module names.
2. Make the terminology maturity edits and the two ADR-0015 edits.
3. Rewrite the Layout, Commands and Review gate parts of `docs/tooling.md`, and write `README.md`.
4. Run `bun run --cwd apps/docs content` after the doc edits. It must report no problems.
5. Rerun the T126 commands:
   - Group 1 prints nothing.
   - The "removed files" loop prints nothing.
   - Every remaining group 2 hit is (a), (b) or (c).
6. Do the further sweep items S1 to S8 (section "Further sweep items" above), each with its own after-check.

### T128 – Cross-check documentation, GRACE and the model

Each shell call starts a new fish session, so define `allowed` again exactly as in T126 before a command that uses it. Run each check and fix what it finds. You may edit any file except the allowed places, the owner-only files and `kitty-specs/**`. Each fix must be the smallest correct one. If a fix would change code behavior, stop and report it.

1. **Paths named in the documentation exist.**

   ```sh
   for p in (git grep -h -o -E '`(packages|apps|scripts)/[A-Za-z0-9_./-]+`' -- docs README.md $allowed | tr -d '`' | sort -u)
     test -e $p; or echo "missing: $p"
   end
   ```

   Ignore entries that contain `*` or `<`.
2. **Every workspace package is modelled.**
   - `bun run telos list` names a Locus for each of `packages/kernel`, `packages/cli`, `packages/agent`, `packages/web`, `apps/calculator`, `apps/docs` and the tooling.
   - `bun run telos closure` reports no findings.
   - `bun run telos verify` reports no failed rule.
3. **GRACE matches the files.**
   - `bun run grace:lint` passes.
   - `grace status --path . --json` reports no error.
   - Every module path in `.grace/graph/*.xml` exists: `git grep -h -o -E '<Path>[^<]+</Path>' -- .grace/graph | sed -E 's#</?Path>##g' | sort -u`, then `test -e` for each entry without `*`.
4. **Implemented versus future.**
   - In `docs/foundation/README.md`, `docs/foundation/architecture/capabilities.md` and `docs/foundation/roadmap/README.md`, find every sentence that says a module is planned, not yet built or "on a later branch" when it exists now. Change it to the present tense.
   - Future concepts in `future-semantic-evolution.md` stay future.
5. **Checks only.** Run the S9 checks of "Further sweep items".

### T129 – Final gate and SC-006 evidence

Run, in order, and report each exact result:

1. `bun run format`
2. `bun run verify`
3. `bun run grace:lint`
4. `bun run telos check`
5. the T126 commands, once more

Put the group 1 output (expected: empty) and the list of remaining group 2 hits with their class in the commit body of your last commit and in your final message. List every file you changed outside `README.md` and `docs/tooling.md` in the commit body (sanctioned edits).

## Definition of Done

- [ ] Every subtask of this WP is done.
- [ ] Every document uses the existing front matter shape of its kind, and every link and `related` id resolves.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly).
- [ ] `bun run grace:lint` passes.
- [ ] Further sweep items S1 to S9 are done, and every sanctioned edit is committed before `move-task`.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope (for example `docs(foundation): ...`), with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP21 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Never edit research history, mission records, superseded ADRs or owner-only files, even when they name removed concepts.
- Do not rewrite documents beyond the stale sentence. This WP is a sweep, not a rewrite.
- `verified` and `passing` must not appear in front matter or in Status or Maturity table columns.

## Reviewer guidance

- The group 1 grep is empty, and every remaining group 2 hit is (a), (b) or (c).
- Term maturity matches the table, and every raised term has its code file.
- `docs/tooling.md` lists every workspace package and the real `verify` order.
- `README.md` links resolve.
- S1 to S9 of "Further sweep items" are done exactly as written, each after-check prints what it should, and the lint warning count fell from 33 to 31.
- `bun run verify`, `grace:lint` and `telos check` pass.

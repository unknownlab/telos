---
work_package_id: WP10
title: Guides
dependencies:
- WP09
- WP06
requirement_refs:
- C-006
- FR-013
- FR-023
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T052
- T053
- T054
- T055
- T056
phase: Phase 4 - Documentation content
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: curator-carla
authoritative_surface: docs/guides/
create_intent:
- docs/guides/introduction.md
- docs/guides/first-locus.md
- docs/guides/examples.md
- docs/guides/agent-reference.md
- apps/docs/test/guides.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- docs/guides/introduction.md
- docs/guides/first-locus.md
- docs/guides/examples.md
- docs/guides/agent-reference.md
- apps/docs/test/guides.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP10 – Guides

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and follow its guidance before you read the rest of this prompt.

- **Profile**: `curator-carla`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest documentation or implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. Address all of it before you treat the work as complete.

---

## Objectives & Success Criteria

Write the four guide documents in `docs/guides/`. The site renders them at `/`, `/first-locus`, `/examples` and `/agent-reference`. Also write a test that proves every claim the guides make about behaviour.

Done means:

1. The four files exist with valid `kind: guide` front matter, and `bun run content` (in `apps/docs`) compiles the whole tree with zero problems.
2. Every `json` block in the guides carries an annotation (below). `apps/docs/test/guides.test.ts` decodes, validates, revises or appends it with the **real** `@telos/locus` package, and gets exactly what the guide states. An unannotated `json` block fails the test.
3. Every command the Agent Reference lists exists. `bun run …` scripts are in the named `package.json`. State queries match `AGENTS.md` word for word. `git` queries run successfully (User Story 5, scenario 2).
4. The Agent Reference's API table lists exactly the runtime exports of `@telos/locus`.
5. The tutorial lets a newcomer define, validate and revise a Locus without reading source code (SC-003). Each step links to the matching playground scenario.
6. `bun run verify` passes.

## Context & Constraints

Read first:

- `docs/foundation/README.md`. It sets the reading order and the maturity vocabulary, and the guides must agree with it.
- `docs/foundation/conceptual-model/README.md` and `docs/foundation/terminology/` (Locus, Charter, Relation, Fabric, Identity, Revision). Use these terms exactly as defined there (ADR-0012).
- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`, the whole file: the API, diagnostic codes, canonical form and wire format.
- `kitty-specs/locus-foundation-01M5EWDR/contracts/docs-site.md`: **Routes and sections**, **Body rules** and **Front matter** (guide fields: `order`, `section`).
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md`: Diagnostic order, ChangeSet order, history rules.
- `AGENTS.md`: **Read state before working**.
- `apps/docs/scripts/content.ts` (WP09): the link rules. Relative `.md` links become routes. Other repository paths become GitHub links, and they must exist. `/…` links must be a document route or an app route (`/architecture`, `/playground`, `/playground/a` … `/e`, `/verification`).

Style: the same plain, direct English as `docs/foundation/`. Use short sentences and active voice, and explain each technical term at first use. Use no marketing words. Never write "verified" or "passing" as a claim about this project's state. Results are shown on `/verification` with their provenance (FR-018, P09). Do not put a table with a column headed Status or Maturity in a guide.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP10 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. This WP has no sanctioned shared edits. Do not edit `docs/foundation/`, `docs/decisions/` or `docs/research/`. If a guide needs a change there, report it.
- Do not add dependencies.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Write tests first, and no fake tests. A guide claim that is not checked by the test does not count as done.
- Style for the test file: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `docs(guides): add introduction, tutorial, examples and agent reference`. No AI names and no `Co-Authored-By` line.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP10 --agent claude`.

## Body shape (all four guides)

Every guide body starts with exactly one H1, `# <title>`, matching its front-matter `title`. It has no other H1. The site renders the body's H1 as the page heading (WP11), like every other document. The test checks this for each guide.

## Block annotations (the checked-claims convention)

Bun's Markdown renderer uses only the first word of a fenced block's info string as the language. ```` ```json fabric valid ```` renders as `<pre><code class="language-json">` (checked in planning). The words after it are therefore free for annotations that only the test reads.

The test reads the raw Markdown with `/^```([^\n]*)\n([\s\S]*?)^```$/gm`. Allowed info strings:

| Info string | Meaning; checked by the test |
| --- | --- |
| `json fabric valid [example=<name>]` | `decodeFabricJson(text)` succeeds and `validateFabric` gives `{ valid: true, diagnostics: [] }` |
| `json fabric invalid [example=<name>]` | decodes, and validation is not valid. The **next** block must be `json diagnostics` |
| `json diagnostics` | equals the previous fabric's `report.diagnostics` with `message` removed from each, compared with `toEqual` on parsed JSON. Key order does not matter, but array order does. |
| `json fabric decode-error` | `decodeFabricJson(text)` fails. The next block must be `json decode-issues` |
| `json decode-issues` | equals the `DecodeError`'s `issues` (`[{ path, message }]`) |
| `json locus a [example=<name>]` and `json locus b [example=<name>]` | `decodeLocus(JSON.parse(text))` succeeds. A pair a, b must appear in that order in one `##` section |
| `json revisions` | `{ "a": "<id>", "b": "<id>" }` equals the Revision ids of the section's a and b |
| `json changes` | equals `diffRevisions(a, b).changes` |
| `json history-steps` | an array of steps run in order against one fresh `RevisionHistoryInMemory` (below) |
| `sh` | command lines; each line must be a known command (T055, T056) |
| `text`, `mermaid` | not checked; must not contain JSON that a reader is meant to paste |

Any other info string, including a bare `json` or a `ts` block, fails the test with the file and the block's line number. `example=<name>` (`valid`, `invalid`, `relations`, `history.a`, `history.b`) marks a block that must equal the playground's starting input `examples.<name>` from `@telos/locus-specs`. WP14 checks that equality, because the examples arrive in WP08 on another lane. This WP checks only the behaviour.

`json history-steps` step shape:

```json
[
  { "append": "a", "expectedHead": null, "result": { "appended": true, "head": "a" } },
  { "append": "b", "expectedHead": "a", "result": { "appended": true, "head": "b" } },
  { "append": "a", "expectedHead": "a", "result": { "error": "StaleBaselineError", "actual": "b" } },
  { "append": "b", "expectedHead": "b", "result": { "appended": false, "head": "b" } }
]
```

`"a"` and `"b"` stand for the Revisions of the section's `locus a` and `locus b`. The test maps them to ids before calling `append`, and maps ids back before comparing.

### Exact values (computed in planning; the test is the judge)

These follow from the contract. Revision ids were computed independently with `shasum -a 256` over canonical form v1.

- The contract's example Fabric (`shop:system`) is valid.
- **Charter problems**: the same Fabric, but `shop:checkout` has `"purpose": ""` and `"responsibilities": ["Collect payment details", "Collect payment details"]`. Diagnostics:

  ```json
  [
    { "code": "charter.entry-duplicate", "scope": "locus", "subject": "shop:checkout", "path": "charter.responsibilities", "detail": "Collect payment details" },
    { "code": "charter.purpose-blank", "scope": "locus", "subject": "shop:checkout", "path": "charter.purpose" }
  ]
  ```

- **Relation problems**: the same Fabric, but `shop:checkout` has `relations: [{ "kind": "refines", "target": "shop:payment" }]`, `shop:payment` has `relations: [{ "kind": "refines", "target": "shop:checkout" }]`, and `shop:storefront` has `relations: [{ "kind": "depends-on", "target": "shop:ghost" }]`. Diagnostics:

  ```json
  [
    { "code": "relation.refines-cycle", "scope": "locus", "subject": "shop:checkout", "path": "relations", "members": ["shop:checkout", "shop:payment"] },
    { "code": "relation.target-missing", "scope": "locus", "subject": "shop:storefront", "path": "relations", "detail": "depends-on shop:ghost" }
  ]
  ```

- **Ownership problems**: Fabric `shop:org` with four Loci, each with a valid Charter. `shop:a` is owned by `shop:b`, `shop:b` by `shop:a`, `shop:c` by `shop:c`, and `shop:d` by `shop:nowhere`. Diagnostics, ordered by subject and then code:

  ```json
  [
    { "code": "owner.cycle", "scope": "locus", "subject": "shop:a", "path": "owner", "members": ["shop:a", "shop:b"] },
    { "code": "owner.self", "scope": "locus", "subject": "shop:c", "path": "owner" },
    { "code": "owner.missing", "scope": "locus", "subject": "shop:d", "path": "owner", "detail": "shop:nowhere" }
  ]
  ```

- **Decode error**: `{"id":"shop:system","loci":[{"id":"shop:a","charter":{"purpose":"A.","responsibilities":["Do A"]},"relations":[{"kind":"owns","target":"shop:b"}]}]}` gives `[{ "path": "loci[0].relations[0].kind", "message": "Expected \"depends-on\" | \"refines\" | \"satisfies\" | \"verifies\"" }]`.
- **Revision a** is the contract's `shop:checkout`: owner `shop:storefront`, responsibilities `["Collect payment details"]`, `depends-on shop:payment`. Its id is `sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6`.
- **Revision b** is the same with responsibilities `["Collect payment and delivery details"]`. Its id is `sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315`. The changes from a to b are `[{ "part": "charter.responsibilities", "kind": "removed", "value": "Collect payment details" }, { "part": "charter.responsibilities", "kind": "added", "value": "Collect payment and delivery details" }]`.
- **Same meaning, same id**: a = `{ "id": "shop:catalogue", "charter": { "purpose": "Present products.", "responsibilities": ["Show prices", "List products"], "excluded": ["Take payments"] }, "metadata": { "team": "web" } }` and b = `{ "id": "shop:catalogue", "charter": { "purpose": "Present products.", "responsibilities": ["List products", "Show prices"], "excluded": ["Take payments"], "successConditions": [] }, "relations": [] }`. Both ids are `sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75`, and the changes are `[]`. Order and metadata are not part of the meaning.

If the package disagrees with one of these values, **do not change the guide to match the package**. Stop and report it. A disagreement means either the package or this prompt is wrong, and the reviewer decides which.

## Subtasks & Detailed Guidance

### Subtask T052 – `docs/guides/introduction.md` [P]

Front matter:

```yaml
id: introduction
title: Introduction
kind: guide
order: 1
section: introduction
status: provisional
maturity: proposed
summary: What Telos by UnknownLab is, what Stage 0 delivers, and how to read this site.
related: [foundation, evolution-of-determinism, principles, terminology, first-locus]
```

Content, about 60–100 lines:

1. **What Telos is**: one or two paragraphs drawn from `docs/foundation/README.md`. The name is always "Telos by UnknownLab" at first mention (ADR-0015).
2. **What Stage 0 delivers**: the `@telos/locus` package (Locus, Charter, Relation, Fabric, validation, Revisions, change sets, history), the executable specifications, and this site with its playground. Say plainly what Stage 0 does not include (spec C-006). Link the roadmap (`../foundation/roadmap/README.md`).
3. **How to read this site**: one bullet per nav section, in nav order, each with a link and one sentence. Philosophy, Principles, Terminology, the conceptual model, Roadmap and Decisions get relative `.md` links. First Locus, Examples and Agent Reference get `first-locus.md`, `examples.md` and `agent-reference.md`. Playground and Verification get `/playground` and `/verification`.
4. **Maturity and evidence**: explain the `status` and `maturity` badges in two sentences each, link `../foundation/README.md#maturity-vocabulary`, and say that verification results appear only on `/verification` and in the playground, each labelled with where and when it was produced.

`related` lists `first-locus`, which only exists after T053. Write T053 before running the content compile.

### Subtask T053 – `docs/guides/first-locus.md` [P]

Front matter: `id: first-locus`, `title: Your first Locus`, `kind: guide`, `order: 2`, `section: first-locus`, `status: provisional`, `maturity: implemented`. The summary is one sentence. `related: [locus, charter, fabric, relation, revision, examples]`.

A tutorial in five steps, each a `##` section. Each step ends with a line such as `Try it: [Scenario A in the playground](/playground/a).`

1. **Define a Fabric**: explain Identity (`namespace:name`, link the term), Charter (purpose and responsibilities), owner and Fabric. Show the contract's example Fabric as `json fabric valid example=valid`, and explain each field once. Link to `/playground/a`.
2. **See validation fail**: show the charter-problems Fabric as `json fabric invalid example=invalid`, then its `json diagnostics`. Explain `code`, `subject`, `path` and `detail`, and that diagnostics are sorted so the same input always gives the same report. Link to `/playground/b`.
3. **Relate Loci**: explain the four relation kinds and why a `refines` cycle is an error while `depends-on` cycles are allowed (cite the conceptual model). Show the relation-problems Fabric as `json fabric invalid example=relations`, then its diagnostics. Link to `/playground/c`.
4. **Revise a Locus**: explain that a Revision is an immutable, content-addressed snapshot, and that its id is the SHA-256 of the canonical form. Show `json locus a example=history.a` and `json locus b example=history.b`, then `json revisions` with both ids, then `json changes`. Then explain compare-and-set history with the four `json history-steps` shown above. Name the stale-baseline refusal and say why it matters (P08, link it). Link to `/playground/d`.
5. **Run the specifications**: explain that the same specification records run under Bun (`bun run test`, in an `sh` block) and in the browser. Link to `/playground/e`, and to `/verification` for the build-time report.

End with "Next steps": links to `examples.md`, the terminology index and the decisions index.

### Subtask T054 – `docs/guides/examples.md` [P]

Front matter: `id: examples`, `title: Examples`, `kind: guide`, `order: 3`, `section: examples`, `status: provisional`, `maturity: implemented`. Write a one-sentence summary. `related: [first-locus, locus, relation, revision]`.

Use one `##` section per example. Each has a short explanation, the annotated blocks, and a link to the scenario that can run it.

1. A valid Fabric (`json fabric valid`, the contract example), with `/playground/a`.
2. Charter problems (`json fabric invalid` plus diagnostics), with `/playground/b`.
3. Ownership problems, from the exact values above, with `/playground/b`.
4. Relation problems (`json fabric invalid` plus diagnostics), with `/playground/c`.
5. Input that is not a Fabric (`json fabric decode-error` plus `json decode-issues`). Explain that decode errors and diagnostics are different: malformed input versus an invalid model (FR-008). Link to `/playground/b`.
6. Same meaning, same id (`json locus a`, `json locus b`, `json revisions`, `json changes` with `[]`), with `/playground/d`.

In this guide only, `example=` annotations are not used, except on blocks that are copies of the tutorial's.

### Subtask T055 – `docs/guides/agent-reference.md` [P]

Front matter: `id: agent-reference`, `title: Agent Reference`, `kind: guide`, `order: 4`, `section: agent-reference`, `status: provisional`, `maturity: implemented`. Write a one-sentence summary. `related: [foundation, decisions, open-questions]`.

Sections, in this order:

1. **Start here**: `AGENTS.md` is the rule set (link `../../AGENTS.md`). Then the foundation README, the decision index, open questions, and `kitty-specs/` for missions, with `../../kitty-specs/` as a directory link, which WP09 turns into a GitHub `tree` URL.
2. **Entry points**: a table with the columns **Path** and **What it is**. Every path is a relative link, so the content compile checks that it exists:
   - `packages/locus/src/index.ts`
   - `packages/locus-specs/src/index.ts`
   - `apps/docs/scripts/content.ts`
   - `apps/docs/package.json`
   - `package.json`
   - `bunfig.toml`
   - `docs/tooling.md`
   - `.grace/`, a directory link. It exists today, in `.grace/graph/` and the other GRACE folders.
3. **State queries**: an `sh` block whose lines are copied **exactly** from `AGENTS.md` **Read state before working**:
   - `git status`
   - `git worktree list`
   - `spec-kitty agent tasks status --mission <slug> --json`
   - `spec-kitty next --mission <slug> --json`
   - `spec-kitty invocations list`
   - `grace status --path . --json`

   Add one sentence: query mode of `spec-kitty next` does not advance a mission.
4. **Check commands**: an `sh` block with `bun run verify`, `bun run test`, `bun run typecheck`, `bun run lint`, `bun run format:check` and `bun run grace:lint`, plus the docs app's scripts in the form `bun run --cwd apps/docs content`, `bun run --cwd apps/docs build` and `bun run --cwd apps/docs test:e2e`. Give one line of prose per command, outside the block. Do **not** list `docs:build` or `test:e2e` at the root: WP17 adds them. The root `verify` will run the docs build then. Do not describe that here, because it is not yet true.
5. **Public API of `@telos/locus`**: a table with the columns **Export** and **What it does**. There is one row per runtime export, and the first cell is the name in a code span. The 18 runtime exports are `DecodeError`, `DigestError`, `LocusMismatchError`, `RELATION_KINDS`, `RevisionHistory`, `RevisionHistoryInMemory`, `RevisionNotFoundError`, `StaleBaselineError`, `canonicalForm`, `createRevision`, `decodeFabric`, `decodeFabricJson`, `decodeLocus`, `defineFabric`, `defineLocus`, `diffRevisions`, `isIdentity` and `validateFabric`. Take each description from `contracts/locus-api.md`, shortened to one sentence. Type-only exports go in one sentence below the table, not in it.
6. **Diagnostic codes**: one sentence pointing to the contract table, with a GitHub-resolvable relative link to `../../kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md`. List the 14 codes as a bullet list of code spans.

### Subtask T056 – `apps/docs/test/guides.test.ts`

Write this test first, against empty or partial guides, and watch it fail.

Read the four files from `resolve(import.meta.dir, "../../../docs/guides")`. Strip the front matter with the same regex as WP09.

1. **Front matter**: each file parses with `Bun.YAML.parse`. Kind is `guide`. The orders are 1, 2, 3 and 4, and the sections are `introduction`, `first-locus`, `examples` and `agent-reference`.
   **Body**: the body (after the front matter) contains exactly one line matching `/^# /m` outside fenced blocks (remove the blocks first; shell comments start with `# ` too). It is the first non-blank line and reads `# <title>`.
2. **Blocks**: collect the blocks with their line numbers. Every info string must be one of the allowed forms. Pairing rules:
   - `fabric invalid` is followed by `diagnostics`;
   - `decode-error` is followed by `decode-issues`;
   - `revisions`, `changes` and `history-steps` need an a and b pair earlier in the same `##` section.

   Then check each claim with the real package:

   ```ts
   import {
     RevisionHistory, RevisionHistoryInMemory, createRevision, decodeFabricJson, decodeLocus,
     defineLocus, diffRevisions, validateFabric,
   } from "@telos/locus";
   import { Effect } from "effect";
   // Effect.runPromise(Effect.result(decodeFabricJson(text))) → { _tag: "Success", success } | { _tag: "Failure", failure }
   ```

   `decodeLocus` returns a `LocusDefinition`, which feeds `createRevision`. Name each test case after the file, the line and the annotation, so a failure points to the block.
3. **History steps**: build one program per block. Map `"a"`/`"b"` to Revisions, run each `append` through `Effect.result`, and map the outcome to the step's `result` shape: success gives `{ appended, head: "a" | "b" }`, and failure gives `{ error: failure._tag, actual: "a" | "b" | null }`. Provide `RevisionHistoryInMemory` once per block.
4. **Commands**: for every line in every `sh` block:
   - `bun run <script>`: `<script>` is a key of the root `package.json` `scripts`.
   - `bun run --cwd apps/docs <script>`: it is a key of `apps/docs/package.json` `scripts`.
   - Lines starting with `spec-kitty ` or `grace `: the exact line occurs in `AGENTS.md`.
   - `git status` and `git worktree list`: run each with `Bun.spawnSync` at the repository root and expect exit code 0.
   - Any other line fails the test.
5. **API table**: parse the Agent Reference's API table rows (first-column code spans). They must equal `Object.keys(await import("@telos/locus")).sort()`.
6. **Diagnostic codes**: the 14 listed codes equal the code set in the contract. Hard-code the 14 in the test with a comment that cites `contracts/locus-api.md`, and assert that the guide lists exactly those.
7. **Content compile**: import `compileContent` from `../scripts/content` and compile the real repository. The result is `ok: true`. `/`, `/first-locus`, `/examples` and `/agent-reference` are routes of the four guides.

## Definition of Done

- [ ] The four guides are written in foundation style and cite terms and principles by link.
- [ ] Every `json` block is annotated and checked, and the test was seen failing before the guides were complete.
- [ ] The commands and the API table are checked against the real files and package.
- [ ] `bun run content` in `apps/docs` reports zero problems.
- [ ] `bun run verify` passes.

## Risks

- **Fitting the docs to the code**: the exact values above come from the contract. If the package disagrees, report it; never edit the guide to match.
- **Claims about the future**: the guides describe what exists on this branch. Root `docs:build` and `test:e2e`, CI and deployment do not exist yet, so do not mention them as available.
- **Link rules**: `/playground/*` and `/verification` are allowed only because WP09 lists them as app routes. A typo such as `/playgound/a` fails the content compile, which is intended.

## Reviewer Guidance

- Run `bun test apps/docs/test/guides.test.ts` and `bun run --cwd apps/docs content`.
- Read the tutorial as a newcomer would: can you define, break, relate, revise and run checks from it alone, in about 15 minutes?
- Check that terms match `docs/foundation/terminology/`, that there are no verification claims, and that no statement is unchecked or speculative.

---
work_package_id: WP18
title: Governance sync
dependencies:
- WP17
requirement_refs:
- FR-024
- FR-026
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T098
- T099
- T100
- T101
- T102
phase: Phase 6 - Browser tests, gates, governance
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: curator-carla
authoritative_surface: docs/foundation/
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- AGENTS.md
- .kittify/charter/charter.md
- .kittify/charter/interview/answers.yaml
- .kittify/glossaries/team_domain.yaml
- .kittify/config.yaml
- docs/tooling.md
- docs/foundation/terminology/locus.md
- docs/foundation/terminology/charter.md
- docs/foundation/terminology/identity.md
- docs/foundation/terminology/relation.md
- docs/foundation/terminology/fabric.md
- docs/foundation/terminology/revision.md
- docs/foundation/architecture/capabilities.md
- docs/foundation/philosophy/evolution-of-determinism.md
role: curator
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP18 – Governance sync

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and follow its guidance before you read the rest of this prompt.

- **Profile**: `curator-carla`
- **Role**: `curator`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest documentation or curator profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. Address all of it before you treat the work as complete.

---

## Objectives & Success Criteria

Bring agent instructions, governance wording, tooling notes and foundation maturity into line with what this mission built (FR-024, FR-026).

Done means:

1. `AGENTS.md` has the **owner-approved** `## Telos foundation` section, word for word, and every earlier line of the file is unchanged (FR-024).
2. The charter's "One vocabulary" rule and the glossary's `telos` entry carry the owner-approved wording. The charter interview answers say the same thing, so that regenerating the charter cannot bring back the old rule.
3. `.kittify/config.yaml` `project.path_conventions` holds **the value the owner chose** (see T100), and Spec Kitty still loads it.
4. Every foundation document that describes a Stage 0 element this mission implemented is marked `implemented`, and nothing else is (FR-026). An evidence table in the report backs each change.
5. `docs/tooling.md` describes the new commands, the longer gate and the Chromium setup step, matching what was shipped.
6. `bun run verify` passes. `spec-kitty charter status --json` reports `"status": "synced"`.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/plan.md`: **Owner approvals** items 5, 6 and 7, which hold the exact approved wording, and IC-11
- `kitty-specs/locus-foundation-01M5EWDR/spec.md`: FR-024 and FR-026
- `docs/foundation/README.md`: **Maturity vocabulary**. `implemented` means "code that realises the concept exists on the branch the document is on". `verified` is **never** written by hand.
- `AGENTS.md`, `.kittify/charter/charter.md` and `docs/tooling.md`, in full

### Facts verified in planning (2026-10-21, Spec Kitty 3.2.7)

- `project.path_conventions` maps each key to **one** repository-relative directory string. Valid keys are `workspace`, `tests`, `deliverables`, `documentation` and `data`. Values must be non-blank and contain no `..`. A list is rejected.
- Spec Kitty reads these values only at `accept`, to check that the mapped directories exist. A malformed section fails accept closed.
- The charter's "One vocabulary" text exists in two places: `.kittify/charter/charter.md` line 26, and `documentation_policy` in `.kittify/charter/interview/answers.yaml`. `spec-kitty charter generate` rebuilds the charter from the answers, so both places must change.
- The glossary's `telos` entry is the first term in `.kittify/glossaries/team_domain.yaml`.
- Each foundation term document has `stage0:` front matter (`in-scope`, `minimal` or `deferred`) and a `## Stage 0 form` section. That section is the claim the code must meet.

## Rules

- Work only inside the worktree that `spec-kitty agent action implement WP18 --agent claude` gives you.
- Stay inside `owned_files`. **Use the approved wording verbatim.** Change nothing else in `AGENTS.md`, the charter or the glossary: no rewording, reflowing or "improvements". These files are owner decisions.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- Maturity changes follow evidence only (T101). When in doubt, leave the document as it is and list it in the report.
- Do not write `verified` anywhere.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push.
- Commit messages follow Conventional Commits, for example:
  - `docs(agents): point agents to the Telos foundation`
  - `chore(charter): define product and process vocabulary owners`
  - `docs(foundation): mark implemented Stage 0 terms`
  - `docs(tooling): describe docs build and browser checks`

  No AI names and no `Co-Authored-By` line.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP18 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T098 – `AGENTS.md` foundation pointer

Insert this section into `AGENTS.md` directly **before** `## Read state before working`. The Spec Kitty block at the top of the file belongs to Spec Kitty, so place the section after `# Agent rules` and its introduction:

```markdown
## Telos foundation

Telos by UnknownLab is defined in `docs/foundation/README.md` (doctrine, principles, terminology, conceptual model), `docs/decisions/` (architecture decision records) and `docs/research/`. Read the foundation README before product work. Product terms are defined in `docs/foundation/terminology/`; use them as defined there. The documentation site in `apps/docs` is generated from these files; never edit content in the app.
```

Prove that nothing else changed. `git diff --stat AGENTS.md` shows only insertions, and `git diff AGENTS.md | grep '^-[^-]'` prints nothing. Copy the wording from `plan.md` **Owner approvals** item 5, not from memory. If the two differ, `plan.md` wins.

`CLAUDE.md` imports `AGENTS.md`, so do not edit `CLAUDE.md`.

### Subtask T099 – Charter and glossary wording

1. **Charter** (`.kittify/charter/charter.md` line 26). Replace the rule's sentence while keeping its bold label:

   ```markdown
   - **One vocabulary.** Product terms are defined in `docs/foundation/terminology/`; process terms live in the Spec Kitty glossary (`.kittify/glossaries/`). Both mean the same thing in specs, code and docs.
   ```

   The approved core is "Product terms are defined in `docs/foundation/terminology/`; process terms live in the Spec Kitty glossary". The rest only keeps the existing path and the "same meaning" rule.
2. **Interview answers** (`.kittify/charter/interview/answers.yaml`, `documentation_policy`). Replace the sentence "Canonical terms live in the Spec Kitty glossary and are used consistently in specs, code and docs." with "Product terms are defined in docs/foundation/terminology/; process terms live in the Spec Kitty glossary. Both are used consistently in specs, code and docs." Keep the folded `>-` block style and its indentation.
3. **Glossary** (`.kittify/glossaries/team_domain.yaml`, the `telos` term). Set `definition` to the approved text, keeping `confidence` and `status`:

   ```yaml
   definition: "Telos by UnknownLab: a framework in which software systems are described, verified and evolved as code, see docs/foundation."
   ```

   Quote it, because it contains a colon.
4. Check:
   - `spec-kitty charter status --json`: `charter_sync.status` is `synced`. If it reports drift, run `spec-kitty charter sync` once and check again.
   - `spec-kitty charter lint --json`: no new findings compared with the base branch. Run it on both and compare.
   - `spec-kitty glossary --help`: if a validate or list command exists, run it and confirm the `telos` term loads.

   Report the output. **Do not** run `charter generate`, because it rewrites the whole bundle.

### Subtask T100 – `path_conventions`

The owner approved widening `workspace` and `tests` "to cover `packages/` and `apps/`". The schema allows only one directory per key, so that cannot be written literally. The coordinator asks the owner before dispatching this WP and records the choice in this prompt's Activity Log:

- **Recommended**: `workspace: packages/` and `tests: packages/`. That is where the product code and most tests live; accept only checks that the directory exists.
- Other choices the owner may make: keep `scripts/`, or another single directory.

Apply exactly the recorded choice:

```yaml
project:
  path_conventions:
    workspace: packages/
    tests: packages/
```

**If the Activity Log records no owner choice, do not change the file.** Report that T100 is waiting on the owner, and finish the other subtasks.

Then check the file still loads. Run `bun -e` to read `.kittify/config.yaml` back, or `spec-kitty agent mission check-prerequisites --mission locus-foundation-01M5EWDR --json`, and confirm there is no `PathConventionsConfigError`. Change no other key in `config.yaml`.

### Subtask T101 – Foundation maturity follow-through (FR-026)

**Rule.** A document becomes `implemented` only when **every** element its `## Stage 0 form` section describes has all of these:

1. code in `packages/locus` (or `packages/locus-specs` for executable specifications);
2. at least one catalogue record (`LOC-0xx`) that exercises it;
3. a passing run: `bun test packages/locus-specs` on this branch.

Items the section itself calls deferred are not claims. A document whose Stage 0 form is only partly built stays `proposed`. Documents with `stage0: deferred` or `maturity: vision` stay as they are.

**Candidates** (all `maturity: proposed` today):

| Document | `stage0` | Expected outcome, to be confirmed by evidence |
| --- | --- | --- |
| `terminology/identity.md` | in-scope | `implemented` |
| `terminology/locus.md` | in-scope | `implemented` |
| `terminology/charter.md` | in-scope | `implemented` |
| `terminology/relation.md` | in-scope | `implemented` |
| `terminology/revision.md` | in-scope | `implemented` (content-addressed ids, change sets and compare-and-set history) |
| `terminology/fabric.md` | minimal | `implemented` only if its minimal Stage 0 form, identity plus members plus whole-Fabric validation, is fully met |

For each candidate, build one evidence row: document, each Stage 0 claim, the exported symbol(s), the `LOC-` ids, and the decision. Get the ids with `grep -n "LOC-0" packages/locus-specs/src/catalogue.ts`. Put the table in the report, not in the repository.

**Inline maturity claims** (the same rule applies):

- `philosophy/evolution-of-determinism.md`, table rows about Locus identity, Charter and single owner; immutable content-addressed Revisions with compare-and-set baseline; semantic diff; executable specifications with stable IDs. Each row's maturity cell starts with `` `proposed`; Stage 0 mission… ``. Change `proposed` to `implemented` only for rows whose evidence holds. Keep the rest of the cell, with tense fixed if it says "will". The `vision` rows stay.
- `architecture/capabilities.md` CAP-01 says "**Maturity**: `proposed`. The Stage 0 mission implements the first slice." The capability as a whole is **not** implemented, so keep `proposed`. Change only the sentence to the past tense and name the package: "The Stage 0 mission implemented the first slice, `@telos/locus`." No other capability changes.

Do not change principles, the conceptual model, the foundation README or the terminology README. Their scope is wider than Stage 0. List them in the report as "left `proposed`: scope wider than Stage 0".

Then rebuild and test the site, because maturity drives the site's badges and the content compiler validates front matter:

```bash
bun run docs:build
bun test apps/docs
bun run test:e2e
```

If a test pins the maturity of a real document you changed, **stop and report it**. That test belongs to another WP. Do not edit it here.

### Subtask T102 – `docs/tooling.md` and final consistency pass

Update `docs/tooling.md` to match what was shipped, in its existing style: short sentences and tables.

- **Commands table**:
  - add `bun run docs:build`, `bun run docs:preview` and `bun run test:e2e`, each with a one-line description;
  - update the `bun run verify` row to list the new order: version, format check, lint, typecheck, tests, docs build, browser tests, `grace lint`.
- **Layout**: add `packages/locus`, `packages/locus-specs` and `apps/docs` with one line each, if the section lists directories.
- **Pre-commit hook**: add one sentence saying that the docs build and browser tests run in `verify` and the review gate, not in the hook (owner decision, 2026-10-21).
- **Review gate**: mention the `verify.docs:build` and `verify.test:e2e` cases. Say that the gate's step list is tested against `verify`, so the two cannot drift.
- **One-time setup**: add `bunx playwright install chromium` after `bun install`, with the comment `# browser for test:e2e; downloads into ~/Library/Caches/ms-playwright`.
- **After a mission merge**: replace "points Spec Kitty's workspace and tests checks at `scripts/`" with the value T100 set. If T100 is waiting, leave it.

**Consistency pass.** Each check is a command; quote the output:

1. `grep -rn "Canonical terms live" AGENTS.md docs .kittify/charter .kittify/glossaries`: no hits.
2. `grep -n "Telos foundation" AGENTS.md`: one hit.
3. Every command named in `docs/tooling.md` exists in root `package.json` `scripts`. Check this with a `bun -e` one-off over the backticked `bun run <name>` strings.
4. `grep -rn "^maturity: verified\|\`verified\`" docs/foundation`: only the vocabulary table in `docs/foundation/README.md`.
5. `grace lint --path . --assertions current`: 0 errors and 0 warnings.
6. `bun run verify` passes.
7. `spec-kitty charter status --json` reports synced.

## Definition of Done

- [ ] The `AGENTS.md` section is verbatim, and the diff is insertions only.
- [ ] Charter, interview answers and glossary updated; charter status is synced.
- [ ] `path_conventions` set to the owner's recorded choice, or left unchanged with the reason reported.
- [ ] Maturity changes match the evidence table, and nothing unimplemented is marked `implemented`.
- [ ] `docs/tooling.md` matches the shipped scripts and gate.
- [ ] All seven consistency checks pass and are quoted.

## Risks

- **Overstating maturity.** That is the failure FR-026 exists to prevent. The evidence table is the guard; partial means `proposed`.
- **Reworded governance text.** The owner approved exact words. A tidier paraphrase is still a change the owner did not approve.
- **Charter regeneration.** If only `charter.md` changes, a later `charter generate` restores the old rule. That is why T099 also edits the answers.
- **Changing tests owned by other WPs.** Report it instead.

## Reviewer Guidance

- Compare the `AGENTS.md`, charter and glossary diffs character by character with `plan.md` **Owner approvals**.
- Re-check two rows of the evidence table against `catalogue.ts` and the exported symbols.
- Confirm `path_conventions` matches the Activity Log entry.
- Run `bun run verify` and `spec-kitty charter status --json`.

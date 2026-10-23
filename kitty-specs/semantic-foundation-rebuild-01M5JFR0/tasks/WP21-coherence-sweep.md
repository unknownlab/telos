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
- `bun run verify`, `grace:lint` and `telos check` pass.

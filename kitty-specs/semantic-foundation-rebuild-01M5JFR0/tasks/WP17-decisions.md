---
work_package_id: WP17
title: Architecture decision records ADR-0018 to ADR-0028
dependencies:
- WP16
requirement_refs:
- FR-028
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: b55faeb770660658a1e980d9f28abff94ca0b371
created_at: '2026-10-24T08:54:38.021875+00:00'
subtasks:
- T097
- T098
- T099
- T100
- T101
phase: Phase 6 – Doctrine
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: curator-carla
authoritative_surface: docs/decisions/
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- docs/decisions/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP17 – Architecture decision records ADR-0018 to ADR-0028

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

Record the design of the semantic foundation rebuild as architecture decision records ADR-0018 to ADR-0028 in `docs/decisions/`, mark every replaced ADR as superseded with a link to its replacement, and update the decisions README. WP16 (merged before you start) already rewrote the foundation documents and fixed `related` ids and links in the ADRs.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

### Decisions (WP17, spec D8)

The new ADRs use `kind: decision` and `date: 2026-10-22`. The `status` is given in the table. Each ADR has the sections Context, Decision, Alternatives and Consequences, and the `related` list names the ADRs it supersedes.

| File | Status | Supersedes |
| --- | --- | --- |
| `ADR-0018-semantic-foundation-rebuild.md`: records the owner directive | accepted | — |
| `ADR-0019-locus-with-composable-extensions.md` | proposed | ADR-0002, ADR-0006 |
| `ADR-0020-containment-is-structural-ownership.md` | proposed | ADR-0007 |
| `ADR-0021-relation-types-defined-by-extensions.md` | proposed | ADR-0008 |
| `ADR-0022-capabilities-and-governed-invocation.md` | proposed | ADR-0009 |
| `ADR-0023-archetypes-and-knowledge-status.md` | proposed | ADR-0010, ADR-0013 |
| `ADR-0024-digests-and-model-comparison.md` | proposed | ADR-0005 |
| `ADR-0025-living-docs-from-the-real-kernel.md` | proposed | ADR-0014 |
| `ADR-0026-semantic-closure-at-file-granularity.md` | proposed | — |
| `ADR-0027-packs-are-ordinary-packages.md` | proposed | — |
| `ADR-0028-repository-self-description-gate.md` | proposed | — |

- For each superseded ADR, set `status: superseded` and add, directly under the title: `> Superseded by [ADR-00NN](ADR-00NN-....md).` Do not change its other text.
- `docs/decisions/README.md` lists every ADR with its status.
- ADR-0017 stays accepted and unchanged. ADR-0018 states that the calculator is now decided by the owner directive.

### Front matter shape (copy it; `scripts/content.ts` validates it)

```yaml
---
id: ADR-0019
title: A Locus is composed from semantic extensions
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: <one sentence>
related: [ADR-0002, ADR-0006, locus, semantic-extension, composition]
---

# ADR-0019 — A Locus is composed from semantic extensions

## Context

## Decision

## Alternatives

## Consequences
```

The `id` is `ADR-NNNN` (not the file name). `related` ids are document ids (`ADR-0002`, `locus`, `P02-composable-extensions`, …); every one must exist. Allowed `status` values: `provisional, proposed, accepted, open, superseded, deprecated`. Allowed `maturity`: `vision, proposed, implemented`; use `proposed` for all new ADRs. Never write `verified` or `passing` in front matter or in the README's Status column.

### Decision content (write each ADR from its row; link the named principles and terms)

| ADR | Title | Decision (what the record states) |
| --- | --- | --- |
| 0018 | The semantic foundation is rebuilt by owner directive | The owner directive of 2026-10-22 (copy kept at `../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/research/owner-directive.md`) replaces the Stage 0 model. The audit kept identity, freeze, canonical JSON, the docs pipeline, the review gate and ADR-0001, 0003, 0004, 0011, 0012, 0015, 0016, 0017; it superseded ADR-0002, 0005, 0006, 0007, 0008, 0009, 0010, 0013, 0014. The calculator proof is now decided by this directive (ADR-0017 remains the north star). The design records ADR-0019 to ADR-0028 stay `proposed` until the owner accepts them (spec D8). Status `accepted`. |
| 0019 | A Locus is composed from semantic extensions | A Locus has only an identity as mandatory field; meaning comes from extensions (`Extension.make`) composed into a Locus kind (`Locus.extend(A, B)`). Properties share one flat namespace per Locus and a name defined by two extensions is a composition conflict, never an overwrite (spec D5). Replaces the mandatory Charter (now the optional `telos.purpose` extension) and the separate Fabric. Modules: `packages/kernel/src/extension.ts`, `locus.ts`. |
| 0020 | Containment is structural ownership | A Locus contains other Loci (`contains`); each Locus has at most one container, and a root has none. A semantic model is all Loci reachable from one root (`buildModel`). Replaces the `owner` field and Fabric membership. Diagnostics `containment.*` with stable codes. |
| 0021 | Relation types are defined by extensions | Relations are typed, directed statements whose type (`RelationType.make`) is declared by an extension of the source Locus; the target is a Locus or a capability. A type may be `acyclic` and may grant invocation. Replaces the closed Stage 0 relation kinds. |
| 0022 | Capabilities and governed invocation | A capability is a named operation with input, output and error schemas and an effect class (`pure`, `read`, `write`). `invoke(model, ref, input, { via })` checks the grant (the Locus itself, or a relation whose type grants invocation), decodes input, runs the handler and encodes the outcome; CLI, Web and Agent interfaces share it, so their errors are identical. Introspection never grants invocation (spec D6). Replaces Acts and Mandates. |
| 0023 | Archetypes verify Loci and findings carry a knowledge status | An Archetype is a set of rules (method `static` or `execution`) that applies to Loci whose kind includes given extensions. `verify` records one finding per rule and Locus (`passed`, `failed`, `error`). Knowledge statuses: declared, derived, verified (only a real rule result), failed, not run; `observed` and `invalidated` are reserved. Replaces Laws/Lenses (ADR-0010's evidence model) and the temporary executable specifications (ADR-0013). |
| 0024 | Digests and model comparison replace revisions | `digestOf` is SHA-256 over canonical JSON (`sha256:<hex>`, Web Crypto, works in Bun and the browser). Capability contracts carry a `contractDigest`. `diffModels` compares two models and `impact` lists affected Loci, relations and rules. The RevisionHistory service is removed (spec D1); later revisioning can build on digests. |
| 0025 | The documentation runs the real kernel | The site's playground decodes and verifies JSON Locus definitions with `@telos/kernel` in the browser; the inspector and verification pages read the semantic report produced at build time by `bun run telos report`. Replaces the controlled scenario playground (ADR-0014). |
| 0026 | Semantic Closure at file granularity | Every managed code file must belong to a discoverable Locus owner (`Source` globs, most specific owner), and its imports must follow declared relations or `External` packages (`checkClosure`, `@telos/kernel/closure`, Bun only). Limits: no attribution below file level, type-only imports are not seen, computed `import()` is reported as a warning. |
| 0027 | Packs are ordinary packages | A Pack is an ordinary TypeScript package (`@telos/cli`, `@telos/agent`, `@telos/web`) that distributes extensions, Archetypes and adapters built on Effect modules that already exist (effect/cli, the Effect MCP server). No plugin registry, no new dependency. |
| 0028 | The repository describes itself and the gate checks it | `telos.ts` describes the repository as a Telos model; `bun run telos check` fails on model diagnostics, failed rules or closure findings and is the last step of `bun run verify` and of the review gate (spec D7). GRACE stays in sync by hand for now (spec D4). |

Each ADR's Alternatives section names at least one real alternative from the spec or plan (for example ADR-0019: a namespace per extension; ADR-0024: Bun's synchronous hasher, rejected because it does not run in the browser; ADR-0026: symbol-level attribution, rejected as too costly now).

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

- `docs/foundation/**` (WP16): replace each plain sentence `The decision record for this rebuild is ADR-0018 (written next).` with the linked sentence, and add `ADR-0018` to the `related` list of `docs/foundation/README.md` and `docs/foundation/future-semantic-evolution.md`. Nothing else.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP17 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T097 – ADR-0018

Write `docs/decisions/ADR-0018-semantic-foundation-rebuild.md` (`status: accepted`, `related: [ADR-0017, foundation, future-semantic-evolution]`). Then apply the sanctioned edit in `docs/foundation/**`: find the placeholder sentences with `git grep -n "ADR-0018 (written next)" -- docs` and replace each with `The decision record for this rebuild is [ADR-0018](<relative path to docs/decisions/ADR-0018-semantic-foundation-rebuild.md>).`; add `ADR-0018` to the `related` lists of `docs/foundation/README.md` and `docs/foundation/future-semantic-evolution.md`.

### T098 – ADR-0019 to ADR-0023

Write the five files with the exact file names of the contract table. `related` lists the superseded ADRs and the matching terms and principles.

### T099 – ADR-0024 to ADR-0028

Write the five files the same way.

### T100 – Superseded ADRs

For ADR-0002, 0005, 0006, 0007, 0008, 0009, 0010, 0013 and 0014: set `status: superseded` and add, directly under the `# ADR-…` title line, one blank line, the quote line `> Superseded by [ADR-00NN](ADR-00NN-<slug>.md).`, and one blank line. Each old ADR has exactly one replacement: 0002 → 0019, 0006 → 0019, 0007 → 0020, 0008 → 0021, 0009 → 0022, 0010 → 0023, 0013 → 0023, 0005 → 0024, 0014 → 0025. Change nothing else in these files. ADR-0001, 0003, 0004, 0011, 0012, 0015, 0016 and 0017 are not touched.

### T101 – README and verify

In `docs/decisions/README.md` update the Status column of the superseded rows to `superseded`, and add rows for ADR-0018 to ADR-0028 (ID linked, the title as Decision, status). Keep the `## Statuses` and `## Adding a record` headings (other documents link to `README.md#statuses`). Run `bun run --cwd apps/docs content` (no problems), `bun run format`, then `bun run verify`.

## Definition of Done

- [ ] Every subtask of this WP is done.
- [ ] Every document uses the existing front matter shape of its kind, and every link and `related` id resolves.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly).
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope (for example `docs(foundation): ...`), with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP17 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Do not change the text of superseded ADRs beyond the status and the quote line.
- ADR-0018 is the only accepted new record; all others are `proposed`.

## Reviewer guidance

- Eleven new ADRs with the four sections and the contract file names.
- Nine superseded ADRs, each with `status: superseded` and exactly one quote line.
- The README table lists ADR-0001 to ADR-0028 with correct statuses.

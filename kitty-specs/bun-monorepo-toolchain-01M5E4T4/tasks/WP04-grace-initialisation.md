---
work_package_id: WP04
title: GRACE initialisation
dependencies:
- WP01
- WP02
requirement_refs:
- FR-010
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts were generated on feat/bun-monorepo-toolchain; completed changes must merge back into feat/bun-monorepo-toolchain.
subtasks:
- T017
- T018
- T019
- T020
phase: Phase 3 - Architecture
history:
- !!omap
  - at: '2026-10-21T03:16:03Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: .grace/
create_intent:
- .grace/context/requirements.xml
- .grace/context/technology.xml
- .grace/context/principles.xml
- .grace/context/deployment.xml
- .grace/context/ux-guidelines.xml
- .grace/graph/index.xml
- .grace/graph/main.xml
- .grace/verification/index.xml
- .grace/verification/main.xml
- .grace/changes/active/.gitkeep
- .grace/changes/archive/.gitkeep
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- .grace/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – GRACE initialisation

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, mid to max effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

- **Has review feedback?**: Check the `review_ref` field in the event log (via `spec-kitty agent tasks status --mission bun-monorepo-toolchain-01M5E4T4`) or the Activity Log below.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[If this WP was returned from review, the reviewer feedback reference appears in the Activity Log below or in the status event log.]*

---

## Objectives & Success Criteria

Initialise GRACE 4 (`.grace/`) so it describes what exists: the two code modules `M-BUN-VERSION-GUARD` (`scripts/check-bun-version.ts`, from WP01) and `M-REVIEW-GATE` (`scripts/review-gate.ts`, from WP02), plus project context (FR-010).

Done means:

1. The 9 XML files and 2 `.gitkeep` files below exist with exactly this content.
2. `bun run grace:lint` (`grace lint --path . --assertions current`) reports `Errors: 0`, `Warnings: 0`, `Governed files: 4`.
3. `grace status --path . --json` reports `readyModules: 2`, `blockedModules: 0`, `integrityErrors: 0`.
4. `AGENTS.md` is **unchanged**. Only `.grace/` files are added.

## Context & Constraints

- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/research.md`: R-08 (prototype results)
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/data-model.md`: GraceModel
- `.claude/skills/grace-init/SKILL.md` (for background; this prompt already contains the resulting files)

Hard rules:

- The `grace-init` skill also writes `AGENTS.md` from a template. **Do not do that.** The repo's `AGENTS.md` wins (AGENTS.md routing rules). Do not run the skill's AGENTS step; just write the files below.
- Do not create `C-*` change bundles. Spec Kitty owns the change lifecycle; `.grace/changes/` stays empty except `.gitkeep`.
- Do not edit `scripts/*.ts`. Their GRACE markup already exists (WP01, WP02). If `grace lint` reports a markup error in a script, stop and report it in the Activity Log; do not fix it outside your owned files.
- Model only what exists: no modules for `apps/` or `packages/` (they hold no code).
- Conventional Commits, e.g. `feat(grace): initialise grace model for the toolchain scripts`. No AI names. Never `--no-verify`.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on `feat/bun-monorepo-toolchain`; completed changes must merge back into `feat/bun-monorepo-toolchain`.
- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP04 --agent claude`.

## Before you start

```sh
bun install
ls scripts/   # must list check-bun-version.ts, check-bun-version.test.ts, review-gate.ts, review-gate.test.ts
grace --version   # 4.2.1 or later; if missing, stop and report (installing it is an owner decision)
```

## Subtasks & Detailed Guidance

### Subtask T017 – Create the directory skeleton

Create the empty files `.grace/changes/active/.gitkeep` and `.grace/changes/archive/.gitkeep`.

### Subtask T018 – Write the context files

Write the five `.grace/context/*.xml` files exactly as listed under "File contents" below.

### Subtask T019 – Write the graph and verification files

Write `.grace/graph/index.xml`, `.grace/graph/main.xml`, `.grace/verification/index.xml` and `.grace/verification/main.xml` exactly as listed below. Every module ID in `graph/main.xml` must appear in `graph/index.xml` `<Owns>`, and every `V-M-*` entry must appear in `verification/index.xml` `<Owns>`; otherwise lint fails with `projection.graph.unlisted-anchor`.

### Subtask T020 – Validate and record

```sh
bun run grace:lint
grace status --path . --with modules --json | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['summary']);[print(m['moduleId'],m['state'],m['blockers']) for m in d['modules']]"
bun test scripts/check-bun-version.test.ts scripts/review-gate.test.ts
git status --porcelain     # only .grace/ paths
git diff --exit-code AGENTS.md
```

Expected: lint 0 errors / 0 warnings; both modules `ready` with no blockers; 11 tests pass. Record the outputs in the Activity Log. If `bun run format:check` passes (WP03 merged), `bun scripts/review-gate.ts "$(mktemp -d)/j.xml"` should now print `PASS` for all six steps; record whatever it prints.

## File contents

#### .grace/context/requirements.xml
```xml
<GraceRequirements graceVersion="4.0">
  <ProjectName>Telos</ProjectName>
  <Annotation>An everything-as-code full-stack framework for next-generation software, developed as a Bun workspaces monorepo.</Annotation>
  <Keywords>bun, typescript, monorepo, workspaces, everything-as-code, full-stack framework</Keywords>
  <Goals>
    <Goal>Provide a Bun-only monorepo skeleton (apps/*, packages/*) whose checks block wrong behavior before commit and review.</Goal>
  </Goals>
  <Users>
    <User>The owner, who directs the work and makes product and architecture decisions.</User>
    <User>Coding agents (Claude Code, Codex) that implement approved Spec Kitty work packages.</User>
  </Users>
  <Constraints>
    <Constraint>Product changes go through Spec Kitty missions; Spec Kitty owns the change lifecycle, not .grace/changes.</Constraint>
    <Constraint>Bun is the only tool: no CI, no Turborepo or Nx, no extra linter or formatter.</Constraint>
    <Constraint>No fake tests, placeholder scripts, or checks that verify nothing.</Constraint>
  </Constraints>
</GraceRequirements>
```

#### .grace/context/technology.xml
```xml
<GraceTechnology graceVersion="4.0">
  <Language>TypeScript (strict, shared tsconfig.base.json, project references)</Language>
  <Runtime>Bun >=1.4.4-canary.1 (engines.bun in package.json, enforced by scripts/check-bun-version.ts)</Runtime>
  <Framework>Bun workspaces (apps/*, packages/*); no application framework yet</Framework>
  <TestingStack>bun test; bun check -b for types; bun lint and bun fmt configured in bunfig.toml</TestingStack>
  <Observability>None yet; there is no runtime service.</Observability>
  <OperationalConstraints>
    <Constraint>Add a dependency only with owner approval, pinned exactly, with supply-chain checks.</Constraint>
    <Constraint>bun run verify must pass before review, accept and merge; the pre-commit hook and Spec Kitty's review gate enforce it.</Constraint>
  </OperationalConstraints>
</GraceTechnology>
```

#### .grace/context/principles.xml
```xml
<GracePrinciples graceVersion="4.0">
  <Principle>Test-first: every behavior change starts with a failing bun test that encodes the acceptance criterion.</Principle>
  <Principle>Blocking gates: format, lint, typecheck, tests and grace lint block commits and reviews.</Principle>
  <Principle>Keep semantic anchors stable and grep-friendly.</Principle>
  <Principle>Model only what exists: no module without code, no code module without a verification entry.</Principle>
</GracePrinciples>
```

#### .grace/context/deployment.xml
```xml
<GraceDeployment graceVersion="4.0">
  <Applicability>not-applicable</Applicability>
  <Reason>Nothing is deployed yet; the repository is a toolchain skeleton with no apps. There is no CI by owner decision.</Reason>
</GraceDeployment>
```

#### .grace/context/ux-guidelines.xml
```xml
<GraceUXGuidelines graceVersion="4.0">
  <Applicability>not-applicable</Applicability>
  <Reason>No user-facing surface exists yet; apps/ is empty.</Reason>
</GraceUXGuidelines>
```

#### .grace/graph/index.xml
```xml
<GraceGraphIndex graceVersion="4.0">
  <GraphDocuments>
    <GD-MAIN>
      <Path>graph/main.xml</Path>
      <Owns>
        <M-BUN-VERSION-GUARD />
        <M-REVIEW-GATE />
      </Owns>
    </GD-MAIN>
  </GraphDocuments>
</GraceGraphIndex>
```

#### .grace/graph/main.xml
```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-MAIN>
    <M-BUN-VERSION-GUARD>
      <Summary>Refuses to run the toolchain on a Bun older than engines.bun in package.json.</Summary>
      <Path>scripts/check-bun-version.ts</Path>
    </M-BUN-VERSION-GUARD>
    <M-REVIEW-GATE>
      <Summary>Runs the whole check suite for Spec Kitty's review gate and writes one JUnit report with a test case per check.</Summary>
      <Path>scripts/review-gate.ts</Path>
    </M-REVIEW-GATE>
  </GD-MAIN>
</GraceGraphDocument>
```

#### .grace/verification/index.xml
```xml
<GraceVerificationIndex graceVersion="4.0">
  <VerificationDocuments>
    <VD-MAIN>
      <Path>verification/main.xml</Path>
      <Owns>
        <V-M-BUN-VERSION-GUARD />
        <V-M-REVIEW-GATE />
      </Owns>
    </VD-MAIN>
  </VerificationDocuments>
</GraceVerificationIndex>
```

#### .grace/verification/main.xml
```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-MAIN>
    <V-M-BUN-VERSION-GUARD>
      <TestFiles>
        <File>scripts/check-bun-version.test.ts</File>
      </TestFiles>
      <Command>bun test scripts/check-bun-version.test.ts</Command>
      <Scenario>A Bun at or above the engines.bun minimum is accepted, including later canaries such as 1.4.5-canary.1.</Scenario>
      <Scenario>A Bun below the minimum, such as 1.4.3, is rejected.</Scenario>
      <TraceAssertion>The isSupported table test passes for every row of the version-guard contract.</TraceAssertion>
    </V-M-BUN-VERSION-GUARD>
    <V-M-REVIEW-GATE>
      <TestFiles>
        <File>scripts/review-gate.test.ts</File>
      </TestFiles>
      <Command>bun test scripts/review-gate.test.ts</Command>
      <Scenario>A failing check step becomes a JUnit test case with a failure, so the review gate sees it as a new failure.</Scenario>
      <Scenario>bun test's own suites are kept in the same report under one testsuites root.</Scenario>
      <TraceAssertion>The buildReport and escapeXml unit tests pass.</TraceAssertion>
    </V-M-REVIEW-GATE>
  </VD-MAIN>
</GraceVerificationDocument>
```

## Definition of Done

- [ ] 11 files under `.grace/` with the exact contents above.
- [ ] `grace lint` 0 errors, 0 warnings; `grace status` 2 ready modules, 0 blocked.
- [ ] `AGENTS.md` and `scripts/` unchanged.

## Risks & Mitigations

- **Newer `grace` CLI rejects a field**: follow the lint message, change only `.grace/` files, and record the change.
- **`grace` not installed**: stop and report. Installing global tools is an owner decision.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Run T020 yourself. Both modules must be `ready`.
- Check that every statement in the context files is true of the repo (Bun-only, no CI, no apps yet).
- Confirm `AGENTS.md` is unchanged and no `C-*` bundle exists.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`.

- 2026-10-21T03:16:03Z – system – Prompt created.

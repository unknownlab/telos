---
id: stage-0-discovery
title: Stage 0 repository discovery report
kind: research
status: accepted
maturity: implemented
summary: What the repository, its tooling and its governance looked like when Stage 0 began, and what that means for the Stage 0 work.
related: [ADR-0011, ADR-0015]
---

# Stage 0 repository discovery report

Recorded on 2026-10-21, at commit `221b950` on `main`, before any Stage 0 change.

## Identity

- The repository, the root `package.json` (`"name": "telos"`), the Spec Kitty project slug, the GRACE project name and the Spec Kitty glossary all name the framework **Telos**.
- The owner confirmed the full name: **Telos by UnknownLab**. Telos is the framework. UnknownLab is the lab that builds it. The Stage 0 directive's phrase "UnknownLab framework" therefore means Telos. See [ADR-0015](../decisions/ADR-0015-product-naming.md).
- The charter and the glossary describe Telos as an "everything as code full-stack framework". The Stage 0 doctrine widens that to a programmable environment for the whole software lifecycle. The charter text is owner-controlled and is not edited by Stage 0 (see "Conflicts" below).

## Repository layout

| Path                        | State at discovery                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/`, `packages/`        | Empty (`.gitkeep` only). Bun workspaces are declared for both.                            |
| `scripts/`                  | `check-bun-version.ts`, `review-gate.ts` and their tests. The only code in the repo.      |
| `docs/`                     | `tooling.md` only: the owner-facing tooling guide.                                        |
| `README.md`                 | Empty.                                                                                    |
| `.grace/`                   | GRACE 4 project: 5 context files, 2 modules, 2 verification entries, no active changes.   |
| `.kittify/`                 | Spec Kitty 3.2.7 project config, charter, glossaries, archive.                            |
| `kitty-specs/`              | Two finished missions: `001-bun-monorepo-toolchain`, `002-toolchain-hardening`. Archived. |
| `.githooks/`                | `commit-msg` (Conventional Commits, no AI attribution) and `pre-commit` (full checks).    |
| `.claude/`, `.agents/` etc. | Per-machine agent surfaces, gitignored.                                                   |

## Toolchain

- Bun `1.4.4` (canary line), the only tool: package manager, test runner, `bun check` type checker, `bun lint`, `bun fmt`. No ESLint, Prettier, Turborepo or Nx.
- TypeScript: strict shared `tsconfig.base.json` (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, bundler resolution). Packages join through project references in the root `tsconfig.json`.
- `bun run verify` runs version guard, format check, lint, typecheck, tests and `grace lint`. The pre-commit hook and Spec Kitty's review gate (`scripts/review-gate.ts`, JUnit output) enforce the same suite.
- No CI, by owner decision recorded in the charter.
- No dependencies besides `@types/bun`. Effect, React, TanStack and Tailwind are not installed.

Current stable releases on the registry at discovery time (candidates, not yet approved):

| Package                  | Latest  | Notes                                                   |
| ------------------------ | ------- | ------------------------------------------------------- |
| `effect`                 | 4.0.5   | Effect 4 went stable on 2026-10-01. 3.22.x is `prev`.   |
| `@tanstack/react-start`  | 1.169.3 |                                                         |
| `@tanstack/react-router` | 1.170.x |                                                         |
| `react`, `react-dom`     | 19.3.1  |                                                         |
| `tailwindcss`            | 4.3.3   | With `@tailwindcss/vite`.                               |
| `vite`                   | 8.3.5   |                                                         |
| `shadcn` (CLI)           | 4.22.1  | Generates component source into the app; not a runtime. |
| `typescript`             | 7.0.2   | Not needed as a dependency: `bun check` type-checks.    |

## GRACE

- GRACE 4.2.1 skills and the `grace` CLI are installed. `grace status` reports a healthy project: 2 ready modules (`M-BUN-VERSION-GUARD`, `M-REVIEW-GATE`), 0 integrity errors, 0 active changes.
- Code files carry GRACE file-local markup (`START_MODULE_CONTRACT`, `START_CONTRACT: <fn>`, `START_BLOCK_*`).
- AGENTS.md rules: GRACE owns architecture knowledge (contracts, module graph, verification); every mission keeps `.grace/` and the markup in sync; `grace lint --path . --assertions current` must pass. GRACE's own change lifecycle (`grace-spec`, `grace-plan`, `.grace/changes/`) is not used.

## Spec Kitty

- Spec Kitty 3.2.7. Activated mission types: `software-dev`, `documentation`, `research`, `plan`.
- Merge gates block (`policy.merge_gates.mode: block`). The review gate runs `bun scripts/review-gate.ts`.
- Both earlier missions are `done` and archived. No open Ops (`spec-kitty invocations list`). No worktrees besides the main checkout.
- `project.path_conventions` points the workspace and tests checks at `scripts/`. A mission that adds `packages/` and `apps/` code may need these conventions widened; that file is owner-controlled.
- Known gotchas from earlier missions (meta.json `mission_number` reset at merge, status-file conflicts on multi-lane missions) are recorded in the project memory and in `docs/tooling.md`.

## Governance that shapes Stage 0

- Product changes, new dependencies, new modules and public contracts need owner approval of the mission spec and plan before implementation.
- Edits to `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml` and the charter are owner decisions.
- Model routing: implementation in WP subagents using each WP's `agent_profile` and `model`; WP review with `reviewer-renata` on Sonnet; post-merge mission review on Opus. The charter's default implementation model is Haiku-class.
- Test-first, no fake tests, blocking gates, Conventional Commits, no AI attribution in git.

## Conflicts and duplication found

| #   | Conflict                                                                                                                                             | Resolution in Stage 0                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | The directive says "UnknownLab"; the repo says "Telos".                                                                                              | Owner clarified: Telos by UnknownLab. ADR-0015.                                                                                                                                                                                                 |
| C2  | The charter says canonical terms live in the Spec Kitty glossary; the directive wants the terminology in version-controlled foundation docs.         | Foundation terminology (`docs/foundation/terminology/`) is canonical for Telos product concepts. The Spec Kitty glossary keeps tooling and process terms and points to the foundation for product terms. Owner decision on the charter wording. |
| C3  | "Charter" is both a Telos term (a Locus's purpose) and Spec Kitty's project charter.                                                                 | The terminology entry for Charter names the collision. Prose says "Locus Charter" where ambiguous and "project charter" for Spec Kitty's.                                                                                                       |
| C4  | The charter and glossary call Telos a "full-stack framework"; the doctrine says it is not merely that.                                               | The foundation docs carry the wider definition. Updating the charter and glossary wording is an owner decision, proposed with the Stage 0 mission.                                                                                              |
| C5  | `path_conventions` in `.kittify/config.yaml` point only at `scripts/`.                                                                               | The mission plan checks whether accept needs the conventions widened, and asks the owner if so.                                                                                                                                                 |
| C6  | The directive mentions CI results; the repo has no CI by owner decision.                                                                             | The docs site labels CI results as unavailable and shows local and in-browser results with their origin.                                                                                                                                        |
| C7  | Charter: Haiku-class implementers. Stage 0 work uses Effect 4 (released 2026-10-01) and TanStack Start, which are newer than small models' training. | The mission plan proposes a model per work package; any step above Haiku is an owner decision.                                                                                                                                                  |

## Consequences for Stage 0

1. Work happens on the feature branch `feat/locus-foundation`; nothing reaches `main` before the owner approves the implementation.
2. Foundation docs are written first and committed on that branch. The Spec Kitty mission references them instead of copying them.
3. One `software-dev` mission delivers the Locus package, the docs app and the playground.
4. GRACE models every new code module; `grace lint` stays clean.
5. New dependencies are listed in the mission plan for owner approval, pinned exactly.

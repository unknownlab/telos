# Post-merge notes: Toolchain Hardening (mission 2)

Recorded after the Opus mission review of mission 2 and the review of mission 1. Findings and what was done.

## Fixed after merge (direct commits on `feat/bun-monorepo-toolchain`, reviewed by Sonnet)

The owner asked for no new missions, so these fixes bypassed the normal "product change through a mission" route. Each was written test-first by a Haiku implementer in a separate git worktree, then independently reviewed (APPROVE) before landing.

| Finding | Fix | Commit subject |
|---|---|---|
| Review gate failed open for typecheck on the base branch (no `node_modules` there) | gate installs with `bun install --frozen-lockfile` when `node_modules` is missing; extra case `verify.install` only if that fails | `fix(review-gate): install dependencies when node_modules is missing` |
| Bookkeeping-only commits could add a test file that `bun test` would run | `[test] pathIgnorePatterns` in `bunfig.toml` | `fix(test): exclude kitty-specs and .kittify from bun test discovery` |
| `CLAUDECODE` made `bun check` print XML-like errors, so gate messages were useless | `cleanEnv` removes agent variables for child steps | `fix(review-gate): run checks without agent-specific output formats` |
| Docs and header drift, GRACE dependency missing | docs, test header, graph dependency, contracts, acceptance matrices, research note | `docs(review-gate): ...`, `docs(kitty-specs): ...` |

Also fixed during the mission: rename out of a code path and non-ASCII paths slipped past the hook early exit (WP02 cycle 2).

## Not fixed here (upstream or owner decision)

- Spec Kitty's merge bookkeeping resets `meta.json` `mission_number` to null; it was repaired by hand after each merge. Report upstream; check `meta.json` after every merge.
- Spec Kitty's mission-number commit runs in a temporary worktree without `node_modules`; the old hook blocked it, so the fixed hook was committed to `feat` before the merge (`103fec8`, content identical to reviewed `00df7d0`).
- Review provenance is thin: events record the reviewer as `user` with no model or profile.
- Failure-message heuristic (first line containing "error") sometimes picks a weak line (for example `Errors: 1` from `grace lint`).
- Acceptance ran with `--lenient` because the Software Dev mission expects `src/` and `tests/`; setting `project.path_conventions` in `.kittify/config.yaml` would allow strict runs (needs owner approval).
- Mission directories are now prefixed with their number (`001-`, `002-`) for sorting; machine-written records (event logs, `status.json`, analysis reports, retrospectives) still contain the old unprefixed paths on purpose.

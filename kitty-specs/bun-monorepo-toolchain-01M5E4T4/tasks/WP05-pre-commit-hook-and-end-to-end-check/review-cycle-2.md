---
affected_files: []
cycle_number: 2
mission_slug: bun-monorepo-toolchain-01M5E4T4
reproduction_command:
reviewed_at: '2026-10-21T05:13:32Z'
reviewer_agent: user
wp_id: WP05
---

**Issue 1 (docs/tooling.md line 107, partial staging)**: The doc says that if you stage only part of a file, "the rest of that file is committed too". Verified false: `bun fmt --staged` refuses ("has both staged and unstaged changes, so it was not formatted"), and the hook blocks with `pre-commit: format failed`. Nothing extra is committed. Rewrite the sentence: a partially staged file blocks the commit with `pre-commit: format failed`; fix by staging the rest (`git add <file>`) or by `git stash --keep-index`.

**Issue 2 (docs/tooling.md line 105, timing)**: "about half a second" is only true warm (0.39 s); cold runs take about 1.5 s. Say "under two seconds".

**Issue 3 (bunfig.toml)**: Spec Kitty creates an untracked `.spec-kitty/review-lock.json` on review claim. `bun run format:check` flags it, so the review gate fails during every review. Add `".spec-kitty/**"` to both `[lint]` and `[fmt]` `ignorePatterns` in `bunfig.toml`, then show `bun run verify` exit 0 with that file present. Also add `.spec-kitty/` to `.gitignore` only if it is not already tracked or intended to be committed; otherwise leave `.gitignore` alone and say why.

The contract (contracts/pre-commit-hook.md, partial-staging note) is corrected by the orchestrator on the planning branch. Do not touch kitty-specs.

**Verdict: approved on behavior, but one real gap must be closed (orchestrator decision).**

**Issue 1 (rename gap)**: `git diff --cached --name-only` reports only the destination of a rename. `git mv scripts/check-bun-version.ts kitty-specs/m/x.ts` stages only `kitty-specs/m/x.ts`, so the early exit skips all checks for a commit that deletes a code file. Change the hook's staged-path line to:

    staged=$(git -c core.quotePath=false diff --cached --name-only --no-renames)

`--no-renames` lists both sides of a rename, so the old code path is seen and the full checks run.

**Issue 2 (non-ASCII paths)**: git quotes non-ASCII names (`"kitty-specs/\303\251.md"`), so they fail the match and a bookkeeping-only commit would be blocked without `node_modules`. `-c core.quotePath=false` (same line) fixes it.

**Prove both** in a throwaway clone (core.hooksPath set only there, `node_modules` moved away, delete the clone after):
1. `git mv scripts/review-gate.ts kitty-specs/probe/review-gate.ts` then commit with a valid message: expect blocked with `pre-commit: dependencies not installed. Run: bun install`.
2. Stage `kitty-specs/probe/é.md` only: expect commit succeeds, hook silent.
3. Re-run cases 1, 3 and 4 from the WP prompt to show nothing regressed.

The contract `kitty-specs/toolchain-hardening-01M5EFAX/contracts/hook-bookkeeping.md` and the previous mission's `pre-commit-hook.md` were already updated by the orchestrator with these two rules and acceptance rows. Add one sentence about renames to the hook paragraph in `docs/tooling.md` if it fits ("a commit that moves a file out of any other directory runs the full checks"). Only `.githooks/pre-commit` and `docs/tooling.md` should change. Do not touch `kitty-specs/` in the lane.

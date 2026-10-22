# WP16 review feedback (cycle 1) — reviewer-renata

Verdict: REJECT, narrow rework. `bun run verify` is green (838 tests), the e2e suite is 106/106 on three runs and `--repeat-each=3` is stable. Most mutations are caught (Revision ids, provenance labels, stale refusal, shortcut, theme, low-contrast CSS in both themes, nav section, narrow 404 exception). The gaps below were confirmed by mutations that still passed. Change only WP16-owned e2e files.

## Required changes

1. **`apps/docs/e2e/machine-files.e2e.ts` never compares the served files with the source.** `readIndexFile()` reads `dist/client/index.json`, so both tests check the file only against itself. Forcing `status: "open"` on every index.json entry, or replacing every llms.txt summary with `x`, still passes. FR-017 requires every id, title, kind, status, maturity, summary and URL to match `apps/docs/src/generated/content.json`. Fix: compare index.json field by field (all documents, none extra, none missing) to `content.json`, and require each llms.txt document line to equal the expected `- [title](url): summary` for that document (and each document to appear exactly once). Prove with mutations: status forced to `open`, a summary replaced, a document dropped that has no inbound `related` link, a duplicated line.
2. **`apps/docs/e2e/playground.e2e.ts` has no tests for "Compute clears history" and "Reset history".** Removing the `onReset` dispatch (`revisions-scenario.tsx` ~108-111) or the `dispatchHistory({ type: "compute" })` (~140) passes with 0 failures. Add one test per behaviour: a walk-through ending in `reset-history` that leaves `[data-history-step]`/entries empty and the panel in its initial state; and a second Compute after appends that leaves the log with 0 steps. Report the mutation evidence (both mutants must now fail).
3. **The walk-through never asserts that history is unchanged after the stale refusal.** After the stale refusal, assert `[data-history-entry]` still holds exactly the entries it held before (A only, or A,B as in the walk-through) and the head is unchanged, directly (not only through a later `no-op` outcome). ~lines 279-325.

## Minor, fix in the same pass
4. `keyboard.e2e.ts` (~118-132) "every control has an accessible name": loop over scenarios a to e (B and C are skipped today).
5. `provenance.e2e.ts` (~149-162) "before any run": `origins.every(...)` passes vacuously if no panel exists. For scenario D assert the expected count of panels (or that none exist), so a missing panel cannot pass silently.
6. Optional: assert the `aria-live` region and the stale notice text on D in the walk-through.

## Accepted / decided by the reviewer
- Commit 7207645 (not-found: one site layout + Suspense, route-tree render test) is correct and minimal and acceptable in this lane; coordinator records it in the mission log.
- Chromium only: acceptable (WP and R-08).
- Static server: traversal, null byte, bad escape, double slash all return the 404 page with status 404; no directory listing; correct content types.
- Follow-ups, NOT required now: React #418 hydration mismatch on unknown documents under a section (`/principles/no-such-id`); unknown URL page title is the site title instead of "Page not found"; no `/x` to `/x/` redirect in serve-static (WP does not require it).

---
# Cycle 2 (reviewer-renata): REJECT, one remaining fix

Items 1, 2, 3 and 5 are fixed and proven by mutation (9 dist mutants on machine files, onReset/compute/stale-append source mutants, provenance non-vacuous). Item 4 is NOT fixed:

- `apps/docs/e2e/keyboard.e2e.ts` ~line 158: the accessible-name loop now covers a..e, but its assertion `.toMatch(/"[^"]+"/)` runs against the first line of `ariaSnapshot()`. For a textarea that line includes the textarea's VALUE, which is JSON full of quotes (`- textbox: "{ \"id\": \"shop:system\", ...`), so it matches with no accessible name at all. Setting `label=""` on the Fabric JSON editor in `apps/docs/src/playground/components/fabric-scenario.tsx` (unnamed textarea in A, B, C) still passes (`-g "accessible name"` reports 1 passed). Two narrower mutants (unnamed only when `panels.length === 1`; only when `panels` includes "relations") also pass.
- Fix: assert the accessible NAME itself, not the snapshot line: e.g. `await expect(locator).toHaveAccessibleName(/\S/)` per control (Playwright), or anchor on role + name such as `/^- \w+ "[^"]+"/` so `- textbox: "..."` (colon form, value) cannot match. Prove with mutations: `label=""` on the Fabric JSON editor must fail for scenarios A, B and C; an unnamed Validate button must fail; an unnamed control in D and E must fail. Revert each mutation and rebuild.

# WP13 review feedback (cycle 1) — reviewer-renata

Verdict: APPROVE in substance (613 tests green, NS-018 "Not run" works, failing reports render as failing, 9 mutants caught). The following gaps weaken INV-013 ("nothing is shown as passing without a real run") and the WP's own text, so fix them before approval. Keep every change inside this WP's owned files.

## Required changes

1. **A consistent but wrong report must not render as passing.** `readSpecReportFile` in `apps/docs/src/lib/build-data.ts` (around lines 150-165) only checks that the summary agrees with the rows. A report with a record popped renders `43 passed`; one with LOC-001 duplicated over LOC-044 renders `44 passed` with LOC-001 twice. Make the reader reject (treat as invalid, same path as a bad summary) a report with duplicate record ids, and add tests for both cases (a duplicate id; a record missing relative to the summary total is already covered by the summary check, so test the duplicate and an out-of-sequence/empty-id case). If comparing against the catalogue ids is possible without pulling the catalogue into the client bundle (e.g. in `scripts/spec-report.ts` at write time and in the Bun-side reader), prefer that, and state what you chose.
2. **An invalid report must fail the build loudly.** Today `build:site` exits 0 with a stream error logged ("spec-report.json: summary is invalid") and `/verification` becomes a client shell. The WP says a broken file fails the prerender loudly. Add a post-build check in the build path (`apps/docs/scripts/` or the `build` script chain you own; if wiring needs a file outside owned_files, stop and report instead) that `dist/client/verification/index.html` contains `data-result="spec-report"` and exits non-zero with a clear message otherwise. Add a test of the check function (present, absent, shell-only HTML) and show the failing build output with a crafted bad report.
3. **Missing test for failed/errored count checks.** Removing the `summary.failed === countOf(results, "fail")` check in `build-data.ts` still passes all tests. Add cases in `spec-report.test.ts` where `failed` disagrees with the rows and where `errored` disagrees, and confirm by mutation that removing each check fails a test.
4. **Historical panel contrast.** `ResultPanel` uses `opacity-75` for historical results, which likely fails the 4.5:1 contrast rule (NFR-004). Remove the opacity on text. Convey staleness with the dashed border, the `Historical:` label text, the icon and `data-stale`. Keep any visual dimming off text. Add or adjust the component test.

## Not required
- Optional: assert `/verification` is in `prerenderPaths` in `site.test.ts`.
- Documented acceptance: `<strong data-count>` in the summary (compare text content, not raw HTML, in e2e).

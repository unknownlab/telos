---
affected_files: []
cycle_number: 1
mission_slug: locus-foundation-01M5EWDR
reproduction_command:
reviewed_at: '2026-10-21T15:38:48Z'
reviewer_agent: claude
wp_id: WP08
---

# WP08 review feedback (cycle 1) — reviewer-renata

Verdict: APPROVE in substance (44 records match the contract, mutation pass and goldens independently confirmed). One required fix before approval, because downstream WPs depend on it.

## Required change

Restore the exported goldens. Moving them into `test/determinism.test.ts` only leaves WP15 (playground `goldenRows`, imports `revisionGoldens` from the package), WP16 (Bun/Chromium id equality) and WP17 (`goldens.ts` listed in module M-LOCUS-SPECS) with no source for them, and those WPs own no files in `packages/locus-specs`.

- Re-add `packages/locus-specs/src/goldens.ts` exporting `revisionGoldens` (the same eight values, unchanged) and re-add its export line and `START_MODULE_MAP` entry in `packages/locus-specs/src/index.ts`, with TSDoc, a `START_CONTRACT` block, and GRACE module markup like the other src files.
- Keep an independent literal copy of the values in `test/determinism.test.ts` (the contract says they are recorded in the test file) and add one assertion that the test literal `toStrictEqual` the exported `revisionGoldens`. Keep the independent `shasum`-derived values: do NOT make the test import the values it checks against itself only.
- Do not change any digest value or any catalogue record.

## Optional (non-blocking)
- Use `toStrictEqual` in the JSON round-trip integrity check in `test/specifications.test.ts`.
